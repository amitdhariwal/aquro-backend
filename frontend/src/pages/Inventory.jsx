import React, { useState, useEffect } from 'react';
import { Package, Plus, X, Edit2, Trash2 } from 'lucide-react';

export default function Inventory() {
  const [stockItems, setStockItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ isNew: false, isEdit: false, id: '', name: '', qty: '', minimum: '500', supplier: '', notes: '', amount: '' });
  const [suppliersList, setSuppliersList] = useState([]);
  
  const [isHistoryEditOpen, setIsHistoryEditOpen] = useState(false);
  const [historyFormData, setHistoryFormData] = useState({ id: '', addedQty: '', amount: '', supplier: '', notes: '', date: '', previousStock: 0 });

  const loadInventory = async () => {
    try {
      const resInv = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory');
      if (resInv.ok) {
        const data = await resInv.json();
        // The DB might not have the default initial items if it's new. We should create them if empty.
        if (data.length === 0) {
          const initial = [
            { customId: 'inv-200ml', name: '200ml Bottles (Empty)', current: 0, minimum: 5000, unit: 'pcs' },
            { customId: 'inv-500ml', name: '500ml Bottles (Empty)', current: 0, minimum: 3000, unit: 'pcs' },
            { customId: 'inv-1L', name: '1L Bottles (Empty)', current: 0, minimum: 5000, unit: 'pcs' },
            { customId: 'inv-2L', name: '2L Bottles (Empty)', current: 0, minimum: 2000, unit: 'pcs' },
            { customId: 'inv-std-lbl', name: 'AQURO Standard Labels', current: 0, minimum: 20000, unit: 'pcs' },
          ];
          const capColors = ['Blue', 'White', 'Green', 'Red', 'Gold', 'Black', 'Yellow', 'Orange', 'Purple', 'Pink', 'Silver', 'Clear'];
          capColors.forEach(color => {
            initial.push({ customId: `inv-caps-${color.toLowerCase()}`, name: `Bottle Caps (${color})`, current: 0, minimum: 10000, unit: 'pcs' });
          });
          
          for (let item of initial) {
            await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
          }
          const resInv2 = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory');
          const data2 = await resInv2.json();
          setStockItems(data2.map(d => ({ ...d, id: d.customId })));
        } else {
          setStockItems(data.map(d => ({ ...d, id: d.customId })));
        }
      }

      const resHist = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory/history');
      if (resHist.ok) {
        setHistory(await resHist.json());
      }

      const resSupp = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/suppliers');
      if (resSupp.ok) {
        setSuppliersList(await resSupp.json());
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
    }
  };

  useEffect(() => {
    loadInventory();
    window.addEventListener('inventoryUpdated', loadInventory);
    return () => window.removeEventListener('inventoryUpdated', loadInventory);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    let qtyNum = parseInt(formData.qty) || 0;
    
    try {
      if (formData.isEdit) {
        const itemToUpdate = stockItems.find(i => i.id === formData.id);
        if (itemToUpdate) {
          await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/inventory/${itemToUpdate._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: formData.name, current: qtyNum, minimum: parseInt(formData.minimum) || 0 })
          });
        }
      } else if (formData.isNew) {
        const newId = `inv-${Date.now()}`;
        const newItemRes = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customId: newId, name: formData.name, current: qtyNum, minimum: parseInt(formData.minimum) || 500, unit: 'pcs' })
        });
        
        await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric', year: 'numeric' }),
            itemName: formData.name, previousStock: 0, addedQty: qtyNum, newStock: qtyNum,
            supplier: formData.supplier, notes: formData.notes, amount: parseFloat(formData.amount) || 0
          })
        });
      } else {
        const itemToUpdate = stockItems.find(i => i.id === formData.id);
        if (itemToUpdate) {
          const newCurrent = itemToUpdate.current + qtyNum;
          await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/inventory/${itemToUpdate._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current: newCurrent })
          });
          
          await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric', year: 'numeric' }),
              itemName: itemToUpdate.name, previousStock: itemToUpdate.current, addedQty: qtyNum, newStock: newCurrent,
              supplier: formData.supplier, notes: formData.notes, amount: parseFloat(formData.amount) || 0
            })
          });
        }
      }
      
      await loadInventory();
      setIsModalOpen(false);
      setFormData({ isNew: false, isEdit: false, id: stockItems[0]?.id || '', name: '', qty: '', minimum: '500', supplier: '', notes: '', amount: '' });
      setSelectedItem(null);
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Backend connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleItemVisibility = async (item) => {
    try {
      const newStatus = !item.isHidden;
      await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/inventory/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: newStatus })
      });
      await loadInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      isNew: false,
      isEdit: true,
      id: item.id,
      name: item.name,
      qty: item.current.toString(),
      minimum: item.minimum.toString(),
      supplier: '',
      notes: '',
      amount: ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteHistory = async (historyEntry) => {
    if (window.confirm('Are you sure you want to delete this entry? This will also revert the stock quantity!')) {
      try {
        const itemToUpdate = stockItems.find(i => i.name === historyEntry.itemName);
        if (itemToUpdate) {
          const newCurrent = itemToUpdate.current - historyEntry.addedQty;
          await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/inventory/${itemToUpdate._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current: Math.max(0, newCurrent) })
          });
        }
        await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/inventory/history/${historyEntry._id}`, {
          method: 'DELETE'
        });
        await loadInventory();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEditHistory = (historyEntry) => {
    setHistoryFormData({
      id: historyEntry._id,
      addedQty: historyEntry.addedQty.toString(),
      amount: (historyEntry.amount || 0).toString(),
      supplier: historyEntry.supplier || '',
      notes: historyEntry.notes || '',
      date: historyEntry.date,
      previousStock: historyEntry.previousStock,
      itemName: historyEntry.itemName
    });
    setIsHistoryEditOpen(true);
  };

  const saveHistoryEdit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const oldEntry = history.find(h => h._id === historyFormData.id);
      const newQty = parseInt(historyFormData.addedQty) || 0;
      const diff = newQty - oldEntry.addedQty;
      
      const itemToUpdate = stockItems.find(i => i.name === oldEntry.itemName);
      let newCurrent = itemToUpdate ? itemToUpdate.current : 0;
      
      if (itemToUpdate && diff !== 0) {
        newCurrent = Math.max(0, itemToUpdate.current + diff);
        await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/inventory/${itemToUpdate._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current: newCurrent })
        });
      }

      await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/inventory/history/${historyFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addedQty: newQty,
          amount: parseFloat(historyFormData.amount) || 0,
          supplier: historyFormData.supplier,
          notes: historyFormData.notes,
          newStock: oldEntry.previousStock + newQty
        })
      });
      await loadInventory();
      setIsHistoryEditOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = stockItems.filter(item => {
    // Hide items unless we are explicitly searching for them
    if (item.isHidden && !searchQuery) return false;

    // Search Query Match
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Tab Match
    switch (activeTab) {
      case 'Bottles': return ['inv-200ml', 'inv-500ml', 'inv-1L', 'inv-2L'].includes(item.id);
      case 'Caps': return item.id.startsWith('inv-caps-');
      case 'Labels': return item.id === 'inv-std-lbl';
      case 'Custom Labels': return !['inv-200ml', 'inv-500ml', 'inv-1L', 'inv-2L', 'inv-std-lbl'].includes(item.id) && !item.id.startsWith('inv-caps-');
      default: return true; // 'All'
    }
  });

  const tabs = ['All', 'Bottles', 'Caps', 'Labels', 'Custom Labels'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory & Stock</h1>
          <p className="text-slate-500 text-sm mt-1">Track empty bottles, raw materials, and finished goods.</p>
        </div>
        <button 
          onClick={() => setIsSettingsModalOpen(true)}
          className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Settings
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab 
                  ? 'bg-aquro-600 text-white shadow-sm' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Search stock..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white/30 rounded-xl border border-dashed border-slate-300">
            No stock items found matching your filters.
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <div key={idx} onClick={() => setSelectedItem(item)} className="glass-card p-6 border-l-4 border-l-aquro-500 relative overflow-hidden group cursor-pointer hover:border-aquro-300 transition-colors">
              <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{item.name}</p>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Edit Item">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-800">{item.current}</span>
                    <span className="text-sm font-medium text-slate-500">{item.unit}</span>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.current >= item.minimum ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {item.current >= item.minimum ? 'Healthy' : 'Low Stock'}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200/50">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Min. Required: {item.minimum}</span>
                  <span>Max Capacity: --</span>
                </div>
                <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${item.current >= item.minimum ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (item.current / (item.minimum * 3)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )))}
        </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedItem.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Current Stock: <span className="font-bold text-slate-700">{selectedItem.current} {selectedItem.unit}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setFormData({ isNew: false, isEdit: false, id: selectedItem.id, name: selectedItem.name, qty: '', minimum: selectedItem.minimum.toString(), supplier: '', notes: '', amount: '' });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium mr-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Stock
                </button>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 bg-white">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-aquro-500" /> Purchase Statement & History
              </h4>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Added Qty</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes / Ref</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {history.filter(h => h.itemName === selectedItem.name).length === 0 ? (
                      <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No purchase history found for this item.</td></tr>
                    ) : (
                      history.filter(h => h.itemName === selectedItem.name).map(h => (
                        <tr key={h._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{h.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-emerald-600">
                            {h.addedQty >= 0 ? '+' : ''}{h.addedQty} <span className="text-[10px] text-slate-400 font-normal block">({h.previousStock} → {h.newStock})</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-700">₹{h.amount || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{h.supplier || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{h.notes || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleEditHistory(h)} className="text-blue-500 hover:text-blue-700 mr-2 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteHistory(h)} className="text-red-500 hover:text-red-700 transition-colors">
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
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{formData.isEdit ? 'Edit Stock Item' : 'Add Stock Entry'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {!formData.isEdit && (
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input 
                      type="radio" 
                      checked={!formData.isNew} 
                      onChange={() => setFormData({...formData, isNew: false})} 
                      className="text-aquro-600"
                    />
                    Existing Item
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input 
                      type="radio" 
                      checked={formData.isNew} 
                      onChange={() => setFormData({...formData, isNew: true})} 
                      className="text-aquro-600"
                    />
                    New Item (Custom Label)
                  </label>
                </div>
              )}

              {!formData.isNew && !formData.isEdit ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Item</label>
                  <select 
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                  >
                    <option value="" disabled>Select an item</option>
                    {stockItems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Custom Label - Taj Hotel"
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={!formData.isNew && !formData.isEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Alert Threshold</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.minimum}
                      onChange={(e) => setFormData({...formData, minimum: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {formData.isEdit ? 'Set Exact Quantity' : 'Quantity to Add'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={formData.qty}
                    onChange={(e) => setFormData({...formData, qty: e.target.value})}
                    placeholder="e.g. 5000"
                  />
                </div>
                {!formData.isEdit && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="e.g. 15000"
                    />
                  </div>
                )}
              </div>

              {!formData.isEdit && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Purchased From (Supplier)</label>
                    <input 
                      type="text" 
                      list="supplier-list"
                      placeholder="e.g. ABC Plastics"
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    />
                    <datalist id="supplier-list">
                      {suppliersList.map(s => <option key={s.id} value={s.businessName} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Invoice No.</label>
                    <input 
                      type="text" 
                      placeholder="e.g. INV-2024"
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
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
                      Saving...
                    </>
                  ) : (
                    'Save Stock'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Inventory Settings
              </h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
              <p className="text-sm text-slate-500 mb-4">Toggle visibility of items. Hidden items will not appear on the main dashboard but their data is safely preserved.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stockItems.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.isHidden ? 'bg-slate-100 border-slate-200' : 'bg-white border-aquro-200 shadow-sm'}`}>
                    <div className="flex-1 min-w-0 pr-3">
                      <p className={`text-sm font-medium truncate ${item.isHidden ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">Stock: {item.current}</p>
                    </div>
                    <button 
                      onClick={() => toggleItemVisibility(item)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${!item.isHidden ? 'bg-aquro-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!item.isHidden ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg hover:shadow-md transition-all font-medium text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Edit Modal */}
      {isHistoryEditOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Edit History Entry</h3>
              <button onClick={() => setIsHistoryEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={saveHistoryEdit} className="p-4 space-y-4">
              <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                Editing this entry will automatically adjust the current total stock to maintain balance.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity (Change)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={historyFormData.addedQty}
                    onChange={(e) => setHistoryFormData({...historyFormData, addedQty: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                    value={historyFormData.amount}
                    onChange={(e) => setHistoryFormData({...historyFormData, amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier / Type</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                  value={historyFormData.supplier}
                  onChange={(e) => setHistoryFormData({...historyFormData, supplier: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Notes</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-aquro-500 focus:border-aquro-500"
                  value={historyFormData.notes}
                  onChange={(e) => setHistoryFormData({...historyFormData, notes: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsHistoryEditOpen(false)}
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
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
