import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePOS } from '../context/POSContext';
import { apiRequest, connectOrderSSE } from '../api/client';
import { KDSOrderCard } from '../components/kds/KDSOrderCard';
import toast from 'react-hot-toast';
import {
  ChefHat,
  Volume2,
  VolumeX,
  Search,
  Filter,
  CheckCircle2,
  Flame,
  Clock,
  RefreshCw,
  Utensils
} from 'lucide-react';

export default function OrdersView() {
  const { user } = useAuth();
  const { orders: localOrders, updateOrderStatus: updateLocalOrderStatus, products, updateProduct } = usePOS();

  const [orders, setOrders] = useState([]);
  const [filterTab, setFilterTab] = useState('ACTIVE'); // ACTIVE | COOKING | READY | ALL
  const [search, setSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Play audio chime on new kitchen ticket
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext might be blocked before first user interaction
    }
  }, [soundEnabled]);

  // Initial load: Fetch live orders from backend or fallback to local context
  const fetchLiveOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/orders');
      if (data && data.orders) {
        setOrders(data.orders);
        return;
      }
    } catch (err) {
      console.warn('API /orders fallback to local context', err);
    } finally {
      setIsLoading(false);
    }
    // Fallback if backend offline
    setOrders(localOrders);
  }, [localOrders]);

  useEffect(() => {
    fetchLiveOrders();
  }, [fetchLiveOrders]);

  // Connect SSE for Real-time KDS auto-population
  useEffect(() => {
    let sse;
    try {
      sse = connectOrderSSE((event, data) => {
        if (event === 'order.new') {
          playChime();
          setOrders((prev) => [data, ...prev.filter((o) => o.id !== data.id)]);
        } else if (event === 'order.status_changed') {
          setOrders((prev) =>
            prev.map((o) => (o.id === data.id ? { ...o, ...data } : o))
          );
        }
      });
    } catch (err) {
      console.warn('SSE connection unavailable, running on polling fallback', err);
    }

    return () => {
      if (sse) sse.close();
    };
  }, [playChime]);

  // Handle status transitions (Start Cooking / Mark Ready / Bump)
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Ticket status: ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.warn('PATCH /orders/:id/status failed, applying local fallback', err);
      updateLocalOrderStatus(orderId, newStatus.charAt(0).toUpperCase() + newStatus.slice(1));
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Ticket status: ${newStatus.toUpperCase()}`);
    }
  };

  // Filter pipeline
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusLower = (o.status || '').toLowerCase();
      let matchTab = true;

      if (filterTab === 'ACTIVE') {
        matchTab = statusLower === 'new' || statusLower === 'cooking' || statusLower === 'ready';
      } else if (filterTab === 'COOKING') {
        matchTab = statusLower === 'cooking';
      } else if (filterTab === 'READY') {
        matchTab = statusLower === 'ready';
      }

      const matchSearch =
        !search ||
        (o.order_number || o.orderId || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.table_number || o.tableNumber || '').toString().includes(search) ||
        (o.customer_name || o.customerName || '').toLowerCase().includes(search.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [orders, filterTab, search]);

  const activeCount = orders.filter((o) => ['new', 'cooking'].includes((o.status || '').toLowerCase())).length;
  const readyCount = orders.filter((o) => (o.status || '').toLowerCase() === 'ready').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F1117] text-slate-100 overflow-hidden font-sans select-none">
      {/* KDS Top Bar */}
      <header className="px-6 py-4 bg-[#141720] border-b border-[#2A2D3A] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              KITCHEN DISPLAY SYSTEM
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Real-time ticket dispatch & color-coded order prep timers
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1A1D27] px-3.5 py-1.5 rounded-xl border border-[#2A2D3A]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">
              In Prep: <strong className="text-amber-400 font-mono text-sm">{activeCount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#1A1D27] px-3.5 py-1.5 rounded-xl border border-[#2A2D3A]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-slate-300">
              Ready: <strong className="text-emerald-400 font-mono text-sm">{readyCount}</strong>
            </span>
          </div>

          <button
            onClick={() => setShowStockModal(true)}
            className="px-3.5 py-2 bg-[#1A1D27] hover:bg-[#232736] border border-[#2A2D3A] rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2 transition"
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            86'd Stock
          </button>

          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2.5 rounded-xl border transition ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-[#1A1D27] border-[#2A2D3A] text-slate-500'
            }`}
            title={soundEnabled ? 'Mute notification chime' : 'Enable notification chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={fetchLiveOrders}
            className="p-2.5 bg-[#1A1D27] hover:bg-[#232736] border border-[#2A2D3A] text-slate-400 hover:text-white rounded-xl transition"
            title="Refresh order queue"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Control Strip & Filters */}
      <div className="px-6 py-3 bg-[#11141C] border-b border-[#2A2D3A]/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          {[
            { id: 'ACTIVE', label: 'All Active Prep' },
            { id: 'COOKING', label: 'Cooking' },
            { id: 'READY', label: 'Ready for Service' },
            { id: 'ALL', label: 'Complete History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-[#1A1D27] text-slate-400 hover:text-slate-200 border border-[#2A2D3A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticket, table, guest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-[#1A1D27] border border-[#2A2D3A] rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-56 transition"
          />
        </div>
      </div>

      {/* High-Contrast Responsive Card Grid */}
      <main className="flex-1 p-6 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <ChefHat className="w-16 h-16 stroke-1 mb-3 opacity-40 text-slate-400" />
            <p className="text-base font-bold text-slate-400">Order queue is empty</p>
            <p className="text-xs text-slate-600 mt-1">
              New customer QR tickets and POS orders will pop up here in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {filteredOrders.map((order) => (
              <KDSOrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </main>

      {/* 86 Stock Control Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2D3A]">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-slate-100 text-lg">Kitchen 86'd Stock Control</h3>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-4">
              Toggle items out of stock when kitchen ingredients run dry. Out-of-stock items are instantly grayed out on POS and Customer QR menus.
            </p>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#141720] border border-[#2A2D3A]"
                >
                  <div className="flex items-center gap-3">
                    {prod.image && (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-200">{prod.name}</p>
                      <p className="text-xs text-slate-500 font-mono">₹{prod.price}</p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const nextState = !prod.inStock;
                      try {
                        await apiRequest(`/menu/items/${prod.id}/stock`, {
                          method: 'PATCH',
                          body: JSON.stringify({ is_available: nextState }),
                        });
                      } catch {
                        // local fallback
                      }
                      updateProduct(prod.id, { inStock: nextState });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                      prod.inStock
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                    }`}
                  >
                    {prod.inStock ? 'In Stock' : "86'd (Sold Out)"}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-3 border-t border-[#2A2D3A] text-right">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
