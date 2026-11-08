import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Company } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  companies: Company[];
  activeCompany: Company | null;
  isLoading: boolean;
  login: (token: string, user: User, companies: Company[]) => void;
  logout: () => void;
  switchCompany: (companyId: string) => void;
  updateActiveCompany: (company: Company) => void;
  refreshUserAndCompanies: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setUser({
        id: res.data.id,
        email: res.data.email,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        phone: res.data.phone,
        avatarUrl: res.data.avatarUrl,
        isSuperAdmin: res.data.isSuperAdmin,
        isActive: res.data.isActive,
      });
      setCompanies(res.data.companies || []);

      const savedCompanyId = localStorage.getItem('companyId');
      const found = (res.data.companies || []).find((c: Company) => c.id === savedCompanyId);
      if (found) {
        setActiveCompany(found);
      } else if (res.data.companies && res.data.companies.length > 0) {
        setActiveCompany(res.data.companies[0]);
        localStorage.setItem('companyId', res.data.companies[0].id);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User, userCompanies: Company[]) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setCompanies(userCompanies);

    if (userCompanies.length > 0) {
      setActiveCompany(userCompanies[0]);
      localStorage.setItem('companyId', userCompanies[0].id);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('companyId');
    setToken(null);
    setUser(null);
    setCompanies([]);
    setActiveCompany(null);
  };

  const switchCompany = (companyId: string) => {
    const target = companies.find((c) => c.id === companyId);
    if (target) {
      setActiveCompany(target);
      localStorage.setItem('companyId', target.id);
      window.location.reload();
    }
  };

  const updateActiveCompany = (updated: Company) => {
    setActiveCompany(updated);
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        companies,
        activeCompany,
        isLoading,
        login,
        logout,
        switchCompany,
        updateActiveCompany,
        refreshUserAndCompanies: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

