import { useState } from 'react';
import { Plus, Search, Pencil, X, Users } from 'lucide-react';
import api, { formatCurrency } from '../services/api';
import useFetch from '../hooks/useFetch';
import { TableLoading, TableError } from '../components/TableState';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', creditLimit: 0 });

  const { data, loading, error, reload } = useFetch(
    () => api.get('/customers', { params: { search } }).then(r => r.data),
    [search]
  );
  const customers = data || [];

  const openAdd = () => {
    setEditingCustomer(null);
    setForm({ name: '', email: '', phone: '', address: '', creditLimit: 0 });
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      creditLimit: customer.credit_limit || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, creditLimit: parseFloat(form.creditLimit) || 0 };
    if (editingCustomer) {
      await api.put(`/customers/${editingCustomer.id}`, payload);
    } else {
      await api.post('/customers', payload);
    }
    setShowModal(false);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer profiles and credit</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input input-icon-left"
            placeholder="Search by name, phone, or email…"
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
                <th>Phone</th>
                <th>Email</th>
                <th>Credit Limit</th>
                <th>Credit Balance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoading colSpan={7} />
              ) : error ? (
                <TableError colSpan={7} onRetry={reload} />
              ) : customers.map(c => (
                <tr key={c.id}>
                  <td className="font-medium text-gray-700">{c.name}</td>
                  <td className="text-gray-500">{c.phone || '—'}</td>
                  <td className="text-gray-500">{c.email || '—'}</td>
                  <td className="tabular-nums text-gray-600">{formatCurrency(c.credit_limit, 'UGX')}</td>
                  <td>
                    <span className={`badge ${c.credit_balance > 0 ? 'badge-amber' : 'badge-gray'}`}>
                      {formatCurrency(c.credit_balance, 'UGX')}
                    </span>
                  </td>
                  <td><span className="badge badge-green">Active</span></td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-sm p-1.5" onClick={() => openEdit(c)} title="Edit">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!customers.length && !loading && !error && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <Users size={32} className="text-gray-200" />
                      <p>No customers found</p>
                      <span>Add your first customer to get started</span>
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
              <h3 className="modal-title">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form id="customer-form" onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Name *</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      className="input"
                      value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      className="input"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Address</label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Credit Limit (UGX)</label>
                  <input
                    className="input"
                    type="number"
                    value={form.creditLimit}
                    onChange={e => setForm({...form, creditLimit: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="customer-form" className="btn btn-primary">
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
