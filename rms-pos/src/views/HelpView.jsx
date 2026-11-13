import { HelpCircle, BookOpen, MessageSquare, Terminal, Shield, Sparkles } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

export default function HelpView() {
  const { tenant } = useTenant();

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Support & Documentation</h2>
          <p className="text-xs text-slate-500">System guidelines, operational cheatsheets, and quick reference</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">White-Label POS Architecture</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            This system runs completely config-driven with reactive state management. No restaurant branding, tax rates, currencies, or menu items are hardcoded in UI components.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Change brand colors instantly in <strong>Settings</strong></li>
            <li>Switch full restaurant concepts via <strong>1-Click Presets</strong></li>
            <li>Export/Import complete system state via JSON</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC)</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Switch between users via the Login view 1-Click demo cards to experience role-tailored workspaces:
          </p>
          <div className="text-xs text-slate-600 space-y-1">
            <p><strong>Admin:</strong> Complete system control and white-labeling</p>
            <p><strong>Manager:</strong> Operations, staff, CRM, reports</p>
            <p><strong>Cashier:</strong> Streamlined POS terminal & billing</p>
            <p><strong>Waiter:</strong> Dining table floor plan & order punching</p>
            <p><strong>Kitchen:</strong> Kitchen Display System (KDS) & 86 stock toggle</p>
          </div>
        </div>
      </div>

      {/* Operational FAQs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-600" />
          Frequently Asked Questions
        </h3>

        <div className="space-y-4 text-xs text-slate-600 divide-y divide-slate-100">
          <div className="pt-2">
            <h4 className="font-semibold text-slate-800 mb-1">How do I print an 80mm thermal receipt?</h4>
            <p className="text-slate-500">
              In the right order panel or in the <strong>Billing</strong> tab, click <strong>Print Bill</strong>. A formatted 80mm thermal slip opens ready for standard browser printing.
            </p>
          </div>

          <div className="pt-3">
            <h4 className="font-semibold text-slate-800 mb-1">How do I add modifiers or custom notes to an item?</h4>
            <p className="text-slate-500">
              When viewing products in <strong>Point of Sale</strong>, click the <strong>+</strong> button on any product card or edit products via <strong>Input New Products</strong> to configure custom add-ons.
            </p>
          </div>

          <div className="pt-3">
            <h4 className="font-semibold text-slate-800 mb-1">Can the kitchen mark an item as sold out?</h4>
            <p className="text-slate-500">
              Yes. Logged in as the <strong>Kitchen Chef</strong>, navigate to <strong>Order Queue</strong> and click <strong>Kitchen Stock Control</strong> to 86 any ingredient or dish instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
