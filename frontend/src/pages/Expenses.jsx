import React, { useState, useEffect } from 'react';
import { Plus, Receipt, IndianRupee, PieChart, Filter, Calendar, X, Trash2, Edit2, Wallet } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [formData, setFormData] = useState(getInitialForm());

  const categories = [
    'Salary & Wages',
    'Fuel & Transport',
    'Electricity & Utilities',
    'Plant Maintenance & Repair',
    'Office Expenses',
    'Marketing & Promotion',
    'Miscellaneous'
  ];

  const paymentModes = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'];

  function getInitialForm() {
    return {
      id: null,
      date: new Date().toISOString().split('T')[0],
      title: '',
      category: 'Miscellaneous',
      amount: '',
      paymentMode: 'Cash',
      notes: ''
    };
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com';
      const [resExp, resPay, resCust] = await Promise.all([
        fetch(`${baseUrl}/api/expenses`),
        fetch(`${baseUrl}/api/customers/payments/all`),
        fetch(`${baseUrl}/api/customers`)
      ]);

      if (resPay.ok && resCust.ok) {
        const payments = await resPay.json();
        const customers = await resCust.json();
        const activeCustomerIds = new Set(customers.map(c => c._id));
        
        const received = payments
          .filter(p => p.type === 'PAYMENT' && activeCustomerIds.has(p.customerId))
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        setTotalReceived(received);
      }

      if (resExp.ok) {
        const data = await resExp.json();
        const formattedData = data.map(item => ({ ...item, id: item._id }));
        setExpenses(formattedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount) || 0;
    const payload = { ...formData, amount: amountVal };
    const isEdit = !!formData.id;

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com';
      const url = isEdit 
        ? `${baseUrl}/api/expenses/${formData.id}` 
        : `${baseUrl}/api/expenses`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        fetchExpenses();
        setIsModalOpen(false);
        setFormData(getInitialForm());
      } else {
        const errData = await response.json();
        alert('Failed to save expense: ' + errData.message);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Backend connection error');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this expense entry?')) {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com';
        const response = await fetch(`${baseUrl}/api/expenses/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchExpenses();
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  // Helper for month formatting "YYYY-MM"
  const getMonthStr = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonthStr = getMonthStr(new Date().toISOString());
  const todayStr = new Date().toISOString().split('T')[0];

  // Unique months for filter
  const uniqueMonths = [...new Set(expenses.map(e => getMonthStr(e.date)))].sort().reverse();

  // Stats calculation
  const currentMonthExpenses = expenses.filter(e => getMonthStr(e.date) === currentMonthStr);
  const totalMonthAmount = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const todayExpenses = expenses.filter(e => e.date === todayStr);
  const totalTodayAmount = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Balance calculation as requested
  const balanceAmount = totalReceived - totalMonthAmount;

  // Filtered List
  const filteredExpenses = expenses.filter(e => {
    const matchCategory = filterCategory === 'All' || e.category === filterCategory;
    const matchMonth = filterMonth === 'All' || getMonthStr(e.date) === filterMonth;
    return matchCategory && matchMonth;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expense Management</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage operational and factory expenses.</p>
        </div>
        <button 
          onClick={() => {
            setFormData(getInitialForm());
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg shadow-sm shadow-red-500/30 hover:shadow-md transition-all text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Received Money</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{totalReceived.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-red-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Expenses This Month</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{totalMonthAmount.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><IndianRupee className="w-6 h-6" /></div>
          </div>
        </div>
        
        <div className="glass-card p-6 border-l-4 border-l-orange-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Expenses Today</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{totalTodayAmount.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Receipt className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-purple-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Balance Amount</p>
              <h3 className={`text-3xl font-bold mt-2 ${balanceAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₹{balanceAmount.toLocaleString()}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${balanceAmount >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <PieChart className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <select 
          className="p-2 text-sm border border-slate-200 rounded-lg focus:ring-aquro-500 flex-1 sm:max-w-[200px]"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="All">All Months</option>
          {uniqueMonths.map(m => (
            <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}</option>
          ))}
        </select>
        <select 
          className="p-2 text-sm border border-slate-200 rounded-lg focus:ring-aquro-500 flex-1 sm:max-w-[200px]"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Expense Details</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No expenses found for the selected filters.</td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(expense.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{expense.title}</div>
                      {expense.notes && <div className="text-xs text-slate-500 mt-1 max-w-xs truncate">{expense.notes}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <Wallet className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {expense.paymentMode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-red-600">
                      ₹{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => { setFormData(expense); setIsModalOpen(true); }}
                        className="text-aquro-600 hover:text-aquro-900 mr-4"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{formData.id ? 'Edit Expense' : 'Add New Expense'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expense Title / Description *</label>
                  <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Diesel for Delivery Truck" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                  <input required type="number" min="1" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expense Category *</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})}>
                    {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes (Optional)</label>
                  <textarea className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any bill numbers, reference, etc." />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:shadow-md transition-all font-medium text-sm">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
