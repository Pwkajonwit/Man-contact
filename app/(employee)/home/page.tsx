"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, getCountFromServer, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ArrowLeft, Phone, MapPin, User, Briefcase, Search, X, Loader2, Plus, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
}

const EmployeeHomePage = () => {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<Category[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
      // Global Search Logic
      const timer = setTimeout(() => {
        searchGlobal(searchQuery);
      }, 300); // Debounce
      return () => clearTimeout(timer);
    }
  }, [currentParentId, searchQuery]);

  const searchGlobal = async (term: string) => {
    setLoading(true);
    // Since Firestore doesn't support full-text search easily without third-party, 
    // we fetch all and filter client-side for better UX in this small-medium app
    const qAll = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const snapshot = await getDocs(qAll);
    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    
    const filtered = all.filter(c => 
      c.name.toLowerCase().includes(term.toLowerCase()) || 
      (c.phone && c.phone.includes(term))
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

  const handleBack = () => {
    setCurrentPath(prev => prev.slice(0, -1));
  };

  const handleCategoryClick = (cat: Category) => {
    setCurrentPath(prev => [...prev, cat]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7F9]">
      {/* Search & Header Combined Layout */}
      <div className="bg-gradient-to-r from-brand-green-light to-brand-green pt-6 pb-4 px-5 rounded-b-[1.5rem] shadow-md sticky top-0 z-[100] border-b border-brand-green/20">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            {currentPath.length > 0 && searchQuery === '' && (
              <button onClick={handleBack} className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-md active:scale-90 transition-transform shadow-sm">
                <ArrowLeft size={16} strokeWidth={3} />
              </button>
            )}
            <h1 className="text-white font-bold tracking-tight text-xl leading-none">
              {searchQuery !== '' ? "ผลการค้นหา" : currentPath.length > 0 ? currentPath[currentPath.length - 1].name : "รายชื่อผู้ติดต่อ"}
            </h1>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50 border border-white/20 shadow-sm">
            <User size={16} strokeWidth={2.5} />
          </div>
        </div>

        {/* Global Search Input Bar - Sharper Version */}
        <div className="bg-white shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)] px-4 py-3 rounded-2xl flex items-center gap-3 border border-brand-border/60">
           <Search size={18} className="text-brand-dark/50" strokeWidth={2.5} />
           <input 
              type="text" 
              placeholder="ค้นหารายชื่อ เบอร์โทร..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 p-0 text-base font-bold flex-1 text-brand-dark placeholder-brand-dark/40"
           />
           {searchQuery !== '' && (
             <button onClick={() => setSearchQuery('')} className="bg-brand-gray border border-brand-border p-1 rounded-md text-brand-dark/60">
               <X size={14} strokeWidth={3} />
             </button>
           )}
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("px-5 space-y-2 pb-10 transition-all", searchQuery !== '' ? "mt-6" : "mt-4")}>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#7DBE5C]" size={28} /></div>
        ) : (
          <>
            {/* Search Result view or Category Navigate view */}
            {searchQuery !== '' ? (
              <div className="bg-white rounded-xl shadow-sm border border-[#EDF2F7] overflow-hidden">
                <div className="bg-[#EDF2F7]/50 px-4 py-2 border-b border-brand-green/5">
                   <span className="text-[10px] font-black text-[#7DBE5C] tracking-wide">
                     พบ {searchResults.length} รายการ
                   </span>
                </div>
                {searchResults.length > 0 ? searchResults.map((cust, idx) => (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className={cn("p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer active:bg-slate-100", idx !== searchResults.length - 1 && "border-b border-slate-50")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#F7FAFC] flex items-center justify-center text-[#7DBE5C] font-black text-lg border border-slate-50">
                        {cust.name.substring(0, 1)}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#2D3748] text-sm">{cust.name}</h4>
                        <p className="text-[9px] text-[#A0AEC0] font-bold tracking-wide mt-0.5">{cust.phone || "ไม่มีเบอร์โทร"}</p>
                      </div>
                    </div>
                    <a href={`tel:${cust.phone}`} onClick={(e) => e.stopPropagation()} className="bg-slate-50 p-2 rounded-lg text-slate-400 active:text-[#7DBE5C]">
                       <Phone size={16} />
                    </a>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-400 font-bold text-sm">ไม่พบรายชื่อที่ตรงกับ "{searchQuery}"</div>
                )}
              </div>
            ) : (
              // Normal Tree View
              <>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="w-full bg-white shadow-sm rounded-xl p-4 flex items-center justify-between border border-brand-border hover:bg-brand-gray border-l-4 border-l-brand-green active:scale-[0.98] transition-all group"
                  >
                    <div className="text-left">
                      <h3 className="font-bold text-brand-dark text-base leading-none mb-1">{cat.name}</h3>
                      <p className="text-[10px] text-brand-dark/60 font-medium truncate max-w-[150px]">
                        {cat.subNames}
                      </p>
                    </div>
                    <div className="bg-brand-gray px-3 py-1 rounded-lg text-[10px] font-bold text-brand-green border border-brand-border">
                      {cat.totalCustomers || 0} รายชื่อ
                    </div>
                  </button>
                ))}

                {customers.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden mt-4">
                    {customers.map((cust, idx) => (
                      <div
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={cn("p-4 flex items-center justify-between hover:bg-brand-gray cursor-pointer active:bg-brand-border/30", idx !== customers.length - 1 && "border-b border-brand-border")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-lg border border-brand-green/20">
                            {cust.name.substring(0, 1)}
                          </div>
                          <div>
                            <h4 className="font-bold text-brand-dark text-sm">{cust.name}</h4>
                            <p className="text-[10px] text-brand-dark/60 font-medium tracking-tight mt-0.5">{cust.phone || "ไม่มีเบอร์ติดต่อ"}</p>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-brand-dark/60 tracking-wider bg-brand-gray border border-brand-border/50 px-2 py-1 rounded">
                           {cust.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Profile Detail - Sharp Card */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-5 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-[1.5rem] shadow-2xl p-6 relative animate-in zoom-in duration-300 border border-brand-border">
              <button onClick={() => setSelectedCustomer(null)} className="absolute top-5 right-5 p-1.5 bg-brand-gray rounded-lg text-brand-dark/40 hover:text-brand-dark transition-colors border border-brand-border shadow-sm"><X size={18} /></button>

              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green-light to-brand-green p-1 shadow-lg mb-3">
                   <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-3xl font-black text-brand-green">
                     {selectedCustomer.name.substring(0, 1)}
                   </div>
                </div>
                <h2 className="text-xl font-black text-brand-dark tracking-tight leading-none">{selectedCustomer.name}</h2>
                <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-0.5 rounded-full tracking-wide mt-3 shadow-sm">ข้อมูลในระบบยืนยันแล้ว</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex gap-3 p-3 bg-brand-gray rounded-xl border border-brand-border shadow-sm">
                   <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-green shadow-sm border border-brand-border/30"><Briefcase size={16} /></div>
                    <div>
                      <p className="text-[9px] font-bold text-brand-dark/50 tracking-wide">ตำแหน่ง / รายละเอียด</p>
                      <p className="text-xs font-bold text-brand-dark mt-0.5">{selectedCustomer.details || "ไม่ระบุข้อมูล"}</p>
                   </div>
                </div>
                <div className="flex gap-3 p-3 bg-brand-gray rounded-xl border border-brand-border shadow-sm">
                   <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-green shadow-sm border border-brand-border/30"><Phone size={16} /></div>
                    <div>
                      <p className="text-[9px] font-bold text-brand-dark/50 tracking-wide">เบอร์ติดต่อ</p>
                      <p className="text-xs font-bold text-brand-dark mt-0.5">{selectedCustomer.phone || "ไม่มีข้อมูล"}</p>
                   </div>
                </div>
                <div className="flex gap-3 p-3 bg-brand-gray rounded-xl border border-brand-border shadow-sm">
                   <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-green shadow-sm border border-brand-border/30"><MapPin size={16} /></div>
                    <div>
                      <p className="text-[9px] font-bold text-brand-dark/50 tracking-wide">สถานที่ปฏิบัติงาน</p>
                      <p className="text-xs font-medium text-brand-dark/70 italic leading-snug mt-0.5">สำนักงานใหญ่</p>
                   </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                 <button onClick={() => router.push(`/home/edit/${selectedCustomer.id}`)} className="bg-brand-gray hover:bg-[#E2E8F0] px-5 py-4 rounded-xl text-brand-dark/70 hover:text-brand-dark font-black tracking-wide text-sm text-center shadow-sm border border-brand-border active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Edit2 size={18} />
                 </button>
                 <a href={`tel:${selectedCustomer.phone}`} className="flex-1 bg-brand-green hover:bg-brand-green-light py-4 rounded-xl text-white font-black tracking-wide text-sm text-center shadow-md border border-[#5A9207] active:scale-95 transition-all flex items-center justify-center">
                    โทรออกทันที
                 </a>
              </div>
           </div>
        </div>
      )}
      {/* Floating Action Button (FAB) for Adding Customer */}
      <Link href="/home/add" className="fixed bottom-6 right-6 w-14 h-14 bg-brand-green hover:bg-brand-green-light rounded-full text-white shadow-[0_4px_14px_rgba(101,163,13,0.5)] flex items-center justify-center active:scale-90 transition-all z-50 border-2 border-white">
        <Plus size={24} strokeWidth={3} />
      </Link>
    </div>
  );
};

export default EmployeeHomePage;
