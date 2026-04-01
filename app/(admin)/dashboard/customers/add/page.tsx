"use client";

import React from 'react';
import AddCustomerForm from '@/components/AddCustomerForm';
import CorporateCard from '@/components/ui/CorporateCard';
import CorporateButton from '@/components/ui/CorporateButton';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const AddCustomerAdminPage = () => {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <CorporateButton 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="p-2 min-w-0"
        >
          <ArrowLeft size={16} />
        </CorporateButton>
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">Add New Customer</h1>
          <p className="text-sm text-brand-dark/50 italic">System access: Admin Mode</p>
        </div>
      </div>

      <CorporateCard className="bg-brand-white p-8">
        <AddCustomerForm currentUserId="admin-console" />
      </CorporateCard>
    </div>
  );
};

export default AddCustomerAdminPage;
