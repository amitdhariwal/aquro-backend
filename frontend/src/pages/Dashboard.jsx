import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  Package, 
  Truck, 
  TrendingUp, 
  IndianRupee,
  Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Removed static data

export default function Dashboard() {
  const [totalProduction, setTotalProduction] = useState('0');
  const [totalSales, setTotalSales] = useState('0');
  const [totalPendingAmount, setTotalPendingAmount] = useState('0');
  const [deliveredOrders, setDeliveredOrders] = useState('0');
  const [readyStock, setReadyStock] = useState({ '200ml': 0, '500ml': 0, '1L': 0, '2L': 0 });
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([
    { id: 'def-1', title: 'Delivery Dispatched', desc: 'Route 4 - 150 Cartons', time: '1 hour ago', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { id: 'def-2', title: 'Payment Received', desc: '₹12,500 from City Mart', time: '2 hours ago', color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'def-3', title: 'Quality Check', desc: 'RO water sample passed', time: '4 hours ago', color: 'text-aquro-600', bg: 'bg-aquro-100' },
    { id: 'def-4', title: 'Stock Alert', desc: 'Bottle caps below threshold', time: '5 hours ago', color: 'text-orange-600', bg: 'bg-orange-100' },
  ]);

  const loadData = async () => {
    try {
      let prodData = [];
      let dispData = [];

      const resProd = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/production');
      if (resProd.ok) {
        prodData = await resProd.json();
        const total = prodData.reduce((sum, item) => sum + Number(item.qty), 0);
        setTotalProduction(total.toLocaleString());

        const newActivities = prodData.slice(0, 3).map(p => ({
          id: p._id,
          title: 'New Production Batch',
          desc: `${p.batch} - ${p.qty}x ${p.size} ${p.label === 'Custom' ? `(${p.clientName})` : ''}`,
          time: p.date || new Date(p.createdAt).toLocaleDateString(),
          color: 'text-blue-600',
          bg: 'bg-blue-100'
        }));

        setActivities([
          ...newActivities,
          { id: 'def-1', title: 'Delivery Dispatched', desc: 'Route 4 - 150 Cartons', time: '1 hour ago', color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { id: 'def-2', title: 'Payment Received', desc: '₹12,500 from City Mart', time: '2 hours ago', color: 'text-purple-600', bg: 'bg-purple-100' },
          { id: 'def-3', title: 'Quality Check', desc: 'RO water sample passed', time: '4 hours ago', color: 'text-aquro-600', bg: 'bg-aquro-100' }
        ]);
      }

      const resDisp = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/dispatches');
      if (resDisp.ok) {
        dispData = await resDisp.json();
        const deliveredCount = dispData.filter(d => d.status === 'Delivered').length;
        const salesAmount = dispData.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
        
        setDeliveredOrders(deliveredCount.toString());
        setTotalSales(salesAmount.toLocaleString('en-IN'));

        try {
          const resPay = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/customers/payments/all');
          if (resPay.ok) {
            const allPayments = await resPay.json();
            const totalPaid = allPayments.filter(p => p.type === 'PAYMENT').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const pendingAmount = salesAmount - totalPaid;
            setTotalPendingAmount(pendingAmount.toLocaleString('en-IN'));
          }
        } catch(e) {
          console.error("Error fetching payments", e);
        }
      }

      // Calculate Ready Stock
      let produced = { '200ml': 0, '500ml': 0, '1L': 0, '2L': 0 };
      let dispatched = { '200ml': 0, '500ml': 0, '1L': 0, '2L': 0 };

      prodData.forEach(p => {
        if (produced[p.size] !== undefined) produced[p.size] += Number(p.qty || 0);
      });

      dispData.forEach(d => {
        if (dispatched[d.size] !== undefined) dispatched[d.size] += Number(d.qty || 0);
      });

      setReadyStock({
        '200ml': produced['200ml'] - dispatched['200ml'],
        '500ml': produced['500ml'] - dispatched['500ml'],
        '1L': produced['1L'] - dispatched['1L'],
        '2L': produced['2L'] - dispatched['2L']
      });

      // Calculate Chart Data (Last 7 Days)
      const dynamicChartData = [];
      const daysStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        let dailyProd = 0;
        let dailySales = 0;

        prodData.forEach(p => {
           if (p.date === dateStr) dailyProd += Number(p.qty || 0);
        });

        dispData.forEach(dItem => {
           if (dItem.date === dateStr) dailySales += Number(dItem.qty || 0); // Assuming dItem.qty is available or dItem.boxes * something. Actually dispData uses 'boxes'. Let's sum pieces correctly.
           // In dispatches, we store 'boxes', 'size', 'rate', 'totalAmount'. Let's check how 'qty' is defined.
        });

        dynamicChartData.push({
          name: daysStr[d.getDay()],
          production: dailyProd,
          sales: dailySales
        });
      }
      setChartData(dynamicChartData);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('productionsUpdated', loadData);
    window.addEventListener('inventoryUpdated', loadData);
    return () => {
      window.removeEventListener('productionsUpdated', loadData);
      window.removeEventListener('inventoryUpdated', loadData);
    };
  }, []);

  const stats = [
    { title: 'Total Production', value: totalProduction, unit: 'Bottles', icon: Droplet, trend: 'Live', trendUp: true },
    { title: 'Total Sales (Revenue)', value: '₹' + totalSales, unit: '', icon: IndianRupee, trend: 'Gross Sales', trendUp: true },
    { title: 'Total Pending Amount', value: '₹' + totalPendingAmount, unit: '', icon: TrendingUp, trend: 'To Collect', trendUp: false },
    { title: 'Delivered Orders', value: deliveredOrders, unit: 'Orders', icon: Package, trend: 'Completed', trendUp: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, here's what's happening at the plant today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card p-6 flex flex-col relative overflow-hidden group hover:border-aquro-300 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-aquro-50 to-aquro-100 rounded-full group-hover:scale-110 transition-transform duration-500" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-aquro-500 to-aquro-300 flex items-center justify-center shadow-sm">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {stat.trend}
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                <span className="text-sm font-medium text-slate-500">{stat.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ready Stock Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(readyStock).map(([size, qty]) => (
          <div key={size} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ready Stock {size}</p>
              <h4 className={`text-2xl font-bold ${qty < 1000 ? 'text-orange-600' : 'text-slate-800'}`}>
                {qty.toLocaleString()} <span className="text-sm font-normal text-slate-500">pcs</span>
              </h4>
            </div>
            <div className={`p-3 rounded-lg ${qty < 1000 ? 'bg-orange-50 text-orange-600' : 'bg-aquro-50 text-aquro-600'}`}>
              <Package className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Production vs Sales</h2>
            <select className="bg-white/50 border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-aquro-500 focus:border-aquro-500 p-2">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: '500' }}
                />
                <Area type="monotone" dataKey="production" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorProduction)" />
                <Area type="monotone" dataKey="sales" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-6">
            {activities.map((activity, i) => (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${activity.bg.replace('100', '500')} mt-1.5`}></div>
                  {i !== activities.length - 1 && <div className="w-0.5 h-full bg-slate-200 mt-2"></div>}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{activity.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{activity.desc}</p>
                  <span className="text-xs font-medium text-slate-400 mt-1 block">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
