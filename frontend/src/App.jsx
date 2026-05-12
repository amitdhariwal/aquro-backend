import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Production from './pages/Production';
import Inventory from './pages/Inventory';
import Dispatch from './pages/Dispatch';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import WaterQuality from './pages/WaterQuality';
import ReadyStock from './pages/ReadyStock';
import Suppliers from './pages/Suppliers';
import Login from './pages/Login';

// Intercept fetch to prevent viewers from modifying data
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const role = localStorage.getItem('userRole');
  const [resource, config] = args;
  
  if (role === 'viewer' && config && ['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase())) {
    alert("Access Denied: Viewers cannot add, edit, or delete records. Only Akash Gupta (Admin) can make changes.");
    return Promise.reject(new Error("Viewer access denied"));
  }
  return originalFetch.apply(this, args);
};

function Layout({ children, setIsAuthenticated }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} setIsAuthenticated={setIsAuthenticated} />
      <div className="flex flex-col flex-1 w-full h-full min-w-0">
        <Navbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-aquro-50/50 to-white/20 pointer-events-none -z-10" />
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('aquro_auth') === 'true';
  });

  const handleSetAuth = (status) => {
    setIsAuthenticated(status);
    if (status) {
      localStorage.setItem('aquro_auth', 'true');
    } else {
      localStorage.removeItem('aquro_auth');
      localStorage.removeItem('userRole');
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={handleSetAuth} />} />
        
        {/* Protected Routes */}
        <Route path="/*" element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={handleSetAuth}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/production" element={<Production />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/dispatch" element={<Dispatch />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/quality" element={<WaterQuality />} />
                <Route path="/readystock" element={<ReadyStock />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
