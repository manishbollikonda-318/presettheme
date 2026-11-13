import { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { CheckCircle2, Flame, Bell, Clock, RefreshCw, ChefHat, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function QROrderTracker({ orderId, onClose, onNewOrder }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      const data = await apiRequest(`/orders/${orderId}`);
      if (data && data.order) {
        setOrder(data.order);
      }
    } catch (err) {
      setError(err.message || 'Could not fetch order status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds for status changes
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const status = (order?.status || 'new').toLowerCase();

  const steps = [
    { key: 'new', label: 'Received', desc: 'Ticket logged in queue' },
    { key: 'cooking', label: 'Preparing', desc: 'Chef is crafting your order' },
    { key: 'ready', label: 'Ready', desc: 'Ready for table service' },
    { key: 'completed', label: 'Served', desc: 'Enjoy your meal!' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col overflow-y-auto animate-in fade-in duration-200 font-sans">
      {/* Header */}
      <header className="px-6 py-4 bg-white/90 backdrop-blur-md border-b border-stone-200/80 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center text-[#D9480F] shadow-xs">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-[#1F2937] text-base">Live Order Status</h1>
            <p className="text-[11px] font-semibold text-[#D9480F]">
              {order ? `Ticket ${order.order_number || `#${orderId.slice(0, 6)}`}` : 'Connecting...'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:text-stone-900 transition active:scale-95"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Main Status Feed */}
      <main className="p-6 flex-1 max-w-lg mx-auto w-full space-y-6">
        {/* Progress Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-200/80 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 text-[#D9480F] flex items-center justify-center mb-3 shadow-xs">
            {status === 'cooking' ? (
              <Flame className="w-8 h-8 animate-pulse text-amber-500" />
            ) : status === 'ready' ? (
              <Bell className="w-8 h-8 animate-bounce text-emerald-600" />
            ) : status === 'completed' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <Clock className="w-8 h-8 text-[#D9480F]" />
            )}
          </div>

          <h2 className="text-xl font-bold text-[#1F2937] capitalize">
            {status === 'cooking' ? 'Preparing Your Bites' : status === 'ready' ? 'Order Is Ready!' : status === 'completed' ? 'Order Completed' : 'Order Received'}
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {status === 'cooking'
              ? 'Our kitchen team has fired up your ticket. Estimated prep time: ~10-15 mins.'
              : status === 'ready'
              ? 'Your order is plated and on its way to your table.'
              : status === 'completed'
              ? 'Hope you had a wonderful dining experience!'
              : 'Your ticket has reached the kitchen display screen.'}
          </p>

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

        {/* Order Items Breakdown */}
        {order && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-[#1F2937] text-sm">Ticket Details</h3>

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
                <span>Total Amount</span>
                <span className="font-mono text-base text-[#D9480F]">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-3">
          <button
            onClick={onNewOrder}
            className="flex-1 py-3 px-4 bg-[#D9480F] hover:bg-[#C23E0A] text-white font-bold text-xs rounded-2xl shadow-sm transition active:scale-98"
          >
            Order More Items
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-2xl transition"
          >
            Close View
          </button>
        </div>
      </main>
    </div>
  );
}
export default QROrderTracker;
