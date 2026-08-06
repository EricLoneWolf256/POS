import { useState, useEffect } from 'react';
import {
  Plus, X, Edit2, Search, Clock, LogIn, LogOut, Users, Key,
  TrendingUp, DollarSign, ChevronDown, Eye, Shield, UserX, UserCheck, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const roleColors = {
  owner: 'bg-purple-50 text-purple-600 ring-1 ring-purple-100/50',
  admin: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100/50',
  manager: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50',
  cashier: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50',
  field_sales: 'bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100/50',
  viewer: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/50',
};

const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200";

function formatCurrency(n) {
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

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get('/employees').then(res => setEmployees(res.data));
    api.get('/auth/branches').then(res => setBranches(res.data));
  };

  const filtered = employees.filter(e => {
    const term = search.toLowerCase();
    return !term || e.first_name?.toLowerCase().includes(term) || e.last_name?.toLowerCase().includes(term) || e.email?.toLowerCase().includes(term);
  });

  const activeCount = employees.filter(e => e.is_active).length;
  const clockedIn = employees.filter(e => e.currently_clocked_in).length;
  const todayRevenue = employees.reduce((sum, e) => sum + (parseFloat(e.today_revenue) || 0), 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'cashier', branchId: user?.branchId || '' });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      firstName: emp.first_name,
      lastName: emp.last_name,
      email: emp.email,
      password: '',
      phone: emp.phone || '',
      role: emp.role,
      branchId: emp.branch_id || '',
    });
    setShowModal(true);
  };

  const openPasswordReset = (emp) => {
    setEditing(emp);
    setPasswordForm({ newPassword: '' });
    setShowPasswordModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        branchId: form.branchId || undefined,
      };
      if (!editing && form.password) payload.password = form.password;

      if (editing) {
        await api.put(`/employees/${editing.id}`, payload);
      } else {
        await api.post('/employees', { ...payload, password: form.password });
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save employee');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/employees/${editing.id}/reset-password`, passwordForm);
      setShowPasswordModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleToggleActive = async (emp) => {
    try {
      await api.put(`/employees/${emp.id}`, {
        firstName: emp.first_name,
        lastName: emp.last_name,
        phone: emp.phone,
        role: emp.role,
        branchId: emp.branch_id,
        isActive: !emp.is_active,
      });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update employee');
    }
  };

  const loadPerformance = async (empId) => {
    try {
      const res = await api.get(`/employees/${empId}/performance?period=${perfPeriod}`);
      setPerfData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openPerformance = (emp) => {
    setShowPerformance(emp);
    setPerfPeriod('today');
  };

  useEffect(() => {
    if (showPerformance) loadPerformance(showPerformance.id);
  }, [showPerformance, perfPeriod]);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Employee Management</h1>
        {['owner', 'admin'].includes(user?.role) && (
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]">
            <Plus size={16} /> Add Employee
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Employees', value: employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: activeCount, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Clocked In Today', value: clockedIn, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm shadow-slate-200/50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight text-slate-800">{s.value}</div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {['overview', 'attendance'].map(t => (
          <button key={t} className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Employees' : 'Attendance'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all" placeholder="Search employees by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">This Week</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[11px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${roleColors[emp.role] || roleColors.viewer}`}>{emp.role.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{emp.branch_name || '—'}</td>
                    <td className="py-3.5 px-5">
                      <div className="text-sm">
                        <span className="font-semibold text-slate-800">{emp.today_sales_count || 0}</span>
                        <span className="text-slate-400 ml-1">sales</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{formatCurrency(emp.today_revenue)}</div>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">{formatCurrency(emp.week_revenue)}</td>
                    <td className="py-3.5 px-5">
                      {emp.currently_clocked_in ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold ring-1 ring-amber-100/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          On Shift
                        </span>
                      ) : emp.is_active ? (
                        <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold">Off Shift</span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-semibold">Inactive</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openPerformance(emp)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Performance">
                          <TrendingUp size={15} />
                        </button>
                        {['owner', 'admin'].includes(user?.role) && (
                          <>
                            <button onClick={() => openPasswordReset(emp)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Reset Password">
                              <Key size={15} />
                            </button>
                            <button onClick={() => openEdit(emp)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                              <Edit2 size={15} />
                            </button>
                            {emp.role !== 'owner' && (
                              <button onClick={() => handleToggleActive(emp)} className={`p-2 rounded-lg transition-all ${emp.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} title={emp.is_active ? 'Deactivate' : 'Activate'}>
                                {emp.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && <AttendanceTab />}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[500px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2"><Briefcase size={20} /> {editing ? 'Edit Employee' : 'Add Employee'}</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">First Name *</label>
                  <input className={inputClass} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Last Name *</label>
                  <input className={inputClass} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email *</label>
                <input className={inputClass} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required disabled={!!editing} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input className={inputClass} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} {...(!editing && { required: true })} minLength={6} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phone</label>
                <input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+256 700 000000" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Role *</label>
                  <select className={inputClass} value={form.role} onChange={e => setForm({...form, role: e.target.value})} required>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="field_sales">Field Sales</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Branch</label>
                  <select className={inputClass} value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})}>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[0.98]">
                  {editing ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[400px] shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2"><Key size={20} /> Reset Password</h3>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => setShowPasswordModal(false)}><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Set a new password for <strong>{editing?.first_name} {editing?.last_name}</strong></p>
            <form onSubmit={handlePasswordReset}>
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">New Password *</label>
                <input className={inputClass} type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({newPassword: e.target.value})} required minLength={6} placeholder="At least 6 characters" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 transition-all active:scale-[0.98]">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPerformance && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in" onClick={() => { setShowPerformance(null); setPerfData(null); }}>
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[600px] max-h-[85vh] overflow-y-auto shadow-2xl shadow-slate-900/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold">
                  {showPerformance.first_name?.[0]}{showPerformance.last_name?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-800">{showPerformance.first_name} {showPerformance.last_name}</h3>
                  <p className="text-sm text-slate-400 capitalize">{showPerformance.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" onClick={() => { setShowPerformance(null); setPerfData(null); }}><X size={18} /></button>
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
              {['today', 'week', 'month'].map(p => (
                <button key={p} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${perfPeriod === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setPerfPeriod(p)}>
                  {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>

            {perfData && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50/80 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-slate-800">{perfData.salesStats.total_sales}</div>
                    <div className="text-[11px] text-slate-400 font-medium uppercase">Sales</div>
                  </div>
                  <div className="bg-slate-50/80 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-orange-600">{formatCurrency(perfData.salesStats.total_revenue)}</div>
                    <div className="text-[11px] text-slate-400 font-medium uppercase">Revenue</div>
                  </div>
                  <div className="bg-slate-50/80 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-slate-800">{formatCurrency(perfData.salesStats.avg_sale)}</div>
                    <div className="text-[11px] text-slate-400 font-medium uppercase">Avg Sale</div>
                  </div>
                </div>

                {perfData.topProducts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Top Products Sold</h4>
                    <div className="space-y-1.5">
                      {perfData.topProducts.map(p => (
                        <div key={p.product_name} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-600">{p.product_name}</span>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-slate-800">{p.qty_sold} units</span>
                            <span className="text-[11px] text-slate-400 ml-2">{formatCurrency(p.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {perfData.paymentMethods.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Payment Methods</h4>
                    <div className="flex gap-2 flex-wrap">
                      {perfData.paymentMethods.map(pm => (
                        <span key={pm.payment_method} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-600">
                          {pm.payment_method?.replace('_', ' ')}: {pm.count} ({formatCurrency(pm.total)})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {perfData.attendance.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Hours Worked</h4>
                    <div className="space-y-1">
                      {perfData.attendance.map(a => (
                        <div key={a.date} className="flex justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                          <span className="text-slate-600">{new Date(a.date).toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          <span className="font-semibold text-slate-800">{Number(a.hours).toFixed(1)}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceTab() {
  const [records, setRecords] = useState([]);
  const [myAttendance, setMyAttendance] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    api.get('/employees/attendance/today').then(res => setRecords(res.data));
    api.get('/auth/me').then(res => {
      setMyAttendance(res.data);
    });
  };

  const handleClockIn = async () => {
    try {
      await api.post('/employees/clock-in');
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await api.post('/employees/clock-out');
      alert(`Clocked out. Hours worked: ${res.data.hoursWorked}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clock out');
    }
  };

  const amIClockedIn = records.some(r => r.user_id === user?.id && !r.clock_out);

  return (
    <div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/50 mb-6">
        <h3 className="text-base font-semibold tracking-tight text-slate-800 mb-4">Clock In / Out</h3>
        <div className="flex items-center gap-4">
          {amIClockedIn ? (
            <>
              <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-sm font-semibold ring-1 ring-amber-200/50">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                You are on shift
              </span>
              <button onClick={handleClockOut} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-rose-600 transition-all active:scale-[0.98]">
                <LogOut size={16} /> Clock Out
              </button>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm font-semibold">
                <Clock size={16} /> Not on shift
              </span>
              <button onClick={handleClockIn} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-700 hover:to-amber-700 transition-all active:scale-[0.98]">
                <LogIn size={16} /> Clock In
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-base font-semibold tracking-tight text-slate-800">Today's Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clock In</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clock Out</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hours</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{r.first_name} {r.last_name}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-600">{new Date(r.clock_in).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-3.5 px-5 text-sm text-slate-600">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">{Number(r.hours_worked).toFixed(1)}h</td>
                  <td className="py-3.5 px-5">
                    {r.clock_out ? (
                      <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold">Complete</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold ring-1 ring-amber-100/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        On Shift
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">No attendance records today</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
