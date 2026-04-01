import React from 'react';
import CorporateCard from '@/components/ui/CorporateCard';
import CorporateInput from '@/components/ui/CorporateInput';
import CorporateButton from '@/components/ui/CorporateButton';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-brand-dark tracking-tighter border-b border-brand-gray pb-4">
        ตั้งค่าระบบ
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        <CorporateCard className="space-y-6">
          <h2 className="text-lg font-bold text-brand-dark mb-4">การตั้งค่าทั่วไป</h2>
          <CorporateInput label="ชื่อระบบ" defaultValue="Man-Contacts Enterprise" />
          <CorporateInput label="อีเมลติดต่อฝ่ายสนับสนุน" defaultValue="support@enterprise.com" />
          <CorporateButton className="flex items-center gap-2">
            <Save size={16} /> บันทึกการเปลี่ยนแปลง
          </CorporateButton>
        </CorporateCard>
        
        <CorporateCard className="flex flex-col items-center justify-center bg-brand-gray/10">
          <SettingsIcon size={48} className="text-brand-dark/10 mb-4" />
          <span className="text-[10px] font-bold text-brand-dark/20 tracking-[.25em]">เวอร์ชัน 1.0.4-LTS</span>
        </CorporateCard>
      </div>
    </div>
  );
};

export default SettingsPage;
