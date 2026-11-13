import { useState, useEffect } from 'react';
import { 
  Plus, Minus, Trash2, Printer, Check, ChevronDown, 
  Clock, ShoppingBag, MapPin, ChefHat, Sparkles, X, UserCheck, User
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { useTenant } from '../../context/TenantContext';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';
import CustomerSelectModal from '../modals/CustomerSelectModal';

export default function RightOrderPanel({ onClose }) {
  const {
    activeOrder,
    selectedOrderId,
    selectExistingOrder,
    startNewOrder,
    updateActiveMeta,
    updateCartItemQty,
    removeFromCart,
    orders,
    submitOrder,
    applyPromoCode,
    appliedPromo,
    setAppliedPromo,
    customers,
  } = usePOS();
  
  const { tenant } = useTenant();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [showQueueDropdown, setShowQueueDropdown] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer calculating real preparing time from order creation timestamp
  useEffect(() => {
    const calcElapsed = () => {
      if (!activeOrder?.createdAt) {
        setElapsedSeconds(0);
        return;
      }
      const created = new Date(activeOrder.createdAt).getTime();
      const diff = Math.max(0, Math.floor((Date.now() - created) / 1000));
      setElapsedSeconds(diff);
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeOrder?.createdAt, activeOrder?.id]);

  const formatTimer = (totalSeconds) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}h : ${m}m : ${s}s`;
  };

  const items = activeOrder?.items || [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceCharge = subtotal * (tenant.serviceChargePercent / 100);
  const tax = subtotal * (tenant.taxPercent / 100);
  const discount = appliedPromo ? subtotal * (appliedPromo.discountPercent / 100) : (activeOrder?.discount || 0);
  const total = subtotal + serviceCharge + tax - discount;

  const handleApplyPromo = () => {
    setPromoError('');
    if (!promoInput.trim()) return;
    const result = applyPromoCode(promoInput.trim());
    if (!result.success) {
      setPromoError(result.error);
      toast.error(result.error || 'Invalid promo voucher');
    } else {
      setPromoInput('');
      toast.success('Promo voucher applied!');
    }
  };

  const handleCompleteOrder = () => {
    if (items.length === 0) return;
    const completed = submitOrder(tenant);
    if (completed) {
      setShowReceipt(true);
      toast.success('Ticket submitted & thermal invoice generated!');
    }
  };

  const activeQueueOrders = orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Cooking':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ready':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <aside className="w-full sm:w-[380px] xl:w-[375px] bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-10 select-none h-full">
      {/* Top Section: Order Queue Switcher */}
      <div>
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Order Queue</h2>
            {activeQueueOrders.length > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {activeQueueOrders.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowQueueDropdown(!showQueueDropdown)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 font-medium"
            >
              Show All
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={() => {
                startNewOrder();
                setShowQueueDropdown(false);
              }}
              className="text-white rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs hover:opacity-95"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Plus className="w-3 h-3" />
              New Order
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="xl:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                title="Close Order Panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Show All Queue Slide-Down Menu */}
          {showQueueDropdown && (
            <div className="absolute right-0 top-9 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900">Active Live Tickets</span>
                <button onClick={() => setShowQueueDropdown(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeQueueOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No pending queue tickets</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {activeQueueOrders.map((ord) => (
                    <button
                      key={ord.id}
                      onClick={() => {
                        selectExistingOrder(ord.id);
                        setShowQueueDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                        selectedOrderId === ord.id ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-slate-800">{ord.orderId}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                          {ord.customerName || 'Walk-in'} • {ord.tableNumber ? `T-${ord.tableNumber}` : ord.orderType}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(ord.status)}`}>
                        {ord.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Order Metadata Card */}
        <div className="border border-slate-200 rounded-2xl p-3.5 mt-3 shadow-xs bg-white">
          {/* Row 1: Order ID + Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">
              Order : <span className="font-mono">{activeOrder.orderId}</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${getStatusColor(
                activeOrder.status
              )}`}
            >
              {activeOrder.status}
            </span>
          </div>

          {/* Row 2: Customer Name / Guest Row */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="flex-1 text-left px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  {activeOrder.customerName ? activeOrder.customerName : 'Walk-in Guest'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-1">
                {activeOrder.customerName ? 'Change' : '+ Guest'}
              </span>
            </button>
          </div>

          {/* Row 3: Date & Table # Metadata Rows */}
          <div className="flex items-center justify-between mt-2.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              {new Date(activeOrder.createdAt || Date.now()).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })}
            </span>

            <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Table</span>
              <input
                type="text"
                placeholder="04"
                value={activeOrder.tableNumber || ''}
                onChange={(e) => updateActiveMeta({ tableNumber: e.target.value })}
                className="w-8 border border-slate-200 rounded-md text-center text-xs font-bold py-0.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: 3-Column Gray Info Box */}
          <div className="bg-slate-50 rounded-xl p-2.5 mt-3 grid grid-cols-3 text-center gap-1 border border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400">Preparing time</p>
              <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                {formatTimer(elapsedSeconds)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Items</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Orders</p>
              <select
                value={activeOrder.orderType || 'Dine-In'}
                onChange={(e) => updateActiveMeta({ orderType: e.target.value })}
                className="text-xs font-bold text-slate-800 mt-0.5 bg-transparent focus:outline-none cursor-pointer text-center"
              >
                <option value="Dine-In">Dine-In</option>
                <option value="Delivery">Delivery</option>
                <option value="Takeaway">Takeaway</option>
              </select>
            </div>
          </div>
        </div>

        {/* Middle Section: Food Preparing / Active Cart Items */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Food Preparing
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {items.length} dishes in ticket
            </span>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                <ShoppingBag className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-medium text-slate-500">Draft ticket is empty</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click any product on the left to add</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200/90 rounded-2xl p-2.5 bg-white shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex gap-2.5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 bg-slate-100"
                      onError={(e) => {
                        e.target.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
                      
                      {item.extras?.length > 0 && (
                        <p className="text-[10px] text-emerald-700 font-medium mt-0.5 truncate">
                          Extras: {item.extras.join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[10px] text-amber-700 italic truncate mt-0.5">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 shrink-0 self-start transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom Row: Formatted subtotal on left + soft green pill on right with Qty */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-[#1F2937] font-mono">
                      {formatCurrency(item.price * item.quantity)}
                    </span>

                    <div
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-emerald-800 border border-emerald-200"
                      style={{ backgroundColor: 'var(--brand-primary-light)' }}
                    >
                      <button
                        onClick={() => updateCartItemQty(item.id, -1)}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>

                      <span className="min-w-[42px] text-center text-[11px] font-bold">
                        Qty : {item.quantity}
                      </span>

                      <button
                        onClick={() => updateCartItemQty(item.id, 1)}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Dynamic Tax & Billing Calculator */}
      <div className="mt-4 border-t border-slate-200 pt-3">
        {/* Promo Voucher Bar */}
        <div className="flex gap-2 mb-2.5">
          <input
            type="text"
            placeholder="Promo voucher (e.g. WELCOME10)"
            value={promoInput}
            onChange={(e) => {
              setPromoInput(e.target.value);
              setPromoError('');
            }}
            className="flex-1 uppercase font-mono tracking-wider border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1"
            style={{ '--tw-ring-color': 'var(--brand-primary)' }}
          />
          <button
            onClick={handleApplyPromo}
            className="text-white rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-xs hover:opacity-95 transition"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Apply
          </button>
        </div>

        {promoError && <p className="text-[10px] text-rose-500 mb-2 font-medium">{promoError}</p>}

        {appliedPromo && (
          <div className="flex items-center justify-between text-xs mb-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
            <span className="text-emerald-800 font-semibold text-[11px]">
              {appliedPromo.code} applied ({appliedPromo.discountPercent}% OFF)
            </span>
            <button
              onClick={() => {
                setAppliedPromo(null);
                setPromoInput('');
              }}
              className="text-emerald-700 hover:text-emerald-900 text-[10px] font-bold"
            >
              Remove
            </button>
          </div>
        )}

        {/* Dynamic Financial Rows */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Sub total</span>
            <span className="font-semibold text-slate-700 font-mono">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-slate-500">
            <span>Service Charge ({tenant.serviceChargePercent}%)</span>
            <span className="font-semibold text-slate-700 font-mono">
              {formatCurrency(serviceCharge)}
            </span>
          </div>

          <div className="flex justify-between text-slate-500">
            <span>Tax ({tenant.taxPercent}%)</span>
            <span className="font-semibold text-slate-700 font-mono">
              {formatCurrency(tax)}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount / Promo</span>
              <span className="font-mono">-{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
            <span>Total Amount</span>
            <span className="font-mono text-base font-extrabold" style={{ color: 'var(--brand-primary)' }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Action Buttons: Print Bill & Complete */}
        <div className="grid grid-cols-2 gap-3 mt-3.5">
          <button
            onClick={() => setShowReceipt(true)}
            disabled={items.length === 0}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Print Bill
          </button>

          <button
            onClick={handleCompleteOrder}
            disabled={items.length === 0}
            className="text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs hover:opacity-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Check className="w-3.5 h-3.5" />
            {selectedOrderId ? (activeOrder.status === 'Ready' ? 'Finish / Close' : 'Advance Stage') : 'Complete Order'}
          </button>
        </div>
      </div>

      {/* 80mm Printable Thermal Receipt Modal */}
      {showReceipt && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowReceipt(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-[320px] max-h-[90vh] overflow-y-auto print-area shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">{tenant.brandName}</h3>
              <p className="text-[10px] text-slate-500">{tenant.tagline}</p>
              <p className="text-[10px] text-slate-500 mt-1">{tenant.address}</p>
              <p className="text-[10px] text-slate-500">{tenant.phone}</p>
            </div>

            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <div className="flex justify-between">
                <span>Ticket:</span>
                <span className="font-mono font-bold text-slate-900">{activeOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Guest:</span>
                <span className="font-semibold text-slate-800">{activeOrder.customerName || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span>{activeOrder.orderType} {activeOrder.tableNumber ? `(Table #${activeOrder.tableNumber})` : ''}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Date:</span>
                <span>{new Date(activeOrder.createdAt || Date.now()).toLocaleString()}</span>
              </div>
            </div>

            {/* Line items table */}
            <div className="border-t border-dashed border-slate-300 pt-2 mb-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1">
                  <div className="pr-2">
                    <span className="font-bold">{item.quantity}x</span> {item.name}
                    {item.extras?.length > 0 && (
                      <span className="block text-[9px] text-slate-400">+{item.extras.join(', ')}</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial breakdown */}
            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Service Charge ({tenant.serviceChargePercent}%)</span>
                <span className="font-mono">{formatCurrency(serviceCharge)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax ({tenant.taxPercent}%)</span>
                <span className="font-mono">{formatCurrency(tax)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Promo Discount</span>
                  <span className="font-mono">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-dashed border-slate-300 text-slate-900">
                <span>TOTAL PAID</span>
                <span className="font-mono">{formatCurrency(total)}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-4 italic leading-tight">
              {tenant.receiptFooter}
            </p>

            <div className="flex gap-2 mt-5 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 border border-slate-200 rounded-xl py-2 text-xs font-semibold hover:bg-slate-50 transition"
              >
                🖨️ Thermal Print
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 text-white rounded-xl py-2 text-xs font-semibold shadow-xs"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer / Guest Selection Modal */}
      {showCustomerModal && (
        <CustomerSelectModal
          onClose={() => setShowCustomerModal(false)}
          onSelectCustomer={(custName) => {
            updateActiveMeta({ customerName: custName });
          }}
        />
      )}
    </aside>
  );
}
