import { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import {
  Plus, X, Pencil, Search, Clock, LogIn, LogOut, Users,
  Key, TrendingUp, DollarSign, UserX, UserCheck, Briefcase,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ROLE_BADGE = {
  owner:       'badge-indigo',
  admin:       'badge-blue',
  manager:     'badge-amber',
  cashier:     'badge-gray',
  field_sales: 'badge-green',
  viewer:      'badge-gray',
};

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(n || 0);
}

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPerformance, setShowPerformance] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'cashier', branchId: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '' });
  const [branches, setBranches] = useState([]);
  const [perfData, setPerfData] = useState(null);
  const [perfPeriod, setPerfPeriod] = useState('today');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get('/employees').then(res => setEmployees(res.data));
    api.get('/auth/branches').then(res => setBranches(res.data));
  };

  const filtered = employees.filter(e => {
    const term = search.toLowerCase();
    return !term || e.first_name?.toLowerCase().includes(term) || e.last_name?.toLowerCase().includes(term) || e.email?.toLowerCase().includes(term);
  });

  const activeCount    = employees.filter(e => e.is_active).length;
  const clockedIn      = employees.filter(e => e.currently_clocked_in).length;
  const todayRevenue   = employees.reduce((sum, e) => sum + (parseFloat(e.today_revenue) || 0), 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'cashier', branchId: user?.branchId || '' });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({ firstName: emp.first_name, lastName: emp.last_name, email: emp.email, password: '', phone: emp.phone || '', role: emp.role, branchId: emp.branch_id || '' });
    setShowModal(true);
  };

  const openPasswordReset = (emp) => { setEditing(emp); setPasswordForm({ newPassword: '' }); setShowPasswordModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone || undefined, role: form.role, branchId: form.branchId || undefined };
      if (!editing && form.password) payload.password = form.password;
      if (editing) { await api.put(`/employees/${editing.id}`, payload); }
      else { await api.post('/employees', { ...payload, password: form.password }); }
      setShowModal(false);
      showToast(editing ? 'Employee updated' : 'Employee created');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/employees/${editing.id}/reset-password`, passwordForm);
      setShowPasswordModal(false);
      showToast('Password reset successfully');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reset password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (emp) => {
    try {
      await api.put(`/employees/${emp.id}`, {
        firstName: emp.first_name, lastName: emp.last_name, phone: emp.phone,
        role: emp.role, branchId: emp.branch_id, isActive: !emp.is_active,
      });
      showToast(emp.is_active ? `${emp.first_name} deactivated` : `${emp.first_name} reactivated`);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update employee', 'error');
    }
  };

  const loadPerformance = async (empId) => {
    try {
      const res = await api.get(`/employees/${empId}/performance?period=${perfPeriod}`);
      setPerfData(res.data);
    } catch {}
  };

  const openPerformance = (emp) => { setShowPerformance(emp); setPerfPeriod('today'); };
  useEffect(() => { if (showPerformance) loadPerformance(showPerformance.id); }, [showPerformance, perfPeriod]);

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage staff, attendance, and performance</p>
        </div>
        {['owner', 'admin'].includes(user?.role) && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Employee
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees',    value: employees.length, icon: Users,     iconBg: 'bg-blue-50',   iconColor: 'text-blue-600' },
          { label: 'Active',             value: activeCount,      icon: UserCheck, iconBg: 'bg-green-50',  iconColor: 'text-green-600' },
          { label: 'Clocked In Today',   value: clockedIn,        icon: Clock,     iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
          { label: "Today's Revenue",    value: fmtCurrency(todayRevenue), icon: DollarSign, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${s.iconBg}`}>
              <s.icon size={18} className={s.iconColor} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 tabular-nums leading-none">{s.value}</p>
              <p className="text-[12px] text-gray-400 font-light mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-md w-fit">
        {[{ key: 'overview', label: 'Employees' }, { key: 'attendance', label: 'Attendance' }].map(t => (
          <button
            key={t.key}
            className={`px-4 py-1.5 rounded text-[13px] font-medium transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input className="input input-icon-left" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Today</th>
                  <th>This Week</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[13px] text-gray-700">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[11px] text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[emp.role] ?? 'badge-gray'} capitalize`}>
                        {emp.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-gray-600">{emp.branch_name || '—'}</td>
                    <td>
                      <span className="font-medium text-[13px] text-gray-800">{emp.today_sales_count || 0}</span>
                      <span className="text-gray-400 text-[12px] ml-1">sales</span>
                      <p className="text-[11px] text-gray-500 tabular-nums">{fmtCurrency(emp.today_revenue)}</p>
                    </td>
                    <td className="tabular-nums font-medium text-gray-900">{fmtCurrency(emp.week_revenue)}</td>
                    <td>
                      {emp.currently_clocked_in ? (
                        <span className="badge badge-green">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          On Shift
                        </span>
                      ) : emp.is_active ? (
                        <span className="badge badge-gray">Off Shift</span>
                      ) : (
                        <span className="badge badge-red">Inactive</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn btn-ghost btn-sm p-1.5" onClick={() => openPerformance(emp)} title="Performance">
                          <TrendingUp size={14} />
                        </button>
                        {['owner', 'admin'].includes(user?.role) && (
                          <>
                            <button className="btn btn-ghost btn-sm p-1.5" onClick={() => openPasswordReset(emp)} title="Reset Password">
                              <Key size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm p-1.5" onClick={() => openEdit(emp)} title="Edit">
                              <Pencil size={14} />
                            </button>
                            {emp.role !== 'owner' && (
                              <button
                                className={`btn btn-ghost btn-sm p-1.5 ${emp.is_active ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-green-500 hover:bg-green-50 hover:text-green-600'}`}
                                onClick={() => handleToggleActive(emp)}
                                title={emp.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {emp.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <Users size={32} className="text-gray-200" />
                        <p>No employees found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && <AttendanceTab />}

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Briefcase size={15} /> {editing ? 'Edit Employee' : 'Add Employee'}
              </h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form id="employee-form" onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">First Name *</label>
                    <input className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Last Name *</label>
                    <input className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required disabled={!!editing} />
                </div>
                <div>
                  <label className="form-label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input className="input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} {...(!editing && { required: true })} minLength={6} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+256 700 000000" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Role *</label>
                    <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})} required>
                      <option value="cashier">Cashier</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="field_sales">Field Sales</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Branch</label>
                    <select className="input" value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})}>
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="employee-form" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : null}
                  {editing ? 'Update' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2"><Key size={15} /> Reset Password</h3>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => setShowPasswordModal(false)}><X size={16} /></button>
            </div>
            <form id="password-form" onSubmit={handlePasswordReset}>
              <div className="modal-body space-y-4">
                <p className="text-[13px] text-gray-500">
                  Set a new password for <strong className="text-gray-700">{editing?.first_name} {editing?.last_name}</strong>
                </p>
                <div>
                  <label className="form-label">New Password *</label>
                  <input className="input" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ newPassword: e.target.value })} required minLength={6} placeholder="At least 6 characters" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" form="password-form" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : null}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {showPerformance && (
        <div className="modal-overlay" onClick={() => { setShowPerformance(null); setPerfData(null); }}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-[12px] font-bold">
                  {showPerformance.first_name?.[0]}{showPerformance.last_name?.[0]}
                </div>
                <div>
                  <h3 className="modal-title">{showPerformance.first_name} {showPerformance.last_name}</h3>
                  <p className="text-[12px] text-gray-400 capitalize mt-0.5">{showPerformance.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm p-1" onClick={() => { setShowPerformance(null); setPerfData(null); }}><X size={16} /></button>
            </div>
            <div className="modal-body space-y-5">
              <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-md w-fit">
                {[{ k: 'today', l: 'Today' }, { k: 'week', l: 'This Week' }, { k: 'month', l: 'This Month' }].map(p => (
                  <button
                    key={p.k}
                    className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${perfPeriod === p.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setPerfPeriod(p.k)}
                  >
                    {p.l}
                  </button>
                ))}
              </div>

              {perfData && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Sales',   value: perfData.salesStats.total_sales },
                      { label: 'Revenue', value: fmtCurrency(perfData.salesStats.total_revenue) },
                      { label: 'Avg Sale',value: fmtCurrency(perfData.salesStats.avg_sale) },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-md p-4 text-center">
                        <p className="text-lg font-semibold text-gray-900 tabular-nums">{s.value}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {perfData.topProducts.length > 0 && (
                    <div>
                      <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Top Products</p>
                      <div className="space-y-1">
                        {perfData.topProducts.map(p => (
                          <div key={p.product_name} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md text-[13px]">
                            <span className="text-gray-600">{p.product_name}</span>
                            <div className="text-right">
                              <span className="font-medium text-gray-800">{p.qty_sold} units</span>
                              <span className="text-gray-400 ml-2">{fmtCurrency(p.revenue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {perfData.paymentMethods.length > 0 && (
                    <div>
                      <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Payment Methods</p>
                      <div className="flex flex-wrap gap-2">
                        {perfData.paymentMethods.map(pm => (
                          <span key={pm.payment_method} className="badge badge-blue">
                            {pm.payment_method?.replace('_', ' ')}: {pm.count} ({fmtCurrency(pm.total)})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {perfData.attendance.length > 0 && (
                    <div>
                      <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Hours Worked</p>
                      <div className="space-y-1">
                        {perfData.attendance.map(a => (
                          <div key={a.date} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md text-[13px]">
                            <span className="text-gray-600">{new Date(a.date).toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span className="font-medium text-gray-800">{Number(a.hours).toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceTab() {
  const [records, setRecords] = useState([]);
  const [toast, setToast] = useState(null);
  const { user } = useAuth();

  useEffect(() => { load(); }, []);

  const load = () => { api.get('/employees/attendance/today').then(res => setRecords(res.data)); };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const amIClockedIn = records.some(r => r.user_id === user?.id && !r.clock_out);

  const handleClockIn = async () => {
    try { await api.post('/employees/clock-in'); load(); showToast('Clocked in successfully'); }
    catch (err) { showToast(err.response?.data?.error || 'Failed to clock in', 'error'); }
  };

  const handleClockOut = async () => {
    try {
      const res = await api.post('/employees/clock-out');
      load();
      showToast(`Clocked out — ${res.data.hoursWorked}h worked`);
    }
    catch (err) { showToast(err.response?.data?.error || 'Failed to clock out', 'error'); }
  };

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[600] flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium border animate-slide-up ${
          toast.type === 'error' ? 'alert alert-error' : 'alert alert-success'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          {toast.message}
        </div>
      )}
      {/* Clock in/out */}
      <div className="card p-5">
        <p className="text-[13px] font-medium text-gray-700 mb-3">Your shift</p>
        <div className="flex items-center gap-3">
          {amIClockedIn ? (
            <>
              <span className="badge badge-green">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                You are on shift
              </span>
              <button className="btn btn-danger" onClick={handleClockOut}>
                <LogOut size={14} /> Clock Out
              </button>
            </>
          ) : (
            <>
              <span className="badge badge-gray"><Clock size={11} /> Not on shift</span>
              <button className="btn btn-primary" onClick={handleClockIn}>
                <LogIn size={14} /> Clock In
              </button>
            </>
          )}
        </div>
      </div>

      {/* Today's attendance */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="card-title">Today's Attendance</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td className="font-medium text-gray-700">{r.first_name} {r.last_name}</td>
                  <td className="tabular-nums text-gray-600">{new Date(r.clock_in).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="tabular-nums text-gray-600">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="tabular-nums font-medium text-gray-900">{Number(r.hours_worked).toFixed(1)}h</td>
                  <td>
                    {r.clock_out ? (
                      <span className="badge badge-gray">Complete</span>
                    ) : (
                      <span className="badge badge-green">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        On Shift
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!records.length && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <Clock size={32} className="text-gray-200" />
                        <p>No attendance records today</p>
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
