import { useState, useEffect } from 'react';
import { Plus, X, ShoppingBag, Truck, DollarSign } from 'lucide-react';
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
    await api.post('/purchases/expenses', { ...expenseForm, amount: parseFloat(expenseForm.amount) });
    setShowExpenseModal(false);
    setExpenseForm({ category: '', description: '', amount: '', paymentMethod: 'cash', expenseDate: new Date().toISOString().split('T')[0] });
    load();
  };

  const addActions = {
    purchases: { label: 'New Purchase', onClick: () => setShowPurchaseModal(true) },
    suppliers:  { label: 'Add Supplier', onClick: () => setShowSupplierModal(true) },
    expenses:   { label: 'Add Expense',  onClick: () => setShowExpenseModal(true) },
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Purchases &amp; Expenses</h1>
          <p className="page-subtitle">Manage suppliers, purchase orders, and expenses</p>
        </div>
        <button className="btn btn-primary" onClick={addActions[tab].onClick}>
          <Plus size={15} /> {addActions[tab].label}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-md w-fit">
        {['purchases', 'suppliers', 'expenses'].map(t => (
          <button
            key={t}
            className={`px-4 py-1.5 rounded text-[13px] font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tables */}
      <div className="card overflow-hidden">

        {/* Purchases */}
        {tab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Purchase #</th>
                  <th>Supplier</th>
                  <th>Branch</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-[12px] text-gray-600">{p.purchase_number}</td>
                    <td className="text-gray-600">{p.supplier_name || '—'}</td>
                    <td className="text-gray-600">{p.branch_name}</td>
                    <td className="tabular-nums font-medium text-gray-900">{formatCurrency(p.total_amount, user?.currency)}</td>
                    <td className="tabular-nums text-gray-600">{formatCurrency(p.amount_paid, user?.currency)}</td>
                    <td>
                      <span className={`badge ${p.status === 'completed' ? 'badge-green' : p.status === 'pending' ? 'badge-amber' : 'badge-gray'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="tabular-nums text-gray-400">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
                {!purchases.length && (
                  <tr><td colSpan={7}><div className="empty-state"><ShoppingBag size={32} className="text-gray-200" /><p>No purchases yet</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Suppliers */}
        {tab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium text-gray-700">{s.name}</td>
                    <td className="text-gray-600">{s.contact_person || '—'}</td>
                    <td className="text-gray-500">{s.email || '—'}</td>
                    <td className="text-gray-500">{s.phone || '—'}</td>
                    <td className="text-gray-500">{s.address || '—'}</td>
                  </tr>
                ))}
                {!suppliers.length && (
                  <tr><td colSpan={5}><div className="empty-state"><Truck size={32} className="text-gray-200" /><p>No suppliers yet</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Expenses */}
        {tab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Branch</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="font-medium text-gray-700">{e.category}</td>
                    <td className="text-gray-600">{e.description || '—'}</td>
                    <td className="tabular-nums font-medium text-red-600">{formatCurrency(e.amount, user?.currency)}</td>
                    <td><span className="badge badge-blue">{e.payment_method}</span></td>
                    <td className="text-gray-600">{e.branch_name || '—'}</td>
                    <td className="text-gray-500">{e.first_name} {e.last_name}</td>
                    <td className="tabular-nums text-gray-400">{formatDate(e.expense_date)}</td>
                  </tr>
                ))}
                {!expenses.length && (
                  <tr><td colSpan={7}><div className="empty-state"><DollarSign size={32} className="text-gray-200" /><p>No expenses recorded</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Supplier</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowSupplierModal(false)}><X size={16} /></button>
            </div>
            <form id="supplier-form" onSubmit={handleSupplierSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Name *</label>
                  <input className="input" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Contact Person</label>
                  <input className="input" value={supplierForm.contactPerson} onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Email</label>
                    <input className="input" type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input className="input" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Address</label>
                  <input className="input" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button type="submit" form="supplier-form" className="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="modal modal-lg animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Purchase Order</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowPurchaseModal(false)}><X size={16} /></button>
            </div>
            <form id="purchase-form" onSubmit={handlePurchaseSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Supplier</label>
                    <select className="input" value={purchaseForm.supplierId} onChange={e => setPurchaseForm({...purchaseForm, supplierId: e.target.value})}>
                      <option value="">Select supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Branch</label>
                    <select className="input" value={purchaseForm.branchId} onChange={e => setPurchaseForm({...purchaseForm, branchId: e.target.value})}>
                      <option value="">Current branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label" style={{ margin: 0 }}>Items</label>
                    <button type="button" className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors" onClick={addPurchaseItem}>+ Add Item</button>
                  </div>
                  <div className="space-y-2">
                    {purchaseForm.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_100px_120px_36px] gap-2">
                        <select className="input" value={item.productId} onChange={e => updatePurchaseItem(idx, 'productId', e.target.value)} required>
                          <option value="">Select product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input className="input" type="number" placeholder="Qty" value={item.quantity} onChange={e => updatePurchaseItem(idx, 'quantity', e.target.value)} required />
                        <input className="input" type="number" placeholder="Unit Cost" value={item.unitCost} onChange={e => updatePurchaseItem(idx, 'unitCost', e.target.value)} required />
                        {purchaseForm.items.length > 1 && (
                          <button type="button" className="btn btn-ghost p-1 text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center" onClick={() => removePurchaseItem(idx)}>
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
                    <textarea className="input" rows={2} value={purchaseForm.notes} onChange={e => setPurchaseForm({...purchaseForm, notes: e.target.value})} />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-md p-4 text-right">
                      <p className="section-label mb-0.5">Total</p>
                      <p className="text-xl font-semibold tabular-nums text-gray-900">{formatCurrency(purchaseTotal, user?.currency)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPurchaseModal(false)}>Cancel</button>
                <button type="submit" form="purchase-form" className="btn btn-primary">Create Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Expense</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowExpenseModal(false)}><X size={16} /></button>
            </div>
            <form id="expense-form" onSubmit={handleExpenseSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Category *</label>
                  <select className="input" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} required>
                    <option value="">Select category</option>
                    {['Rent', 'Utilities', 'Salaries', 'Transport', 'Marketing', 'Maintenance', 'Office Supplies', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <input className="input" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Amount *</label>
                    <input className="input" type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Payment Method</label>
                    <select className="input" value={expenseForm.paymentMethod} onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}>
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input className="input" type="date" value={expenseForm.expenseDate} onChange={e => setExpenseForm({...expenseForm, expenseDate: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" form="expense-form" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
