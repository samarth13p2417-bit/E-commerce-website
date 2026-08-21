import React, { useState, Component } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import Storefront from './components/Storefront';
import AdminDashboard from './components/AdminDashboard';
import ProductModal from './components/ProductModal';
import AuthModal from './components/AuthModal';
import TenantSettingsModal from './components/TenantSettingsModal';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import CustomerOrdersModal from './components/CustomerOrdersModal';
import { ShieldCheck, Database, Layers, Sparkles, Code2, Server, RotateCcw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('OmniStore UI Error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('activeTenantId');
    localStorage.removeItem('activeTenantSlug');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#090d16',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '520px',
              padding: '2.5rem',
              textAlign: 'center',
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: '#0d1322'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem', color: '#fff' }}>
              Something went wrong loading the storefront
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              An unexpected client state occurred. Click below to reset stored tenant cookies and reload cleanly.
            </p>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
            >
              <RotateCcw size={16} />
              <span>Reset & Reload OmniStore</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = () => {
  const [activeView, setActiveView] = useState('storefront'); // 'storefront' | 'admin'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState('customer');
  const [authModalTab, setAuthModalTab] = useState('login');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);

  const { currentTenant } = useTenant();
  const { addToCart } = useCart();

  const handleOpenAuth = (role = 'customer', tab = 'login') => {
    if (role === 'login' || role === 'register') {
      setAuthModalTab(role);
      setAuthModalRole('customer');
    } else {
      setAuthModalRole(role);
      setAuthModalTab(tab);
    }
    setIsAuthModalOpen(true);
  };

  const handleOpenProductModal = (product = null) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuthModal={handleOpenAuth}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenNewTenantModal={() => handleOpenAuth('vendor', 'register')}
      />

      {/* Main View Area */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeView === 'storefront' ? (
          <Storefront onQuickViewProduct={(p) => setSelectedProductDetail(p)} />
        ) : (
          <AdminDashboard
            onOpenProductModal={handleOpenProductModal}
            onOpenAuthModal={handleOpenAuth}
          />
        )}
      </main>

      {/* Multi-Tenant System Footer & Architecture Status Banner */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(9, 13, 22, 0.95)',
          padding: '2rem 1.5rem',
          marginTop: 'auto'
        }}
      >
        <div
          style={{
            maxWidth: '1300px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--tenant-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
                OmniStore Multi-Tenant Architecture • Live Platform
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                React 18 + Redux Toolkit + Node.js/Express Multi-Tenant Partitioning
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Server size={14} style={{ color: '#10b981' }} />
              <span>Backend API :5000</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} style={{ color: 'var(--tenant-primary)' }} />
              <span>Active: <strong>{currentTenant?.name || currentTenant?.slug || 'Storefront'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} style={{ color: '#10b981' }} />
              <span>Multi-Tenant DB Active</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CartDrawer />
      <CheckoutModal />
      <CustomerOrdersModal />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialRole={authModalRole}
        initialTab={authModalTab}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onProductSaved={() => {
          // Trigger refresh if needed
        }}
      />

      <TenantSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <ProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={(p) => {
          addToCart(p, 1);
        }}
      />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <CartProvider>
            <MainLayout />
          </CartProvider>
        </TenantProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
