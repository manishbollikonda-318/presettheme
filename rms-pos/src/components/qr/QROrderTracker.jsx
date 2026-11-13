import { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { CheckCircle2, Flame, Bell, Clock, RefreshCw, ChefHat, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col overflow-y-auto animate-fade-in">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-emerald-900/5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 text-base">Live Order Status</h1>
            <p className="text-[11px] font-semibold text-emerald-700">
              {order ? `Order ${order.order_number || `#${orderId.slice(0, 6)}`}` : 'Connecting...'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Main Status Feed */}
      <main className="p-6 flex-1 max-w-lg mx-auto w-full space-y-6">
        {/* Progress Card */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-900/5 shadow-xs text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            {status === 'cooking' ? (
              <Flame className="w-8 h-8 animate-pulse text-amber-500" />
            ) : status === 'ready' ? (
              <Bell className="w-8 h-8 animate-bounce text-emerald-600" />
            ) : status === 'completed' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <Clock className="w-8 h-8 text-blue-500" />
            )}
          </div>

          <h2 className="text-xl font-extrabold text-slate-800 capitalize">
            {status === 'cooking' ? 'Preparing Your Bites' : status === 'ready' ? 'Order Is Ready!' : status === 'completed' ? 'Order Completed' : 'Order Received'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {status === 'cooking'
              ? 'Our kitchen team has fired up your ticket. Estimated prep time: ~10-15 mins.'
              : status === 'ready'
              ? 'Your order is plated and on its way to your table.'
              : status === 'completed'
              ? 'Hope you had a wonderful dining experience at LOC!'
              : 'Your ticket has reached the kitchen display screen.'}
          </p>

          {/* Stepper Progress */}
          <div className="mt-8 relative flex justify-between items-center px-4">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 -z-0"
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
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 shadow-xs'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1.5 ${
                      isPastOrCurrent ? 'text-emerald-900' : 'text-slate-400'
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
          <div className="bg-white rounded-3xl p-6 border border-emerald-900/5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Ticket Details</h3>

            <div className="space-y-2.5">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.quantity}x
                    </span>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-700">
                    ₹{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">₹{order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST Tax</span>
                <span className="font-mono">₹{order.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="font-mono text-emerald-800">₹{order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button
            onClick={onNewOrder}
            className="flex-1 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl transition shadow-md shadow-emerald-900/20 active:scale-98"
          >
            Add More Items
          </button>
        </div>
      </main>
    </div>
  );
}
