import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, ScanLine, WifiOff, BarChart3, Users, Shield,
  Smartphone, FileText, MessageSquare, Globe2, Factory, Truck,
  TrendingUp, Package, CreditCard, Building2, UserCog, Receipt,
  ShoppingCart, Mail, Phone, MapPin, Twitter, Linkedin, Facebook,
  ExternalLink
} from 'lucide-react';

const FEATURES = [
  { icon: ShoppingCart,  title: 'Barcode POS',           desc: 'Scan products instantly, manage stock in real-time, process sales in seconds.' },
  { icon: WifiOff,       title: 'Works Offline',          desc: 'Never stop selling — works perfectly during outages, syncs automatically.' },
  { icon: Package,       title: 'Stock Management',       desc: 'Real-time tracking, low-stock alerts, movement history, and barcode generation.' },
  { icon: BarChart3,     title: 'Smart Reports',          desc: 'P&L, inventory valuation, staff performance — all the insights you need.' },
  { icon: Building2,     title: 'Multi-Branch',           desc: 'Manage multiple locations from one dashboard. Transfer stock between branches.' },
  { icon: Shield,        title: 'Role-Based Access',      desc: 'Owner, admin, manager, cashier — each role gets exactly the right permissions.' },
  { icon: Smartphone,    title: 'Mobile Money',           desc: 'Accept MTN MoMo, Airtel Money, cash, card, and bank transfers.' },
  { icon: FileText,      title: 'Quotations & Invoices',  desc: 'Create professional quotes, convert them to sales in one click.' },
  { icon: ScanLine,      title: 'Barcode Generation',     desc: 'Generate and print shelf labels and barcodes for all your products.' },
  { icon: MessageSquare, title: 'SMS Center',              desc: 'Automated SMS summaries, low-stock alerts, and customer notifications.' },
  { icon: Globe2,        title: 'Multi-Currency',          desc: 'Sell in UGX, USD, KES, or any currency with live exchange rates.' },
  { icon: TrendingUp,    title: 'Accounting',              desc: 'Full P&L, balance sheet, and cash flow statements built right in.' },
  { icon: UserCog,       title: 'Staff Performance',       desc: 'Track cashier sales, attendance, and productivity with detailed reports.' },
  { icon: Factory,       title: 'Manufacturing',           desc: 'Manage raw materials, BOMs, production orders, and cost calculation.' },
  { icon: Truck,         title: 'Field Sales',             desc: 'Stock issuance, expense tracking, and performance reports for field agents.' },
  { icon: Users,         title: 'Customer & Credit',       desc: 'Purchase history, credit limits, and a CRM for your loyal customers.' },
  { icon: Receipt,       title: 'Purchases & Expenses',    desc: 'Supplier management, purchase orders, and expense tracking in one place.' },
  { icon: CreditCard,    title: 'PDF Receipts',            desc: 'Print or email receipts and export reports to Excel or CSV.' },
];

const PLANS = [
  {
    name: 'Starter',
    price: '1,200,000',
    tag: '1 location · 3 users · 500 products',
    features: ['POS & barcode scanning', 'Stock management', 'Purchases & expenses', 'Offline mode', 'Customer & credit management', 'WhatsApp summaries'],
  },
  {
    name: 'Premium',
    price: '1,800,000',
    tag: 'Unlimited users & products',
    highlight: true,
    features: ['Everything in Starter', 'Quotations & invoices', 'Label & barcode generation', 'SMS Center', 'Multi-currency', 'Accounting (P&L, Balance Sheet)', 'Staff performance reports'],
  },
  {
    name: 'Enterprise',
    price: '2,500,000',
    tag: 'Unlimited locations',
    features: ['Everything in Premium', 'Manufacturing module', 'Field Sales module', 'Multi-branch management', 'Priority support'],
  },
];

