import { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRightLeft, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StockPage() {
  const [stock, setStock] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [tab, setTab] = useState('inventory');
  const [showAdjust, setShowAdjust] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [adjustForm, setAdjustForm] = useState({ productId: '', quantity: '', notes: '' });
  const [transferForm, setTransferForm] = useState({ productId: '', fromBranchId: '', toBranchId: '', quantity: '', notes: '' });
  const { user } = useAuth();

  useEffect(() => { load(); }, [tab]);

  const load = () => {
    api.get('/stock').then(res => setStock(res.data));
    api.get('/stock/alerts').then(res => setAlerts(res.data));
    if (tab === 'movements') api.get('/stock/movements').then(res => setMovements(res.data));
  };

  const loadTransferData = () => {
    api.get('/products').then(res => setProducts(res.data));
    api.get('/auth/branches').then(res => setBranches(res.data));
    setShowTransfer(true);
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    await api.post('/stock/adjust', {
      productId: parseInt(adjustForm.productId),
      quantity: parseFloat(adjustForm.quantity),
      notes: adjustForm.notes,
    });
    setShowAdjust(false);
    setAdjustForm({ productId: '', quantity: '', notes: '' });
    load();
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    await api.post('/stock/transfer', {
      productId: parseInt(transferForm.productId),
      fromBranchId: parseInt(transferForm.fromBranchId),
      toBranchId: parseInt(transferForm.toBranchId),
      quantity: parseFloat(transferForm.quantity),
      notes: transferForm.notes || undefined,
    });
    setShowTransfer(false);
    setTransferForm({ productId: '', fromBranchId: '', toBranchId: '', quantity: '', notes: '' });
    load();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Stock Management</h1>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98]"
            onClick={loadTransferData}
          >
            <ArrowRightLeft size={16} /> Transfer
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]"
            onClick={() => setShowAdjust(true)}
          >
            Adjust Stock
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200/60 p-5 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <strong className="text-sm text-amber-800">{alerts.length} Low Stock Alert{alerts.length > 1 ? 's' : ''}</strong>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.slice(0, 5).map(a => (
              <span key={`${a.branch_id}-${a.product_name}`} className="inline-flex items-center px-3 py-1.5 bg-white/80 text-amber-700 rounded-xl text-xs font-semibold ring-1 ring-amber-200/50">
                {a.product_name} ({a.branch_name}): {a.quantity} left
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {['inventory', 'movements'].map(t => (
          <button
            key={t}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'inventory' ? 'Inventory' : 'Movement History'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
        {tab === 'inventory' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SKU</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quantity</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Threshold</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{s.product_name}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-500 font-mono">{s.sku}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{s.branch_name}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">{s.quantity}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-500">{s.low_stock_threshold}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        s.quantity <= 0 ? 'bg-red-50 text-red-600 ring-1 ring-red-100/50'
                        : s.quantity <= s.low_stock_threshold ? 'bg-red-50 text-red-600 ring-1 ring-red-100/50'
                        : s.quantity <= s.low_stock_threshold * 2 ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50'
                        : 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50'
                      }`}>
                        {s.quantity <= 0 ? 'Out of Stock' : s.quantity <= s.low_stock_threshold ? 'Low Stock' : s.quantity <= s.low_stock_threshold * 2 ? 'Warning' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-sm text-slate-500">{new Date(m.created_at).toLocaleString('en-UG')}</td>
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{m.product_name}</td>
                    <td className="py-3.5 px-5"><span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold ring-1 ring-blue-100/50">{m.movement_type.replace('_', ' ')}</span></td>
                    <td className={`py-3.5 px-5 text-sm font-semibold ${m.quantity < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{m.branch_name}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-500">{m.first_name} {m.last_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdjust && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowAdjust(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2"><ArrowRightLeft size={20} /> Adjust Stock</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowAdjust(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdjust}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Product</label>
                <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200" value={adjustForm.productId} onChange={e => setAdjustForm({...adjustForm, productId: e.target.value})} required>
                  <option value="">Select product</option>
                  {[...new Map(stock.map(s => [s.product_id, s])).values()].map(s => (
                    <option key={s.product_id} value={s.product_id}>{s.product_name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">New Quantity</label>
                <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200" type="number" value={adjustForm.quantity} onChange={e => setAdjustForm({...adjustForm, quantity: e.target.value})} required />
              </div>
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Notes</label>
                <textarea className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200" value={adjustForm.notes} onChange={e => setAdjustForm({...adjustForm, notes: e.target.value})} rows={3} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowAdjust(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]">Adjust</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowTransfer(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2"><ArrowRightLeft size={20} /> Transfer Stock</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowTransfer(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Product</label>
                <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200" value={transferForm.productId} onChange={e => setTransferForm({...transferForm, productId: e.target.value})} required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">From Branch</label>
                  <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200" value={transferForm.fromBranchId} onChange={e => setTransferForm({...transferForm, fromBranchId: e.target.value})} required>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">To Branch</label>
                  <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200" value={transferForm.toBranchId} onChange={e => setTransferForm({...transferForm, toBranchId: e.target.value})} required>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Quantity</label>
                <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200" type="number" value={transferForm.quantity} onChange={e => setTransferForm({...transferForm, quantity: e.target.value})} required />
              </div>
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Notes</label>
                <textarea className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200" value={transferForm.notes} onChange={e => setTransferForm({...transferForm, notes: e.target.value})} rows={3} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowTransfer(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]">Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
