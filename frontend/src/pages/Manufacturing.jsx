import { useState, useEffect } from 'react';
import { Plus, X, Factory } from 'lucide-react';
import api from '../services/api';

export default function Manufacturing() {
  const [materials, setMaterials] = useState([]);
  const [boms, setBoms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('materials');
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showBomModal, setShowBomModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: '', sku: '', unit: 'kg', costPerUnit: 0 });
  const [bomForm, setBomForm] = useState({ name: '', productId: '', outputQuantity: 1, items: [{ materialId: '', quantity: 1 }] });
  const [orderForm, setOrderForm] = useState({ bomId: '', quantity: 1, branchId: '' });
  const [branches, setBranches] = useState([]);

  useEffect(() => { load(); }, [tab]);

  const load = () => {
    api.get('/manufacturing/materials').then(res => setMaterials(res.data));
    api.get('/manufacturing/bom').then(res => setBoms(res.data));
    api.get('/manufacturing/orders').then(res => setOrders(res.data));
    api.get('/products').then(res => setProducts(res.data));
    api.get('/auth/branches').then(res => setBranches(res.data));
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    await api.post('/manufacturing/materials', { ...materialForm, costPerUnit: parseFloat(materialForm.costPerUnit) });
    setShowMaterialModal(false);
    setMaterialForm({ name: '', sku: '', unit: 'kg', costPerUnit: 0 });
    load();
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
    load();
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
    load();
  };

  const addBomItem = () => setBomForm({ ...bomForm, items: [...bomForm.items, { materialId: '', quantity: 1 }] });
  const removeBomItem = (idx) => setBomForm({ ...bomForm, items: bomForm.items.filter((_, i) => i !== idx) });
  const updateBomItem = (idx, field, value) => {
    const items = [...bomForm.items];
    items[idx] = { ...items[idx], [field]: value };
    setBomForm({ ...bomForm, items });
  };

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200";

  const actionButtons = {
    materials: { label: 'Add Material', onClick: () => setShowMaterialModal(true) },
    bom: { label: 'Create BOM', onClick: () => setShowBomModal(true) },
    orders: { label: 'New Order', onClick: () => setShowOrderModal(true) },
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Production / Manufacturing</h1>
          <p className="text-sm text-slate-400 mt-1">Manage raw materials, BOM, and production orders</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]" onClick={actionButtons[tab].onClick}>
          <Plus size={18} /> {actionButtons[tab].label}
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {['materials', 'bom', 'orders'].map(t => (
          <button
            key={t}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'materials' ? 'Raw Materials' : t === 'bom' ? 'Bill of Materials' : 'Production Orders'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
        {tab === 'materials' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Material</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SKU</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unit</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cost/Unit</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{m.name}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-500 font-mono">{m.sku}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{m.unit}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">UGX {m.cost_per_unit?.toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{m.stock_quantity || 0}</td>
                  </tr>
                ))}
                {materials.length === 0 && <tr><td colSpan={5} className="py-16 text-center"><Factory size={40} className="mx-auto mb-3 text-slate-200" /><p className="text-sm font-medium text-slate-400">No raw materials yet</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'bom' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">BOM Name</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Output Qty</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {boms.map(b => (
                  <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{b.name}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{b.product_name}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">{b.output_quantity}</td>
                    <td className="py-3.5 px-5"><span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold ring-1 ring-emerald-100/50">Active</span></td>
                  </tr>
                ))}
                {boms.length === 0 && <tr><td colSpan={4} className="py-16 text-center"><Factory size={40} className="mx-auto mb-3 text-slate-200" /><p className="text-sm font-medium text-slate-400">No BOMs configured yet</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Order #</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cost</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{o.order_number}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{o.product_name}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">{o.quantity}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">UGX {o.total_cost?.toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{o.branch_name}</td>
                    <td className="py-3.5 px-5"><span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold ring-1 ring-emerald-100/50">{o.status}</span></td>
                    <td className="py-3.5 px-5 text-sm text-slate-400">{new Date(o.created_at).toLocaleDateString('en-UG')}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={7} className="py-16 text-center"><Factory size={40} className="mx-auto mb-3 text-slate-200" /><p className="text-sm font-medium text-slate-400">No production orders yet</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowMaterialModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">Add Raw Material</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowMaterialModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleMaterialSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Name *</label>
                <input className={inputClass} value={materialForm.name} onChange={e => setMaterialForm({...materialForm, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">SKU</label>
                  <input className={inputClass} value={materialForm.sku} onChange={e => setMaterialForm({...materialForm, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Unit</label>
                  <input className={inputClass} value={materialForm.unit} onChange={e => setMaterialForm({...materialForm, unit: e.target.value})} />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Cost per Unit (UGX)</label>
                <input className={inputClass} type="number" value={materialForm.costPerUnit} onChange={e => setMaterialForm({...materialForm, costPerUnit: e.target.value})} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowMaterialModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBomModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowBomModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">Create Bill of Materials</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowBomModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleBomSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">BOM Name *</label>
                <input className={inputClass} value={bomForm.name} onChange={e => setBomForm({...bomForm, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Output Product *</label>
                  <select className={inputClass} value={bomForm.productId} onChange={e => setBomForm({...bomForm, productId: e.target.value})} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Output Quantity *</label>
                  <input className={inputClass} type="number" value={bomForm.outputQuantity} onChange={e => setBomForm({...bomForm, outputQuantity: e.target.value})} required />
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[13px] font-semibold text-slate-600">Materials Required</label>
                  <button type="button" className="text-sm text-teal-600 font-semibold hover:text-teal-700 transition-colors" onClick={addBomItem}>+ Add Material</button>
                </div>
                <div className="space-y-2">
                  {bomForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" value={item.materialId} onChange={e => updateBomItem(idx, 'materialId', e.target.value)} required>
                        <option value="">Select material</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <input className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateBomItem(idx, 'quantity', e.target.value)} required />
                      {bomForm.items.length > 1 && (
                        <button type="button" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" onClick={() => removeBomItem(idx)}><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowBomModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">Create BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">New Production Order</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowOrderModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleOrderSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Select BOM *</label>
                <select className={inputClass} value={orderForm.bomId} onChange={e => setOrderForm({...orderForm, bomId: e.target.value})} required>
                  <option value="">Select BOM</option>
                  {boms.map(b => <option key={b.id} value={b.id}>{b.name} — {b.product_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Quantity *</label>
                  <input className={inputClass} type="number" value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Branch</label>
                  <select className={inputClass} value={orderForm.branchId} onChange={e => setOrderForm({...orderForm, branchId: e.target.value})}>
                    <option value="">Default branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowOrderModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">Start Production</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
