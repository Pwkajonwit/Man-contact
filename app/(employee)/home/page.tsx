"use client";

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  ArrowLeft,
  Briefcase,
  Edit2,
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Search,
  Share2,
  User,
  X,
} from 'lucide-react';
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

const buildCustomerShareText = (customer: CustomerRecord) =>
  [
    `ชื่อลูกค้า: ${customer.name || '-'}`,
    `ชื่อผู้ติดต่อ: ${customer.contact_name || '-'}`,
    `เบอร์หลัก: ${customer.phone ? formatPhoneDisplay(customer.phone) : '-'}`,
    `เบอร์สำรอง: ${customer.backup_phone ? formatPhoneDisplay(customer.backup_phone) : '-'}`,
    `แผนที่ / สถานที่: ${customer.map_location || '-'}`,
    `ลิงก์แผนที่: ${customer.map_link || '-'}`,
    `รายละเอียดและบันทึก: ${customer.details || '-'}`,
  ].join('\n');

const EmployeeHomePage = () => {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerRecord[]>([]);
  const [shareStatus, setShareStatus] = useState('');

  const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

  useEffect(() => {
    let loadedCategories = false;
    let loadedCustomers = false;

    const stopLoadingIfReady = () => {
      if (loadedCategories && loadedCustomers) {
        setLoading(false);
      }
    };

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const nextCategories = snapshot.docs.map(
        (docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Category)
      );
      setAllCategories(nextCategories);
      loadedCategories = true;
      stopLoadingIfReady();
    });

    const unsubscribeCustomers = onSnapshot(
      query(collection(db, 'customers'), orderBy('name', 'asc')),
      (snapshot) => {
        const nextCustomers = snapshot.docs.map(
          (docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as CustomerRecord)
        );
        setAllCustomers(nextCustomers);
        loadedCustomers = true;
        stopLoadingIfReady();
      }
    );

    return () => {
      unsubscribeCategories();
      unsubscribeCustomers();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (searchQuery.trim() !== '') {
      const normalizedTerm = searchQuery.trim().toLowerCase();
      const normalizedPhoneTerm = normalizePhone(searchQuery);
      const filtered = allCustomers.filter((customer) => {
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
      });

      setSearchResults(filtered);
      setCategories([]);
      setCustomers([]);
      return;
    }

    const childCategories = allCategories.filter((category) => category.parent_id === currentParentId);

    const getDescendantIds = (parentId: string): string[] => {
      const directChildren = allCategories.filter((category) => category.parent_id === parentId);
      return [parentId, ...directChildren.flatMap((childCategory) => getDescendantIds(childCategory.id))];
    };

    const categoriesWithMetadata = childCategories.map((category) => {
      const subCategories = allCategories.filter((item) => item.parent_id === category.id);
      const relatedCategoryIds = getDescendantIds(category.id);
      const totalCustomers = allCustomers.filter((customer) =>
        relatedCategoryIds.includes(customer.category_id)
      ).length;

      return {
        ...category,
        subNames:
          subCategories.length > 0
            ? `${subCategories.slice(0, 3).map((item) => item.name).join(', ')}${subCategories.length > 3 ? '...' : ''}`
            : 'Direct Records',
        totalCustomers,
      };
    });

    setCategories(categoriesWithMetadata);
    setSearchResults([]);

    if (categoriesWithMetadata.length === 0 && currentParentId) {
      setCustomers(allCustomers.filter((customer) => customer.category_id === currentParentId));
    } else {
      setCustomers([]);
    }
  }, [allCategories, allCustomers, currentParentId, loading, searchQuery]);

  useEffect(() => {
    setShareStatus('');
  }, [selectedCustomer]);

  const handleBack = () => {
    setCurrentPath((previous) => previous.slice(0, -1));
  };

  const handleCategoryClick = (category: Category) => {
    setCurrentPath((previous) => [...previous, category]);
  };

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
    <div className="flex min-h-screen flex-col bg-[#F5F7F9]">
      <div className="sticky top-0 z-[100] rounded-b-[1.5rem] border-b border-[#a1d969] bg-gradient-to-r from-[#a1d969] via-[#aee970] to-[#7dbe5c] px-5 pb-4 pt-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            {currentPath.length > 0 && searchQuery === '' && (
              <button
                onClick={handleBack}
                className="rounded-lg border border-white/40 bg-white/45 p-1.5 text-[#476236] backdrop-blur-md transition-transform active:scale-90"
              >
                <ArrowLeft size={16} strokeWidth={3} />
              </button>
            )}
            <h1 className="text-xl font-bold leading-none tracking-tight text-[#29411E]">
              {searchQuery !== ''
                ? 'ผลการค้นหา'
                : currentPath.length > 0
                  ? currentPath[currentPath.length - 1].name
                  : 'รายชื่อผู้ติดต่อ'}
            </h1>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/35 bg-white/35 text-[#5A7750] backdrop-blur-md">
            <User size={16} strokeWidth={2.5} />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/80 px-4 py-3 shadow-[0_4px_18px_-10px_rgba(0,0,0,0.18)] backdrop-blur-md">
          <Search size={18} className="text-brand-dark/45" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ ผู้ติดต่อ เบอร์ หรือแผนที่"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-none bg-transparent p-0 text-base font-semibold text-brand-dark placeholder:text-brand-dark/40 focus:ring-0"
          />
          {searchQuery !== '' && (
            <button
              onClick={() => setSearchQuery('')}
              className="rounded-md border border-brand-border bg-brand-gray p-1 text-brand-dark/60"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      <div className={cn('space-y-2 px-5 pb-10 transition-all', searchQuery !== '' ? 'mt-6' : 'mt-4')}>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#7DBE5C]" size={28} />
          </div>
        ) : (
          <>
            {searchQuery !== '' ? (
              <div className="overflow-hidden rounded-xl border border-[#EDF2F7] bg-white shadow-sm">
                <div className="border-b border-brand-green/5 bg-[#EDF2F7]/50 px-4 py-2">
                  <span className="text-[10px] font-black tracking-wide text-[#7DBE5C]">
                    พบ {searchResults.length} รายการ
                  </span>
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
                          'flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100',
                          index !== searchResults.length - 1 && 'border-b border-slate-50'
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-50 bg-[#F7FAFC] text-lg font-black text-[#7DBE5C]">
                            {customer.name.substring(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-bold text-[#2D3748]">{customer.name}</h4>
                            <p className="mt-0.5 truncate text-[10px] font-bold tracking-wide text-[#718096]">
                              {getPrimaryPhoneDisplay(customer) || 'ไม่มีข้อมูลเบอร์โทร'}
                            </p>
                            <p className="mt-0.5 truncate text-[9px] font-medium text-[#A0AEC0]">
                              {getSummaryDetail(customer)}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(customer);
                            }}
                            className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-slate-400 active:text-[#7DBE5C]"
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
                              className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-slate-400 active:text-[#7DBE5C]"
                              aria-label="เปิดแผนที่"
                            >
                              <MapPin size={16} />
                            </a>
                          )}
                          {canCall && (
                            <a
                              href={`tel:${primaryPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-slate-400 active:text-[#7DBE5C]"
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
                  <div className="p-10 text-center text-sm font-bold text-slate-400">
                    ไม่พบรายชื่อที่ตรงกับ "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              <>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="group flex w-full items-center justify-between rounded-xl border border-brand-border border-l-4 border-l-brand-green bg-white p-4 shadow-sm transition-all hover:bg-brand-gray active:scale-[0.98]"
                  >
                    <div className="min-w-0 text-left">
                      <h3 className="mb-1 truncate text-base font-bold leading-none text-brand-dark">{category.name}</h3>
                      <p className="max-w-[180px] truncate text-[10px] font-medium text-brand-dark/60">
                        {category.subNames}
                      </p>
                    </div>
                    <div className="rounded-lg border border-brand-border bg-brand-gray px-3 py-1 text-[10px] font-bold text-brand-green">
                      {category.totalCustomers || 0} รายชื่อ
                    </div>
                  </button>
                ))}

                {customers.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
                    {customers.map((customer, index) => {
                      const primaryPhone = getPrimaryPhone(customer);
                      const canCall = Boolean(primaryPhone);
                      const canOpenMap = Boolean(customer.map_link);

                      return (
                        <div
                          key={customer.id}
                          onClick={() => setSelectedCustomer(customer)}
                          className={cn(
                            'flex cursor-pointer items-center justify-between gap-3 p-4 hover:bg-brand-gray active:bg-brand-border/30',
                            index !== customers.length - 1 && 'border-b border-brand-border'
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-green/20 bg-brand-green/10 text-lg font-bold text-brand-green">
                              {customer.name.substring(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-bold text-brand-dark">{customer.name}</h4>
                              <p className="mt-0.5 truncate text-[10px] font-bold tracking-tight text-brand-dark/60">
                                {getPrimaryPhoneDisplay(customer) || 'ไม่มีข้อมูลเบอร์โทร'}
                              </p>
                              <p className="mt-0.5 truncate text-[9px] text-brand-dark/45">
                                {getSummaryDetail(customer)}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(customer);
                              }}
                              className="rounded-lg border border-brand-border/50 bg-brand-gray p-2 text-brand-dark/50 transition-colors hover:bg-[#E2E8F0] hover:text-brand-green"
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
                                className="rounded-lg border border-brand-border/50 bg-brand-gray p-2 text-brand-dark/50 transition-colors hover:bg-[#E2E8F0] hover:text-brand-green"
                                aria-label="เปิดแผนที่"
                              >
                                <MapPin size={15} />
                              </a>
                            )}
                            {canCall && (
                              <a
                                href={`tel:${primaryPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-lg border border-brand-border/50 bg-brand-gray p-2 text-brand-dark/50 transition-colors hover:bg-[#E2E8F0] hover:text-brand-green"
                                aria-label="โทร"
                              >
                                <Phone size={15} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/40 p-5 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-2xl">
            <button
              onClick={() => router.push(`/home/edit/${selectedCustomer.id}`)}
              className="absolute left-5 top-5 rounded-lg border border-brand-border bg-brand-gray p-1.5 text-brand-dark/40 shadow-sm transition-colors hover:text-brand-dark"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute right-5 top-5 rounded-lg border border-brand-border bg-brand-gray p-1.5 text-brand-dark/40 shadow-sm transition-colors hover:text-brand-dark"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex flex-col items-center">
              <div className="mb-3 h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-green-light to-brand-green p-1 shadow-lg">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-white text-3xl font-black text-brand-green">
                  {selectedCustomer.name.substring(0, 1)}
                </div>
              </div>
              <h2 className="text-center text-xl font-black leading-none tracking-tight text-brand-dark">
                {selectedCustomer.name}
              </h2>
              <span className="mt-3 rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-0.5 text-[10px] font-bold tracking-wide text-brand-green shadow-sm">
                ข้อมูลในระบบยืนยันแล้ว
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-3 rounded-xl border border-brand-border bg-brand-gray p-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border/30 bg-white text-brand-green shadow-sm">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-wide text-brand-dark/50">ชื่อผู้ติดต่อ</p>
                  <p className="mt-0.5 text-xs font-bold text-brand-dark">
                    {selectedCustomer.contact_name || 'ไม่ระบุข้อมูล'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-brand-border bg-brand-gray p-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border/30 bg-white text-brand-green shadow-sm">
                  <Briefcase size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-wide text-brand-dark/50">รายละเอียด / หมายเหตุ</p>
                  <p className="mt-0.5 text-xs font-bold text-brand-dark">
                    {selectedCustomer.details || 'ไม่ระบุข้อมูล'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-brand-border bg-brand-gray p-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border/30 bg-white text-brand-green shadow-sm">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-wide text-brand-dark/50">เบอร์โทร</p>
                  <p className="mt-0.5 text-xs font-bold text-brand-dark">
                    {selectedCustomer.phone ? formatPhoneDisplay(selectedCustomer.phone) : 'ไม่มีเบอร์หลัก'}
                  </p>
                  <p className="mt-1 text-[11px] text-brand-dark/60">
                    เบอร์สำรอง: {selectedCustomer.backup_phone ? formatPhoneDisplay(selectedCustomer.backup_phone) : 'ไม่มีข้อมูล'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-brand-border bg-brand-gray p-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border/30 bg-white text-brand-green shadow-sm">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-wide text-brand-dark/50">แผนที่ / สถานที่</p>
                  <p className="mt-0.5 text-xs font-medium leading-snug text-brand-dark/70">
                    {selectedCustomer.map_location || 'ไม่มีข้อมูลแผนที่'}
                  </p>
                  {selectedCustomer.map_link && (
                    <a
                      href={selectedCustomer.map_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-green hover:underline"
                    >
                      <ExternalLink size={10} />
                      เปิดลิงก์แผนที่
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleShare(selectedCustomer)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-4 text-sm font-black tracking-wide text-brand-dark/70 shadow-sm transition-all hover:bg-brand-gray hover:text-brand-dark active:scale-95"
              >
                <Share2 size={16} />
                แชร์
              </button>

              {selectedCustomer.phone ? (
                <a
                  href={`tel:${normalizePhone(selectedCustomer.phone)}`}
                  className="inline-flex items-center justify-center rounded-xl border border-[#5A9207] bg-brand-green py-4 text-sm font-black tracking-wide text-white shadow-md transition-all hover:bg-brand-green-light active:scale-95"
                >
                  โทรหลัก
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-brand-border bg-brand-gray py-4 text-sm font-black tracking-wide text-brand-dark/40"
                >
                  ไม่มีเบอร์หลัก
                </button>
              )}

              {selectedCustomer.backup_phone ? (
                <a
                  href={`tel:${normalizePhone(selectedCustomer.backup_phone)}`}
                  className="inline-flex items-center justify-center rounded-xl border border-brand-border bg-white py-4 text-sm font-black tracking-wide text-brand-dark transition-all hover:bg-brand-gray active:scale-95"
                >
                  โทรสำรอง
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-brand-border bg-brand-gray py-4 text-sm font-black tracking-wide text-brand-dark/40"
                >
                  ไม่มีเบอร์สำรอง
                </button>
              )}

              {selectedCustomer.map_link ? (
                <a
                  href={selectedCustomer.map_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-green/30 bg-white py-4 text-sm font-black tracking-wide text-brand-green transition-all active:scale-95"
                >
                  <ExternalLink size={16} />
                  เปิดแผนที่
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-brand-border bg-brand-gray py-4 text-sm font-black tracking-wide text-brand-dark/40"
                >
                  ไม่มีแผนที่
                </button>
              )}
            </div>

            {shareStatus && (
              <p className="mt-3 text-center text-[11px] font-bold tracking-wide text-brand-green">
                {shareStatus}
              </p>
            )}
          </div>
        </div>
      )}

      <Link
        href="/home/add"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-brand-green text-white shadow-[0_4px_14px_rgba(101,163,13,0.5)] transition-all hover:bg-brand-green-light active:scale-90"
      >
        <Plus size={24} strokeWidth={3} />
      </Link>
    </div>
  );
};

export default EmployeeHomePage;
