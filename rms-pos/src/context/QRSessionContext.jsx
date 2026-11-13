import { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest } from '../api/client';

const QRSessionContext = createContext(null);

const STORAGE_KEY_TOKEN = 'qr_guest_jwt';
const STORAGE_KEY_SESSION = 'qr_guest_session';
const STORAGE_KEY_TABLE = 'qr_table_number';

export function QRSessionProvider({ children }) {
  const [tableNumber, setTableNumberState] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_TABLE) || '01';
    } catch {
      return '01';
    }
  });

  const [session, setSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_TOKEN);
    } catch {
      return null;
    }
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  // Directly set and lock table number from URL route
  const setTableNumber = useCallback((num) => {
    if (!num) return;
    const clean = String(num).replace(/^TABLE-/i, '').replace(/^#/, '');
    setTableNumberState(clean);
    sessionStorage.setItem(STORAGE_KEY_TABLE, clean);

    // Sync session table representation
    setSession((prev) => ({
      ...(prev || {}),
      table: { number: clean, id: `tbl-${clean}` },
    }));
  }, []);

  // Authenticate / Resolve Spot QR or encrypted token
  const resolveQRToken = useCallback(async (tokenOrTable) => {
    if (!tokenOrTable) return;
    setIsVerifying(true);
    setError(null);

    // If param is TABLE-X or number, handle directly as spot table
    if (String(tokenOrTable).startsWith('TABLE-') || !isNaN(Number(tokenOrTable))) {
      const cleanNum = String(tokenOrTable).replace(/^TABLE-/i, '');
      setTableNumber(cleanNum);

      try {
        const data = await apiRequest(`/qr/demo/${encodeURIComponent(cleanNum)}`);
        setToken(data.access_token);
        setSession(data);
        sessionStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
        sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data));
        return data;
      } catch (err) {
        // Resilient fallback
        const fallback = {
          access_token: `guest-token-table-${cleanNum}`,
          tenant_name: 'Foodie Bistro',
          table: { number: cleanNum, id: `tbl-${cleanNum}` },
        };
        setToken(fallback.access_token);
        setSession(fallback);
        sessionStorage.setItem(STORAGE_KEY_TOKEN, fallback.access_token);
        sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(fallback));
        return fallback;
      } finally {
        setIsVerifying(false);
      }
    }

    try {
      const data = await apiRequest(`/qr/verify/${encodeURIComponent(tokenOrTable)}`);
      setToken(data.access_token);
      setSession(data);
      if (data?.table?.number) {
        setTableNumber(data.table.number);
      }
      sessionStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data));
      localStorage.setItem('rms_jwt_access', data.access_token);
      return data;
    } catch (err) {
      const msg = err.message || 'Table QR code is invalid or has expired';
      setError(msg);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  }, [setTableNumber]);

  const activateDemoTable = useCallback(async (num = '01') => {
    const cleanNum = String(num).replace(/^TABLE-/i, '').replace(/^#/, '');
    setTableNumber(cleanNum);
    return resolveQRToken(`TABLE-${cleanNum}`);
  }, [setTableNumber, resolveQRToken]);

  const clearSession = useCallback(() => {
    setToken(null);
    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    sessionStorage.removeItem(STORAGE_KEY_TABLE);
  }, []);

  const value = {
    tableNumber,
    setTableNumber,
    session,
    token,
    isVerifying,
    error,
    resolveQRToken,
    activateDemoTable,
    clearSession,
  };

  return (
    <QRSessionContext.Provider value={value}>
      {children}
    </QRSessionContext.Provider>
  );
}

export function useQRSession() {
  const ctx = useContext(QRSessionContext);
  if (!ctx) {
    throw new Error('useQRSession must be used within a QRSessionProvider');
  }
  return ctx;
}
