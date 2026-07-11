import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Loader, ArrowRight, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@venderra.ug');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 relative bg-[#0f172a] overflow-hidden">
        {/* Ambient gradients */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-400/[0.05] blur-[100px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-14 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center">
              <span className="text-white font-extrabold text-lg">V</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Venderra</span>
          </div>

          {/* Hero */}
          <div className="max-w-lg">
            <h1 className="text-[42px] xl:text-[48px] font-bold text-white leading-[1.1] tracking-tight mb-5">
              Run your business<br />
              <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">with confidence</span>
            </h1>
            <p className="text-[15px] text-white/45 leading-relaxed mb-10 max-w-md">
              The complete POS platform for retail, supermarkets, and pharmacies across Uganda. Sell offline, manage stock, track everything.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                'Works offline — never stop selling',
                'Real-time stock across all branches',
                'MTN MoMo, Airtel Money & card payments',
                'PDF receipts, invoices & report exports',
                'SMS & WhatsApp daily summaries',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-400/10 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-teal-400" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-white/50">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Venderra Technologies</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/20">
              <span className="text-white font-extrabold text-base">V</span>
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">Venderra</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[26px] font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-400 mt-1.5">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all duration-200"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-semibold text-slate-600">Password</label>
                <Link to="/forgot-password" className="text-[12px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all duration-200"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[12px] text-slate-400 text-center">
              Demo login: <span className="font-mono font-semibold text-slate-500">admin@venderra.ug</span> <span className="text-slate-300">/</span> <span className="font-mono font-semibold text-slate-500">admin123</span>
            </p>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-slate-400 mt-6">
            New to Venderra?{' '}
            <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
