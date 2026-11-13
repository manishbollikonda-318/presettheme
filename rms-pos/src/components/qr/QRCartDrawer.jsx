import { useState } from 'react';
import { ShoppingBag, X, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { formatCurrency } from '../../utils/currency';

export function QRCartDrawer({
  isOpen,
  onClose,
  cart,
  tableNumber,
  onUpdateQty,
  onSubmitOrder,
  isSubmitting,
}) {
  const { tenant } = useTenant();
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Dynamic calculations driven strictly by tenant context
  const taxRate = tenant?.taxPercent ?? 5.0;
  const serviceRate = tenant?.serviceChargePercent ?? 0.0;
  const tax = (subtotal * taxRate) / 100;
  const serviceCharge = (subtotal * serviceRate) / 100;
  const total = subtotal + tax + serviceCharge;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      {/* Tap backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Bottom Sheet Drawer with iOS Safe-Area Padding */}
      <div className="bg-[#FAF9F6] rounded-t-[32px] max-h-[88vh] flex flex-col shadow-2xl border-t border-stone-200 overflow-hidden pb-[max(1.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 animate-in slide-in-from-bottom">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-white/90 backdrop-blur-md border-b border-stone-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center text-[#D9480F] shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-[#1F2937] text-base">Your Table Order</h2>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D9480F]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D9480F]" />
                <span>Locked to Table #{tableNumber}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <p className="text-sm font-semibold">Your bag is empty</p>
              <p className="text-xs text-stone-400 mt-1">Select artisanal bites or brews to place order.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1F2937] text-sm truncate">{item.name}</p>
                  <p className="text-xs font-semibold text-[#D9480F] mt-0.5 font-mono">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 bg-stone-100 border border-stone-200/80 rounded-full px-2 py-1">
                  <button
                    onClick={() => onUpdateQty(item.id, -1)}
                    className="w-6 h-6 rounded-full bg-white text-stone-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-stone-50 active:scale-95 transition"
                  >
                    -
                  </button>
                  <span className="font-bold text-[#1F2937] text-xs font-mono w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="w-6 h-6 rounded-full bg-[#D9480F] text-white flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-[#C23E0A] active:scale-95 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <div className="pt-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Guest Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aryan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kitchen Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, extra sauce please"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition"
                  maxLength={200}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary & Order Dispatch */}
        {cart.length > 0 && (
          <div className="p-6 bg-white/95 backdrop-blur-md border-t border-stone-200/80 space-y-3 shrink-0">
            {/* Dynamic Tax Breakdown */}
            <div className="space-y-1.5 text-xs text-stone-600 border-b border-stone-100 pb-3">
              <div className="flex items-center justify-between">
                <span>Items Subtotal ({totalItemCount})</span>
                <span className="font-mono font-semibold text-[#1F2937]">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>GST / Taxes ({taxRate}%)</span>
                <span className="font-mono">
                  {formatCurrency(tax)}
                </span>
              </div>
              {serviceRate > 0 && (
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>Service Charge ({serviceRate}%)</span>
                  <span className="font-mono">
                    {formatCurrency(serviceCharge)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 text-sm font-bold text-[#1F2937]">
                <span>Total Payable</span>
                <span className="font-mono text-base text-[#D9480F]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              onClick={() => onSubmitOrder({ customerName, orderNotes })}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#D9480F] hover:bg-[#C23E0A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-98 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Dispatching Order...</span>
              ) : (
                <>
                  <span>Send Ticket to Kitchen ({formatCurrency(total)})</span>
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
export default QRCartDrawer;
