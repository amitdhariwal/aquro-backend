import React, { useState, useEffect } from 'react';
import { Package, Droplet, Truck, AlertCircle, RefreshCw } from 'lucide-react';

export default function ReadyStock() {
  const [stockData, setStockData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');

  const loadData = async () => {
    try {
      let produced = { '200ml': 0, '500ml': 0, '1L': 0, '2L': 0 };
      let dispatched = { '200ml': 0, '500ml': 0, '1L': 0, '2L': 0 };

      const resProd = await fetch('https://aquro-backend-api.onrender.com/api/production');
      if (resProd.ok) {
        const parsed = await resProd.json();
        parsed.forEach(p => {
          if (produced[p.size] !== undefined) produced[p.size] += Number(p.qty || 0);
        });
      }

      const resDisp = await fetch('https://aquro-backend-api.onrender.com/api/dispatches');
      if (resDisp.ok) {
        const dispatches = await resDisp.json();
        dispatches.forEach(d => {
          if (dispatched[d.size] !== undefined) dispatched[d.size] += Number(d.qty || 0);
        });
      }

      const sizes = ['200ml', '500ml', '1L', '2L'];
      const newData = sizes.map(size => {
        const p = produced[size];
        const d = dispatched[size];
        const avail = p - d;
        return {
          size,
          produced: p,
          dispatched: d,
          available: avail,
          status: avail < 1000 ? 'Low Stock' : 'In Stock'
        };
      });

      setStockData(newData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('productionsUpdated', loadData);
    window.addEventListener('dispatchesUpdated', loadData);
    return () => {
      window.removeEventListener('productionsUpdated', loadData);
      window.removeEventListener('dispatchesUpdated', loadData);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ready Stock (Finished Goods)</h1>
          <p className="text-slate-500 text-sm mt-1">Live tracking of available water bottles ready for dispatch.</p>
        </div>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stockData.map((item) => (
          <div key={item.size} className={`glass-card p-6 border-t-4 ${item.available < 1000 ? 'border-t-orange-500' : 'border-t-aquro-500'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bottle Size</p>
                <h3 className="text-xl font-bold text-slate-800">{item.size}</h3>
              </div>
              <div className={`p-3 rounded-lg ${item.available < 1000 ? 'bg-orange-50 text-orange-600' : 'bg-aquro-50 text-aquro-600'}`}>
                <Package className="w-6 h-6" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 flex items-center gap-1"><Droplet className="w-3.5 h-3.5" /> Total Produced</span>
                  <span className="font-semibold text-slate-700">{item.produced.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Total Dispatched</span>
                  <span className="font-semibold text-slate-700">{item.dispatched.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Ready Available</p>
                    <h4 className={`text-2xl font-bold ${item.available < 1000 ? 'text-orange-600' : 'text-aquro-600'}`}>
                      {item.available.toLocaleString()}
                    </h4>
                  </div>
                  {item.available < 1000 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Low
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-aquro-500" /> Stock Breakdown
          </h2>
          <span className="text-xs text-slate-500">Last updated: {lastUpdated}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU / Size</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Manufactured</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Delivered</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Balance</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {stockData.map((item) => (
                <tr key={item.size} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-800">{item.size} Aquro Water</div>
                    <div className="text-xs text-slate-500">Finished Goods</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-600">
                    {item.produced.toLocaleString()} pcs
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-600">
                    {item.dispatched.toLocaleString()} pcs
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-800">
                    {item.available.toLocaleString()} pcs
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.available < 1000 ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
