import { useState } from 'react';
import { 
  X, User, Search, Plus, Check, Phone, 
  Mail, MapPin, Sparkles, UserCheck, ShieldCheck
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { useTenant } from '../../context/TenantContext';

export default function CustomerSelectModal({ onClose, onSelectCustomer }) {
  const { customers, addCustomer } = usePOS();
  const { tenant } = useTenant();

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRegisterNew = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const newCustomer = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
    };

    addCustomer(newCustomer);
    onSelectCustomer(newCustomer.name);
    onClose();
  };

  const handleSelectWalkIn = () => {
    onSelectCustomer(''); // Empty name indicates standard Walk-in Guest
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Ticket Guest</h3>
              <p className="text-[10px] text-slate-400">Attach customer record to current POS order</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar + Walk-in Quick Select */}
        <div className="p-4 border-b border-slate-100 space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': 'var(--brand-primary)' }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSelectWalkIn}
              className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              Standard Walk-in Guest
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="py-1.5 px-3 rounded-xl text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddForm ? 'Close Form' : 'Register New'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {showAddForm ? (
            <form onSubmit={handleRegisterNew} className="space-y-3 animate-in fade-in">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Quick Guest Registration
              </span>

              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">Email</label>
                <input
                  type="email"
                  placeholder="maya@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl text-xs font-bold text-white shadow-xs mt-2"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                Save & Attach to Ticket
              </button>
            </form>
          ) : (
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                Registered Customer Directory ({customers.length})
              </span>

              {filtered.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
                  <p className="text-xs font-medium text-slate-600">No customers found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click "Register New" above to add real customer details
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectCustomer(c.name);
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{c.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {c.phone || c.email || 'No contact specified'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Select →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
