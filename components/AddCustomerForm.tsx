"use client";

import React, { useState } from 'react';
import CorporateInput from './ui/CorporateInput';
import CorporateTextarea from './ui/CorporateTextarea';
import CorporateButton from './ui/CorporateButton';
import NestedCategorySelect from './ui/NestedCategorySelect';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserPlus, Loader2 } from 'lucide-react';

const AddCustomerForm = ({ currentUserId }: { currentUserId: string }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    details: '',
  });
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !categoryId) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'customers'), {
        ...formData,
        category_id: categoryId,
        handled_by_uid: currentUserId,
        created_at: serverTimestamp(),
      });
      setSuccess(true);
      setFormData({ name: '', phone: '', details: '' });
      setCategoryId(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error adding customer:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-brand-green/10 rounded-md">
          <UserPlus size={20} className="text-brand-green" />
        </div>
        <div>
          <h2 className="text-lg font-black text-brand-dark tracking-tight">เพิ่มรายชื่อใหม่</h2>
          <p className="text-xs font-bold text-brand-dark/50 mt-0.5">กรอกข้อมูลผู้ติดต่อเพื่อบันทึกลงระบบ</p>
        </div>
      </div>

      <div className="space-y-4">
        <CorporateInput
          label="ชื่อ-นามสกุล"
          placeholder="เช่น นายสมชาย ใจดี"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        
        <CorporateInput
          label="เบอร์โทรศัพท์"
          placeholder="เช่น 081-234-5678"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <div className="flex flex-col gap-2">
           <label className="text-xs font-bold tracking-widest text-brand-dark/60 ml-1">
            หมวดหมู่ที่จัดเก็บ
          </label>
          <NestedCategorySelect
            selectedId={categoryId || undefined}
            onSelect={(id) => setCategoryId(id)}
          />
        </div>

        <CorporateTextarea
          label="ข้อมูลเพิ่มเติม / หมายเหตุ"
          placeholder="รายละเอียดการติดต่อ หรือตำแหน่งงาน..."
          value={formData.details}
          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
        />
      </div>

      <div className="mt-4">
        <CorporateButton
          type="submit"
          fullWidth
          disabled={loading || !formData.name || !categoryId}
          className="shadow-none border-transparent font-bold tracking-wide"
        >
          {loading ? (
            <Loader2 className="animate-spin text-white mx-auto" size={20} />
          ) : success ? (
            "บันทึกข้อมูลเรียบร้อยแล้ว!"
          ) : (
            "บันทึกรายชื่อใหม่"
          )}
        </CorporateButton>
      </div>

      {success && (
        <div className="p-3 bg-brand-green text-brand-white text-xs font-bold tracking-widest text-center rounded-md animate-in slide-in-from-bottom duration-300 shadow-md">
          บันทึกข้อมูลลงฐานข้อมูลสำเร็จ
        </div>
      )}
    </form>
  );
};

export default AddCustomerForm;
