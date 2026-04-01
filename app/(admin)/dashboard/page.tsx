"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, getCountFromServer, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import CorporateCard from '@/components/ui/CorporateCard';
import { Users, Folder, Search, ChevronRight, Briefcase, Phone, MapPin, Loader2, Home, X, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  subNames?: string;
  totalCustomers?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  details: string;
  category_id: string;
  email?: string;
}

const DashboardPage = () => {
  const [currentPath, setCurrentPath] = useState<Category[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);

  const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

  const getAllChildIds = async (parentId: string): Promise<string[]> => {
    let ids = [parentId];
    const q = query(collection(db, 'categories'), where('parent_id', '==', parentId));
    const snap = await getDocs(q);
    const childIds = await Promise.all(snap.docs.map(d => getAllChildIds(d.id)));
    return ids.concat(childIds.flat());
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setLoading(true);
      const qCat = query(collection(db, 'categories'), where('parent_id', '==', currentParentId));
      
      const unsubscribeCats = onSnapshot(qCat, async (snapshot) => {
        const catList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        
        const catsWithMetadata = await Promise.all(catList.map(async (cat) => {
          const subQ = query(collection(db, 'categories'), where('parent_id', '==', cat.id));
          const subSnap = await getDocs(subQ);
          const subNames = subSnap.docs.map(d => d.data().name).slice(0, 3).join(', ');

          const allRelatedCatIds = await getAllChildIds(cat.id);
          const custQ = query(collection(db, 'customers'), where('category_id', 'in', allRelatedCatIds));
          const countSnap = await getCountFromServer(custQ);
          const total = countSnap.data().count;

          return { 
            ...cat, 
            subNames: subNames ? `${subNames}...` : 'Direct Records',
            totalCustomers: total
          };
        }));

        setCategories(catsWithMetadata);
        
        if (catList.length === 0 && currentParentId) {
          fetchCustomers(currentParentId);
        } else {
          setCustomers([]);
          setLoading(false);
        }
      });

      return () => unsubscribeCats();
    } else {
      const timer = setTimeout(() => {
        searchGlobal(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentParentId, searchQuery]);

  const searchGlobal = async (term: string) => {
    setLoading(true);
    const qAll = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const snapshot = await getDocs(qAll);
    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    
    const filtered = all.filter(c => 
      c.name.toLowerCase().includes(term.toLowerCase()) || 
      (c.phone && c.phone.includes(term)) ||
      (c.details && c.details.toLowerCase().includes(term.toLowerCase()))
    );
    
    setSearchResults(filtered);
    setLoading(false);
  };

  const fetchCustomers = async (catId: string) => {
    const qCust = query(collection(db, 'customers'), where('category_id', '==', catId));
    const snapshot = await getDocs(qCust);
    const custList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    setCustomers(custList);
    setLoading(false);
  };

  const handleCategoryClick = (cat: Category) => {
    setCurrentPath(prev => [...prev, cat]);
  };

  const navigateToLevel = (index: number) => {
    setCurrentPath(prev => prev.slice(0, index + 1));
  };

  const goHome = () => {
    setCurrentPath([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-brand-border pb-4">
        <div className="flex flex-col w-full md:w-auto">
          <h1 className="text-2xl font-black text-brand-dark tracking-tighter">ระบบสารบบองค์กร</h1>
          <p className="text-[10px] text-brand-dark/50 font-black tracking-widest mt-1">ดูแผนกและรายชื่อผู้ติดต่อระดับองค์กร</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="ค้นหารายชื่อจากส่วนกลาง..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white rounded-lg text-sm font-bold text-brand-dark border border-brand-border focus:ring-2 focus:ring-brand-green/20 outline-none transition-all placeholder-brand-dark/30 shadow-sm"
          />
          {searchQuery !== '' && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-gray p-1 rounded text-brand-dark/40 hover:text-brand-dark">
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      {searchQuery === '' && (
        <div className="flex items-center gap-2 text-sm font-bold overflow-x-auto pb-2 scrollbar-none">
          <button 
            onClick={goHome}
            className={cn(
               "flex items-center gap-2 p-2 rounded-lg transition-colors border",
               currentPath.length === 0 
                  ? "bg-brand-green/10 text-brand-green border-brand-green/20 shadow-sm" 
                  : "bg-white text-brand-dark/60 border-brand-border hover:bg-brand-gray"
            )}
          >
            <Home size={16} strokeWidth={2.5} />
            <span className="text-[10px] uppercase tracking-widest">หน้าหลัก</span>
          </button>
          
          {currentPath.map((path, index) => (
            <React.Fragment key={path.id}>
              <ChevronRight size={14} className="text-brand-border shrink-0" strokeWidth={3} />
              <button 
                onClick={() => navigateToLevel(index)}
                className={cn(
                  "px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors border shadow-sm",
                  index === currentPath.length - 1
                    ? "bg-brand-green text-white border-brand-green" 
                    : "bg-white text-brand-dark hover:bg-brand-gray border-brand-border"
                )}
              >
                {path.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <Loader2 className="animate-spin text-brand-green mb-4" size={40} />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {searchQuery !== '' ? (
            /* Search Results View */
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-brand-green/10 text-brand-green text-[10px] font-black px-3 py-1 rounded-md tracking-widest border border-brand-green/20">
                  พบ {searchResults.length} รายการ
                </span>
                <span className="text-xs font-bold text-brand-dark/50">สำหรับ "{searchQuery}"</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map((cust) => (
                  <ContactCard key={cust.id} customer={cust} />
                ))}
              </div>
              
              {searchResults.length === 0 && (
                <div className="text-center py-20 text-brand-dark/30">
                  <Search size={48} strokeWidth={1.5} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold">ไม่พบรายชื่อที่ตรงกับการค้นหาของคุณ</p>
                </div>
              )}
            </div>
          ) : (
            /* Normal Directory Drill-down View */
            <>
              {/* Categories Grid */}
              {categories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat)}
                      className="group bg-white rounded-xl p-5 border border-brand-border shadow-sm hover:shadow-md hover:border-brand-green/50 text-left flex flex-col justify-between h-32 transition-all active:scale-[0.98] border-l-4 border-l-brand-green"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="bg-brand-gray p-2.5 rounded-lg border border-brand-border text-brand-green group-hover:bg-brand-green group-hover:text-white transition-colors shadow-sm">
                           <Folder size={18} strokeWidth={2.5} />
                        </div>
                        <span className="bg-brand-gray px-2 py-0.5 rounded text-[9px] font-bold text-brand-dark/50 border border-brand-border tracking-widest">
                          {cat.totalCustomers || 0} รายการ
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-brand-dark text-lg leading-tight truncate">{cat.name}</h3>
                        <p className="text-[10px] text-brand-dark/50 font-medium truncate mt-1 tracking-wide">
                          {cat.subNames}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Customers Grid (Leaf Nodes) */}
              {customers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4 border-b border-brand-border pb-2">
                    <span className="text-xs font-black tracking-widest text-brand-dark/60">รายชื่อผู้ติดต่อ</span>
                    <span className="bg-brand-gray text-brand-dark/60 text-[9px] font-black px-2 py-0.5 rounded border border-brand-border tracking-wider">{customers.length}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {customers.map((cust) => (
                      <ContactCard key={cust.id} customer={cust} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {categories.length === 0 && customers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-brand-dark/30 bg-white rounded-2xl border border-brand-border border-dashed">
                  <Folder size={48} strokeWidth={1} className="mb-4 text-brand-border" />
                  <p className="font-bold text-sm">ยังไม่มีข้อมูลในหมวดหมู่นี้</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Sub-component for displaying a contact card in the PC grid
const ContactCard = ({ customer }: { customer: Customer }) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-brand-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Decorative background circle */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-green/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-out"></div>
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green font-black text-xl shrink-0 shadow-sm">
          {customer.name.substring(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-brand-dark text-base truncate">{customer.name}</h4>
          <p className="text-[10px] text-brand-dark/50 font-bold tracking-widest mt-0.5 truncate border border-brand-border bg-brand-gray inline-block px-1.5 rounded">
            {customer.details || 'พนักงานทั่วไป'}
          </p>
        </div>
      </div>
      
      <div className="mt-5 space-y-2.5 relative z-10">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-6 h-6 rounded-md bg-brand-gray flex items-center justify-center text-brand-dark/40 border border-brand-border">
             <Phone size={12} strokeWidth={2.5} />
          </div>
          <span className="font-medium text-brand-dark truncate">{customer.phone || 'ไม่มีเบอร์โทร'}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-6 h-6 rounded-md bg-brand-gray flex items-center justify-center text-brand-dark/40 border border-brand-border">
             <MapPin size={12} strokeWidth={2.5} />
          </div>
          <span className="font-medium text-brand-dark/60 truncate italic text-xs">สำนักงานใหญ่</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
