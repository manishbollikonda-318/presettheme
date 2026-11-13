import { useState, useEffect, useRef } from 'react';
import { apiRequest, connectOrderSSE } from '../api/client';
import { useTenant } from '../context/TenantContext';
import { Flame, Bell, Maximize, Minimize, Wifi, Utensils, RefreshCw, Volume2, VolumeX } from 'lucide-react';

export default function PickupBoardView() {
  const { tenant } = useTenant();
  const [preparing, setPreparing] = useState([]);
  const [ready, setReady] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastAnnounced, setLastAnnounced] = useState(null);

  // Digital clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Soft notification sound synthesizer using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio context policy fallback
    }
  };

  // Initial load & periodic fallback refresh
  const fetchBoardData = async () => {
    try {
      const data = await apiRequest('/orders/pickup-board');
      if (data) {
        if (Array.isArray(data.preparing)) setPreparing(data.preparing);
        if (Array.isArray(data.ready)) setReady(data.ready);
      }
    } catch (err) {
      console.warn('Pickup board fallback fetch', err);
    }
  };

  useEffect(() => {
    fetchBoardData();
    const pollInterval = setInterval(fetchBoardData, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  // Real-time SSE Connection
  useEffect(() => {
    let sse;
    try {
      sse = connectOrderSSE((eventType, data) => {
        setIsConnected(true);
        if (!data) return;

        const orderNum = data.order_number || data.orderNumber;
        const status = (data.status || '').toLowerCase();
        const orderId = data.id || `order-${Date.now()}`;

        if (eventType === 'order.new') {
          setPreparing((prev) => {
            if (prev.some((o) => o.order_number === orderNum)) return prev;
            return [...prev, { id: orderId, order_number: orderNum, created_at: new Date().toISOString() }];
          });
        } else if (eventType === 'order.status_changed') {
          if (status === 'cooking' || status === 'new') {
            setReady((prev) => prev.filter((o) => o.order_number !== orderNum));
            setPreparing((prev) => {
              if (prev.some((o) => o.order_number === orderNum)) return prev;
              return [...prev, { id: orderId, order_number: orderNum, created_at: new Date().toISOString() }];
            });
          } else if (status === 'ready') {
            setPreparing((prev) => prev.filter((o) => o.order_number !== orderNum));
            setReady((prev) => {
              if (prev.some((o) => o.order_number === orderNum)) return prev;
              playChime();
              setLastAnnounced(orderNum);
              return [...prev, { id: orderId, order_number: orderNum, updated_at: new Date().toISOString() }];
            });
          } else if (status === 'completed' || status === 'cancelled') {
            setPreparing((prev) => prev.filter((o) => o.order_number !== orderNum));
            setReady((prev) => prev.filter((o) => o.order_number !== orderNum));
          }
        }
      });

      if (sse) {
        sse.onopen = () => setIsConnected(true);
        sse.onerror = () => setIsConnected(false);
      }
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (sse) sse.close();
    };
  }, [soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Banner (Header) */}
      <header className="px-6 py-4 bg-[#0E121E] border-b border-slate-800 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D9480F] text-white flex items-center justify-center shadow-lg shadow-orange-950/50">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
              {tenant?.brandName || 'Foodie Bistro'}
            </h1>
            <p className="text-xs font-bold text-amber-400 tracking-wider">
              ORDER STATUS DISPLAY • COUNTER PICKUP
            </p>
          </div>
        </div>

        {/* Live Status, Clock & Controls */}
        <div className="flex items-center gap-4">
          {/* Live Sync Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-mono text-[11px]">
              {isConnected ? 'LIVE SYNC' : 'POLLING'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title="Toggle TV Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Digital Clock */}
          <div className="font-mono text-xl sm:text-2xl font-black text-white bg-slate-900 px-4 py-1.5 rounded-xl border border-slate-800 tracking-wider">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
        </div>
      </header>

      {/* Main Dual-Column Board */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
        {/* Left Column: PREPARING (Cooking) */}
        <section className="flex flex-col bg-[#0A0D15] border-b md:border-b-0 md:border-r border-slate-800 p-6 sm:p-8 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b-2 border-amber-500/80 mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wider uppercase">
                Preparing
              </h2>
            </div>
            <span className="text-sm font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
              {preparing.length} TICKETS
            </span>
          </div>

          {preparing.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center py-12">
              <Flame className="w-12 h-12 mb-3 stroke-[1.5] text-slate-700" />
              <p className="text-lg font-bold text-slate-500">All tickets currently cleared</p>
              <p className="text-xs text-slate-600 mt-1">New customer orders will appear here automatically</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-min">
              {preparing.map((item) => (
                <div
                  key={item.id || item.order_number}
                  className="bg-[#121624] border-2 border-amber-500/30 hover:border-amber-500 rounded-2xl p-5 text-center transition-all duration-300 shadow-md group"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    TOKEN
                  </span>
                  <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-amber-300 tracking-wider group-hover:scale-105 inline-block transition-transform">
                    {item.order_number}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: PLEASE COLLECT (Ready for Pickup) */}
        <section className="flex flex-col bg-[#070F0C] p-6 sm:p-8 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-500 mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-wider uppercase">
                Please Collect
              </h2>
            </div>
            <span className="text-sm font-mono font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
              {ready.length} READY
            </span>
          </div>

          {ready.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center py-12">
              <Bell className="w-12 h-12 mb-3 stroke-[1.5] text-slate-700" />
              <p className="text-lg font-bold text-slate-500">No ready orders waiting</p>
              <p className="text-xs text-slate-600 mt-1">Orders marked ready by the kitchen will flash here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-min">
              {ready.map((item) => {
                const isJustAnnounced = lastAnnounced === item.order_number;
                return (
                  <div
                    key={item.id || item.order_number}
                    className={`bg-emerald-950/40 border-3 border-emerald-500/80 rounded-3xl p-6 text-center transition-all duration-300 shadow-xl shadow-emerald-950/60 flex flex-col items-center justify-center ${
                      isJustAnnounced ? 'animate-bounce ring-4 ring-emerald-400' : 'animate-pulse'
                    }`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300 block mb-1">
                      COLLECT AT COUNTER
                    </span>
                    <span className="font-mono text-4xl sm:text-5xl lg:text-6xl font-black text-emerald-300 tracking-wider">
                      {item.order_number}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer Ticker */}
      <footer className="px-6 py-2.5 bg-[#0B0E18] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-300">
            Please show your digital receipt / token number at the pickup counter.
          </span>
        </div>
        <div className="hidden sm:block font-mono text-[11px] text-slate-500">
          LOC QR Restaurant OS • Real-Time QSR Kiosk Display
        </div>
      </footer>
    </div>
  );
}
