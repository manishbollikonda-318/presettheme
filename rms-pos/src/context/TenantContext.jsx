import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRESET_FOODIE_BISTRO } from '../data/presets';

const TenantContext = createContext(null);

const DEFAULT_TENANT = PRESET_FOODIE_BISTRO.tenant;

function applyBrandColor(color) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', color);
  // Generate a darker hover variant
  root.style.setProperty('--brand-primary-hover', color);
  // Generate a light variant for backgrounds
  root.style.setProperty('--brand-primary-light', color + '18');
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
