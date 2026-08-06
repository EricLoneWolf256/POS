import { useState, useEffect } from 'react';
import api, { formatCurrency } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart3 } from 'lucide-react';
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

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Reports & Analytics</h1>
        <ExportButton />
      </div>

      {profitLoss && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 mb-6 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold tracking-tight text-slate-800">Profit & Loss Statement</h3>
            <ExportButton type="inline" exportKey="profit-loss" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Revenue', value: formatCurrency(profitLoss.revenue, user?.currency), color: 'text-slate-800' },
              { label: 'Cost of Goods', value: formatCurrency(profitLoss.costOfGoodsSold, user?.currency), color: 'text-rose-600' },
              { label: 'Gross Profit', value: formatCurrency(profitLoss.grossProfit, user?.currency), color: 'text-amber-600' },
              { label: 'Expenses', value: formatCurrency(profitLoss.expenses, user?.currency), color: 'text-amber-600' },
              { label: 'Net Profit', value: formatCurrency(profitLoss.netProfit, user?.currency), color: profitLoss.netProfit >= 0 ? 'text-amber-600' : 'text-rose-600' },
            ].map((s, i) => (
              <div key={s.label} className="bg-slate-50/80 rounded-xl border border-slate-200/60 p-4">
                <div className={`text-lg font-bold tracking-tight ${s.color}`}>{s.value}</div>
                <div className="text-[13px] text-slate-400 font-medium mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inventory && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 mb-6 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold tracking-tight text-slate-800">Inventory Valuation</h3>
            <div className="flex items-center gap-4">
              <div className="text-sm flex gap-4">
                <span className="text-slate-400">Cost: <strong className="text-slate-700">{formatCurrency(inventory.totals.costValue, user?.currency)}</strong></span>
                <span className="text-slate-400">Retail: <strong className="text-slate-700">{formatCurrency(inventory.totals.retailValue, user?.currency)}</strong></span>
              </div>
              <ExportButton type="inline" exportKey="inventory" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SKU</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cost Value</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Retail Value</th>
                </tr>
              </thead>
              <tbody>
                {inventory.items.map(i => (
                  <tr key={i.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">{i.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 font-mono">{i.sku}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-800">{i.total_qty}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatCurrency(i.cost_value, user?.currency)}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-800">{formatCurrency(i.retail_value, user?.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {staffPerf.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Staff Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Staff</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sales</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revenue</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Sale</th>
                </tr>
              </thead>
              <tbody>
                {staffPerf.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">{s.first_name} {s.last_name}</td>
                    <td className="py-3 px-4"><span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold ring-1 ring-blue-100/50">{s.role}</span></td>
                    <td className="py-3 px-4 text-sm text-slate-600">{s.total_sales}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-800">{formatCurrency(s.total_revenue, user?.currency)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatCurrency(s.avg_sale_value, user?.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!profitLoss && !inventory && staffPerf.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-sm shadow-slate-200/50">
          <BarChart3 size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="text-sm font-medium text-slate-400">No report data available</p>
        </div>
      )}
    </div>
  );
}
