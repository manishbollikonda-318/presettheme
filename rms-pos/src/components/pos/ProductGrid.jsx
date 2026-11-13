import { useState } from 'react';
import { Target, Plus, Star, Edit3, Check, Sparkles } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { useTenant } from '../../context/TenantContext';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

export default function ProductGrid({ searchQuery, onOpenProductModal }) {
  const { categories, products, addToCart } = usePOS();
  const { tenant } = useTenant();
  const [activeCategory, setActiveCategory] = useState('all');
  const [addedProductId, setAddedProductId] = useState(null);

  // Optional quick modifier modal state
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [customNotes, setCustomNotes] = useState('');

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch && p.inStock;
  });

  const handleCardClick = (product, e) => {
    // If the product has extras, allow quick modifier or direct add
    if (e.shiftKey || (product.extras && product.extras.length > 0 && false)) {
      setCustomizingProduct(product);
      setSelectedExtras([]);
      setCustomNotes('');
    } else {
      addToCart(product);
      setAddedProductId(product.id);
      toast.success(`Added ${product.name}`, { duration: 1500 });
      setTimeout(() => setAddedProductId(null), 600);
    }
  };

  const handleConfirmCustomization = () => {
    if (!customizingProduct) return;
    addToCart(customizingProduct, selectedExtras, customNotes.trim());
    toast.success(`Added ${customizingProduct.name} with customizations`, { duration: 1500 });
    setCustomizingProduct(null);
    setSelectedExtras([]);
    setCustomNotes('');
  };

  const toggleExtra = (extra) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex-1 overflow-hidden flex flex-col h-full">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Target className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Products</h2>
          <span className="text-xs text-slate-400 font-medium ml-1">
            ({filtered.length} available)
          </span>
        </div>

        <button
          onClick={() => onOpenProductModal()}
          className="border border-slate-200 hover:bg-slate-50 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs hover:border-slate-300"
        >
          <Plus className="w-3.5 h-3.5" />
          Input New Products
        </button>
      </div>

      {/* Dynamic Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'text-white shadow-xs scale-102'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
          }`}
          style={activeCategory === 'all' ? { backgroundColor: 'var(--brand-primary)' } : undefined}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === cat.id
                ? 'text-white shadow-xs scale-102'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
            }`}
            style={activeCategory === cat.id ? { backgroundColor: 'var(--brand-primary)' } : undefined}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2 overflow-y-auto flex-1 pr-1.5 pb-2">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No dishes in this category</p>
            <p className="text-xs text-slate-400 mt-1">Try switching category or add new products via button above</p>
          </div>
        ) : (
          filtered.map((product) => {
            const isJustAdded = addedProductId === product.id;
            return (
              <div
                key={product.id}
                onClick={(e) => handleCardClick(product, e)}
                className={`border border-slate-200/90 rounded-2xl p-3 bg-white hover:shadow-md transition-all duration-150 flex flex-col justify-between cursor-pointer group relative ${
                  isJustAdded ? 'ring-2 ring-emerald-500 scale-[0.99]' : ''
                }`}
              >
                {/* Top Image + Action Buttons */}
                <div className="relative overflow-hidden rounded-xl bg-slate-100 h-36">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-36 w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80`;
                    }}
                  />

                  {/* Top-right quick edit / custom action buttons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {product.extras && product.extras.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomizingProduct(product);
                          setSelectedExtras([]);
                          setCustomNotes('');
                        }}
                        className="bg-white/95 backdrop-blur-xs p-1.5 rounded-lg shadow-xs opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-900"
                        title="Customize Extras"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProductModal(product);
                      }}
                      className="bg-white/95 backdrop-blur-xs p-1.5 rounded-lg shadow-xs opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-900"
                      title="Edit Product"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Added Animation Ping */}
                  {isJustAdded && (
                    <div className="absolute inset-0 bg-emerald-600/20 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md animate-in zoom-in-75">
                        <Check className="w-3.5 h-3.5" /> Added!
                      </span>
                    </div>
                  )}
                </div>

                {/* Item Information */}
                <div className="flex-1 mt-2.5">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-emerald-700 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                  <span className="font-bold text-sm text-[#1F2937] font-mono">
                    {formatCurrency(product.price)}
                  </span>

                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 border border-amber-200/50">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {product.rating}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Modifier Modal */}
      {customizingProduct && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setCustomizingProduct(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <img
                src={customizingProduct.image}
                alt={customizingProduct.name}
                className="w-12 h-12 rounded-xl object-cover bg-slate-100"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{customizingProduct.name}</h4>
                <p className="text-xs text-stone-600 font-mono font-semibold">
                  {formatCurrency(customizingProduct.price)}
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-700 mb-2">Select Custom Add-ons & Modifiers:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {customizingProduct.extras?.map((extra) => {
                const selected = selectedExtras.includes(extra);
                return (
                  <button
                    key={extra}
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selected
                        ? 'text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    style={selected ? { backgroundColor: 'var(--brand-primary)' } : undefined}
                  >
                    {selected ? '✓ ' : '+ '}
                    {extra}
                  </button>
                );
              })}
            </div>

            <label className="text-xs font-semibold text-slate-700 mb-1 block">Kitchen Preparation Notes:</label>
            <input
              type="text"
              placeholder="e.g. Less spicy, dressing on side..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 mb-5"
              style={{ '--tw-ring-color': 'var(--brand-primary)' }}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomizingProduct(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomization}
                className="flex-1 py-2 text-xs font-semibold text-white rounded-xl shadow-xs"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                Add to Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
