import { KDSTimer } from './KDSTimer';
import { ChefHat, Check, X, Flame } from 'lucide-react';

export function KDSOrderCard({ order, onUpdateStatus }) {
  const isCooking = order.status === 'cooking' || order.status === 'Cooking';
  const isNew = order.status === 'new' || order.status === 'New';

  const orderNumber = order.order_number || order.orderId || '#0000';
  const isTakeaway = (order.order_type || order.orderType || 'takeaway').toLowerCase() === 'takeaway';

  return (
    <div className="bg-[#1A1D27] border-2 border-[#2A2D3A] hover:border-amber-500/50 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-200">
      {/* Card Header: Prominent Pickup Token # */}
      <div className="p-4 border-b border-[#2A2D3A] bg-[#141720]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">
              PICKUP TOKEN
            </div>
            <span className="font-mono text-3xl font-black text-white tracking-tight">
              {orderNumber}
            </span>
          </div>
          <KDSTimer createdAt={order.created_at || order.createdAt} />
        </div>

        {/* Pickup / QSR Type Badge & Customer Name */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-orange-500/20 text-[#D9480F] border border-orange-500/30">
            {isTakeaway ? 'COUNTER PICKUP' : 'EXPRESS ORDER'}
          </span>
          {order.customer_name || order.customerName ? (
            <span className="text-xs text-slate-300 font-semibold truncate bg-slate-800/80 px-2 py-0.5 rounded-md">
              👤 {order.customer_name || order.customerName}
            </span>
          ) : null}
        </div>
      </div>

      {/* Items Section */}
      <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
        {order.items?.map((item, idx) => (
          <div key={item.id || idx} className="flex items-start gap-3 pb-2.5 border-b border-[#2A2D3A]/60 last:border-0 last:pb-0">
            <span className="font-mono text-base font-black bg-amber-500 text-slate-950 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
              {item.quantity}x
            </span>
            <div className="flex-1">
              <p className="font-bold text-slate-100 text-base leading-snug">
                {item.name}
              </p>
              {item.extras && item.extras.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.extras.map((extra, eIdx) => (
                    <span
                      key={eIdx}
                      className="text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded"
                    >
                      +{extra}
                    </span>
                  ))}
                </div>
              )}
              {item.notes && (
                <p className="text-xs text-slate-400 italic mt-1 font-medium bg-slate-900/50 p-1.5 rounded border border-slate-800">
                  "{item.notes}"
                </p>
              )}
            </div>
          </div>
        ))}

        {order.notes && (
          <div className="mt-2 p-2 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs font-semibold">
            Order Note: {order.notes}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-[#141720] border-t border-[#2A2D3A] flex items-center gap-2">
        {isNew && (
          <button
            onClick={() => onUpdateStatus(order.id, 'cooking')}
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Flame className="w-4 h-4" />
            START COOKING
          </button>
        )}

        {isCooking && (
          <button
            onClick={() => onUpdateStatus(order.id, 'ready')}
            className="flex-1 py-3.5 px-4 bg-[#22C55E] hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-900/30"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            MARK READY
          </button>
        )}

        {/* Bump (Complete/Dismiss) */}
        <button
          onClick={() => onUpdateStatus(order.id, 'completed')}
          className="p-3 bg-[#2A2D3A] hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
          title="Bump order ticket"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
