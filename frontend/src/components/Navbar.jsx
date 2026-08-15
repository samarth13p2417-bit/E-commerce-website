import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useCart } from '../context/CartContext';
import TenantSwitcher from './TenantSwitcher';
import {
  ShoppingBag,
  LayoutDashboard,
  Settings,
  LogIn,
  LogOut,
  User,
  Sparkles,
  Shield,
  Package,
  ShoppingCart,
  Store,
  Check
} from 'lucide-react';

const Navbar = ({
  activeView,
  setActiveView,
  onOpenAuthModal,
  onOpenSettingsModal,
  onOpenNewTenantModal
}) => {
  const { user, isAuthenticated, logout, isTenantAdmin, isCustomer } = useAuth();
  const { currentTenant } = useTenant();
  const { totalItemCount, setIsCartOpen, setIsOrdersOpen } = useCart();

  const handleDashboardClick = () => {
    if (isAuthenticated && !isTenantAdmin) {
      // Customer is logged in, but tries to access Vendor Dashboard
      onOpenAuthModal('vendor', 'login');
      return;
    }
    setActiveView('admin');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        background: 'rgba(9, 13, 22, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Top Tenant Announcement Ribbon */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '0.35rem 1.5rem',
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={13} style={{ color: 'var(--tenant-primary)' }} />
          <span>
            {currentTenant?.branding?.bannerText ||
              'Multi-Tenant E-Commerce Platform Active • Secure Vendor & Customer Auth'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.7rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Active Tenant: <strong style={{ color: '#fff' }}>{currentTenant?.slug}.platform.io</strong>
          </span>
          <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
            Multi-Tenant Isolated DB
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        {/* Brand & Tenant Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
            onClick={() => setActiveView('storefront')}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--tenant-primary), #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px var(--tenant-glow)'
              }}
            >
              <ShoppingBag size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.03em', color: '#fff' }}>
                Omni<span style={{ color: 'var(--tenant-primary)' }}>Store</span>
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Multi-Tenant SaaS
              </div>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Tenant Switcher Dropdown */}
          <TenantSwitcher onOpenNewTenantModal={() => onOpenAuthModal('vendor', 'register')} />
        </div>

        {/* View Switcher (Storefront vs Merchant Admin) */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <button
            onClick={() => setActiveView('storefront')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeView === 'storefront' ? 'var(--tenant-primary)' : 'transparent',
              color: activeView === 'storefront' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeView === 'storefront' ? '0 2px 10px var(--tenant-glow)' : 'none'
            }}
          >
            <ShoppingBag size={15} />
            Storefront
          </button>

          <button
            onClick={handleDashboardClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeView === 'admin' ? 'var(--tenant-primary)' : 'transparent',
              color: activeView === 'admin' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeView === 'admin' ? '0 2px 10px var(--tenant-glow)' : 'none'
            }}
          >
            <LayoutDashboard size={15} />
            Merchant Dashboard
          </button>
        </div>

        {/* Auth, Orders & Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* My Orders Button */}
          <button
            onClick={() => setIsOrdersOpen(true)}
            className="btn btn-secondary btn-sm"
            title="Track Your Store Orders"
            style={{ padding: '0.45rem 0.75rem', gap: '0.4rem' }}
          >
            <Package size={15} />
            <span style={{ fontSize: '0.8rem' }}>My Orders</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="btn btn-secondary btn-sm"
            title="View Shopping Cart"
            style={{
              position: 'relative',
              padding: '0.45rem 0.85rem',
              gap: '0.4rem',
              background: totalItemCount > 0 ? 'rgba(99, 102, 241, 0.15)' : undefined,
              borderColor: totalItemCount > 0 ? 'var(--tenant-primary)' : undefined
            }}
          >
            <ShoppingCart size={16} style={{ color: totalItemCount > 0 ? 'var(--tenant-primary)' : undefined }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Cart</span>
            {totalItemCount > 0 && (
              <span
                style={{
                  background: 'var(--tenant-primary)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '999px',
                  marginLeft: '0.1rem'
                }}
              >
                {totalItemCount}
              </span>
            )}
          </button>

          <div style={{ height: '20px', width: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 0.15rem' }} />

          {isAuthenticated ? (
            <>
              {isTenantAdmin && (
                <button
                  onClick={onOpenSettingsModal}
                  className="btn btn-secondary btn-sm"
                  title="Tenant Store Settings & Branding"
                >
                  <Settings size={15} />
                  Settings
                </button>
              )}

              {/* User Profile Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  background:
                    isTenantAdmin
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(99, 102, 241, 0.1)',
                  border:
                    isTenantAdmin
                      ? '1px solid rgba(245, 158, 11, 0.3)'
                      : '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isTenantAdmin ? '#f59e0b' : 'var(--tenant-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff', lineHeight: 1.1 }}>
                    {user?.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: isTenantAdmin ? '#fcd34d' : 'var(--tenant-primary)',
                      fontWeight: '700',
                      lineHeight: 1.1
                    }}
                  >
                    {isTenantAdmin ? '👑 Store Owner' : '🛍️ Shopper'}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Logout"
                style={{ padding: '0.45rem' }}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => onOpenAuthModal('customer', 'login')}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem' }}
              >
                <User size={14} />
                Sign In
              </button>
              <button
                onClick={() => onOpenAuthModal('vendor', 'register')}
                className="btn btn-primary btn-sm"
                style={{
                  gap: '0.4rem',
                  background: 'linear-gradient(135deg, #f59e0b, #ec4899)'
                }}
              >
                <Store size={14} />
                Vendor Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
