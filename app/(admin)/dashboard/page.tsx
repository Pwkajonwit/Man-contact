"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, getCountFromServer, orderBy } from 'firebase/firestore';
import {
  Folder,
  Search,
  ChevronRight,
  Phone,
  MapPin,
  Loader2,
  Home,
  X,
  User,
  ExternalLink,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { formatPhoneDisplay, normalizePhone, type CustomerRecord } from '@/lib/customer';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  subNames?: string;
  totalCustomers?: number;
}

const DashboardPage = () => {
  const [currentPath, setCurrentPath] = useState<Category[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerRecord[]>([]);

  const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

  const getAllChildIds = async (parentId: string): Promise<string[]> => {
    let ids = [parentId];
    const categoryQuery = query(collection(db, 'categories'), where('parent_id', '==', parentId));
    const snapshot = await getDocs(categoryQuery);
    const childIds = await Promise.all(snapshot.docs.map((docSnapshot) => getAllChildIds(docSnapshot.id)));
    return ids.concat(childIds.flat());
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setLoading(true);
      const categoryQuery = query(collection(db, 'categories'), where('parent_id', '==', currentParentId));

      const unsubscribeCats = onSnapshot(categoryQuery, async (snapshot) => {
        const categoryList = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Category));

        const categoriesWithMetadata = await Promise.all(
          categoryList.map(async (category) => {
            const subQuery = query(collection(db, 'categories'), where('parent_id', '==', category.id));
            const subSnapshot = await getDocs(subQuery);
            const subNames = subSnapshot.docs.map((docSnapshot) => docSnapshot.data().name).slice(0, 3).join(', ');

            const relatedCategoryIds = await getAllChildIds(category.id);
            const customerQuery = query(collection(db, 'customers'), where('category_id', 'in', relatedCategoryIds));
            const countSnapshot = await getCountFromServer(customerQuery);

            return {
              ...category,
              subNames: subNames ? `${subNames}...` : 'Direct Records',
              totalCustomers: countSnapshot.data().count,
            };
          })
        );

        setCategories(categoriesWithMetadata);

        if (categoryList.length === 0 && currentParentId) {
          fetchCustomers(currentParentId);
        } else {
          setCustomers([]);
          setLoading(false);
        }
      });

      return () => unsubscribeCats();
    }

    const timer = setTimeout(() => {
      searchGlobal(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentParentId, searchQuery]);

  const searchGlobal = async (term: string) => {
    setLoading(true);
    const customerQuery = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const snapshot = await getDocs(customerQuery);
    const allCustomers = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as CustomerRecord));
    const normalizedTerm = term.toLowerCase();
    const normalizedPhoneTerm = normalizePhone(term);

    const filtered = allCustomers.filter(
      (customer) => {
        const matchesPhone =
          normalizedPhoneTerm.length > 0 &&
          (normalizePhone(customer.phone).includes(normalizedPhoneTerm) ||
            normalizePhone(customer.backup_phone).includes(normalizedPhoneTerm));

        return (
        customer.name.toLowerCase().includes(normalizedTerm) ||
        customer.contact_name.toLowerCase().includes(normalizedTerm) ||
        matchesPhone ||
        customer.map_location.toLowerCase().includes(normalizedTerm) ||
        customer.map_link.toLowerCase().includes(normalizedTerm) ||
        customer.details.toLowerCase().includes(normalizedTerm)
        );
      }
    );

    setSearchResults(filtered);
    setLoading(false);
  };

  const fetchCustomers = async (categoryId: string) => {
    const customerQuery = query(collection(db, 'customers'), where('category_id', '==', categoryId));
    const snapshot = await getDocs(customerQuery);
    const customerList = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as CustomerRecord));
    setCustomers(customerList);
    setLoading(false);
  };

  const handleCategoryClick = (category: Category) => {
    setCurrentPath((previous) => [...previous, category]);
  };

  const navigateToLevel = (index: number) => {
    setCurrentPath((previous) => previous.slice(0, index + 1));
  };

  const goHome = () => {
    setCurrentPath([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-brand-border pb-4">
        <div className="flex flex-col w-full md:w-auto">
          <h1 className="text-2xl font-black text-brand-dark tracking-tighter">ระบบสารบบองค์กร</h1>
          <p className="text-[10px] text-brand-dark/50 font-black tracking-widest mt-1">
            ดูแผนกและรายชื่อผู้ติดต่อระดับองค์กร
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, ผู้ติดต่อ, เบอร์, แผนที่..."
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

      {searchQuery === '' && (
        <div className="flex items-center gap-2 text-sm font-bold overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={goHome}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg transition-colors border',
              currentPath.length === 0
                ? 'bg-brand-green/10 text-brand-green border-brand-green/20 shadow-sm'
                : 'bg-white text-brand-dark/60 border-brand-border hover:bg-brand-gray'
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
                  'px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors border shadow-sm',
                  index === currentPath.length - 1
                    ? 'bg-brand-green text-white border-brand-green'
                    : 'bg-white text-brand-dark hover:bg-brand-gray border-brand-border'
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
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-brand-green/10 text-brand-green text-[10px] font-black px-3 py-1 rounded-md tracking-widest border border-brand-green/20">
                  พบ {searchResults.length} รายการ
                </span>
                <span className="text-xs font-bold text-brand-dark/50">สำหรับ "{searchQuery}"</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map((customer) => (
                  <ContactCard key={customer.id} customer={customer} />
                ))}
              </div>

              {searchResults.length === 0 && (
                <div className="text-center py-20 text-brand-dark/30">
                  <Search size={48} strokeWidth={1.5} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold">ไม่พบรายชื่อที่ตรงกับการค้นหา</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {categories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category)}
                      className="group bg-white rounded-xl p-5 border border-brand-border shadow-sm hover:shadow-md hover:border-brand-green/50 text-left flex flex-col justify-between h-32 transition-all active:scale-[0.98] border-l-4 border-l-brand-green"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="bg-brand-gray p-2.5 rounded-lg border border-brand-border text-brand-green group-hover:bg-brand-green group-hover:text-white transition-colors shadow-sm">
                          <Folder size={18} strokeWidth={2.5} />
                        </div>
                        <span className="bg-brand-gray px-2 py-0.5 rounded text-[9px] font-bold text-brand-dark/50 border border-brand-border tracking-widest">
                          {category.totalCustomers || 0} รายการ
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-brand-dark text-lg leading-tight truncate">{category.name}</h3>
                        <p className="text-[10px] text-brand-dark/50 font-medium truncate mt-1 tracking-wide">{category.subNames}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {customers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4 border-b border-brand-border pb-2">
                    <span className="text-xs font-black tracking-widest text-brand-dark/60">รายชื่อผู้ติดต่อ</span>
                    <span className="bg-brand-gray text-brand-dark/60 text-[9px] font-black px-2 py-0.5 rounded border border-brand-border tracking-wider">
                      {customers.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {customers.map((customer) => (
                      <ContactCard key={customer.id} customer={customer} />
                    ))}
                  </div>
                </div>
              )}

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

const ContactCard = ({ customer }: { customer: CustomerRecord }) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-brand-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-green/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-out"></div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green font-black text-xl shrink-0 shadow-sm">
          {customer.name.substring(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-brand-dark text-base truncate">{customer.name}</h4>
          <p className="text-[10px] text-brand-dark/50 font-bold tracking-widest mt-1 truncate">
            {customer.contact_name || 'ไม่มีชื่อผู้ติดต่อ'}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5 relative z-10">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-6 h-6 rounded-md bg-brand-gray flex items-center justify-center text-brand-dark/40 border border-brand-border">
            <Phone size={12} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-brand-dark truncate">
              {customer.phone ? formatPhoneDisplay(customer.phone) : 'ไม่มีเบอร์หลัก'}
            </p>
            <p className="text-[11px] text-brand-dark/50 truncate">
              {customer.backup_phone ? formatPhoneDisplay(customer.backup_phone) : 'ไม่มีเบอร์สำรอง'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <div className="w-6 h-6 rounded-md bg-brand-gray flex items-center justify-center text-brand-dark/40 border border-brand-border mt-0.5">
            <MapPin size={12} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-brand-dark/70 truncate">{customer.map_location || 'ไม่มีข้อมูลแผนที่'}</p>
            {customer.map_link && (
              <a
                href={customer.map_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-brand-green font-bold hover:underline mt-1"
              >
                <ExternalLink size={10} />
                เปิดแผนที่
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
