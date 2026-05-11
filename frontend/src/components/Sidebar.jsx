import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Droplet, 
  Package, 
  Truck, 
  Users, 
  Receipt, 
  BarChart3, 
  TestTube, 
  Settings,
  LogOut,
  X,
  Layers,
  Briefcase
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Production', to: '/production', icon: Droplet },
  { name: 'Inventory', to: '/inventory', icon: Package },
  { name: 'Ready Stock', to: '/readystock', icon: Layers },
  { name: 'Dispatch', to: '/dispatch', icon: Truck },
  { name: 'Customers', to: '/customers', icon: Users },
  { name: 'Suppliers', to: '/suppliers', icon: Briefcase },
  { name: 'Expenses', to: '/expenses', icon: Receipt },
  { name: 'Reports', to: '/reports', icon: BarChart3 },
  { name: 'Water Quality', to: '/quality', icon: TestTube },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen, setIsAuthenticated }) {
  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-white/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white shadow-md">
          <div className="flex items-center gap-2">
            <Droplet className="w-8 h-8 fill-white/20" />
            <span className="text-xl font-bold tracking-wider">AQURO</span>
          </div>
          <button className="lg:hidden text-white hover:text-white/80" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-aquro-500 to-aquro-400 text-white shadow-md shadow-aquro-500/30'
                    : 'text-slate-600 hover:bg-white/60 hover:text-aquro-600'
                }`
              }
            >
              <item.icon className={`w-5 h-5 mr-3 transition-colors ${'group-hover:text-aquro-600'}`} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200/50">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center w-full px-3 py-2.5 text-slate-600 rounded-lg hover:bg-white/60 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:text-red-600 transition-colors" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
