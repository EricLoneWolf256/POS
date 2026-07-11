import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Check, CreditCard, Upload, ExternalLink, Trash2, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('general');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'cashier', branchId: '' });
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { load(); }, [tab]);

  const load = () => {
    if (tab === 'users') api.get('/users').then(res => setUsers(res.data));
    if (tab === 'branches') api.get('/auth/branches').then(res => setBranches(res.data));
    if (tab === 'sync') api.get('/sync/status').then(res => setSyncStatus(res.data));
    if (tab === 'subscription') {
      api.get('/payments/history').then(res => setPayments(res.data)).catch(() => {});
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'cashier', branchId: '' });
    setShowUserModal(true);
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      password: '',
      role: u.role,
      branchId: u.branch_id || '',
    });
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...userForm, branchId: userForm.branchId || undefined };
    if (!payload.password) delete payload.password;
    if (editingUser) {
      await api.put(`/users/${editingUser.id}`, payload);
    } else {
      await api.post('/users', payload);
    }
    setShowUserModal(false);
    load();
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      await api.post('/uploads/business-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const openAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({ name: '', code: '', address: '', phone: '' });
    setShowBranchModal(true);
  };

  const openEditBranch = (b) => {
    setEditingBranch(b);
    setBranchForm({ name: b.name, code: b.code || '', address: b.address || '', phone: b.phone || '' });
    setShowBranchModal(true);
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`/auth/branches/${editingBranch.id}`, branchForm);
      } else {
        await api.post('/auth/branches', branchForm);
      }
      setShowBranchModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save branch');
    }
  };

  const handleDeleteBranch = async (branchId) => {
    if (!confirm('Are you sure you want to deactivate this branch?')) return;
    try {
      await api.delete(`/auth/branches/${branchId}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete branch');
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      const res = await api.post('/payments/initialize', {
        planId,
        redirectUrl: `${window.location.origin}/app/settings?tab=subscription`,
      });
      if (res.data.paymentLink) {
        window.location.href = res.data.paymentLink;
      } else if (res.data.simulated) {
        alert('Payment gateway not configured. In production, this would redirect to Flutterwave.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Payment initialization failed');
    }
  };

  const plans = [
    { id: 1, name: 'Starter', price: 'UGX 1,200,000', color: 'from-teal-500 to-emerald-500', features: ['1 Location', '3 Users', '500 Products', 'Offline POS', 'WhatsApp summaries'] },
    { id: 2, name: 'Premium', price: 'UGX 1,800,000', color: 'from-blue-500 to-indigo-500', features: ['Unlimited Products & Users', 'Quotations & Invoices', 'SMS Center', 'Accounting Reports', 'Staff Performance'] },
    { id: 3, name: 'Enterprise', price: 'UGX 2,500,000', color: 'from-purple-500 to-pink-500', features: ['Manufacturing Module', 'Field Sales App', 'Multi-Branch', 'Priority Support', 'Dedicated Account Manager'] },
  ];

  const tabs = ['general', 'users', 'branches', 'sync', 'subscription'];

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200";

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Settings</h1>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(t => (
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

      {tab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Business Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-50/80 rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-teal-500/20">
                {user?.businessName?.[0] || 'V'}
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Business Logo</label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200/60 rounded-lg hover:bg-teal-100 transition-all cursor-pointer">
                  <Upload size={12} /> {uploading ? 'Uploading...' : 'Upload Logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                </label>
              </div>
            </div>
            {[
              { label: 'Business Name', value: user?.businessName },
              { label: 'Current Branch', value: user?.branchName },
              { label: 'Currency', value: user?.currency || 'UGX' },
              { label: 'Plan', value: user?.plan || 'enterprise', badge: true },
            ].map(item => (
              <div key={item.label} className="bg-slate-50/80 rounded-xl p-4">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">{item.label}</label>
                {item.badge ? (
                  <p><span className="inline-flex px-2.5 py-1 bg-teal-50 text-teal-600 rounded-lg text-xs font-semibold ring-1 ring-teal-100/50">{item.value}</span></p>
                ) : (
                  <p className="text-sm font-semibold text-slate-700">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold tracking-tight text-slate-800">User Management</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]" onClick={openAddUser}>
              <Plus size={16} /> Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Last Login</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">{u.first_name} {u.last_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{u.email}</td>
                    <td className="py-3 px-4"><span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold ring-1 ring-blue-100/50">{u.role}</span></td>
                    <td className="py-3 px-4 text-sm text-slate-600">{u.branch_name || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{u.last_login ? new Date(u.last_login).toLocaleString('en-UG') : 'Never'}</td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${u.is_active ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50' : 'bg-red-50 text-red-600 ring-1 ring-red-100/50'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={() => openEditUser(u)}>
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'branches' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold tracking-tight text-slate-800">Branch Management</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]" onClick={openAddBranch}>
              <Plus size={16} /> Add Branch
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Code</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Address</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Main</th>
                  <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">{b.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 font-mono">{b.code || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{b.address || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{b.phone || '—'}</td>
                    <td className="py-3 px-4">{b.is_main ? <span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold ring-1 ring-emerald-100/50">Main</span> : '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={() => openEditBranch(b)}>
                          <Edit2 size={15} />
                        </button>
                        {!b.is_main && (
                          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onClick={() => handleDeleteBranch(b.id)}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'sync' && syncStatus && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Offline Sync Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            {[
              { label: 'Connection', value: syncStatus.online ? 'Online' : 'Offline', color: syncStatus.online ? 'text-emerald-600' : 'text-rose-600' },
              { label: 'Pending Sync', value: syncStatus.queue?.pending || 0, color: 'text-amber-600' },
              { label: 'Synced', value: syncStatus.queue?.synced || 0, color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50/80 rounded-xl p-4">
                <div className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
                <div className="text-[13px] text-slate-400 font-medium mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm">
            Venderra automatically syncs sales and data when internet connection is restored. All POS features work fully offline.
          </p>
        </div>
      )}

      {tab === 'subscription' && (
        <div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard size={20} className="text-teal-600" />
              <h3 className="text-base font-semibold tracking-tight text-slate-800">Subscription & Billing</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50/80 rounded-xl p-4">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Current Plan</label>
                <p className="text-sm font-bold text-slate-800 capitalize">{user?.plan || 'starter'}</p>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-4">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Status</label>
                <span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold ring-1 ring-emerald-100/50">Active</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-4">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Billing Cycle</label>
                <p className="text-sm font-bold text-slate-800">Annual</p>
              </div>
            </div>
          </div>

          <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-4">Upgrade or Change Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {plans.map((p) => (
              <div key={p.name} className={`relative bg-white rounded-2xl border p-6 shadow-sm shadow-slate-200/50 transition-all duration-200 hover:shadow-md ${
                user?.plan === p.name.toLowerCase() ? 'border-teal-300 ring-2 ring-teal-500/10' : 'border-slate-200/80'
              }`}>
                {user?.plan === p.name.toLowerCase() && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-teal-600 text-white rounded-lg text-[11px] font-bold shadow-lg shadow-teal-500/25">Current</div>
                )}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Check size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-slate-800">{p.name}</h3>
                <p className="text-xl font-bold text-teal-600 mt-1">{p.price}<span className="text-sm font-medium text-slate-400">/year</span></p>
                <ul className="mt-5 space-y-2.5 mb-5">
                  {p.features.map(f => (
                    <li key={f} className="text-sm text-slate-600 flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-teal-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                {user?.plan !== p.name.toLowerCase() && (
                  <button onClick={() => handleUpgrade(p.id)} className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl">
                    Upgrade Now
                  </button>
                )}
              </div>
            ))}
          </div>

          {payments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
              <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-4">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reference</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 px-4 text-sm text-slate-600">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-700 capitalize">{p.plan_name}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-slate-800">UGX {Number(p.amount).toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-slate-400 font-mono text-xs">{p.tx_ref}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50' :
                            p.status === 'pending' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50' :
                            'bg-red-50 text-red-600 ring-1 ring-red-100/50'
                          }`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowUserModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUserSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">First Name *</label>
                  <input className={inputClass} value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Last Name *</label>
                  <input className={inputClass} value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email *</label>
                <input className={inputClass} type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input className={inputClass} type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} {...(!editingUser && { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Role *</label>
                  <select className={inputClass} value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} required>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Branch</label>
                  <select className={inputClass} value={userForm.branchId} onChange={e => setUserForm({...userForm, branchId: e.target.value})}>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowBranchModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
                <Building2 size={20} /> {editingBranch ? 'Edit Branch' : 'Add Branch'}
              </h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowBranchModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleBranchSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Branch Name *</label>
                <input className={inputClass} value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} required placeholder="e.g. Kampala Main" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Branch Code</label>
                  <input className={inputClass} value={branchForm.code} onChange={e => setBranchForm({...branchForm, code: e.target.value})} placeholder="e.g. KLA-01" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phone</label>
                  <input className={inputClass} value={branchForm.phone} onChange={e => setBranchForm({...branchForm, phone: e.target.value})} placeholder="e.g. +256 700 000000" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Address</label>
                <input className={inputClass} value={branchForm.address} onChange={e => setBranchForm({...branchForm, address: e.target.value})} placeholder="e.g. Plot 123, Kampala Road" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowBranchModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]">
                  {editingBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
