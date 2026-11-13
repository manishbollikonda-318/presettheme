import { useState, useRef, useEffect } from 'react';
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
  ShieldAlert, Percent, IndianRupee, Save, RefreshCw
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
  const { user } = useAuth();
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
  const fileInputRef = useRef(null);

  // Sync state if tenant updates externally
  useEffect(() => {
    setBrandName(tenant.brandName || 'Foodie');
    setTaxPercent(tenant.taxPercent ?? 5.0);
    setServiceChargePercent(tenant.serviceChargePercent ?? 0.0);
    setCurrencySymbol(tenant.currencySymbol || '₹');
    setPrimaryColor(tenant.primaryColor || '#D9480F');
  }, [tenant]);

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
      const res = await apiRequest('/tenants/current', {
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

      toast.success(res.message || 'Financial settings updated successfully');
    } catch (err) {
      // Still update local context if offline/standalone
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
      toast.success('Settings saved to local session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorChange = (hex) => {
    setPrimaryColor(hex);
    updateTenant({ primaryColor: hex });
    toast.success(`Theme palette updated: ${hex}`);
  };

  const handleApplyPreset = (presetName, presetObj) => {
    resetTenant(presetObj.tenant);
    loadPreset(presetObj);
    
    setBrandName(presetObj.tenant.brandName);
    setTagline(presetObj.tenant.tagline);
    setAddress(presetObj.tenant.address);
    setPhone(presetObj.tenant.phone);
    setReceiptFooter(presetObj.tenant.receiptFooter);
    setPrimaryColor(presetObj.tenant.primaryColor);
    setCurrencySymbol(presetObj.tenant.currencySymbol);
    setTaxPercent(presetObj.tenant.taxPercent);
    setServiceChargePercent(presetObj.tenant.serviceChargePercent);
    setNumberOfTables(presetObj.tenant.numberOfTables);

    toast.success(`Activated preset: ${presetName}`);
  };

  const handleExportAll = () => {
    const fullBackup = {
      tenantConfig: tenant,
      posData: exportConfig(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenant.brandName.toLowerCase().replace(/\s+/g, '-')}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Configuration exported successfully');
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.tenantConfig) {
          resetTenant(parsed.tenantConfig);
        }
        if (parsed.posData) {
          importConfig(parsed.posData);
        }
        toast.success('Configuration imported successfully');
      } catch (err) {
        toast.error('Invalid JSON configuration file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#FAF9F6] text-[#1F2937] p-6 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-100 text-[#D9480F] text-[11px] font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin Management Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">Store & Financial Settings</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Configure dynamic taxes, service charges, brand identity, and theme colors
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200/80 bg-white/80 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200/80 bg-white/80 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* 1. FINANCIAL CONFIGURATION CARD (Mandatory Phase 3 Requirement) */}
        <form onSubmit={handleSaveFinancialConfig} className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D9480F] flex items-center justify-center shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">Financial & Tax Configuration</h2>
              <p className="text-xs text-stone-500">Live tax rates and service charges applied automatically across POS & QR carts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#D9480F]" />
                <span>GST / Tax Rate (%)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-[#1F2937] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition"
                  placeholder="5.0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">%</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Default: 5.0% for restaurant dining services</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-600" />
                <span>Service Charge Rate (%)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={serviceChargePercent}
                  onChange={(e) => setServiceChargePercent(e.target.value)}
                  className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-[#1F2937] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition"
                  placeholder="0.0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">%</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Discretionary service charge (set to 0.0% if waived)</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Restaurant Brand Name</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition"
                placeholder="Foodie Bistro"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-stone-500" />
                <span>Currency Display</span>
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F] transition"
                placeholder="₹"
                readOnly
              />
              <p className="text-[11px] text-stone-400 mt-1">Strictly localized to Indian Rupee (₹)</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D9480F] hover:bg-[#C23E0A] text-white text-xs font-bold transition shadow-sm hover:shadow active:scale-98 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Financial Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* 2. THEME & BRAND PALETTE */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D9480F] flex items-center justify-center shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">Design System Palette</h2>
              <p className="text-xs text-stone-500">Appetizing warm tones with Ovenstory-inspired terracotta primary accents</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
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
      </div>
    </div>
  );
}
