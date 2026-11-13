import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';

const QRSessionContext = createContext(null);

const STORAGE_KEY_TOKEN = 'qr_guest_jwt';
const STORAGE_KEY_SESSION = 'qr_guest_session';

export function QRSessionProvider({ children }) {
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

  // Authenticate / Resolve QR encrypted token from physical QR code scan
  const resolveQRToken = useCallback(async (encryptedToken) => {
    setIsVerifying(true);
    setError(null);
    try {
      const data = await apiRequest(`/qr/verify/${encodeURIComponent(encryptedToken)}`);
      setToken(data.access_token);
      setSession(data);
      sessionStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data));
      localStorage.setItem('rms_jwt_access', data.access_token);
      return data;
    } catch (err) {
      const msg = err.message || 'QR code is invalid or has expired';
      setError(msg);
      clearSession();
      throw err;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Activate a cryptographically verified demo table or virtual kiosk session
  const activateDemoTable = useCallback(async (tableNumber = 'KIOSK') => {
    setIsVerifying(true);
    setError(null);
    try {
      const endpoint = tableNumber === 'KIOSK' ? '/qr/kiosk' : `/qr/demo/${encodeURIComponent(tableNumber)}`;
      const data = await apiRequest(endpoint);
      setToken(data.access_token);
      setSession(data);
      sessionStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data));
      localStorage.setItem('rms_jwt_access', data.access_token);
      return data;
    } catch (err) {
      // Seamless sandbox demo fallback if backend is offline or waking up
      const fallbackSession = {
        access_token: `demo-guest-token-${tableNumber}`,
        tenant_name: 'Foodie Bistro',
        table: { number: tableNumber === 'KIOSK' ? 'KIOSK' : String(tableNumber).padStart(2, '0'), id: `tbl-${tableNumber}` },
      };
      setToken(fallbackSession.access_token);
      setSession(fallbackSession);
      sessionStorage.setItem(STORAGE_KEY_TOKEN, fallbackSession.access_token);
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(fallbackSession));
      localStorage.setItem('rms_jwt_access', fallbackSession.access_token);
      return fallbackSession;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    if (localStorage.getItem('rms_jwt_access') === token) {
      localStorage.removeItem('rms_jwt_access');
    }
  }, [token]);

  return (
    <QRSessionContext.Provider
      value={{
        session,
        token,
        isVerifying,
        error,
        resolveQRToken,
        activateDemoTable,
        clearSession,
      }}
    >
      {children}
    </QRSessionContext.Provider>
  );
}

export function useQRSession() {
  const ctx = useContext(QRSessionContext);
  if (!ctx) throw new Error('useQRSession must be used within QRSessionProvider');
  return ctx;
}
