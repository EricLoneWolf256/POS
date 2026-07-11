import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ScanLine, Wifi, WifiOff, BarChart3, Users, Shield, Zap, Smartphone, Globe } from 'lucide-react';

const features = [
  { icon: ScanLine, title: 'Barcode POS', desc: 'Scan products instantly, manage stock in real-time, process sales in seconds.' },
  { icon: WifiOff, title: 'Works Offline', desc: 'Never stop selling — works perfectly during internet outages, syncs automatically.' },
  { icon: BarChart3, title: 'Smart Reports', desc: 'P&L, inventory valuation, staff performance — all the insights you need.' },
  { icon: Users, title: 'Multi-Branch', desc: 'Manage multiple locations from one dashboard. Transfer stock between branches.' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Owner, admin, manager, cashier — each role gets the right permissions.' },
  { icon: Smartphone, title: 'Mobile Money', desc: 'Accept MTN MoMo, Airtel Money, cash, card, bank transfer, and credit.' },
];

const plans = [
  { name: 'Starter', price: '1,200,000', desc: 'Small shops & startups', features: ['POS & Sales', 'Stock Management', '500 products', '3 users', 'Offline mode'] },
  { name: 'Premium', price: '1,800,000', desc: 'Growing businesses', features: ['Unlimited products', 'Unlimited users', 'Quotations & invoices', 'SMS center', 'Staff reports'], popular: true },
  { name: 'Enterprise', price: '2,500,000', desc: 'Manufacturers & distributors', features: ['Manufacturing module', 'Field sales app', 'Multi-branch', 'Priority support', 'Dedicated account'] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 lg:px-12 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-white font-bold text-base">V</span>
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">Venderra</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Sign in</Link>
          <Link to="/register" className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all active:scale-[0.98]">Start Free Trial</Link>
        </div>
      </nav>

      <section className="relative px-6 lg:px-12 py-20 lg:py-32 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-3xl opacity-40" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold mb-6 ring-1 ring-teal-200/60">
            <Zap size={13} /> Uganda's most trusted POS platform
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
            The POS system built for <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">African businesses</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage sales, inventory, staff, and finances from one powerful platform — that works perfectly offline. Designed for supermarkets, pharmacies, wholesale shops, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold text-base shadow-xl shadow-teal-500/25 hover:shadow-2xl hover:from-teal-700 hover:to-emerald-700 transition-all active:scale-[0.98]">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <span className="text-sm text-slate-400">14 days free &bull; No credit card required</span>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Everything you need to run your business</h2>
            <p className="text-slate-500 max-w-xl mx-auto">One platform to manage sales, stock, staff, finances, and more — from anywhere.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal-200/60 transition-all group">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                  <f.icon size={20} className="text-teal-600" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Simple, transparent pricing</h2>
            <p className="text-slate-500">All plans include a 14-day free trial. Pay in UGX. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((p, i) => (
              <div key={i} className={`relative p-6 rounded-2xl border-2 transition-all ${p.popular ? 'border-teal-500 shadow-xl shadow-teal-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Most Popular</div>}
                <h3 className="font-bold text-slate-800 text-lg">{p.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{p.desc}</p>
                <div className="mb-5">
                  <span className="text-3xl font-black text-slate-800">UGX {p.price}</span>
                  <span className="text-sm text-slate-400">/year</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={15} className="text-teal-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to={`/register?plan=${p.name.toLowerCase()}`} className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${p.popular ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-10 bg-slate-900 text-slate-400 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            <span className="font-semibold text-white">Venderra</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Venderra POS. All rights reserved.</p>
          <div className="flex gap-5">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
