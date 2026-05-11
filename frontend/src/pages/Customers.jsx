import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Phone, User, Store, Image as ImageIcon, X, Edit2, Trash2, Package, Clock, ArrowDownRight, ArrowUpRight, Truck, Download } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // For ledger modal
  const [customerDispatches, setCustomerDispatches] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ date: '', type: 'PAYMENT', bottles: '', amount: '', note: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [formData, setFormData] = useState(getInitialForm());
  const [previewImage, setPreviewImage] = useState(null);

  const blocks = ['Amroha', 'Joya', 'Hasanpur', 'Gajraula', 'Dhanora', 'Naugawan Sadat'];
  const categories = ['Shop', 'Restaurant', 'Banquet Hall', 'Hotel', 'College', 'University', 'Corporate Office', 'Other'];

  function getInitialForm() {
    return {
      id: null,
      businessName: '',
      category: 'Shop',
      ownerName: '',
      mobile: '',
      state: 'Uttar Pradesh',
      district: 'Amroha',
      block: 'Amroha',
      address: '',
      image: null
    };
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customers');
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map(item => ({ ...item, id: item._id }));
        setCustomers(formattedData);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const openCustomerLedger = async (customer) => {
    setSelectedCustomer(customer);
    
    // Load deliveries
    try {
      const resDisp = await fetch('http://localhost:5000/api/dispatches');
      if (resDisp.ok) {
        const allDispatches = await resDisp.json();
        const filtered = allDispatches.filter(d => d.customer === customer.businessName);
        setCustomerDispatches(filtered);
      } else {
        setCustomerDispatches([]);
      }
    } catch (e) {
      console.error(e);
      setCustomerDispatches([]);
    }

    // Load payments/ledger
    fetchCustomerPayments(customer.id);
    
    setPaymentForm({ date: new Date().toISOString().split('T')[0], type: 'PAYMENT', bottles: '', amount: '', note: '' });
  };

  const fetchCustomerPayments = async (customerId) => {
    try {
      const resPay = await fetch(`http://localhost:5000/api/customers/${customerId}/payments`);
      if (resPay.ok) {
        const allPayments = await resPay.json();
        setCustomerPayments(allPayments);
      } else {
        setCustomerPayments([]);
      }
    } catch (e) {
      console.error(e);
      setCustomerPayments([]);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const entry = {
      date: paymentForm.date,
      type: paymentForm.type, // 'PAYMENT' or 'BILL'
      amount: parseFloat(paymentForm.amount) || 0,
      note: paymentForm.note
    };

    try {
      const response = await fetch(`http://localhost:5000/api/customers/${selectedCustomer.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      if (response.ok) {
        fetchCustomerPayments(selectedCustomer.id);
        setPaymentForm({ date: new Date().toISOString().split('T')[0], type: 'PAYMENT', amount: '', note: '' });
      }
    } catch (error) {
      console.error(error);
      alert('Failed to add payment');
    }
  };

  const downloadPDF = () => {
    const totalBilled = customerDispatches.reduce((sum, d) => sum + Number(d.totalAmount || 0), 0);
    const totalPaid = customerPayments.filter(p => p.type === 'PAYMENT').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = totalBilled - totalPaid;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Statement - ${selectedCustomer.businessName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; color: #0284c7; font-size: 32px; font-weight: 900; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 14px; color: #64748b; font-weight: 500; }
            .flex-container { display: flex; justify-content: space-between; margin-bottom: 25px; }
            .customer-details h3 { margin: 0 0 10px 0; font-size: 18px; color: #0f172a; }
            .customer-details p { margin: 4px 0; font-size: 14px; color: #475569; }
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
            <p>Customer Account Statement</p>
          </div>
          
          <div class="flex-container">
            <div class="customer-details">
              <h3>${selectedCustomer.businessName}</h3>
              <p><strong>Owner:</strong> ${selectedCustomer.ownerName}</p>
              <p><strong>Mobile:</strong> ${selectedCustomer.mobile}</p>
              <p><strong>Address:</strong> ${selectedCustomer.address}, ${selectedCustomer.block}, ${selectedCustomer.district}</p>
            </div>
            <div class="customer-details" style="text-align: right;">
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</p>
            </div>
          </div>

          <div class="summary-box">
            <div class="summary-item">
              <h4>Total Billed</h4>
              <p>Rs. ${totalBilled}</p>
            </div>
            <div class="summary-item">
              <h4>Total Paid</h4>
              <p>Rs. ${totalPaid}</p>
            </div>
            <div class="summary-item">
              <h4>Pending Balance</h4>
              <p style="color: #ea580c;">Rs. ${pending}</p>
            </div>
          </div>

          <div class="section-title">Delivery History</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Challan No.</th>
                <th>Item Details</th>
                <th class="text-right">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              ${customerDispatches.length === 0 ? '<tr><td colspan="4" style="text-align:center; color: #94a3b8;">No deliveries found</td></tr>' : ''}
              ${customerDispatches.map(d => `
                <tr>
                  <td>${d.date}</td>
                  <td>${d.challan}</td>
                  <td>${d.boxes} Boxes of ${d.size} (@ Rs.${d.rate}/box)</td>
                  <td class="text-right">${d.totalAmount || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Payment History</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Remarks / Reference</th>
                <th class="text-right">Amount Paid (Rs)</th>
              </tr>
            </thead>
            <tbody>
              ${customerPayments.length === 0 ? '<tr><td colspan="3" style="text-align:center; color: #94a3b8;">No payments found</td></tr>' : ''}
              ${customerPayments.slice().reverse().map(p => `
                <tr>
                  <td>${p.date}</td>
                  <td>${p.note || 'Cash Payment'}</td>
                  <td class="text-right">${p.amount || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            This is a computer generated report from Aquro Management System.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setFormData(item);
      setPreviewImage(item.image);
    } else {
      setFormData(getInitialForm());
      setPreviewImage(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!formData.id;
    
    try {
      const url = isEdit 
        ? `http://localhost:5000/api/customers/${formData.id}` 
        : 'http://localhost:5000/api/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchCustomers();
        setIsModalOpen(false);
      } else {
        const errorData = await response.json();
        alert('Failed to save customer: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to connect to the backend server. Is it running?');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/customers/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchCustomers();
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const filtered = customers.filter(c => {
    const matchesSearch = c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.mobile.includes(searchQuery);
    const matchesCategory = filterCategory === 'All' || (c.category || 'Shop') === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Customer Ledger</h1>
            <span className="px-2.5 py-0.5 bg-aquro-100 text-aquro-700 text-xs font-bold rounded-full border border-aquro-200">
              {filtered.length} {filtered.length === 1 ? 'Customer' : 'Customers'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Manage client accounts, hotel & shop details.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="px-4 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg shadow-sm shadow-aquro-500/30 hover:shadow-md transition-all text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Customer
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Search by business, owner or mobile..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-aquro-500 focus:border-aquro-500 bg-white/50 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <div className="relative">
          <select
            className="w-full sm:w-48 pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-aquro-500 focus:border-aquro-500 bg-white/50 shadow-sm appearance-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">No customers found.</td>
                </tr>
              ) : (
                filtered.map(customer => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => openCustomerLedger(customer)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center">
                          {customer.image ? (
                            <img src={customer.image} alt="" className="h-10 w-10 object-cover" />
                          ) : (
                            <Store className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900">{customer.businessName}</div>
                          <div className="text-xs text-aquro-600 bg-aquro-50 inline-block px-2 py-0.5 rounded mt-1 border border-aquro-100 font-medium">
                            {customer.category || 'Shop'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-900 mb-1">
                        <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {customer.ownerName}
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {customer.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start text-sm text-slate-600 max-w-xs">
                        <MapPin className="w-4 h-4 mr-1.5 text-slate-400 shrink-0 mt-0.5" /> 
                        <span className="line-clamp-2">{customer.address}, {customer.block}, {customer.district}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(customer); }} 
                          className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(customer.id, customer.businessName); }} 
                          className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">{formData.id ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="customerForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Photo Upload Section */}
                <div className="flex items-center gap-6">
                  <div className="shrink-0">
                    {previewImage ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => {setPreviewImage(null); setFormData({...formData, image: null})}}
                          className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-medium">Logo/Photo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload Shop Photo or Logo</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-aquro-50 file:text-aquro-700 hover:file:bg-aquro-100"
                    />
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB recommended.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business/Shop Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      placeholder="e.g. Taj Hotel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                      placeholder="e.g. Rahul Verma"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      required
                      pattern="[0-9]{10}"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      placeholder="10 digit mobile number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input 
                      type="text" 
                      readOnly
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                      value={formData.state}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                    <input 
                      type="text" 
                      readOnly
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                      value={formData.district}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Block / Tehsil <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.block}
                      onChange={(e) => setFormData({...formData, block: e.target.value})}
                    >
                      {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Local Address <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    rows="3"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Shop number, Street, Landmark..."
                  ></textarea>
                </div>

              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="customerForm"
                className="flex-1 py-2.5 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg hover:shadow-md transition-all font-medium text-sm"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedCustomer.businessName} - Account Ledger</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedCustomer.mobile} • {selectedCustomer.address}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={downloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium mr-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-slate-600">Total Billed Amount</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800 ml-12">
                    <span className="text-sm font-normal text-slate-500 mr-1">₹</span>{customerDispatches?.reduce((sum, d) => sum + Number(d.totalAmount || 0), 0) || 0}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg font-bold w-9 h-9 flex items-center justify-center">₹</div>
                    <span className="text-sm font-medium text-slate-600">Total Amount Paid</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800 ml-12">
                    <span className="text-sm font-normal text-slate-500 mr-1">₹</span>{customerPayments?.filter(p => p.type === 'PAYMENT').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-slate-600">Pending Balance</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 ml-12">
                    <span className="text-sm font-normal text-orange-400 mr-1">₹</span>
                    {
                      (customerDispatches?.reduce((sum, d) => sum + Number(d.totalAmount || 0), 0) || 0) - 
                      (customerPayments?.filter(p => p.type === 'PAYMENT').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0)
                    }
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Deliveries */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" /> Recent Deliveries
                    </h4>
                  </div>
                  <div className="p-0 overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Date/Challan</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Item</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerDispatches.length === 0 ? (
                          <tr><td colSpan="3" className="px-4 py-6 text-center text-slate-400 text-sm">No delivery history found.</td></tr>
                        ) : (
                          customerDispatches.map(d => (
                            <tr key={d.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium text-slate-800">{d.challan}</div>
                                <div className="text-xs text-slate-500">{d.date}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                <div>{d.boxes} Boxes ({d.size})</div>
                                <div className="text-[10px] text-slate-400">₹{d.rate}/box</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-slate-700">₹{d.totalAmount || 0}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ledger / Payments */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-slate-400 font-bold mr-1">₹</span> Add Payment Received
                    </h4>
                  </div>
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <form onSubmit={handleAddPayment} className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                        <input type="date" required className="w-full p-2 border border-slate-200 rounded text-sm" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Amount Received (₹)</label>
                        <input type="number" required min="1" placeholder="e.g. 5000" className="w-full p-2 border border-slate-200 rounded text-sm" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                      </div>
                      <div className="col-span-2 flex gap-2">
                        <input type="text" placeholder="Remarks / Ref No" className="flex-1 p-2 border border-slate-200 rounded text-sm" value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} />
                        <button type="submit" className="px-4 py-2 bg-aquro-600 text-white rounded text-sm font-medium hover:bg-aquro-700">Add Entry</button>
                      </div>
                    </form>
                  </div>
                  <div className="p-0 flex-1 overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Date/Note</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Amount Cleared</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerPayments.length === 0 ? (
                          <tr><td colSpan="2" className="px-4 py-6 text-center text-slate-400 text-sm">No payment history found.</td></tr>
                        ) : (
                          customerPayments.slice().reverse().map((p, index) => (
                            <tr key={p._id || index} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium text-slate-800">{p.date}</div>
                                <div className="text-xs text-slate-500">{p.note || 'Cash Payment'}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600 flex items-center justify-end gap-1">
                                <ArrowDownRight className="w-3 h-3" /> ₹{p.amount || 0}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
