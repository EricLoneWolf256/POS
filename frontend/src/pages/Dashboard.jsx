import { useState, useEffect } from 'react';
import {
  DollarSign, ShoppingBag, Package, AlertTriangle, Users, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api, { formatCurrency } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PAYMENT_BADGE = {
  cash:          'badge-gray',
  mobile_money:  'badge-green',
  card:          'badge-blue',
  bank_transfer: 'badge-indigo',
  credit:        'badge-amber',
  mixed:         'badge-purple',
};

function StatCard({ icon: Icon, label, value, iconBg, iconColor, highlight }) {
  return (
    // Von Restorff: highlighted card gets red border + subtle red tint to stand out
    <div className={`card p-4 flex items-center gap-4 ${highlight ? 'border-red-300 bg-red-50/30' : ''}`}>
      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={18} className={iconColor} strokeWidth={1.5} />
      </div>
      <div>
        <p className={`text-xl font-medium tabular-nums leading-none ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        <p className="text-[12px] text-gray-400 font-light mt-1 leading-none">{label}</p>
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  );
};

// Skeleton shimmer — Aesthetic-Usability + Progressive Disclosure
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-48" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-md shrink-0" />
            <div className="space-y-2 flex-1"><Skeleton className="h-6 w-16" /><Skeleton className="h-3 w-24" /></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="card p-5 lg:col-span-3"><Skeleton className="h-[240px]" /></div>
        <div className="card lg:col-span-2"><Skeleton className="h-[240px]" /></div>
      </div>
      <div className="card"><Skeleton className="h-[200px]" /></div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError(true));
  }, []);

  // Progressive Disclosure: show skeleton shaped like the real content
  if (!data && !error) return <DashboardSkeleton />;

  // Feedback principle: show error state if API failed
  if (error) return (
    <div className="space-y-5 animate-fade-in">
      <div><h1 className="page-title">Dashboard</h1></div>
      <div className="alert alert-error">
        <AlertTriangle size={16} className="shrink-0" />
        <span>Failed to load dashboard data. Check your connection and <button className="underline font-semibold" onClick={() => { setError(false); api.get('/dashboard').then(r => setData(r.data)).catch(() => setError(true)); }}>try again</button>.</span>
      </div>
    </div>
  );

  const stats = [
    { label: "Today's Revenue", value: formatCurrency(data.today.revenue, user?.currency), icon: DollarSign,    iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',  highlight: false },
    { label: "Today's Sales",   value: data.today.count,                                   icon: ShoppingBag,   iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', highlight: false },
    { label: 'Total Products',  value: data.products,                                      icon: Package,       iconBg: 'bg-gray-100',  iconColor: 'text-gray-500',  highlight: false },
    // Von Restorff: Low Stock stands out with red border + red text when > 0
    { label: 'Low Stock',       value: data.lowStockAlerts,                                icon: AlertTriangle, iconBg: 'bg-red-50',    iconColor: 'text-red-500',   highlight: data.lowStockAlerts > 0 },
    { label: 'Customers',       value: data.customers,                                     icon: Users,         iconBg: 'bg-green-50',  iconColor: 'text-green-600', highlight: false },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-gray-400 font-medium">
          <TrendingUp size={13} className="text-blue-400" />
          Live data
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Bar chart — wider */}
        <div className="card p-5 lg:col-span-3">
          <div className="card-header" style={{ padding: '0 0 16px 0', border: 'none' }}>
            <span className="card-title">Sales — last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data.salesChart} barCategoryGap="38%">
              <XAxis
                dataKey="date"
                tickFormatter={d => new Date(d).toLocaleDateString('en-UG', { weekday: 'short' })}
                axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                width={34}
              />
              <Tooltip
                cursor={{ fill: 'rgba(26,115,232,0.04)' }}
                content={<ChartTooltip currency={user?.currency} />}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {(data.salesChart || []).map((_, i, arr) => (
                  <Cell key={i} fill={i === arr.length - 1 ? '#1a73e8' : '#e5e7eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Branch performance */}
        <div className="card lg:col-span-2 flex flex-col">
          <div className="card-header">
            <span className="card-title">Branches — today</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th className="text-right">Sales</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.branchPerformance.map((b, i) => (
                  <tr key={i}>
                    <td className="font-medium text-gray-700">{b.name}</td>
                    <td className="text-right tabular-nums text-gray-500">{b.sales_count}</td>
                    <td className="text-right tabular-nums font-semibold text-gray-900">
                      {formatCurrency(b.revenue, user?.currency)}
                    </td>
                  </tr>
                ))}
                {!data.branchPerformance.length && (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-6 text-sm">No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent sales</span>
          <a
            href="/app/sales"
            className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            View all <ArrowUpRight size={13} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Cashier</th>
                <th className="text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.map(s => (
                <tr key={s.sale_number}>
                  <td>
                    <span className="font-mono text-[12px] text-gray-600">{s.sale_number}</span>
                  </td>
                  <td>
                    <span className="font-normal text-gray-900 tabular-nums">
                      {formatCurrency(s.total_amount, user?.currency)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${PAYMENT_BADGE[s.payment_method] ?? 'badge-gray'}`}>
                      {s.payment_method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-gray-500">{s.cashier_first} {s.cashier_last}</td>
                  <td className="text-right tabular-nums text-gray-400">
                    {new Date(s.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {!data.recentSales.length && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8 text-sm">No sales today yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
