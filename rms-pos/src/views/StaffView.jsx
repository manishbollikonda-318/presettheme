import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_PERMISSIONS } from '../data/presets';
import { Users, Shield, Plus, Key, Mail, Trash2, CheckCircle2 } from 'lucide-react';

export default function StaffView() {
  const { staffList, updateStaff, user: currentUser } = useAuth();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.CASHIER,
    avatar: '🧑‍💼',
  });

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    const newStaff = {
      id: 'u-' + Date.now().toString(36),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password || 'password123',
      role: form.role,
      avatar: form.avatar,
    };

    updateStaff([...staffList, newStaff]);
    setForm({ name: '', email: '', password: '', role: ROLES.CASHIER, avatar: '🧑‍💼' });
    setShowAddModal(false);
  };

  const handleDeleteStaff = (id) => {
    if (staffList.length <= 1) return;
    updateStaff(staffList.filter((s) => s.id !== id));
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case ROLES.MANAGER:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case ROLES.CASHIER:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case ROLES.WAITER:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case ROLES.KITCHEN:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Staff & Role-Based Access (RBAC)</h2>
            <p className="text-xs text-slate-500">Configure personnel accounts and module permissions across your outlet</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Invite Staff Member
        </button>
      </div>

      {/* Staff Roster */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Current Staff Directory ({staffList.length})</h3>
          <span className="text-xs text-slate-400">Default demo passwords are role-name + 123</span>
        </div>

        <div className="divide-y divide-slate-100">
          {staffList.map((staff) => (
            <div key={staff.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                  {staff.avatar || '🧑'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{staff.name}</p>
                    {currentUser?.email === staff.email && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    {staff.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getRoleBadge(staff.role)} capitalize`}>
                  {staff.role}
                </span>

                <div className="text-right hidden sm:block">
                  <span className="text-[11px] text-slate-400 block">Accessible Modules</span>
                  <span className="text-xs font-medium text-slate-700">
                    {(ROLE_PERMISSIONS[staff.role] || []).length} modules
                  </span>
                </div>

                {staffList.length > 1 && (
                  <button
                    onClick={() => handleDeleteStaff(staff.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Remove Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Matrix Reference Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          Role Permission Matrix Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { role: ROLES.ADMIN, title: 'Super Admin', desc: 'All 10 modules + White Label Studio' },
            { role: ROLES.MANAGER, title: 'Store Manager', desc: 'Ops, POS, Inventory, Analytics, Staff' },
            { role: ROLES.CASHIER, title: 'Cashier / POS', desc: 'POS checkout, table bills, order queue' },
            { role: ROLES.WAITER, title: 'Floor Waiter', desc: 'Floor map, order punch, table state' },
            { role: ROLES.KITCHEN, title: 'Kitchen Chef', desc: 'KDS order tickets & stock out list' },
          ].map((r) => (
            <div key={r.role} className="border border-slate-200/90 rounded-xl p-3 bg-slate-50/50">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mb-1.5 ${getRoleBadge(r.role)}`}>
                {r.title}
              </span>
              <p className="text-[11px] text-slate-500 leading-snug">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add New Staff Member</h3>
            
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@rms.io"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Assigned Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none capitalize"
                  >
                    {Object.values(ROLES).map((roleVal) => (
                      <option key={roleVal} value={roleVal}>{roleVal}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Avatar Emoji</label>
                  <input
                    type="text"
                    value={form.avatar}
                    onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
