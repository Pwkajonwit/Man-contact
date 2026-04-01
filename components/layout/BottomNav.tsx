import React from 'react';
import Link from 'next/link';
import { Home, PlusSquare, User, LogOut } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { icon: Home, label: 'หน้าหลัก', href: '/home' },
    { icon: User, label: 'โปรไฟล์', href: '/home/profile' },
    { icon: LogOut, label: 'ออกจากระบบ', href: '/api/auth/logout' },
  ];

  return (
    <nav className="md:hidden fixed bottom-1 left-0 right-0 z-50 bg-brand-white border-t border-brand-gray px-4 py-2 flex items-center justify-around h-16">
      {navItems.map(({ icon: Icon, ...item }) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center justify-center gap-1 group"
        >
          <Icon
            size={24}
            className="text-brand-dark group-hover:text-brand-green transition-colors"
          />
          <span className="text-[10px] font-bold text-brand-dark group-hover:text-brand-green">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
