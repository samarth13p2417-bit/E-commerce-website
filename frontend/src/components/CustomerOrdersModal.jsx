import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import {
  X,
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronRight,
  MapPin,
  Calendar
} from 'lucide-react';

const CustomerOrdersModal = () => {
  const { currentTenant } = useTenant();
  const { user, isAuthenticated } = useAuth();
  const { isOrdersOpen, setIsOrdersOpen } = useCart();

  const [emailInput, setEmailInput] = useState(user?.email || 'rohan.mehra@example.com');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async (emailToSearch) => {
    const searchEmail = emailToSearch || emailInput;
    if (!searchEmail || !currentTenant) return;

    setLoading(true);
    try {
      const res = await api.get(`/orders/my-orders?email=${encodeURIComponent(searchEmail.trim())}`);
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOrdersOpen && currentTenant) {
      const defaultEmail = user?.email || emailInput;
      setEmailInput(defaultEmail);
      fetchOrders(defaultEmail);
    }
  }, [isOrdersOpen, currentTenant, user]);

  if (!isOrdersOpen) return null;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(emailInput);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="badge badge-active" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>● Delivered</span>;
      case 'shipped':
        return <span className="badge badge-tenant" style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#7dd3fc' }}>● In Transit (Shipped)</span>;
      case 'processing':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fde68a' }}>● Processing Order</span>;
      case 'cancelled':
        return <span className="badge badge-draft" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>● Cancelled</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}>● {status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsOrdersOpen(false)} style={{ zIndex: 1350 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: selectedOrder ? '720px' : '650px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
              <Package size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>My Orders & Tracking</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Store: <strong style={{ color: 'var(--tenant-primary)' }}>{currentTenant?.name}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedOrder) setSelectedOrder(null);
              else setIsOrdersOpen(false);
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Order Detail View */}
        {selectedOrder ? (
          <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto' }}>
            <button
              onClick={() => setSelectedOrder(null)}
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: '1.25rem', padding: '0.35rem 0.75rem' }}
            >
              ← Back to All Orders
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                  {selectedOrder.orderNumber}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {/* Status Timeline */}
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                Fulfillment Timeline
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {selectedOrder.statusHistory?.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--tenant-primary)', marginTop: '0.35rem' }} />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600', textTransform: 'capitalize' }}>
                        {step.status}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{step.note}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(step.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Breakdown */}
            <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
              Ordered Items ({selectedOrder.items?.length})
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {selectedOrder.items?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                      alt={item.name}
                      style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>{item.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>
                    {formatCurrency(item.itemTotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping & Payment Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
              <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={13} /> Shipping Destination
                </div>
                <div style={{ color: '#fff', fontWeight: '600' }}>{selectedOrder.customer?.name}</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {selectedOrder.customer?.shippingAddress?.street}, {selectedOrder.customer?.shippingAddress?.city}, {selectedOrder.customer?.shippingAddress?.state} - {selectedOrder.customer?.shippingAddress?.postalCode}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Payment & Total</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span>Method:</span> <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{selectedOrder.payment?.method}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#10b981' }}>
                  <span>Total Paid:</span> <span>{formatCurrency(selectedOrder.pricing?.total)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Search / Email filter */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                required
                placeholder="Enter email to view orders (e.g. rahul@example.com)"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.85rem' }}
              />
              <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
                <Search size={14} /> Search
              </button>
            </form>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading your orders...
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Package size={36} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)' }} />
                <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.35rem' }}>No orders found for this email</h4>
                <p style={{ fontSize: '0.8rem' }}>
                  Place an order in <strong>{currentTenant?.name}</strong> or enter the email you used during checkout.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders.map((o) => (
                  <div
                    key={o._id}
                    onClick={() => setSelectedOrder(o)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--tenant-primary)'
                        }}
                      >
                        <Package size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                          {o.orderNumber}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {o.items?.length} item(s)
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                          {formatCurrency(o.pricing?.total)}
                        </div>
                        <div>{getStatusBadge(o.status)}</div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrdersModal;
