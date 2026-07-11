import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, X, Users } from 'lucide-react';
import api, { formatCurrency } from '../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', creditLimit: 0 });

  useEffect(() => { load(); }, [search]);

  const load = () => api.get('/customers', { params: { search } }).then(res => setCustomers(res.data));

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
    load();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Customers</h1>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]" onClick={openAdd}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 placeholder:text-slate-400"
          placeholder="Search by name, phone, or email..."
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
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Credit Limit</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Credit Balance</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{c.name}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-500">{c.phone || '—'}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-500">{c.email || '—'}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-600">{formatCurrency(c.credit_limit, 'UGX')}</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${c.credit_balance > 0 ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50'}`}>
                      {formatCurrency(c.credit_balance, 'UGX')}
                    </span>
                  </td>
                  <td className="py-3.5 px-5"><span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold ring-1 ring-emerald-100/50">Active</span></td>
                  <td className="py-3.5 px-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={() => openEdit(c)}>
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Users size={40} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm font-medium text-slate-400">No customers found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Name *</label>
                <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phone</label>
                  <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email</label>
                  <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Address</label>
                <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Credit Limit (UGX)</label>
                <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200" type="number" value={form.creditLimit} onChange={e => setForm({...form, creditLimit: e.target.value})} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
