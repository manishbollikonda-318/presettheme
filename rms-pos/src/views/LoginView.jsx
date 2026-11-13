import { useState } from 'react';
import { ROLES, STAFF_ACCOUNTS } from '../data/presets';
import { useAuth } from '../context/AuthContext';
import { Store, ShieldCheck, Hexagon } from 'lucide-react';

const ROLE_CARDS = [
  { role: ROLES.ADMIN, label: 'Super Admin', desc: 'Full access to all modules', icon: '👨‍💼', color: '#7C3AED' },
  { role: ROLES.MANAGER, label: 'Store Manager', desc: 'All ops except Settings', icon: '👩‍💼', color: '#2563EB' },
  { role: ROLES.CASHIER, label: 'Cashier / POS', desc: 'POS, Orders, Billing', icon: '🧑‍💻', color: '#16A34A' },
  { role: ROLES.WAITER, label: 'Floor Waiter', desc: 'Dining Area & POS', icon: '🙋‍♀️', color: '#D97706' },
  { role: ROLES.KITCHEN, label: 'Kitchen Chef', desc: 'Order Queue / KDS', icon: '👨‍🍳', color: '#DC2626' },
];

export default function LoginView() {
  const { login, loginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (!result.success) setError(result.error);
  };

  const handleDemoLogin = (role) => {
    loginAs(role);
  };

  return (
    <div className="h-screen w-screen flex bg-[#F4F6F8]">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--brand-primary)' }}>
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">RMS • POS</h1>
              <p className="text-xs text-slate-500">Restaurant Management System</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rms.io"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--brand-primary)' }}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--brand-primary)' }}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="flex-1 border-t border-slate-200" />
              1-Click Demo Login
              <span className="flex-1 border-t border-slate-200" />
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Role Cards */}
      <div className="w-[440px] bg-white border-l border-slate-200 p-8 flex flex-col justify-center overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
          Quick Demo Access
        </h3>
        <p className="text-xs text-slate-400 mb-5">Click any role card to instantly log in and explore its permissions</p>

        <div className="space-y-3">
          {ROLE_CARDS.map((card) => {
            const account = STAFF_ACCOUNTS.find((s) => s.role === card.role);
            return (
              <button
                key={card.role}
                onClick={() => handleDemoLogin(card.role)}
                className="w-full border border-slate-200 rounded-xl p-4 text-left hover:shadow-md transition-all group flex items-center gap-4"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: card.color + '18', color: card.color }}
                >
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{card.label}</p>
                  <p className="text-[11px] text-slate-400">{card.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{account?.email}</p>
                </div>
                <div
                  className="text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  style={{ backgroundColor: card.color }}
                >
                  Login →
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
