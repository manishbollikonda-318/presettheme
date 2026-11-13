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
} from 'lucide-react';

export default function QROrderingView() {
  const { token: urlEncryptedToken } = useParams();
  const navigate = useNavigate();
  const { session, token, isVerifying, error, resolveQRToken, clearSession } = useQRSession();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);

  // 1. Resolve QR token from path if not authenticated
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
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 border border-rose-200/60 flex items-center justify-center mb-4 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Session Invalid or Expired</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
          {error}. Please point your camera and rescan the QR code on your restaurant table.
        </p>
        <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={() => {
              clearSession();
              window.location.reload();
            }}
            className="w-full py-3 bg-emerald-800 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Verifying token spinner
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100/60 text-emerald-800 flex items-center justify-center mb-4 animate-spin">
          <Coffee className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Verifying Table QR Token...</h2>
        <p className="text-xs text-slate-500 mt-1">Establishing anti-tamper encrypted session</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 flex flex-col font-sans pb-28">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-950/5 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900 tracking-tight">
              {session?.tenant_name || "Smart QR Restaurant"}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <MapPin className="w-3 h-3" />
              <span>Table #{session?.table?.number || '—'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Dine-In</span>
            </div>
          </div>
        </div>

        {totalCartCount > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-3.5 py-2 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2 text-emerald-800 active:scale-95 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="font-mono font-bold text-xs">₹{cartSubtotal.toFixed(2)}</span>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-700 text-white font-mono text-[10px] font-bold flex items-center justify-center">
              {totalCartCount}
            </span>
          </button>
        )}
      </header>

      {/* Hero Welcome & Search */}
      <div className="px-5 pt-5 pb-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cold brews, artisanal melts, bites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-2xl border border-emerald-950/5 shadow-2xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>
      </div>

      {/* Category Horizontal Pills */}
      <div className="px-5 py-2 overflow-x-auto flex gap-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-emerald-950/5 hover:bg-slate-50'
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
                : 'bg-white text-slate-600 border border-emerald-950/5 hover:bg-slate-50'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Cards Stream */}
      <main className="px-5 py-4 flex-1 space-y-3.5 max-w-2xl mx-auto w-full">
        {menuLoading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 opacity-50" />
            <p className="text-xs font-semibold">Loading Fresh Menu...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-slate-400 bg-white rounded-3xl p-8 border border-emerald-950/5">
            <Coffee className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-800" />
            <p className="text-sm font-bold text-slate-700">No items found</p>
            <p className="text-xs text-slate-400 mt-1">Try another category or search keyword.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
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
          })
        )}
      </main>

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
              <span className="text-sm">View Table Order</span>
            </div>
            <span className="font-mono text-base">₹{cartSubtotal.toFixed(2)} →</span>
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
