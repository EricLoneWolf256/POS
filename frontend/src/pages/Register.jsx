import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, Phone, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const plans = [
  { id: 'starter', name: 'Starter', price: '1,200,000', desc: 'Small shops & startups', features: ['POS & Sales', 'Stock Management', 'Up to 500 products', '3 staff users', 'Offline mode'] },
  { id: 'premium', name: 'Premium', price: '1,800,000', desc: 'Growing businesses', features: ['Everything in Starter', 'Unlimited products & users', 'Quotations & invoices', 'SMS center', 'Staff performance'], popular: true },
  { id: 'enterprise', name: 'Enterprise', price: '2,500,000', desc: 'Manufacturers & distributors', features: ['Everything in Premium', 'Manufacturing module', 'Field sales app', 'Multi-branch', 'Priority support'] },
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [form, setForm] = useState({ businessName: '', businessPhone: '', businessCity: 'Kampala', firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('venderra_token', data.token);
      localStorage.setItem('venderra_user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-emerald-600 flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">V</span>
            </div>
            <span className="text-white/90 font-bold text-lg tracking-tight">Venderra POS</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">Start growing your business today</h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-md mb-10">Join thousands of Ugandan businesses using Venderra to manage sales, inventory, and growth — all from one platform.</p>
          <div className="space-y-4">
            {['Free 14-day trial on all plans', 'No credit card required to start', 'Ugx local pricing & support'].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 size={18} className="text-emerald-200 shrink-0" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="font-bold text-slate-800">Venderra</span>
          </div>

          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Choose your plan</h2>
              <p className="text-slate-500 text-sm mb-6">All plans include a 14-day free trial</p>
              <div className="space-y-3 mb-6">
                {plans.map(p => (
                  <button key={p.id} onClick={() => setSelectedPlan(p.id)} className={`w-full text-left p-5 rounded-xl border-2 transition-all ${selectedPlan === p.id ? 'border-teal-500 bg-teal-50/50 shadow-lg shadow-teal-500/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === p.id ? 'border-teal-500' : 'border-slate-300'}`}>
                          {selectedPlan === p.id && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{p.name}</span>
                            {p.popular && <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">BEST VALUE</span>}
                          </div>
                          <p className="text-xs text-slate-400">{p.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">UGX {p.price}</div>
                        <div className="text-[11px] text-slate-400">/year</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all active:scale-[0.98]">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleRegister} className="animate-fade-in">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">&larr; Change plan</button>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Create your account</h2>
              <p className="text-slate-500 text-sm mb-6">Selected: <span className="font-semibold text-teal-600 capitalize">{selectedPlan}</span> plan (UGX {plans.find(p => p.id === selectedPlan)?.price}/year)</p>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>}

              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Business Name *</label>
                <div className="relative">
                  <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value})} required placeholder="e.g. Kampala Supermarket" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Business Phone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" value={form.businessPhone} onChange={e => setForm({...form, businessPhone: e.target.value})} placeholder="0700000000" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">City</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" value={form.businessCity} onChange={e => setForm({...form, businessCity: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-200 my-5" />

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">First Name *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Last Name *</label>
                  <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="you@business.com" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} placeholder="At least 6 characters" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating account...' : 'Start Free Trial'}
              </button>

              <p className="text-center text-sm text-slate-500 mt-4">
                Already have an account? <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