const FOOTER = {
  product: {
    label: 'Product',
    links: [
      { label: 'Features',      href: '#features' },
      { label: 'Pricing',       href: '#pricing' },
      { label: 'Changelog',     href: '#' },
      { label: 'Roadmap',       href: '#' },
      { label: 'System status', href: '#', icon: ExternalLink },
    ],
  },
  company: {
    label: 'Company',
    links: [
      { label: 'About us',          href: '#' },
      { label: 'Blog',              href: '#' },
      { label: 'Careers',           href: '#' },
      { label: 'Contact',           href: '#' },
      { label: 'Privacy policy',    href: '#' },
      { label: 'Terms of service',  href: '#' },
    ],
  },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-medium text-sm leading-none">V</span>
            </div>
            <span className="font-medium text-gray-900 text-[15px] tracking-tight">Venderra</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-normal text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing"  className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#"         className="hover:text-gray-900 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get started <ArrowRight size={13} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-20 lg:py-28 text-center">
          <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-[11px] font-normal uppercase tracking-wider mb-7">
            Uganda's most trusted POS platform
          </div>
          <h1 className="text-4xl lg:text-[54px] font-semibold text-gray-900 leading-[1.12] tracking-tight mb-5">
            The POS built for<br />
            <span className="text-blue-600">African businesses</span>
          </h1>
          <p className="text-[17px] text-gray-400 font-light max-w-2xl mx-auto mb-9 leading-relaxed">
            Manage sales, inventory, staff, and finances from one powerful platform — that works perfectly offline.
            Built for supermarkets, pharmacies, wholesale shops, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn btn-primary btn-xl">
              Start free trial <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link to="/login" className="text-sm font-normal text-gray-400 hover:text-gray-700 transition-colors">
              Already have an account? Sign in →
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-gray-100">
            {[
              { stat: '500+',    label: 'Businesses' },
              { stat: '5 cities', label: 'Uganda coverage' },
              { stat: '99.9%',   label: 'Uptime' },
              { stat: '24/7',    label: 'Support' },
            ].map(({ stat, label }) => (
              <div key={label} className="text-center">
                <p className="text-[17px] font-medium text-gray-800 tabular-nums">{stat}</p>
                <p className="text-[11px] text-gray-400 font-light mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-[11px] font-medium uppercase tracking-widest text-blue-600 mb-3">Everything included</p>
            <h2 className="text-2xl lg:text-3xl font-medium text-gray-900 mb-3">
              One platform for your entire business
            </h2>
            <p className="text-gray-400 max-w-lg text-[15px] font-light leading-relaxed">
              Sales, stock, staff, finances, field agents, and manufacturing — manage it all from one place.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="card p-5 hover:border-blue-200 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <f.icon size={15} className="text-blue-600" strokeWidth={1.6} />
                  </div>
                  <h3 className="font-medium text-gray-800 text-[13px]">{f.title}</h3>
                </div>
                <p className="text-[13px] text-gray-400 font-light leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-[11px] font-medium uppercase tracking-widest text-blue-600 mb-3">Pricing</p>
            <h2 className="text-2xl lg:text-3xl font-medium text-gray-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-400 text-[15px] font-light">Annual plans in Ugandan Shillings. No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-lg p-6 relative border ${
                  plan.highlight ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-medium uppercase tracking-wider rounded-full whitespace-nowrap">
                    Most popular
                  </span>
                )}
                <h3 className="font-medium text-gray-900 text-base mb-1">{plan.name}</h3>
                <p className="text-[11px] text-gray-400 font-light mb-5">{plan.tag}</p>
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <span className="text-[26px] font-medium text-gray-900 tabular-nums">UGX {plan.price}</span>
                  <span className="text-[12px] text-gray-400 font-light ml-1">/year</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-gray-500 font-light">
                      <Check size={13} className="text-blue-500 mt-0.5 shrink-0" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`btn w-full justify-center ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-blue-600 rounded-xl p-10 lg:p-14 text-center">
            <h2 className="text-2xl lg:text-3xl font-medium text-white mb-3 tracking-tight">
              Ready to grow your business?
            </h2>
            <p className="text-sm text-white/60 font-light mb-8 max-w-lg mx-auto leading-relaxed">
              Join retail shops, supermarkets, pharmacies, and wholesale businesses using Venderra to sell smarter — from Kampala to the rest of the world.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-[15px] transition-colors"
            >
              Start free trial <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#09090b] border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-white/[0.06]">

            {/* Col 1 — Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-medium text-sm leading-none">V</span>
                </div>
                <span className="font-medium text-white text-[15px] tracking-tight">Venderra</span>
              </div>
              <p className="text-[13px] text-white/35 font-light leading-relaxed max-w-[220px] mb-6">
                Uganda's most trusted POS platform — built for retail, pharmacies, wholesale, and more.
              </p>
              <div className="space-y-2.5 mb-6">
                <a href="mailto:hello@venderra.ug" className="flex items-center gap-2 text-[12px] text-white/35 hover:text-white/70 transition-colors font-light">
                  <Mail size={13} className="shrink-0" /> hello@venderra.ug
                </a>
                <a href="tel:+256700000000" className="flex items-center gap-2 text-[12px] text-white/35 hover:text-white/70 transition-colors font-light">
                  <Phone size={13} className="shrink-0" /> +256 700 000 000
                </a>
                <div className="flex items-center gap-2 text-[12px] text-white/35 font-light">
                  <MapPin size={13} className="shrink-0" /> Kampala, Uganda
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { icon: Twitter,  href: '#', label: 'Twitter' },
                  { icon: Linkedin, href: '#', label: 'LinkedIn' },
                  { icon: Facebook, href: '#', label: 'Facebook' },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-8 h-8 rounded-md bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2 — Product */}
            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/25 mb-4">
                {FOOTER.product.label}
              </h4>
              <ul className="space-y-2.5">
                {FOOTER.product.links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white/80 transition-colors font-light"
                    >
                      {link.label}
                      {link.icon && <link.icon size={11} className="text-white/20" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Company */}
            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/25 mb-4">
                {FOOTER.company.label}
              </h4>
              <ul className="space-y-2.5">
                {FOOTER.company.links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-white/45 hover:text-white/80 transition-colors font-light"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-[12px] text-white/20 font-light">
            <p>&copy; {new Date().getFullYear()} Venderra Technologies Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with <span className="text-red-400 mx-0.5">♥</span> in Uganda 🇺🇬
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
