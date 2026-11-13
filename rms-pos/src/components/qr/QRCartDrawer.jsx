import { useState } from 'react';
import {
  ShoppingBag,
  X,
  ArrowRight,
  ShieldCheck,
  Phone,
  User,
  UtensilsCrossed,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
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
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Checkout Phase State: 'cart' | 'payment' | 'processing' | 'success'
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card'

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const taxRate = tenant?.taxPercent ?? 5.0;
  const serviceRate = tenant?.serviceChargePercent ?? 0.0;
  const tax = (subtotal * taxRate) / 100;
  const serviceCharge = (subtotal * serviceRate) / 100;
  const total = subtotal + tax + serviceCharge;

  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  const isPhoneValid = cleanPhone.length >= 10;
  const canProceedToPay = cart.length > 0 && isPhoneValid;

  if (!isOpen) return null;

  // Handle Proceed to Payment Screen
  const handleProceedToPayment = () => {
    if (!isPhoneValid) {
      setPhoneTouched(true);
      return;
    }
    setCheckoutStep('payment');
  };

  // Mock Gateway: 2-second processing spinner -> green checkmark -> dispatch order to backend
  const handleExecutePayment = () => {
    setCheckoutStep('processing');

    setTimeout(() => {
      setCheckoutStep('success');

      setTimeout(() => {
        onSubmitOrder({
          customerName,
          customerPhone: cleanPhone,
          orderNotes: `[Paid via ${paymentMethod.toUpperCase()}] ${orderNotes}`.trim(),
        });
        setCheckoutStep('cart');
      }, 1200);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      <div
        className="flex-1"
        onClick={() => {
          if (checkoutStep === 'processing' || checkoutStep === 'success') return;
          onClose();
        }}
      />

      <div className="bg-[#FAF9F6] rounded-t-[32px] max-h-[88vh] flex flex-col shadow-2xl border-t border-stone-200 overflow-hidden pb-[max(1.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="px-6 py-4 bg-white/90 backdrop-blur-md border-b border-stone-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {checkoutStep === 'payment' && (
              <button
                onClick={() => setCheckoutStep('cart')}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 flex items-center justify-center transition mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-[#D9480F] shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[#1F2937] text-base">
                  {checkoutStep === 'payment' ? 'Pre-Order Payment' : 'Dine-In Checkout'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D9480F] text-white font-mono font-extrabold text-xs shadow-2xs">
                  Table #{tableNumber || '01'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D9480F] mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D9480F]" />
                <span>Pay First Anti-Fraud Engine</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={checkoutStep === 'processing'}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body based on checkout step */}
        {checkoutStep === 'processing' ? (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-orange-100 text-[#D9480F] flex items-center justify-center animate-spin shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1F2937]">Processing Payment...</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                Authorizing {formatCurrency(total)} via {paymentMethod === 'upi' ? 'UPI (GPay / PhonePe)' : 'Credit Card Gateway'}.
              </p>
            </div>
          </div>
        ) : checkoutStep === 'success' ? (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-emerald-800">Payment Successful!</h3>
              <p className="text-xs text-stone-500 mt-1">
                Transaction verified. Sending ticket straight to kitchen display...
              </p>
            </div>
          </div>
        ) : checkoutStep === 'payment' ? (
          /* Step 2: Payment Selection Gateway */
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-900">Total Payable</p>
                <p className="text-[11px] text-emerald-700">Table #{tableNumber} • Inclusive of Taxes</p>
              </div>
              <p className="font-mono text-xl font-black text-emerald-900">
                {formatCurrency(total)}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                Select Upfront Payment Method
              </label>

              {/* UPI Option */}
              <div
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'upi'
                    ? 'border-[#D9480F] bg-orange-50/40 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#D9480F] flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1F2937]">UPI Instant Pay</p>
                    <p className="text-[11px] text-stone-500">Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'upi' ? 'border-[#D9480F]' : 'border-stone-300'
                }`}>
                  {paymentMethod === 'upi' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D9480F]" />
                  )}
                </div>
              </div>

              {/* Credit / Debit Card Option */}
              <div
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'card'
                    ? 'border-[#D9480F] bg-orange-50/40 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1F2937]">Credit / Debit Card</p>
                    <p className="text-[11px] text-stone-500">Visa, Mastercard, RuPay, Amex</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'card' ? 'border-[#D9480F]' : 'border-stone-300'
                }`}>
                  {paymentMethod === 'card' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D9480F]" />
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center gap-2.5 text-[11px] text-stone-500">
              <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>256-bit encrypted simulated gateway. Your order will be fired to the kitchen upon approval.</span>
            </div>

            <button
              onClick={handleExecutePayment}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#D9480F] hover:bg-[#C23E0A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-98 transition"
            >
              <span>Pay {formatCurrency(total)} & Fire Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Step 1: Cart Items & Mandatory Phone Number */
          <>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <p className="text-sm font-semibold">Your dining order is empty</p>
                  <p className="text-xs text-stone-400 mt-1">Select artisanal bites or brews to place order.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
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
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="pt-2 space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/80">
                    <label className="block text-xs font-bold text-[#1F2937] mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#D9480F]" />
                        <span>Customer Phone Number <span className="text-red-500">*</span></span>
                      </span>
                      <span className="text-[10px] text-stone-500 font-normal">Mandatory for Anti-Fraud</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={customerPhone}
                        onBlur={() => setPhoneTouched(true)}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-xl font-mono tracking-wide focus:outline-none focus:ring-2 transition ${
                          phoneTouched && !isPhoneValid
                            ? 'border-red-400 focus:ring-red-300/40 text-red-700'
                            : 'border-stone-200 focus:ring-[#D9480F]/20 focus:border-[#D9480F]'
                        }`}
                        maxLength={15}
                      />
                    </div>
                    {phoneTouched && !isPhoneValid ? (
                      <p className="text-[10px] text-red-600 font-semibold mt-1">
                        Please enter at least 10 digits to proceed to payment.
                      </p>
                    ) : (
                      <p className="text-[10px] text-stone-500 mt-1">
                        Required before checkout.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span>Guest Name (Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aryan Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Kitchen Notes & Preferences
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Less spicy, dressing on the side please"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition"
                      maxLength={200}
                    />
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-white/95 backdrop-blur-md border-t border-stone-200/80 space-y-3 shrink-0">
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
                    <span>Total Payable (Table #{tableNumber || '01'})</span>
                    <span className="font-mono text-base text-[#D9480F]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <button
                  disabled={!canProceedToPay}
                  onClick={handleProceedToPayment}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#D9480F] hover:bg-[#C23E0A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-98 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>
                    {isPhoneValid
                      ? `Proceed to Payment (${formatCurrency(total)})`
                      : 'Enter Phone Number to Proceed'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
export default QRCartDrawer;
