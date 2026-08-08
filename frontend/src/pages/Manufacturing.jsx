import { useState } from 'react';
import { Plus, X, Factory } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import { TableLoading, TableError } from '../components/TableState';

export default function Manufacturing() {
  const [tab, setTab] = useState('materials');
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showBomModal, setShowBomModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: '', sku: '', unit: 'kg', costPerUnit: 0 });
  const [bomForm, setBomForm] = useState({ name: '', productId: '', outputQuantity: 1, items: [{ materialId: '', quantity: 1 }] });
  const [orderForm, setOrderForm] = useState({ bomId: '', quantity: 1, branchId: '' });
  const [branches, setBranches] = useState([]);

  const { data, loading, error, reload } = useFetch(async () => {
    const [materials, boms, orders, products, branchesRes] = await Promise.all([
      api.get('/manufacturing/materials'),
      api.get('/manufacturing/bom'),
      api.get('/manufacturing/orders'),
      api.get('/products'),
      api.get('/auth/branches'),
    ]);
    setBranches(branchesRes.data);
    return { materials: materials.data, boms: boms.data, orders: orders.data, products: products.data };
  }, [tab]);
  const { materials = [], boms = [], orders = [], products = [] } = data || {};

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    await api.post('/manufacturing/materials', { ...materialForm, costPerUnit: parseFloat(materialForm.costPerUnit) });
    setShowMaterialModal(false);
    setMaterialForm({ name: '', sku: '', unit: 'kg', costPerUnit: 0 });
    reload();
  };

  const handleBomSubmit = async (e) => {
    e.preventDefault();
    await api.post('/manufacturing/bom', {
      name: bomForm.name,
      productId: parseInt(bomForm.productId),
      outputQuantity: parseInt(bomForm.outputQuantity),
      items: bomForm.items.map(i => ({ materialId: parseInt(i.materialId), quantity: parseFloat(i.quantity) })),
    });
    setShowBomModal(false);
    setBomForm({ name: '', productId: '', outputQuantity: 1, items: [{ materialId: '', quantity: 1 }] });
    reload();
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    await api.post('/manufacturing/orders', {
      bomId: parseInt(orderForm.bomId),
      quantity: parseInt(orderForm.quantity),
      branchId: parseInt(orderForm.branchId) || undefined,
    });
    setShowOrderModal(false);
    setOrderForm({ bomId: '', quantity: 1, branchId: '' });
    reload();
  };

  const addBomItem = () => setBomForm({ ...bomForm, items: [...bomForm.items, { materialId: '', quantity: 1 }] });
  const removeBomItem = (idx) => setBomForm({ ...bomForm, items: bomForm.items.filter((_, i) => i !== idx) });
  const updateBomItem = (idx, field, value) => {
    const items = [...bomForm.items];
    items[idx] = { ...items[idx], [field]: value };
    setBomForm({ ...bomForm, items });
  };

  const addActions = {
    materials: { label: 'Add Material', onClick: () => setShowMaterialModal(true) },
    bom:       { label: 'Create BOM',   onClick: () => setShowBomModal(true) },
    orders:    { label: 'New Order',    onClick: () => setShowOrderModal(true) },
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Manufacturing</h1>
          <p className="page-subtitle">Manage raw materials, BOMs, and production orders</p>
        </div>
        <button className="btn btn-primary" onClick={addActions[tab].onClick}>
          <Plus size={15} /> {addActions[tab].label}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-md w-fit">
        {[
          { key: 'materials', label: 'Raw Materials' },
          { key: 'bom',       label: 'Bill of Materials' },
          { key: 'orders',    label: 'Production Orders' },
        ].map(t => (
          <button
            key={t.key}
            className={`px-4 py-1.5 rounded text-[13px] font-medium transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tables */}
      <div className="card overflow-hidden">

        {/* Raw Materials */}
        {tab === 'materials' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Material</th><th>SKU</th><th>Unit</th><th>Cost/Unit</th><th>Stock</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoading colSpan={5} />
                ) : error ? (
                  <TableError colSpan={5} onRetry={reload} />
                ) : materials.map(m => (
                  <tr key={m.id}>
                    <td className="font-medium text-gray-700">{m.name}</td>
                    <td className="font-mono text-[12px] text-gray-500">{m.sku}</td>
                    <td className="text-gray-600">{m.unit}</td>
                    <td className="tabular-nums font-medium text-gray-900">UGX {m.cost_per_unit?.toLocaleString()}</td>
                    <td className="tabular-nums text-gray-600">{m.stock_quantity || 0}</td>
                  </tr>
                ))}
                {!materials.length && !loading && !error && (
                  <tr><td colSpan={5}><div className="empty-state"><Factory size={32} className="text-gray-200" /><p>No raw materials yet</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Bill of Materials */}
        {tab === 'bom' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>BOM Name</th><th>Product</th><th>Output Qty</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoading colSpan={4} />
                ) : error ? (
                  <TableError colSpan={4} onRetry={reload} />
                ) : boms.map(b => (
                  <tr key={b.id}>
                    <td className="font-medium text-gray-700">{b.name}</td>
                    <td className="text-gray-600">{b.product_name}</td>
                    <td className="tabular-nums font-medium text-gray-900">{b.output_quantity}</td>
                    <td><span className="badge badge-green">Active</span></td>
                  </tr>
                ))}
                {!boms.length && !loading && !error && (
                  <tr><td colSpan={4}><div className="empty-state"><Factory size={32} className="text-gray-200" /><p>No BOMs configured yet</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Production Orders */}
        {tab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Order #</th><th>Product</th><th>Qty</th><th>Cost</th><th>Branch</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoading colSpan={7} />
                ) : error ? (
                  <TableError colSpan={7} onRetry={reload} />
                ) : orders.map(o => (
                  <tr key={o.id}>
                    <td className="font-mono text-[12px] text-gray-600">{o.order_number}</td>
                    <td className="text-gray-600">{o.product_name}</td>
                    <td className="tabular-nums font-medium text-gray-900">{o.quantity}</td>
                    <td className="tabular-nums font-medium text-gray-900">UGX {o.total_cost?.toLocaleString()}</td>
                    <td className="text-gray-600">{o.branch_name}</td>
                    <td>
                      <span className={`badge ${o.status === 'completed' ? 'badge-green' : o.status === 'in_progress' ? 'badge-blue' : 'badge-amber'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="tabular-nums text-gray-400">{new Date(o.created_at).toLocaleDateString('en-UG')}</td>
                  </tr>
                ))}
                {!orders.length && !loading && !error && (
                  <tr><td colSpan={7}><div className="empty-state"><Factory size={32} className="text-gray-200" /><p>No production orders yet</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Material Modal */}
      {showMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowMaterialModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Raw Material</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowMaterialModal(false)}><X size={16} /></button>
            </div>
            <form id="material-form" onSubmit={handleMaterialSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Name *</label>
                  <input className="input" value={materialForm.name} onChange={e => setMaterialForm({...materialForm, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">SKU</label>
                    <input className="input" value={materialForm.sku} onChange={e => setMaterialForm({...materialForm, sku: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Unit</label>
                    <input className="input" value={materialForm.unit} onChange={e => setMaterialForm({...materialForm, unit: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Cost per Unit (UGX)</label>
                  <input className="input" type="number" value={materialForm.costPerUnit} onChange={e => setMaterialForm({...materialForm, costPerUnit: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMaterialModal(false)}>Cancel</button>
                <button type="submit" form="material-form" className="btn btn-primary">Save Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create BOM Modal */}
      {showBomModal && (
        <div className="modal-overlay" onClick={() => setShowBomModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Bill of Materials</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowBomModal(false)}><X size={16} /></button>
            </div>
            <form id="bom-form" onSubmit={handleBomSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">BOM Name *</label>
                  <input className="input" value={bomForm.name} onChange={e => setBomForm({...bomForm, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Output Product *</label>
                    <select className="input" value={bomForm.productId} onChange={e => setBomForm({...bomForm, productId: e.target.value})} required>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Output Quantity *</label>
                    <input className="input" type="number" value={bomForm.outputQuantity} onChange={e => setBomForm({...bomForm, outputQuantity: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label" style={{ margin: 0 }}>Materials Required</label>
                    <button type="button" className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors" onClick={addBomItem}>+ Add Material</button>
                  </div>
                  <div className="space-y-2">
                    {bomForm.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <select className="input flex-1" value={item.materialId} onChange={e => updateBomItem(idx, 'materialId', e.target.value)} required>
                          <option value="">Select material</option>
                          {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <input className="input w-24" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateBomItem(idx, 'quantity', e.target.value)} required />
                        {bomForm.items.length > 1 && (
                          <button type="button" className="btn btn-ghost p-1 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => removeBomItem(idx)}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBomModal(false)}>Cancel</button>
                <button type="submit" form="bom-form" className="btn btn-primary">Create BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Production Order Modal */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Production Order</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowOrderModal(false)}><X size={16} /></button>
            </div>
            <form id="order-form" onSubmit={handleOrderSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Select BOM *</label>
                  <select className="input" value={orderForm.bomId} onChange={e => setOrderForm({...orderForm, bomId: e.target.value})} required>
                    <option value="">Select BOM</option>
                    {boms.map(b => <option key={b.id} value={b.id}>{b.name} — {b.product_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Quantity *</label>
                    <input className="input" type="number" value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Branch</label>
                    <select className="input" value={orderForm.branchId} onChange={e => setOrderForm({...orderForm, branchId: e.target.value})}>
                      <option value="">Default branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>Cancel</button>
                <button type="submit" form="order-form" className="btn btn-primary">Start Production</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
