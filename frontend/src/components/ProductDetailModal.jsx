import React, { useState, useEffect } from 'react';
import { X, Star, ShoppingCart, ShieldCheck, Check, Truck, Plus, Minus } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { formatCurrency } from '../utils/currency';

const ProductDetailModal = ({ product, onClose, onAddToCart }) => {
  const { currentTenant } = useTenant();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
  }, [product]);

  if (!product) return null;

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              zIndex: 10,
              background: 'rgba(0, 0, 0, 0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* Image section */}
            <div style={{ height: '380px', background: '#0b0f19', position: 'relative' }}>
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Details section */}
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' }}>
                    {product.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {product.sku}</span>
                </div>

                <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem', lineHeight: '1.25' }}>
                  {product.name}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', color: '#f59e0b' }}>
                    <Star size={14} fill="#f59e0b" />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{product.rating || 4.9}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({product.reviewsCount || 24} reviews)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff' }}>
                    {formatCurrency(product.price, currentTenant?.currency || 'INR')}
                  </span>
                  {hasDiscount && (
                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      {formatCurrency(product.comparePrice, currentTenant?.currency || 'INR')}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                  {product.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={14} style={{ color: '#10b981' }} />
                    <span>In Stock: <strong style={{ color: '#fff' }}>{product.stock} available</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={14} style={{ color: 'var(--tenant-primary)' }} />
                    <span>Express Insured Fast Delivery</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={14} style={{ color: '#10b981' }} />
                    <span>100% Authenticity Guaranteed</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select Quantity:</span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '0.3rem 0.6rem',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <button
                      onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                      disabled={qty <= 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: qty <= 1 ? 'var(--text-muted)' : '#fff',
                        cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff', minWidth: '24px', textAlign: 'center' }}>
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((prev) => Math.min(product.stock || 99, prev + 1))}
                      disabled={qty >= (product.stock || 99)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: qty >= (product.stock || 99) ? 'var(--text-muted)' : '#fff',
                        cursor: qty >= (product.stock || 99) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(product, qty);
                    onClose();
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.8rem' }}
                >
                  <ShoppingCart size={16} />
                  Add {qty} to Cart • {formatCurrency(product.price * qty, currentTenant?.currency || 'INR')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
