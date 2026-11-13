import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQRSession } from '../../context/QRSessionContext';
import { apiRequest } from '../../api/client';
import { QRMenuItemCard } from '../../components/qr/QRMenuItemCard';
import { QRCartDrawer } from '../../components/qr/QRCartDrawer';
import { QROrderTracker } from '../../components/qr/QROrderTracker';
import {
  Coffee,
  ShoppingBag,
  Search,
  Sparkles,
  AlertTriangle,
  QrCode,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Lock,
  ChevronRight,
  Utensils,
  CheckCircle,
} from 'lucide-react';

const DEMO_TABLES = [
  { number: '01', zone: 'Window Booth', capacity: 4, icon: '🪟' },
  { number: '02', zone: 'Main Dining Floor', capacity: 4, icon: '🍽️' },
  { number: '03', zone: 'Bar & Lounge', capacity: 2, icon: '🍸' },
  { number: '04', zone: 'Family Table', capacity: 6, icon: '👨‍👩‍👧‍👦' },
  { number: '05', zone: 'Outdoor Patio', capacity: 4, icon: '🌿' },
  { number: '06', zone: 'High Top Counter', capacity: 4, icon: '🥂' },
];

export default function QROrderingView() {
  const { token: urlEncryptedToken } = useParams();
  const navigate = useNavigate();
  const { session, token, isVerifying, error, resolveQRToken, activateDemoTable, clearSession } =
    useQRSession();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [activatingTable, setActivatingTable] = useState(null);

  // 1. Resolve QR token from path if present in URL
  useEffect(() => {
    if (urlEncryptedToken && (!token || !session)) {
      resolveQRToken(urlEncryptedToken).catch(() => {});
    }
  }, [urlEncryptedToken, token, session, resolveQRToken]);

  // 2. Fetch Menu once authenticated
  useEffect(() => {
    if (!token && !session) return;

    let mounted = true;
    async function fetchMenu() {
      setMenuLoading(true);
      try {
        const [catData, itemData] = await Promise.all([
          apiRequest('/menu/categories'),
          apiRequest('/menu/items?available_only=true'),
        ]);

        if (mounted) {
          setCategories(catData.categories || []);
          setMenuItems(itemData.items || []);
        }
      } catch (err) {
        console.warn('Failed to load menu via API, loading default presets', err);
      } finally {
        if (mounted) setMenuLoading(false);
      }
    }

    fetchMenu();
    return () => {
      mounted = false;
    };
  }, [token, session]);

  // Handle manual demo table activation
  const handleSelectTable = async (tableNum) => {
    setActivatingTable(tableNum);
    try {
      await activateDemoTable(tableNum);
    } catch (err) {
      alert(`Could not start session for Table ${tableNum}: ${err.message}`);
    } finally {
      setActivatingTable(null);
    }
  };

  // Cart operations
  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, price: parseFloat(item.price) }];
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleUpdateQty = (itemId, delta) => {
    if (delta > 0) {
      const item = menuItems.find((i) => i.id === itemId);
      if (item) handleAddToCart(item);
    } else {
      handleRemoveFromCart(itemId);
    }
  };

  // Dispatch Order ticket
  const handleSubmitOrder = async ({ customerName, orderNotes }) => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const payload = {
        order_type: 'dine_in',
        customer_name: customerName,
        notes: orderNotes,
        items: cart.map((i) => ({
          menu_item_id: i.id,
          quantity: i.quantity,
          notes: '',
          extras: [],
        })),
      };

      const res = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.order) {
        setCart([]);
        setIsCartOpen(false);
        setActiveOrderId(res.order.id);
      }
    } catch (err) {
      alert(`Order submission failed: ${err.message || 'Please contact staff'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Menu
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory =
        selectedCategory === 'ALL' || item.category_id === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Fallback: Error or Session Expired state
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 border border-rose-200/60 flex items-center justify-center mb-4 shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Session Invalid or Expired</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
          {error}. Please point your camera and rescan the QR code on your dining table.
        </p>
        <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={() => {
              clearSession();
              window.location.reload();
            }}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again / Select Table
          </button>
        </div>
      </div>
    );
  }

  // Verifying token spinner
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100/60 text-emerald-800 flex items-center justify-center mb-4 animate-spin">
          <Coffee className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Verifying Table QR Token...</h2>
        <p className="text-xs text-slate-500 mt-1">Establishing anti-tamper encrypted session</p>
      </div>
    );
  }

  // 3. Welcome / Table Selection Screen if user visited /order directly without scanning
  if (!session && !token) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <QrCode className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              TableCraft Digital Dining
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Scan the physical QR code on your dining table, or choose your table below to launch an encrypted dining session:
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 mb-6 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-900 leading-relaxed">
              <strong>Anti-Tamper Table Verification:</strong> Each table generates a 32-byte AES-256-GCM encrypted token. Orders are strictly locked to the verified table.
            </div>
          </div>

          {/* Table Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {DEMO_TABLES.map((tbl) => (
              <button
                key={tbl.number}
                disabled={activatingTable !== null}
                onClick={() => handleSelectTable(tbl.number)}
                className="group border border-slate-200 hover:border-emerald-600 rounded-2xl p-3.5 text-left bg-slate-50/50 hover:bg-emerald-50/30 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{tbl.icon}</span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {tbl.capacity} Seats
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Table #{tbl.number}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{tbl.zone}</p>
                </div>
                <div className="mt-3 text-[10px] font-bold text-emerald-700 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  {activatingTable === tbl.number ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Dine Here →</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-[10px] text-slate-400">
            Powered by generic white-label multi-tenant POS engine
          </p>
        </div>
      </div>
    );
  }

  // 4. Authenticated Dining Screen (Table Locked)
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 flex flex-col font-sans pb-32">
      {/* Top Sticky Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              {session?.tenant_name || 'TableCraft Bistro'}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Table #{session?.table?.number || '01'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-[10px]">Session Verified</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Switch dining table? This will reset your current table session.')) {
                clearSession();
              }
            }}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
          >
            Switch Table
          </button>

          {totalCartCount > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl flex items-center gap-2 shadow-xs active:scale-95 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono font-bold text-xs">${cartSubtotal.toFixed(2)}</span>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-900 font-mono text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                {totalCartCount}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Security Banner */}
      <div className="bg-emerald-900 text-white px-4 py-2 text-center text-[11px] font-medium flex items-center justify-center gap-2 shadow-xs">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <span>Anti-Tamper Active: Orders from this device are locked exclusively to Table #{session?.table?.number || '01'}.</span>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
        {/* Search Input */}
        <div className="pt-5 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search entrees, pastas, cold brews, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs bg-white rounded-2xl border border-slate-200/80 shadow-2xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="py-2 overflow-x-auto flex gap-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            ✨ All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Cards Grid: 1 col on mobile, 2 col on tablet/desktop */}
        <main className="py-4">
          {menuLoading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 opacity-50" />
              <p className="text-xs font-semibold">Loading Fresh Kitchen Menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 bg-white rounded-3xl p-8 border border-slate-200">
              <Coffee className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-800" />
              <p className="text-sm font-bold text-slate-700">No dishes found</p>
              <p className="text-xs text-slate-400 mt-1">Try another category or search keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const inCart = cart.find((c) => c.id === item.id);
                return (
                  <QRMenuItemCard
                    key={item.id}
                    item={item}
                    quantity={inCart ? inCart.quantity : 0}
                    onAdd={() => handleAddToCart(item)}
                    onRemove={() => handleRemoveFromCart(item.id)}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Floating Bottom Bar (Sticky when cart has items) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold flex items-center justify-between shadow-xl shadow-emerald-900/25 active:scale-98 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-white/20 text-white font-mono text-xs flex items-center justify-center font-bold">
                {totalCartCount}
              </span>
              <span className="text-sm">View Table #{session?.table?.number || '01'} Order</span>
            </div>
            <span className="font-mono text-base">${cartSubtotal.toFixed(2)} →</span>
          </button>
        </div>
      )}

      {/* Cart Drawer Bottom Sheet */}
      <QRCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        tableNumber={session?.table?.number || '01'}
        onUpdateQty={handleUpdateQty}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmitting}
      />

      {/* Real-time Order Tracker Modal */}
      {activeOrderId && (
        <QROrderTracker
          orderId={activeOrderId}
          onClose={() => setActiveOrderId(null)}
          onNewOrder={() => setActiveOrderId(null)}
        />
      )}
    </div>
  );
}
