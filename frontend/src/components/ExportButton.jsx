import { useState } from 'react';
import api from '../services/api';
import { Download, FileText, Table } from 'lucide-react';

const exports = [
  { key: 'sales', label: 'Sales', icon: 'receipt' },
  { key: 'inventory', label: 'Inventory', icon: 'package' },
  { key: 'customers', label: 'Customers', icon: 'users' },
  { key: 'purchases', label: 'Purchases', icon: 'shopping-cart' },
  { key: 'profit-loss', label: 'Profit & Loss', icon: 'chart' },
];

export default function ExportButton({ type = 'dropdown', className = '' }) {
  const [loading, setLoading] = useState(null);
  const [open, setOpen] = useState(false);

  const doExport = async (key, format) => {
    setLoading(`${key}-${format}`);
    try {
      const res = await api.get(`/exports/${key}`, {
        params: { format },
        responseType: 'blob',
      });
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${key}_export.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(null);
      setOpen(false);
    }
  };

  if (type === 'inline') {
    return (
      <div className="flex gap-1.5">
        <button onClick={() => doExport(className, 'csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all active:scale-[0.98]">
          <FileText size={13} /> CSV
        </button>
        <button onClick={() => doExport(className, 'xlsx')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg hover:bg-emerald-100 transition-all active:scale-[0.98]">
          <Table size={13} /> Excel
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]">
        <Download size={15} /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200/80 z-[110] animate-modal-enter overflow-hidden">
            {exports.map(e => (
              <div key={e.key} className="px-2 py-1.5 border-b border-slate-50 last:border-0">
                <p className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase">{e.label}</p>
                <div className="flex gap-1">
                  <button disabled={loading === `${e.key}-csv`} onClick={() => doExport(e.key, 'csv')} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                    <FileText size={11} /> CSV
                  </button>
                  <button disabled={loading === `${e.key}-xlsx`} onClick={() => doExport(e.key, 'xlsx')} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all">
                    <Table size={11} /> Excel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
