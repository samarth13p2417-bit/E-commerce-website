import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import {
  Package,
  Search,
  CheckCircle,
  Truck,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  MapPin,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  User,
  X,
  Download
} from 'lucide-react';
import { downloadTransactionReceipt } from '../utils/receiptGenerator';

const AdminOrdersTab = () => {
  const { currentTenant } = useTenant();
  const { isTenantAdmin } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadOrders = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      let url = `/orders?tenant=${currentTenant._id}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load merchant orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentTenant, statusFilter, searchTerm]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
        note: `Merchant updated status to ${newStatus}`
      });

      if (res.data.success) {
        setFeedbackMsg(`Order updated to "${newStatus}"`);
        setTimeout(() => setFeedbackMsg(''), 3000);
        loadOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.data.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#86efac', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Delivered</span>;
      case 'shipped':
        return <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#7dd3fc', border: '1px solid rgba(14, 165, 233, 0.3)' }}>Shipped</span>;
      case 'processing':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fde68a', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Processing</span>;
      case 'cancelled':
        return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const totalRevenue = orders.reduce((acc, o) => acc + (o.pricing?.total || 0), 0);

  return (
    <div>
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#86efac',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <CheckCircle size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Orders Table Container */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Package size={20} style={{ color: 'var(--tenant-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>
              Order Fulfillment ({orders.length})
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Search */}
            <div style={{ position: 'relative', width: '240px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search Order #, Customer, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.2rem', paddingVertical: '0.45rem', fontSize: '0.8rem' }}
              />
            </div>

            <button onClick={loadOrders} className="btn btn-secondary btn-sm" title="Refresh Orders">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading store orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)' }} />
            <h4 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '0.35rem' }}>No orders found</h4>
            <p style={{ fontSize: '0.85rem' }}>
              Orders placed by customers in <strong>{currentTenant?.name}</strong> will appear here for fulfillment.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>ORDER #</th>
                  <th style={{ padding: '0.85rem 1rem' }}>CUSTOMER</th>
                  <th style={{ padding: '0.85rem 1rem' }}>DATE</th>
                  <th style={{ padding: '0.85rem 1rem' }}>ITEMS</th>
                  <th style={{ padding: '0.85rem 1rem' }}>TOTAL (₹)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o._id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Order ID */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--tenant-primary)' }}>
                        {o.orderNumber}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Pay: <span style={{ textTransform: 'uppercase', color: '#fff' }}>{o.payment?.method}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{o.customer?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customer?.email}</div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Items */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#cbd5e1' }}>
                        {o.items?.length || 1} items ({o.items?.reduce((acc, i) => acc + (i.quantity || 1), 0)} pcs)
                      </span>
                    </td>

                    {/* Total */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <span style={{ fontWeight: '800', color: '#10b981' }}>
                        {formatCurrency(o.pricing?.total, currentTenant?.currency || 'INR')}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem 1rem' }}>
                      {getStatusBadge(o.status)}
                    </td>

                    {/* Action Dropdown & Details Button */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <select
                          value={o.status}
                          disabled={updatingOrderId === o._id}
                          onChange={(e) => handleUpdateStatus(o._id, e.target.value)}
                          className="input-field"
                          style={{
                            width: 'auto',
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.75rem',
                            background: '#131c31'
                          }}
                        >
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="btn btn-secondary btn-sm"
                          title="View Order Details"
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal for Merchant */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)} style={{ zIndex: 1400 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', padding: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '1.25rem 1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                  Order Details: {selectedOrder.orderNumber}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => downloadTransactionReceipt(selectedOrder, currentTenant)}
                  className="btn btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: '#fff',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} /> Receipt (PDF)
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: '1.5rem 1.75rem', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Customer & Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={13} /> Customer Info
                  </div>
                  <div style={{ fontWeight: '600', color: '#fff' }}>{selectedOrder.customer?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedOrder.customer?.email}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedOrder.customer?.phone}</div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={13} /> Shipping Destination
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {selectedOrder.customer?.shippingAddress?.street}<br />
                    {selectedOrder.customer?.shippingAddress?.city}, {selectedOrder.customer?.shippingAddress?.state}<br />
                    PIN: {selectedOrder.customer?.shippingAddress?.postalCode} • {selectedOrder.customer?.shippingAddress?.country || 'India'}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Order Line Items ({selectedOrder.items?.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                        alt={item.name}
                        style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.85rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          SKU: {item.sku || 'N/A'} • Qty: {item.quantity} × {formatCurrency(item.price)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                      {formatCurrency(item.itemTotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.pricing?.subtotal)}</span>
                </div>
                {selectedOrder.pricing?.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#10b981', marginBottom: '0.35rem' }}>
                    <span>Coupon ({selectedOrder.pricing?.couponCode})</span>
                    <span>-{formatCurrency(selectedOrder.pricing?.discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <span>Shipping</span>
                  <span>{selectedOrder.pricing?.shippingFee === 0 ? 'FREE' : formatCurrency(selectedOrder.pricing?.shippingFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.05rem', color: '#fff', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Grand Total</span>
                  <span style={{ color: '#10b981' }}>{formatCurrency(selectedOrder.pricing?.total)}</span>
                </div>
              </div>

              {/* Quick Status Control */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>Update Fulfillment Status</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Notify customer and track dispatch</div>
                </div>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                  className="input-field"
                  style={{ width: 'auto', padding: '0.45rem 1rem' }}
                >
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersTab;
