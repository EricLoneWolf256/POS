import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Check, CreditCard, Upload, ExternalLink, Trash2, Building2, ShieldAlert, Users, TrendingUp, ToggleLeft, ToggleRight, Search } from 'lucide-react';
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

  // Super-admin state
  const [adminStats, setAdminStats] = useState(null);
  const [adminBusinesses, setAdminBusinesses] = useState([]);
  const [adminTotal, setAdminTotal] = useState(0);
  const [adminPage, setAdminPage] = useState(1);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [extendDays, setExtendDays] = useState(30);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => { load(); }, [tab]);

  const load = () => {
    if (tab === 'users') api.get('/users').then(res => setUsers(res.data));
    if (tab === 'branches') api.get('/auth/branches').then(res => setBranches(res.data));
    if (tab === 'sync') api.get('/sync/status').then(res => setSyncStatus(res.data));
    if (tab === 'subscription') {
      api.get('/payments/history').then(res => setPayments(res.data)).catch(() => {});
    }
    if (tab === 'admin') loadAdminData();
  };

  const loadAdminData = async () => {
    setAdminLoading(true);
    try {
      const [statsRes, bizRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/businesses', { params: { search: adminSearch, status: adminStatusFilter, page: adminPage, limit: 20 } }),
      ]);
      setAdminStats(statsRes.data.stats);
      setAdminBusinesses(bizRes.data.businesses);
      setAdminTotal(bizRes.data.total);
    } catch { /* handled */ }
    finally { setAdminLoading(false); }
  };

  useEffect(() => {
    if (tab === 'admin') loadAdminData();
  }, [adminSearch, adminStatusFilter, adminPage]);

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
    { id: 1, name: 'Starter',    color: 'from-orange-500 to-amber-500',   features: ['1 Location', '3 Users', '500 Products', 'Offline POS', 'WhatsApp summaries'] },
    { id: 2, name: 'Premium',    color: 'from-blue-500 to-indigo-500',    features: ['Unlimited Products & Users', 'Quotations & Invoices', 'SMS Center', 'Accounting Reports', 'Staff Performance'] },
    { id: 3, name: 'Enterprise', color: 'from-purple-500 to-pink-500',    features: ['Manufacturing Module', 'Field Sales App', 'Multi-Branch', 'Priority Support', 'Dedicated Account Manager'] },
  ];

  const handleSuspendToggle = async (biz) => {
    if (!confirm(`${biz.is_active ? 'Suspend' : 'Reactivate'} "${biz.name}"?`)) return;
    await api.patch(`/admin/businesses/${biz.id}`, { is_active: !biz.is_active });
    loadAdminData();
  };

  const handleExtend = async (bizId) => {
    await api.post(`/admin/businesses/${bizId}/extend`, { days: extendDays });
    setSelectedBusiness(null);
    loadAdminData();
  };

  const subStatus = (biz) => {
    const now = new Date();
    if (!biz.is_active) return { label: 'Suspended', cls: 'bg-red-50 text-red-600 ring-1 ring-red-100' };
    if (biz.subscription_expires_at && new Date(biz.subscription_expires_at) > now)
      return { label: 'Paid', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' };
    if (biz.trial_ends_at && new Date(biz.trial_ends_at) > now)
      return { label: 'Trial', cls: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' };
    return { label: 'Expired', cls: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' };
  };

  const tabs = user?.role === 'super_admin'
    ? ['admin', 'general', 'users', 'branches', 'sync', 'subscription']
    : ['general', 'users', 'branches', 'sync', 'subscription'];

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200";

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
            } ${t === 'admin' ? 'flex items-center gap-1.5' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'admin' && <ShieldAlert size={13} className="text-orange-500" />}
            {t === 'admin' ? 'Platform Admin' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ══════════════════ SUPER-ADMIN PLATFORM PANEL ══════════════════ */}
      {tab === 'admin' && (
        <div className="animate-fade-in space-y-6">

          {/* Stats bar */}
          {adminStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Businesses', value: adminStats.total_businesses, color: 'text-slate-800' },
                { label: 'Active',           value: adminStats.active_businesses, color: 'text-amber-600' },
                { label: 'On Trial',         value: adminStats.on_trial,          color: 'text-blue-600' },
                { label: 'Paid',             value: adminStats.paid_subscribers,  color: 'text-green-600' },
                { label: 'Expired',          value: adminStats.expired,           color: 'text-red-500' },
                { label: 'Total Revenue',    value: `UGX ${Number(adminStats.total_revenue || 0).toLocaleString()}`, color: 'text-amber-700' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                  <div className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Businesses table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <h3 className="text-base font-semibold tracking-tight text-slate-800 flex items-center gap-2 flex-1">
                <Users size={18} className="text-orange-500" /> All Businesses
                <span className="text-xs font-normal text-slate-400 ml-1">({adminTotal} total)</span>
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-52">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all"
                    placeholder="Search businesses..."
                    value={adminSearch}
                    onChange={e => { setAdminSearch(e.target.value); setAdminPage(1); }}
                  />
                </div>
                <select
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-orange-400 transition-all"
                  value={adminStatusFilter}
                  onChange={e => { setAdminStatusFilter(e.target.value); setAdminPage(1); }}
                >
                  <option value="">All Status</option>
                  <option value="trial">On Trial</option>
                  <option value="paid">Paid</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['Business', 'Email', 'City', 'Plan', 'Status', 'Trial / Expires', 'Users', 'Actions'].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adminLoading ? (
                    <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">Loading...</td></tr>
                  ) : adminBusinesses.length === 0 ? (
                    <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">No businesses found</td></tr>
                  ) : adminBusinesses.map(biz => {
                    const st = subStatus(biz);
                    const expiryDate = biz.subscription_expires_at || biz.trial_ends_at;
                    return (
                      <tr key={biz.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-semibold text-slate-800 max-w-[160px] truncate">{biz.name}</td>
                        <td className="py-3 px-4 text-xs text-slate-500 max-w-[160px] truncate">{biz.email || '—'}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{biz.city || '—'}</td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-700 capitalize">{biz.plan_name || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {expiryDate ? new Date(expiryDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 text-center">{biz.user_count}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              title="Extend subscription"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              onClick={() => setSelectedBusiness(biz)}
                            >
                              <TrendingUp size={14} />
                            </button>
                            <button
                              title={biz.is_active ? 'Suspend' : 'Reactivate'}
                              className={`p-1.5 rounded-lg transition-all ${biz.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'}`}
                              onClick={() => handleSuspendToggle(biz)}
                            >
                              {biz.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {adminTotal > 20 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Showing {(adminPage - 1) * 20 + 1}–{Math.min(adminPage * 20, adminTotal)} of {adminTotal}
                </span>
                <div className="flex gap-1.5">
                  <button disabled={adminPage === 1} onClick={() => setAdminPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all">
                    Prev
                  </button>
                  <button disabled={adminPage * 20 >= adminTotal} onClick={() => setAdminPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extend-subscription modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setSelectedBusiness(null)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[420px] shadow-2xl animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">Extend Subscription</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setSelectedBusiness(null)}><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Extending subscription for <strong className="text-slate-700">{selectedBusiness.name}</strong>.
            </p>
            <div className="mb-6">
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Number of days to add</label>
              <input
                className={inputClass}
                type="number"
                min={1}
                max={3650}
                value={extendDays}
                onChange={e => setExtendDays(parseInt(e.target.value) || 30)}
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                New expiry: {(() => {
                  const base = selectedBusiness.subscription_expires_at && new Date(selectedBusiness.subscription_expires_at) > new Date()
                    ? new Date(selectedBusiness.subscription_expires_at)
                    : new Date();
                  return new Date(base.getTime() + extendDays * 86400000).toLocaleDateString();
                })()}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all" onClick={() => setSelectedBusiness(null)}>Cancel</button>
              <button className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 transition-all active:scale-[0.98]" onClick={() => handleExtend(selectedBusiness.id)}>
                Extend
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-5">Business Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-50/80 rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-500/20">
                {user?.businessName?.[0] || 'V'}
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Business Logo</label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200/60 rounded-lg hover:bg-orange-100 transition-all cursor-pointer">
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
                  <p><span className="inline-flex px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-semibold ring-1 ring-orange-100/50">{item.value}</span></p>
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
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25 hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]" onClick={openAddUser}>
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
                    <td className="py-3 px-4"><span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${u.is_active ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50' : 'bg-red-50 text-red-600 ring-1 ring-red-100/50'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
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
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25 hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]" onClick={openAddBranch}>
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
                    <td className="py-3 px-4">{b.is_main ? <span className="inline-flex px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold ring-1 ring-amber-100/50">Main</span> : '—'}</td>
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
              { label: 'Connection', value: syncStatus.online ? 'Online' : 'Offline', color: syncStatus.online ? 'text-amber-600' : 'text-rose-600' },
              { label: 'Pending Sync', value: syncStatus.queue?.pending || 0, color: 'text-amber-600' },
              { label: 'Synced', value: syncStatus.queue?.synced || 0, color: 'text-amber-600' },
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
              <CreditCard size={20} className="text-orange-600" />
              <h3 className="text-base font-semibold tracking-tight text-slate-800">Account & Plan</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/80 rounded-xl p-4">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Current Plan</label>
                <p className="text-sm font-bold text-slate-800 capitalize">{user?.plan || 'enterprise'}</p>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-4">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Status</label>
                <span className="inline-flex px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold ring-1 ring-amber-100/50">Active</span>
              </div>
            </div>
          </div>

          <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-4">Included Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {plans.map((p) => (
              <div key={p.name} className={`relative bg-white rounded-2xl border p-6 shadow-sm shadow-slate-200/50 transition-all duration-200 ${
                user?.plan === p.name.toLowerCase() ? 'border-orange-300 ring-2 ring-orange-500/10' : 'border-slate-200/80'
              }`}>
                {user?.plan === p.name.toLowerCase() && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-orange-600 text-white rounded-lg text-[11px] font-bold shadow-lg shadow-orange-500/25">Current</div>
                )}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Check size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-slate-800 mb-4">{p.name}</h3>
                <ul className="space-y-2.5">
                  {p.features.map(f => (
                    <li key={f} className="text-sm text-slate-600 flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-orange-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
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
                            p.status === 'completed' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50' :
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
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]">
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
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]">
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
