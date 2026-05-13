import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, Edit2, Trash2, History, X, Package, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Production() {
  const sizes = ['200ml', '500ml', '1L', '2L'];
  const capColors = ['Blue', 'White', 'Green', 'Red', 'Gold', 'Black', 'Yellow', 'Orange', 'Purple', 'Pink', 'Silver', 'Clear'];
  const [customers, setCustomers] = useState([]);
  
  const [productions, setProductions] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [filterSize, setFilterSize] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ id: null, date: '', batch: '', size: '1L', qty: '', label: 'Standard', clientName: '', capColor: 'Blue' });

  useEffect(() => {
    fetchProductions();
  }, []);

  const fetchProductions = async () => {
    try {
      const resProd = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/production');
      if (resProd.ok) {
        const data = await resProd.json();
        setProductions(data.map(d => ({ ...d, id: d._id })));
      }

      const resCust = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/customers');
      if (resCust.ok) {
        const data = await resCust.json();
        setCustomers(data.map(c => ({ id: c._id, name: c.businessName || c.name })));
      }

      const resHist = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/production/history');
      if (resHist.ok) {
        const data = await resHist.json();
        setHistoryLogs(data.map(d => ({ ...d, id: d._id })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addHistoryLog = async (type, batch, details, payload = null) => {
    try {
      const newLog = {
        timestamp: new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),
        type, batch, details, payload, operator: 'Admin User'
      };
      await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/production/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      fetchProductions();
    } catch (error) {
      console.error(error);
    }
  };

  const adjustInventoryForProduction = async (entry, isReverting = false) => {
    try {
      const invRes = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory');
      if (invRes.ok) {
        const inventory = await invRes.json();
        for (let item of inventory) {
          let qtyToAdjust = isReverting ? entry.qty : -entry.qty;
          let shouldUpdate = false;
          let newCurrent = item.current;

          if (item.customId === `inv-${entry.size}`) {
            newCurrent = Math.max(0, item.current + qtyToAdjust);
            shouldUpdate = true;
          } else if (item.customId === `inv-caps-${entry.capColor.toLowerCase()}` || 
              (item.name.toLowerCase().includes('cap') && item.name.toLowerCase().includes(entry.capColor.toLowerCase()))) {
            newCurrent = Math.max(0, item.current + qtyToAdjust);
            shouldUpdate = true;
          } else if (entry.label === 'Standard' && item.customId === `inv-std-lbl-${entry.size}`) {
            newCurrent = Math.max(0, item.current + qtyToAdjust);
            shouldUpdate = true;
          } else if (entry.label === 'Custom' && item.isCustomLabel && 
              (item.customerName || '').trim().toLowerCase() === (entry.clientName || '').trim().toLowerCase() && 
              (item.labelSize || '').trim().toLowerCase() === (entry.size || '').trim().toLowerCase()) {
            newCurrent = Math.max(0, item.current + qtyToAdjust);
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/inventory/${item._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ current: newCurrent })
            });

            const detailsText = isReverting 
              ? `Reverted from Production Batch #${entry.batch}` 
              : `Used in Production Batch #${entry.batch} (${entry.date})`;

            await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric', year: 'numeric' }),
                itemName: item.name, 
                previousStock: item.current, 
                addedQty: qtyToAdjust, 
                newStock: newCurrent,
                supplier: isReverting ? 'Stock Reversal' : 'Production Usage', 
                notes: detailsText, 
                amount: 0
              })
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const q = parseInt(formData.qty) || 0;

    // Validate Stock for both New and Edit Entries
    try {
      const invRes = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory');
      if (invRes.ok) {
        const inventory = await invRes.json();
        const reqBottle = inventory.find(i => i.customId === `inv-${formData.size}`);
        const reqCap = inventory.find(i => i.customId === `inv-caps-${formData.capColor.toLowerCase()}` || (i.name.toLowerCase().includes('cap') && i.name.toLowerCase().includes(formData.capColor.toLowerCase())));
        let reqLabel = null;
        
        if (formData.label === 'Standard') {
          reqLabel = inventory.find(i => i.customId === `inv-std-lbl-${formData.size}`);
        } else {
          reqLabel = inventory.find(i => i.isCustomLabel && 
            (i.customerName || '').trim().toLowerCase() === (formData.clientName || '').trim().toLowerCase() && 
            (i.labelSize || '').trim().toLowerCase() === (formData.size || '').trim().toLowerCase()
          );
        }

        let oldBottleQty = 0; let oldCapQty = 0; let oldLabelQty = 0;
        if (formData.id) {
          const oldEntry = productions.find(p => p.id === formData.id);
          if (oldEntry && oldEntry.size === formData.size) oldBottleQty = oldEntry.qty;
          if (oldEntry && oldEntry.capColor === formData.capColor) oldCapQty = oldEntry.qty;
          if (oldEntry && oldEntry.label === formData.label && oldEntry.clientName === formData.clientName && oldEntry.size === formData.size) oldLabelQty = oldEntry.qty;
        }

        const errors = [];
        if (!reqBottle || (reqBottle.current + oldBottleQty) < q) errors.push(`• Need ${q} empty bottles (${formData.size}), but only ${reqBottle ? reqBottle.current + oldBottleQty : 0} available`);
        if (!reqCap || (reqCap.current + oldCapQty) < q) errors.push(`• Need ${q} caps (${formData.capColor}), but only ${reqCap ? reqCap.current + oldCapQty : 0} available`);
        if (formData.label === 'Standard' && (!reqLabel || (reqLabel.current + oldLabelQty) < q)) errors.push(`• Need ${q} AQURO Standard Labels (${formData.size}), but only ${reqLabel ? reqLabel.current + oldLabelQty : 0} available`);
        if (formData.label === 'Custom' && (!reqLabel || (reqLabel.current + oldLabelQty) < q)) errors.push(`• Need ${q} Custom Labels for ${formData.clientName} (${formData.size}), but only ${reqLabel ? reqLabel.current + oldLabelQty : 0} available`);

        if (errors.length > 0) {
          alert("INSUFFICIENT STOCK FOR PRODUCTION:\n\n" + errors.join('\n') + "\n\nPlease add stock in the Inventory page first.");
          setIsSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }

    // Calculate expiry (6 months from selected date)
    const productionDateObj = formData.date ? new Date(formData.date) : new Date();
    const expiryDate = new Date(productionDateObj);
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    const formattedExpiry = expiryDate.toLocaleDateString('en-GB');

    const entryData = {
      date: formData.date,
      batch: formData.batch,
      expiry: formattedExpiry,
      size: formData.size,
      capColor: formData.capColor,
      qty: parseInt(formData.qty) || 0,
      label: formData.label,
      clientName: formData.label === 'Custom' ? formData.clientName : '',
      operator: 'Admin User',
      status: 'Completed'
    };

    try {
      if (formData.id) {
        const oldEntry = productions.find(p => p.id === formData.id);
        
        // Revert old inventory
        await adjustInventoryForProduction(oldEntry, true);

        await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/production/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData)
        });
        await addHistoryLog('UPDATE', formData.batch, `Updated size to ${entryData.size}, qty to ${entryData.qty}`, oldEntry);
        
        // Deduct new inventory
        await adjustInventoryForProduction(entryData, false);

      } else {
        await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/production', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData)
        });
        await addHistoryLog('CREATE', formData.batch, `Created new batch ${formData.batch}`);
        
        // Deduct new inventory
        await adjustInventoryForProduction(entryData, false);
      }

      await fetchProductions();
      setIsModalOpen(false);
      setFormData({ id: null, batch: '', size: '1L', qty: '', label: 'Standard', clientName: '', capColor: 'Blue' });
    } catch (error) {
      console.error(error);
      alert('Backend connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateBatchCode = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}${mm}${yy}`;
  };

  const openModal = (item = null) => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({ 
        id: null,
        date: new Date().toISOString().split('T')[0],
        batch: generateBatchCode(), 
        size: '1L', 
        capColor: 'Blue',
        qty: '', 
        label: 'Standard', 
        clientName: customers[0].name 
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id, batch) => {
    if (window.confirm(`Are you sure you want to delete batch ${batch}?`)) {
      try {
        const toDelete = productions.find(p => p.id === id);
        
        // Add items back to inventory before deleting
        await adjustInventoryForProduction(toDelete, true);

        await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/production/${id}`, { method: 'DELETE' });
        await addHistoryLog('DELETE', batch, `Deleted batch ${batch}`, toDelete);
        await fetchProductions();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const getCapColorStyles = (color) => {
    switch(color) {
      case 'Blue': return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'White': return 'border-slate-200 bg-white text-slate-700';
      case 'Green': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'Red': return 'border-red-200 bg-red-50 text-red-700';
      case 'Gold': return 'border-yellow-300 bg-yellow-50 text-yellow-800';
      case 'Black': return 'border-slate-400 bg-slate-800 text-white';
      case 'Yellow': return 'border-yellow-200 bg-yellow-100 text-yellow-800';
      case 'Orange': return 'border-orange-200 bg-orange-50 text-orange-700';
      case 'Purple': return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'Pink': return 'border-pink-200 bg-pink-50 text-pink-700';
      case 'Silver': return 'border-slate-300 bg-slate-100 text-slate-600';
      case 'Clear': return 'border-slate-200 bg-transparent text-slate-500';
      default: return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  const filteredProductions = productions.filter(p => {
    const matchSize = filterSize === 'All' || p.size === filterSize;
    const matchSearch = p.batch.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.label === 'Custom' && p.clientName && p.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    let matchDate = true;
    if (dateFilter.start && dateFilter.end) {
      matchDate = p.date >= dateFilter.start && p.date <= dateFilter.end;
    } else if (dateFilter.start) {
      matchDate = p.date >= dateFilter.start;
    } else if (dateFilter.end) {
      matchDate = p.date <= dateFilter.end;
    }
    return matchSize && matchSearch && matchDate;
  });

  const totalProductionQty = filteredProductions.reduce((sum, p) => sum + p.qty, 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayProductionQty = productions.filter(p => p.date === todayStr).reduce((sum, p) => sum + p.qty, 0);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('AQURO - Production Report', 14, 15);
    
    let dateRangeText = 'All Time';
    if (dateFilter.start && dateFilter.end) dateRangeText = `${dateFilter.start} to ${dateFilter.end}`;
    else if (dateFilter.start) dateRangeText = `From ${dateFilter.start}`;
    else if (dateFilter.end) dateRangeText = `Until ${dateFilter.end}`;
    
    doc.setFontSize(10);
    doc.text(`Date Range: ${dateRangeText}`, 14, 22);
    doc.text(`Total Bottles Produced: ${totalProductionQty.toLocaleString()}`, 14, 28);

    const tableColumn = ["Date", "Batch Code", "Expiry", "Size", "Cap Color", "Quantity", "Label"];
    const tableRows = [];

    filteredProductions.forEach(p => {
      const labelText = p.label === 'Custom' ? `Custom (${p.clientName})` : 'AQURO Standard';
      tableRows.push([
        p.date,
        p.batch,
        p.expiry,
        p.size,
        p.capColor,
        p.qty,
        labelText
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });

    doc.save(`AQURO_Production_${dateRangeText.replace(/ /g, '_')}.pdf`);
  };

  const handleExportExcel = () => {
    let dateRangeText = 'All Time';
    if (dateFilter.start && dateFilter.end) dateRangeText = `${dateFilter.start}_to_${dateFilter.end}`;
    else if (dateFilter.start) dateRangeText = `From_${dateFilter.start}`;
    else if (dateFilter.end) dateRangeText = `Until_${dateFilter.end}`;

    const wsData = filteredProductions.map(p => ({
      "Date": p.date,
      "Batch Code": p.batch,
      "Expiry Date": p.expiry,
      "Bottle Size": p.size,
      "Cap Color": p.capColor,
      "Quantity (Pcs)": p.qty,
      "Label Type": p.label === 'Custom' ? `Custom (${p.clientName})` : 'AQURO Standard',
      "Operator": p.operator
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production");
    
    XLSX.writeFile(wb, `AQURO_Production_${dateRangeText}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Production Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage daily water production and filling records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium flex items-center"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </button>
          <button 
            onClick={() => openModal()}
            className="px-4 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg shadow-sm shadow-aquro-500/30 hover:shadow-md transition-all text-sm font-medium flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Filtered Total Production</p>
            <div className="flex items-end gap-2 mt-1">
              <h3 className="text-3xl font-bold text-slate-800">{totalProductionQty.toLocaleString()}</h3>
              <span className="text-slate-500 text-sm mb-1 font-medium">Bottles</span>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Today's Production</p>
            <div className="flex items-end gap-2 mt-1">
              <h3 className="text-3xl font-bold text-slate-800">{todayProductionQty.toLocaleString()}</h3>
              <span className="text-slate-500 text-sm mb-1 font-medium">Bottles</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-slate-200/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-medium text-slate-800">Bottle Filling Records</h2>
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <input 
              type="date" 
              className="px-2 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 focus:outline-none focus:border-aquro-500"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
              title="Start Date"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input 
              type="date" 
              className="px-2 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 focus:outline-none focus:border-aquro-500"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
              title="End Date"
            />
            {(dateFilter.start || dateFilter.end) && (
              <button 
                onClick={() => setDateFilter({start: '', end: ''})}
                className="text-slate-400 hover:text-red-500 ml-1"
                title="Clear Dates"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search batch or client..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 bg-white/50 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <select 
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 bg-white/50"
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
              >
                <option value="All">All Sizes</option>
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportPDF}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center shadow-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> PDF
              </button>
              <button 
                onClick={handleExportExcel}
                className="px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors flex items-center shadow-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bottle Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cap Color</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity (Pcs)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Label Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Operator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/30 divide-y divide-slate-200">
                {filteredProductions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-slate-500">
                      No records found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredProductions.map((item) => (
                    <tr key={item.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.batch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.expiry}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className={`px-2 inline-flex text-[10px] leading-5 font-semibold rounded-full border ${getCapColorStyles(item.capColor)}`}>
                        {item.capColor}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.label === 'Custom' ? (
                        <div className="flex flex-col">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 w-max">
                            Custom Label
                          </span>
                          <span className="text-xs text-slate-400 mt-0.5 ml-1">{item.clientName}</span>
                        </div>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 w-max">
                          AQURO Standard
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.operator}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal(item)} className="text-blue-500 hover:text-blue-700 mr-3 transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.batch)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{formData.id ? 'Edit Entry' : 'New Production Entry'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Production Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 font-medium text-slate-700"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 font-medium text-slate-700"
                    value={formData.batch}
                    onChange={(e) => setFormData({...formData, batch: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bottle Size</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                  >
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cap Color</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.capColor}
                    onChange={(e) => setFormData({...formData, capColor: e.target.value})}
                  >
                    {capColors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity (Pieces)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.qty}
                    onChange={(e) => setFormData({...formData, qty: e.target.value})}
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input 
                      type="radio" 
                      name="labelType" 
                      checked={formData.label === 'Standard'}
                      onChange={() => setFormData({...formData, label: 'Standard'})}
                      className="text-aquro-600 focus:ring-aquro-500"
                    />
                    AQURO Standard
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input 
                      type="radio" 
                      name="labelType" 
                      checked={formData.label === 'Custom'}
                      onChange={() => setFormData({...formData, label: 'Custom'})}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    Custom Label
                  </label>
                </div>
              </div>

              {formData.label === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Customer</label>
                  <select 
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  >
                    {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}

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
                  disabled={isSubmitting}
                  className={`flex-1 py-2 rounded-lg transition-all font-medium text-sm flex items-center justify-center ${
                    isSubmitting 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-aquro-600 to-aquro-500 text-white hover:shadow-md'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Please wait...
                    </>
                  ) : (
                    'Save Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Production History Logs</h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
              {historyLogs.length === 0 ? (
                <div className="text-center text-slate-500 py-8">No history logs found.</div>
              ) : (
                <div className="space-y-4">
                  {historyLogs.map(log => (
                    <div key={log.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-4">
                      <div className={`p-2 rounded-full mt-1 ${
                        log.type === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                        log.type === 'DELETE' ? 'bg-red-100 text-red-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        <History className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                            {log.batch}
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                              log.type === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                              log.type === 'DELETE' ? 'bg-red-100 text-red-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {log.type}
                            </span>
                          </h4>
                          <span className="text-xs text-slate-400">{log.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                        {log.payload && (
                          <div className="mt-3 p-3 bg-slate-50/50 rounded-lg text-xs border border-slate-100">
                            <div className="font-semibold text-slate-700 mb-2">Previous Data Snapshot:</div>
                            <div className="grid grid-cols-2 gap-2 text-slate-600">
                              <div><span className="font-medium text-slate-500">Size:</span> {log.payload.size}</div>
                              <div><span className="font-medium text-slate-500">Cap Color:</span> {log.payload.capColor}</div>
                              <div><span className="font-medium text-slate-500">Quantity:</span> {log.payload.qty} pcs</div>
                              <div>
                                <span className="font-medium text-slate-500">Label:</span> {log.payload.label} 
                                {log.payload.label === 'Custom' ? ` (${log.payload.clientName})` : ''}
                              </div>
                              <div><span className="font-medium text-slate-500">Expiry:</span> {log.payload.expiry}</div>
                              <div className="col-span-2"><span className="font-medium text-slate-500">Original Date:</span> {log.payload.date}</div>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">By: {log.operator}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-white">
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
