"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserPlus, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { emptyCustomerFormData } from '@/lib/customer';
import CorporateInput from './ui/CorporateInput';
import CorporateTextarea from './ui/CorporateTextarea';
import CorporateButton from './ui/CorporateButton';
import NestedCategorySelect from './ui/NestedCategorySelect';

const AddCustomerForm = ({ currentUserId }: { currentUserId: string }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyCustomerFormData);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'customers'), {
        ...formData,
        handled_by_uid: currentUserId,
        created_at: serverTimestamp(),
      });
      setSuccess(true);
      setFormData(emptyCustomerFormData);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding customer:', error);
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
          <h2 className="text-lg font-black text-brand-dark tracking-tight">เพิ่มรายชื่อลูกค้าใหม่</h2>
          <p className="text-xs font-bold text-brand-dark/50 mt-0.5">กรอกข้อมูลผู้ติดต่อให้ครบก่อนบันทึกเข้าระบบ</p>
        </div>
      </div>

      <div className="space-y-4">
        <CorporateInput
          label="ชื่อลูกค้า / หน่วยงาน"
          placeholder="เช่น บริษัท แมน คอนแทค จำกัด"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <CorporateInput
          label="ชื่อผู้ติดต่อ"
          placeholder="เช่น คุณสมชาย ใจดี"
          value={formData.contact_name}
          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
        />

        <CorporateInput
          label="เบอร์โทรหลัก"
          placeholder="เช่น 081-234-5678"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <CorporateInput
          label="เบอร์สำรอง"
          placeholder="เช่น 02-123-4567"
          type="tel"
          value={formData.backup_phone}
          onChange={(e) => setFormData({ ...formData, backup_phone: e.target.value })}
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-widest text-brand-dark/60 ml-1">
            หมวดหมู่ที่จัดเก็บ
          </label>
          <NestedCategorySelect
            selectedId={formData.category_id || undefined}
            onSelect={(id) => setFormData({ ...formData, category_id: id })}
          />
        </div>

        <CorporateTextarea
          label="แผนที่ / สถานที่"
          placeholder="เช่น สาขาพร้อมพงษ์"
          className="min-h-[88px]"
          value={formData.map_location}
          onChange={(e) => setFormData({ ...formData, map_location: e.target.value })}
        />

        <CorporateInput
          label="ลิ้งแผนที่"
          placeholder="https://maps.google.com/..."
          type="url"
          value={formData.map_link}
          onChange={(e) => setFormData({ ...formData, map_link: e.target.value })}
        />

        <CorporateTextarea
          label="ข้อมูลเพิ่มเติม / หมายเหตุ"
          placeholder="รายละเอียดการติดต่อ เงื่อนไข หรือหมายเหตุเพิ่มเติม..."
          value={formData.details}
          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
        />
      </div>

      <div className="mt-4">
        <CorporateButton
          type="submit"
          fullWidth
          disabled={loading || !formData.name || !formData.category_id}
          className="shadow-none border-transparent font-bold tracking-wide"
        >
          {loading ? (
            <Loader2 className="animate-spin text-white mx-auto" size={20} />
          ) : success ? (
            'บันทึกข้อมูลเรียบร้อยแล้ว'
          ) : (
            'บันทึกรายชื่อลูกค้า'
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
