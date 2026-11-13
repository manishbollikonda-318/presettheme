import { useState } from 'react';
import { ShoppingBag, ChevronRight, X, Trash2, ArrowRight } from 'lucide-react';

export function QRCartDrawer({
  isOpen,
  onClose,
  cart,
  tableNumber,
  onUpdateQty,
  onSubmitOrder,
  isSubmitting,
}) {
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Tap backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Bottom Sheet Drawer */}
      <div className="bg-[#FAF9F6] rounded-t-[32px] max-h-[85vh] flex flex-col shadow-2xl border-t border-emerald-900/10 overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-white border-b border-emerald-950/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-base">Your Table Order</h2>
              <p className="text-[11px] font-semibold text-emerald-700">Table #{tableNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">Your bag is empty</p>
              <p className="text-xs text-slate-400 mt-1">Select artisanal bites or brews to place order.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3.5 border border-emerald-900/5 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                  <p className="text-xs font-mono font-semibold text-emerald-800 mt-0.5">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-full px-2 py-1">
                  <button
                    onClick={() => onUpdateQty(item.id, -1)}
                    className="w-6 h-6 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-2xs active:scale-95"
                  >
                    -
                  </button>
                  <span className="font-bold text-slate-800 text-xs font-mono w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-2xs active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <div className="pt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Guest Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aryan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kitchen Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less sugar, extra ice please"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                  maxLength={200}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary & Order Dispatch */}
        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-emerald-950/5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Estimated Subtotal</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              *Taxes and service charges are computed securely on order ticket generation.
            </p>

            <button
              disabled={isSubmitting}
              onClick={() => onSubmitOrder({ customerName, orderNotes })}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-800/20 active:scale-98 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Dispatching Order...</span>
              ) : (
                <>
                  <span>Send Ticket to Kitchen (₹{subtotal.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
