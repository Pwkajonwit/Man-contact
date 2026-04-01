"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, Settings, LogOut, LucideIcon, Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const Sidebar = () => {
  const pathname = usePathname();
  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'แดชบอร์ด', href: '/dashboard' },
    { icon: Users, label: 'รายชื่อลูกค้า', href: '/dashboard/customers' },
    { icon: Layers, label: 'จัดการหมวดหมู่', href: '/dashboard/categories' },
    { icon: UserCircle, label: 'พนักงาน', href: '/dashboard/employees' },
    { icon: Settings, label: 'ตั้งค่าระบบ', href: '/dashboard/settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen bg-brand-white border-r border-[#E2E8F0] fixed left-0 top-0 shadow-[2px_0_12px_rgba(0,0,0,0.02)]">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-green-light to-brand-green rounded-lg flex items-center justify-center shadow-md">
            <Layers size={20} className="text-brand-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-brand-dark tracking-tighter leading-none">POWERTECH</h1>
            <p className="text-[8px] font-black uppercase tracking-[.25em] text-brand-green mt-0.5">Enterprise</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-2">
        <div className="px-3 mb-3">
          <span className="text-[11px] font-black tracking-widest text-brand-dark/50">เมนูหลัก</span>
        </div>

        {menuItems.map(({ icon: Icon, ...item }) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-brand-green/10 text-brand-green shadow-[inset_0_0_0_1px_rgba(125,190,92,0.2)]'
                  : 'text-brand-dark/70 hover:bg-brand-gray hover:text-brand-dark'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={cn(isActive ? 'text-brand-green' : 'text-brand-dark/50 group-hover:text-brand-dark')} />
                <span className={cn('text-[13px] font-black tracking-wide', isActive ? 'opacity-100' : 'opacity-90')}>
                  {item.label}
                </span>
              </div>
              {isActive && <ChevronRight size={12} strokeWidth={3} />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-[#F8F9FA] rounded-xl p-3 border border-[#E2E8F0]">
          <button className="flex items-center gap-3 w-full text-brand-dark/60 hover:text-red-500 transition-colors group">
            <LogOut size={16} strokeWidth={2.5} />
            <span className="text-[12px] font-black tracking-wide">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
