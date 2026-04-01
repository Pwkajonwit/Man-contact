"use client";

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import CorporateInput from '@/components/ui/CorporateInput';
import CorporateTextarea from '@/components/ui/CorporateTextarea';
import CorporateButton from '@/components/ui/CorporateButton';
import NestedCategorySelect from '@/components/ui/NestedCategorySelect';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Edit2 } from 'lucide-react';

const EmployeeEditCustomerPage = () => {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    details: '',
    category_id: ''
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'customers', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || '',
            phone: data.phone || '',
            details: data.details || '',
            category_id: data.category_id || ''
          });
        } else {
          router.push('/home');
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setShowSuccess(false);
    try {
      await updateDoc(doc(db, 'customers', id as string), formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating customer:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F7F9]">
      <Loader2 className="animate-spin text-brand-green" size={48} />
      <span className="text-brand-dark/50 font-bold mt-4 tracking-widest text-xs">กำลังโหลดข้อมูล...</span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7F9] relative overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-gradient-to-r from-brand-green-light to-brand-green pt-6 pb-4 px-5 shadow-md flex items-center gap-3 relative z-10">
        <button 
          onClick={() => router.back()} 
          className="bg-white/20 p-2 rounded-lg text-white backdrop-blur-md active:scale-90 transition-transform shadow-sm"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <h1 className="text-white font-bold tracking-tight text-xl leading-none">
          แก้ไขข้อมูลผู้ติดต่อ
        </h1>
      </div>

      {showSuccess && (
        <div className="absolute top-20 left-4 right-4 z-50 p-3 bg-brand-dark text-brand-white text-xs font-bold text-center rounded-xl animate-in slide-in-from-top-4 duration-300 shadow-xl border border-brand-green">
           บันทึกการแก้ไขสำเร็จ
        </div>
      )}

      {/* Main Form */}
      <div className="p-5 flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-brand-border/60 space-y-6">
          <div className="flex items-center gap-2 mb-2 pb-4 border-b border-brand-green/10">
            <div className="p-2 bg-brand-green/10 rounded-md">
              <Edit2 size={20} className="text-brand-green" />
            </div>
            <div>
              <h2 className="text-lg font-black text-brand-dark tracking-tight">อัพเดตข้อมูล</h2>
              <p className="text-[10px] font-bold text-brand-dark/50 mt-0.5 tracking-wider">ID: {(id as string).substring(0, 12)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <CorporateInput
              label="ชื่อ-นามสกุล"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <CorporateInput
              label="เบอร์โทรศัพท์"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest text-brand-dark/60 ml-1">
                หมวดหมู่ / แผนก
              </label>
              <NestedCategorySelect
                selectedId={formData.category_id}
                onSelect={(catId) => setFormData({ ...formData, category_id: catId })}
              />
            </div>

            <CorporateTextarea
              label="แก้ไขข้อมูลเพิ่มเติม / หมายเหตุ"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </div>

          <div className="mt-8">
            <CorporateButton
              type="submit"
              fullWidth
              disabled={saving}
              className="gap-2 shadow-sm font-bold tracking-wide"
            >
              {saving ? <Loader2 className="animate-spin text-white" size={18} /> : <Save size={18} />}
              บันทึกการเปลี่ยนแปลง
            </CorporateButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeEditCustomerPage;
