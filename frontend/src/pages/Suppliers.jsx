import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Phone, User, Store, X, Edit2, Trash2, Package, Clock, ArrowDownRight, ArrowUpRight, Truck, Download, Briefcase } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierPurchases, setSupplierPurchases] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ date: '', amount: '', note: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(getInitialForm());

  const categories = ['Plastic Vendor', 'Label Printer', 'Box Manufacturer', 'Chemicals & RO Parts', 'Other'];

  function getInitialForm() {
    return {
      id: null,
      businessName: '',
      category: 'Plastic Vendor',
      contactPerson: '',
      mobile: '',
      gstNumber: '',
      address: '',
    };
  }

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('https://aquro-backend-api.onrender.com/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map(item => ({ ...item, id: item._id }));
        setSuppliers(formattedData);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const openSupplierLedger = async (supplier) => {
    setSelectedSupplier(supplier);
    
    // Load purchases from inventory history
    try {
      const resInv = await fetch('https://aquro-backend-api.onrender.com/api/inventory/history');
      if (resInv.ok) {
        const allHistory = await resInv.json();
        const filtered = allHistory.filter(h => h.supplier && h.supplier.toLowerCase() === supplier.businessName.toLowerCase());
        setSupplierPurchases(filtered);
      } else {
        setSupplierPurchases([]);
      }
    } catch (e) {
      console.error(e);
      setSupplierPurchases([]);
    }

    // Load payments
    fetchSupplierPayments(supplier.id);
    
    setPaymentForm({ date: new Date().toISOString().split('T')[0], amount: '', note: '' });
  };

  const fetchSupplierPayments = async (supplierId) => {
    try {
      const resPay = await fetch(`https://aquro-backend-api.onrender.com/api/suppliers/${supplierId}/payments`);
      if (resPay.ok) {
        const allPayments = await resPay.json();
        setSupplierPayments(allPayments);
      } else {
        setSupplierPayments([]);
      }
    } catch (e) {
      console.error(e);
      setSupplierPayments([]);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const entry = {
      date: new Date(paymentForm.date).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'PAYMENT',
      amount: parseFloat(paymentForm.amount) || 0,
      note: paymentForm.note
    };

    try {
      const response = await fetch(`https://aquro-backend-api.onrender.com/api/suppliers/${selectedSupplier.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      if (response.ok) {
        fetchSupplierPayments(selectedSupplier.id);
        setPaymentForm({ date: new Date().toISOString().split('T')[0], amount: '', note: '' });
      }
    } catch (error) {
      console.error(error);
      alert('Failed to add payment');
    }
  };

  const downloadPDF = () => {
    const totalBilled = supplierPurchases.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const totalPaid = supplierPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = totalBilled - totalPaid;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Supplier Ledger - ${selectedSupplier.businessName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; color: #0284c7; font-size: 32px; font-weight: 900; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 14px; color: #64748b; font-weight: 500; }
            .flex-container { display: flex; justify-content: space-between; margin-bottom: 25px; }
            .supplier-details h3 { margin: 0 0 10px 0; font-size: 18px; color: #0f172a; }
            .supplier-details p { margin: 4px 0; font-size: 14px; color: #475569; }
            .summary-box { display: flex; justify-content: space-between; background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 30px; }
            .summary-item { text-align: center; flex: 1; }
            .summary-item:not(:last-child) { border-right: 1px solid #e2e8f0; }
            .summary-item h4 { margin: 0 0 5px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .summary-item p { margin: 0; font-size: 20px; font-weight: bold; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: 600; color: #334155; }
            .text-right { text-align: right; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #0f172a; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AQURO WATER</h1>
            <p>Supplier Account Statement</p>
          </div>
          
          <div class="flex-container">
            <div class="supplier-details">
              <h3>${selectedSupplier.businessName}</h3>
              <p><strong>Contact Person:</strong> ${selectedSupplier.contactPerson}</p>
              <p><strong>Mobile:</strong> ${selectedSupplier.mobile}</p>
              <p><strong>GST Number:</strong> ${selectedSupplier.gstNumber}</p>
              <p><strong>Address:</strong> ${selectedSupplier.address}</p>
            </div>
            <div class="supplier-details" style="text-align: right;">
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</p>
            </div>
          </div>

          <div class="summary-box">
            <div class="summary-item">
              <h4>Total Purchased</h4>
              <p>₹${totalBilled.toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h4>Total Paid</h4>
              <p>₹${totalPaid.toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h4>Pending Balance</h4>
              <p style="color: ${pending > 0 ? '#ef4444' : '#10b981'}">₹${pending.toLocaleString()}</p>
            </div>
          </div>

          <div class="section-title">Purchase & Payment History</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Details</th>
                <th class="text-right">Debit (Purchased)</th>
                <th class="text-right">Credit (Paid)</th>
              </tr>
            </thead>
            <tbody>
              ${[...supplierPurchases.map(d => ({ ...d, isPurchase: true })), ...supplierPayments.map(p => ({ ...p, isPurchase: false }))]
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(item => `
                  <tr>
                    <td>${item.date}</td>
                    <td><strong>${item.isPurchase ? 'PURCHASE' : 'PAYMENT'}</strong></td>
                    <td>${item.isPurchase ? 'Stock Added: ' + item.itemName + ' (' + item.addedQty + ' pcs)<br/><small>' + (item.notes || '') + '</small>' : item.note || 'Cash/Bank Transfer'}</td>
                    <td class="text-right">${item.isPurchase ? '₹' + (item.amount || 0).toLocaleString() : '-'}</td>
                    <td class="text-right">${!item.isPurchase ? '₹' + (item.amount || 0).toLocaleString() : '-'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8;">
            This is a computer generated statement and does not require a physical signature.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isEdit = !!formData.id;
    
    try {
      const url = isEdit 
        ? `https://aquro-backend-api.onrender.com/api/suppliers/${formData.id}` 
        : 'https://aquro-backend-api.onrender.com/api/suppliers';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchSuppliers();
        setIsModalOpen(false);
        setFormData(getInitialForm());
      } else {
        const errData = await response.json();
        alert('Failed to save supplier: ' + errData.message);
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Backend connection error');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const response = await fetch(`https://aquro-backend-api.onrender.com/api/suppliers/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchSuppliers();
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.mobile.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Supplier Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage vendor accounts, ledger balances, and contact details.</p>
        </div>
        <button 
          onClick={() => {
            setFormData(getInitialForm());
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg shadow-sm shadow-aquro-500/30 hover:shadow-md transition-all text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Search suppliers by name, person or mobile..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 bg-slate-50 focus:bg-white transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">GST No.</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No suppliers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openSupplierLedger(supplier)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-aquro-100 text-aquro-600 rounded-lg flex items-center justify-center font-bold text-lg">
                          {supplier.businessName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-800">{supplier.businessName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {supplier.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">{supplier.contactPerson}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {supplier.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-700">
                        {supplier.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {supplier.gstNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFormData(supplier); setIsModalOpen(true); }}
                        className="text-aquro-600 hover:text-aquro-900 mr-4"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id); }}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{formData.id ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business/Company Name *</label>
                  <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="e.g. ABC Plastics Ltd." />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Category</label>
                  <select className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                  <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 uppercase" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})} placeholder="e.g. 09AABBCCDD123Z5" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person Name *</label>
                  <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} placeholder="e.g. Suresh Kumar" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                  <input required type="tel" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="10-digit mobile number" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
                  <textarea className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500" rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Enter complete business address" />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg hover:shadow-md transition-all font-medium text-sm">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden relative max-h-[95vh] flex flex-col">
            <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-aquro-500 to-aquro-300 flex items-center justify-center text-white shadow-sm font-bold text-2xl">
                  {selectedSupplier.businessName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedSupplier.businessName}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-slate-500 flex items-center gap-1"><User className="w-4 h-4"/> {selectedSupplier.contactPerson}</span>
                    <span className="text-sm text-slate-500 flex items-center gap-1"><Phone className="w-4 h-4"/> {selectedSupplier.mobile}</span>
                    {selectedSupplier.gstNumber && <span className="text-sm font-semibold text-slate-500 flex items-center gap-1"><Briefcase className="w-4 h-4"/> GST: {selectedSupplier.gstNumber}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={downloadPDF} className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
                  <Download className="w-4 h-4" /> Download Statement
                </button>
                <button onClick={() => setSelectedSupplier(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Package className="w-12 h-12" /></div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Total Purchased</p>
                    <h3 className="text-2xl font-bold text-slate-800">
                      ₹{supplierPurchases.reduce((sum, d) => sum + Number(d.amount || 0), 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><ArrowDownRight className="w-12 h-12" /></div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Total Paid</p>
                    <h3 className="text-2xl font-bold text-emerald-600">
                      ₹{supplierPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Clock className="w-12 h-12" /></div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Pending Balance</p>
                    <h3 className={`text-2xl font-bold ${supplierPurchases.reduce((sum, d) => sum + Number(d.amount || 0), 0) - supplierPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0) > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                      ₹{(supplierPurchases.reduce((sum, d) => sum + Number(d.amount || 0), 0) - supplierPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)).toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-800">Purchase & Payment Ledger</h3>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Debit (Owed)</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit (Paid)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {[...supplierPurchases.map(d => ({ ...d, isPurchase: true })), ...supplierPayments.map(p => ({ ...p, isPurchase: false }))]
                          .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort newest first
                          .map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{item.date}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${item.isPurchase ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {item.isPurchase ? 'PURCHASE' : 'PAYMENT'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-800">
                                {item.isPurchase ? (
                                  <div>
                                    <span className="font-medium">{item.itemName} (+{item.addedQty} pcs)</span>
                                    {item.notes && <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>}
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-medium">Payment Made</span>
                                    {item.note && <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-red-500">
                                {item.isPurchase ? `₹${(item.amount || 0).toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-emerald-600">
                                {!item.isPurchase ? `₹${(item.amount || 0).toLocaleString()}` : '-'}
                              </td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-0">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" /> Make Payment to Supplier
                  </h3>
                  <form onSubmit={handleAddPayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                      <input type="date" required className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount Paid (₹)</label>
                      <input type="number" required min="1" className="w-full p-2 border border-slate-200 rounded-lg text-xl font-bold focus:ring-aquro-500" placeholder="0.00" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reference / Note</label>
                      <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500" placeholder="e.g. Bank Transfer Ref / Cash" value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-sm shadow-emerald-500/30 transition-all text-sm">
                      Submit Payment Entry
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
