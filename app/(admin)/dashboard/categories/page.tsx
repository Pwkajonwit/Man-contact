"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import CorporateCard from '@/components/ui/CorporateCard';
import CorporateInput from '@/components/ui/CorporateInput';
import CorporateButton from '@/components/ui/CorporateButton';
import { Plus, Trash2, ChevronRight, Layers, FolderPlus, Loader2, Edit2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

const sortByName = (a: { name: string }, b: { name: string }) => {
  return a.name.localeCompare(b.name, 'th', {
    sensitivity: 'accent',
    numeric: true,
  });
};

const CategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [parentSelection, setParentSelection] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newName,
        parent_id: parentSelection
      });
      setNewName('');
      setParentSelection(null);
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await updateDoc(doc(db, 'categories', id), { name: editName });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่? การลบนี้จะไม่ลบหมวดหมู่ย่อยโดยอัตโนมัติ แต่หมวดหมู่ย่อยจะหลุดจากโครงสร้าง")) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  const renderCategoryTree = (parentId: string | null, level = 0) => {
    const children = categories
      .filter((c) => c.parent_id === parentId)
      .sort(sortByName);
    if (children.length === 0 && level > 0) return null;

    return (
      <div className={cn("space-y-1", level > 0 && "ml-6 mt-1 border-l border-brand-gray pl-4")}>
        {children.map(cat => (
          <div key={cat.id} className="group">
            <div className="flex items-center justify-between p-2 hover:bg-brand-gray/50 rounded-md transition-colors border border-transparent hover:border-brand-gray">
               <div className="flex items-center gap-2 flex-1">
                <ChevronRight size={14} className="text-brand-dark/40" />
                {editingId === cat.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input 
                      autoFocus
                      className="text-sm font-bold bg-white border border-brand-green px-2 py-0.5 rounded outline-none w-full max-w-[200px]"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(cat.id)}
                    />
                    <button onClick={() => handleRename(cat.id)} className="text-brand-green"><Check size={16} /></button>
                    <button onClick={() => setEditingId(null)} className="text-red-500"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium leading-normal text-brand-dark">{cat.name}</span>
                    <span className="text-[10px] text-brand-dark/20 uppercase font-bold ml-2 tracking-widest">ID: {cat.id.substring(0,5)}</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!editingId && (
                  <>
                    <button 
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      className="p-1 hover:text-brand-green text-brand-dark/40 transition-colors"
                      title="เปลี่ยนชื่อ"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setParentSelection(cat.id)}
                      className="p-1 hover:text-brand-green text-brand-dark/40 transition-colors"
                      title="เพิ่มหมวดหมู่ย่อย"
                    >
                      <FolderPlus size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-1 hover:text-red-500 text-brand-dark/40 transition-colors"
                      title="ลบหมวดหมู่"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {renderCategoryTree(cat.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 border-b border-brand-gray pb-4">
        <div>
           <h1 className="text-3xl font-black text-brand-dark tracking-tighter flex items-center gap-3">
            <Layers className="text-brand-green" /> จัดการหมวดหมู่
          </h1>
          <p className="text-sm text-brand-dark/50 font-bold mt-1">จัดการโครงสร้างและแผนกขององค์กร</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
           <CorporateCard className="sticky top-8 border border-brand-border/60">
            <form onSubmit={handleAdd} className="space-y-4">
              <h3 className="text-sm font-black tracking-wide text-brand-dark flex items-center gap-2">
                <Plus size={16} className="text-brand-green" />
                {parentSelection ? "เพิ่มหมวดหมู่ย่อย" : "สร้างหมวดหมู่หลัก"}
              </h3>
              
              {parentSelection && (
                 <div className="p-3 bg-brand-green/5 border border-brand-green/20 rounded-md flex items-center justify-between">
                  <div className="text-[10px] font-bold text-brand-green tracking-wide truncate">
                    ภายใต้: {categories.find(c => c.id === parentSelection)?.name}
                  </div>
                  <button type="button" onClick={() => setParentSelection(null)} className="text-[10px] font-bold text-brand-dark/40 hover:text-brand-dark pl-2">ยกเลิก</button>
                </div>
              )}

              <CorporateInput 
                label="ชื่อหมวดหมู่ใหม่" 
                placeholder="เช่น การตลาด, ไอที..." 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />

              <CorporateButton type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin text-white" /> : "บันทึกหมวดหมู่"}
              </CorporateButton>
            </form>
          </CorporateCard>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-brand-gray px-6 py-4 border-b border-brand-border flex justify-between items-center">
              <span className="text-[11px] font-black tracking-widest text-brand-dark/60">โครงสร้างหมวดหมู่ปัจจุบัน</span>
              <span className="text-[11px] font-black text-brand-green tracking-wide">ทั้งหมด {categories.length} รายการ</span>
            </div>
            <div className="p-6 min-h-[500px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-brand-dark/40 animate-pulse gap-3">
                  <Loader2 className="animate-spin text-brand-green" size={32} />
                  <span className="text-xs font-bold tracking-widest uppercase">กำลังโหลดข้อมูล...</span>
                </div>
              ) : categories.length > 0 ? (
                renderCategoryTree(null)
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-brand-dark/20 text-center">
                  <Layers size={64} strokeWidth={1} className="mb-4" />
                  <span className="text-sm font-black tracking-widest">ยังไม่มีหมวดหมู่ในระบบ</span>
                  <p className="text-[10px] mt-2 font-bold text-brand-dark/40 tracking-wider">สร้างหมวดหมู่หลักด้านซ้ายมือเพื่อเริ่มต้นโครงสร้าง</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
