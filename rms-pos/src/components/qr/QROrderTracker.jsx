import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../api/client';
import { CheckCircle2, Flame, Bell, Clock, RefreshCw, ChefHat, Sparkles, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function QROrderTracker({ orderId, initialOrder = null, onClose, onNewOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState(null);
  const hasVibratedRef = useRef(false);

  const fetchStatus = async () => {
    try {
      const data = await apiRequest(`/orders/${orderId}`);
      if (data && data.order) {
        setOrder(data.order);
        if (data.order.status === 'ready' && !hasVibratedRef.current) {
          hasVibratedRef.current = true;
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Could not fetch order status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [orderId]);

  const status = (order?.status || 'new').toLowerCase();
  const tokenNumber = order?.order_number || `#${orderId.slice(0, 6)}`;

  const steps = [
    { key: 'new', label: 'Received' },
    { key: 'cooking', label: 'Preparing' },
    { key: 'ready', label: 'Ready for Pickup' },
    { key: 'completed', label: 'Collected' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col overflow-y-auto animate-in fade-in duration-200 font-sans">
      {/* Sticky Header */}
      <header className="px-6 py-4 bg-white/90 backdrop-blur-md border-b border-stone-200/80 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center text-[#D9480F] shadow-xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-[#1F2937] text-base">Counter Pickup Ticket</h1>
            <p className="text-[11px] font-semibold text-[#D9480F]">Quick Service Restaurant (QSR)</p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:text-stone-900 transition active:scale-95"
          title="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-6 flex-1 max-w-lg mx-auto w-full space-y-6">
        {/* Massive Centered Token Box */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-stone-200/80 shadow-md text-center relative overflow-hidden">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
            YOUR PICKUP TOKEN
          </div>

          <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-[#D9480F] my-3 select-all">
            {tokenNumber}
          </div>

          <p className="text-xs text-stone-500 font-medium">
            Please watch the counter TV display board for this number.
          </p>

          {/* Dynamic Status Callout */}
          <div className="mt-6">
            {status === 'ready' && (
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500/80 text-emerald-950 flex flex-col items-center gap-2 animate-pulse shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-bounce">
                  <Bell className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="text-lg font-black tracking-tight text-emerald-800">
                  Ready for Pickup!
                </div>
                <p className="text-xs font-semibold text-emerald-700 max-w-xs leading-relaxed">
                  Please show this token and collect your fresh order at the counter.
                </p>
              </div>
            )}

            {status === 'cooking' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center justify-center gap-3">
                <Flame className="w-6 h-6 text-amber-500 animate-pulse shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-amber-900">Preparing your food...</p>
                  <p className="text-[11px] text-amber-700">The kitchen team is currently cooking your items.</p>
                </div>
              </div>
            )}

            {status === 'new' && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 flex items-center justify-center gap-3">
                <Clock className="w-6 h-6 text-[#D9480F] shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-stone-800">Order Received</p>
                  <p className="text-[11px] text-stone-500">Queued in kitchen queue. Cooking will begin shortly.</p>
                </div>
              </div>
            )}

            {status === 'completed' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-900">Order Completed & Collected</p>
                  <p className="text-[11px] text-emerald-700">Thank you for dining with us!</p>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Progress */}
          <div className="mt-8 relative flex justify-between items-center px-4">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-stone-200 -z-0" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-[#D9480F] transition-all duration-500 -z-0"
              style={{
                width: `${Math.max(0, (currentStepIdx / (steps.length - 1)) * 100)}%`,
              }}
            />

            {steps.map((st, idx) => {
              const isPastOrCurrent = currentStepIdx >= idx;
              return (
                <div key={st.key} className="flex flex-col items-center z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPastOrCurrent
                        ? 'bg-[#D9480F] text-white ring-4 ring-orange-100 shadow-xs'
                        : 'bg-white border-2 border-stone-200 text-stone-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1.5 ${
                      isPastOrCurrent ? 'text-[#1F2937]' : 'text-stone-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Breakdown */}
        {order && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-[#1F2937] text-sm">Receipt Summary</h3>

            <div className="space-y-2.5">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded-lg">
                      {item.quantity}x
                    </span>
                    <span className="font-semibold text-[#1F2937]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-stone-700">
                    {formatCurrency(parseFloat(item.unit_price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>GST / Tax</span>
                  <span className="font-mono">{formatCurrency(order.tax)}</span>
                </div>
              )}
              {order.service_charge > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Service Charge</span>
                  <span className="font-mono">{formatCurrency(order.service_charge)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#1F2937] text-sm pt-2 border-t border-stone-100">
                <span>Total Amount Paid</span>
                <span className="font-mono text-base text-[#D9480F]">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            onClick={onNewOrder}
            className="flex-1 py-3.5 px-4 bg-[#D9480F] hover:bg-[#C23E0A] text-white font-bold text-xs rounded-2xl shadow-sm transition active:scale-98"
          >
            Order More Items
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-2xl transition"
          >
            Close
          </button>
        </div>
      </main>
    </div>
  );
}

export default QROrderTracker;
