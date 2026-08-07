import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function AdminLayout() {
  return (
    <div dir="rtl" className="min-h-screen bg-admin-bg flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
