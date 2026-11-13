import { Plus, Minus, Sparkles } from 'lucide-react';

export function QRMenuItemCard({ item, quantity, onAdd, onRemove }) {
  const isAvailable = item.is_available !== false;

  return (
    <div className={`bg-white rounded-3xl p-4 shadow-xs border border-emerald-950/5 flex gap-4 transition-all ${
      !isAvailable ? 'opacity-50 grayscale' : 'hover:shadow-md'
    }`}>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shrink-0">
          ☕
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-base leading-tight">
              {item.name}
            </h3>
            <span className="font-mono font-bold text-emerald-800 text-base shrink-0">
              ₹{parseFloat(item.price).toFixed(2)}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {item.extras && item.extras.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md w-fit">
              <Sparkles className="w-3 h-3" />
              Customizable extras available
            </div>
          )}
        </div>

        <div className="flex items-center justify-end mt-3">
          {!isAvailable ? (
            <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              Sold Out
            </span>
          ) : quantity > 0 ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200/60 rounded-full px-2 py-1 shadow-2xs">
              <button
                onClick={onRemove}
                className="w-7 h-7 rounded-full bg-white text-emerald-800 flex items-center justify-center shadow-xs active:scale-95 transition"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="font-bold text-emerald-900 text-sm font-mono w-4 text-center">
                {quantity}
              </span>
              <button
                onClick={onAdd}
                className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-full shadow-xs active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
