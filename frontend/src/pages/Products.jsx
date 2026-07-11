import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Package, ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
import api, { formatCurrency } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [scanToast, setScanToast] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', barcode: '', categoryId: '', costPrice: '', sellingPrice: '', lowStockThreshold: 10, initialStock: 0 });
  const { user } = useAuth();
  const scanInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => { load(); }, [search]);

  useEffect(() => {
    if (scanMode && showModal && scanInputRef.current) {
      setTimeout(() => scanInputRef.current?.focus(), 100);
    }
  }, [scanMode, showModal]);

  useEffect(() => {
    if (scanToast) {
      const t = setTimeout(() => setScanToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [scanToast]);

  const load = () => {
    api.get('/products', { params: { search } }).then(res => setProducts(res.data));
    api.get('/products/categories/list').then(res => setCategories(res.data));
  };

  const resetForm = () => {
    setForm({ name: '', sku: '', barcode: '', categoryId: '', costPrice: '', sellingPrice: '', lowStockThreshold: 10, initialStock: 0 });
  };

  const openAdd = () => {
    setEditingProduct(null);
    setScanMode(false);
    resetForm();
    setShowModal(true);
  };

  const openScanAdd = () => {
    setEditingProduct(null);
    setScanMode(true);
    setScanCount(0);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setScanMode(false);
    setForm({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      categoryId: product.category_id || '',
      costPrice: product.cost_price || '',
      sellingPrice: product.selling_price,
      lowStockThreshold: product.low_stock_threshold || 10,
      initialStock: 0,
    });
    setShowModal(true);
  };

  const handleScanBarcode = async (code) => {
    if (!code.trim()) return;
    try {
      const res = await api.get(`/products/barcode/${code.trim()}`);
      setScanToast({ type: 'exists', message: `Already exists: ${res.data.name}` });
      setScanInputValue('');
      setTimeout(() => scanInputRef.current?.focus(), 50);
    } catch {
      setForm(f => ({ ...f, barcode: code.trim() }));
      setScanToast({ type: 'new', message: 'New barcode — fill in details below' });
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  };

  const [scanInputValue, setScanInputValue] = useState('');

  const handleScanKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanBarcode(scanInputValue);
      setScanInputValue('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      sku: form.sku,
      barcode: form.barcode,
      categoryId: form.categoryId || null,
      costPrice: parseFloat(form.costPrice) || 0,
      sellingPrice: parseFloat(form.sellingPrice),
      lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
      initialStock: parseFloat(form.initialStock) || 0,
    };
    if (editingProduct) {
      await api.put(`/products/${editingProduct.id}`, payload);
      setShowModal(false);
    } else {
      await api.post('/products', payload);
      if (scanMode) {
        setScanCount(c => c + 1);
        setScanToast({ type: 'saved', message: `${form.name} saved! Scan next barcode` });
        resetForm();
        setScanInputValue('');
        setTimeout(() => scanInputRef.current?.focus(), 100);
      } else {
        setShowModal(false);
      }
    }
    load();
  };

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await api.delete(`/products/${product.id}`);
    load();
  };

  const generateBarcode = async (product) => {
    const res = await api.post('/products/barcode/generate', { productId: product.id });
    load();
    return res.data.barcode;
  };

  const generateBarcodeForForm = async () => {
    if (!editingProduct) return;
    const barcode = await generateBarcode(editingProduct);
    setForm({ ...form, barcode });
  };

  return (
    <div className="animate-fade-in">
      {scanToast && (
        <div className={`fixed top-4 right-4 z-[300] flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-slide-up ${
          scanToast.type === 'saved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' :
          scanToast.type === 'exists' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60' :
          'bg-teal-50 text-teal-700 ring-1 ring-teal-200/60'
        }`}>
          {scanToast.type === 'saved' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {scanToast.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Products</h1>
          {scanMode && showModal && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold ring-1 ring-teal-200/60 animate-fade-in">
              <ScanLine size={13} /> Scan mode — {scanCount} added
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98]" onClick={openScanAdd}>
            <ScanLine size={16} /> Scan & Add
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]" onClick={openAdd}>
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 placeholder:text-slate-400"
          placeholder="Search products by name, SKU, or barcode..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SKU</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Barcode</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cost</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stock</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{p.name}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-500 font-mono">{p.sku}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-500 font-mono">
                    {p.barcode ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{p.barcode}</span>
                      </span>
                    ) : (
                      <button
                        className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-xs font-semibold transition-colors"
                        onClick={() => generateBarcode(p)}
                        title="Generate barcode for this product"
                      >
                        <ScanLine size={12} /> Generate
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-sm text-slate-500">{p.category_name || '—'}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-600">{formatCurrency(p.cost_price, user?.currency)}</td>
                  <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">{formatCurrency(p.selling_price, user?.currency)}</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      p.stock_quantity <= p.low_stock_threshold ? 'bg-red-50 text-red-600 ring-1 ring-red-100/50' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50'
                    }`}>
                      {p.stock_quantity || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-5"><span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold ring-1 ring-emerald-100/50">Active</span></td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={() => openEdit(p)}>
                        <Edit2 size={15} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onClick={() => handleDelete(p)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={9} className="py-16 text-center">
                  <Package size={40} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm font-medium text-slate-400">No products found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-800">
                  {editingProduct ? 'Edit Product' : scanMode ? 'Scan & Add Product' : 'Add New Product'}
                </h3>
                {scanMode && !editingProduct && (
                  <p className="text-xs text-slate-400 mt-0.5">Scan a barcode to register products quickly</p>
                )}
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {scanMode && !editingProduct && (
              <div className="mb-5">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5"><ScanLine size={13} /> Scan Barcode</span>
                </label>
                <div className="relative">
                  <input
                    ref={scanInputRef}
                    className="w-full px-4 py-3 border-2 border-dashed border-teal-300 rounded-xl text-sm bg-teal-50/50 focus:bg-white focus:border-teal-500 focus:border-solid focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 font-mono text-base tracking-wider placeholder:text-teal-400"
                    placeholder="Scan barcode now..."
                    value={scanInputValue}
                    onChange={e => setScanInputValue(e.target.value)}
                    onKeyDown={handleScanKeyDown}
                  />
                  <ScanLine size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Press Enter after scanning — or type the barcode manually</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Name *</label>
                <input ref={nameInputRef} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">SKU</label>
                  <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Barcode</label>
                  <div className="flex gap-2">
                    <input className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 font-mono" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="Enter or scan barcode" readOnly={scanMode && !editingProduct} />
                    {editingProduct && (
                      <button type="button" className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200/60 rounded-xl hover:bg-teal-100 transition-all whitespace-nowrap" onClick={generateBarcodeForForm}>
                        <ScanLine size={13} /> Auto
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Category</label>
                <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Cost Price</label>
                  <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Selling Price *</label>
                  <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" type="number" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Low Stock Alert</label>
                  <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" type="number" value={form.lowStockThreshold} onChange={e => setForm({...form, lowStockThreshold: e.target.value})} />
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Initial Stock</label>
                    <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" type="number" value={form.initialStock} onChange={e => setForm({...form, initialStock: e.target.value})} />
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98]" onClick={() => setShowModal(false)}>{scanMode ? 'Done' : 'Cancel'}</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">
                  {editingProduct ? 'Update Product' : scanMode ? 'Save & Scan Next' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
