import { useTenant } from '../context/TenantContext';
import { usePOS } from '../context/POSContext';
import { formatCurrency } from '../utils/currency';
import { UtensilsCrossed, User, Clock, Check, Plus } from 'lucide-react';

export default function DiningView() {
  const { tenant } = useTenant();
  const { orders, activeOrder, selectExistingOrder, startNewOrder, updateActiveMeta } = usePOS();

  const tables = Array.from({ length: tenant.numberOfTables }, (_, i) => {
    const rawNum = String(i + 1);
    const num = rawNum.padStart(2, '0');
    const activeTableOrder = orders.find(
      (o) =>
        (o.tableNumber === num || o.tableNumber === rawNum) &&
        o.status !== 'Completed' &&
        o.status !== 'Cancelled'
    );
    return {
      number: num,
      rawNum,
      status: activeTableOrder ? activeTableOrder.status : 'Available',
      order: activeTableOrder || null,
    };
  });

  const statusColors = {
    Available: { bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Cooking: { bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    New: { bg: 'bg-blue-50/70', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
    Ready: { bg: 'bg-purple-50/70', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  };

  const available = tables.filter((t) => t.status === 'Available').length;
  const occupied = tables.length - available;

  const handleTableClick = (table) => {
    if (table.order) {
      selectExistingOrder(table.order.id);
    } else {
      startNewOrder();
      updateActiveMeta({ tableNumber: table.number, orderType: 'Dine-In' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dining Floor Area</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive table layout map. Click any table to inspect ticket or punch a new dining order.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Available ({available})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Occupied ({occupied})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map((table) => {
          const colors = statusColors[table.status] || statusColors.Available;
          const isSelected = activeOrder?.tableNumber === table.number || activeOrder?.tableNumber === table.rawNum;

          return (
            <div
              key={table.number}
              onClick={() => handleTableClick(table)}
              className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between ${
                isSelected ? 'ring-2 ring-slate-900 shadow-md scale-102' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-extrabold text-slate-800">
                    T-{table.number}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                </div>
                <p className={`text-[11px] font-bold ${colors.text} uppercase tracking-wider mb-2`}>
                  {table.status}
                </p>
              </div>

              {table.order ? (
                <div className="space-y-1 pt-2 border-t border-slate-200/50">
                  <p className="text-[11px] text-slate-700 font-semibold truncate flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    {table.order.customerName || 'Walk-in'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    {table.order.orderId}
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
                    {formatCurrency(table.order.total || 0)}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center py-2 text-slate-400 hover:text-emerald-600 transition">
                  <span className="text-xs font-semibold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Punch
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
