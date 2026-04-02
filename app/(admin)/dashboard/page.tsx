"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  Calendar,
  ChevronRight,
  Edit2,
  ExternalLink,
  Folder,
  Home,
  Info,
  Loader2,
  MapPin,
  Phone,
  Search,
  User,
  X,
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
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerRecord[]>([]);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null);

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
      return [
        parentId,
        ...directChildren.flatMap((childCategory) => getDescendantIds(childCategory.id)),
      ];
    };

    const categoriesWithMetadata = childCategories.map((category) => {
      const subCategories = allCategories.filter((item) => item.parent_id === category.id);
      const relatedCategoryIds = getDescendantIds(category.id);
      const totalCustomers = allCustomers.filter((customer) =>
        relatedCategoryIds.includes(customer.category_id)
      ).length;

      return {
        ...category,
        subNames: subCategories.length > 0
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

  const getCategoryPath = (categoryId: string): string => {
    const categoryMap = new Map(allCategories.map((category) => [category.id, category]));
    const parts: string[] = [];
    let currentId: string | null = categoryId;
    let depth = 0;

    while (currentId && depth < 10) {
      const category = categoryMap.get(currentId);
      if (!category) break;
      parts.unshift(category.name);
      currentId = category.parent_id;
      depth += 1;
    }

    return parts.length > 0 ? parts.join(' > ') : 'ไม่ระบุหมวดหมู่';
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
      <div className="flex flex-col justify-between gap-4 border-b border-brand-border pb-4 md:flex-row md:items-end">
        <div className="flex w-full flex-col md:w-auto">
          <h1 className="text-2xl font-black tracking-tight text-brand-dark">ระบบสารบบองค์กร</h1>
          <p className="mt-1 text-sm font-semibold text-brand-dark/55">
            ดูแผนกและรายชื่อผู้ติดต่อระดับองค์กร
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ ผู้ติดต่อ เบอร์ หรือแผนที่"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-brand-border bg-white py-2.5 pl-9 pr-8 text-sm font-semibold text-brand-dark outline-none transition-all placeholder:text-brand-dark/30 focus:ring-2 focus:ring-brand-green/20"
          />
          {searchQuery !== '' && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-brand-gray p-1 text-brand-dark/40 hover:text-brand-dark"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {searchQuery === '' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-sm font-bold scrollbar-none">
          <button
            onClick={goHome}
            className={cn(
              'flex items-center gap-2 rounded-lg border p-2 transition-colors',
              currentPath.length === 0
                ? 'border-brand-green/20 bg-brand-green/10 text-brand-green'
                : 'border-brand-border bg-white text-brand-dark/60 hover:bg-brand-gray'
            )}
          >
            <Home size={16} strokeWidth={2.5} />
            <span className="text-xs font-semibold">หน้าหลัก</span>
          </button>

          {currentPath.map((path, index) => (
            <React.Fragment key={path.id}>
              <ChevronRight size={14} className="shrink-0 text-brand-border" strokeWidth={3} />
              <button
                onClick={() => navigateToLevel(index)}
                className={cn(
                  'whitespace-nowrap rounded-lg border px-3 py-1.5 transition-colors',
                  index === currentPath.length - 1
                    ? 'border-brand-green bg-brand-green text-white'
                    : 'border-brand-border bg-white text-brand-dark hover:bg-brand-gray'
                )}
              >
                {path.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 opacity-60">
          <Loader2 className="mb-4 animate-spin text-brand-green" size={36} />
          <span className="text-sm font-semibold text-brand-dark/45">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {searchQuery !== '' ? (
            <div className="space-y-4">
              <div className="mb-6 flex items-center gap-2">
                <span className="rounded-md border border-brand-green/20 bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">
                  พบ {searchResults.length} รายการ
                </span>
                <span className="text-sm font-semibold text-brand-dark/50">สำหรับ "{searchQuery}"</span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.map((customer) => (
                  <ContactCard key={customer.id} customer={customer} onView={setViewingCustomer} />
                ))}
              </div>

              {searchResults.length === 0 && (
                <div className="py-20 text-center text-brand-dark/30">
                  <Search size={48} strokeWidth={1.5} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold">ไม่พบรายชื่อที่ตรงกับการค้นหา</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {categories.length > 0 && (
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category)}
                      className="group flex h-32 flex-col justify-between rounded-xl border border-brand-border border-l-4 border-l-brand-green bg-white p-5 text-left transition-all hover:border-brand-green/50 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="flex w-full items-start justify-between">
                        <div className="rounded-lg border border-brand-border bg-brand-gray p-2.5 text-brand-green transition-colors group-hover:bg-brand-green group-hover:text-white">
                          <Folder size={18} strokeWidth={2.5} />
                        </div>
                        <span className="rounded border border-brand-border bg-brand-gray px-2 py-0.5 text-[10px] font-bold text-brand-dark/50">
                          {category.totalCustomers || 0} รายการ
                        </span>
                      </div>
                      <div>
                        <h3 className="truncate text-lg font-bold leading-tight text-brand-dark">{category.name}</h3>
                        <p className="mt-1 truncate text-xs font-medium text-brand-dark/50">{category.subNames}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {customers.length > 0 && (
                <div className="space-y-4">
                  <div className="mb-4 flex items-center gap-2 border-b border-brand-border pb-2">
                    <span className="text-sm font-bold text-brand-dark/60">รายชื่อผู้ติดต่อ</span>
                    <span className="rounded border border-brand-border bg-brand-gray px-2 py-0.5 text-[10px] font-bold text-brand-dark/60">
                      {customers.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {customers.map((customer) => (
                      <ContactCard key={customer.id} customer={customer} onView={setViewingCustomer} />
                    ))}
                  </div>
                </div>
              )}

              {categories.length === 0 && customers.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-border border-dashed bg-white py-20 text-brand-dark/30">
                  <Folder size={48} strokeWidth={1} className="mb-4 text-brand-border" />
                  <p className="text-sm font-bold">ยังไม่มีข้อมูลในหมวดหมู่นี้</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {viewingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-2xl animate-in zoom-in duration-300">
            <div className="relative flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-brand-border bg-white">
              <div className="relative shrink-0 border-b border-brand-border bg-brand-dark">
                <div className="absolute inset-0 bg-[radial-gradient(#00DB33_1px,transparent_1px)] opacity-10 [background-size:16px_16px]"></div>
                <button
                  onClick={() => setViewingCustomer(null)}
                  className="absolute right-3 top-3 z-10 rounded-md bg-brand-white/10 p-2 text-brand-white transition-colors hover:bg-brand-white/20"
                >
                  <X size={18} />
                </button>

                <div className="relative px-5 pb-5 pt-6 sm:px-7">
                  <div className="flex flex-col items-center gap-3 pr-10 text-center sm:flex-row sm:items-end sm:text-left">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-brand-green text-2xl font-black text-brand-white">
                      {viewingCustomer.name.substring(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                        {viewingCustomer.name}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <span className="rounded border border-brand-green/20 bg-brand-green/10 px-2.5 py-1 text-xs font-bold text-green-100">
                          ลูกค้าในระบบ
                        </span>
                        <span className="font-mono text-xs font-semibold text-white/65">
                          ID: {viewingCustomer.id.substring(0, 12)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-brand-border bg-slate-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-brand-dark/60">
                        <MapPin size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-xs font-bold text-brand-dark/45">หมวดหมู่</p>
                        <p className="text-base font-bold leading-6 text-brand-dark">
                          {getCategoryPath(viewingCustomer.category_id)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border bg-slate-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-brand-dark/60">
                        <User size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-xs font-bold text-brand-dark/45">ชื่อผู้ติดต่อ</p>
                        <p className="text-base font-bold leading-6 text-brand-dark">
                          {viewingCustomer.contact_name || 'ไม่มีชื่อผู้ติดต่อ'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border bg-slate-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-brand-dark/60">
                        <Phone size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-xs font-bold text-brand-dark/45">เบอร์โทร</p>
                        <p className="text-base font-bold text-brand-dark">
                          {viewingCustomer.phone ? formatPhoneDisplay(viewingCustomer.phone) : 'ไม่มีเบอร์หลัก'}
                        </p>
                        <p className="mt-1 text-sm text-brand-dark/65">
                          เบอร์สำรอง: {viewingCustomer.backup_phone ? formatPhoneDisplay(viewingCustomer.backup_phone) : 'ไม่มีข้อมูล'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border bg-slate-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-brand-dark/60">
                        <MapPin size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-xs font-bold text-brand-dark/45">แผนที่ / สถานที่</p>
                        <p className="text-base font-bold leading-6 text-brand-dark">
                          {viewingCustomer.map_location || 'ไม่มีข้อมูลแผนที่'}
                        </p>
                        {viewingCustomer.map_link && (
                          <a
                            href={viewingCustomer.map_link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-green hover:underline"
                          >
                            <ExternalLink size={13} />
                            เปิดลิงก์แผนที่
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border bg-slate-50/70 p-4 sm:col-span-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-brand-dark/60">
                        <Info size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-2 text-xs font-bold text-brand-dark/45">รายละเอียดและบันทึก</p>
                        <p className="rounded-lg border-l-4 border-brand-green/20 bg-white px-4 py-3 text-sm leading-7 text-brand-dark/80">
                          {viewingCustomer.details || 'ไม่มีบันทึกเพิ่มเติมสำหรับลูกค้ารายนี้'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border bg-slate-50/70 p-4 sm:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-brand-dark/60">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-brand-dark/45">วันที่ลงทะเบียน</p>
                        <p className="mt-1 text-sm font-bold text-brand-dark">
                          {viewingCustomer.created_at?.toDate?.()?.toLocaleDateString?.()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-brand-border bg-white px-5 py-4 sm:px-7">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/dashboard/customers/${viewingCustomer.id}`}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-brand-border bg-white text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-gray"
                  >
                    <Edit2 size={16} /> แก้ไขข้อมูล
                  </Link>

                  {viewingCustomer.map_link && (
                    <a
                      href={viewingCustomer.map_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center rounded-md bg-brand-green px-6 text-sm font-semibold text-brand-white hover:opacity-90 sm:min-w-[150px]"
                    >
                      เปิดแผนที่
                    </a>
                  )}

                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-brand-gray px-6 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/10 sm:min-w-[120px]"
                    onClick={() => setViewingCustomer(null)}
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactCard = ({
  customer,
  onView,
}: {
  customer: CustomerRecord;
  onView: (customer: CustomerRecord) => void;
}) => {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-brand-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-brand-green/5 scale-0 transition-transform duration-500 ease-out group-hover:scale-100"></div>

      <div className="relative z-10 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-green/20 bg-brand-green/10 text-xl font-black text-brand-green">
          {customer.name.substring(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-bold text-brand-dark">{customer.name}</h4>
          <p className="mt-1 truncate text-xs font-bold text-brand-dark/50">
            {customer.contact_name || 'ไม่มีชื่อผู้ติดต่อ'}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-5 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-border bg-brand-gray text-brand-dark/40">
            <Phone size={12} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-dark">
              {customer.phone ? formatPhoneDisplay(customer.phone) : 'ไม่มีเบอร์หลัก'}
            </p>
            <p className="truncate text-[11px] text-brand-dark/50">
              {customer.backup_phone ? formatPhoneDisplay(customer.backup_phone) : 'ไม่มีเบอร์สำรอง'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border border-brand-border bg-brand-gray text-brand-dark/40">
            <MapPin size={12} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-dark/70">{customer.map_location || 'ไม่มีข้อมูลแผนที่'}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-brand-dark/55">
              {customer.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={customer.phone ? `tel:${normalizePhone(customer.phone)}` : undefined}
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors',
              customer.phone
                ? 'border-brand-border bg-white text-brand-dark hover:bg-brand-gray'
                : 'pointer-events-none border-brand-border bg-brand-gray text-brand-dark/35'
            )}
          >
            เบอร์หลัก
          </a>
          <a
            href={customer.backup_phone ? `tel:${normalizePhone(customer.backup_phone)}` : undefined}
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors',
              customer.backup_phone
                ? 'border-brand-border bg-white text-brand-dark hover:bg-brand-gray'
                : 'pointer-events-none border-brand-border bg-brand-gray text-brand-dark/35'
            )}
          >
            เบอร์สำรอง
          </a>
          <button
            type="button"
            onClick={() => onView(customer)}
            className="inline-flex h-10 items-center justify-center rounded-md border border-brand-border bg-white text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-gray"
          >
            ดูข้อมูล
          </button>
          <a
            href={customer.map_link || undefined}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'inline-flex h-10 items-center justify-center gap-1 rounded-md text-sm font-semibold transition-colors',
              customer.map_link
                ? 'bg-brand-green text-brand-white hover:opacity-90'
                : 'pointer-events-none bg-brand-gray text-brand-dark/35'
            )}
          >
            <ExternalLink size={12} />
            แผนที่
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
