import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, X, Package, ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [scanInputValue, setScanInputValue] = useState('');
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', categoryId: '',
    costPrice: '', sellingPrice: '', lowStockThreshold: 10, initialStock: 0,
  });
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

  const resetForm = () => setForm({
    name: '', sku: '', barcode: '', categoryId: '',
    costPrice: '', sellingPrice: '', lowStockThreshold: 10, initialStock: 0,
  });

  const openAdd = () => { setEditingProduct(null); setScanMode(false); resetForm(); setShowModal(true); };

  const openScanAdd = () => { setEditingProduct(null); setScanMode(true); setScanCount(0); resetForm(); setShowModal(true); };

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

  const handleScanKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleScanBarcode(scanInputValue); setScanInputValue(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name, sku: form.sku, barcode: form.barcode,
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
    setForm(f => ({ ...f, barcode }));
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Scan toast */}
      {scanToast && (
        <div className={`fixed top-4 right-4 z-[300] flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium border animate-slide-up ${
          scanToast.type === 'saved' ? 'alert alert-success' :
          scanToast.type === 'exists' ? 'alert alert-warn' : 'alert alert-info'
        }`}>
          {scanToast.type === 'saved' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {scanToast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Products
            {scanMode && showModal && (
              <span className="ml-3 badge badge-blue align-middle">
                <ScanLine size={11} /> Scan mode · {scanCount} added
              </span>
            )}
          </h1>
          <p className="page-subtitle">Manage your product catalogue</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={openScanAdd}>
            <ScanLine size={15} /> Scan &amp; Add
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input input-icon-left"
            placeholder="Search by name, SKU, or barcode…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-gray-700">{p.name}</td>
                  <td className="font-mono text-[12px] text-gray-500">{p.sku}</td>
                  <td className="font-mono text-[12px] text-gray-500">
                    {p.barcode ? (
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{p.barcode}</span>
                    ) : (
                      <button
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 transition-colors"
                        onClick={() => generateBarcode(p)}
                        title="Generate barcode"
                      >
                        <ScanLine size={11} /> Generate
                      </button>
                    )}
                  </td>
                  <td className="text-gray-500">{p.category_name || '—'}</td>
                  <td className="tabular-nums text-gray-600">{formatCurrency(p.cost_price, user?.currency)}</td>
                  <td className="tabular-nums font-medium text-gray-900">{formatCurrency(p.selling_price, user?.currency)}</td>
                  <td>
                    <span className={`badge ${
                      p.stock_quantity <= 0 ? 'badge-red'
                      : p.stock_quantity <= p.low_stock_threshold ? 'badge-amber'
                      : 'badge-green'
                    }`}>
                      {p.stock_quantity || 0}
                    </span>
                  </td>
                  <td><span className="badge badge-green">Active</span></td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn btn-ghost btn-sm p-1.5" onClick={() => openEdit(p)} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50" onClick={() => handleDelete(p)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!products.length && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <Package size={32} className="text-gray-200" />
                      <p>No products found</p>
                      <span>Add your first product to get started</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingProduct ? 'Edit Product' : scanMode ? 'Scan & Add Product' : 'Add Product'}
                </h3>
                {scanMode && !editingProduct && (
                  <p className="text-xs text-gray-400 mt-0.5">Scan a barcode to register products quickly</p>
                )}
              </div>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body space-y-4">
              {scanMode && !editingProduct && (
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <ScanLine size={11} /> Scan Barcode
                  </label>
                  <div className="relative">
                    <input
                      ref={scanInputRef}
                      className="input font-mono text-base tracking-wider"
                      placeholder="Scan barcode now…"
                      value={scanInputValue}
                      onChange={e => setScanInputValue(e.target.value)}
                      onKeyDown={handleScanKeyDown}
                    />
                    <ScanLine size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Press Enter after scanning — or type the barcode manually</p>
                </div>
              )}

              <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Name *</label>
                  <input ref={nameInputRef} className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">SKU</label>
                    <input className="input" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Barcode</label>
                    <div className="flex gap-2">
                      <input
                        className="input font-mono flex-1"
                        value={form.barcode}
                        onChange={e => setForm({...form, barcode: e.target.value})}
                        placeholder="Enter or scan"
                        readOnly={scanMode && !editingProduct}
                      />
                      {editingProduct && (
                        <button type="button" className="btn btn-secondary btn-sm shrink-0" onClick={generateBarcodeForForm}>
                          <ScanLine size={13} /> Auto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select className="input" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Cost Price</label>
                    <input className="input" type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Selling Price *</label>
                    <input className="input" type="number" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Low Stock Alert</label>
                    <input className="input" type="number" value={form.lowStockThreshold} onChange={e => setForm({...form, lowStockThreshold: e.target.value})} />
                  </div>
                  {!editingProduct && (
                    <div>
                      <label className="form-label">Initial Stock</label>
                      <input className="input" type="number" value={form.initialStock} onChange={e => setForm({...form, initialStock: e.target.value})} />
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                {scanMode ? 'Done' : 'Cancel'}
              </button>
              <button type="submit" form="product-form" className="btn btn-primary">
                {editingProduct ? 'Update Product' : scanMode ? 'Save & Scan Next' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
