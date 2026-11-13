import { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { useTenant } from '../context/TenantContext';
import { BookUser, Plus, Search, Mail, Phone, ShoppingBag, Trash2 } from 'lucide-react';

export default function CustomersView() {
  const { customers, addCustomer, deleteCustomer } = usePOS();
  const { tenant } = useTenant();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addCustomer(form);
    setForm({ name: '', email: '', phone: '' });
    setShowModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
            <BookUser className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Customer CRM Directory</h2>
            <p className="text-xs text-slate-500">Track dining frequencies, lifetime value, and guest contact information</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': 'var(--brand-primary)' }}
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-center">Visits</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400">
                    <BookUser className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold text-slate-600">No customer records in CRM</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      All mock dummy records have been removed. Add real guests here or register them during checkout on the POS terminal.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-3 text-xs font-bold text-white px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow-2xs"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add First Customer
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{cust.name}</p>
                          <p className="text-[10px] text-slate-400">Guest ID: {cust.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{cust.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                        <ShoppingBag className="w-3 h-3" />
                        {cust.visits || 0} visits
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 text-sm">
                      {tenant.currencySymbol}{(cust.totalSpent || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => deleteCustomer(cust.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Guest / Customer</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Patel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Email Address</label>
                <input
                  type="email"
                  placeholder="maya@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
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
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
