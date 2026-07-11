import { useState, useEffect } from 'react';
import api, { formatCurrency } from '../services/api';
import { Truck } from 'lucide-react';

export default function FieldSales() {
  const [trips, setTrips] = useState([]);
  const [performance, setPerformance] = useState([]);

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get('/field-sales/trips').then(res => setTrips(res.data));
    api.get('/field-sales/performance').then(res => setPerformance(res.data));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Field Sales</h1>
          <p className="text-sm text-slate-400 mt-1">Manage field salespeople, stock issuance, returns, and performance</p>
        </div>
      </div>

      {performance.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 mb-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Salesperson Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Salesperson</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Trips</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Sales</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Expenses</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net</th>
                </tr>
              </thead>
              <tbody>
                {performance.map(p => (
                  <tr key={p.first_name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">{p.first_name} {p.last_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{p.trips}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-800">{formatCurrency(p.total_sales)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatCurrency(p.total_expenses)}</td>
                    <td className={`py-3 px-4 text-sm font-semibold ${p.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(p.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
        <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Field Sales Trips</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Salesperson</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sales</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Expenses</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 text-sm text-slate-500">{new Date(t.trip_date).toLocaleDateString('en-UG')}</td>
                  <td className="py-3.5 px-4 text-sm font-medium text-slate-700">{t.first_name} {t.last_name}</td>
                  <td className="py-3.5 px-4 text-sm text-slate-600">{t.branch_name}</td>
                  <td className="py-3.5 px-4 text-sm font-semibold text-slate-800">{formatCurrency(t.total_sales)}</td>
                  <td className="py-3.5 px-4 text-sm text-slate-600">{formatCurrency(t.total_expenses)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${t.status === 'active' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Truck size={40} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm font-medium text-slate-400">No field sales trips yet</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
