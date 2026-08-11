'use client';

import React, { createContext, useContext } from 'react';

interface PermissionContextType {
  permissions: string[];
  role: string | null;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  role: 'SUPER_ADMIN',
  loading: false
});

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Admin paneli için tüm yetkiler SUPER_ADMIN'e verilmiş
  return (
    <PermissionContext.Provider value={{ permissions: [], role: 'SUPER_ADMIN', loading: false }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissionContext = () => useContext(PermissionContext);
