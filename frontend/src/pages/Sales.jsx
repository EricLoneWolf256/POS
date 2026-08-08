import { useState, useEffect } from 'react';
import { Receipt, AlertCircle } from 'lucide-react';
import api, { formatCurrency, formatDate } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExportButton from '../components/ExportButton';

const PAYMENT_BADGE = {
  cash:          'badge-gray',
  mobile_money:  'badge-green',
  card:          'badge-blue',
  bank_transfer: 'badge-indigo',
  credit:        'badge-amber',
  mixed:         'badge-purple',
};

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('today');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { load(); }, [period]);

  const load = () => {
    setLoading(true); setError(false);
    Promise.all([
      api.get('/sales').then(res => setSales(res.data.sales)),
      api.get('/sales/reports/summary', { params: { period } }).then(res => setSummary(res.data)),
    ]).catch(() => setError(true)).finally(() => setLoading(false));
  };

  const periods = ['today', 'week', 'month'];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">Monitor transactions and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-md">
            {periods.map(p => (
              <button
                key={p}
                className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
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

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={15} className="shrink-0" />
          <span>Failed to load data. <button className="underline font-semibold" onClick={load}>Retry</button></span>
        </div>
      )}

      {/* Summary stat cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Sales',  value: summary.summary.total_sales,                                     iconBg: 'bg-blue-50',   iconColor: 'text-blue-600' },
            { label: 'Revenue',      value: formatCurrency(summary.summary.total_revenue, user?.currency),   iconBg: 'bg-green-50',  iconColor: 'text-green-600' },
            { label: 'Average Sale', value: formatCurrency(summary.summary.avg_sale, user?.currency),        iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
          ].map((s, i) => (
            <div key={s.label} className="card p-4 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <p className="text-xl font-semibold text-gray-900 tabular-nums leading-none">{s.value}</p>
              <p className="text-[12px] text-gray-400 font-light mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Top products + Cashier performance */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Products</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.topProducts.map(p => (
                  <tr key={p.product_name}>
                    <td className="font-medium text-gray-700">{p.product_name}</td>
                    <td className="tabular-nums text-gray-500">{p.qty_sold}</td>
                    <td className="text-right tabular-nums font-medium text-gray-900">
                      {formatCurrency(p.revenue, user?.currency)}
                    </td>
                  </tr>
                ))}
                {!summary.topProducts.length && (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-8 text-sm">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Cashier Performance</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Cashier</th>
                  <th>Sales</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.cashierPerformance.map(c => (
                  <tr key={c.first_name}>
                    <td className="font-medium text-gray-700">{c.first_name} {c.last_name}</td>
                    <td className="tabular-nums text-gray-500">{c.sales_count}</td>
                    <td className="text-right tabular-nums font-medium text-gray-900">
                      {formatCurrency(c.revenue, user?.currency)}
                    </td>
                  </tr>
                ))}
                {!summary.cashierPerformance.length && (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-8 text-sm">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Cashier</th>
                <th>Branch</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td>
                    <span className="font-mono text-[12px] text-gray-600">{s.sale_number}</span>
                  </td>
                  <td className="text-gray-600">{s.customer_name || 'Walk-in'}</td>
                  <td>
                    <span className="tabular-nums font-medium text-gray-900">
                      {formatCurrency(s.total_amount, user?.currency)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${PAYMENT_BADGE[s.payment_method] ?? 'badge-gray'}`}>
                      {s.payment_method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-gray-600">{s.cashier_first} {s.cashier_last}</td>
                  <td className="text-gray-500">{s.branch_name}</td>
                  <td className="tabular-nums text-gray-400">{formatDate(s.created_at)}</td>
                  <td>
                    <span className={`badge ${s.status === 'completed' ? 'badge-green' : s.status === 'voided' ? 'badge-red' : 'badge-amber'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!sales.length && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <Receipt size={32} className="text-gray-200" />
                      <p>No sales found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
