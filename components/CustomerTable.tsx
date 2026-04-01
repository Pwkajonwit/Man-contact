"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Search, Download, ArrowUpDown, Edit2, Trash2, Eye, X, Phone, MapPin, Calendar, User, Info, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CorporateButton from './ui/CorporateButton';
import CorporateCard from './ui/CorporateCard';


interface Customer {
  id: string;
  name: string;
  phone: string;
  details: string;
  category_id: string;
  handled_by_uid: string;
  created_at: any;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

const CustomerTable = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    const headers = ['Name', 'Phone', 'Category Path', 'Details', 'Created At'];
    const rows = filteredCustomers.map(c => [
        `"${c.name}"`,
        `"${c.phone || ''}"`,
        `"${getCategoryPath(c.category_id)}"`,
        `"${(c.details || '').replace(/"/g, '""')}"`,
        `"${c.created_at?.toDate()?.toLocaleString() || ''}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
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
        const lines = text.split('\n').map(l => l.split(',').map(s => s.replace(/^"|"$/g, '').trim()));
        
        // Skip header Row
        const dataRows = lines.slice(1);
        let importedCount = 0;

        for (const row of dataRows) {
            if (row.length < 1 || !row[0]) continue;
            
            try {
                // Find a best match for category if name is provided in column 2 (index 2)
                // Or just use the default category if not found
                // For simplicity, we assign to a 'General' category or leave empty if user must fix
                await addDoc(collection(db, 'customers'), {
                    name: row[0],
                    phone: row[1] || '',
                    category_id: 'imported', // Use a placeholder or matching logic
                    details: row[3] || 'Imported from CSV',
                    handled_by_uid: 'system-import',
                    created_at: serverTimestamp()
                });
                importedCount++;
            } catch (err) {
                console.error("Import error for row:", row, err);
            }
        }
        alert(`Successfully imported ${importedCount} records.`);
        setIsImporting(false);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const catMap: Record<string, Category> = {};
      querySnapshot.forEach(doc => {
        catMap[doc.id] = { id: doc.id, ...doc.data() } as Category;
      });
      setCategories(catMap);
    };

    fetchCategories();

    const q = query(collection(db, 'customers'), orderBy('created_at', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Customer));
      setCustomers(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getCategoryPath = (id: string): string => {
    const parts: string[] = [];
    let currentId: string | null = id;
    let depth = 0;
    while (currentId && depth < 5) {
      const categoryNode: Category | undefined = categories[currentId];
      if (!categoryNode) break;
      parts.unshift(categoryNode.name);
      currentId = categoryNode.parent_id;
      depth++;
    }
    return parts.length > 0 ? parts.join(' > ') : 'Unknown';
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this customer record?')) {
      await deleteDoc(doc(db, 'customers', id));
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesCategory = selectedCategoryId === 'all' || customer.category_id === selectedCategoryId;
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (customer.phone && customer.phone.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const tableHeaders = [
    { label: 'ชื่อผู้ติดต่อ', key: 'name' },
    { label: 'เบอร์โทร', key: 'phone' },
    { label: 'หมวดหมู่', key: 'category_id' },
    { label: 'วันที่เพิ่ม', key: 'created_at' },
    { label: 'จัดการ', key: 'actions' },
  ];

  return (
    <CorporateCard className="p-0 border-[#E2E8F0] overflow-hidden relative shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between p-5 gap-4 border-b border-brand-border">
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-brand-dark tracking-tight leading-none">รายชื่อลูกค้าทั้งหมด</h3>
          <p className="text-[10px] text-brand-dark/60 font-bold tracking-widest mt-1.5">จัดการข้อมูลผู้ติดต่อในระบบ</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/50" />
            <input 
              type="text" 
              placeholder="ค้นหารายชื่อ, เบอร์โทร..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white rounded-lg text-sm font-medium text-brand-dark border border-brand-border focus:ring-2 focus:ring-brand-green/20 outline-none w-[180px] transition-all placeholder-brand-dark/30 shadow-sm"
            />
          </div>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="bg-brand-gray border-transparent rounded-md px-3 py-2 text-xs font-bold text-brand-dark outline-none cursor-pointer max-w-[200px]"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {Object.keys(categories).map((id) => (
              <option key={id} value={id}>{getCategoryPath(id)}</option>
            ))}
          </select>
          <CorporateButton 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleExport}
          >
            <Download size={14} /> ดาวน์โหลด
          </CorporateButton>

          <label className="cursor-pointer">
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleImport}
              disabled={isImporting}
            />
            <div className={cn(
              "flex items-center gap-1 px-3 py-2 border border-brand-gray rounded-md hover:bg-brand-gray transition-colors text-xs font-bold text-brand-dark/60",
              isImporting && "opacity-50 pointer-events-none"
            )}>
              {isImporting ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
              อัพโหลด
            </div>
          </label>
        </div>
      </div>


      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F8F9FA] border-b border-brand-border">
            <tr>
              {tableHeaders.map((header) => (
                <th key={header.key} className="px-4 py-3 text-[11px] font-bold text-brand-dark/70 tracking-wide whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {header.label}
                    {header.key !== 'actions' && <ArrowUpDown size={12} strokeWidth={2.5} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/60">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-6 py-6"><div className="h-4 bg-brand-gray rounded w-full"></div></td>
                  ))}
                </tr>
              ))
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-brand-gray transition-colors group">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white border border-brand-border/60 flex items-center justify-center text-brand-green font-black text-xs shrink-0 shadow-sm">
                        {customer.name.substring(0, 2)}
                      </div>
                      <span className="text-sm font-bold text-brand-dark tracking-tight">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-brand-dark font-medium whitespace-nowrap leading-none">
                    {customer.phone || 'N/A'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2.5 py-1 bg-white border border-brand-border rounded-md text-[10px] font-bold text-brand-green tracking-wide whitespace-nowrap shadow-sm">
                      {getCategoryPath(customer.category_id)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-brand-dark/60 font-medium tracking-wide whitespace-nowrap">
                    {customer.created_at?.toDate()?.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button onClick={() => setViewingCustomer(customer)} className="p-2 hover:bg-brand-gray text-brand-dark/40 hover:text-brand-dark rounded-md transition-colors opacity-0 group-hover:opacity-100" title="ดูโปรไฟล์">
                        <Eye size={16} />
                      </button>
                      <Link href={`/dashboard/customers/${customer.id}`} className="p-2 hover:bg-brand-gray text-brand-dark/40 hover:text-brand-dark rounded-md transition-colors opacity-0 group-hover:opacity-100" title="แก้ไข">
                        <Edit2 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-red-500/10 text-brand-dark/40 hover:text-red-500 rounded-md transition-colors opacity-0 group-hover:opacity-100" title="ลบ">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-brand-dark/30 text-xs italic">ไม่พบประวัติรายชื่อลูกค้า</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-brand-gray flex items-center justify-between">
         <span className="text-[10px] font-bold text-brand-dark/40 tracking-widest ml-2">
           กำลังแสดง {filteredCustomers.length} รายการ
         </span>
         <div className="flex items-center gap-1">
            <CorporateButton variant="outline" size="sm" className="px-3" disabled>ย้อนกลับ</CorporateButton>
            <CorporateButton variant="outline" size="sm" className="px-3" disabled>ถัดไป</CorporateButton>
         </div>
      </div>
      {/* Profile Viewer Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 backdrop-blur-md p-4">
          <div className="w-full max-w-lg animate-in zoom-in duration-300">
            <CorporateCard className="p-0 shadow-2xl relative overflow-hidden bg-brand-white">
              {/* Header with Background Pattern */}
              <div className="h-32 bg-brand-dark relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00DB33_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <button 
                  onClick={() => setViewingCustomer(null)}
                  className="absolute top-4 right-4 p-2 bg-brand-white/10 hover:bg-brand-white/20 text-brand-white rounded-md transition-colors backdrop-blur-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Main Info */}
              <div className="px-8 pb-8 -mt-12 relative">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-2xl bg-brand-green p-1 shadow-lg">
                     <div className="w-full h-full rounded-xl bg-brand-white flex items-center justify-center text-4xl font-black text-brand-dark">
                      {viewingCustomer.name.substring(0, 1)}
                    </div>
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-brand-dark tracking-tight">{viewingCustomer.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-brand-green/10 text-brand-green text-[10px] font-bold rounded tracking-widest border border-brand-green/20">
                      ลูกค้าในระบบ
                    </span>
                    <span className="text-[10px] text-brand-dark/40 font-bold uppercase tracking-widest font-mono">
                      ID: {viewingCustomer.id.substring(0, 12)}
                    </span>
                  </div>
                </div>

                <div className="mt-10 space-y-6">
                  {/* Category Path */}
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-brand-gray rounded-lg text-brand-dark/60"><MapPin size={18} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-brand-dark/40 tracking-widest mb-1">หมวดหมู่และแผนก</p>
                      <p className="text-sm font-bold text-brand-dark">{getCategoryPath(viewingCustomer.category_id)}</p>
                    </div>
                  </div>

                  {/* Contact Number */}
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-brand-gray rounded-lg text-brand-dark/60"><Phone size={18} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-brand-dark/40 tracking-widest mb-1">เบอร์ติดต่อหลัก</p>
                      <p className="text-sm font-bold text-brand-dark">{viewingCustomer.phone || 'ไม่มีข้อมูลเบอร์โทร'}</p>
                    </div>
                  </div>

                  {/* Details / Notes */}
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-brand-gray rounded-lg text-brand-dark/60"><Info size={18} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-brand-dark/40 tracking-widest mb-1">รายละเอียดและบันทึก</p>
                      <p className="text-sm text-brand-dark/70 leading-relaxed italic border-l-4 border-brand-green/20 pl-4 py-2 bg-brand-gray/30 rounded-r-md min-h-[60px]">
                        {viewingCustomer.details || 'ไม่มีการบันทึกข้อมูลเพิ่มเติมสำหรับผู้ติดต่อนี้'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 pt-4 mt-8 border-t border-brand-gray">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-brand-dark/30" />
                       <div className="text-[9px]">
                         <p className="text-brand-dark/40 font-bold tracking-widest">วันที่ลงทะเบียน</p>
                         <p className="font-bold text-brand-dark">{viewingCustomer.created_at?.toDate()?.toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <User size={14} className="text-brand-dark/30" />
                       <div className="text-[9px]">
                         <p className="text-brand-dark/40 font-bold tracking-widest">ผู้รับผิดชอบ (Agent ID)</p>
                         <p className="font-bold text-brand-dark">{viewingCustomer.handled_by_uid.substring(0, 8)}</p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <CorporateButton 
                    variant="outline" 
                    fullWidth 
                    className="gap-2"
                    onClick={() => {
                       router.push(`/dashboard/customers/${viewingCustomer.id}`);
                       setViewingCustomer(null);
                    }}
                  >
                    <Edit2 size={16} /> แก้ไขข้อมูลทั้งหมด
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
