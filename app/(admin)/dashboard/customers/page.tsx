import React from 'react';
import CustomerTable from '@/components/CustomerTable';
import CorporateButton from '@/components/ui/CorporateButton';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const CustomersAdminPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 border-b border-brand-gray pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark tracking-tighter">รายชื่อลูกค้า</h1>
          <p className="text-sm text-brand-dark/50 font-bold mt-1">สารบบรายชื่อและข้อมูลผู้ติดต่อทั้งหมดในระบบ</p>
        </div>
        <Link href="/dashboard/customers/add">
          <CorporateButton className="flex items-center gap-2">
            <Plus size={16} /> ลงทะเบียนลูกค้าใหม่
          </CorporateButton>
        </Link>
      </div>

      <CustomerTable />
    </div>
  );
};

export default CustomersAdminPage;
