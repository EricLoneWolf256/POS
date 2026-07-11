import { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Package, AlertTriangle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api, { formatCurrency } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data));
  }, []);

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center animate-pulse">
        <div className="w-4 h-4 rounded bg-teal-400" />
      </div>
      <p className="text-sm text-slate-400 font-medium">Loading dashboard...</p>
    </div>
  );

  const stats = [
    { label: "Today's Revenue", value: formatCurrency(data.today.revenue, user?.currency), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
    { label: "Today's Sales", value: data.today.count, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-100' },
    { label: 'Products', value: data.products, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-100' },
    { label: 'Low Stock Alerts', value: data.lowStockAlerts, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-100' },
    { label: 'Customers', value: data.customers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-100' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
        {stats.map((s, i) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-start gap-4 shadow-sm shadow-slate-200/50 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-200 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ring-1 ${s.ring}`}>
              <s.icon size={22} className={s.color} />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-slate-800">{s.value}</div>
              <div className="text-[13px] text-slate-400 font-medium mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Sales (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.salesChart}>
              <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-UG', { weekday: 'short' })} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                cursor={{ fill: 'rgba(20,184,166,0.05)' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                formatter={(v) => formatCurrency(v, user?.currency)}
              />
              <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Branch Performance (Today)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sales</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.branchPerformance.map(b => (
                  <tr key={b.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">{b.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{b.sales_count}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-800">{formatCurrency(b.revenue, user?.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 mt-6 shadow-sm shadow-slate-200/50">
        <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Recent Sales</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sale #</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Payment</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cashier</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.map(s => (
                <tr key={s.sale_number} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-slate-700">{s.sale_number}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-800">{formatCurrency(s.total_amount, user?.currency)}</td>
                  <td className="py-3 px-4"><span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold ring-1 ring-blue-100/50">{s.payment_method}</span></td>
                  <td className="py-3 px-4 text-sm text-slate-600">{s.cashier_first} {s.cashier_last}</td>
                  <td className="py-3 px-4 text-sm text-slate-400">{new Date(s.created_at).toLocaleTimeString('en-UG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
