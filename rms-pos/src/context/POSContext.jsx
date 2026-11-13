import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { PRESET_FOODIE_BISTRO } from '../data/presets';

const POSContext = createContext(null);

function generateId() {
  return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateOrderId() {
  return '#' + Math.floor(1000 + Math.random() * 9000);
}

export function POSProvider({ children }) {
  // ---------- Categories ----------
  const [categories, setCategories] = useState(() => {
    try {
      const s = localStorage.getItem('rms_categories');
      return s ? JSON.parse(s) : PRESET_FOODIE_BISTRO.categories;
    } catch { return PRESET_FOODIE_BISTRO.categories; }
  });

  // ---------- Products ----------
  const [products, setProducts] = useState(() => {
    try {
      const s = localStorage.getItem('rms_products');
      return s ? JSON.parse(s) : PRESET_FOODIE_BISTRO.products;
    } catch { return PRESET_FOODIE_BISTRO.products; }
  });

  // ---------- Order Queue ----------
  const [orders, setOrders] = useState(() => {
    try {
      const s = localStorage.getItem('rms_orders');
      return s ? JSON.parse(s) : (PRESET_FOODIE_BISTRO.initialOrders || []);
    } catch { return PRESET_FOODIE_BISTRO.initialOrders || []; }
  });

  // ---------- Active Cart / Selected Order ----------
  // If there's an existing order in cooking state (like #1042), default to it or a draft
  const [selectedOrderId, setSelectedOrderId] = useState(() => {
    try {
      const s = localStorage.getItem('rms_orders');
      const loaded = s ? JSON.parse(s) : (PRESET_FOODIE_BISTRO.initialOrders || []);
      const active = loaded.find((o) => o.status === 'Cooking') || loaded[0];
      return active ? active.id : null;
    } catch {
      return PRESET_FOODIE_BISTRO.initialOrders?.[0]?.id || null;
    }
  });

  // Draft cart for when user clicks "+ New Order"
  const [draftCart, setDraftCart] = useState([]);
  const [draftOrderMeta, setDraftOrderMeta] = useState({
    orderId: generateOrderId(),
    customerName: '',
    orderType: 'Dine-In',
    tableNumber: '04',
    status: 'New',
    createdAt: new Date().toISOString(),
  });

  // Customers Raw Roster
  const [rawCustomers, setRawCustomers] = useState(() => {
    try {
      const s = localStorage.getItem('rms_customers');
      return s ? JSON.parse(s) : PRESET_FOODIE_BISTRO.customers;
    } catch { return PRESET_FOODIE_BISTRO.customers; }
  });

  // ---------- Promo Codes ----------
  const [promoCodes, setPromoCodes] = useState(() => {
    try {
      const s = localStorage.getItem('rms_promos');
      return s ? JSON.parse(s) : PRESET_FOODIE_BISTRO.promoCodes;
    } catch { return PRESET_FOODIE_BISTRO.promoCodes; }
  });

  const [appliedPromo, setAppliedPromo] = useState(null);

  // Persist helper
  const persist = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore */ }
  };

  // Dynamically compute customer analytics from ACTUAL orders (Zero fake data)
  const customers = useMemo(() => {
    return rawCustomers.map((c) => {
      const customerOrders = orders.filter(
        (o) => o.customerName && o.customerName.toLowerCase() === c.name.toLowerCase() && o.status !== 'Cancelled'
      );
      const visits = customerOrders.length;
      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      return {
        ...c,
        visits,
        totalSpent,
      };
    });
  }, [rawCustomers, orders]);

  // Determine active view order: either an existing order from queue or the draft
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = orders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return {
      id: null,
      ...draftOrderMeta,
      items: draftCart,
    };
  }, [selectedOrderId, orders, draftOrderMeta, draftCart]);

  // ===== PRODUCT CRUD =====
  const addProduct = useCallback((product) => {
    const newP = { ...product, id: generateId() };
    setProducts((prev) => {
      const next = [...prev, newP];
      persist('rms_products', next);
      return next;
    });
  }, []);

  const updateProduct = useCallback((id, updates) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      persist('rms_products', next);
      return next;
    });
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persist('rms_products', next);
      return next;
    });
  }, []);

  // ===== CATEGORY CRUD =====
  const addCategory = useCallback((cat) => {
    const newC = { ...cat, id: generateId() };
    setCategories((prev) => {
      const next = [...prev, newC];
      persist('rms_categories', next);
      return next;
    });
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persist('rms_categories', next);
      return next;
    });
  }, []);

  // ===== ACTIVE CART & ORDER MODIFICATIONS =====
  const addToCart = useCallback((product, extras = [], notes = '') => {
    if (selectedOrderId) {
      // Modify selected existing order in queue
      setOrders((prev) => {
        const next = prev.map((ord) => {
          if (ord.id !== selectedOrderId) return ord;
          const items = [...(ord.items || [])];
          const existingIdx = items.findIndex(
            (i) => i.productId === product.id && i.notes === notes && JSON.stringify(i.extras) === JSON.stringify(extras)
          );
          if (existingIdx >= 0) {
            items[existingIdx] = { ...items[existingIdx], quantity: items[existingIdx].quantity + 1 };
          } else {
            items.push({
              id: generateId(),
              productId: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              image: product.image,
              quantity: 1,
              extras,
              notes,
            });
          }
          const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
          const serviceCharge = ord.serviceCharge ? subtotal * 0.05 : 0;
          const tax = subtotal * 0.10;
          const total = subtotal + serviceCharge + tax - (ord.discount || 0);
          return { ...ord, items, subtotal, serviceCharge, tax, total };
        });
        persist('rms_orders', next);
        return next;
      });
    } else {
      // Modify draft cart
      setDraftCart((prev) => {
        const existingIdx = prev.findIndex(
          (i) => i.productId === product.id && i.notes === notes && JSON.stringify(i.extras) === JSON.stringify(extras)
        );
        if (existingIdx >= 0) {
          return prev.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [
          ...prev,
          {
            id: generateId(),
            productId: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            quantity: 1,
            extras,
            notes,
          },
        ];
      });
    }
  }, [selectedOrderId]);

  const updateCartItemQty = useCallback((itemId, delta) => {
    if (selectedOrderId) {
      setOrders((prev) => {
        const next = prev.map((ord) => {
          if (ord.id !== selectedOrderId) return ord;
          const items = (ord.items || [])
            .map((item) => (item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
            .filter((item) => item.quantity > 0);
          const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
          const serviceCharge = ord.serviceCharge ? subtotal * 0.05 : 0;
          const tax = subtotal * 0.10;
          const total = subtotal + serviceCharge + tax - (ord.discount || 0);
          return { ...ord, items, subtotal, serviceCharge, tax, total };
        });
        persist('rms_orders', next);
        return next;
      });
    } else {
      setDraftCart((prev) =>
        prev
          .map((item) => (item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
          .filter((item) => item.quantity > 0)
      );
    }
  }, [selectedOrderId]);

  const removeFromCart = useCallback((itemId) => {
    if (selectedOrderId) {
      setOrders((prev) => {
        const next = prev.map((ord) => {
          if (ord.id !== selectedOrderId) return ord;
          const items = (ord.items || []).filter((item) => item.id !== itemId);
          const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
          const serviceCharge = ord.serviceCharge ? subtotal * 0.05 : 0;
          const tax = subtotal * 0.10;
          const total = subtotal + serviceCharge + tax - (ord.discount || 0);
          return { ...ord, items, subtotal, serviceCharge, tax, total };
        });
        persist('rms_orders', next);
        return next;
      });
    } else {
      setDraftCart((prev) => prev.filter((item) => item.id !== itemId));
    }
  }, [selectedOrderId]);

  const startNewOrder = useCallback(() => {
    setSelectedOrderId(null);
    setDraftCart([]);
    setAppliedPromo(null);
    setDraftOrderMeta({
      orderId: generateOrderId(),
      customerName: '',
      orderType: 'Dine-In',
      tableNumber: '04',
      status: 'New',
      createdAt: new Date().toISOString(),
    });
  }, []);

  const selectExistingOrder = useCallback((orderId) => {
    setSelectedOrderId(orderId);
  }, []);

  const updateActiveMeta = useCallback((updates) => {
    if (selectedOrderId) {
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === selectedOrderId ? { ...o, ...updates } : o));
        persist('rms_orders', next);
        return next;
      });
    } else {
      setDraftOrderMeta((prev) => ({ ...prev, ...updates }));
    }
  }, [selectedOrderId]);

  // ===== SUBMIT / ADVANCE ORDER =====
  const submitOrder = useCallback((tenantConfig) => {
    if (selectedOrderId) {
      // Advance existing order in queue (e.g. from Cooking -> Ready -> Completed)
      const current = orders.find((o) => o.id === selectedOrderId);
      if (!current) return null;
      let nextStatus = 'Completed';
      if (current.status === 'New') nextStatus = 'Cooking';
      else if (current.status === 'Cooking') nextStatus = 'Ready';
      else if (current.status === 'Ready') nextStatus = 'Completed';

      const updated = { ...current, status: nextStatus };
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === selectedOrderId ? updated : o));
        persist('rms_orders', next);
        return next;
      });
      return updated;
    } else {
      // Submit draft cart as a brand new order
      if (draftCart.length === 0) return null;
      const subtotal = draftCart.reduce((s, i) => s + i.price * i.quantity, 0);
      const serviceCharge = subtotal * (tenantConfig.serviceChargePercent / 100);
      const tax = subtotal * (tenantConfig.taxPercent / 100);
      const discount = appliedPromo ? subtotal * (appliedPromo.discountPercent / 100) : 0;
      const total = subtotal + serviceCharge + tax - discount;

      const newOrder = {
        ...draftOrderMeta,
        id: generateId(),
        items: [...draftCart],
        subtotal,
        serviceCharge,
        tax,
        discount,
        promoCode: appliedPromo?.code || null,
        total,
        status: 'Cooking',
        createdAt: new Date().toISOString(),
      };

      setOrders((prev) => {
        const next = [newOrder, ...prev];
        persist('rms_orders', next);
        return next;
      });

      // Switch active view to this newly punched order
      setSelectedOrderId(newOrder.id);
      setDraftCart([]);
      return newOrder;
    }
  }, [selectedOrderId, orders, draftCart, draftOrderMeta, appliedPromo]);

  const updateOrderStatus = useCallback((orderId, status) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      persist('rms_orders', next);
      return next;
    });
  }, []);

  // ===== PROMOS =====
  const applyPromoCode = useCallback((code) => {
    const promo = promoCodes.find((p) => p.code.toUpperCase() === code.toUpperCase() && p.active);
    if (promo) {
      setAppliedPromo(promo);
      return { success: true, promo };
    }
    return { success: false, error: 'Invalid or inactive promo code' };
  }, [promoCodes]);

  const addPromo = useCallback((promo) => {
    const newP = { ...promo, id: generateId() };
    setPromoCodes((prev) => {
      const next = [...prev, newP];
      persist('rms_promos', next);
      return next;
    });
  }, []);

  const togglePromo = useCallback((id) => {
    setPromoCodes((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
      persist('rms_promos', next);
      return next;
    });
  }, []);

  const deletePromo = useCallback((id) => {
    setPromoCodes((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persist('rms_promos', next);
      return next;
    });
  }, []);

  // ===== CUSTOMERS =====
  const addCustomer = useCallback((cust) => {
    const newC = { ...cust, id: generateId() };
    setRawCustomers((prev) => {
      const next = [...prev, newC];
      persist('rms_customers', next);
      return next;
    });
  }, []);

  const deleteCustomer = useCallback((id) => {
    setRawCustomers((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persist('rms_customers', next);
      return next;
    });
  }, []);

  // ===== LOAD PRESET =====
  const loadPreset = useCallback((preset) => {
    setCategories(preset.categories);
    setProducts(preset.products);
    const initialOrders = preset.initialOrders || [];
    setOrders(initialOrders);
    setSelectedOrderId(initialOrders[0]?.id || null);
    setDraftCart([]);
    setRawCustomers(preset.customers || []);
    setPromoCodes(preset.promoCodes || []);
    setAppliedPromo(null);

    persist('rms_categories', preset.categories);
    persist('rms_products', preset.products);
    persist('rms_orders', initialOrders);
    persist('rms_customers', preset.customers || []);
    persist('rms_promos', preset.promoCodes || []);
  }, []);

  // ===== EXPORT / IMPORT =====
  const exportConfig = useCallback(() => {
    return { categories, products, orders, customers: rawCustomers, promoCodes };
  }, [categories, products, orders, rawCustomers, promoCodes]);

  const importConfig = useCallback((data) => {
    if (data.categories) { setCategories(data.categories); persist('rms_categories', data.categories); }
    if (data.products) { setProducts(data.products); persist('rms_products', data.products); }
    if (data.orders) {
      setOrders(data.orders);
      persist('rms_orders', data.orders);
      setSelectedOrderId(data.orders[0]?.id || null);
    }
    if (data.customers) { setRawCustomers(data.customers); persist('rms_customers', data.customers); }
    if (data.promoCodes) { setPromoCodes(data.promoCodes); persist('rms_promos', data.promoCodes); }
  }, []);

  return (
    <POSContext.Provider
      value={{
        categories, addCategory, deleteCategory,
        products, addProduct, updateProduct, deleteProduct,
        activeOrder,
        selectedOrderId,
        selectExistingOrder,
        startNewOrder,
        updateActiveMeta,
        addToCart,
        updateCartItemQty,
        removeFromCart,
        orders,
        submitOrder,
        updateOrderStatus,
        customers,
        addCustomer,
        deleteCustomer,
        promoCodes,
        applyPromoCode,
        appliedPromo,
        setAppliedPromo,
        addPromo,
        togglePromo,
        deletePromo,
        loadPreset,
        exportConfig,
        importConfig,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS must be inside POSProvider');
  return ctx;
}
