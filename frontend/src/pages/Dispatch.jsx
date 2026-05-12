import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, Edit2, Trash2, Truck, X, Calendar, FileText, FileSpreadsheet, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Dispatch() {
  const sizes = ['200ml', '500ml', '1L', '2L'];
  const [customers, setCustomers] = useState([]);

  const [dispatches, setDispatches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, challan: '', date: new Date().toISOString().split('T')[0], customer: '', size: '1L', boxes: '', rate: '', qty: 0, vehicle: '', driver: 'Amit dhariwal', status: 'Delivered', isSample: false });

  const getPiecesPerBox = (size) => {
    switch(size) {
      case '200ml': return 48;
      case '500ml': return 24;
      case '1L': return 12;
      case '2L': return 6;
      default: return 12;
    }
  };

  useEffect(() => {
    fetchDispatches();
    fetchCustomers();
  }, []);

  const fetchDispatches = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/dispatches');
      if (res.ok) {
        const data = await res.json();
        setDispatches(data.map(d => ({ ...d, id: d._id })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.map(c => ({ id: c._id, name: c.businessName })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateChallan = () => {
    return 'CH-' + Math.floor(1000 + Math.random() * 9000);
  };

  const openModal = (item = null) => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({ 
        id: null, 
        challan: generateChallan(),
        date: new Date().toISOString().split('T')[0], 
        customer: '', 
        size: '1L', 
        boxes: '',
        rate: '',
        qty: 0, 
        vehicle: '', 
        driver: 'Amit dhariwal', 
        status: 'Delivered',
        isSample: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const bx = parseInt(formData.boxes) || 0;
    const rt = parseFloat(formData.rate) || 0;
    const q = bx * getPiecesPerBox(formData.size);

    const payload = {
      ...formData,
      status: 'Delivered', // Force delivered
      boxes: bx, rate: rt, qty: q, totalAmount: formData.isSample ? 0 : bx * rt
    };

    try {
      const isEdit = !!formData.id;
      const baseUrl = import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com';
      const url = isEdit ? `${baseUrl}/api/dispatches/${formData.id}` : `${baseUrl}/api/dispatches`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchDispatches();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      alert('Backend connection error');
    }
  };

  const handleDelete = async (id, challan) => {
    if (window.confirm(`Are you sure you want to delete challan ${challan}?`)) {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/dispatches/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchDispatches();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const filtered = dispatches.filter(d => {
    const matchesSearch = d.customer.toLowerCase().includes(searchQuery.toLowerCase()) || (d.driver && d.driver.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStart = startDate ? new Date(d.date) >= new Date(startDate) : true;
    const matchesEnd = endDate ? new Date(d.date) <= new Date(endDate) : true;
    return matchesSearch && matchesStart && matchesEnd;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('AQURO - Dispatch & Delivery Report', 14, 15);
    if (startDate || endDate) {
      doc.setFontSize(10);
      doc.text(`Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 22);
    }
    
    const tableData = filtered.map(d => [
      d.date, d.challan, d.customer, `${d.boxes} Boxes (${d.size})`, `Rs.${d.totalAmount || 0}`, d.driver || ''
    ]);

    autoTable(doc, {
      startY: (startDate || endDate) ? 26 : 22,
      head: [['Date', 'Challan', 'Customer', 'Items', 'Total Amt', 'Driver']],
      body: tableData,
    });
    doc.save('Dispatch_Report.pdf');
  };

  const exportToExcel = () => {
    const tableData = filtered.map(d => ({
      Date: d.date,
      Challan: d.challan,
      Customer: d.customer,
      Size: d.size,
      Boxes: d.boxes,
      Rate: d.rate,
      TotalAmount: d.totalAmount || 0,
      Driver: d.driver || '',
      Vehicle: d.vehicle || '',
      Sample: d.isSample ? 'Yes' : 'No'
    }));

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatches");
    XLSX.writeFile(wb, "Dispatch_Report.xlsx");
  };

  // Calculate summaries based on filtered data
  const summary = sizes.reduce((acc, size) => {
    acc[size] = filtered.filter(d => d.size === size).reduce((sum, d) => sum + (Number(d.boxes) || 0), 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dispatch & Delivery</h1>
          <p className="text-slate-500 text-sm mt-1">Manage outbound shipments and delivery tracking.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="px-4 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg shadow-sm shadow-aquro-500/30 hover:shadow-md transition-all text-sm font-medium flex items-center"
        >
          <Truck className="w-4 h-4 mr-2" />
          New Dispatch
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sizes.map(size => (
          <div key={size} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Total {size}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{summary[size]} <span className="text-sm font-normal text-slate-500">Boxes</span></p>
            </div>
            <div className="p-3 bg-aquro-50 text-aquro-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm w-full">
              <input 
                type="text" 
                placeholder="Search customer or driver..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 bg-white/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-white/50 border border-slate-200 rounded-lg p-1">
                <input 
                  type="date" 
                  className="px-2 py-1 text-sm bg-transparent border-none focus:ring-0 text-slate-600"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  className="px-2 py-1 text-sm bg-transparent border-none focus:ring-0 text-slate-600"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                {(startDate || endDate) && (
                  <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1 hover:bg-slate-200 rounded-full text-slate-400">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button onClick={exportToPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <FileText className="w-4 h-4 text-red-500" /> PDF
              </button>
              <button onClick={exportToExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle/Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/30 divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No dispatches found.</td></tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{item.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <span className="font-bold text-slate-800">{item.boxes} Boxes</span> <span className="text-xs text-slate-400">({item.qty} pcs)</span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.size} • ₹{item.rate}/box 
                          {item.isSample && <span className="ml-1 text-orange-500 font-bold">(Sample)</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div>{item.vehicle}</div>
                        <div className="text-xs text-slate-400">{item.driver}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.isSample ? (
                          <span className="font-bold text-slate-400 line-through block mb-1">₹{item.boxes * item.rate}</span>
                        ) : (
                          <span className="font-bold text-slate-700 block mb-1">₹{item.totalAmount || 0}</span>
                        )}
                        <span className="px-2 inline-flex text-[10px] leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          Delivered
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openModal(item)} className="text-blue-500 hover:text-blue-700 mr-3 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.challan)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{formData.id ? 'Edit Dispatch' : 'New Dispatch Entry'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 font-medium text-slate-700"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                  <input 
                    type="text"
                    required
                    placeholder="Search or type customer name..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.customer}
                    onChange={(e) => {
                      setFormData({...formData, customer: e.target.value});
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setCustomerSearch('');
                      setIsCustomerDropdownOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                  />
                  {isCustomerDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {customers
                        .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                        .map(c => (
                          <div 
                            key={c.id} 
                            className="p-2 hover:bg-aquro-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0"
                            onClick={() => {
                              setFormData({...formData, customer: c.name});
                              setCustomerSearch('');
                              setIsCustomerDropdownOpen(false);
                            }}
                          >
                            {c.name}
                          </div>
                      ))}
                      {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                        <div className="p-2 text-sm text-slate-400 text-center">No customers found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bottle Size</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                  >
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">{getPiecesPerBox(formData.size)} pcs / peti</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Boxes (Peti)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 font-bold"
                    value={formData.boxes}
                    onChange={(e) => setFormData({...formData, boxes: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rate / Box (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 font-bold text-aquro-600"
                    value={formData.rate}
                    onChange={(e) => setFormData({...formData, rate: e.target.value})}
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              {(formData.boxes && formData.rate) ? (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                      Total: <span className="font-semibold text-slate-800">{parseInt(formData.boxes) * getPiecesPerBox(formData.size)} pcs</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      Total Amount: 
                      {formData.isSample ? (
                        <span className="text-lg font-bold text-slate-400 line-through ml-1">₹{parseFloat(formData.boxes) * parseFloat(formData.rate)}</span>
                      ) : (
                        <span className="text-lg font-bold text-aquro-600 ml-1">₹{parseFloat(formData.boxes) * parseFloat(formData.rate)}</span>
                      )}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer border-t border-slate-200 pt-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-aquro-600 rounded border-slate-300 focus:ring-aquro-500"
                      checked={formData.isSample}
                      onChange={(e) => setFormData({...formData, isSample: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-orange-600">Mark as Sample Box (Amount will be 0)</span>
                  </label>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle No</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name</label>
                  <select 
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.driver}
                    onChange={(e) => setFormData({...formData, driver: e.target.value})}
                  >
                    <option value="Amit dhariwal">Amit dhariwal</option>
                    <option value="Akash gupta">Akash gupta</option>
                    <option value="Nitin Singh">Nitin Singh</option>
                    <option value="ritik Dhariwal">ritik Dhariwal</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg hover:shadow-md transition-all font-medium text-sm"
                >
                  Save Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
