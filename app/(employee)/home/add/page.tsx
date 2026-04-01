"use client";

import React from 'react';
import AddCustomerForm from '@/components/AddCustomerForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const EmployeeAddCustomerPage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7F9]">
      <div className="bg-gradient-to-r from-brand-green-light to-brand-green pt-6 pb-4 px-5 shadow-md flex items-center gap-3">
        <button 
          onClick={() => router.back()} 
          className="bg-white/20 p-2 rounded-lg text-white backdrop-blur-md active:scale-90 transition-transform shadow-sm"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <h1 className="text-white font-bold tracking-tight text-xl leading-none">
          เพิ่มรายชื่อติดต่อใหม่
        </h1>
      </div>

      <div className="p-5 flex-1 w-full max-w-md mx-auto">
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-brand-border/60">
          <AddCustomerForm currentUserId="employee_mobile" />
        </div>
      </div>
    </div>
  );
};

export default EmployeeAddCustomerPage;
