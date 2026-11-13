import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { usePOS } from '../../context/POSContext';
import {
  LayoutGrid,
  Store,
  UtensilsCrossed,
  ClipboardList,
  TicketPercent,
  Users,
  BookUser,
  Receipt,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  X,
  Tv,
  QrCode,
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid, path: '/' },
  { key: 'pos', label: 'Point of Sale', icon: Store, path: '/pos' },
  { key: 'dining', label: 'Dining Area', icon: UtensilsCrossed, path: '/dining' },
  { key: 'qrs', label: 'QR Management', icon: QrCode, path: '/qr-manager' },
  { key: 'orders', label: 'Order Queue', icon: ClipboardList, path: '/orders', badge: true },
  { key: 'tv', label: 'TV Pickup Board', icon: Tv, path: '/pickup-board' },
  { key: 'promo', label: 'Promo & Discounts', icon: TicketPercent, path: '/promo' },
  { key: 'staff', label: 'Staff & Roles', icon: Users, path: '/staff' },
  { key: 'customers', label: 'Customer List', icon: BookUser, path: '/customers' },
];

const SECONDARY_NAV = [
  { key: 'billing', label: 'Billing', icon: Receipt, path: '/billing' },
  { key: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  { key: 'help', label: 'Help / Support', icon: HelpCircle, path: '/help' },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { tenant } = useTenant();
  const { orders } = usePOS();

  const activeOrders = orders.filter(
    (o) => o.status !== 'Completed' && o.status !== 'Cancelled'
  ).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
    onCloseMobile?.();
  };

  const handleNavClick = (path) => {
    navigate(path);
    onCloseMobile?.();
  };

  const w = collapsed ? 'w-[72px]' : 'w-[245px]';

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'cashier':
        return 'bg-emerald-100 text-emerald-800';
      case 'waiter':
        return 'bg-amber-100 text-amber-800';
      case 'kitchen':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-10 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-transform md:transition-all duration-200 select-none overflow-hidden shadow-2xl md:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${w}`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-[68px] px-5 flex items-center justify-between border-b border-slate-100">
            <div
              onClick={() => handleNavClick('/')}
              className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20">
                <Hexagon className="w-5 h-5 text-white fill-white" />
              </div>
              {!collapsed && (
                <div className="leading-tight truncate">
                  <span className="font-extrabold text-[15px] tracking-tight text-slate-800 block truncate">
                    {tenant?.brandName || 'LOC RMS'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                    Admin Platform
                  </span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Nav */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full h-10 px-3 rounded-xl flex items-center gap-3 transition-colors text-[13px] font-semibold relative group ${
                    active
                      ? 'bg-orange-50 text-orange-600 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      active ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}

                  {item.badge && activeOrders > 0 && !collapsed && (
                    <span className="ml-auto bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {activeOrders}
                    </span>
                  )}
                  {item.badge && activeOrders > 0 && collapsed && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-600" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div>
          {/* Secondary Nav */}
          <div className="px-3 py-2 border-t border-slate-100 space-y-1">
            {SECONDARY_NAV.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full h-9 px-3 rounded-xl flex items-center gap-3 transition-colors text-[12px] font-medium group ${
                    active
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-600" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* User Profile Card + Collapse Toggle */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {!collapsed ? (
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0">
                  {user?.avatar || '👤'}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                  <span
                    className={`inline-block text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded ${getRoleBadgeStyle(
                      user?.role
                    )}`}
                  >
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Collapse toggle (desktop only) */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
