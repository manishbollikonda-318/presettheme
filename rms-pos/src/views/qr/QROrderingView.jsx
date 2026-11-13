import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQRSession } from '../../context/QRSessionContext';
import { useTenant } from '../../context/TenantContext';
import { apiRequest } from '../../api/client';
import { QRMenuItemCard } from '../../components/qr/QRMenuItemCard';
import { QRCartDrawer } from '../../components/qr/QRCartDrawer';
import { QROrderTracker } from '../../components/qr/QROrderTracker';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';
import {
  Coffee,
  ShoppingBag,
  Search,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Lock,
  UtensilsCrossed,
} from 'lucide-react';

const PHYSICAL_TABLES = [
  { number: '1', zone: 'Window Booth', capacity: 4, icon: '🪟' },
  { number: '2', zone: 'Main Dining Floor', capacity: 4, icon: '🍽️' },
  { number: '3', zone: 'Bar & Lounge', capacity: 2, icon: '🍸' },
  { number: '4', zone: 'Family Table', capacity: 6, icon: '👨‍👩‍👧‍👦' },
  { number: '5', zone: 'Outdoor Patio', capacity: 4, icon: '🌿' },
  { number: '6', zone: 'High Top Counter', capacity: 4, icon: '🥂' },
];

export default function QROrderingView() {
  const { tableNumber: routeParam } = useParams();
  const navigate = useNavigate();
  const { 
    tableNumber, 
    setTableNumber, 
    session, 
    token, 
    isVerifying, 
    error, 
    resolveQRToken, 
    activateDemoTable, 
    clearSession 
  } = useQRSession();
  const { tenant } = useTenant();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [activatingTable, setActivatingTable] = useState(null);

  // 1. Immediately extract route param and lock into session state
  useEffect(() => {
    if (routeParam) {
      const cleanParam = String(routeParam).replace(/^TABLE-/i, '');
      setTableNumber(cleanParam);
      resolveQRToken(routeParam).catch(() => {});
    }
  }, [routeParam, setTableNumber, resolveQRToken]);

  // 2. Fetch Menu once authenticated
  useEffect(() => {
    if (!token && !session && !routeParam) return;

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
  }, [token, session, routeParam]);

  const handleSelectTable = async (tableNum) => {
    setActivatingTable(tableNum);
    try {
      await activateDemoTable(tableNum);
      toast.success(`Connected to Table ${tableNum}!`);
    } catch (err) {
      toast.error(`Could not connect to Table ${tableNum}: ${err.message}`);
    } finally {
      setActivatingTable(null);
    }
  };

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
    toast.success(`Added ${item.name}`, { duration: 1500 });
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

  // Dispatch Dine-In Order with explicit tableNumber in payload
  const handleSubmitOrder = async ({ customerName, customerPhone, orderNotes, tableNumber: explicitTable }) => {
    if (cart.length === 0) return;
    if (!customerPhone || customerPhone.length < 10) {
      toast.error('A valid 10-digit phone number is required to place your table order.');
      return;
    }

    setIsSubmitting(true);
    const finalTableNum = explicitTable || tableNumber || '01';

    try {
      const payload = {
        order_type: 'dine_in',
        tableNumber: finalTableNum,
        table_number: finalTableNum,
        customer_name: customerName,
        customer_phone: customerPhone,
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
        setActiveOrder(res.order);
        setActiveOrderId(res.order.id);
        toast.success(`Order ${res.order.order_number || ''} placed for Table ${finalTableNum}!`);
      }
    } catch (err) {
      toast.error(`Order failed: ${err.message || 'Please contact server'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#D9480F] flex items-center justify-center mb-4 animate-spin shadow-xs">
          <Coffee className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#1F2937]">Connecting to Table {tableNumber || routeParam}...</h2>
        <p className="text-xs text-stone-500 mt-1">Establishing direct kitchen-linked dining session</p>
      </div>
    );
  }

  // Table Selection Screen if accessed without parameter
  if (!session && !token && !routeParam) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-[#D9480F] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
              {tenant?.brandName || 'Foodie'} Table Service
            </h1>
            <p className="text-xs text-stone-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Every table has its own unique QR code. Select your table below or point your camera at your table sticker.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider text-center">
              Choose Dining Table
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PHYSICAL_TABLES.map((tbl) => (
                <button
                  key={tbl.number}
                  disabled={activatingTable !== null}
                  onClick={() => handleSelectTable(tbl.number)}
                  className="border border-stone-200/80 hover:border-[#D9480F] rounded-xl p-3 text-left bg-stone-50/50 hover:bg-orange-50/30 transition-all shadow-2xs flex flex-col justify-between group active:scale-95"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl group-hover:scale-110 transition-transform">{tbl.icon}</span>
                    <span className="text-[11px] font-mono font-extrabold text-[#D9480F] bg-orange-100/70 px-2 py-0.5 rounded-md">
                      TABLE {tbl.number}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#1F2937] truncate">
                      {tbl.zone}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Seats {tbl.capacity}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D9480F] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#1F2937] leading-relaxed">
              <strong className="text-[#D9480F]">Real Spot Routing:</strong> When scanning a physical QR sticker, you are automatically routed to your exact table.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTableNum = tableNumber || String(routeParam).replace(/^TABLE-/i, '') || '01';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1F2937] flex flex-col font-sans pb-32">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D9480F] text-white flex items-center justify-center shadow-xs">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-[#1F2937] tracking-tight">
              {session?.tenant_name || tenant?.brandName || 'Foodie Bistro'}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D9480F]">
              <Lock className="w-3 h-3 text-[#D9480F]" />
              <span className="font-bold uppercase">
                TABLE {currentTableNum}
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500 text-[10px]">Spot QR Verified</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Switch dining table?')) {
                clearSession();
                navigate('/order');
              }
            }}
            className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-xl border border-stone-200/80 bg-white/60 hover:bg-stone-50 transition"
          >
            Switch Table
          </button>

          {totalCartCount > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3.5 py-2 bg-[#D9480F] hover:bg-[#C23E0A] text-white rounded-xl flex items-center gap-2 shadow-xs active:scale-95 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono font-bold text-xs">{formatCurrency(cartSubtotal)}</span>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-stone-900 font-mono text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                {totalCartCount}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Security Banner with Scanned Table Isolation */}
      <div className="bg-[#1F2937] text-white px-4 py-2 text-center text-[11px] font-medium flex items-center justify-center gap-2 shadow-xs">
        <ShieldCheck className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        <span>Spot Connected: Kitchen orders will be delivered directly to TABLE {currentTableNum}.</span>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
        <div className="pt-5 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search dishes, desserts, beverages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-2xs placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition"
            />
          </div>
        </div>

        <div className="py-2 overflow-x-auto flex gap-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-[#D9480F] text-white shadow-xs'
                : 'bg-white/80 text-stone-600 border border-stone-200/80 hover:bg-stone-50'
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
                  ? 'bg-[#D9480F] text-white shadow-xs'
                  : 'bg-white/80 text-stone-600 border border-stone-200/80 hover:bg-stone-50'
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        <main className="py-4">
          {menuLoading ? (
            <div className="py-20 text-center text-stone-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 opacity-50 text-[#D9480F]" />
              <p className="text-xs font-semibold">Loading Fresh Dining Menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center text-stone-400 bg-white/80 rounded-2xl p-8 border border-stone-200/80 shadow-sm">
              <Coffee className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#D9480F]" />
              <p className="text-sm font-bold text-stone-700">No dishes found</p>
              <p className="text-xs text-stone-400 mt-1">Try another category or search keyword.</p>
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

      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-[#D9480F] hover:bg-[#C23E0A] text-white font-bold flex items-center justify-between shadow-lg shadow-orange-950/20 active:scale-98 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-white/20 text-white font-mono text-xs flex items-center justify-center font-bold">
                {totalCartCount}
              </span>
              <span className="text-sm">Table {currentTableNum} Order</span>
            </div>
            <span className="font-mono text-base">{formatCurrency(cartSubtotal)} →</span>
          </button>
        </div>
      )}

      <QRCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        tableNumber={currentTableNum}
        onUpdateQty={handleUpdateQty}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmitting}
      />

      {activeOrderId && (
        <QROrderTracker
          orderId={activeOrderId}
          initialOrder={activeOrder}
          onClose={() => {
            setActiveOrderId(null);
            setActiveOrder(null);
          }}
          onNewOrder={() => {
            setActiveOrderId(null);
            setActiveOrder(null);
          }}
        />
      )}
    </div>
  );
}
