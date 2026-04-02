"use client";

import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpDown,
  Calendar,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  Info,
  Loader2,
  MapPin,
  Phone,
  Search,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { formatPhoneDisplay, normalizePhone, type CustomerRecord } from '@/lib/customer';
import { cn } from '@/lib/utils';
import CorporateButton from './ui/CorporateButton';
import CorporateCard from './ui/CorporateCard';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

const normalizeCsvHeader = (value: string) => value.replace(/^\uFEFF/, '').trim().toLowerCase();

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const isEscapedQuote = inQuotes && line[index + 1] === '"';
      if (isEscapedQuote) {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const getRowValue = (row: string[], headerIndexMap: Record<string, number>, headers: string[]) => {
  for (const header of headers) {
    const index = headerIndexMap[normalizeCsvHeader(header)];
    if (index !== undefined) {
      return row[index]?.trim() ?? '';
    }
  }

  return '';
};

const CustomerTable = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const getCategoryPath = (id: string): string => {
    const parts: string[] = [];
    let currentId: string | null = id;
    let depth = 0;

    while (currentId && depth < 5) {
      const categoryNode: Category | undefined = categories[currentId];
      if (!categoryNode) break;
      parts.unshift(categoryNode.name);
      currentId = categoryNode.parent_id;
      depth += 1;
    }

    return parts.length > 0 ? parts.join(' > ') : 'ไม่ระบุหมวดหมู่';
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoryMap: Record<string, Category> = {};

      querySnapshot.forEach((snapshotDoc) => {
        categoryMap[snapshotDoc.id] = { id: snapshotDoc.id, ...snapshotDoc.data() } as Category;
      });

      setCategories(categoryMap);
    };

    fetchCategories();

    const customerQuery = query(collection(db, 'customers'), orderBy('created_at', 'desc'), limit(50));
    const unsubscribe = onSnapshot(customerQuery, (snapshot) => {
      const docs = snapshot.docs.map(
        (snapshotDoc) =>
          ({
            id: snapshotDoc.id,
            ...snapshotDoc.data(),
          } as CustomerRecord)
      );
      setCustomers(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedPhoneQuery = normalizePhone(searchQuery);
    const matchesCategory = selectedCategoryId === 'all' || customer.category_id === selectedCategoryId;
    const matchesPhone =
      normalizedPhoneQuery.length > 0 &&
      (normalizePhone(customer.phone).includes(normalizedPhoneQuery) ||
        normalizePhone(customer.backup_phone).includes(normalizedPhoneQuery));
    const matchesSearch =
      normalizedQuery === '' ||
      customer.name.toLowerCase().includes(normalizedQuery) ||
      customer.contact_name.toLowerCase().includes(normalizedQuery) ||
      matchesPhone ||
      customer.map_location.toLowerCase().includes(normalizedQuery) ||
      customer.map_link.toLowerCase().includes(normalizedQuery) ||
      customer.details.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesSearch;
  });

  const handleExport = () => {
    const headers = [
      'Name',
      'Contact Name',
      'Phone',
      'Backup Phone',
      'Category Path',
      'Map Location',
      'Map Link',
      'Details',
      'Created At',
    ];

    const rows = filteredCustomers.map((customer) => [
      escapeCsvValue(customer.name),
      escapeCsvValue(customer.contact_name || ''),
      escapeCsvValue(customer.phone || ''),
      escapeCsvValue(customer.backup_phone || ''),
      escapeCsvValue(getCategoryPath(customer.category_id)),
      escapeCsvValue(customer.map_location || ''),
      escapeCsvValue(customer.map_link || ''),
      escapeCsvValue(customer.details || ''),
      escapeCsvValue(customer.created_at?.toDate?.()?.toLocaleString?.() || ''),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/\r/g, ''))
        .filter(Boolean)
        .map(parseCsvLine);

      if (lines.length <= 1) {
        alert('ไฟล์ไม่มีข้อมูลสำหรับนำเข้า');
        setIsImporting(false);
        e.target.value = '';
        return;
      }

      const headerIndexMap = lines[0].reduce<Record<string, number>>((acc, header, index) => {
        acc[normalizeCsvHeader(header)] = index;
        return acc;
      }, {});

      const dataRows = lines.slice(1);
      let importedCount = 0;
      let skippedCount = 0;
      const failedRows: number[] = [];

      for (const [rowIndex, row] of dataRows.entries()) {
        const name = getRowValue(row, headerIndexMap, ['Name', 'ชื่อร้าน', 'ชื่อลูกค้า']);
        const contactName = getRowValue(row, headerIndexMap, ['Contact Name', 'ชื่อผู้ติดต่อ']);
        const phone = getRowValue(row, headerIndexMap, ['Phone', 'เบอร์โทร']);
        const backupPhone = getRowValue(row, headerIndexMap, ['Backup Phone', 'เบอร์สำรอง']);
        const categoryPath = getRowValue(row, headerIndexMap, ['Category Path', 'หมวดหมู่']);
        const mapLocation = getRowValue(row, headerIndexMap, ['Map Location', 'สถานที่', 'แผนที่']);
        const mapLink = getRowValue(row, headerIndexMap, ['Map Link', 'ลิงก์แผนที่']);
        const details = getRowValue(row, headerIndexMap, ['Details', 'รายละเอียด']);

        if (!name) {
          skippedCount += 1;
          continue;
        }

        const matchedCategoryId =
          Object.keys(categories).find((id) => getCategoryPath(id) === categoryPath) ?? '';

        try {
          await addDoc(collection(db, 'customers'), {
            name,
            contact_name: contactName,
            phone,
            backup_phone: backupPhone,
            category_id: matchedCategoryId,
            map_location: mapLocation,
            map_link: mapLink,
            details: details || 'Imported from CSV',
            handled_by_uid: 'system-import',
            created_at: serverTimestamp(),
          });
          importedCount += 1;
        } catch (error) {
          console.error('Import error for row:', row, error);
          failedRows.push(rowIndex + 2);
        }
      }

      const importSummary = [
        `นำเข้าสำเร็จ ${importedCount} รายการ`,
        skippedCount > 0 ? `ข้าม ${skippedCount} แถวที่ไม่มีชื่อลูกค้า` : '',
        failedRows.length > 0 ? `ผิดพลาดที่แถว: ${failedRows.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      alert(importSummary);
      setIsImporting(false);
      e.target.value = '';
    };

    reader.onerror = () => {
      setIsImporting(false);
      e.target.value = '';
    };

    reader.readAsText(file);
  };

  const handleDelete = async (id: string) => {
    if (confirm('ลบข้อมูลลูกค้ารายการนี้ใช่หรือไม่')) {
      await deleteDoc(doc(db, 'customers', id));
    }
  };

  const tableHeaders = [
    { label: 'ชื่อลูกค้า', key: 'name' },
    { label: 'เบอร์โทร', key: 'phone' },
    { label: 'รายละเอียด', key: 'details' },
    { label: 'หมวดหมู่', key: 'category_id' },
    { label: 'วันที่เพิ่ม', key: 'created_at' },
    { label: 'จัดการ', key: 'actions' },
  ];

  return (
    <CorporateCard className="overflow-hidden border-slate-300 p-0 shadow-none">
      <div className="flex flex-col justify-between gap-4 border-b border-brand-border px-5 py-5 md:flex-row md:items-center">
        <div className="flex flex-col">
          <h3 className="text-xl font-extrabold leading-none tracking-tight text-brand-dark">รายชื่อลูกค้าทั้งหมด</h3>
          <p className="mt-2 text-sm font-semibold text-brand-dark/70">จัดการข้อมูลผู้ติดต่อและประวัติลูกค้าในระบบ</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/55" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า ผู้ติดต่อ หรือเบอร์โทร"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[250px] rounded-lg border border-brand-border bg-white py-2.5 pl-10 pr-4 text-base font-medium text-brand-dark outline-none transition-all placeholder:text-brand-dark/35 focus:ring-2 focus:ring-brand-green/15"
            />
          </div>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="max-w-[220px] cursor-pointer rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm font-semibold text-brand-dark outline-none"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {Object.keys(categories).map((id) => (
              <option key={id} value={id}>
                {getCategoryPath(id)}
              </option>
            ))}
          </select>

          <CorporateButton variant="outline" size="sm" className="gap-2 text-sm font-semibold" onClick={handleExport}>
            <Download size={15} /> ดาวน์โหลด
          </CorporateButton>

          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={isImporting} />
            <div
              className={cn(
                'inline-flex h-9 items-center justify-center gap-2 rounded-md border border-brand-border bg-white px-4 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-gray',
                isImporting && 'pointer-events-none opacity-60'
              )}
            >
              {isImporting ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
              {isImporting ? 'กำลังอัปโหลด' : 'อัปโหลด'}
            </div>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-brand-border bg-slate-50">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header.key}
                  className={cn(
                    'px-4 py-3 text-xs font-extrabold tracking-wide text-brand-dark/80 whitespace-nowrap',
                    header.key === 'actions' && 'text-center'
                  )}
                >
                  <div className={cn('flex items-center gap-2', header.key === 'actions' && 'justify-center')}>
                    {header.label}
                    {header.key !== 'actions' && <ArrowUpDown size={13} strokeWidth={2.4} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-brand-border/70">
            {loading ? (
              [...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse">
                  {[...Array(6)].map((_, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-6">
                      <div className="h-4 w-full rounded bg-brand-gray"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="group transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-white text-sm font-extrabold text-brand-green">
                        {customer.name.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-extrabold tracking-tight text-brand-dark">{customer.name}</p>
                        <p className="truncate text-sm font-medium text-brand-dark/65">
                          {customer.contact_name || 'ไม่มีชื่อผู้ติดต่อ'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm font-semibold text-brand-dark whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span>{customer.phone ? formatPhoneDisplay(customer.phone) : 'ไม่มีเบอร์หลัก'}</span>
                      <span className="text-sm font-medium text-brand-dark/60">
                        {customer.backup_phone ? formatPhoneDisplay(customer.backup_phone) : 'ไม่มีเบอร์สำรอง'}
                      </span>
                    </div>
                  </td>

                  <td className="max-w-[340px] px-4 py-3">
                    <p className="line-clamp-2 text-sm leading-6 text-brand-dark/80">
                      {customer.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <span className="whitespace-nowrap rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs font-bold text-brand-green">
                      {getCategoryPath(customer.category_id)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm font-medium text-brand-dark/65 whitespace-nowrap">
                    {customer.created_at?.toDate?.()?.toLocaleDateString?.()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex shrink-0 items-center justify-center gap-2">
                      <button
                        onClick={() => setViewingCustomer(customer)}
                        className="rounded-md p-2 text-brand-dark/50 transition-colors hover:bg-brand-gray hover:text-brand-dark"
                        title="ดูข้อมูล"
                      >
                        <Eye size={16} />
                      </button>
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="rounded-md p-2 text-brand-dark/50 transition-colors hover:bg-brand-gray hover:text-brand-dark"
                        title="แก้ไข"
                      >
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="rounded-md p-2 text-brand-dark/50 transition-colors hover:bg-red-500/10 hover:text-red-600"
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-sm font-medium italic text-brand-dark/45">
                  ไม่พบข้อมูลรายชื่อลูกค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-brand-border px-4 py-4">
        <span className="ml-1 text-sm font-semibold text-brand-dark/55">กำลังแสดง {filteredCustomers.length} รายการ</span>
        <div className="flex items-center gap-2">
          <CorporateButton variant="outline" size="sm" className="px-3 text-sm font-semibold" disabled>
            ย้อนกลับ
          </CorporateButton>
          <CorporateButton variant="outline" size="sm" className="px-3 text-sm font-semibold" disabled>
            ถัดไป
          </CorporateButton>
        </div>
      </div>

      {viewingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-2xl animate-in zoom-in duration-300">
            <CorporateCard className="relative flex max-h-[90vh] flex-col overflow-hidden bg-brand-white p-0 shadow-none">
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
                      <div className="truncate text-xl font-black tracking-tight text-white sm:text-xl">
                        {viewingCustomer.name}
                      </div>
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
                        <p className="text-base font-bold leading-6 text-brand-dark">{getCategoryPath(viewingCustomer.category_id)}</p>
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
                  <CorporateButton
                    variant="outline"
                    fullWidth
                    className="gap-2 text-sm font-semibold"
                    onClick={() => {
                      router.push(`/dashboard/customers/${viewingCustomer.id}`);
                      setViewingCustomer(null);
                    }}
                  >
                    <Edit2 size={16} /> แก้ไขข้อมูล
                  </CorporateButton>

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

                  <CorporateButton
                    variant="secondary"
                    className="text-sm font-semibold sm:min-w-[120px]"
                    onClick={() => setViewingCustomer(null)}
                  >
                    ปิด
                  </CorporateButton>
                </div>
              </div>
            </CorporateCard>
          </div>
        </div>
      )}
    </CorporateCard>
  );
};

export default CustomerTable;
