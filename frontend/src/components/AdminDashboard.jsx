import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  IndianRupee,
  TrendingUp,
  Boxes,
  Lock,
  Search,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import AdminOrdersTab from './AdminOrdersTab';

const AdminDashboard = ({ onOpenProductModal, onOpenAuthModal }) => {
  const { currentTenant } = useTenant();
  const { isAuthenticated, isTenantAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Load tenant products
  const loadProducts = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const res = await api.get(`/products?tenant=${currentTenant._id}`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentTenant]);

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from this tenant store?`)) {
      return;
    }

    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) {
        setActionSuccess(`Deleted "${name}" successfully`);
        setTimeout(() => setActionSuccess(''), 3000);
        loadProducts();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete product');
      setTimeout(() => setActionError(''), 3000);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCatalogValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.5rem', minHeight: '80vh' }}>
      {/* Action Alerts */}
      {actionSuccess && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#86efac',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Merchant Admin Dashboard</h1>
            <span className="badge badge-tenant">{currentTenant?.name}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage catalog inventory, pricing, and settings for tenant store ID: <code style={{ color: '#fff' }}>{currentTenant?._id}</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAuthenticated && isTenantAdmin ? (
            <button
              onClick={() => onOpenProductModal(null)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              Add Product
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthModal('login')}
              className="btn btn-primary"
            >
              <Lock size={15} />
              Sign in as Store Owner to Manage
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Catalog Items
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--tenant-primary)' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
            {products.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={13} />
            <span>Tenant scoped inventory</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Stock Units
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Boxes size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
            {totalStockUnits}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Available across all categories
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Inventory Asset Value
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
            {formatCurrency(totalCatalogValue, currentTenant?.currency || 'INR')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Calculated in {currentTenant?.currency || 'INR'}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Tenant Subscription
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Lock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', textTransform: 'capitalize', lineHeight: 1 }}>
            {currentTenant?.plan || 'Standard'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Status: <span style={{ color: '#10b981', fontWeight: '600' }}>Active (100% Isolated)</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'products' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            color: activeTab === 'products' ? '#fff' : 'var(--text-muted)',
            fontWeight: activeTab === 'products' ? '700' : '500',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            borderBottom: activeTab === 'products' ? '2px solid var(--tenant-primary)' : '2px solid transparent'
          }}
        >
          <Package size={16} />
          <span>Product Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'orders' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            color: activeTab === 'orders' ? '#fff' : 'var(--text-muted)',
            fontWeight: activeTab === 'orders' ? '700' : '500',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            borderBottom: activeTab === 'orders' ? '2px solid var(--tenant-primary)' : '2px solid transparent'
          }}
        >
          <ClipboardList size={16} />
          <span>Orders & Fulfillment</span>
        </button>
      </div>

      {/* Conditional View: Products vs Orders */}
      {activeTab === 'orders' ? (
        <AdminOrdersTab />
      ) : (
        /* Catalog Table Section */
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Table Toolbar */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} style={{ color: 'var(--tenant-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Product Catalog ({products.length})</h3>
            </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter by name, SKU, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.2rem', paddingVertical: '0.45rem', fontSize: '0.8rem' }}
              />
            </div>

            {isAuthenticated && isTenantAdmin && (
              <button
                onClick={() => onOpenProductModal(null)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} />
                New Product
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading product data...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products found for this query in <strong>{currentTenant?.name}</strong>.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>PRODUCT</th>
                  <th style={{ padding: '0.85rem 1rem' }}>CATEGORY</th>
                  <th style={{ padding: '0.85rem 1rem' }}>PRICE</th>
                  <th style={{ padding: '0.85rem 1rem' }}>STOCK</th>
                  <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr
                    key={p._id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Product Cell */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                          alt={p.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                          }}
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: '#1e293b' }}
                        />
                        <div>
                          <div style={{ fontWeight: '600', color: '#fff' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category Cell */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#cbd5e1' }}>
                        {p.category}
                      </span>
                    </td>

                    {/* Price Cell */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <span style={{ fontWeight: '700', color: '#fff' }}>
                        {formatCurrency(p.price, currentTenant?.currency || 'INR')}
                      </span>
                      {p.comparePrice && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem', textDecoration: 'line-through' }}>
                          {formatCurrency(p.comparePrice, currentTenant?.currency || 'INR')}
                        </span>
                      )}
                    </td>

                    {/* Stock Cell */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <span style={{ color: p.stock > 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                        {p.stock} units
                      </span>
                    </td>

                    {/* Status Cell */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <span className="badge badge-active" style={{ textTransform: 'capitalize' }}>
                        {p.status}
                      </span>
                    </td>

                    {/* Actions Cell */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      {isAuthenticated && isTenantAdmin ? (
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => onOpenProductModal(p)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Product"
                            style={{ padding: '0.4rem 0.6rem' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                            className="btn btn-danger btn-sm"
                            title="Delete Product"
                            style={{ padding: '0.4rem 0.6rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sign in to edit</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default AdminDashboard;
