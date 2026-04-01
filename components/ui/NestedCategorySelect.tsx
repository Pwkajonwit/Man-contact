"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  children?: Category[];
}

interface NestedCategorySelectProps {
  onSelect: (categoryId: string) => void;
  selectedId?: string;
}

const CategoryItem = ({ 
  category, 
  level, 
  selectedId, 
  onSelect,
  expandedIds,
  toggleExpand
}: { 
  category: Category; 
  level: number; 
  selectedId?: string; 
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) => {
  const isSelected = selectedId === category.id;
  const isExpanded = expandedIds.has(category.id);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "group flex items-center gap-2 py-2 px-3 cursor-pointer transition-colors border-l-2",
          isSelected 
            ? "bg-brand-green/5 border-brand-green text-brand-dark font-bold" 
            : "hover:bg-brand-gray border-transparent text-brand-dark/70"
        )}
        style={{ paddingLeft: `${(level * 16) + 12}px` }}
        onClick={() => onSelect(category.id)}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(category.id);
          }}
          className={cn(
            "p-1 rounded hover:bg-brand-gray transition-opacity",
            !hasChildren && "opacity-0 pointer-events-none"
          )}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        
        <span className="flex-1 text-sm">{category.name}</span>
        
        {isSelected && <Check size={14} className="text-brand-green" />}
      </div>

      {isExpanded && hasChildren && category.children && category.children.map(child => (
        <CategoryItem 
          key={child.id} 
          category={child} 
          level={level + 1} 
          selectedId={selectedId} 
          onSelect={onSelect}
          expandedIds={expandedIds}
          toggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
};

const NestedCategorySelect: React.FC<NestedCategorySelectProps> = ({ onSelect, selectedId }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const allCats: Category[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Category));

        // Build hierarchy
        const buildTree = (parentId: string | null): Category[] => {
          return allCats
            .filter(cat => cat.parent_id === parentId)
            .map(cat => ({
              ...cat,
              children: buildTree(cat.id)
            }));
        };

        setCategories(buildTree(null));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return (
    <div className="animate-pulse space-y-2 p-4 border border-brand-gray rounded-md bg-brand-white">
      <div className="h-4 bg-brand-gray rounded w-3/4"></div>
      <div className="h-4 bg-brand-gray rounded w-1/2"></div>
      <div className="h-4 bg-brand-gray rounded w-2/3"></div>
    </div>
  );

  return (
    <div className="bg-brand-white border border-brand-gray rounded-md overflow-hidden flex flex-col max-h-[300px] overflow-y-auto">
      <div className="bg-brand-gray/50 px-4 py-2 border-b border-brand-gray">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/50">Select Category</span>
      </div>
      <div className="py-2">
        {categories.length > 0 ? categories.map(cat => (
          <CategoryItem 
            key={cat.id} 
            category={cat} 
            level={0} 
            selectedId={selectedId} 
            onSelect={onSelect}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
          />
        )) : (
          <div className="p-4 text-center text-brand-dark/40 text-xs italic">No categories found</div>
        )}
      </div>
    </div>
  );
};

export default NestedCategorySelect;
