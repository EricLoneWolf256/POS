import { useState, useEffect } from 'react';
import { Plus, X, FileText } from 'lucide-react';
import api, { formatCurrency, formatDate } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    validUntil: '',
    notes: '',
    discountAmount: 0,
    items: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }],
  });
  const { user } = useAuth();

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get('/quotations').then(res => setQuotations(res.data));
    api.get('/customers').then(res => setCustomers(res.data));
    api.get('/products').then(res => setProducts(res.data));
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', description: '', quantity: 1, unitPrice: 0 }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        items[idx].unitPrice = parseFloat(product.selling_price);
        items[idx].description = product.name;
      }
    }
    setForm({ ...form, items });
  };

  const subtotal = form.items.reduce((sum, i) => sum + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity) || 0), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax - (parseFloat(form.discountAmount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/quotations', {
      customerId: form.customerId ? parseInt(form.customerId) : null,
      validUntil: form.validUntil || null,
      notes: form.notes,
      discountAmount: parseFloat(form.discountAmount) || 0,
      items: form.items.map(i => ({
        productId: parseInt(i.productId),
        description: i.description,
        quantity: parseInt(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
      })),
    });
    setShowModal(false);
    setForm({ customerId: '', validUntil: '', notes: '', discountAmount: 0, items: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }] });
    load();
  };

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200";

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Quotations</h1>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Quotation
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quote #</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Subtotal</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tax (18%)</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Discount</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{q.quote_number}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-600">{q.customer_name || 'Walk-in'}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-600">{formatCurrency(q.subtotal, user?.currency)}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-600">{formatCurrency(q.tax_amount, user?.currency)}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-600">{formatCurrency(q.discount_amount, user?.currency)}</td>
                  <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">{formatCurrency(q.total_amount, user?.currency)}</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      q.status === 'sent' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100/50'
                      : q.status === 'accepted' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50'
                      : q.status === 'rejected' ? 'bg-red-50 text-red-600 ring-1 ring-red-100/50'
                      : 'bg-slate-50 text-slate-600 ring-1 ring-slate-100/50'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-sm text-slate-400">{formatDate(q.created_at)}</td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm font-medium text-slate-400">No quotations yet</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[700px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">Create Quotation</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Customer</label>
                  <select className={inputClass} value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                    <option value="">Walk-in Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Valid Until</label>
                  <input className={inputClass} type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[13px] font-semibold text-slate-600">Items</label>
                  <button type="button" className="text-sm text-orange-600 font-semibold hover:text-orange-700 transition-colors" onClick={addItem}>+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_2fr_80px_120px_40px] gap-2">
                      <select className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10" value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} required>
                        <option value="">Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                      <input className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required />
                      <input className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10" type="number" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} required />
                      {form.items.length > 1 && (
                        <button type="button" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center" onClick={() => removeItem(idx)}><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Notes</label>
                  <textarea className={inputClass} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Discount Amount</label>
                  <input className={inputClass} type="number" value={form.discountAmount} onChange={e => setForm({...form, discountAmount: e.target.value})} />
                  <div className="mt-3 p-3 bg-slate-50/80 rounded-xl space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="font-medium text-slate-700">{formatCurrency(subtotal, user?.currency)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">VAT (18%)</span><span className="font-medium text-slate-700">{formatCurrency(tax, user?.currency)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5"><span className="font-semibold text-slate-700">Total</span><span className="font-bold text-slate-800">{formatCurrency(total, user?.currency)}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]">Create Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
