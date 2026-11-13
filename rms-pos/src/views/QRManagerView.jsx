import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import toast from 'react-hot-toast';
import {
  QrCode,
  Plus,
  Printer,
  Trash2,
  Edit2,
  RefreshCw,
  ShieldCheck,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function QRManagerView() {
  const { user } = useAuth();
  const { tenant } = useTenant();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkCount, setBulkCount] = useState(15);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // Edit table modal state
  const [editingTable, setEditingTable] = useState(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [isUpdating, setIsUpdating] = useState(false);

  // Print sheet container ref
  const printSheetRef = useRef(null);

  // Fetch tables
  const loadData = async () => {
    setLoading(true);
    try {
      const tableRes = await apiRequest('/tables').catch(() => ({ tables: [] }));
      setTables(tableRes.tables || []);
    } catch (err) {
      console.warn('Data fetch error, using resilient fallback tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Bulk Auto-Generate Tables 1 to N
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    const count = parseInt(bulkCount, 10);
    if (isNaN(count) || count < 1 || count > 50) {
      toast.error('Please specify a number between 1 and 50.');
      return;
    }

    setIsBulkGenerating(true);
    let createdCount = 0;

    try {
      for (let i = 1; i <= count; i++) {
        const tableNum = String(i);
        let existing = tables.find(
          (t) => t.table_number === tableNum || t.table_number === String(i).padStart(2, '0')
        );

        if (!existing) {
          try {
            await apiRequest('/tables', {
              method: 'POST',
              body: JSON.stringify({
                table_number: tableNum,
                capacity: 4,
              }),
            });
            createdCount++;
          } catch (tErr) {
            // Already exists or DB constraint handled
          }
        }
      }

      toast.success(`Generated ${createdCount} physical spot tables!`);
      await loadData();
    } catch (err) {
      toast.error(`Auto-generate failed: ${err.message}`);
    } finally {
      setIsBulkGenerating(false);
    }
  };

  // Delete Table / Close session
  const handleDeleteTable = async (tableId, tableNum) => {
    if (!confirm(`Are you sure you want to delete Table #${tableNum} and terminate all active dining sessions?`)) {
      return;
    }

    try {
      await apiRequest(`/tables/${tableId}/close-session`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Table deleted by admin' }),
      });
      toast.success(`Table #${tableNum} closed and reset.`);
      await loadData();
    } catch (err) {
      toast.error(`Could not close table: ${err.message}`);
    }
  };

  // Update Table Details
  const handleUpdateTable = async (e) => {
    e.preventDefault();
    if (!editingTable) return;

    setIsUpdating(true);
    try {
      await apiRequest(`/tables/${editingTable.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          table_number: newTableNumber,
          capacity: parseInt(newCapacity, 10),
        }),
      });
      toast.success(`Table updated to #${newTableNumber}!`);
      setEditingTable(null);
      await loadData();
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // 1-Click PDF Export Trigger via Browser Print Engine
  const handlePrintPDF = () => {
    window.print();
  };

  // Build live spot URL: format ${window.location.origin}/qr/TABLE-${table_number}
  const qrDisplayList = tables.map((t) => {
    const rawNumber = String(t.table_number).replace(/^TABLE-/i, '').replace(/^#/, '');
    const spotUrl = `${window.location.origin}/qr/TABLE-${rawNumber}`;

    return {
      table_id: t.id,
      table_number: rawNumber,
      display_label: `TABLE-${rawNumber}`,
      capacity: t.capacity || 4,
      is_active: t.is_active,
      scan_url: spotUrl,
    };
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F6F8] overflow-y-auto font-sans">
      {/* Top Action Bar */}
      <div className="p-6 pb-4 border-b border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1F2937] tracking-tight">
              Table & Spot QR Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#D9480F] text-xs font-mono font-bold">
              Real Spot QR Engine
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real QR codes encoding direct table links ({`${window.location.origin}/qr/TABLE-{n}`}) bound to KDS order tickets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 text-xs font-semibold flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 rounded-xl bg-[#D9480F] hover:bg-[#C23E0A] text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow active:scale-98 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Download All QRs (PDF)</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl">
        {/* Bulk Auto-Generator Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#D9480F] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F2937]">Bulk Table & QR Auto-Generator</h2>
              <p className="text-xs text-stone-500">Automatically provision sequential dining tables (1 through N) with scannable Spot QR URLs.</p>
            </div>
          </div>

          <form onSubmit={handleBulkGenerate} className="flex items-center gap-3 mt-4">
            <div className="relative w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                Count:
              </span>
              <input
                type="number"
                min="1"
                max="50"
                value={bulkCount}
                onChange={(e) => setBulkCount(e.target.value)}
                className="w-full pl-16 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#D9480F]/20 focus:border-[#D9480F]"
              />
            </div>

            <button
              type="submit"
              disabled={isBulkGenerating}
              className="px-5 py-2.5 rounded-xl bg-[#1F2937] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-xs active:scale-98 transition disabled:opacity-50"
            >
              {isBulkGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisioning Tables...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Auto-Generate Tables 1 to {bulkCount}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* QR Data Table */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#D9480F]" />
              <h2 className="font-bold text-sm text-[#1F2937]">Active Spot QR Codes</h2>
              <span className="text-xs text-stone-400 font-mono">({qrDisplayList.length} Total)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-stone-100 text-stone-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Table Number</th>
                  <th className="px-6 py-3.5">Real QR Component</th>
                  <th className="px-6 py-3.5">Capacity</th>
                  <th className="px-6 py-3.5">Spot Routing URL</th>
                  <th className="px-6 py-3.5">Direct Link</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {qrDisplayList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-stone-400">
                      No tables found. Use the Bulk Auto-Generator above to create tables 1 to 15.
                    </td>
                  </tr>
                ) : (
                  qrDisplayList.map((item) => (
                    <tr key={item.table_id || item.table_number} className="hover:bg-stone-50/60 transition">
                      <td className="px-6 py-4 font-bold text-[#1F2937]">
                        <span className="px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200/60 font-mono text-xs text-[#D9480F]">
                          Table #{item.table_number}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="p-1.5 bg-white border border-stone-200 rounded-lg inline-block shadow-2xs">
                          <QRCodeSVG
                            value={item.scan_url}
                            size={52}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4 text-stone-600 font-medium">
                        {item.capacity} Guests
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-600 bg-stone-50 px-2 py-1 rounded border border-stone-200/60 max-w-xs truncate">
                          <span>{item.scan_url}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <a
                          href={item.scan_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#D9480F] hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>Open Menu</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingTable(item);
                              setNewTableNumber(item.table_number);
                              setNewCapacity(item.capacity);
                            }}
                            title="Edit Table Details"
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteTable(item.table_id, item.table_number)}
                            title="Reset / Delete Table"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-bold text-sm text-[#1F2937]">
                Edit Table #{editingTable.table_number}
              </h3>
              <button
                onClick={() => setEditingTable(null)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#D9480F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#D9480F]"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="flex-1 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#D9480F] hover:bg-[#C23E0A] rounded-xl transition shadow-xs"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Container: Activated during window.print() */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8" ref={printSheetRef}>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block, .print\\:block * {
              visibility: visible;
            }
            .print\\:block {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
          }
        `}</style>

        <div className="text-center mb-8 border-b-2 border-stone-900 pb-4">
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {tenant?.brandName || 'LOC Restaurant'} • Table QR Standees
          </h1>
          <p className="text-sm text-stone-600 mt-1 font-medium">
            Scan to order directly. Food will be served straight to your table.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {qrDisplayList.map((item) => (
            <div
              key={item.table_id || item.table_number}
              className="border-2 border-dashed border-stone-400 rounded-3xl p-5 flex flex-col items-center justify-between text-center bg-white page-break-inside-avoid"
            >
              <div className="w-full text-center pb-2 border-b border-stone-200">
                <p className="text-xs uppercase tracking-widest font-black text-stone-500">Scan to Order</p>
                <h3 className="text-2xl font-black text-stone-900 font-mono mt-0.5">
                  Table #{item.table_number}
                </h3>
              </div>

              <div className="py-4">
                <QRCodeSVG
                  value={item.scan_url}
                  size={140}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="w-full pt-2 border-t border-stone-200 text-[11px] text-stone-600 font-medium">
                <p className="font-bold text-stone-900">{tenant?.brandName || 'Foodie Bistro'}</p>
                <p className="text-[9px] text-stone-400 mt-0.5">Point camera at QR code</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
