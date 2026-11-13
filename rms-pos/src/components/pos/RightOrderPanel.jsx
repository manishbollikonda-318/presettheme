import { useState, useEffect } from 'react';
import { 
  Plus, Minus, Trash2, Printer, Check, ChevronDown, 
  Clock, ShoppingBag, MapPin, ChefHat, Sparkles, X, UserCheck, User, RefreshCw
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
  const [lastBilledOrder, setLastBilledOrder] = useState(null);
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

  // Complete billing & settlement, show receipt, and immediately RESET active cart
  const handleCompleteOrder = () => {
    if (items.length === 0) return;
    const completed = submitOrder(tenant);
    if (completed) {
      setLastBilledOrder(completed);
      setShowReceipt(true);
      // Immediately reset the active order/cart for the next customer
      startNewOrder();
      toast.success('Billing completed! Cart reset for next order.');
    }
  };

  const handleResetCard = () => {
    startNewOrder();
    toast.success('Cart cleared & new ticket prepared.');
  };

  const activeQueueOrders = orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Cooking':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ready':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const receiptOrder = lastBilledOrder || activeOrder;
  const receiptItems = receiptOrder?.items || [];
  const receiptSubtotal = receiptItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const receiptService = receiptSubtotal * (tenant.serviceChargePercent / 100);
  const receiptTax = receiptSubtotal * (tenant.taxPercent / 100);
  const receiptDiscount = receiptOrder?.discount || 0;
  const receiptTotal = receiptOrder?.total || (receiptSubtotal + receiptService + receiptTax - receiptDiscount);

  return (
    <aside className="w-full xl:w-[390px] h-full bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 select-none overflow-hidden shadow-xs relative">
      {/* 1. Header (68px exact height matching TopHeader) */}
      <div className="h-[68px] px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* Order ID & Queue switcher */}
          <div className="relative">
            <button
              onClick={() => setShowQueueDropdown(!showQueueDropdown)}
              className="flex items-center gap-1.5 font-extrabold text-[15px] text-slate-800 hover:text-orange-600 transition tracking-tight"
            >
              <span>{activeOrder.orderId}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown for selecting an existing order from live queue */}
            {showQueueDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                  Active Order Queue ({activeQueueOrders.length})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {activeQueueOrders.map((ord) => (
                    <button
                      key={ord.id}
                      onClick={() => {
                        selectExistingOrder(ord.id);
                        setShowQueueDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                        selectedOrderId === ord.id ? 'bg-orange-50 text-orange-600 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-mono font-bold block">{ord.orderId}</span>
                        <span className="text-[10px] text-slate-400">{ord.customerName || 'Walk-in'} • {ord.tableNumber ? `T#${ord.tableNumber}` : 'Takeaway'}</span>
                      </div>
                      <span className="font-mono font-bold">{formatCurrency(ord.total)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span
            className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md border ${getStatusColor(
              activeOrder.status
            )}`}
          >
            {activeOrder.status}
          </span>
        </div>

        {/* Action Controls: New Order & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetCard}
            title="Clear and reset card"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={startNewOrder}
            className="h-8 px-2.5 rounded-xl border border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600 text-xs font-bold flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="xl:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Order Metadata & Service Bar */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 shrink-0">
        {/* Customer Selectable / Name Input */}
        <button
          onClick={() => setShowCustomerModal(true)}
          className="flex items-center gap-1.5 hover:text-orange-600 transition text-left group max-w-[140px]"
        >
          <div className="w-6 h-6 rounded-full bg-slate-200/80 flex items-center justify-center text-[10px] text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600 transition">
            <User className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-800 truncate">
            {activeOrder.customerName || 'Walk-in Guest'}
          </span>
        </button>

        {/* Order Type Toggle: Dine-In vs Takeaway */}
        <div className="flex items-center bg-slate-200/60 p-0.5 rounded-xl text-[11px] font-semibold">
          <button
            onClick={() => updateActiveMeta({ orderType: 'Dine-In' })}
            className={`px-2 py-1 rounded-lg transition ${
              activeOrder.orderType === 'Dine-In' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dine-In {activeOrder.tableNumber ? `#${activeOrder.tableNumber}` : ''}
          </button>
          <button
            onClick={() => updateActiveMeta({ orderType: 'Takeaway' })}
            className={`px-2 py-1 rounded-lg transition ${
              activeOrder.orderType === 'Takeaway' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Takeaway
          </button>
        </div>
      </div>

      {/* 3. Preparing Status Timer Banner */}
      {activeOrder.status === 'Cooking' && (
        <div className="px-5 py-2 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-xs text-amber-800 shrink-0">
          <div className="flex items-center gap-1.5 font-bold">
            <ChefHat className="w-4 h-4 text-amber-600" />
            <span>Kitchen Preparing</span>
          </div>
          <span className="font-mono font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
            {formatTimer(elapsedSeconds)}
          </span>
        </div>
      )}

      {/* 4. Cart Items List (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-600">Cart is empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Tap on any menu item from the catalog to start building this order ticket.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {item.name}
                  </h4>
                  <p className="text-[11px] font-bold text-orange-600 mt-0.5 font-mono">
                    {formatCurrency(item.price)}
                  </p>
                  {item.extras?.length > 0 && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      +{item.extras.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Stepper Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => updateCartItemQty(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center shadow-2xs transition active:scale-95"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-xs font-bold w-5 text-center text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartItemQty(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center shadow-2xs transition active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Footer Financial & Settlement Summary */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/60 space-y-3 shrink-0">
        {/* Promo Voucher Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Promo Voucher"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleApplyPromo}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
          >
            Apply
          </button>
        </div>

        {appliedPromo && (
          <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
            <span>Voucher <strong>{appliedPromo.code}</strong> applied ({appliedPromo.discountPercent}% OFF)</span>
            <button onClick={() => setAppliedPromo(null)} className="text-emerald-800 hover:text-emerald-950">✕</button>
          </div>
        )}

        {/* Calculation Matrix */}
        <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-200/60 pt-2.5">
          <div className="flex justify-between">
            <span>Items Subtotal ({itemCount})</span>
            <span className="font-mono text-slate-800 font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Service Charge ({tenant.serviceChargePercent}%)</span>
            <span className="font-mono">{formatCurrency(serviceCharge)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>GST / Taxes ({tenant.taxPercent}%)</span>
            <span className="font-mono">{formatCurrency(tax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[11px] text-emerald-600 font-semibold">
              <span>Discount</span>
              <span className="font-mono">-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
            <span>Total Payable</span>
            <span className="font-mono text-base text-orange-600">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Order Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setShowReceipt(true)}
            disabled={items.length === 0}
            className="w-11 h-11 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center shrink-0 transition disabled:opacity-40"
            title="Preview / Print Bill"
          >
            <Printer className="w-5 h-5" />
          </button>

          <button
            onClick={handleCompleteOrder}
            disabled={items.length === 0}
            className="flex-1 h-11 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 active:scale-98 transition disabled:opacity-50"
          >
            <span>Complete Billing & Reset</span>
          </button>
        </div>
      </div>

      {/* 80mm Thermal Receipt Invoice Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-[340px] max-h-[90vh] overflow-y-auto shadow-2xl relative font-sans print-area">
            {/* Store Brand Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-tight">
                {tenant.brandName}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{tenant.tagline}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{tenant.address}</p>
              <p className="text-[10px] text-slate-500">{tenant.phone}</p>
            </div>

            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <div className="flex justify-between">
                <span>Ticket:</span>
                <span className="font-mono font-bold text-slate-900">{receiptOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Guest:</span>
                <span className="font-semibold text-slate-800">{receiptOrder.customerName || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span>{receiptOrder.orderType} {receiptOrder.tableNumber ? `(Table #${receiptOrder.tableNumber})` : ''}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Date:</span>
                <span>{new Date(receiptOrder.createdAt || Date.now()).toLocaleString()}</span>
              </div>
            </div>

            {/* Line items table */}
            <div className="border-t border-dashed border-slate-300 pt-2 mb-2">
              {receiptItems.map((item, idx) => (
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
                <span className="font-mono">{formatCurrency(receiptSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Service Charge ({tenant.serviceChargePercent}%)</span>
                <span className="font-mono">{formatCurrency(receiptService)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax ({tenant.taxPercent}%)</span>
                <span className="font-mono">{formatCurrency(receiptTax)}</span>
              </div>
              {receiptDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Promo Discount</span>
                  <span className="font-mono">-{formatCurrency(receiptDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-dashed border-slate-300 text-slate-900">
                <span>TOTAL PAID</span>
                <span className="font-mono">{formatCurrency(receiptTotal)}</span>
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
