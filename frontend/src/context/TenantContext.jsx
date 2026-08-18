import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenants, setTenants] = useState([]);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Select a tenant and apply CSS custom properties for dynamic branding
  const selectTenant = (tenant) => {
    if (!tenant) return;
    setCurrentTenant(tenant);
    localStorage.setItem('activeTenantId', tenant._id);
    localStorage.setItem('activeTenantSlug', tenant.slug);

    // Apply dynamic tenant colors to document root
    const primaryColor = tenant.branding?.primaryColor || '#6366f1';
    document.documentElement.style.setProperty('--tenant-primary', primaryColor);

    // Set glow with opacity
    const hexToRgb = (hex) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '99, 102, 241';
    };

    const rgb = hexToRgb(primaryColor);
    document.documentElement.style.setProperty('--tenant-glow', `rgba(${rgb}, 0.25)`);
  };

  // Fetch all active tenants
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenants');
      if (res.data.success && res.data.data.length > 0) {
        setTenants(res.data.data);

        // Check if there's a stored tenant or pick the first one
        const storedTenantId = localStorage.getItem('activeTenantId');
        let selected = null;

        if (storedTenantId) {
          selected = res.data.data.find((t) => t._id === storedTenantId || t.slug === storedTenantId);
        }

        if (!selected) {
          selected = res.data.data[0];
        }

        selectTenant(selected);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const switchTenant = (tenantSlugOrId) => {
    if (!tenantSlugOrId) return;
    const found = tenants.find(
      (t) => t.slug === tenantSlugOrId || t._id === tenantSlugOrId
    );
    if (found) {
      selectTenant(found);
    }
  };

  const updateCurrentTenant = (updatedTenant) => {
    setCurrentTenant(updatedTenant);
    setTenants((prev) =>
      prev.map((t) => (t._id === updatedTenant._id ? updatedTenant : t))
    );
    selectTenant(updatedTenant);
  };

  return (
    <TenantContext.Provider
      value={{
        tenants,
        currentTenant,
        loading,
        selectTenant,
        switchTenant,
        fetchTenants,
        updateCurrentTenant
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
