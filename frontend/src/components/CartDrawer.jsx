import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../context/TenantContext';
import { formatCurrency } from '../utils/currency';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  CheckCircle,
  Truck,
  ShieldCheck
} from 'lucide-react';

const CartDrawer = () => {
  const { currentTenant } = useTenant();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    discountAmount,
    shippingFee,
    total,
    appliedCoupon,
    couponError,
    couponLoading,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      const ok = await applyCoupon(couponInput);
      if (ok) setCouponInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Free shipping threshold check (₹999)
  const freeShippingThreshold = 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div
      className="modal-overlay"
      onClick={() => setIsCartOpen(false)}
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        padding: 0,
        zIndex: 1300
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100vh',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 35px rgba(0,0,0,0.6)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Shopping Cart</h3>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Store: <strong style={{ color: 'var(--tenant-primary)' }}>{currentTenant?.name}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            {remainingForFreeShipping === 0 ? (
              <span style={{ color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Truck size={14} /> You unlocked Free Express Delivery!
              </span>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>
                Add <strong style={{ color: '#fff' }}>{formatCurrency(remainingForFreeShipping)}</strong> for Free Delivery
              </span>
            )}
            <span style={{ color: 'var(--text-muted)' }}>₹999 Goal</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${freeShippingProgress}%`,
                height: '100%',
                background: remainingForFreeShipping === 0 ? '#10b981' : 'var(--tenant-primary)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: 'var(--text-muted)'
                }}
              >
                <ShoppingBag size={28} />
              </div>
              <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Your cart is empty</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Discover exclusive collections in <strong>{currentTenant?.name}</strong> and add products to your cart.
              </p>
              <button onClick={() => setIsCartOpen(false)} className="btn btn-primary btn-sm">
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';
                  }}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    background: '#1e293b'
                  }}
                />

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff', lineHeight: '1.25' }}>
                        {item.name}
                      </h4>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        SKU: {item.sku || 'N/A'}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem'
                      }}
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    {/* Quantity controls */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '0.15rem 0.35rem',
                        borderRadius: '6px'
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', minWidth: '16px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
                      {formatCurrency(item.price * item.quantity, currentTenant?.currency || 'INR')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Action */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#090d16'
            }}
          >
            {/* Promo Code Input */}
            <div style={{ marginBottom: '1rem' }}>
              {appliedCoupon ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#86efac',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={14} />
                    <span>
                      Promo <strong>{appliedCoupon.code}</strong> applied (-{formatCurrency(discountAmount)})
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="Promo code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="input-field"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.45rem 0.85rem' }}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && (
                <div style={{ fontSize: '0.725rem', color: '#f87171', marginTop: '0.35rem' }}>
                  {couponError}
                </div>
              )}

              {/* Sample Promo Chips */}
              {!appliedCoupon && (
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {['WELCOME10', 'FESTIVE20', 'FLAT500'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => applyCoupon(code)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px dashed rgba(255,255,255,0.15)',
                        color: 'var(--text-muted)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.675rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Tag size={10} style={{ display: 'inline', marginRight: '3px' }} />
                      {code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.825rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currentTenant?.currency || 'INR')}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-{formatCurrency(discountAmount, currentTenant?.currency || 'INR')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Shipping</span>
                <span>{shippingFee === 0 ? <strong style={{ color: '#10b981' }}>FREE</strong> : formatCurrency(shippingFee)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '1.05rem',
                  marginTop: '0.4rem',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <span>Total Amount</span>
                <span style={{ color: 'var(--tenant-primary)' }}>
                  {formatCurrency(total, currentTenant?.currency || 'INR')}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleProceedToCheckout}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
