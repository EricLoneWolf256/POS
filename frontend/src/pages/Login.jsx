import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Loader, ArrowRight } from 'lucide-react';
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

  const features = [
    'Works offline during connectivity outages',
    'Real-time stock management',
    'Multi-branch support',
    'SMS & WhatsApp daily summaries',
    'Local currency (UGX) support',
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-between p-12 text-white overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <span className="text-white font-bold text-base">V</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Venderra</h1>
          </div>
          <span className="text-xs font-medium text-white/40 tracking-widest uppercase ml-[52px]">POS Software</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-[44px] font-bold leading-[1.1] mb-5 tracking-tight">
            Uganda's most trusted<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-400">POS platform</span>
          </h2>
          <p className="text-lg text-white/60 max-w-md leading-relaxed mb-10">
            Built for retail, supermarkets, pharmacies, and more. Powerful features, offline-first design.
          </p>
          <div className="flex flex-col gap-3.5">
            {features.map((f, i) => (
              <div key={f} className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-teal-400" />
                </div>
                <span className="text-[15px] text-white/70">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs">
          &copy; 2026 Venderra Technologies. All rights reserved.
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-[500px] bg-white flex items-center justify-center p-12 animate-fade-in">
        <div className="w-full max-w-[360px]">
          <h2 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Welcome back</h2>
          <p className="text-slate-400 mb-8 text-[15px]">Sign in to your Venderra account</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200/60 rounded-xl text-red-600 text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email address</label>
              <input
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 placeholder:text-slate-400"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-semibold text-slate-600">Password</label>
                <Link to="/forgot-password" className="text-[12px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">Forgot password?</Link>
              </div>
              <input
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 placeholder:text-slate-400"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">
              Demo credentials: <span className="font-mono font-medium text-slate-500">admin@venderra.ug</span> / <span className="font-mono font-medium text-slate-500">admin123</span>
            </p>
            <p className="text-xs text-slate-400 text-center">
              Don't have an account? <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">Start free trial</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
