import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight, Mail, Lock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  'Works fully offline — never stop selling',
  'Real-time stock across all branches',
  'MTN MoMo, Airtel Money & card payments',
  'PDF receipts, invoices & Excel exports',
  'SMS & WhatsApp daily summaries',
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[44%] xl:w-[46%] bg-[#09090b] flex-col justify-between p-12 xl:p-16 shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm leading-none">V</span>
          </div>
          <div>
            <span className="text-white font-semibold text-[14px] tracking-tight leading-none">Venderra</span>
            <p className="text-[10px] text-white/30 mt-0.5">POS Platform</p>
          </div>
        </div>

        {/* Headline */}
        <div className="max-w-sm">
          <h1 className="text-[38px] xl:text-[44px] font-semibold text-white leading-[1.15] tracking-tight mb-4">
            Run your business<br />
            <span className="text-blue-400">with confidence.</span>
          </h1>
          <p className="text-[13px] text-white/40 leading-relaxed font-light mb-8">
            The complete POS platform for retail, supermarkets, and pharmacies across Uganda and beyond.
          </p>

          <ul className="space-y-2.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border border-blue-400/40 bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Check size={9} className="text-blue-400" strokeWidth={3} />
                </div>
                <span className="text-[13px] text-white/50">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-white/20">&copy; {new Date().getFullYear()} Venderra Technologies</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-semibold text-gray-800 text-[15px] tracking-tight">Venderra</span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Welcome back</h2>
          <p className="text-sm text-gray-400 font-light mt-1 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="alert alert-error mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="form-label">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="input input-icon-left"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-[5px]">
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-icon-left"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full justify-center mt-2"
            >
              {loading ? (
                <span className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-400 mt-6">
            New to Venderra?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
