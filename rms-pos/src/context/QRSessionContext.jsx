import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';

const QRSessionContext = createContext(null);

const STORAGE_KEY_TOKEN = 'loc_guest_jwt';
const STORAGE_KEY_SESSION = 'loc_guest_session';

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

  // Authenticate / Resolve QR encrypted token
  const resolveQRToken = useCallback(async (encryptedToken) => {
    setIsVerifying(true);
    setError(null);
    try {
      const data = await apiRequest(`/qr/verify/${encodeURIComponent(encryptedToken)}`);
      setToken(data.access_token);
      setSession(data);
      sessionStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data));
      // Set for client.js authorization header fallback
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
