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
    success: 'bg-emerald-600 text-white shadow-emerald-500/30',
    error: 'bg-red-600 text-white shadow-red-500/30',
    info: 'bg-slate-800 text-white shadow-slate-800/30',
  };

  const icons = {
    success: <Check size={16} strokeWidth={2.5} />,
    error: <AlertCircle size={16} strokeWidth={2.5} />,
    info: <ScanLine size={16} />,
  };

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl animate-slide-up ${styles[type]}`}>
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
  const barcodeRef = useRef(null);
  const { user, isOnline } = useAuth();

  useEffect(() => {
    loadProducts();
  }, [search]);

  // Keep barcode input focused when not typing in search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeRef.current?.focus();
      }
      // Escape to clear barcode input
      if (e.key === 'Escape' && document.activeElement === barcodeRef.current) {
        setBarcodeInput('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus barcode input on mount and after cart changes
  useEffect(() => {
    barcodeRef.current?.focus();
  }, [cart, lastSale]);

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

      if (product.stock_quantity <= 0) {
        showToast(`${product.name} — out of stock`, 'error');
        return;
      }

      setCart(prev => {
        const existing = prev.find(i => i.productId === product.id);
        if (existing) {
          if (existing.quantity >= product.stock_quantity) {
            showToast(`${product.name} — max stock reached (${product.stock_quantity})`, 'error');
            return prev;
          }
          showToast(`${product.name} x${existing.quantity + 1} in cart`, 'success');
          return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        showToast(`${product.name} added to cart`, 'success');
        return [...prev, {
          productId: product.id,
          productName: product.name,
          unitPrice: parseFloat(product.selling_price),
          quantity: 1,
          trackStock: product.track_stock,
        }];
      });

      setScanCount(c => c + 1);
    } catch {
      showToast(`No product found: ${code.trim()}`, 'error');
    } finally {
      setBarcodeInput('');
    }
  }, [showToast]);

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lookupBarcode(barcodeInput);
    }
  };

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        unitPrice: parseFloat(product.selling_price),
        quantity: 1,
        trackStock: product.track_stock,
      }];
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
    setProcessing(true);
    try {
      const payload = { items: cart, paymentMethod, amountPaid: total };

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
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Sale failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { key: 'cash', label: 'Cash' },
    { key: 'mobile_money', label: 'Mobile Money' },
    { key: 'card', label: 'Card' },
    { key: 'credit', label: 'Credit' },
    { key: 'bank_transfer', label: 'Bank Transfer' },
    { key: 'mixed', label: 'Mixed' },
  ];

  return (
    <div className="animate-fade-in">
      {toast && <ScanToast key={toast.id} message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Point of Sale</h1>
          {lastSale && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold ring-1 ring-emerald-200/50 animate-fade-in">
              <Check size={13} strokeWidth={2.5} /> {lastSale.sale_number} — {formatCurrency(lastSale.total_amount, user?.currency)}
              {lastSale.offline && ' (offline)'}
              <button onClick={async () => { try { const res = await api.get(`/sales/${lastSale.id}/receipt`, { responseType: 'blob' }); const url = URL.createObjectURL(new Blob([res.data])); const a = document.createElement('a'); a.href = url; a.download = `receipt-${lastSale.sale_number}.pdf`; a.click(); } catch {} }} className="ml-1 p-1 rounded-md hover:bg-emerald-100 transition-colors" title="Download receipt">
                <FileDown size={13} />
              </button>
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {scanCount > 0 && <span className="bg-slate-100 px-2 py-1 rounded-lg">Scans this session: {scanCount}</span>}
        </div>
      </div>

      {/* Barcode Scanner Input */}
      <div className="mb-5 bg-gradient-to-r from-teal-50/80 to-emerald-50/50 rounded-2xl border border-teal-200/40 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-teal-600">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center ring-1 ring-teal-200/50">
              <ScanLine size={20} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-teal-700">Scanner Input</p>
              <p className="text-[11px] text-teal-500/70 font-medium">Scan barcode or type & press Enter</p>
            </div>
          </div>
          <div className="flex-1 relative">
            <input
              ref={barcodeRef}
              type="text"
              className="w-full pl-4 pr-10 py-3 bg-white border border-teal-200 rounded-xl text-base font-mono font-semibold text-slate-800 tracking-wider focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 transition-all duration-200 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal shadow-sm"
              placeholder="Scan or enter barcode..."
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              autoComplete="off"
              autoFocus
            />
            {barcodeInput && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => { setBarcodeInput(''); barcodeRef.current?.focus(); }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">F2</kbd> focus
            &nbsp;·&nbsp;
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Esc</kbd> clear
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-6 h-[calc(100vh-240px)] max-lg:grid-cols-1 max-lg:h-auto">
        <div className="overflow-y-auto pr-1">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 placeholder:text-slate-400"
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => {}} // don't steal focus from barcode
            />
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
            {products.map(p => (
              <button
                key={p.id}
                className={`group bg-white border border-slate-200/80 rounded-2xl p-4 cursor-pointer transition-all duration-200 text-center hover:border-teal-300 hover:shadow-md hover:shadow-teal-500/5 active:scale-[0.97] ${p.stock_quantity <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={() => addToCart(p)}
              >
                <div className="font-medium text-sm text-slate-700 mb-1.5 group-hover:text-slate-900 transition-colors">{p.name}</div>
                {p.barcode && (
                  <div className="text-[10px] text-slate-400 font-mono mb-1">{p.barcode}</div>
                )}
                <div className="text-teal-600 font-bold text-sm">{formatCurrency(p.selling_price, user?.currency)}</div>
                <div className={`text-[11px] mt-2 font-medium ${p.stock_quantity <= 0 ? 'text-red-400' : p.stock_quantity <= 10 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {p.stock_quantity <= 0 ? 'Out of stock' : `Stock: ${p.stock_quantity}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl flex flex-col overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ShoppingCart size={18} className="text-slate-400" />
            <span className="font-semibold text-slate-700 text-sm">Cart</span>
            <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{cart.length} items</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {cart.length === 0 ? (
              <div className="text-center text-slate-300 py-12">
                <ShoppingCart size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Scan a barcode or tap a product</p>
              </div>
            ) : cart.map(item => (
              <div key={item.productId} className="flex justify-between items-center py-3 px-2 rounded-xl hover:bg-slate-50/80 transition-colors">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="font-medium text-sm text-slate-700 truncate">{item.productName}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{formatCurrency(item.unitPrice, user?.currency)} each</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-90"
                    onClick={() => updateQty(item.productId, -1)}
                  ><Minus size={12} /></button>
                  <span className="text-sm font-bold w-6 text-center text-slate-700">{item.quantity}</span>
                  <button
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-90"
                    onClick={() => updateQty(item.productId, 1)}
                  ><Plus size={12} /></button>
                  <button
                    className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {paymentMethods.map(m => (
                <button
                  key={m.key}
                  className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                    paymentMethod === m.key
                      ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200/60 shadow-sm shadow-teal-100'
                      : 'bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  onClick={() => setPaymentMethod(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-baseline mb-4 px-1">
              <span className="text-sm font-semibold text-slate-500">Total</span>
              <span className="text-2xl font-bold tracking-tight text-slate-800">{formatCurrency(total, user?.currency)}</span>
            </div>
            <button
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              onClick={completeSale}
              disabled={!cart.length || processing}
            >
              {processing ? 'Processing...' : `Complete Sale — ${formatCurrency(total, user?.currency)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
