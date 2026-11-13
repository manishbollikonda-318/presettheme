import { usePOS } from '../context/POSContext';
import { useTenant } from '../context/TenantContext';
import { 
  TrendingUp, ShoppingCart, Users, DollarSign, 
  ArrowUpRight, Clock, CheckCircle2, Flame, Award, ChefHat
} from 'lucide-react';

export default function OverviewView() {
  const { orders, products, customers, categories } = usePOS();
  const { tenant } = useTenant();

  // Real calculations with ZERO fake hardcoded numbers
  const completedOrders = orders.filter((o) => o.status === 'Completed');
  const activeOrders = orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled');
  
  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt || Date.now());
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const todayRevenue = todayOrders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const averageTicket = orders.length > 0 ? totalRevenue / Math.max(1, orders.length) : 0;
  const fulfillmentRate = orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 100;

  const totalDishesSold = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0);

  // Compute actual best selling dishes from real order line items
  const productSalesMap = {};
  orders.forEach((o) => {
    if (o.status !== 'Cancelled') {
      o.items?.forEach((item) => {
        productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.quantity;
      });
    }
  });

  const topSellingList = products
    .map((p) => ({
      ...p,
      soldCount: productSalesMap[p.name] || 0,
    }))
    .sort((a, b) => b.soldCount - a.soldCount || b.rating - a.rating)
    .slice(0, 5);

  const stats = [
    {
      label: 'Gross Sales Volume',
      value: `${tenant.currencySymbol}${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      subText: `${orders.length} total tickets logged`,
    },
    {
      label: "Today's Direct Sales",
      value: `${tenant.currencySymbol}${todayRevenue.toFixed(2)}`,
      icon: TrendingUp,
      subText: `${todayOrders.length} tickets punched today`,
    },
    {
      label: 'Active Queue Tickets',
      value: activeOrders.length,
      icon: ShoppingCart,
      subText: `${orders.filter((o) => o.status === 'Cooking').length} cooking in kitchen`,
    },
    {
      label: 'Average Order Value (AOV)',
      value: `${tenant.currencySymbol}${averageTicket.toFixed(2)}`,
      icon: Award,
      subText: `${totalDishesSold} total dishes ordered`,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5 select-none">
      {/* Top Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {tenant.brandName} Operations Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time sales velocity, kitchen ticket completion, and inventory movement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live POS Synchronization Active
          </span>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">{stat.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.subText}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Split: Recent Live Orders & Top Dishes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent Orders List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Live Order Queue Feed
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {orders.length} tickets
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs">No orders recorded yet. Start punching in Point of Sale!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                      {order.orderId}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {order.customerName || 'Walk-in Guest'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {order.orderType} {order.tableNumber ? `• Table #${order.tableNumber}` : ''} • {order.items?.length || 0} items
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">
                      {tenant.currencySymbol}{order.total?.toFixed(2)}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        order.status === 'Cooking'
                          ? 'bg-amber-50 text-amber-700'
                          : order.status === 'Ready'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.status === 'Completed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-slate-500" />
              Highest Demand Dishes
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Ranked by customer orders
            </span>
          </div>

          <div className="space-y-3">
            {topSellingList.map((product, idx) => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
                <span className="text-xs font-bold text-slate-400 w-5 text-center">#{idx + 1}</span>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-11 h-11 rounded-xl object-cover bg-slate-100 shrink-0"
                  onError={(e) => {
                    e.target.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {tenant.currencySymbol}{product.price.toFixed(2)} • Rating: ★ {product.rating}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800">
                    {product.soldCount > 0 ? `${product.soldCount} ordered` : 'Available'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
