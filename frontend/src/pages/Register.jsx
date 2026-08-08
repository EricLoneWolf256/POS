import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, User, Mail, Lock, Phone, MapPin, Check } from 'lucide-react';

const PERKS = [
  'Full access to all features — no limits',
  'Works offline — never stop selling',
  'Multi-branch, manufacturing & field sales',
  'UGX local pricing & dedicated support',
];

export default function Register() {
  const [form, setForm] = useState({
    businessName: '',
    businessPhone: '',
    businessCity: 'Kampala',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: 'enterprise' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('venderra_token', data.token);
      localStorage.setItem('venderra_user', JSON.stringify(data.user));
      window.location.href = '/app';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[42%] xl:w-[46%] bg-[#09090b] flex-col justify-between p-12 xl:p-16 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
            <span className="text-white font-medium text-sm leading-none">V</span>
          </div>
          <div>
            <span className="text-white font-medium text-[14px] tracking-tight leading-none">Venderra</span>
            <p className="text-[10px] text-white/30 mt-0.5">POS Platform</p>
          </div>
        </div>

        <div className="max-w-sm">
          <h1 className="text-[38px] xl:text-[44px] font-semibold text-white leading-[1.15] tracking-tight mb-4">
            Start growing your<br />
            <span className="text-blue-400">business today.</span>
          </h1>
          <p className="text-[13px] text-white/40 font-light leading-relaxed mb-8">
            Join businesses across Uganda using Venderra to manage sales, inventory, staff, and growth — all from one platform.
          </p>
          <ul className="space-y-2.5">
            {PERKS.map(p => (
              <li key={p} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border border-blue-400/40 bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Check size={9} className="text-blue-400" strokeWidth={3} />
                </div>
                <span className="text-[13px] text-white/50 font-light">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-white/20 font-light">&copy; {new Date().getFullYear()} Venderra Technologies</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10 sm:px-10 overflow-y-auto">
        <div className="w-full max-w-[440px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center">
              <span className="text-white font-medium text-sm">V</span>
            </div>
            <span className="font-medium text-gray-800 text-[15px]">Venderra</span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">Create your account</h2>
          <p className="text-sm text-gray-400 font-light mb-7">Get started with Venderra POS — no credit card required.</p>

          {error && <div className="alert alert-error mb-5">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Business name */}
            <div>
              <label className="form-label">Business name</label>
              <div className="relative">
                <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  className="input input-icon-left"
                  placeholder="e.g. Kampala Supermarket"
                  value={form.businessName}
                  onChange={e => set('businessName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone + City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                  <input
                    className="input input-icon-left"
                    placeholder="0700000000"
                    value={form.businessPhone}
                    onChange={e => set('businessPhone', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">City</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                  <input
                    className="input input-icon-left"
                    value={form.businessCity}
                    onChange={e => set('businessCity', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="divider" />

            {/* First + Last */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">First name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                  <input
                    className="input input-icon-left"
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Last name</label>
                <input
                  className="input"
                  value={form.lastName}
                  onChange={e => set('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  type="email"
                  className="input input-icon-left"
                  placeholder="you@business.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  type="password"
                  className="input input-icon-left"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full justify-center mt-1"
            >
              {loading ? <span className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-400 font-light mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
