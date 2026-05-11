import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';

export default function Navbar({ setSidebarOpen }) {
  return (
    <header className="h-16 glass-panel border-b border-white/50 flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-2 mr-2 text-slate-600 hover:text-aquro-600 hover:bg-white/50 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden md:flex items-center bg-white/60 border border-slate-200/50 rounded-full px-4 py-2 w-80 shadow-sm focus-within:ring-2 focus-within:ring-aquro-500/20 focus-within:border-aquro-300 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-aquro-600 transition-colors rounded-full hover:bg-white/50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200/50">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-slate-700">Admin User</p>
            <p className="text-xs text-slate-500">Plant Manager</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-aquro-500 to-aquro-300 p-0.5 shadow-sm">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-aquro-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
