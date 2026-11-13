import { useState, useRef } from 'react';
import { useTenant } from '../context/TenantContext';
import { usePOS } from '../context/POSContext';
import { 
  PRESET_FOODIE_BISTRO, 
  PRESET_COFFEE_CAFE, 
  PRESET_FINE_DINING 
} from '../data/presets';
import { 
  Settings, Palette, Sparkles, Download, Upload, 
  RotateCcw, Check, Building2, Receipt, Coins, Table, Phone, MapPin
} from 'lucide-react';

const COLOR_SWATCHES = [
  { name: 'Emerald Green', hex: '#16A34A' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Warm Amber', hex: '#D97706' },
  { name: 'Espresso Dark', hex: '#11261F' },
  { name: 'Indigo Violet', hex: '#4F46E5' },
  { name: 'Modern Rose', hex: '#E11D48' },
];

const CURRENCY_OPTIONS = ['$', '₹', '€', '£', 'Rp', '¥', 'AED', 'CAD', 'AUD'];

export default function SettingsView() {
  const { tenant, updateTenant, resetTenant } = useTenant();
  const { loadPreset, exportConfig, importConfig } = usePOS();

  const [brandName, setBrandName] = useState(tenant.brandName);
  const [tagline, setTagline] = useState(tenant.tagline);
  const [address, setAddress] = useState(tenant.address);
  const [phone, setPhone] = useState(tenant.phone);
  const [receiptFooter, setReceiptFooter] = useState(tenant.receiptFooter);
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor);
  const [currencySymbol, setCurrencySymbol] = useState(tenant.currencySymbol);
  const [taxPercent, setTaxPercent] = useState(tenant.taxPercent);
  const [serviceChargePercent, setServiceChargePercent] = useState(tenant.serviceChargePercent);
  const [numberOfTables, setNumberOfTables] = useState(tenant.numberOfTables);

  const [savedAlert, setSavedAlert] = useState(false);
  const [presetAlert, setPresetAlert] = useState('');
  const fileInputRef = useRef(null);

  const handleSaveBrand = (e) => {
    e.preventDefault();
    updateTenant({
      brandName,
      tagline,
      address,
      phone,
      receiptFooter,
      primaryColor,
      currencySymbol,
      taxPercent: Number(taxPercent),
      serviceChargePercent: Number(serviceChargePercent),
      numberOfTables: Number(numberOfTables),
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleColorChange = (hex) => {
    setPrimaryColor(hex);
    updateTenant({ primaryColor: hex });
  };

  const handleApplyPreset = (presetName, presetObj) => {
    resetTenant(presetObj.tenant);
    loadPreset(presetObj);
    
    // Update local form state
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

    setPresetAlert(presetName);
    setTimeout(() => setPresetAlert(''), 3000);
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
    a.download = `${tenant.brandName.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          setBrandName(parsed.tenantConfig.brandName);
          setTagline(parsed.tenantConfig.tagline);
          setPrimaryColor(parsed.tenantConfig.primaryColor);
          setCurrencySymbol(parsed.tenantConfig.currencySymbol);
          setTaxPercent(parsed.tenantConfig.taxPercent);
          setServiceChargePercent(parsed.tenantConfig.serviceChargePercent);
          setNumberOfTables(parsed.tenantConfig.numberOfTables);
        }
        if (parsed.posData) {
          importConfig(parsed.posData);
        }
        setPresetAlert('Custom JSON Backup Restored Successfully!');
        setTimeout(() => setPresetAlert(''), 3000);
      } catch (err) {
        alert('Invalid JSON configuration file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">White-Label Brand & Molding Studio</h2>
            <p className="text-xs text-slate-500">Zero-code white-labeling, live color reskinning, and multi-concept business presets</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Database (JSON)
          </button>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Import Setup
          </button>
        </div>
      </div>

      {presetAlert && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Active Preset Switched: <strong>{presetAlert}</strong>. Menu, pricing, currency & branding re-molded!</span>
        </div>
      )}

      {savedAlert && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl mb-5 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Brand Identity & Financial settings saved to reactive store!</span>
        </div>
      )}

      {/* Preset Buttons Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              1-Click Instant Concept Presets
            </h3>
            <p className="text-xs text-slate-400">Instantly mold the entire menu, tax rates, currencies, and brand colors for client demonstrations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Preset 1 */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-emerald-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-900">Foodie Bistro</span>
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Reference design with Rice Bowls, Truffle Pasta, Udon, Salmon in <strong>$</strong> with 10% Tax & 5% Service.
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('Foodie Bistro', PRESET_FOODIE_BISTRO)}
              className="mt-3 w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
            >
              Load Foodie Bistro
            </button>
          </div>

          {/* Preset 2 */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-amber-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-900">Chai & Chill Cafe</span>
                <span className="w-3 h-3 rounded-full bg-amber-600" />
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Late-Night Cafe with Frappes, Masala Chai, Veg Maggi, Brownie in <strong>₹</strong> with 5% GST & 0% Service.
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('Chai & Chill Cafe', PRESET_COFFEE_CAFE)}
              className="mt-3 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Load Coffee & Cafe
            </button>
          </div>

          {/* Preset 3 */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-red-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-900">La Tavola Pizzeria</span>
                <span className="w-3 h-3 rounded-full bg-red-600" />
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Fine Italian Dining with Chianti Wine, Osso Buco, Tiramisu in <strong>€</strong> with 12% Tax & 10% Service.
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('La Tavola Pizzeria', PRESET_FINE_DINING)}
              className="mt-3 w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Load Fine Dining
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveBrand} className="space-y-6">
        {/* Dynamic Brand Identity & Accent Theme */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-600" />
            Brand Appearance & Dynamic Accent Theme
          </h3>

          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-700 mb-2 block">
              Global Brand Accent Color (var(--brand-primary))
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  type="button"
                  key={swatch.hex}
                  onClick={() => handleColorChange(swatch.hex)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    primaryColor === swatch.hex
                      ? 'ring-2 ring-offset-2 ring-slate-900 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.name}
                >
                  {primaryColor === swatch.hex && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}

              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer border-0 p-0"
                />
                <span className="font-mono text-xs text-slate-600">{primaryColor}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Restaurant / Brand Name</label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Brand Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            Outlet Location & Receipt Header Info
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Phone / Contact</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div className="col-span-full">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Receipt Footer Greetings</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Financial Rules & Currency */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Coins className="w-4 h-4 text-slate-600" />
            Financial Engine, Tax & Table Capacity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Currency Symbol</label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none font-bold"
              >
                {CURRENCY_OPTIONS.map((sym) => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Service Charge (%)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={serviceChargePercent}
                onChange={(e) => setServiceChargePercent(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Total Dining Tables</label>
              <input
                type="number"
                min="1"
                max="100"
                value={numberOfTables}
                onChange={(e) => setNumberOfTables(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Save All Configurations
          </button>
        </div>
      </form>
    </div>
  );
}
