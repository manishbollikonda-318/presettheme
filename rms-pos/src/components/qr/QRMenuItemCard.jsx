import { Plus, Minus, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function QRMenuItemCard({ item, quantity, onAdd, onRemove }) {
  const isAvailable = item.is_available !== false;

  return (
    <div className={`bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-stone-200/80 flex gap-4 transition-all duration-200 ${
      !isAvailable ? 'opacity-50 grayscale' : 'hover:shadow-md hover:border-orange-200'
    }`}>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0 shadow-2xs"
          loading="lazy"
        />
      ) : (
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-orange-50 text-[#D9480F] flex items-center justify-center text-3xl shrink-0 shadow-2xs">
          ☕
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[#1F2937] text-base leading-tight truncate">
              {item.name}
            </h3>
            <span className="font-mono font-bold text-[#D9480F] text-sm sm:text-base shrink-0">
              {formatCurrency(item.price)}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {item.extras && item.extras.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-800 font-semibold bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg w-fit">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Customizable extras</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end mt-3">
          {!isAvailable ? (
            <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              Sold Out
            </span>
          ) : quantity > 0 ? (
            <div className="flex items-center gap-2.5 bg-stone-100 border border-stone-200/80 rounded-full px-2 py-1 shadow-2xs">
              <button
                onClick={onRemove}
                className="w-6 h-6 rounded-full bg-white text-stone-700 flex items-center justify-center shadow-2xs hover:bg-stone-50 active:scale-95 transition"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3 stroke-[2.5]" />
              </button>
              <span className="font-bold text-[#1F2937] text-xs font-mono w-4 text-center">
                {quantity}
              </span>
              <button
                onClick={onAdd}
                className="w-6 h-6 rounded-full bg-[#D9480F] text-white flex items-center justify-center shadow-2xs hover:bg-[#C23E0A] active:scale-95 transition"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D9480F] hover:bg-[#C23E0A] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default QRMenuItemCard;
