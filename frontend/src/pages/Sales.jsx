import { useState, useEffect } from 'react';
import api, { formatCurrency, formatDate } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExportButton from '../components/ExportButton';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('today');
  const { user } = useAuth();

  useEffect(() => { load(); }, [period]);

  const load = () => {
    api.get('/sales').then(res => setSales(res.data.sales));
    api.get('/sales/reports/summary', { params: { period } }).then(res => setSummary(res.data));
  };

  const periods = ['today', 'week', 'month'];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Sales</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {periods.map(p => (
              <button
                key={p}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                  period === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <ExportButton />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          {[
            { label: 'Total Sales', value: summary.summary.total_sales, color: 'text-slate-800' },
            { label: 'Revenue', value: formatCurrency(summary.summary.total_revenue, user?.currency), color: 'text-amber-600' },
            { label: 'Avg Sale', value: formatCurrency(summary.summary.avg_sale, user?.currency), color: 'text-blue-600' },
          ].map((s, i) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm shadow-slate-200/50 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
              <div className="text-[13px] text-slate-400 font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {summary && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
              <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Top Products</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topProducts.map(p => (
                    <tr key={p.product_name} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">{p.product_name}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{p.qty_sold}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-800">{formatCurrency(p.revenue, user?.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
              <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Cashier Performance</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cashier</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sales</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.cashierPerformance.map(c => (
                    <tr key={c.first_name} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">{c.first_name} {c.last_name}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{c.sales_count}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-800">{formatCurrency(c.revenue, user?.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
        <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">All Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sale #</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Payment</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cashier</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-slate-700">{s.sale_number}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{s.customer_name || 'Walk-in'}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-800">{formatCurrency(s.total_amount, user?.currency)}</td>
                  <td className="py-3 px-4"><span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold ring-1 ring-blue-100/50">{s.payment_method}</span></td>
                  <td className="py-3 px-4 text-sm text-slate-600">{s.cashier_first} {s.cashier_last}</td>
                  <td className="py-3 px-4 text-sm text-slate-500">{s.branch_name}</td>
                  <td className="py-3 px-4 text-sm text-slate-400">{formatDate(s.created_at)}</td>
                  <td className="py-3 px-4"><span className="inline-flex px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold ring-1 ring-amber-100/50">{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
