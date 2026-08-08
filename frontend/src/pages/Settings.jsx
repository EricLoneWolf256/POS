import { useState, useEffect } from 'react';
import { Plus, X, Pencil, Check, CreditCard, Upload, Trash2, Building2, ShieldAlert, Users, TrendingUp, ToggleLeft, ToggleRight, Search, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const showConfirm = (message, onConfirm) => setConfirmDialog({ message, onConfirm });
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
    if (tab === 'subscription') api.get('/payments/history').then(res => setPayments(res.data)).catch(() => {});
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
    } catch {
      showToast('Failed to load admin data', 'error');
    }
    finally { setAdminLoading(false); }
  };

  useEffect(() => { if (tab === 'admin') loadAdminData(); }, [adminSearch, adminStatusFilter, adminPage]);

  const openAddUser = () => { setEditingUser(null); setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'cashier', branchId: '' }); setShowUserModal(true); };
  const openEditUser = (u) => { setEditingUser(u); setUserForm({ firstName: u.first_name, lastName: u.last_name, email: u.email, password: '', role: u.role, branchId: u.branch_id || '' }); setShowUserModal(true); };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...userForm, branchId: userForm.branchId || undefined };
      if (!payload.password) delete payload.password;
      if (editingUser) { await api.put(`/users/${editingUser.id}`, payload); }
      else { await api.post('/users', payload); }
      setShowUserModal(false);
      showToast(editingUser ? 'User updated' : 'User created');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('logo', file);
      await api.post('/uploads/business-logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Logo uploaded');
    } catch {
      showToast('Logo upload failed', 'error');
    } finally { setUploading(false); }
  };

  const openAddBranch = () => { setEditingBranch(null); setBranchForm({ name: '', code: '', address: '', phone: '' }); setShowBranchModal(true); };
  const openEditBranch = (b) => { setEditingBranch(b); setBranchForm({ name: b.name, code: b.code || '', address: b.address || '', phone: b.phone || '' }); setShowBranchModal(true); };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBranch) { await api.put(`/auth/branches/${editingBranch.id}`, branchForm); }
      else { await api.post('/auth/branches', branchForm); }
      setShowBranchModal(false);
      showToast(editingBranch ? 'Branch updated' : 'Branch created');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save branch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = (id) => {
    showConfirm('Deactivate this branch? This cannot be undone.', async () => {
      try { await api.delete(`/auth/branches/${id}`); showToast('Branch deactivated'); load(); }
      catch (err) { showToast(err.response?.data?.error || 'Failed to deactivate branch', 'error'); }
    });
  };

  const handleUpgrade = async (planId) => {
    try {
      const res = await api.post('/payments/initialize', { planId, redirectUrl: `${window.location.origin}/app/settings?tab=subscription` });
      if (res.data.paymentLink) window.location.href = res.data.paymentLink;
      else if (res.data.simulated) showToast('Payment gateway not configured.', 'error');
    } catch (err) { showToast(err.response?.data?.error || 'Payment init failed', 'error'); }
  };

  const handleSuspendToggle = (biz) => {
    showConfirm(`${biz.is_active ? 'Suspend' : 'Reactivate'} "${biz.name}"?`, async () => {
      await api.patch(`/admin/businesses/${biz.id}`, { is_active: !biz.is_active });
      showToast(biz.is_active ? `"${biz.name}" suspended` : `"${biz.name}" reactivated`);
      loadAdminData();
    });
  };

  const handleExtend = async (bizId) => {
    await api.post(`/admin/businesses/${bizId}/extend`, { days: extendDays });
    setSelectedBusiness(null); loadAdminData();
  };

  const subStatus = (biz) => {
    const now = new Date();
    if (!biz.is_active) return { label: 'Suspended', cls: 'badge-red' };
    if (biz.subscription_expires_at && new Date(biz.subscription_expires_at) > now) return { label: 'Paid', cls: 'badge-green' };
    if (biz.trial_ends_at && new Date(biz.trial_ends_at) > now) return { label: 'Trial', cls: 'badge-blue' };
    return { label: 'Expired', cls: 'badge-gray' };
  };

  const plans = [
    { id: 1, name: 'Starter',    features: ['1 Location', '3 Users', '500 Products', 'Offline POS', 'WhatsApp summaries'] },
    { id: 2, name: 'Premium',    features: ['Unlimited Products & Users', 'Quotations & Invoices', 'SMS Center', 'Accounting Reports', 'Staff Performance'] },
    { id: 3, name: 'Enterprise', features: ['Manufacturing Module', 'Field Sales App', 'Multi-Branch', 'Priority Support', 'Dedicated Account Manager'] },
  ];

  const tabs = user?.role === 'super_admin'
    ? ['admin', 'general', 'users', 'branches', 'sync', 'subscription']
    : ['general', 'users', 'branches', 'sync', 'subscription'];

  const TAB_LABEL = { admin: 'Platform Admin', general: 'General', users: 'Users', branches: 'Branches', sync: 'Sync', subscription: 'Subscription' };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[600] flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium border animate-slide-up ${
          toast.type === 'error' ? 'alert alert-error' : 'alert alert-success'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          {toast.message}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Action</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setConfirmDialog(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p className="text-[13px] text-gray-600">{confirmDialog.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your business, users, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-0.5 bg-gray-100 p-0.5 rounded-md w-fit">
        {tabs.map(t => (
          <button
            key={t}
            className={`px-4 py-1.5 rounded text-[13px] font-medium transition-colors flex items-center gap-1.5 ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab(t)}
          >
            {t === 'admin' && <ShieldAlert size={12} className="text-red-500" />}
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {/* ── Admin tab ── */}
      {tab === 'admin' && (
        <div className="space-y-5 animate-fade-in">
          {adminStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total',    value: adminStats.total_businesses },
                { label: 'Active',   value: adminStats.active_businesses },
                { label: 'On Trial', value: adminStats.on_trial },
                { label: 'Paid',     value: adminStats.paid_subscribers },
                { label: 'Expired',  value: adminStats.expired },
                { label: 'Revenue',  value: `UGX ${Number(adminStats.total_revenue || 0).toLocaleString()}` },
              ].map(s => (
                <div key={s.label} className="card p-4">
                  <p className="text-xl font-semibold text-gray-900 tabular-nums leading-none">{s.value}</p>
                  <p className="text-[12px] text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="card-title flex items-center gap-2 flex-1">
                <Users size={15} className="text-blue-600" /> All Businesses
                <span className="text-[12px] font-normal text-gray-400">({adminTotal} total)</span>
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-52">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input className="input input-icon-left text-[12px]" placeholder="Search businesses…" value={adminSearch} onChange={e => { setAdminSearch(e.target.value); setAdminPage(1); }} />
                </div>
                <select className="input text-[12px] w-auto" value={adminStatusFilter} onChange={e => { setAdminStatusFilter(e.target.value); setAdminPage(1); }}>
                  <option value="">All Status</option>
                  <option value="trial">Trial</option>
                  <option value="paid">Paid</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Business</th><th>Email</th><th>City</th><th>Plan</th><th>Status</th><th>Expires</th><th>Users</th><th className="text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {adminLoading ? (
                    <tr><td colSpan={8} className="text-center text-gray-400 py-8 text-sm">Loading…</td></tr>
                  ) : !adminBusinesses.length ? (
                    <tr><td colSpan={8} className="text-center text-gray-400 py-8 text-sm">No businesses found</td></tr>
                  ) : adminBusinesses.map(biz => {
                    const st = subStatus(biz);
                    const exp = biz.subscription_expires_at || biz.trial_ends_at;
                    return (
                      <tr key={biz.id}>
                        <td className="font-medium text-gray-700 max-w-[140px] truncate">{biz.name}</td>
                        <td className="text-gray-500 text-[12px] max-w-[140px] truncate">{biz.email || '—'}</td>
                        <td className="text-gray-500">{biz.city || '—'}</td>
                        <td className="font-medium text-gray-700 capitalize">{biz.plan_name || '—'}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <td className="tabular-nums text-gray-400 text-[12px]">{exp ? new Date(exp).toLocaleDateString() : '—'}</td>
                        <td className="tabular-nums text-center text-gray-600">{biz.user_count}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="btn btn-ghost btn-sm p-1.5" onClick={() => setSelectedBusiness(biz)} title="Extend"><TrendingUp size={13} /></button>
                            <button className={`btn btn-ghost btn-sm p-1.5 ${biz.is_active ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-green-500 hover:bg-green-50 hover:text-green-600'}`} onClick={() => handleSuspendToggle(biz)} title={biz.is_active ? 'Suspend' : 'Reactivate'}>
                              {biz.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {adminTotal > 20 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[12px] text-gray-400">Showing {(adminPage-1)*20+1}–{Math.min(adminPage*20,adminTotal)} of {adminTotal}</span>
                <div className="flex gap-1.5">
                  <button disabled={adminPage===1} onClick={() => setAdminPage(p=>p-1)} className="btn btn-secondary btn-sm">Prev</button>
                  <button disabled={adminPage*20>=adminTotal} onClick={() => setAdminPage(p=>p+1)} className="btn btn-secondary btn-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extend modal */}
      {selectedBusiness && (
        <div className="modal-overlay" onClick={() => setSelectedBusiness(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Extend Subscription</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setSelectedBusiness(null)}><X size={16} /></button>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-[13px] text-gray-500">Extending for <strong className="text-gray-700">{selectedBusiness.name}</strong></p>
              <div>
                <label className="form-label">Days to add</label>
                <input className="input" type="number" min={1} max={3650} value={extendDays} onChange={e => setExtendDays(parseInt(e.target.value)||30)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedBusiness(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleExtend(selectedBusiness.id)}>Extend</button>
            </div>
          </div>
        </div>
      )}

      {/* ── General tab ── */}
      {tab === 'general' && (
        <div className="card p-5 space-y-5 animate-fade-in">
          <p className="text-[13px] font-medium text-gray-700">Business Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-md p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {user?.businessName?.[0] || 'V'}
              </div>
              <div>
                <p className="section-label mb-1">Business Logo</p>
                <label className="btn btn-secondary btn-sm cursor-pointer">
                  <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload Logo'}
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
              <div key={item.label} className="bg-gray-50 border border-gray-100 rounded-md p-4">
                <p className="section-label mb-1">{item.label}</p>
                {item.badge
                  ? <span className="badge badge-blue">{item.value}</span>
                  : <p className="text-[13px] font-medium text-gray-700">{item.value}</p>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Users tab ── */}
      {tab === 'users' && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="card-header">
            <span className="card-title">User Management</span>
            <button className="btn btn-primary btn-sm" onClick={openAddUser}><Plus size={13} /> Add User</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Last Login</th><th>Status</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium text-gray-700">{u.first_name} {u.last_name}</td>
                    <td className="text-gray-500">{u.email}</td>
                    <td><span className="badge badge-blue">{u.role}</span></td>
                    <td className="text-gray-600">{u.branch_name || '—'}</td>
                    <td className="tabular-nums text-gray-400">{u.last_login ? new Date(u.last_login).toLocaleString('en-UG') : 'Never'}</td>
                    <td><span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-right">
                      <button className="btn btn-ghost btn-sm p-1.5" onClick={() => openEditUser(u)}><Pencil size={13} /></button>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <Users size={32} className="text-gray-200" />
                        <p>No users found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Branches tab ── */}
      {tab === 'branches' && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="card-header">
            <span className="card-title">Branch Management</span>
            <button className="btn btn-primary btn-sm" onClick={openAddBranch}><Plus size={13} /> Add Branch</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Branch</th><th>Code</th><th>Address</th><th>Phone</th><th>Main</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id}>
                    <td className="font-medium text-gray-700">{b.name}</td>
                    <td className="font-mono text-[12px] text-gray-500">{b.code || '—'}</td>
                    <td className="text-gray-600">{b.address || '—'}</td>
                    <td className="text-gray-500">{b.phone || '—'}</td>
                    <td>{b.is_main ? <span className="badge badge-blue">Main</span> : '—'}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn btn-ghost btn-sm p-1.5" onClick={() => openEditBranch(b)}><Pencil size={13} /></button>
                        {!b.is_main && <button className="btn btn-ghost btn-sm p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteBranch(b.id)}><Trash2 size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!branches.length && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Building2 size={32} className="text-gray-200" />
                        <p>No branches found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sync tab ── */}
      {tab === 'sync' && syncStatus && (
        <div className="card p-5 animate-fade-in">
          <p className="text-[13px] font-medium text-gray-700 mb-4">Offline Sync Status</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Connection',    value: syncStatus.online ? 'Online' : 'Offline' },
              { label: 'Pending Sync',  value: syncStatus.queue?.pending || 0 },
              { label: 'Synced',        value: syncStatus.queue?.synced || 0 },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-md p-4">
                <p className="text-xl font-semibold text-gray-900 tabular-nums">{s.value}</p>
                <p className="text-[12px] text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-gray-500">Venderra syncs sales and data automatically when internet is restored. All POS features work fully offline.</p>
        </div>
      )}

      {/* ── Subscription tab ── */}
      {tab === 'subscription' && (
        <div className="space-y-5 animate-fade-in">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={15} className="text-blue-600" />
              <p className="text-[13px] font-medium text-gray-700">Account &amp; Plan</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-100 rounded-md p-4">
                <p className="section-label mb-1">Current Plan</p>
                <p className="text-[13px] font-semibold text-gray-800 capitalize">{user?.plan || 'enterprise'}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-md p-4">
                <p className="section-label mb-1">Status</p>
                <span className="badge badge-green">Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { id: 1, name: 'Starter',    features: ['1 Location', '3 Users', '500 Products', 'Offline POS', 'WhatsApp summaries'] },
              { id: 2, name: 'Premium',    features: ['Unlimited Products & Users', 'Quotations & Invoices', 'SMS Center', 'Accounting Reports', 'Staff Performance'] },
              { id: 3, name: 'Enterprise', features: ['Manufacturing Module', 'Field Sales App', 'Multi-Branch', 'Priority Support', 'Dedicated Account Manager'] },
            ].map(p => (
              <div key={p.name} className={`card p-5 ${user?.plan === p.name.toLowerCase() ? 'border-blue-300' : ''}`}>
                {user?.plan === p.name.toLowerCase() && (
                  <span className="badge badge-blue mb-3">Current Plan</span>
                )}
                <p className="text-[15px] font-semibold text-gray-900 mb-3">{p.name}</p>
                <ul className="space-y-2 mb-4">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <Check size={13} className="text-blue-500 shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                {user?.plan !== p.name.toLowerCase() && (
                  <button className="btn btn-secondary btn-sm w-full justify-center" onClick={() => handleUpgrade(p.id)}>
                    Upgrade to {p.name}
                  </button>
                )}
              </div>
            ))}
          </div>

          {payments.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header"><span className="card-title">Payment History</span></div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Reference</th><th>Status</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td className="tabular-nums text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="font-medium text-gray-700 capitalize">{p.plan_name}</td>
                        <td className="tabular-nums font-medium text-gray-900">UGX {Number(p.amount).toLocaleString()}</td>
                        <td className="font-mono text-[11px] text-gray-400">{p.tx_ref}</td>
                        <td><span className={`badge ${p.status === 'completed' ? 'badge-green' : p.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── User Modal ── */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowUserModal(false)}><X size={16} /></button>
            </div>
            <form id="user-form" onSubmit={handleUserSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">First Name *</label>
                    <input className="input" value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Last Name *</label>
                    <input className="input" value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input className="input" type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input className="input" type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} {...(!editingUser && { required: true })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Role *</label>
                    <select className="input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} required>
                      <option value="cashier">Cashier</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Branch</label>
                    <select className="input" value={userForm.branchId} onChange={e => setUserForm({...userForm, branchId: e.target.value})}>
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" form="user-form" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner spinner-sm spinner-white" /> : null}
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Branch Modal ── */}
      {showBranchModal && (
        <div className="modal-overlay" onClick={() => setShowBranchModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2"><Building2 size={15} /> {editingBranch ? 'Edit Branch' : 'Add Branch'}</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowBranchModal(false)}><X size={16} /></button>
            </div>
            <form id="branch-form" onSubmit={handleBranchSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Branch Name *</label>
                  <input className="input" value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} required placeholder="e.g. Kampala Main" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Branch Code</label>
                    <input className="input" value={branchForm.code} onChange={e => setBranchForm({...branchForm, code: e.target.value})} placeholder="e.g. KLA-01" />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input className="input" value={branchForm.phone} onChange={e => setBranchForm({...branchForm, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Address</label>
                  <input className="input" value={branchForm.address} onChange={e => setBranchForm({...branchForm, address: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBranchModal(false)}>Cancel</button>
                <button type="submit" form="branch-form" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner spinner-sm spinner-white" /> : null}
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
