import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import CustomerTable from '@/components/CustomerTable';
import CorporateButton from '@/components/ui/CorporateButton';

const CustomersAdminPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-brand-gray pb-4 md:flex-row md:items-baseline">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-brand-dark">รายชื่อลูกค้า</h1>
          <p className="mt-1.5 text-base font-semibold text-brand-dark/65">
            สรุปรายชื่อและข้อมูลผู้ติดต่อทั้งหมดในระบบ
          </p>
        </div>

        <Link href="/dashboard/customers/add">
          <CorporateButton className="flex items-center gap-2 text-sm font-semibold">
            <Plus size={16} /> ลงทะเบียนลูกค้าใหม่
          </CorporateButton>
        </Link>
      </div>

      <CustomerTable />
    </div>
  );
};

export default CustomersAdminPage;
