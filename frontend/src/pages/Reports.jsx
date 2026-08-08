import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import api, { formatCurrency } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExportButton from '../components/ExportButton';

export default function Reports() {
  const [profitLoss, setProfitLoss] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [staffPerf, setStaffPerf] = useState([]);
  const { user } = useAuth();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const pl = await api.get('/reports/profit-loss');
      setProfitLoss(pl.data);
    } catch { /* premium feature */ }

    const inv = await api.get('/reports/inventory-valuation');
    setInventory(inv.data);

    try {
      const staff = await api.get('/reports/staff-performance');
      setStaffPerf(staff.data);
    } catch { /* premium feature */ }
  };

  const hasData = profitLoss || inventory || staffPerf.length > 0;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-subtitle">Financial and operational insights</p>
        </div>
        <ExportButton />
      </div>

      {/* Profit & Loss */}
      {profitLoss && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Profit &amp; Loss Statement</span>
            <ExportButton type="inline" exportKey="profit-loss" />
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Revenue',       value: formatCurrency(profitLoss.revenue, user?.currency),         color: 'text-gray-900' },
                { label: 'Cost of Goods', value: formatCurrency(profitLoss.costOfGoodsSold, user?.currency), color: 'text-red-600' },
                { label: 'Gross Profit',  value: formatCurrency(profitLoss.grossProfit, user?.currency),     color: 'text-green-700' },
                { label: 'Expenses',      value: formatCurrency(profitLoss.expenses, user?.currency),        color: 'text-amber-700' },
                {
                  label: 'Net Profit',
                  value: formatCurrency(profitLoss.netProfit, user?.currency),
                  color: profitLoss.netProfit >= 0 ? 'text-green-700' : 'text-red-600',
                },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-md p-4">
                  <p className={`text-lg font-semibold tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-[12px] text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Valuation */}
      {inventory && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Inventory Valuation</span>
            <div className="flex items-center gap-4">
              <div className="text-[13px] flex gap-4 text-gray-500">
                <span>Cost: <strong className="text-gray-700 tabular-nums">{formatCurrency(inventory.totals.costValue, user?.currency)}</strong></span>
                <span>Retail: <strong className="text-gray-700 tabular-nums">{formatCurrency(inventory.totals.retailValue, user?.currency)}</strong></span>
              </div>
              <ExportButton type="inline" exportKey="inventory" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Cost Value</th>
                  <th>Retail Value</th>
                </tr>
              </thead>
              <tbody>
                {inventory.items.map(i => (
                  <tr key={i.name}>
                    <td className="font-medium text-gray-700">{i.name}</td>
                    <td className="font-mono text-[12px] text-gray-500">{i.sku}</td>
                    <td className="tabular-nums font-medium text-gray-900">{i.total_qty}</td>
                    <td className="tabular-nums text-gray-600">{formatCurrency(i.cost_value, user?.currency)}</td>
                    <td className="tabular-nums font-medium text-gray-900">{formatCurrency(i.retail_value, user?.currency)}</td>
                  </tr>
                ))}
                {!inventory.items?.length && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-8 text-sm">No inventory data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Performance */}
      {staffPerf.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Staff Performance</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                  <th>Avg Sale</th>
                </tr>
              </thead>
              <tbody>
                {staffPerf.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium text-gray-700">{s.first_name} {s.last_name}</td>
                    <td><span className="badge badge-blue">{s.role}</span></td>
                    <td className="tabular-nums text-gray-600">{s.total_sales}</td>
                    <td className="tabular-nums font-medium text-gray-900">{formatCurrency(s.total_revenue, user?.currency)}</td>
                    <td className="tabular-nums text-gray-600">{formatCurrency(s.avg_sale_value, user?.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty */}
      {!hasData && (
        <div className="card">
          <div className="empty-state py-20">
            <BarChart3 size={36} className="text-gray-200" />
            <p>No report data available</p>
            <span>Data will appear as you process sales</span>
          </div>
        </div>
      )}
    </div>
  );
}
