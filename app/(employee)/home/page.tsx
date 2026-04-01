"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, getCountFromServer, orderBy } from 'firebase/firestore';
import { ArrowLeft, Phone, MapPin, User, Search, X, Loader2, Plus, Edit2, ExternalLink, Briefcase, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

const getPrimaryPhone = (customer: CustomerRecord) => customer.phone || customer.backup_phone;

const getPrimaryPhoneDisplay = (customer: CustomerRecord) => {
  const phone = getPrimaryPhone(customer);
  return phone ? formatPhoneDisplay(phone) : '';
};

const getSummaryDetail = (customer: CustomerRecord) => customer.details || customer.map_location || 'ไม่มีรายละเอียด';

const buildCustomerShareText = (customer: CustomerRecord) => {
  return [
    `ชื่อลูกค้า: ${customer.name || '-'}`,
    `ชื่อผู้ติดต่อ: ${customer.contact_name || '-'}`,
    `เบอร์หลัก: ${customer.phone ? formatPhoneDisplay(customer.phone) : '-'}`,
    `เบอร์สำรอง: ${customer.backup_phone ? formatPhoneDisplay(customer.backup_phone) : '-'}`,
    `แผนที่ / สถานที่: ${customer.map_location || '-'}`,
    `ลิ้งแผนที่: ${customer.map_link || '-'}`,
    `รายละเอียดและบันทึก: ${customer.details || '-'}`,
  ].join('\n');
};

const EmployeeHomePage = () => {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<Category[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerRecord[]>([]);
  const [shareStatus, setShareStatus] = useState('');

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

  const handleBack = () => {
    setCurrentPath((previous) => previous.slice(0, -1));
  };

  const handleCategoryClick = (category: Category) => {
    setCurrentPath((previous) => [...previous, category]);
  };

  useEffect(() => {
    setShareStatus('');
  }, [selectedCustomer]);

  const handleShare = async (customer: CustomerRecord) => {
    const shareText = buildCustomerShareText(customer);

    try {
      if (navigator.share) {
        await navigator.share({
          title: customer.name,
          text: shareText,
        });
        setShareStatus('แชร์ข้อมูลเรียบร้อยแล้ว');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareStatus('คัดลอกข้อมูลสำหรับแชร์แล้ว');
        return;
      }

      setShareStatus('อุปกรณ์นี้ยังไม่รองรับการแชร์');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      console.error('Share error:', error);
      setShareStatus('แชร์ข้อมูลไม่สำเร็จ');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7F9]">
      <div className="bg-gradient-to-r from-brand-green-light to-brand-green pt-6 pb-4 px-5 rounded-b-[1.5rem] shadow-md sticky top-0 z-[100] border-b border-brand-green/20">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            {currentPath.length > 0 && searchQuery === '' && (
              <button onClick={handleBack} className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-md active:scale-90 transition-transform shadow-sm">
                <ArrowLeft size={16} strokeWidth={3} />
              </button>
            )}
            <h1 className="text-white font-bold tracking-tight text-xl leading-none">
              {searchQuery !== ''
                ? 'ผลการค้นหา'
                : currentPath.length > 0
                  ? currentPath[currentPath.length - 1].name
                  : 'รายชื่อผู้ติดต่อ'}
            </h1>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50 border border-white/20 shadow-sm">
            <User size={16} strokeWidth={2.5} />
          </div>
        </div>

        <div className="bg-white shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)] px-4 py-3 rounded-2xl flex items-center gap-3 border border-brand-border/60">
          <Search size={18} className="text-brand-dark/50" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, ผู้ติดต่อ, เบอร์, แผนที่..."
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

      <div className={cn('px-5 space-y-2 pb-10 transition-all', searchQuery !== '' ? 'mt-6' : 'mt-4')}>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#7DBE5C]" size={28} />
          </div>
        ) : (
          <>
            {searchQuery !== '' ? (
              <div className="bg-white rounded-xl shadow-sm border border-[#EDF2F7] overflow-hidden">
                <div className="bg-[#EDF2F7]/50 px-4 py-2 border-b border-brand-green/5">
                  <span className="text-[10px] font-black text-[#7DBE5C] tracking-wide">พบ {searchResults.length} รายการ</span>
                </div>

                {searchResults.length > 0 ? (
                  searchResults.map((customer, index) => {
                    const primaryPhone = getPrimaryPhone(customer);
                    const canCall = Boolean(primaryPhone);
                    const canOpenMap = Boolean(customer.map_link);

                    return (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={cn(
                          'p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer active:bg-slate-100',
                          index !== searchResults.length - 1 && 'border-b border-slate-50'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#F7FAFC] flex items-center justify-center text-[#7DBE5C] font-black text-lg border border-slate-50">
                            {customer.name.substring(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-[#2D3748] text-sm truncate">{customer.name}</h4>
                            <p className="text-[10px] text-[#718096] font-bold tracking-wide mt-0.5 truncate">
                              {getPrimaryPhoneDisplay(customer) || 'ไม่มีข้อมูลเบอร์โทร'}
                            </p>
                            <p className="text-[9px] text-[#A0AEC0] font-medium mt-0.5 truncate">
                              {getSummaryDetail(customer)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(customer);
                            }}
                            className="bg-slate-50 p-2 rounded-lg text-slate-400 active:text-[#7DBE5C] border border-slate-100"
                            aria-label="แชร์"
                          >
                            <Share2 size={16} />
                          </button>
                          {canOpenMap && (
                            <a
                              href={customer.map_link}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-50 p-2 rounded-lg text-slate-400 active:text-[#7DBE5C] border border-slate-100"
                              aria-label="เปิดแผนที่"
                            >
                              <MapPin size={16} />
                            </a>
                          )}
                          {canCall && (
                            <a
                              href={`tel:${primaryPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-50 p-2 rounded-lg text-slate-400 active:text-[#7DBE5C] border border-slate-100"
                              aria-label="โทร"
                            >
                              <Phone size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center text-slate-400 font-bold text-sm">ไม่พบรายชื่อที่ตรงกับ "{searchQuery}"</div>
                )}
              </div>
            ) : (
              <>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="w-full bg-white shadow-sm rounded-xl p-4 flex items-center justify-between border border-brand-border hover:bg-brand-gray border-l-4 border-l-brand-green active:scale-[0.98] transition-all group"
                  >
                    <div className="text-left min-w-0">
                      <h3 className="font-bold text-brand-dark text-base leading-none mb-1 truncate">{category.name}</h3>
                      <p className="text-[10px] text-brand-dark/60 font-medium truncate max-w-[180px]">{category.subNames}</p>
                    </div>
                    <div className="bg-brand-gray px-3 py-1 rounded-lg text-[10px] font-bold text-brand-green border border-brand-border">
                      {category.totalCustomers || 0} รายชื่อ
                    </div>
                  </button>
                ))}

                {customers.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden mt-4">
                    {customers.map((customer, index) => (
                      (() => {
                        const primaryPhone = getPrimaryPhone(customer);
                        const canCall = Boolean(primaryPhone);
                        const canOpenMap = Boolean(customer.map_link);

                        return (
                          <div
                            key={customer.id}
                            onClick={() => setSelectedCustomer(customer)}
                            className={cn(
                              'p-4 flex items-center justify-between gap-3 hover:bg-brand-gray cursor-pointer active:bg-brand-border/30',
                              index !== customers.length - 1 && 'border-b border-brand-border'
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-lg border border-brand-green/20">
                                {customer.name.substring(0, 1)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-brand-dark text-sm truncate">{customer.name}</h4>
                                <p className="text-[10px] text-brand-dark/60 font-bold tracking-tight mt-0.5 truncate">
                                  {getPrimaryPhoneDisplay(customer) || 'ไม่มีข้อมูลเบอร์โทร'}
                                </p>
                                <p className="text-[9px] text-brand-dark/45 mt-0.5 truncate">
                                  {getSummaryDetail(customer)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(customer);
                                }}
                                className="bg-brand-gray hover:bg-[#E2E8F0] p-2 rounded-lg text-brand-dark/50 hover:text-brand-green border border-brand-border/50 transition-colors"
                                aria-label="แชร์"
                              >
                                <Share2 size={15} />
                              </button>
                              {canOpenMap && (
                                <a
                                  href={customer.map_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-brand-gray hover:bg-[#E2E8F0] p-2 rounded-lg text-brand-dark/50 hover:text-brand-green border border-brand-border/50 transition-colors"
                                  aria-label="เปิดแผนที่"
                                >
                                  <MapPin size={15} />
                                </a>
                              )}
                              {canCall && (
                                <a
                                  href={`tel:${primaryPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-brand-gray hover:bg-[#E2E8F0] p-2 rounded-lg text-brand-dark/50 hover:text-brand-green border border-brand-border/50 transition-colors"
                                  aria-label="โทร"
                                >
                                  <Phone size={15} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-5 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[1.5rem] shadow-2xl p-6 relative animate-in zoom-in duration-300 border border-brand-border">
            <button
              onClick={() => router.push(`/home/edit/${selectedCustomer.id}`)}
              className="absolute top-5 left-5 p-1.5 bg-brand-gray rounded-lg text-brand-dark/40 hover:text-brand-dark transition-colors border border-brand-border shadow-sm"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 p-1.5 bg-brand-gray rounded-lg text-brand-dark/40 hover:text-brand-dark transition-colors border border-brand-border shadow-sm"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green-light to-brand-green p-1 shadow-lg mb-3">
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-3xl font-black text-brand-green">
                  {selectedCustomer.name.substring(0, 1)}
                </div>
              </div>
              <h2 className="text-xl font-black text-brand-dark tracking-tight leading-none text-center">{selectedCustomer.name}</h2>
              <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-0.5 rounded-full tracking-wide mt-3 shadow-sm">
                ข้อมูลในระบบยืนยันแล้ว
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-3 p-3 bg-brand-gray rounded-xl border border-brand-border shadow-sm">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-green shadow-sm border border-brand-border/30">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-brand-dark/50 tracking-wide">ชื่อผู้ติดต่อ</p>
                  <p className="text-xs font-bold text-brand-dark mt-0.5">{selectedCustomer.contact_name || 'ไม่ระบุข้อมูล'}</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-brand-gray rounded-xl border border-brand-border shadow-sm">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-green shadow-sm border border-brand-border/30">
                  <Briefcase size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-brand-dark/50 tracking-wide">รายละเอียด / หมายเหตุ</p>
                  <p className="text-xs font-bold text-brand-dark mt-0.5">{selectedCustomer.details || 'ไม่ระบุข้อมูล'}</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-brand-gray rounded-xl border border-brand-border shadow-sm">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-green shadow-sm border border-brand-border/30">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-brand-dark/50 tracking-wide">เบอร์โทร</p>
                  <p className="text-xs font-bold text-brand-dark mt-0.5">
                    {selectedCustomer.phone ? formatPhoneDisplay(selectedCustomer.phone) : 'ไม่มีเบอร์หลัก'}
                  </p>
                  <p className="text-[11px] text-brand-dark/60 mt-1">
                    เบอร์สำรอง: {selectedCustomer.backup_phone ? formatPhoneDisplay(selectedCustomer.backup_phone) : 'ไม่มีข้อมูล'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-brand-gray rounded-xl border border-brand-border shadow-sm">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-green shadow-sm border border-brand-border/30">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-brand-dark/50 tracking-wide">แผนที่ / สถานที่</p>
                  <p className="text-xs font-medium text-brand-dark/70 leading-snug mt-0.5">
                    {selectedCustomer.map_location || 'ไม่มีข้อมูลแผนที่'}
                  </p>
                  {selectedCustomer.map_link && (
                    <a
                      href={selectedCustomer.map_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-brand-green font-bold mt-2 hover:underline"
                    >
                      <ExternalLink size={10} />
                      เปิดลิ้งแผนที่
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => handleShare(selectedCustomer)}
                className="bg-white hover:bg-brand-gray px-4 py-4 rounded-xl text-brand-dark/70 hover:text-brand-dark font-black tracking-wide text-sm text-center shadow-sm border border-brand-border active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={16} />
                แชร์
              </button>

              {getPrimaryPhone(selectedCustomer) ? (
                <a
                  href={`tel:${getPrimaryPhone(selectedCustomer)}`}
                  className="flex-1 bg-brand-green hover:bg-brand-green-light py-4 rounded-xl text-white font-black tracking-wide text-sm text-center shadow-md border border-[#5A9207] active:scale-95 transition-all flex items-center justify-center"
                >
                  โทรออกทันที
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 bg-brand-gray py-4 rounded-xl text-brand-dark/40 font-black tracking-wide text-sm text-center border border-brand-border"
                >
                  ไม่มีเบอร์โทร
                </button>
              )}
            </div>

            {shareStatus && (
              <p className="mt-3 text-center text-[11px] font-bold text-brand-green tracking-wide">
                {shareStatus}
              </p>
            )}

            {selectedCustomer.map_link && (
              <a
                href={selectedCustomer.map_link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 bg-white py-4 rounded-xl text-brand-green font-black tracking-wide text-sm text-center shadow-sm border border-brand-green/30 active:scale-95 transition-all"
              >
                <ExternalLink size={16} />
                เปิดแผนที่
              </a>
            )}
          </div>
        </div>
      )}

      <Link
        href="/home/add"
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-green hover:bg-brand-green-light rounded-full text-white shadow-[0_4px_14px_rgba(101,163,13,0.5)] flex items-center justify-center active:scale-90 transition-all z-50 border-2 border-white"
      >
        <Plus size={24} strokeWidth={3} />
      </Link>
    </div>
  );
};

export default EmployeeHomePage;
