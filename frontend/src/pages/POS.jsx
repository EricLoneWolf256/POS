import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Trash2, Check, Minus, Plus, ShoppingCart, ScanLine, X, AlertCircle, FileDown } from 'lucide-react';
import api, { formatCurrency } from '../services/api';
import { useAuth } from '../context/AuthContext';

function ScanToast({ message, type, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const styles = {
    success: 'alert alert-success',
    error:   'alert alert-error',
    info:    'alert alert-info',
  };

  const icons = {
    success: <Check size={15} strokeWidth={2.5} />,
    error:   <AlertCircle size={15} strokeWidth={2.5} />,
    info:    <ScanLine size={15} />,
  };

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] min-w-[260px] max-w-sm animate-slide-up ${styles[type]}`}>
      {icons[type]}
      {message}
    </div>
  );
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [toast, setToast] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const barcodeRef = useRef(null);
  const { user, isOnline } = useAuth();

  useEffect(() => { loadProducts(); }, [search]);

  useEffect(() => {
    api.get('/customers', { params: { search: customerSearch } })
      .then(res => setCustomers(res.data))
      .catch(() => {});
  }, [customerSearch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') { e.preventDefault(); barcodeRef.current?.focus(); }
      if (e.key === 'Escape' && document.activeElement === barcodeRef.current) setBarcodeInput('');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => { barcodeRef.current?.focus(); }, [cart, lastSale]);

  const loadProducts = () => {
    api.get('/products', { params: { search } }).then(res => setProducts(res.data));
  };

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const lookupBarcode = useCallback(async (code) => {
    if (!code.trim()) return;
    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(code.trim())}`);
      const product = res.data;
      if (product.stock_quantity <= 0) { showToast(`${product.name} — out of stock`, 'error'); return; }
      setCart(prev => {
        const existing = prev.find(i => i.productId === product.id);
        if (existing) {
          if (existing.quantity >= product.stock_quantity) {
            showToast(`${product.name} — max stock reached (${product.stock_quantity})`, 'error');
            return prev;
          }
          showToast(`${product.name} ×${existing.quantity + 1} in cart`, 'success');
          return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        showToast(`${product.name} added`, 'success');
        return [...prev, { productId: product.id, productName: product.name, unitPrice: parseFloat(product.selling_price), quantity: 1, trackStock: product.track_stock }];
      });
      setScanCount(c => c + 1);
    } catch {
      showToast(`No product found: ${code.trim()}`, 'error');
    } finally {
      setBarcodeInput('');
    }
  }, [showToast]);

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); lookupBarcode(barcodeInput); }
  };

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, productName: product.name, unitPrice: parseFloat(product.selling_price), quantity: 1, trackStock: product.track_stock }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      const product = products.find(p => p.id === productId);
      if (product && newQty > product.stock_quantity) return i;
      return { ...i, quantity: newQty };
    }).filter(Boolean));
  };

  const removeItem = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

  const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const completeSale = async () => {
    if (!cart.length) return;
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      showToast('Select a customer for credit sales', 'error');
      return;
    }
    setProcessing(true);
    try {
      const payload = { items: cart, paymentMethod, amountPaid: paymentMethod === 'credit' ? 0 : total, customerId: selectedCustomerId ? parseInt(selectedCustomerId) : null, isCredit: paymentMethod === 'credit' };
      if (!isOnline) {
        const offlineId = `offline-${Date.now()}`;
        const offlineSales = JSON.parse(localStorage.getItem('offline_sales') || '[]');
        offlineSales.push({ ...payload, offlineId, createdAt: new Date().toISOString() });
        localStorage.setItem('offline_sales', JSON.stringify(offlineSales));
        setLastSale({ sale_number: offlineId, total_amount: total, offline: true });
        showToast('Sale saved offline', 'success');
      } else {
        const res = await api.post('/sales', payload);
        setLastSale(res.data);
        showToast('Sale completed!', 'success');
      }
      setCart([]);
      setSelectedCustomerId('');
      setCustomerSearch('');
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Sale failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { key: 'cash',          label: 'Cash' },
    { key: 'mobile_money',  label: 'Mobile Money' },
    { key: 'card',          label: 'Card' },
    { key: 'credit',        label: 'Credit' },
    { key: 'bank_transfer', label: 'Bank Transfer' },
    { key: 'mixed',         label: 'Mixed' },
  ];

  return (
    <div className="animate-fade-in">
      {toast && <ScanToast key={toast.id} message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="page-title" style={{ marginBottom: 0 }}>Point of Sale</h1>
          {lastSale && (
            <span className="flex items-center gap-1.5 badge badge-green animate-fade-in">
              <Check size={11} strokeWidth={2.5} />
              {lastSale.sale_number} — {formatCurrency(lastSale.total_amount, user?.currency)}
              {lastSale.offline && ' (offline)'}
              <button
                onClick={async () => {
                  try {
                    const res = await api.get(`/sales/${lastSale.id}/receipt`, { responseType: 'blob' });
                    const url = URL.createObjectURL(new Blob([res.data]));
                    const a = document.createElement('a'); a.href = url;
                    a.download = `receipt-${lastSale.sale_number}.pdf`; a.click();
                  } catch {}
                }}
                className="ml-0.5 p-0.5 rounded hover:bg-green-200 transition-colors"
                title="Download receipt"
              >
                <FileDown size={11} />
              </button>
            </span>
          )}
        </div>
        {scanCount > 0 && (
          <span className="text-[12px] text-gray-400 font-medium">
            Scans this session: <strong className="text-gray-600">{scanCount}</strong>
          </span>
        )}
      </div>

      {/* Barcode Scanner */}
      <div className="card p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-500 shrink-0">
            <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
              <ScanLine size={16} className="text-blue-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[12px] font-medium text-gray-700">Scanner Input</p>
              <p className="text-[11px] text-gray-400">Scan or type + Enter</p>
            </div>
          </div>
          <div className="flex-1 relative">
            <input
              ref={barcodeRef}
              type="text"
              className="input font-mono tracking-wider"
              placeholder="Scan barcode or type and press Enter…"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              autoComplete="off"
              autoFocus
            />
            {barcodeInput && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => { setBarcodeInput(''); barcodeRef.current?.focus(); }}>
                <X size={15} />
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-400 hidden md:block shrink-0">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">F2</kbd> focus
          </p>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 lg:h-[calc(100vh-280px)]">

        {/* Left — Product grid */}
        <div className="flex flex-col min-h-0">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="input input-icon-left"
              placeholder="Search products by name or SKU…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto pr-0.5">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
              {products.map(p => (
                <button
                  key={p.id}
                  className={`card p-3.5 text-left transition-all hover:border-blue-200 hover:shadow-sm active:scale-[0.98] ${p.stock_quantity <= 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => addToCart(p)}
                  disabled={p.stock_quantity <= 0}
                >
                  <p className="font-medium text-[13px] text-gray-700 mb-1 leading-tight">{p.name}</p>
                  {p.barcode && <p className="font-mono text-[10px] text-gray-400 mb-1">{p.barcode}</p>}
                  <p className="text-[13px] font-semibold text-blue-600 tabular-nums">{formatCurrency(p.selling_price, user?.currency)}</p>
                  <p className={`text-[11px] mt-1 font-medium ${p.stock_quantity <= 0 ? 'text-red-500' : p.stock_quantity <= 10 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {p.stock_quantity <= 0 ? 'Out of stock' : `Stock: ${p.stock_quantity}`}
                  </p>
                </button>
              ))}
              {!products.length && (
                <div className="col-span-full">
                  <div className="empty-state">
                    <ShoppingCart size={32} className="text-gray-200" />
                    <p>No products found</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Cart */}
        <div className="card flex flex-col overflow-hidden">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <ShoppingCart size={15} className="text-gray-400" />
              <span className="card-title">Cart</span>
            </span>
            <span className="badge badge-gray">{cart.length} items</span>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {!cart.length ? (
              <div className="empty-state py-10">
                <ShoppingCart size={28} className="text-gray-200" />
                <p>Scan a barcode or tap a product</p>
              </div>
            ) : cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between py-2.5 px-2 rounded-md hover:bg-gray-50 transition-colors group">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-medium text-[13px] text-gray-700 truncate">{item.productName}</p>
                  <p className="text-[11px] text-gray-400 tabular-nums">{formatCurrency(item.unitPrice, user?.currency)} each</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button className="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all" onClick={() => updateQty(item.productId, -1)}>
                    <Minus size={11} />
                  </button>
                  <span className="text-[13px] font-semibold w-5 text-center text-gray-700">{item.quantity}</span>
                  <button className="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all" onClick={() => updateQty(item.productId, 1)}>
                    <Plus size={11} />
                  </button>
                  <button className="ml-0.5 w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all" onClick={() => removeItem(item.productId)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout panel */}
          <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
            {/* Customer */}
            <div>
              <label className="form-label mb-1">Customer</label>
              <div className="flex gap-1.5">
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="input flex-1 text-[12px]"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` (${c.phone})` : ''}{c.credit_balance > 0 ? ` [Bal: ${formatCurrency(c.credit_balance, user?.currency)}]` : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Filter…"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="input w-24 text-[12px]"
                />
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="form-label mb-1">Payment</label>
              <div className="grid grid-cols-3 gap-1">
                {paymentMethods.map(m => (
                  <button
                    key={m.key}
                    className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors border ${
                      paymentMethod === m.key
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                    onClick={() => setPaymentMethod(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline">
              <span className="text-[13px] font-medium text-gray-500">Total</span>
              <span className="text-2xl font-semibold tabular-nums text-gray-900">{formatCurrency(total, user?.currency)}</span>
            </div>

            {/* Complete Sale */}
            <button
              className="btn btn-primary btn-lg w-full justify-center"
              onClick={completeSale}
              disabled={!cart.length || processing}
            >
              {processing ? <span className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : `Complete Sale · ${formatCurrency(total, user?.currency)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
