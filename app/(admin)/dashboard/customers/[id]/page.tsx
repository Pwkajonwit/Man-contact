"use client";

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import CorporateInput from '@/components/ui/CorporateInput';
import CorporateTextarea from '@/components/ui/CorporateTextarea';
import CorporateButton from '@/components/ui/CorporateButton';
import CorporateCard from '@/components/ui/CorporateCard';
import NestedCategorySelect from '@/components/ui/NestedCategorySelect';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, UserCheck, Loader2 } from 'lucide-react';

const EditCustomerPage = () => {
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
          router.push('/dashboard/customers');
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
      // Auto-hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating customer:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-brand-green" size={48} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <CorporateButton 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/dashboard/customers')}
          className="p-2 min-w-0"
        >
          <ArrowLeft size={16} />
        </CorporateButton>
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">Edit Customer Profile</h1>
          <p className="text-xs text-brand-dark/50 font-bold uppercase tracking-widest">Instance UID: {id}</p>
        </div>
      </div>

      <CorporateCard className="bg-brand-white p-8 relative overflow-hidden">
        {showSuccess && (
          <div className="absolute top-0 left-0 right-0 p-3 bg-brand-green text-brand-white text-center text-xs font-black uppercase tracking-[.2em] animate-in slide-in-from-top duration-300">
             Saved Successfully - Data Instance Sync Verified
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-brand-green/10 rounded-md">
              <UserCheck size={20} className="text-brand-green" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-dark/60">Customer Data Control</span>
          </div>

          <div className="space-y-4">
            <CorporateInput
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <CorporateInput
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-dark/60 ml-1">
                Category Hierarchy
              </label>
              <NestedCategorySelect
                selectedId={formData.category_id}
                onSelect={(id) => setFormData({ ...formData, category_id: id })}
              />
            </div>

            <CorporateTextarea
              label="Additional Details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </div>

          <div className="mt-8 flex gap-3">
            <CorporateButton
              type="submit"
              fullWidth
              disabled={saving}
              className="gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Commit Changes
            </CorporateButton>
            <CorporateButton
              variant="outline"
              type="button"
              onClick={() => router.push('/dashboard/customers')}
              className="px-8"
            >
              Cancel
            </CorporateButton>
          </div>
        </form>
      </CorporateCard>
    </div>
  );
};

export default EditCustomerPage;
