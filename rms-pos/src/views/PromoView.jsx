import { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { useTenant } from '../context/TenantContext';
import { TicketPercent, Plus, Trash2, CheckCircle2, XCircle, Tag, Calendar, DollarSign } from 'lucide-react';

export default function PromoView() {
  const { promoCodes, addPromo, togglePromo, deletePromo } = usePOS();
  const { tenant } = useTenant();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountPercent: 10,
    minOrder: 20,
    expiresAt: '2027-12-31',
    active: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    addPromo({
      code: form.code.toUpperCase().trim(),
      discountPercent: Number(form.discountPercent),
      minOrder: Number(form.minOrder),
      expiresAt: form.expiresAt,
      active: form.active,
    });
    setForm({
      code: '',
      discountPercent: 10,
      minOrder: 20,
      expiresAt: '2027-12-31',
      active: true,
    });
    setShowModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
            <TicketPercent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Promo & Discount Codes</h2>
            <p className="text-xs text-slate-500">Configure promotional vouchers, seasonal discounts, and minimum order limits</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Create Promo Code
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promoCodes.map((promo) => (
          <div
            key={promo.id}
            className={`bg-white rounded-2xl border p-5 transition-shadow shadow-xs flex flex-col justify-between ${
              promo.active ? 'border-slate-200/80 hover:shadow-md' : 'border-slate-200/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-wider">{promo.code}</h3>
                    <p className="text-xs text-emerald-600 font-semibold">{promo.discountPercent}% OFF Cart</p>
                  </div>
                </div>

                <button
                  onClick={() => togglePromo(promo.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                    promo.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {promo.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {promo.active ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <DollarSign className="w-3 h-3" /> Min Spend:
                  </span>
                  <span className="font-semibold text-slate-700">
                    {tenant.currencySymbol}{promo.minOrder}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3 h-3" /> Valid Until:
                  </span>
                  <span className="font-semibold text-slate-700">{promo.expiresAt}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Applicable on POS checkout</span>
              <button
                onClick={() => deletePromo(promo.id)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                title="Delete Voucher"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create New Promo Voucher</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Voucher Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full uppercase font-mono tracking-wider border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ '--tw-ring-color': 'var(--brand-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Discount (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Min Order ({tenant.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeVoucher"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="activeVoucher" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Activate immediately
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
