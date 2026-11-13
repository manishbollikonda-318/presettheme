import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
      {/* Column 1: Left Navigation Sidebar (245px) */}
      <Sidebar />

      {/* Main Center Column Workspace + Top Header */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Global Utility Bar (68px) */}
        <TopHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* Center Workspace + Right Column Container */}
        <div className="flex-1 flex overflow-hidden">
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

          {/* Column 3: Right Order Queue & Billing Panel (375px) */}
          {showRightOrderColumn && <RightOrderPanel />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TenantProvider>
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
