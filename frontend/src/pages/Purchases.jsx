import { useState, useEffect } from 'react';
import { Plus, X, ShoppingCart, Truck, DollarSign } from 'lucide-react';
import api, { formatCurrency, formatDate } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Purchases() {
  const [tab, setTab] = useState('purchases');
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '' });
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: '', branchId: '', notes: '', items: [{ productId: '', quantity: 1, unitCost: 0 }] });
  const [expenseForm, setExpenseForm] = useState({ category: '', description: '', amount: '', paymentMethod: 'cash', expenseDate: new Date().toISOString().split('T')[0] });
  const { user } = useAuth();

  useEffect(() => { load(); }, [tab]);

  const load = () => {
    api.get('/purchases/suppliers').then(res => setSuppliers(res.data));
    api.get('/purchases/purchases').then(res => setPurchases(res.data));
    api.get('/purchases/expenses').then(res => setExpenses(res.data));
    api.get('/products').then(res => setProducts(res.data));
    api.get('/auth/branches').then(res => setBranches(res.data));
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    await api.post('/purchases/suppliers', supplierForm);
    setShowSupplierModal(false);
    setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', address: '' });
    load();
  };

  const addPurchaseItem = () => setPurchaseForm({ ...purchaseForm, items: [...purchaseForm.items, { productId: '', quantity: 1, unitCost: 0 }] });
  const removePurchaseItem = (idx) => setPurchaseForm({ ...purchaseForm, items: purchaseForm.items.filter((_, i) => i !== idx) });
  const updatePurchaseItem = (idx, field, value) => {
    const items = [...purchaseForm.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) items[idx].unitCost = parseFloat(product.cost_price) || 0;
    }
    setPurchaseForm({ ...purchaseForm, items });
  };

  const purchaseTotal = purchaseForm.items.reduce((sum, i) => sum + (parseFloat(i.unitCost) || 0) * (parseInt(i.quantity) || 0), 0);

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    await api.post('/purchases/purchases', {
      supplierId: purchaseForm.supplierId ? parseInt(purchaseForm.supplierId) : null,
      branchId: purchaseForm.branchId ? parseInt(purchaseForm.branchId) : undefined,
      notes: purchaseForm.notes,
      items: purchaseForm.items.map(i => ({
        productId: parseInt(i.productId),
        quantity: parseInt(i.quantity),
        unitCost: parseFloat(i.unitCost),
      })),
    });
    setShowPurchaseModal(false);
    setPurchaseForm({ supplierId: '', branchId: '', notes: '', items: [{ productId: '', quantity: 1, unitCost: 0 }] });
    load();
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    await api.post('/purchases/expenses', {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
    });
    setShowExpenseModal(false);
    setExpenseForm({ category: '', description: '', amount: '', paymentMethod: 'cash', expenseDate: new Date().toISOString().split('T')[0] });
    load();
  };

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200";

  const actionButtons = {
    suppliers: { label: 'Add Supplier', onClick: () => setShowSupplierModal(true) },
    purchases: { label: 'New Purchase', onClick: () => setShowPurchaseModal(true) },
    expenses: { label: 'Add Expense', onClick: () => setShowExpenseModal(true) },
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Purchases & Expenses</h1>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]" onClick={actionButtons[tab].onClick}>
          <Plus size={18} /> {actionButtons[tab].label}
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {['purchases', 'suppliers', 'expenses'].map(t => (
          <button
            key={t}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
        {tab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Purchase #</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Supplier</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Paid</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{p.purchase_number}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{p.supplier_name || '—'}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{p.branch_name}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">{formatCurrency(p.total_amount, user?.currency)}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{formatCurrency(p.amount_paid, user?.currency)}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50'
                        : p.status === 'pending' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50'
                        : 'bg-slate-50 text-slate-600 ring-1 ring-slate-100/50'
                      }`}>{p.status}</span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-400">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
                {purchases.length === 0 && <tr><td colSpan={7} className="py-16 text-center"><ShoppingCart size={40} className="mx-auto mb-3 text-slate-200" /><p className="text-sm font-medium text-slate-400">No purchases yet</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact Person</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Address</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{s.name}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{s.contact_person || '—'}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-500">{s.email || '—'}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-500">{s.phone || '—'}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-500">{s.address || '—'}</td>
                  </tr>
                ))}
                {suppliers.length === 0 && <tr><td colSpan={5} className="py-16 text-center"><Truck size={40} className="mx-auto mb-3 text-slate-200" /><p className="text-sm font-medium text-slate-400">No suppliers yet</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Payment</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">By</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{e.category}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{e.description || '—'}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-rose-600">{formatCurrency(e.amount, user?.currency)}</td>
                    <td className="py-3.5 px-5"><span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold ring-1 ring-blue-100/50">{e.payment_method}</span></td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{e.branch_name || '—'}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-500">{e.first_name} {e.last_name}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-400">{formatDate(e.expense_date)}</td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={7} className="py-16 text-center"><DollarSign size={40} className="mx-auto mb-3 text-slate-200" /><p className="text-sm font-medium text-slate-400">No expenses recorded</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowSupplierModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">Add Supplier</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowSupplierModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSupplierSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Name *</label>
                <input className={inputClass} value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Contact Person</label>
                <input className={inputClass} value={supplierForm.contactPerson} onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email</label>
                  <input className={inputClass} type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phone</label>
                  <input className={inputClass} value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Address</label>
                <input className={inputClass} value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowPurchaseModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">New Purchase Order</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowPurchaseModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handlePurchaseSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Supplier</label>
                  <select className={inputClass} value={purchaseForm.supplierId} onChange={e => setPurchaseForm({...purchaseForm, supplierId: e.target.value})}>
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Branch</label>
                  <select className={inputClass} value={purchaseForm.branchId} onChange={e => setPurchaseForm({...purchaseForm, branchId: e.target.value})}>
                    <option value="">Current branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[13px] font-semibold text-slate-600">Items</label>
                  <button type="button" className="text-sm text-teal-600 font-semibold hover:text-teal-700 transition-colors" onClick={addPurchaseItem}>+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {purchaseForm.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_100px_120px_40px] gap-2">
                      <select className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" value={item.productId} onChange={e => updatePurchaseItem(idx, 'productId', e.target.value)} required>
                        <option value="">Select product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" type="number" placeholder="Qty" value={item.quantity} onChange={e => updatePurchaseItem(idx, 'quantity', e.target.value)} required />
                      <input className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" type="number" placeholder="Unit Cost" value={item.unitCost} onChange={e => updatePurchaseItem(idx, 'unitCost', e.target.value)} required />
                      {purchaseForm.items.length > 1 && (
                        <button type="button" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center" onClick={() => removePurchaseItem(idx)}><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Notes</label>
                  <textarea className={inputClass} value={purchaseForm.notes} onChange={e => setPurchaseForm({...purchaseForm, notes: e.target.value})} rows={2} />
                </div>
                <div className="flex items-end">
                  <div className="text-right w-full p-3 bg-slate-50/80 rounded-xl">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Total</div>
                    <div className="text-2xl font-bold tracking-tight text-teal-600">{formatCurrency(purchaseTotal, user?.currency)}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowPurchaseModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">Create Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowExpenseModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">Add Expense</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowExpenseModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleExpenseSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Category *</label>
                <select className={inputClass} value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} required>
                  <option value="">Select category</option>
                  {['Rent', 'Utilities', 'Salaries', 'Transport', 'Marketing', 'Maintenance', 'Office Supplies', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Description</label>
                <input className={inputClass} value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Amount (UGX) *</label>
                  <input className={inputClass} type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Payment Method</label>
                  <select className={inputClass} value={expenseForm.paymentMethod} onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}>
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Date</label>
                <input className={inputClass} type="date" value={expenseForm.expenseDate} onChange={e => setExpenseForm({...expenseForm, expenseDate: e.target.value})} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
