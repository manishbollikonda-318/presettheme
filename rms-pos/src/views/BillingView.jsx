import { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { useTenant } from '../context/TenantContext';
import { Receipt, Search, Printer, Download, CreditCard, DollarSign } from 'lucide-react';

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
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Billing & Settlement Records</h2>
            <p className="text-xs text-slate-500">Sales invoices, tax breakdowns, and 80mm printable receipts</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice # or guest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1"
            style={{ '--tw-ring-color': 'var(--brand-primary)' }}
          />
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Gross Billed Revenue</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {tenant.currencySymbol}{totalGross.toFixed(2)}
          </p>
          <span className="text-[11px] text-emerald-600 mt-1 inline-block">From {completedOrders.length} processed orders</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Total VAT / Tax Collected ({tenant.taxPercent}%)</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {tenant.currencySymbol}{totalTax.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Remittable government taxes</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Service Charges ({tenant.serviceChargePercent}%)</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {tenant.currencySymbol}{totalService.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Staff gratuity pool distribution</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No billing transactions recorded yet. Complete an order in POS!
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {o.orderId}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{o.customerName || 'Walk-in'}</p>
                      <p className="text-[10px] text-slate-400">
                        {o.orderType} {o.tableNumber ? `• Table #${o.tableNumber}` : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {o.items?.reduce((s, i) => s + i.quantity, 0) || 0} items
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {tenant.currencySymbol}{(o.subtotal || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      +{tenant.currencySymbol}{((o.tax || 0) + (o.serviceCharge || 0)).toFixed(2)}
                      {o.discount > 0 && (
                        <span className="text-emerald-600 block">-{tenant.currencySymbol}{o.discount.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                      {tenant.currencySymbol}{(o.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handlePrint(o)}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 inline-flex items-center gap-1 text-[11px] transition"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-white rounded-2xl p-6 w-[320px] max-h-[90vh] overflow-y-auto print-area" onClick={(e) => e.stopPropagation()}>
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h3 className="font-bold text-lg text-slate-900">{tenant.brandName}</h3>
              <p className="text-[10px] text-slate-500">{tenant.address}</p>
              <p className="text-[10px] text-slate-500">{tenant.phone}</p>
            </div>
            
            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <p>Invoice / Ticket: <span className="font-mono font-bold">{selectedReceipt.orderId}</span></p>
              <p>Guest: {selectedReceipt.customerName || 'Walk-in'}</p>
              <p>Type: {selectedReceipt.orderType} {selectedReceipt.tableNumber ? `(Table #${selectedReceipt.tableNumber})` : ''}</p>
              <p>Date: {new Date(selectedReceipt.createdAt || Date.now()).toLocaleString()}</p>
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 mb-2">
              {selectedReceipt.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{tenant.currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{tenant.currencySymbol}{selectedReceipt.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Service Charge ({tenant.serviceChargePercent}%)</span>
                <span>{tenant.currencySymbol}{selectedReceipt.serviceCharge?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax ({tenant.taxPercent}%)</span>
                <span>{tenant.currencySymbol}{selectedReceipt.tax?.toFixed(2)}</span>
              </div>
              {selectedReceipt.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Promo Discount</span>
                  <span>-{tenant.currencySymbol}{selectedReceipt.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-300">
                <span>TOTAL PAID</span>
                <span>{tenant.currencySymbol}{selectedReceipt.total?.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 text-center mt-4 italic">
              {tenant.receiptFooter}
            </p>

            <div className="flex gap-2 mt-4 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 border border-slate-200 rounded-lg py-2 text-xs font-semibold hover:bg-slate-50"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 text-white rounded-lg py-2 text-xs font-semibold"
                style={{ backgroundColor: 'var(--brand-primary)' }}
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
