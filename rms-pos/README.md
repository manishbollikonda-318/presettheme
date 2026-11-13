# White-Label, Config-Driven Restaurant Management System (RMS & POS)
*UI Reference: "Foodie" 3-Column Light SaaS POS Interface*

## Architecture Overview
The application is built on a config-driven, reactive state foundation with **zero hardcoding** in UI components:
- **`TenantContext.jsx`**: Manages dynamic branding (`brandName`, `tagline`, `logoUrl`, `address`, `phone`, `receiptFooter`), dynamic CSS variable (`--brand-primary`), currency symbol, tax %, service charge %, and table count.
- **`AuthContext.jsx`**: Handles Role-Based Access Control (RBAC), session management, active permissions, and staff roster.
- **`POSContext.jsx`**: Manages categories, product catalog CRUD, active draft cart & timer, live order queue, dining tables, promo codes/vouchers, and guest CRM.

---

## 3-Column Enterprise SaaS Layout
1. **Left Navigation Sidebar (`w-[245px]`, collapsible to `72px`)**:
   - Dynamic Hexagon Logo + `tenant.brandName`
   - Primary & Secondary navigation dynamically filtered by role permissions
   - Active orders live badge counter
   - Bottom profile card with avatar, name, role badge, email, and session logout
2. **Top Global Utility Bar (`h-[68px]`)**:
   - Global real-time search input with mic icon
   - "Download Report" (instant JSON/CSV export)
   - Live calendar date pill
   - Notification bell with unread indicator
3. **Center Main Workspace**:
   - `Products` header + `Input New Products` modal trigger
   - Dynamic category filter pill bar
   - Product Card Grid with responsive layout, ratings, descriptions, dynamic pricing, and click-to-add
4. **Right Order Queue & Billing Panel (`w-[375px]`)**:
   - Active order metadata card with status badge, guest name, table #, live preparation timer, item count, and order type selector
   - Food preparing / active cart line items with thumbnail, modifiers/extras, line subtotal, and soft green quantity controls (`-`, `Qty`, `+`)
   - Dynamic tax and billing calculator (Subtotal, Service Charge %, Tax %, Promo discounts, Net Total)
   - Action buttons: `🖨️ Print Bill` (formatted 80mm thermal receipt) and `✅ Complete` (submits order to live queue)

---

## Role-Based Access Control (RBAC) Accounts
1-Click Demo Login is available on the Login screen (`/login`):
- **Super Admin**: `admin@rms.io` / `admin123` (Full access to all 10 modules including Settings & Staff)
- **Store Manager**: `manager@rms.io` / `manager123` (Full operations, CRM, and billing)
- **Cashier / POS Operator**: `cashier@rms.io` / `cashier123` (POS checkout, dining, orders, billing)
- **Floor Waiter / Captain**: `waiter@rms.io` / `waiter123` (Interactive dining area floor plan & order punch)
- **Kitchen Chef / KDS**: `kitchen@rms.io` / `kitchen123` (KDS ticket progression & 86 stock toggles)

---

## White-Label Molding Studio (Settings)
- **Brand Identity Customizer**: Name, tagline, address, phone, receipt greetings.
- **Theme Color Swatches**: Instant color presets (`Emerald Green #16A34A`, `Royal Blue #2563EB`, `Crimson Red #DC2626`, `Warm Amber #D97706`, `Espresso Dark #11261F`, `Indigo #4F46E5`, `Rose #E11D48`) or custom hex picker dynamically update `var(--brand-primary)`.
- **Financial Engine**: Currency selector (`$`, `₹`, `€`, `£`, `Rp`, `¥`, etc.), tax rate %, service charge %, and table count.
- **1-Click Business Presets**:
  1. *Foodie Bistro*: Reference items (Rice Bowls, Truffle Pasta, Udon, Salmon) in `$`.
  2. *Chai & Chill Cafe*: Coffee, Frappes, Chai, Maggi, Brownie in `₹` with 5% GST.
  3. *La Tavola Pizzeria*: Italian antipasti, pizzas, wines, and tiramisu in `€` with 12% tax & 10% service charge.
- **Export / Import JSON**: Backup or upload any restaurant setup on the fly.
