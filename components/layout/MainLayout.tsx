"use client";

import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-brand-gray text-brand-dark flex font-sans selection:bg-brand-green/20 overflow-x-hidden">
      {/* PC View Sidebar: Fixed on the left for md and up */}
      <Sidebar />

      {/* Main Content Area: Offset by sidebar width on md and up */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
