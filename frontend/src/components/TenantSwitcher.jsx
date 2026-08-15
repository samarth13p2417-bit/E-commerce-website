import React, { useState, useRef, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { Store, ChevronDown, Check, Plus, Layers, Sparkles } from 'lucide-react';

const TenantSwitcher = ({ onOpenNewTenantModal }) => {
  const { tenants, currentTenant, selectTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.45rem 0.85rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-md)',
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '0.875rem'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: currentTenant?.branding?.primaryColor || 'var(--tenant-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: '0 0 10px var(--tenant-glow)'
          }}
        >
          {currentTenant?.name?.charAt(0) || 'S'}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1' }}>
            TENANT STORE
          </div>
          <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#fff', lineHeight: '1.2' }}>
            {currentTenant?.name || 'Select Store'}
          </div>
        </div>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '0.2rem' }} />
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '280px',
            padding: '0.5rem',
            zIndex: 1100,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            background: '#0d1322'
          }}
        >
          <div
            style={{
              padding: '0.4rem 0.6rem',
              fontSize: '0.7rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Active Tenant Stores</span>
            <span className="badge badge-tenant" style={{ fontSize: '0.65rem' }}>Multi-Tenant</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
            {tenants.map((t) => {
              const isSelected = currentTenant?._id === t._id;
              return (
                <button
                  key={t._id}
                  onClick={() => {
                    selectTenant(t);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '5px',
                        background: t.branding?.primaryColor || '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#fff' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        /{t.slug} • {t.plan}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={16} style={{ color: 'var(--tenant-primary)' }} />}
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenNewTenantModal();
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={14} />
              Register New Tenant Store
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSwitcher;
