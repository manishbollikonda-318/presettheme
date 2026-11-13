import { useState } from 'react';
import { ROLES, STAFF_ACCOUNTS } from '../data/presets';
import { useAuth } from '../context/AuthContext';
import { Store, ShieldCheck, Hexagon, Code2, ChevronDown, ChevronUp, Lock, Sparkles, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_CARDS = [
  { role: ROLES.ADMIN, label: 'Super Admin', desc: 'Full access & financial settings', icon: '👨‍💼', color: '#D9480F' },
  { role: ROLES.MANAGER, label: 'Store Manager', desc: 'Operations & menu management', icon: '👩‍💼', color: '#2563EB' },
  { role: ROLES.CASHIER, label: 'Cashier / POS', desc: 'POS checkout & billing', icon: '🧑‍💻', color: '#059669' },
  { role: ROLES.WAITER, label: 'Floor Waiter', desc: 'Dining floor & table punch', icon: '🙋‍♀️', color: '#D97706' },
  { role: ROLES.KITCHEN, label: 'Kitchen Chef', desc: 'Live KDS ticket queue', icon: '👨‍🍳', color: '#DC2626' },
];

export default function LoginView() {
  const { login, loginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDevLogin, setShowDevLogin] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error || 'Invalid credentials');
    } else {
      toast.success(`Welcome back, ${result.user?.name || 'Staff'}!`);
    }
  };

  const handleDemoLogin = (role) => {
    const session = loginAs(role);
    if (session) {
      toast.success(`Logged in as ${role.toUpperCase()}: ${session.name}`);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-[#FAF9F6] text-[#1F2937] font-sans overflow-hidden">
      {/* Left side: Premium blurred cafe interior */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900 overflow-hidden select-none">
        <img
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&auto=format&fit=crop&q=80"
          alt="Artisanal Cafe Interior"
          className="w-full h-full object-cover filter brightness-75 scale-105 transform hover:scale-100 transition-transform duration-1000"
        />
        {/* Warm ambient gradient & soft frosted glass scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/50 to-stone-900/20 backdrop-blur-[2px]" />

        {/* Ambient content over image */}
        <div className="absolute inset-0 p-12 flex flex-col justify-between z-10 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D9480F] flex items-center justify-center shadow-lg shadow-orange-950/40">
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">LOC • RMS</h2>
              <p className="text-xs text-stone-300 font-medium">Smart QR Restaurant Management</p>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-orange-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ovenstory-Inspired Experience</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
              Artisanal Dining, <br />
              <span className="text-[#FDBA74]">Digitally Perfected.</span>
            </h1>

            <p className="text-sm text-stone-300 leading-relaxed font-normal">
              High-speed POS, real-time Kitchen Display System, and table-verified anti-tamper QR ordering in one cohesive platform.
            </p>

            <div className="pt-2 flex items-center gap-6 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AES-256 Table Shield</span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>Live SSE KDS</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-400" />
                <span>RS256 JWT Auth</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-stone-400">
            © {new Date().getFullYear()} TableCraft Restaurant OS. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side: Sleek glassmorphism login form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between items-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto py-6">
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#D9480F] flex items-center justify-center text-white shadow-md">
              <Hexagon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937]">LOC • RMS</h1>
              <p className="text-xs text-stone-500">Smart QR Restaurant Suite</p>
            </div>
          </div>

          {/* Glass Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">Staff Sign In</h2>
              <p className="text-xs text-stone-500 mt-1">
                Enter your credentials to access the POS terminal & kitchen dispatch
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 mb-1.5 block">Staff Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rms.io"
                  className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-[#1F2937] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition-all"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700 block">Password</label>
                  <span className="text-[11px] text-stone-400">Default: admin123</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-[#1F2937] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#D9480F] hover:bg-[#C23E0A] text-white rounded-xl py-3 text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-98"
              >
                Sign In to Terminal
              </button>
            </form>
          </div>

          {/* Minimal Developer Login Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowDevLogin(!showDevLogin)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-white/70 hover:bg-stone-50 text-[11px] font-semibold text-stone-500 hover:text-stone-800 transition shadow-2xs"
            >
              <Code2 className="w-3.5 h-3.5 text-[#D9480F]" />
              <span>Developer Login (1-Click Demo)</span>
              {showDevLogin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Expandable Role Cards */}
            {showDevLogin && (
              <div className="mt-4 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-stone-200/80 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center justify-between">
                  <span>Fast Sandbox Personas</span>
                  <span className="text-[9px] text-[#D9480F]">Click to switch</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_CARDS.map((card) => {
                    const account = STAFF_ACCOUNTS.find((s) => s.role === card.role);
                    return (
                      <button
                        key={card.role}
                        onClick={() => handleDemoLogin(card.role)}
                        className="p-3 rounded-xl border border-stone-200/80 hover:border-[#D9480F] bg-stone-50/50 hover:bg-orange-50/30 transition text-left flex items-center gap-3 group"
                      >
                        <span className="text-xl shrink-0">{card.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#1F2937] group-hover:text-[#D9480F] transition-colors truncate">
                            {card.label}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono truncate">{account?.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full text-center text-[10px] text-stone-400 pt-4">
          TableCraft RMS • Free Tier Production Ready
        </div>
      </div>
    </div>
  );
}
