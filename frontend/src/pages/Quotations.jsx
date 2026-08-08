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
    customerId: '', validUntil: '', notes: '', discountAmount: 0,
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
      if (product) { items[idx].unitPrice = parseFloat(product.selling_price); items[idx].description = product.name; }
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

  const STATUS_BADGE = {
    sent: 'badge-blue', accepted: 'badge-green', rejected: 'badge-red', draft: 'badge-gray',
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Create and manage customer quotes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> New Quotation
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Customer</th>
                <th>Subtotal</th>
                <th>Tax (18%)</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id}>
                  <td className="font-mono text-[12px] text-gray-600">{q.quote_number}</td>
                  <td className="text-gray-600">{q.customer_name || 'Walk-in'}</td>
                  <td className="tabular-nums text-gray-600">{formatCurrency(q.subtotal, user?.currency)}</td>
                  <td className="tabular-nums text-gray-600">{formatCurrency(q.tax_amount, user?.currency)}</td>
                  <td className="tabular-nums text-gray-600">{formatCurrency(q.discount_amount, user?.currency)}</td>
                  <td className="tabular-nums font-medium text-gray-900">{formatCurrency(q.total_amount, user?.currency)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[q.status] ?? 'badge-gray'}`}>{q.status}</span>
                  </td>
                  <td className="tabular-nums text-gray-400">{formatDate(q.created_at)}</td>
                </tr>
              ))}
              {!quotations.length && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <FileText size={32} className="text-gray-200" />
                      <p>No quotations yet</p>
                      <span>Create your first quote for a customer</span>
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
          <div className="modal modal-lg animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Quotation</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form id="quotation-form" onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Customer</label>
                    <select className="input" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                      <option value="">Walk-in Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Valid Until</label>
                    <input className="input" type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} />
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label" style={{ margin: 0 }}>Items</label>
                    <button type="button" className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors" onClick={addItem}>+ Add Item</button>
                  </div>
                  <div className="space-y-2">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_2fr_80px_120px_36px] gap-2">
                        <select className="input" value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} required>
                          <option value="">Product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input className="input" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                        <input className="input" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required />
                        <input className="input" type="number" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} required />
                        {form.items.length > 1 && (
                          <button type="button" className="btn btn-ghost p-1 text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center" onClick={() => removeItem(idx)}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Notes</label>
                    <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Discount Amount</label>
                    <input className="input" type="number" value={form.discountAmount} onChange={e => setForm({...form, discountAmount: e.target.value})} />
                    <div className="mt-3 bg-gray-50 border border-gray-100 rounded-md p-3 space-y-1.5 text-[13px]">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span className="tabular-nums font-medium text-gray-700">{formatCurrency(subtotal, user?.currency)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>VAT (18%)</span>
                        <span className="tabular-nums font-medium text-gray-700">{formatCurrency(tax, user?.currency)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1.5">
                        <span className="font-semibold text-gray-700">Total</span>
                        <span className="tabular-nums font-semibold text-gray-900">{formatCurrency(total, user?.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="quotation-form" className="btn btn-primary">Create Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
