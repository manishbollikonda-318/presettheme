import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { usePOS } from '../../context/POSContext';
import { apiRequest } from '../../api/client';
import toast from 'react-hot-toast';
import { 
  PRESET_FOODIE_BISTRO, 
  PRESET_COFFEE_CAFE, 
  PRESET_FINE_DINING 
} from '../../data/presets';
import { 
  Settings, Palette, Sparkles, Download, Upload, 
  RotateCcw, Check, Building2, Receipt, Coins, Phone, MapPin,
  ShieldAlert, Percent, IndianRupee, Save, RefreshCw, LogOut, UserCheck
} from 'lucide-react';

const COLOR_SWATCHES = [
  { name: 'Deep Terracotta', hex: '#D9480F' },
  { name: 'Warm Amber', hex: '#D97706' },
  { name: 'Emerald Green', hex: '#16A34A' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Espresso Dark', hex: '#1F2937' },
  { name: 'Modern Rose', hex: '#E11D48' },
];

export default function AdminSettingsView() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tenant, updateTenant, resetTenant } = useTenant();
  const { loadPreset, exportConfig, importConfig } = usePOS();

  const [brandName, setBrandName] = useState(tenant.brandName || 'Foodie');
  const [tagline, setTagline] = useState(tenant.tagline || '');
  const [address, setAddress] = useState(tenant.address || '');
  const [phone, setPhone] = useState(tenant.phone || '');
  const [receiptFooter, setReceiptFooter] = useState(tenant.receiptFooter || '');
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor || '#D9480F');
  const [currencySymbol, setCurrencySymbol] = useState(tenant.currencySymbol || '₹');
  const [taxPercent, setTaxPercent] = useState(tenant.taxPercent ?? 5.0);
  const [serviceChargePercent, setServiceChargePercent] = useState(tenant.serviceChargePercent ?? 0.0);
  const [numberOfTables, setNumberOfTables] = useState(tenant.numberOfTables || 12);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state if tenant updates externally
  useEffect(() => {
    setBrandName(tenant.brandName || 'Foodie');
    setTaxPercent(tenant.taxPercent ?? 5.0);
    setServiceChargePercent(tenant.serviceChargePercent ?? 0.0);
    setCurrencySymbol(tenant.currencySymbol || '₹');
    setPrimaryColor(tenant.primaryColor || '#D9480F');
  }, [tenant]);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to end your session and log out?')) return;
    setIsLoggingOut(true);
    try {
      await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {
      // ignore
    } finally {
      logout();
      toast.success('Successfully logged out.');
      navigate('/login');
    }
  };

  // Admin Role Gate
  if (!user || user.role !== 'admin') {
    return (
      <div className="h-full w-full bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 text-[#D9480F] flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1F2937]">Admin Access Restricted</h2>
        <p className="text-xs text-stone-500 mt-2 max-w-sm leading-relaxed">
          The Financial Configuration panel and store tax controls are restricted exclusively to staff with the <span className="font-bold text-[#D9480F]">Admin</span> role.
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 px-5 py-2.5 rounded-xl bg-[#D9480F] text-white text-xs font-bold flex items-center gap-2 shadow-xs hover:bg-[#C23E0A] transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    );
  }

  const handleSaveFinancialConfig = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const parsedTax = parseFloat(taxPercent) || 0;
      const parsedService = parseFloat(serviceChargePercent) || 0;

      // Send PATCH to backend tenant API
      await apiRequest('/tenants/current', {
        method: 'PATCH',
        body: JSON.stringify({
          tax_percent: parsedTax,
          service_charge_percent: parsedService,
          brand_name: brandName,
          currency_symbol: currencySymbol,
        }),
      });

      // Update global context state
      updateTenant({
        brandName,
        tagline,
        address,
        phone,
        receiptFooter,
        primaryColor,
        currencySymbol,
        taxPercent: parsedTax,
        serviceChargePercent: parsedService,
        numberOfTables: Number(numberOfTables),
      });

      toast.success('Restaurant financial rates & settings saved successfully!');
    } catch (err) {
      console.warn('Backend update failed, persisting locally in TenantContext:', err);
      updateTenant({
        brandName,
        tagline,
        address,
        phone,
        receiptFooter,
        primaryColor,
        currencySymbol,
        taxPercent: parseFloat(taxPercent) || 0,
        serviceChargePercent: parseFloat(serviceChargePercent) || 0,
        numberOfTables: Number(numberOfTables),
      });
      toast.success('Settings saved to local store.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorChange = (hex) => {
    setPrimaryColor(hex);
    updateTenant({ primaryColor: hex });
    toast.success(`Theme palette updated to ${hex}`);
  };

  const handleApplyPreset = (name, preset) => {
    loadPreset(preset);
    updateTenant(preset.tenant);
    setBrandName(preset.tenant.brandName || '');
    setPrimaryColor(preset.tenant.primaryColor || '#D9480F');
    setTaxPercent(preset.tenant.taxPercent ?? 5.0);
    setServiceChargePercent(preset.tenant.serviceChargePercent ?? 0.0);
    setCurrencySymbol(preset.tenant.currencySymbol || '₹');
    toast.success(`Activated ${name} preset successfully!`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F6] overflow-y-auto font-sans">
      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-stone-200/80 bg-white/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1F2937] tracking-tight">
              Restaurant System Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#D9480F] text-xs font-mono font-bold">
              Admin Control
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Configure financial GST rates, brand identity, presets, and account security.
          </p>
        </div>

        {/* Global Save and Logout Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-2 transition active:scale-98"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
          </button>

          <button
            type="submit"
            form="financial-form"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#D9480F] hover:bg-[#C23E0A] text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow active:scale-98 transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-5xl">
        {/* 1. FINANCIAL & TAXATION FORM */}
        <form id="financial-form" onSubmit={handleSaveFinancialConfig} className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#D9480F] flex items-center justify-center shadow-xs">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">Financial & Taxation Rates</h2>
              <p className="text-xs text-stone-500">Live tax rates are automatically applied across POS checkout, Customer QR drawer, and PDF invoices.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5 flex items-center gap-1.5">
                <span>GST / VAT Tax Rate (%)</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">%</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Default is 5.00% GST for restaurants in India.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                Service Charge (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={serviceChargePercent}
                  onChange={(e) => setServiceChargePercent(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">%</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Applies solely to Dine-In table orders.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-[#D9480F]" />
                <span>Currency Symbol</span>
              </label>
              <input
                type="text"
                required
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F]"
                maxLength={5}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                Brand Display Name
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F]"
                maxLength={50}
              />
            </div>
          </div>
        </form>

        {/* 2. BRAND PALETTE */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#D9480F] flex items-center justify-center shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">Store Brand Palette</h2>
              <p className="text-xs text-stone-500">Select an appetizing aesthetic for POS and customer QR menus</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => handleColorChange(swatch.hex)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition shadow-2xs ${
                  primaryColor.toLowerCase() === swatch.hex.toLowerCase()
                    ? 'border-[#D9480F] bg-orange-50/60 text-[#D9480F] font-bold'
                    : 'border-stone-200/80 bg-white/70 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: swatch.hex }}
                />
                <span>{swatch.name}</span>
                {primaryColor.toLowerCase() === swatch.hex.toLowerCase() && (
                  <Check className="w-3 h-3 text-[#D9480F]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. PRESETS SELECTION */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">Demo Store Presets</h2>
              <p className="text-xs text-stone-500">1-Click switch between pre-configured dining concepts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => handleApplyPreset('Foodie Artisan Bistro', PRESET_FOODIE_BISTRO)}
              className="p-4 rounded-xl border border-stone-200/80 hover:border-[#D9480F] bg-white/60 hover:bg-orange-50/20 text-left transition flex flex-col justify-between shadow-2xs"
            >
              <div>
                <p className="text-sm font-bold text-[#1F2937]">Foodie Bistro</p>
                <p className="text-[11px] text-stone-500 mt-1">Terracotta theme, 5% GST, Indian Rupee</p>
              </div>
              <span className="text-[11px] font-bold text-[#D9480F] mt-3">Activate →</span>
            </button>

            <button
              onClick={() => handleApplyPreset('Roast & Bean Cafe', PRESET_COFFEE_CAFE)}
              className="p-4 rounded-xl border border-stone-200/80 hover:border-[#D9480F] bg-white/60 hover:bg-orange-50/20 text-left transition flex flex-col justify-between shadow-2xs"
            >
              <div>
                <p className="text-sm font-bold text-[#1F2937]">Roast & Bean</p>
                <p className="text-[11px] text-stone-500 mt-1">Espresso & bakery specials, 5% Tax</p>
              </div>
              <span className="text-[11px] font-bold text-[#D9480F] mt-3">Activate →</span>
            </button>

            <button
              onClick={() => handleApplyPreset('L’Étoile Fine Dining', PRESET_FINE_DINING)}
              className="p-4 rounded-xl border border-stone-200/80 hover:border-[#D9480F] bg-white/60 hover:bg-orange-50/20 text-left transition flex flex-col justify-between shadow-2xs"
            >
              <div>
                <p className="text-sm font-bold text-[#1F2937]">L'Étoile Luxury</p>
                <p className="text-[11px] text-stone-500 mt-1">Course tasting menu, 10% Service Charge</p>
              </div>
              <span className="text-[11px] font-bold text-[#D9480F] mt-3">Activate →</span>
            </button>
          </div>
        </div>

        {/* 4. ACCOUNT & SESSION SECURITY CARD */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">Active Staff Session</h2>
              <p className="text-xs text-stone-500">Logged in as {user?.name} ({user?.email}) • Role: {user?.role?.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs font-semibold text-[#1F2937]">End Current Session</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Clears local access tokens, active cookies, and redirects safely back to the login gateway.</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Log Out Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
