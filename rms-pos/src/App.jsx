import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { TenantProvider } from './context/TenantContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { POSProvider } from './context/POSContext';
import { QRSessionProvider } from './context/QRSessionContext';

import Sidebar from './components/layout/Sidebar';
import TopHeader from './components/layout/TopHeader';
import RightOrderPanel from './components/pos/RightOrderPanel';

import LoginView from './views/LoginView';
import OverviewView from './views/OverviewView';
import POSView from './views/POSView';
import DiningView from './views/DiningView';
import OrdersView from './views/OrdersView';
import PromoView from './views/PromoView';
import StaffView from './views/StaffView';
import CustomersView from './views/CustomersView';
import BillingView from './views/BillingView';
import SettingsView from './views/SettingsView';
import HelpView from './views/HelpView';
import QROrderingView from './views/qr/QROrderingView';

function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kitchen Chef primary view is the Kitchen Display System (Order Queue)
  if (user.role === 'kitchen' && location.pathname === '/') {
    return <Navigate to="/orders" replace />;
  }

  // Exact 3-column docking: Column 3 (RightOrderPanel) is docked on POS and Dining Area
  const showRightOrderColumn = location.pathname === '/pos' || location.pathname === '/dining';

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#F4F6F8]">
      {/* Column 1: Left Navigation Sidebar (245px on desktop, off-canvas on mobile) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Center Column Workspace + Top Header */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Global Utility Bar (68px) */}
        <TopHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onToggleMobileCart={() => setMobileCartOpen((prev) => !prev)}
          showCartButton={showRightOrderColumn}
        />

        {/* Center Workspace + Right Column Container */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Column 2: Center Main Workspace */}
          <div className="flex-1 flex overflow-hidden">
            <Routes>
              <Route path="/" element={<OverviewView />} />
              <Route path="/pos" element={<POSView searchQuery={searchQuery} />} />
              <Route path="/dining" element={<DiningView />} />
              <Route path="/orders" element={<OrdersView />} />
              <Route path="/promo" element={<PromoView />} />
              <Route path="/staff" element={<StaffView />} />
              <Route path="/customers" element={<CustomersView />} />
              <Route path="/billing" element={<BillingView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="/help" element={<HelpView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Column 3: Right Order Queue & Billing Panel */}
          {showRightOrderColumn && (
            <>
              {/* Desktop Docked Version (xl screens >= 1280px) */}
              <div className="hidden xl:flex h-full">
                <RightOrderPanel />
              </div>

              {/* Mobile / Tablet Drawer Version (< 1280px) */}
              {mobileCartOpen && (
                <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
                  <div
                    onClick={() => setMobileCartOpen(false)}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
                  />
                  <div className="relative z-10 w-full max-w-[390px] h-full shadow-2xl animate-in slide-in-from-right duration-200">
                    <RightOrderPanel onClose={() => setMobileCartOpen(false)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TenantProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            fontSize: '13px',
            fontWeight: 600,
          },
        }}
      />
      <AuthProvider>
        <POSProvider>
          <QRSessionProvider>
            <Routes>
              {/* Customer QR Ordering routes (Isolated from staff layout) */}
              <Route path="/qr/:token" element={<QROrderingView />} />
              <Route path="/order" element={<QROrderingView />} />

              {/* Staff and POS routes */}
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </QRSessionProvider>
        </POSProvider>
      </AuthProvider>
    </TenantProvider>
  );
}

function LoginRoute() {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'kitchen') return <Navigate to="/orders" replace />;
    return <Navigate to="/pos" replace />;
  }
  return <LoginView />;
}
