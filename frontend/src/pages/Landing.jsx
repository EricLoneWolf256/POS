import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, ScanLine, WifiOff, BarChart3, Users, Shield,
  Zap, Smartphone, FileText, MessageSquare, Globe2, Factory, Truck,
  TrendingUp, Package, CreditCard, Building2, UserCog, Receipt
} from 'lucide-react';

const features = [
  { icon: ScanLine,     title: 'Barcode POS',         desc: 'Scan products instantly, manage stock in real-time, process sales in seconds.' },
  { icon: WifiOff,      title: 'Works Offline',        desc: 'Never stop selling — works perfectly during internet outages, syncs automatically.' },
  { icon: Package,      title: 'Stock Management',     desc: 'Real-time tracking, low-stock alerts, movement history, and barcode generation.' },
  { icon: BarChart3,    title: 'Smart Reports',        desc: 'P&L, inventory valuation, staff performance — all the insights you need.' },
  { icon: Building2,    title: 'Multi-Branch',         desc: 'Manage multiple locations from one dashboard. Transfer stock between branches.' },
  { icon: Shield,       title: 'Role-Based Access',    desc: 'Owner, admin, manager, cashier — each role gets the right permissions.' },
  { icon: Smartphone,   title: 'Mobile Money',         desc: 'Accept MTN MoMo, Airtel Money, cash, card, bank transfer, and credit.' },
  { icon: FileText,     title: 'Quotations & Invoices',desc: 'Create professional quotes and invoices, convert them to sales with one click.' },
  { icon: ScanLine,     title: 'Label & Barcode Gen',  desc: 'Generate and print barcodes and shelf labels for all your products.' },
  { icon: MessageSquare,title: 'SMS Center',           desc: 'Send automated SMS summaries, low-stock alerts, and customer notifications.' },
  { icon: Globe2,       title: 'Multi-Currency',       desc: 'Sell in UGX, USD, KES, or any currency — with live exchange rate support.' },
  { icon: TrendingUp,   title: 'Accounting',           desc: 'Full P&L, balance sheet, and cash flow statements built right in.' },
  { icon: UserCog,      title: 'Staff Performance',    desc: 'Track cashier sales, attendance, and productivity with detailed reports.' },
  { icon: Factory,      title: 'Manufacturing',        desc: 'Manage raw materials, bills of materials, production orders, and cost calculation.' },
  { icon: Truck,        title: 'Field Sales',          desc: 'Mobile app support for field agents — stock issuance, expense tracking, and performance reports.' },
  { icon: Users,        title: 'Customer & Credit',    desc: 'Purchase history, credit limits, and a full CRM for your loyal customers.' },
  { icon: Receipt,      title: 'Purchases & Expenses', desc: 'Supplier management, purchase orders, and expense tracking in one place.' },
  { icon: CreditCard,   title: 'PDF Receipts',         desc: 'Print or email professional PDF receipts and export reports to Excel or CSV.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-white font-bold text-base">V</span>
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">Venderra</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Sign in</Link>
          <Link to="/register" className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all active:scale-[0.98]">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 lg:px-12 py-20 lg:py-32 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-amber-50 rounded-full blur-3xl opacity-40" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold mb-6 ring-1 ring-orange-200/60">
            <Zap size={13} /> Uganda's most trusted POS platform
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
            The POS system built for{' '}
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              African businesses
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage sales, inventory, staff, and finances from one powerful platform — that works perfectly offline.
            Designed for supermarkets, pharmacies, wholesale shops, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold text-base shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:from-orange-700 hover:to-amber-700 transition-all active:scale-[0.98]"
            >
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Everything you need to run your business</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              One platform to manage sales, stock, staff, finances, field agents, and manufacturing — from anywhere.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-orange-200/60 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                  <f.icon size={20} className="text-orange-600" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 text-orange-400 rounded-full text-xs font-semibold mb-6 ring-1 ring-orange-500/20">
              <CheckCircle2 size={13} /> Trusted by businesses across Uganda
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to grow your business?
            </h2>
            <p className="text-white/50 mb-8 max-w-xl mx-auto text-[15px] leading-relaxed">
              Join retail shops, supermarkets, pharmacies, and wholesale businesses using Venderra to sell smarter and manage everything in one place.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-base shadow-xl shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 transition-all active:scale-[0.98]"
            >
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-10 bg-slate-900 text-slate-400 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
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
