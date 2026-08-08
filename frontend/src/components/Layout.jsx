import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3,
  Settings, LogOut, Warehouse, Receipt, Factory, Truck,
  Wifi, WifiOff, FileText, ShoppingBag, ChevronDown,
  Building2, Check, UserCog, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import api from '../services/api';

const NAV = [
  {
    label: 'Main',
    items: [
      { to: '/app',               icon: LayoutDashboard, label: 'Dashboard',     end: true },
      { to: '/app/pos',           icon: ShoppingCart,    label: 'Point of Sale' },
      { to: '/app/products',      icon: Package,         label: 'Products' },
      { to: '/app/stock',         icon: Warehouse,       label: 'Stock' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/app/sales',         icon: Receipt,         label: 'Sales' },
      { to: '/app/customers',     icon: Users,           label: 'Customers' },
      { to: '/app/employees',     icon: UserCog,         label: 'Employees' },
      { to: '/app/quotations',    icon: FileText,        label: 'Quotations',   plan: 'quotations' },
      { to: '/app/purchases',     icon: ShoppingBag,     label: 'Purchases' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/app/reports',       icon: BarChart3,       label: 'Reports' },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { to: '/app/manufacturing', icon: Factory,         label: 'Production',   plan: 'manufacturing' },
      { to: '/app/field-sales',   icon: Truck,           label: 'Field Sales',  plan: 'field_sales' },
      { to: '/app/settings',      icon: Settings,        label: 'Settings' },
    ],
  },
];

export default function Layout() {
  const { user, logout, switchBranch, isOnline } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches]             = useState([]);
  const [showBranch, setShowBranch]         = useState(false);
  const [lowStockCount, setLowStockCount]   = useState(0);

  useEffect(() => {
    api.get('/auth/branches').then(r => setBranches(r.data)).catch(() => {});
    // Zeigarnik: fetch low stock count to show on nav — creates urgency to resolve
    api.get('/stock/alerts').then(r => setLowStockCount(r.data?.length || 0)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleBranchSwitch = async (id) => {
    if (id === user?.branchId) { setShowBranch(false); return; }
    try { await switchBranch(id); setShowBranch(false); window.location.reload(); }
    catch (e) { console.error(e); }
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const visibleNav = NAV.map(group => ({
    ...group,
    items: group.items.filter(i => !i.plan || user?.planFeatures?.[i.plan] || user?.plan === 'enterprise'),
  })).filter(g => g.items.length);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="fixed top-0 left-0 w-60 h-screen bg-[#09090b] flex flex-col z-[100]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-white/[0.06] shrink-0">
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
            <span className="text-white font-medium text-sm leading-none select-none">V</span>
          </div>
          <div>
            <span className="text-white font-medium text-[14px] tracking-tight leading-none">Venderra</span>
            <p className="text-[10px] text-white/30 mt-0.5 leading-none">POS Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          {visibleNav.map(group => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/25 select-none">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-normal transition-colors ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={15}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={isActive ? 'text-blue-400' : ''}
                        />
                        <span className="flex-1">{label}</span>
                        {/* Zeigarnik badge — unresolved low stock creates urgency */}
                        {to === '/app/stock' && lowStockCount > 0 && (
                          <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                            {lowStockCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="shrink-0 p-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md group hover:bg-white/[0.05] transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-normal text-white/80 truncate leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-white/30 truncate capitalize mt-0.5">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/70 transition-all p-1 rounded"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="ml-60 flex-1 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50 shrink-0">

          {/* Left: business + branch */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-800">{user?.businessName}</span>

            {branches.length > 1 ? (
              <div className="relative">
                <button
                  onClick={() => setShowBranch(!showBranch)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Building2 size={12} className="text-gray-400" />
                  {user?.branchName}
                  <ChevronDown size={12} className={`text-gray-400 transition-transform ${showBranch ? 'rotate-180' : ''}`} />
                </button>

                {showBranch && (
                  <>
                    <div className="fixed inset-0 z-[99]" onClick={() => setShowBranch(false)} />
                    <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] py-1 animate-fade-in-scale">
                      <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                        Switch Branch
                      </p>
                      {branches.map(b => (
                        <button
                          key={b.id}
                          onClick={() => handleBranchSwitch(b.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors ${
                            b.id === user?.branchId
                              ? 'text-blue-600 font-semibold bg-blue-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Building2 size={13} className={b.id === user?.branchId ? 'text-blue-500' : 'text-gray-400'} />
                          <span className="flex-1 text-left truncate">{b.name}</span>
                          {b.id === user?.branchId && <Check size={13} className="text-blue-500" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              user?.branchName && (
                <span className="text-[12px] text-gray-400 flex items-center gap-1">
                  <Building2 size={11} />
                  {user.branchName}
                </span>
              )
            )}
          </div>

          {/* Right: status + actions */}
          <div className="flex items-center gap-1.5">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {isOnline ? <Wifi size={11} strokeWidth={2} /> : <WifiOff size={11} strokeWidth={2} />}
              {isOnline ? 'Online' : 'Offline'}
            </span>

            <NotificationBell />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 ml-1"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
