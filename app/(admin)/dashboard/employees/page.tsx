import React from 'react';
import CorporateCard from '@/components/ui/CorporateCard';
import { UserCircle, Settings as SettingsIcon } from 'lucide-react';

const EmployeesPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-brand-dark tracking-tighter border-b border-brand-gray pb-4">
        จัดการรายชื่อพนักงาน
      </h1>
      <CorporateCard className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-4 text-brand-dark/20 uppercase font-black">
          <UserCircle size={64} strokeWidth={1} />
          <span className="text-sm tracking-widest">ระบบข้อมูลพนักงาน กำลังจะเปิดให้บริการเร็วๆ นี้</span>
        </div>
      </CorporateCard>
    </div>
  );
};

export default EmployeesPage;
