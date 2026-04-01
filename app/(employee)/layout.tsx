"use client";

import React from 'react';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans antialiased text-slate-900 selection:bg-[#7DBE5C]/30 overflow-x-hidden">
      {/* 
        Full Screen Layout for Employee App 
        No sidebars, no max-width constraints. 
      */}
      <main className="min-h-screen relative">
        {children}
      </main>
    </div>
  );
}
