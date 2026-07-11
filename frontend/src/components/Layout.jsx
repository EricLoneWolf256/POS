import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3,
  Settings, LogOut, Warehouse, Receipt, Factory, Truck, Wifi, WifiOff,
  FileText, ShoppingCart as CartIcon, ChevronDown, Building2, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import api from '../services/api';

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/pos', icon: ShoppingCart, label: 'Point of Sale' },
  { to: '/app/products', icon: Package, label: 'Products' },
  { to: '/app/stock', icon: Warehouse, label: 'Stock' },
  { to: '/app/sales', icon: Receipt, label: 'Sales' },
  { to: '/app/customers', icon: Users, label: 'Customers' },
  { to: '/app/quotations', icon: FileText, label: 'Quotations', plan: 'quotations' },
  { to: '/app/purchases', icon: CartIcon, label: 'Purchases' },
  { to: '/app/reports', icon: BarChart3, label: 'Reports' },
  { to: '/app/manufacturing', icon: Factory, label: 'Production', plan: 'manufacturing' },
  { to: '/app/field-sales', icon: Truck, label: 'Field Sales', plan: 'field_sales' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, logout, switchBranch, isOnline } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  useEffect(() => {
    api.get('/auth/branches').then(res => setBranches(res.data)).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBranchSwitch = async (branchId) => {
    if (branchId === user?.branchId) {
      setShowBranchDropdown(false);
      return;
    }
    try {
      await switchBranch(branchId);
      setShowBranchDropdown(false);
      window.location.reload();
    } catch (err) {
      console.error('Branch switch failed:', err);
    }
  };

  const filteredNav = navItems.filter(item => {
    if (!item.plan) return true;
    return user?.planFeatures?.[item.plan] || user?.plan === 'enterprise';
  });

  return (
    <div className="flex min-h-screen bg-slate-50/80">
      <aside className="fixed w-[260px] h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white overflow-y-auto z-[100] shadow-xl shadow-slate-900/20">
        <div className="p-6 border-b border-white/5">
          <NavLink to="/app" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Venderra</h1>
              <span className="text-[11px] font-medium text-white/40 tracking-wide uppercase">POS Software</span>
            </div>
          </NavLink>
        </div>
        <nav className="p-3 mt-1">
          {filteredNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm shadow-black/10'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60'
                  }`}>
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-gradient-to-t from-slate-950 to-transparent">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/90 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-white/40 truncate">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 ml-[260px] min-h-screen">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-8 py-3.5 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <strong className="text-slate-800 text-[15px]">{user?.businessName}</strong>
            {branches.length > 1 ? (
              <div className="relative">
                <button
                  onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
                >
                  <Building2 size={14} className="text-slate-400" />
                  {user?.branchName}
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showBranchDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showBranchDropdown && (
                  <>
                    <div className="fixed inset-0 z-[99]" onClick={() => setShowBranchDropdown(false)} />
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-900/10 z-[100] py-1 animate-fade-in">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Branch</p>
                      </div>
                      {branches.map(b => (
                        <button
                          key={b.id}
                          onClick={() => handleBranchSwitch(b.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 ${
                            b.id === user?.branchId
                              ? 'bg-teal-50 text-teal-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            b.id === user?.branchId ? 'bg-teal-100' : 'bg-slate-100'
                          }`}>
                            <Building2 size={14} className={b.id === user?.branchId ? 'text-teal-600' : 'text-slate-400'} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{b.name}</p>
                            {b.code && <p className="text-[11px] text-slate-400">{b.code}</p>}
                          </div>
                          {b.id === user?.branchId && <Check size={16} className="text-teal-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span className="text-slate-400 text-sm font-medium">{user?.branchName}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
              isOnline
                ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50'
                : 'bg-red-50 text-red-600 ring-1 ring-red-200/50'
            }`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <NotificationBell />
            <button
              className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all duration-200 active:scale-[0.98]"
              onClick={handleLogout}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
