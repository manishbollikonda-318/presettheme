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
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid, path: '/' },
  { key: 'pos', label: 'Point of Sale', icon: Store, path: '/pos' },
  { key: 'dining', label: 'Dining Area', icon: UtensilsCrossed, path: '/dining' },
  { key: 'orders', label: 'Order Queue', icon: ClipboardList, path: '/orders', badge: true },
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
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                <Hexagon className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-bold text-slate-900 truncate tracking-tight">
                    {tenant.brandName}
                  </h1>
                  <p className="text-[10px] text-slate-400 truncate">{tenant.tagline}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Collapse/Expand for desktop */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0 transition-colors"
                title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              {/* Close button for mobile */}
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0 transition-colors"
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Primary Navigation List */}
          <nav className="mt-4 px-3 space-y-1">
            {NAV_ITEMS.filter((item) => hasPermission(item.key)).map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path === '/' && location.pathname === '/');
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={active ? { backgroundColor: 'var(--brand-primary)' } : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && item.badge && activeOrders > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{
                        backgroundColor: active
                          ? 'rgba(255,255,255,0.3)'
                          : 'var(--brand-primary)',
                      }}
                    >
                      {activeOrders}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="my-3 mx-4 border-t border-slate-100" />

          {/* Secondary Navigation List */}
          <nav className="px-3 space-y-1">
            {SECONDARY_NAV.filter((item) => hasPermission(item.key)).map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={active ? { backgroundColor: 'var(--brand-primary)' } : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Card */}
        {user && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                {user.avatar || '🧑'}
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${getRoleBadgeStyle(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                </div>
              )}

              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Logout Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
