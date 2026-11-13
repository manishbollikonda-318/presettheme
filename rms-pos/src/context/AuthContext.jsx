import { createContext, useContext, useState, useCallback } from 'react';
import { STAFF_ACCOUNTS, ROLE_PERMISSIONS } from '../data/presets';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rms_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [staffList, setStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('rms_staff');
      return saved ? JSON.parse(saved) : STAFF_ACCOUNTS;
    } catch {
      return STAFF_ACCOUNTS;
    }
  });

  const login = useCallback((email, password) => {
    const found = staffList.find(
      (s) => s.email.toLowerCase() === email.toLowerCase() && s.password === password
    );
    if (found) {
      const session = { ...found };
      delete session.password;
      setUser(session);
      localStorage.setItem('rms_user', JSON.stringify(session));
      return { success: true, user: session };
    }
    return { success: false, error: 'Invalid email or password' };
  }, [staffList]);

  const loginAs = useCallback((role) => {
    const found = staffList.find((s) => s.role === role);
    if (found) {
      const session = { ...found };
      delete session.password;
      setUser(session);
      localStorage.setItem('rms_user', JSON.stringify(session));
      return session;
    }
    return null;
  }, [staffList]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('rms_user');
  }, []);

  const hasPermission = useCallback(
    (route) => {
      if (!user) return false;
      const perms = ROLE_PERMISSIONS[user.role] || [];
      return perms.includes(route);
    },
    [user]
  );

  const updateStaff = useCallback((updatedList) => {
    setStaffList(updatedList);
    localStorage.setItem('rms_staff', JSON.stringify(updatedList));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginAs, logout, hasPermission, staffList, updateStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
