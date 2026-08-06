'use client';

import React from 'react';
import { usePermissionContext } from './PermissionContext';

interface CanProps {
  I: string; // the required permission name, e.g., "approve_invoice"
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ I, children, fallback = null }) => {
  const { permissions, role, loading } = usePermissionContext();

  if (loading) {
    return null;
  }

  // Admin and Super Admin roles automatically bypass all permission checks
  const hasAccess =
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    permissions.includes(I);

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export const usePermission = () => {
  const { permissions, role, loading } = usePermissionContext();

  const can = (permissionName: string): boolean => {
    if (loading) return false;
    return role === 'ADMIN' || role === 'SUPER_ADMIN' || permissions.includes(permissionName);
  };

  return { can, permissions, role, loading };
};
