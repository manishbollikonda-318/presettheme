import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRESET_FOODIE_BISTRO } from '../data/presets';
import { apiRequest } from '../api/client';

const TenantContext = createContext(null);

const DEFAULT_TENANT = PRESET_FOODIE_BISTRO.tenant;

function applyBrandColor(color) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', color || '#D9480F');
  // Generate a darker hover variant
  root.style.setProperty('--brand-primary-hover', '#C23E0A');
  // Generate a light variant for backgrounds
  root.style.setProperty('--brand-primary-light', (color || '#D9480F') + '18');
}

export function TenantProvider({ children }) {
  const [tenant, setTenantState] = useState(() => {
    try {
      const saved = localStorage.getItem('rms_tenant');
      return saved ? JSON.parse(saved) : DEFAULT_TENANT;
    } catch {
      return DEFAULT_TENANT;
    }
  });

  // Fetch live backend financial configuration on initial mount
  useEffect(() => {
    let mounted = true;
    async function fetchTenantConfig() {
      try {
        const data = await apiRequest('/tenants/current');
        if (mounted && data?.tenant) {
          setTenantState((prev) => ({
            ...prev,
            brandName: data.tenant.brand_name || prev.brandName,
            currencySymbol: data.tenant.currency_symbol || '₹',
            taxPercent: data.tenant.tax_percent !== undefined ? data.tenant.tax_percent : prev.taxPercent,
            serviceChargePercent: data.tenant.service_charge_percent !== undefined ? data.tenant.service_charge_percent : prev.serviceChargePercent,
          }));
        }
      } catch {
        // Fallback gracefully to local preset state
      }
    }
    fetchTenantConfig();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('rms_tenant', JSON.stringify(tenant));
    applyBrandColor(tenant.primaryColor);
    document.title = `${tenant.brandName} — POS`;
  }, [tenant]);

  useEffect(() => {
    applyBrandColor(tenant.primaryColor);
  }, []);

  const updateTenant = useCallback((updates) => {
    setTenantState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetTenant = useCallback((preset) => {
    setTenantState(preset);
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, updateTenant, resetTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be inside TenantProvider');
  return ctx;
}
