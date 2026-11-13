import { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { useTenant } from '../context/TenantContext';
import { Receipt, Search, Printer, Download, CreditCard, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export default function BillingView() {
  const { orders } = usePOS();
  const { tenant } = useTenant();

  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const completedOrders = orders.filter((o) => o.status === 'Completed' || o.items?.length > 0);

  const filtered = completedOrders.filter(
    (o) =>
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalGross = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalTax = completedOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
  const totalService = completedOrders.reduce((sum, o) => sum + (o.serviceCharge || 0), 0);

  const handlePrint = (order) => {
    setSelectedReceipt(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 bg-[#FAF9F6] text-[#1F2937] font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-100 text-[#D9480F] shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1F2937]">Billing & Settlement Records</h2>
            <p className="text-xs text-stone-500">Sales invoices, tax breakdowns, and 80mm printable thermal receipts</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search invoice # or guest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs bg-white/80 border border-stone-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition shadow-2xs"
          />
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">Gross Billed Revenue</span>
          <p className="text-2xl font-bold text-[#1F2937] mt-1 font-mono">
            {formatCurrency(totalGross)}
          </p>
          <span className="text-[11px] text-[#D9480F] mt-1 inline-block font-semibold">From {completedOrders.length} processed orders</span>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">Total GST / Tax Collected ({tenant.taxPercent}%)</span>
          <p className="text-2xl font-bold text-[#1F2937] mt-1 font-mono">
            {formatCurrency(totalTax)}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 inline-block">Remittable government taxes</span>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">Service Charges ({tenant.serviceChargePercent}%)</span>
          <p className="text-2xl font-bold text-[#1F2937] mt-1 font-mono">
            {formatCurrency(totalService)}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 inline-block">Staff gratuity pool distribution</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/75 border-b border-stone-200/80 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice / Order ID</th>
                <th className="py-3 px-4">Guest / Table</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Tax & Service</th>
                <th className="py-3 px-4 text-right">Net Total</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-stone-400">
                    No billing transactions recorded yet. Complete an order in POS!
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-orange-50/20 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1F2937]">
                      {o.orderId}
                      <span className="block text-[10px] font-normal text-stone-400">
                        {new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1F2937]">{o.customerName || 'Walk-in'}</p>
                      <p className="text-[10px] text-stone-500">
                        {o.orderType} {o.tableNumber ? `• Table #${o.tableNumber}` : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {o.items?.reduce((s, i) => s + i.quantity, 0) || 0} items
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono">
                      {formatCurrency(o.subtotal || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 text-[11px] font-mono">
                      +{formatCurrency((o.tax || 0) + (o.serviceCharge || 0))}
                      {o.discount > 0 && (
                        <span className="text-[#D9480F] block">-{formatCurrency(o.discount)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#1F2937] text-sm font-mono">
                      {formatCurrency(o.total || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handlePrint(o)}
                        className="p-1.5 border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-600 inline-flex items-center gap-1 text-[11px] transition shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Print Area */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-white rounded-2xl p-6 w-[320px] max-h-[90vh] overflow-y-auto shadow-2xl print-area" onClick={(e) => e.stopPropagation()}>
            <div className="text-center border-b border-dashed border-stone-300 pb-3 mb-3">
              <h3 className="font-bold text-lg text-[#1F2937]">{tenant.brandName}</h3>
              <p className="text-[10px] text-stone-500">{tenant.address}</p>
              <p className="text-[10px] text-stone-500">{tenant.phone}</p>
            </div>
            
            <div className="text-xs text-stone-600 space-y-1 mb-3">
              <p>Invoice / Ticket: <span className="font-mono font-bold text-[#1F2937]">{selectedReceipt.orderId}</span></p>
              <p>Guest: {selectedReceipt.customerName || 'Walk-in'}</p>
              <p>Type: {selectedReceipt.orderType} {selectedReceipt.tableNumber ? `(Table #${selectedReceipt.tableNumber})` : ''}</p>
              <p className="text-[11px] text-stone-400">Date: {new Date(selectedReceipt.createdAt || Date.now()).toLocaleString()}</p>
            </div>

            <div className="border-t border-dashed border-stone-300 pt-2 mb-2">
              {selectedReceipt.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-mono">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(selectedReceipt.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Service Charge ({tenant.serviceChargePercent}%)</span>
                <span className="font-mono">{formatCurrency(selectedReceipt.serviceCharge)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Tax ({tenant.taxPercent}%)</span>
                <span className="font-mono">{formatCurrency(selectedReceipt.tax)}</span>
              </div>
              {selectedReceipt.discount > 0 && (
                <div className="flex justify-between text-[#D9480F]">
                  <span>Promo Discount</span>
                  <span className="font-mono">-{formatCurrency(selectedReceipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-dashed border-stone-300 text-[#1F2937]">
                <span>TOTAL PAID</span>
                <span className="font-mono">{formatCurrency(selectedReceipt.total)}</span>
              </div>
            </div>

            <p className="text-[9px] text-stone-400 text-center mt-4 italic leading-tight">
              {tenant.receiptFooter}
            </p>

            <div className="flex gap-2 mt-4 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 border border-stone-200 rounded-xl py-2 text-xs font-semibold hover:bg-stone-50 transition"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 bg-[#D9480F] hover:bg-[#C23E0A] text-white rounded-xl py-2 text-xs font-semibold transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
