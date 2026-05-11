import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, TrendingUp, TrendingDown, IndianRupee, Droplet, Receipt, Package, FileText } from 'lucide-react';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#ef4444'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('month'); // month, prev_month, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [metrics, setMetrics] = useState({
    sales: 0,
    operationalExpenses: 0,
    materialPurchases: 0,
    totalExpenses: 0,
    profit: 0,
    bottlesProduced: 0
  });

  const [chartData, setChartData] = useState([]);
  const [expensePieData, setExpensePieData] = useState([]);

  // Set default dates on load
  useEffect(() => {
    handleDateRangeChange('month');
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      generateReport();
    }
  }, [startDate, endDate]);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (range === 'prev_month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (range === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (range === 'today') {
      start = today;
      end = today;
    }
    
    // For 'custom', we don't automatically set, user selects manually via inputs

    if (range !== 'custom') {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const generateReport = async () => {
    try {
      // 1. Fetch Data
      const [dispRes, expRes, invHistRes, prodRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/dispatches'),
        fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/expenses'),
        fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/inventory/history'),
        fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/production')
      ]);

      const dispatches = dispRes.ok ? await dispRes.json() : [];
      const expenses = expRes.ok ? await expRes.json() : [];
      const inventoryHistory = invHistRes.ok ? await invHistRes.json() : [];
      const productions = prodRes.ok ? await prodRes.json() : [];

    // Convert string to Date objects for comparison
    const startObj = new Date(startDate);
    startObj.setHours(0, 0, 0, 0);
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

    const isWithinRange = (dateStr) => {
      const d = new Date(dateStr);
      return d >= startObj && d <= endObj;
    };

    // 2. Filter Data
    const fDispatches = dispatches.filter(d => isWithinRange(d.date));
    const fExpenses = expenses.filter(e => isWithinRange(e.date));
    const fInvHistory = inventoryHistory.filter(h => isWithinRange(h.date) && h.amount > 0);
    const fProductions = productions.filter(p => isWithinRange(p.date));

    // 3. Calculate KPIs
    const totalSales = fDispatches.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
    const opExpenses = fExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const matPurchases = fInvHistory.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
    const totalExp = opExpenses + matPurchases;
    const profit = totalSales - totalExp;
    const bottlesProd = fProductions.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

    setMetrics({
      sales: totalSales,
      operationalExpenses: opExpenses,
      materialPurchases: matPurchases,
      totalExpenses: totalExp,
      profit: profit,
      bottlesProduced: bottlesProd
    });

    // 4. Generate Daily Chart Data
    const dailyMap = {};
    
    // Initialize dates (to ensure continuous line even if no data on some days)
    // Only do this if range is small (< 35 days)
    const diffTime = Math.abs(endObj - startObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 35) {
      for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dailyMap[dateStr] = { date: dateStr, displayDate: d.getDate() + '/' + (d.getMonth()+1), sales: 0, expenses: 0 };
      }
    }

    // Accumulate Sales
    fDispatches.forEach(d => {
      const dStr = new Date(d.date).toISOString().split('T')[0];
      if (!dailyMap[dStr]) dailyMap[dStr] = { date: dStr, displayDate: new Date(d.date).getDate() + '/' + (new Date(d.date).getMonth()+1), sales: 0, expenses: 0 };
      dailyMap[dStr].sales += (Number(d.totalAmount) || 0);
    });

    // Accumulate OP Expenses
    fExpenses.forEach(e => {
      const dStr = new Date(e.date).toISOString().split('T')[0];
      if (!dailyMap[dStr]) dailyMap[dStr] = { date: dStr, displayDate: new Date(e.date).getDate() + '/' + (new Date(e.date).getMonth()+1), sales: 0, expenses: 0 };
      dailyMap[dStr].expenses += (Number(e.amount) || 0);
    });

    // Accumulate Mat Purchases
    fInvHistory.forEach(h => {
      const dStr = new Date(h.date).toISOString().split('T')[0];
      if (!dailyMap[dStr]) dailyMap[dStr] = { date: dStr, displayDate: new Date(h.date).getDate() + '/' + (new Date(h.date).getMonth()+1), sales: 0, expenses: 0 };
      dailyMap[dStr].expenses += (Number(h.amount) || 0);
    });

    const sortedChartData = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    setChartData(sortedChartData);

    // 5. Generate Pie Chart Data for Expenses
    const catMap = {};
    fExpenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0);
    });
    if (matPurchases > 0) {
      catMap['Raw Materials'] = matPurchases;
    }

    const pieData = Object.keys(catMap).map(key => ({
      name: key,
      value: catMap[key]
    })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

    setExpensePieData(pieData);
    } catch (error) {
      console.error(error);
    }
  };

  const downloadReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Financial Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #0284c7; font-size: 28px; font-weight: 800; }
            .header p { margin: 5px 0 0; font-size: 14px; color: #64748b; }
            .grid-container { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
            .card { flex: 1; min-width: 200px; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; }
            .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; }
            .card p { margin: 0; font-size: 24px; font-weight: bold; color: #0f172a; }
            .profit-card { background: ${metrics.profit >= 0 ? '#ecfdf5' : '#fef2f2'}; border-color: ${metrics.profit >= 0 ? '#10b981' : '#ef4444'}; }
            .profit-card p { color: ${metrics.profit >= 0 ? '#059669' : '#dc2626'}; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
            th { background-color: #f1f5f9; color: #334155; }
            .text-right { text-align: right; }
            
            .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AQURO WATER - FINANCIAL REPORT</h1>
            <p>Report Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="grid-container">
            <div class="card">
              <h3>Total Revenue (Sales)</h3>
              <p>₹${metrics.sales.toLocaleString()}</p>
            </div>
            <div class="card">
              <h3>Total Expenses</h3>
              <p>₹${metrics.totalExpenses.toLocaleString()}</p>
            </div>
            <div class="card profit-card">
              <h3>Net Profit / Loss</h3>
              <p>₹${metrics.profit.toLocaleString()}</p>
            </div>
            <div class="card">
              <h3>Total Production</h3>
              <p>${metrics.bottlesProduced.toLocaleString()} Bottles</p>
            </div>
          </div>

          <div class="section-title">Expense Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Expense Category</th>
                <th class="text-right">Amount (₹)</th>
                <th class="text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              ${expensePieData.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td class="text-right">₹${item.value.toLocaleString()}</td>
                  <td class="text-right">${((item.value / metrics.totalExpenses) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold; background: #f8fafc;">
                <td>TOTAL</td>
                <td class="text-right">₹${metrics.totalExpenses.toLocaleString()}</td>
                <td class="text-right">100%</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px;">
            This is an automated system generated report. 
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-aquro-100 text-aquro-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
            <p className="text-slate-500 text-sm mt-0.5">Analyze revenue, expenses, and profitability.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <button 
              onClick={() => handleDateRangeChange('today')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === 'today' ? 'bg-white shadow-sm text-aquro-600' : 'text-slate-500 hover:text-slate-700'}`}
            >Today</button>
            <button 
              onClick={() => handleDateRangeChange('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === 'month' ? 'bg-white shadow-sm text-aquro-600' : 'text-slate-500 hover:text-slate-700'}`}
            >This Month</button>
            <button 
              onClick={() => handleDateRangeChange('year')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === 'year' ? 'bg-white shadow-sm text-aquro-600' : 'text-slate-500 hover:text-slate-700'}`}
            >This Year</button>
            <button 
              onClick={() => handleDateRangeChange('custom')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === 'custom' ? 'bg-white shadow-sm text-aquro-600' : 'text-slate-500 hover:text-slate-700'}`}
            >Custom</button>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" className="p-2 border border-slate-200 rounded-lg text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="text-slate-400">to</span>
              <input type="date" className="p-2 border border-slate-200 rounded-lg text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          )}
          
          <button 
            onClick={downloadReport}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg shadow-sm hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-medium ml-auto sm:ml-0"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <p className="text-sm font-medium text-slate-500">Total Revenue (Sales)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">₹{metrics.sales.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl z-10"><TrendingUp className="w-6 h-6" /></div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><IndianRupee className="w-24 h-24" /></div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-red-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <p className="text-sm font-medium text-slate-500">Total Expenses</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">₹{metrics.totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl z-10"><TrendingDown className="w-6 h-6" /></div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><Receipt className="w-24 h-24" /></div>
          </div>
        </div>

        <div className={`glass-card p-6 border-l-4 relative overflow-hidden group ${metrics.profit >= 0 ? 'border-l-aquro-500' : 'border-l-orange-500'}`}>
          <div className="flex justify-between items-start">
            <div className="z-10">
              <p className="text-sm font-medium text-slate-500">Net {metrics.profit >= 0 ? 'Profit' : 'Loss'}</p>
              <h3 className={`text-2xl font-bold mt-2 ${metrics.profit >= 0 ? 'text-aquro-600' : 'text-orange-500'}`}>
                ₹{Math.abs(metrics.profit).toLocaleString()}
              </h3>
            </div>
            <div className={`p-3 rounded-xl z-10 ${metrics.profit >= 0 ? 'bg-aquro-50 text-aquro-600' : 'bg-orange-50 text-orange-600'}`}>
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-blue-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <p className="text-sm font-medium text-slate-500">Production Volume</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{metrics.bottlesProduced.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl z-10"><Droplet className="w-6 h-6" /></div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><Package className="w-24 h-24" /></div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales vs Expenses Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Sales vs Expenses Trend</h3>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Daily Data</span>
          </div>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" name="Revenue (Sales)" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" name="Total Expenses" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center flex-col text-slate-400">
                <BarChart className="w-12 h-12 mb-2 opacity-20" />
                <p>No financial data in this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-6">Expense Breakdown</h3>
          <div className="flex-1 min-h-[250px]">
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400">
                <p>No expenses recorded</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 space-y-3">
            {expensePieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-600 truncate max-w-[120px]" title={item.name}>{item.name}</span>
                </div>
                <div className="font-bold text-slate-800">
                  ₹{item.value.toLocaleString()} 
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    ({((item.value / metrics.totalExpenses) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
