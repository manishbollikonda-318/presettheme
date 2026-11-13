import { useState, useEffect } from 'react';
import { 
  X, Image as ImageIcon, Sparkles, Tag, IndianRupee, 
  Clock, Star, Check, Plus, Trash2, Eye, Flame, ShieldAlert
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { useTenant } from '../../context/TenantContext';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

const CURATED_PHOTO_PRESETS = [
  { name: 'Rice Bowl', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80' },
  { name: 'Noodles / Udon', url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&auto=format&fit=crop&q=80' },
  { name: 'Grilled Salmon', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=80' },
  { name: 'Creamy Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&auto=format&fit=crop&q=80' },
  { name: 'Fresh Salad', url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format&fit=crop&q=80' },
  { name: 'Specialty Drink', url: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=500&auto=format&fit=crop&q=80' },
  { name: 'Dessert / Cake', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=80' },
  { name: 'Artisan Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80' },
  { name: 'Cappuccino / Cafe', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=80' },
];

const POPULAR_MODIFIER_TAGS = [
  'Extra Rice', 'Crispy Egg', 'Spicy Sauce', 'Extra Cheese', 
  'Gluten Free', 'Truffle Glaze', 'No Onion', 'Sugar: 50%', 'Oat Milk Sub'
];

export default function ProductFormModal({ product, onClose }) {
  const { categories, addProduct, updateProduct, addCategory } = usePOS();
  const { tenant } = useTenant();
  const isEdit = !!product;

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'pricing' | 'photo' | 'extras'

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: categories[0]?.id || '',
    rating: '4.8',
    prepTime: '15',
    image: CURATED_PHOTO_PRESETS[0].url,
    inStock: true,
    extras: ['Extra Rice', 'Spicy Sauce'],
  });

  const [customExtraInput, setCustomExtraInput] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: String(product.price || ''),
        categoryId: product.categoryId || categories[0]?.id || '',
        rating: String(product.rating || '4.8'),
        prepTime: String(product.prepTime || '15'),
        image: product.image || CURATED_PHOTO_PRESETS[0].url,
        inStock: product.inStock !== false,
        extras: product.extras || [],
      });
    }
  }, [product, categories]);

  const priceNum = parseFloat(form.price) || 0;
  const taxAmount = (priceNum * (tenant.taxPercent / 100));
  const finalPriceWithTax = priceNum + taxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: priceNum,
      categoryId: form.categoryId || categories[0]?.id,
      rating: parseFloat(form.rating) || 4.8,
      prepTime: parseInt(form.prepTime) || 15,
      image: form.image.trim() || CURATED_PHOTO_PRESETS[0].url,
      inStock: form.inStock,
      extras: form.extras,
    };

    if (isEdit) {
      updateProduct(product.id, data);
    } else {
      addProduct(data);
    }
    onClose();
  };

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory({ name: newCatName.trim(), emoji: '🍽️' });
      setNewCatName('');
      setShowNewCatInput(false);
    }
  };

  const handleTogglePresetModifier = (tag) => {
    setForm((prev) => ({
      ...prev,
      extras: prev.extras.includes(tag)
        ? prev.extras.filter((t) => t !== tag)
        : [...prev.extras, tag],
    }));
  };

  const handleAddCustomModifier = (e) => {
    e?.preventDefault();
    if (customExtraInput.trim()) {
      if (!form.extras.includes(customExtraInput.trim())) {
        setForm((prev) => ({ ...prev, extras: [...prev.extras, customExtraInput.trim()] }));
      }
      setCustomExtraInput('');
    }
  };

  const handleRemoveModifier = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      extras: prev.extras.filter((t) => t !== tagToRemove),
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Row */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {isEdit ? `Edit Dish: ${product.name}` : 'Create New Menu Item'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure recipe details, pricing formulas, image assets, and guest modifiers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0">
          {[
            { id: 'general', label: '1. Recipe & Category' },
            { id: 'pricing', label: '2. Pricing & Taxes' },
            { id: 'photo', label: '3. Image & Preview' },
            { id: 'extras', label: `4. Modifiers (${form.extras.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={activeTab === tab.id ? { backgroundColor: 'var(--brand-primary)' } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: General & Recipe */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Product / Dish Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Teriyaki Chicken Rice Bowl"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--brand-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Culinary Description & Ingredients
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe flavors, cooking method, and side garnishes..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--brand-primary)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">Menu Category</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCatInput(!showNewCatInput)}
                      className="text-[11px] font-bold"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      + Add New Category
                    </button>
                  </div>

                  {showNewCatInput && (
                    <div className="flex gap-2 mb-2 animate-in fade-in">
                      <input
                        type="text"
                        placeholder="Category name..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-1.5 text-xs text-white font-bold rounded-xl"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                      >
                        Create
                      </button>
                    </div>
                  )}

                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">
                    Kitchen Prep Time (Minutes)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={form.prepTime}
                      onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Stock toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Stock Availability</p>
                  <p className="text-[11px] text-slate-400">
                    {form.inStock ? 'Item is live on POS grid and orderable' : 'Item is 86’d (Sold out in kitchen)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, inStock: !form.inStock })}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    form.inStock
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {form.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Pricing & Taxes */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">
                    Base Menu Price ({tenant.currencySymbol}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      {tenant.currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 font-mono"
                      style={{ '--tw-ring-color': 'var(--brand-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Initial Customer Rating</label>
                  <div className="relative">
                    <Star className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 fill-amber-500" />
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Tax & Pricing Breakdown Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Automatic Financial Breakdown
                </span>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Base Dish Price:</span>
                  <span className="font-mono font-bold">{formatCurrency(priceNum)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Applicable VAT / Tax ({tenant.taxPercent}%):</span>
                  <span className="font-mono">+{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Customer Gross Menu Total:</span>
                  <span className="font-mono text-emerald-700 text-sm">
                    {formatCurrency(finalPriceWithTax)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Photo & Preview */}
          {activeTab === 'photo' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Product Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Curated instant photo presets */}
              <div>
                <p className="text-xs font-bold text-slate-800 mb-2">
                  Or 1-Click Select Curated Food Photography:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {CURATED_PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setForm({ ...form, image: p.url })}
                      className={`relative rounded-xl overflow-hidden border-2 transition text-left group ${
                        form.image === p.url
                          ? 'ring-2 ring-slate-900 border-emerald-500 scale-102'
                          : 'border-transparent hover:opacity-90'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="h-14 w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[9px] font-bold p-0.5 truncate text-center block">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live POS Card Preview */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Live POS Grid Card Preview
                </span>
                <div className="w-64 border border-slate-200 rounded-2xl p-3 bg-white shadow-xs mx-auto">
                  <img
                    src={form.image}
                    alt={form.name || 'Preview'}
                    className="h-28 w-full object-cover rounded-xl bg-slate-100"
                    onError={(e) => {
                      e.target.src = CURATED_PHOTO_PRESETS[0].url;
                    }}
                  />
                  <h4 className="font-bold text-slate-900 text-xs mt-2 truncate">
                    {form.name || 'Untitled Dish'}
                  </h4>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(priceNum)}
                    </span>
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded">
                      ★ {form.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Modifiers & Extras */}
          {activeTab === 'extras' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div>
                <p className="text-xs font-bold text-slate-800 mb-1.5">
                  Click Popular Preset Modifiers to Add/Remove:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_MODIFIER_TAGS.map((tag) => {
                    const isAdded = form.extras.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTogglePresetModifier(tag)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                          isAdded
                            ? 'text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        style={isAdded ? { backgroundColor: 'var(--brand-primary)' } : undefined}
                      >
                        {isAdded ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Modifier */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Add Custom Recipe Modifier
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Extra Wasabi, Dressing on Side"
                    value={customExtraInput}
                    onChange={(e) => setCustomExtraInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomModifier();
                      }
                    }}
                    className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomModifier}
                    className="px-4 py-2 text-xs text-white font-bold rounded-xl shadow-2xs"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Active Modifiers List */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Configured Dish Modifiers ({form.extras.length})
                </span>
                {form.extras.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No modifiers attached to this item</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {form.extras.map((extra) => (
                      <span
                        key={extra}
                        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs"
                      >
                        {extra}
                        <button
                          type="button"
                          onClick={() => handleRemoveModifier(extra)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== 'extras' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['general', 'pricing', 'photo', 'extras'];
                    const next = tabs[tabs.indexOf(activeTab) + 1];
                    if (next) setActiveTab(next);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Next Tab →
                </button>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition hover:opacity-95 flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                <Check className="w-3.5 h-3.5" />
                {isEdit ? 'Update Product' : 'Publish Dish to POS'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
