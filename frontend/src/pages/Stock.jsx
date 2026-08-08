import { useState } from 'react';
import { AlertTriangle, ArrowRightLeft, Plus, X, Warehouse } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { TableLoading, TableError } from '../components/TableState';

export default function StockPage() {
  const [tab, setTab] = useState('inventory');
  const [showAdjust, setShowAdjust] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [adjustForm, setAdjustForm] = useState({ productId: '', quantity: '', notes: '' });
  const [transferForm, setTransferForm] = useState({ productId: '', fromBranchId: '', toBranchId: '', quantity: '', notes: '' });
  const { user } = useAuth();

  const { data, loading, error, reload } = useFetch(async () => {
    const [stockRes, alertsRes, movementsRes] = await Promise.all([
      api.get('/stock'),
      api.get('/stock/alerts'),
      api.get('/stock/movements'),
    ]);
    return { stock: stockRes.data, alerts: alertsRes.data, movements: movementsRes.data };
  }, [tab]);
  const { stock = [], alerts = [], movements = [] } = data || {};

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
    reload();
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
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Stock Management</h1>
          <p className="page-subtitle">Track inventory levels and movements</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={loadTransferData}>
            <ArrowRightLeft size={15} /> Transfer
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdjust(true)}>
            <Plus size={15} /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Low stock alerts */}
      {alerts.length > 0 && (
        <div className="alert alert-warn animate-fade-in">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1.5">{alerts.length} Low Stock Alert{alerts.length > 1 ? 's' : ''}</p>
            <div className="flex flex-wrap gap-1.5">
              {alerts.slice(0, 5).map(a => (
                <span key={`${a.branch_id}-${a.product_name}`} className="inline-flex items-center px-2 py-1 bg-white/70 text-amber-700 rounded text-xs font-medium border border-amber-200/60">
                  {a.product_name} ({a.branch_name}): {a.quantity} left
                </span>
              ))}
              {alerts.length > 5 && (
                <span className="text-xs text-amber-700 font-medium self-center">+{alerts.length - 5} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-md w-fit">
        {[
          { key: 'inventory', label: 'Inventory' },
          { key: 'movements', label: 'Movement History' },
        ].map(t => (
          <button
            key={t.key}
            className={`px-4 py-1.5 rounded text-[13px] font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'inventory' ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Branch</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoading colSpan={6} />
                ) : error ? (
                  <TableError colSpan={6} onRetry={reload} />
                ) : stock.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium text-gray-700">{s.product_name}</td>
                    <td className="font-mono text-[12px] text-gray-500">{s.sku}</td>
                    <td className="text-gray-600">{s.branch_name}</td>
                    <td className="tabular-nums font-medium text-gray-900">{s.quantity}</td>
                    <td className="tabular-nums text-gray-500">{s.low_stock_threshold}</td>
                    <td>
                      <span className={`badge ${
                        s.quantity <= 0 ? 'badge-red'
                        : s.quantity <= s.low_stock_threshold ? 'badge-red'
                        : s.quantity <= s.low_stock_threshold * 2 ? 'badge-amber'
                        : 'badge-green'
                      }`}>
                        {s.quantity <= 0 ? 'Out of Stock'
                          : s.quantity <= s.low_stock_threshold ? 'Low Stock'
                          : s.quantity <= s.low_stock_threshold * 2 ? 'Warning'
                          : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!stock.length && !loading && !error && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Warehouse size={32} className="text-gray-200" />
                        <p>No stock data</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Branch</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoading colSpan={6} />
                ) : error ? (
                  <TableError colSpan={6} onRetry={reload} />
                ) : movements.map(m => (
                  <tr key={m.id}>
                    <td className="tabular-nums text-gray-500 text-[12px]">
                      {new Date(m.created_at).toLocaleString('en-UG')}
                    </td>
                    <td className="font-medium text-gray-700">{m.product_name}</td>
                    <td>
                      <span className="badge badge-blue">{m.movement_type.replace('_', ' ')}</span>
                    </td>
                    <td className={`tabular-nums font-medium ${m.quantity < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td className="text-gray-600">{m.branch_name}</td>
                    <td className="text-gray-500">{m.first_name} {m.last_name}</td>
                  </tr>
                ))}
                {!movements.length && !loading && !error && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Warehouse size={32} className="text-gray-200" />
                        <p>No movement history</p>
                        <span>Adjustments and transfers will appear here</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjust && (
        <div className="modal-overlay" onClick={() => setShowAdjust(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <ArrowRightLeft size={16} /> Adjust Stock
              </h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowAdjust(false)}>
                <X size={16} />
              </button>
            </div>
            <form id="adjust-form" onSubmit={handleAdjust}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Product</label>
                  <select
                    className="input"
                    value={adjustForm.productId}
                    onChange={e => setAdjustForm({...adjustForm, productId: e.target.value})}
                    required
                  >
                    <option value="">Select product</option>
                    {[...new Map(stock.map(s => [s.product_id, s])).values()].map(s => (
                      <option key={s.product_id} value={s.product_id}>{s.product_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">New Quantity</label>
                  <input
                    className="input"
                    type="number"
                    value={adjustForm.quantity}
                    onChange={e => setAdjustForm({...adjustForm, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={adjustForm.notes}
                    onChange={e => setAdjustForm({...adjustForm, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjust(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Adjust</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {showTransfer && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <ArrowRightLeft size={16} /> Transfer Stock
              </h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowTransfer(false)}>
                <X size={16} />
              </button>
            </div>
            <form id="transfer-form" onSubmit={handleTransfer}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Product</label>
                  <select
                    className="input"
                    value={transferForm.productId}
                    onChange={e => setTransferForm({...transferForm, productId: e.target.value})}
                    required
                  >
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">From Branch</label>
                    <select
                      className="input"
                      value={transferForm.fromBranchId}
                      onChange={e => setTransferForm({...transferForm, fromBranchId: e.target.value})}
                      required
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">To Branch</label>
                    <select
                      className="input"
                      value={transferForm.toBranchId}
                      onChange={e => setTransferForm({...transferForm, toBranchId: e.target.value})}
                      required
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Quantity</label>
                  <input
                    className="input"
                    type="number"
                    value={transferForm.quantity}
                    onChange={e => setTransferForm({...transferForm, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={transferForm.notes}
                    onChange={e => setTransferForm({...transferForm, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransfer(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
