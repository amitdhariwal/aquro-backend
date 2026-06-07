import React, { useState, useEffect } from 'react';
import { Phone, Search, MapPin, Download, Store, User, Smartphone } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CustomerContact() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState('All');
  
  // Extract unique blocks for the filter
  const blocks = ['All', ...new Set(customers.map(c => c.block).filter(Boolean))];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile?.includes(searchQuery);
      
    const matchesBlock = filterBlock === 'All' || c.block === filterBlock;
    
    return matchesSearch && matchesBlock;
  });

  const exportToExcel = () => {
    const tableData = filteredCustomers.map(c => ({
      "Business Name": c.businessName,
      "Owner Name": c.ownerName,
      "Mobile": c.mobile,
      "Block": c.block,
      "Location/Address": `${c.address}, ${c.district}`
    }));

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, "Customer_Contacts.xlsx");
  };

  const exportToVCF = () => {
    let vcfContent = '';
    filteredCustomers.forEach(c => {
      const name = `${c.businessName || 'Customer'} - ${c.ownerName || ''}`.trim();
      vcfContent += 'BEGIN:VCARD\r\n';
      vcfContent += 'VERSION:3.0\r\n';
      vcfContent += `N:;${name};;;;\r\n`;
      vcfContent += `FN:${name}\r\n`;
      if (c.businessName) vcfContent += `ORG:${c.businessName}\r\n`;
      if (c.mobile) vcfContent += `TEL;TYPE=CELL:${c.mobile}\r\n`;
      vcfContent += 'END:VCARD\r\n';
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Customer_Contacts.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Customer Contact</h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
              {filteredCustomers.length} Contacts
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Easily find, call, and export customer contact details.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Search by name, business or mobile..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-aquro-500 focus:border-aquro-500 bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <div className="relative">
            <select
              className="w-full sm:w-48 pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-aquro-500 focus:border-aquro-500 bg-slate-50 appearance-none"
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
            >
              {blocks.map(b => <option key={b} value={b}>{b === 'All' ? 'All Blocks' : b}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToExcel} 
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors font-medium text-sm whitespace-nowrap"
            title="Download Excel File for PC"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportToVCF} 
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm whitespace-nowrap"
            title="Download Mobile Contacts (VCF)"
          >
            <Smartphone className="w-4 h-4" /> Save to Mobile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
            No contacts found matching your criteria.
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer._id || customer.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-aquro-300 transition-colors">
              <div className="p-4 flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1">{customer.businessName}</h3>
                    <div className="flex items-center text-sm text-slate-500 mt-0.5">
                      <User className="w-3.5 h-3.5 mr-1" /> {customer.ownerName}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{customer.address}, {customer.block}, {customer.district}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium">{customer.mobile}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-end">
                <a 
                  href={`tel:${customer.mobile}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium w-full justify-center"
                >
                  <Phone className="w-4 h-4" /> Call Now
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
