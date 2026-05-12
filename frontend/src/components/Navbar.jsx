import React, { useState } from 'react';
import { Menu, Bell, Search, User, X } from 'lucide-react';

export default function Navbar({ setSidebarOpen }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ oldPass: '', newPass: '' });
  const [msg, setMsg] = useState('');

  const username = localStorage.getItem('username') || 'Admin User';
  const role = localStorage.getItem('userRole') || 'Plant Manager';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg('Updating...');
    try {
      // Temporarily bypass the App.jsx interceptor by using XMLHttpRequest or just rely on backend route allowing it?
      // Wait, the App.jsx interceptor blocks POST/PUT/DELETE for viewers!
      // I should allow POST to /api/auth/change-password for viewers in App.jsx.
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           username, 
           oldPassword: passwords.oldPass, 
           newPassword: passwords.newPass 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Password updated successfully!');
        setTimeout(() => { setShowPasswordModal(false); setMsg(''); setPasswords({ oldPass:'', newPass:''}); }, 2000);
      } else {
        setMsg(data.message || 'Error updating password');
      }
    } catch (err) {
      setMsg('Server error');
    }
  };

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
        
        <div 
          className="flex items-center gap-3 pl-4 border-l border-slate-200/50 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
          onClick={() => setShowPasswordModal(true)}
        >
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-slate-700 capitalize">{username}</p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-aquro-500 to-aquro-300 p-0.5 shadow-sm">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-aquro-600" />
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {msg && (
                <div className={`p-3 rounded-lg text-sm text-center ${msg.includes('success') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {msg}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwords.oldPass}
                  onChange={e => setPasswords({...passwords, oldPass: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-aquro-500 focus:border-aquro-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwords.newPass}
                  onChange={e => setPasswords({...passwords, newPass: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-aquro-500 focus:border-aquro-500"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
