import { useState, useEffect, useRef } from 'react';
import { 
  Search, Mic, Download, Bell, Calendar, 
  Sparkles, Check, ChevronDown, Utensils, X, Clock, FileSpreadsheet, FileJson
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { 
  PRESET_FOODIE_BISTRO, 
  PRESET_COFFEE_CAFE, 
  PRESET_FINE_DINING,
  ROLES 
} from '../../data/presets';

export default function TopHeader({ searchQuery, setSearchQuery }) {
  const { exportConfig, loadPreset, orders, products, customers } = usePOS();
  const { tenant, resetTenant } = useTenant();
  const { user } = useAuth();

  const [dateStr, setDateStr] = useState('');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const presetRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Quick Preset Switcher from Top Bar (Prompt Section 4.3 requirement)
  const handleQuickPreset = (presetName, presetObj) => {
    resetTenant(presetObj.tenant);
    loadPreset(presetObj);
    setShowPresetMenu(false);
  };

  const handleExportJSON = () => {
    const data = {
      tenant,
      ...exportConfig(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenant.brandName.toLowerCase().replace(/\s+/g, '-')}-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('No orders to export.');
      return;
    }
    const headers = ['Order ID', 'Date', 'Customer', 'Type', 'Table', 'Status', 'Subtotal', 'Tax', 'Service', 'Discount', 'Total'];
    const rows = orders.map((o) => [
      o.orderId,
      new Date(o.createdAt || Date.now()).toISOString(),
      `"${o.customerName || 'Walk-in'}"`,
      o.orderType,
      o.tableNumber || '',
      o.status,
      o.subtotal?.toFixed(2) || '0.00',
      o.tax?.toFixed(2) || '0.00',
      o.serviceCharge?.toFixed(2) || '0.00',
      o.discount?.toFixed(2) || '0.00',
      o.total?.toFixed(2) || '0.00',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenant.brandName.toLowerCase().replace(/\s+/g, '-')}-sales.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    }
  };

  // Recent active events for notifications
  const recentCooking = orders.filter((o) => o.status === 'Cooking').slice(0, 3);
  const recentReady = orders.filter((o) => o.status === 'Ready').slice(0, 3);

  return (
    <header className="h-[68px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left: Global Search Input */}
      <div className="relative w-[340px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search products, orders, or customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ '--tw-ring-color': 'var(--brand-primary)' }}
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={toggleMic}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
              isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Voice Search"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-3">
        {/* Instant Concept Presets Dropdown (for Super Admin & Demos) */}
        <div className="relative" ref={presetRef}>
          <button
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className="border border-slate-200 bg-white hover:bg-slate-50 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Concept: <strong>{tenant.brandName}</strong></span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPresetMenu && (
            <div className="absolute right-0 top-10 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[10px] font-bold uppercase text-slate-400 px-3 py-1.5">
                1-Click Concept Presets
              </p>
              <button
                onClick={() => handleQuickPreset('Foodie Bistro', PRESET_FOODIE_BISTRO)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-bold text-slate-800">Foodie Bistro</p>
                  <p className="text-[10px] text-slate-400">Rice bowls, Truffle Pasta in $</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              </button>

              <button
                onClick={() => handleQuickPreset('Chai & Chill', PRESET_COFFEE_CAFE)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-bold text-slate-800">Chai & Chill Cafe</p>
                  <p className="text-[10px] text-slate-400">Coffee, Chai, Maggi in ₹</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
              </button>

              <button
                onClick={() => handleQuickPreset('La Tavola', PRESET_FINE_DINING)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-bold text-slate-800">La Tavola Pizzeria</p>
                  <p className="text-[10px] text-slate-400">Italian Wines & Pasta in €</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              </button>
            </div>
          )}
        </div>

        {/* Download Report Button with CSV/JSON dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="border border-slate-200 bg-white hover:bg-slate-50 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Download Report</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-30">
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export as CSV Spreadsheet
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <FileJson className="w-3.5 h-3.5 text-blue-600" />
                Export as Full JSON Backup
              </button>
            </div>
          )}
        </div>

        {/* Live Date Pill */}
        <div className="border border-slate-200 bg-white rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden lg:inline">{dateStr}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="border border-slate-200 rounded-xl p-2 hover:bg-slate-50 relative transition-all shadow-2xs text-slate-600"
          >
            <Bell className="w-4 h-4" />
            {recentCooking.length + recentReady.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900">Live Kitchen & Table Alerts</span>
                <span className="text-[10px] text-slate-400">{recentCooking.length + recentReady.length} alerts</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentReady.map((ord) => (
                  <div key={ord.id} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
                    <p className="font-bold text-emerald-800">
                      Ticket {ord.orderId} is Ready for Service!
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      Guest: {ord.customerName || 'Walk-in'} {ord.tableNumber ? `• Table #${ord.tableNumber}` : ''}
                    </p>
                  </div>
                ))}

                {recentCooking.map((ord) => (
                  <div key={ord.id} className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-xs">
                    <p className="font-bold text-amber-800">
                      Ticket {ord.orderId} currently Cooking
                    </p>
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      {ord.items?.length} items being prepped in kitchen
                    </p>
                  </div>
                ))}

                {recentCooking.length === 0 && recentReady.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No new kitchen notifications</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
