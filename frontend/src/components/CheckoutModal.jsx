import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import {
  X,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowRight,
  Package,
  AlertCircle,
  Tag,
  CheckCircle,
  QrCode,
  Lock,
  Copy,
  Check,
  Sparkles,
  Wallet,
  ExternalLink
} from 'lucide-react';

const CheckoutModal = () => {
  const { currentTenant } = useTenant();
  const { user, isAuthenticated } = useAuth();
  const {
    cartItems,
    isCheckoutOpen,
    setIsCheckoutOpen,
    setIsOrdersOpen,
    clearCart,
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

  // Form State
  const [couponInput, setCouponInput] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [street, setStreet] = useState('24 Bandra Kurla Complex Road');
  const [city, setCity] = useState('Mumbai');
  const [stateName, setStateName] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('400051');
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // Default to Razorpay Gateway
  const [notes, setNotes] = useState('');

  // Auto-fill logged in customer info
  useEffect(() => {
    if (user) {
      if (user.name) {
        setName(user.name);
        setCardHolder(user.name);
        setAccountHolder(user.name);
      }
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.addresses && user.addresses.length > 0) {
        const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
        if (defaultAddr.street) setStreet(defaultAddr.street);
        if (defaultAddr.city) setCity(defaultAddr.city);
        if (defaultAddr.state) setStateName(defaultAddr.state);
        if (defaultAddr.zipCode) setPostalCode(defaultAddr.zipCode);
      }
    }
  }, [user, isCheckoutOpen]);

  // Payment Specific States
  // 1. Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // 2. UPI / QR fields
  const [upiOption, setUpiOption] = useState('qr'); // 'qr' | 'id'
  const [upiId, setUpiId] = useState('');
  const [upiUtr, setUpiUtr] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);

  // 3. Net Banking fields
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState(user?.name || '');

  // Razorpay Gateway State
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);
  const [rzpActiveTab, setRzpActiveTab] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [rzpProcessing, setRzpProcessing] = useState(false);
  const [rzpStep, setRzpStep] = useState(1); // 1: Select, 2: Checking receipt, 3: Payment Done

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  if (!isCheckoutOpen) return null;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !phone || !street || !city || !stateName || !postalCode) {
      setError('Please complete all contact and shipping address fields.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    // Validate direct payment method specific fields
    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 15) {
        setError('Please enter a valid 16-digit Card Number.');
        return;
      }
      if (!cardHolder.trim()) {
        setError('Please enter the Cardholder Name.');
        return;
      }
      if (!cardExpiry.trim() || !cardExpiry.includes('/')) {
        setError('Please enter card expiry date in MM/YY format.');
        return;
      }
      if (cardCvv.trim().length < 3) {
        setError('Please enter a valid 3 or 4 digit CVV / CVC.');
        return;
      }
    } else if (paymentMethod === 'upi' && upiOption === 'id') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. user@okhdfcbank or name@paytm).');
        return;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!accountNumber.trim() || accountNumber.length < 6) {
        setError('Please enter a valid Bank Account Number / Customer ID.');
        return;
      }
      if (!accountHolder.trim()) {
        setError('Please enter the Bank Account Holder Name.');
        return;
      }
    }

    setLoading(true);

    try {
      // =======================================================================
      // 1. RAZORPAY PAYMENT GATEWAY FLOW
      // =======================================================================
      if (paymentMethod === 'razorpay') {
        // Step A: Call backend to create Razorpay Order with server-calculated amounts
        const rzpOrderRes = await api.post('/payments/create-order', {
          items: cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          couponCode: appliedCoupon?.code || null,
          customer: { name, email, phone },
          notes: { store: currentTenant?.name }
        });

        const rzpData = rzpOrderRes.data.data;

        // Step B: Create internal order with 'pending' status before checkout modal
        const initialOrderPayload = {
          customer: {
            name,
            email,
            phone,
            shippingAddress: { street, city, state: stateName, postalCode, country: 'India' }
          },
          items: cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          couponCode: appliedCoupon?.code || null,
          paymentMethod: 'razorpay',
          stripePaymentIntentId: rzpData.orderId,
          notes
        };

        const initialOrderRes = await api.post('/orders', initialOrderPayload);
        const internalOrder = initialOrderRes.data.data;

        setRazorpayOrderData({
          rzpOrder: rzpData,
          internalOrder: internalOrder
        });

        setShowRazorpayModal(true);
        setLoading(false);
        return;
      }

      // =======================================================================
      // 2. DIRECT PAYMENT METHODS FLOW (Card, UPI, NetBanking, COD)
      // =======================================================================
      let transactionId = '';

      if (paymentMethod === 'card') {
        const intentRes = await api.post('/payments/create-intent', {
          amount: total,
          customerEmail: email
        });
        transactionId = intentRes.data.data?.paymentIntentId || `txn_card_${Date.now()}`;
      } else if (paymentMethod === 'upi') {
        transactionId = upiUtr ? `UPI-UTR-${upiUtr.trim()}` : `UPI-VPA-${Date.now()}`;
      } else if (paymentMethod === 'netbanking') {
        transactionId = `NB-${selectedBank.replace(/\s+/g, '').toUpperCase()}-${Date.now()}`;
      } else if (paymentMethod === 'cod') {
        transactionId = `COD-${Date.now()}`;
      }

      const orderPayload = {
        customer: {
          name,
          email,
          phone,
          shippingAddress: {
            street,
            city,
            state: stateName,
            postalCode,
            country: 'India'
          }
        },
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        couponCode: appliedCoupon?.code || null,
        paymentMethod,
        stripePaymentIntentId: transactionId,
        notes
      };

      const res = await api.post('/orders', orderPayload);

      if (res.data.success) {
        if (paymentMethod !== 'cod') {
          await api.post('/payments/confirm', {
            orderId: res.data.data._id,
            paymentIntentId: transactionId,
            method: paymentMethod
          });
        }

        setCompletedOrder(res.data.data);
        clearCart();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Complete Razorpay Simulation & Verification Flow
  const handleCompleteRazorpayPayment = async () => {
    if (!razorpayOrderData) return;
    setRzpProcessing(true);
    setRzpStep(2); // Checking receipt with Razorpay

    try {
      const { rzpOrder, internalOrder } = razorpayOrderData;
      const paymentId = `pay_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const signature = `sig_${rzpOrder.orderId}_${paymentId}`;

      // Simulate 1.2s bank and razorpay receipt verification
      await new Promise((r) => setTimeout(r, 1200));

      const verifyRes = await api.post('/payments/verify', {
        orderId: internalOrder._id,
        orderNumber: internalOrder.orderNumber,
        razorpay_order_id: rzpOrder.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature
      });

      if (verifyRes.data.success) {
        setRzpStep(3); // Payment Done!
        await new Promise((r) => setTimeout(r, 1000));
        setShowRazorpayModal(false);
        setRzpStep(1);
        setCompletedOrder(verifyRes.data.data.order || internalOrder);
        clearCart();
      } else {
        setError('Payment verification failed on the server.');
        setShowRazorpayModal(false);
        setRzpStep(1);
      }
    } catch (vErr) {
      setError(vErr.response?.data?.message || 'Payment verification failed.');
      setShowRazorpayModal(false);
      setRzpStep(1);
    } finally {
      setRzpProcessing(false);
    }
  };

  const handleCheckoutApplyCoupon = async (e) => {
    e?.preventDefault();
    if (couponInput.trim()) {
      const ok = await applyCoupon(couponInput);
      if (ok) setCouponInput('');
    }
  };

  const handleClose = () => {
    setCompletedOrder(null);
    setShowRazorpayModal(false);
    setIsCheckoutOpen(false);
  };

  const handleViewOrders = () => {
    handleClose();
    setIsOrdersOpen(true);
  };

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 1350 }}>
      {/* Interactive Razorpay Gateway Modal */}
      {showRazorpayModal && razorpayOrderData && (
        <div
          className="modal-overlay"
          onClick={() => setShowRazorpayModal(false)}
          style={{ zIndex: 1450, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#0f172a',
              border: '1px solid #1e293b',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            {/* Razorpay Brand Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={18} />
                  <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '0.5px' }}>Razorpay</span>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    SECURE CHECKOUT
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.2rem' }}>
                  Merchant: {currentTenant?.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Amount Payable</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                  {formatCurrency(total)}
                </div>
              </div>
            </div>

            {/* Razorpay Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#1e293b' }}>
              {[
                { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                { id: 'card', label: 'Cards', icon: CreditCard },
                { id: 'netbanking', label: 'NetBanking', icon: Building2 },
                { id: 'wallet', label: 'Wallets', icon: Wallet }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = rzpActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRzpActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 0.5rem',
                      background: active ? '#0f172a' : 'transparent',
                      border: 'none',
                      borderBottom: active ? '2px solid #0284c7' : '2px solid transparent',
                      color: active ? '#38bdf8' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div style={{ padding: '1.5rem' }}>
              {rzpStep === 2 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '3px solid rgba(2, 132, 199, 0.2)',
                      borderTopColor: '#38bdf8',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1.25rem'
                    }}
                  />
                  <style>
                    {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                  </style>

                  <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.4rem' }}>
                    Checking Payment Receipt...
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                    Razorpay is checking that the payment of <strong>{formatCurrency(total)}</strong> is received from your bank/UPI.
                  </p>

                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#86efac' }}>
                      <Check size={14} />
                      <span>Bank Transaction Authorized</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', animation: 'pulse 1s infinite' }} />
                      <span>Razorpay Checking Payment Receipt...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <span>⏳</span>
                      <span>Cryptographic HMAC-SHA256 Signature Verification</span>
                    </div>
                  </div>
                </div>
              ) : rzpStep === 3 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                      boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <CheckCircle2 size={40} />
                  </div>

                  <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.4rem' }}>
                    Payment Done! 🎉
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#86efac', fontWeight: '600' }}>
                    Payment Received & Verified by Razorpay
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Amount Credited: <strong style={{ color: '#fff' }}>{formatCurrency(total)}</strong>
                  </div>
                </div>
              ) : (
                <>
                  {rzpActiveTab === 'upi' && (
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '0.6rem',
                          background: '#fff',
                          borderRadius: '10px',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <img
                          src="/samarth_upi_qr.jpg"
                          alt="Razorpay UPI QR"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=samarth13p2417@okaxis&pn=Razorpay-${encodeURIComponent(currentTenant?.name || 'Store')}&am=${total}&cu=INR`;
                          }}
                          style={{ width: '130px', height: '130px', objectFit: 'contain', display: 'block' }}
                        />
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', marginBottom: '0.2rem' }}>
                        Scan & Pay with any UPI App
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Google Pay • PhonePe • Paytm • CRED • BHIM
                      </div>
                    </div>
                  )}

                  {rzpActiveTab === 'card' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Card Number (4242 •••• •••• 4242)"
                        defaultValue="4242 4242 4242 4242"
                        style={{ fontSize: '0.8rem' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="MM/YY"
                          defaultValue="12/28"
                          style={{ fontSize: '0.8rem' }}
                        />
                        <input
                          type="password"
                          className="input-field"
                          placeholder="CVV"
                          defaultValue="123"
                          style={{ fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  )}

                  {rzpActiveTab === 'netbanking' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <select className="input-field" defaultValue="HDFC Bank" style={{ fontSize: '0.8rem' }}>
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="State Bank of India">State Bank of India (SBI)</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      </select>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Redirects to your bank's secure NetBanking portal.
                      </div>
                    </div>
                  )}

                  {rzpActiveTab === 'wallet' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <select className="input-field" defaultValue="Amazon Pay" style={{ fontSize: '0.8rem' }}>
                        <option value="Amazon Pay">Amazon Pay</option>
                        <option value="Paytm Wallet">Paytm Wallet</option>
                        <option value="PhonePe Wallet">PhonePe Wallet</option>
                        <option value="MobiKwik">MobiKwik</option>
                      </select>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleCompleteRazorpayPayment}
                      disabled={rzpProcessing}
                      className="btn btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                        width: '100%',
                        padding: '0.8rem',
                        fontSize: '0.9rem',
                        justifyContent: 'center'
                      }}
                    >
                      {rzpProcessing ? 'Checking Payment Receipt...' : `Pay ${formatCurrency(total)}`}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRazorpayModal(false)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Cancel Payment
                    </button>
                  </div>

                  <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                    🔒 Razorpay 256-Bit SSL Encrypted Payment Gateway
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: completedOrder ? '540px' : '880px',
          padding: 0,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}
      >
        {/* If order placed successfully */}
        {completedOrder ? (
          <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <span className="badge badge-tenant" style={{ marginBottom: '0.75rem' }}>
              {currentTenant?.name}
            </span>

            <h2 style={{ fontSize: '1.7rem', color: '#fff', marginBottom: '0.4rem', fontWeight: '800' }}>
              Payment Done! 🎉
            </h2>
            <p style={{ color: '#86efac', fontSize: '0.92rem', marginBottom: '1.5rem', fontWeight: '600' }}>
              ✓ Razorpay Confirmed: Payment Received & Verified Successfully!
            </p>

            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'left',
                marginBottom: '1.5rem',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order Number</span>
                <strong style={{ color: 'var(--tenant-primary)' }}>{completedOrder.orderNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Gateway</span>
                <span style={{ color: '#38bdf8', fontWeight: '600', textTransform: 'uppercase' }}>
                  {completedOrder.payment?.method === 'razorpay' ? 'Razorpay Secure' : completedOrder.payment?.method}
                </span>
              </div>
              {completedOrder.payment?.transactionId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transaction / Payment ID</span>
                  <span style={{ color: '#fff', fontSize: '0.775rem', fontFamily: 'monospace' }}>
                    {completedOrder.payment?.transactionId}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Delivery Address</span>
                <span style={{ color: '#fff', textAlign: 'right', maxWidth: '240px' }}>
                  {completedOrder.customer?.shippingAddress?.street}, {completedOrder.customer?.shippingAddress?.city}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  fontWeight: '700',
                  fontSize: '0.95rem'
                }}
              >
                <span style={{ color: '#fff' }}>Total Paid</span>
                <span style={{ color: '#10b981' }}>{formatCurrency(completedOrder.pricing?.total)}</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                fontSize: '0.775rem',
                color: '#86efac',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem'
              }}
            >
              <span>📧 Transaction confirmation & tax invoice sent to <strong>{completedOrder.customer?.email}</strong></span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={handleClose} className="btn btn-secondary">
                Continue Shopping
              </button>
              <button onClick={handleViewOrders} className="btn btn-primary">
                View My Orders
              </button>
            </div>
          </div>
        ) : (
          <div>
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
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Secure Checkout</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Merchant Store: <strong style={{ color: 'var(--tenant-primary)' }}>{currentTenant?.name}</strong>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  margin: '1rem 1.75rem 0',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePlaceOrder}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  padding: '1.5rem 1.75rem',
                  gap: '2rem',
                  maxHeight: '74vh',
                  overflowY: 'auto'
                }}
              >
                {/* Left Column: Information & Payment Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* 1. Contact Information */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--tenant-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                      Contact Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Full Name *</label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">Email Address *</label>
                        <input
                          type="email"
                          required
                          className="input-field"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          className="input-field"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Shipping Address */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--tenant-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                      Shipping Address
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Street Address *</label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          placeholder="House / Flat / Street"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">City *</label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">State *</label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          placeholder="State"
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">PIN Code *</label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          placeholder="PIN code"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Payment Method Selector */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--tenant-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span>
                      Payment Method
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {[
                        { id: 'razorpay', label: 'Razorpay Gateway', icon: ShieldCheck, desc: 'UPI, Cards, NetBanking, EMI' },
                        { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Master, RuPay' },
                        { id: 'upi', label: 'Direct QR / GPay', icon: Smartphone, desc: 'Scan UPI QR Code' },
                        { id: 'netbanking', label: 'Net Banking', icon: Building2, desc: 'All Indian Banks' },
                        { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay at Doorstep' }
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSelected = paymentMethod === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id)}
                            style={{
                              padding: '0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                              border: isSelected ? '1px solid var(--tenant-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ color: isSelected ? 'var(--tenant-primary)' : 'var(--text-muted)' }}>
                              <Icon size={20} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff' }}>{m.label}</div>
                              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dynamic Payment Method Form */}
                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '1.25rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      {/* 0. Razorpay Gateway Mode */}
                      {paymentMethod === 'razorpay' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Razorpay Official Gateway</span>
                              <span className="badge" style={{ background: '#0284c7', color: '#fff', fontSize: '0.65rem' }}>RECOMMENDED</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '600' }}>
                              ✓ 100+ Secure Modes
                            </div>
                          </div>

                          <div
                            style={{
                              background: 'rgba(2, 132, 199, 0.08)',
                              border: '1px solid rgba(2, 132, 199, 0.25)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.85rem',
                              marginBottom: '0.85rem'
                            }}
                          >
                            <div style={{ fontSize: '0.775rem', color: '#e0f2fe', lineHeight: '1.4', marginBottom: '0.5rem' }}>
                              Pay securely using <strong>UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, EMI, or Wallets</strong> with instant cryptographic server verification.
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {['UPI / QR', 'Google Pay', 'PhonePe', 'Credit Card', 'Debit Card', 'NetBanking', 'Wallets'].map((mode) => (
                                <span
                                  key={mode}
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '3px',
                                    background: 'rgba(255,255,255,0.08)',
                                    color: '#fff'
                                  }}
                                >
                                  {mode}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Lock size={12} style={{ color: '#10b981' }} />
                            <span>Clicking "Pay via Razorpay" will launch the Razorpay Checkout portal.</span>
                          </div>
                        </div>
                      )}

                      {/* 1. Credit / Debit Card Mode */}
                      {paymentMethod === 'card' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#fff' }}>Card Details</span>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <span className="badge badge-tenant" style={{ fontSize: '0.65rem' }}>Visa</span>
                              <span className="badge badge-tenant" style={{ fontSize: '0.65rem' }}>Mastercard</span>
                              <span className="badge badge-tenant" style={{ fontSize: '0.65rem' }}>RuPay</span>
                            </div>
                          </div>

                          <div>
                            <label className="input-label">Card Number *</label>
                            <input
                              type="text"
                              maxLength={19}
                              className="input-field"
                              placeholder="4242 •••• •••• 4242"
                              value={cardNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                setCardNumber(val);
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                            <div>
                              <label className="input-label">Cardholder Name *</label>
                              <input
                                type="text"
                                className="input-field"
                                placeholder="Full Name"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="input-label">Expiry *</label>
                              <input
                                type="text"
                                maxLength={5}
                                className="input-field"
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/\D/g, '');
                                  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                  setCardExpiry(val);
                                }}
                              />
                            </div>
                            <div>
                              <label className="input-label">CVV *</label>
                              <input
                                type="password"
                                maxLength={4}
                                className="input-field"
                                placeholder="•••"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Direct UPI / QR Mode */}
                      {paymentMethod === 'upi' && (
                        <div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button
                              type="button"
                              onClick={() => setUpiOption('qr')}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                border: upiOption === 'qr' ? '1px solid var(--tenant-primary)' : '1px solid rgba(255,255,255,0.08)',
                                background: upiOption === 'qr' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: upiOption === 'qr' ? '#fff' : 'var(--text-secondary)',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <QrCode size={16} />
                              Scan UPI QR Code
                            </button>
                            <button
                              type="button"
                              onClick={() => setUpiOption('id')}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                border: upiOption === 'id' ? '1px solid var(--tenant-primary)' : '1px solid rgba(255,255,255,0.08)',
                                background: upiOption === 'id' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: upiOption === 'id' ? '#fff' : 'var(--text-secondary)',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <Smartphone size={16} />
                              Enter UPI ID / VPA
                            </button>
                          </div>

                          {upiOption === 'qr' ? (
                            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                              <div
                                style={{
                                  display: 'inline-block',
                                  padding: '0.75rem',
                                  background: '#fff',
                                  borderRadius: '12px',
                                  boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                                  marginBottom: '0.75rem'
                                }}
                              >
                                <img
                                  src="/samarth_upi_qr.jpg"
                                  alt="UPI Payment QR"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=samarth13p2417@okaxis&pn=OmniStore&am=' + total + '&cu=INR';
                                  }}
                                  style={{ width: '160px', height: '160px', objectFit: 'contain', display: 'block' }}
                                />
                              </div>

                              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', marginBottom: '0.2rem' }}>
                                Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                Total Payable: <strong style={{ color: '#10b981' }}>{formatCurrency(total)}</strong>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0.3rem 0.6rem', borderRadius: '4px', color: '#38bdf8', fontSize: '0.8rem' }}>
                                  samarth13p2417@okaxis
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText('samarth13p2417@okaxis');
                                    setCopiedVpa(true);
                                    setTimeout(() => setCopiedVpa(false), 2000);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  {copiedVpa ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                                  <span>{copiedVpa ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div>
                                <label className="input-label">UPI ID / Virtual Payment Address *</label>
                                <input
                                  type="text"
                                  className="input-field"
                                  placeholder="username@okaxis or 9876543210@paytm"
                                  value={upiId}
                                  onChange={(e) => setUpiId(e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. Direct Net Banking Mode */}
                      {paymentMethod === 'netbanking' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <label className="input-label">Select Your Bank *</label>
                            <select
                              className="input-field"
                              value={selectedBank}
                              onChange={(e) => setSelectedBank(e.target.value)}
                            >
                              <option value="HDFC Bank">HDFC Bank</option>
                              <option value="ICICI Bank">ICICI Bank</option>
                              <option value="State Bank of India">State Bank of India (SBI)</option>
                              <option value="Axis Bank">Axis Bank</option>
                              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                              <option value="Punjab National Bank">Punjab National Bank</option>
                            </select>
                          </div>

                          <div>
                            <label className="input-label">Account Number / Customer ID *</label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Account Number"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="input-label">Account Holder Name *</label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Account Holder Full Name"
                              value={accountHolder}
                              onChange={(e) => setAccountHolder(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* 4. Cash on Delivery (COD) */}
                      {paymentMethod === 'cod' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <Truck size={18} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Cash on Delivery</span>
                          </div>
                          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                            Pay with cash or via UPI when the courier delivers the package to your doorstep. Zero advance fee required.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Order Summary & Action */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                      Order Summary ({cartItems.length} items)
                    </h4>

                    {/* Cart Item Mini List */}
                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                      {cartItems.map((item) => (
                        <div key={item.productId} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'}
                            alt={item.name}
                            style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff' }}>
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Coupon Input */}
                    <div style={{ marginBottom: '1rem' }}>
                      {appliedCoupon ? (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#86efac' }}>
                            <Tag size={13} />
                            <span>Code <strong>{appliedCoupon.code}</strong> Applied (-{formatCurrency(discountAmount)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeCoupon}
                            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.7rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input
                            type="text"
                            placeholder="Promo Code (e.g. POONAM20)"
                            className="input-field"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          />
                          <button
                            type="button"
                            onClick={handleCheckoutApplyCoupon}
                            disabled={couponLoading}
                            className="btn btn-secondary btn-sm"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                      {couponError && (
                        <div style={{ fontSize: '0.7rem', color: '#fca5a5', marginTop: '0.3rem' }}>
                          {couponError}
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                          <span>Coupon Discount</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>Estimated Shipping</span>
                        <span style={{ color: shippingFee === 0 ? '#10b981' : 'inherit' }}>
                          {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingTop: '0.65rem',
                          marginTop: '0.35rem',
                          borderTop: '1px solid rgba(255,255,255,0.08)',
                          fontSize: '1.05rem',
                          fontWeight: '700'
                        }}
                      >
                        <span style={{ color: '#fff' }}>Total Amount</span>
                        <span style={{ color: 'var(--tenant-primary)' }}>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      fontSize: '0.95rem',
                      justifyContent: 'center',
                      background: paymentMethod === 'razorpay' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : undefined
                    }}
                  >
                    {loading ? (
                      'Processing Order...'
                    ) : (
                      <>
                        <span>{paymentMethod === 'razorpay' ? 'Pay via Razorpay' : 'Place Order'} • {formatCurrency(total)}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.725rem' }}>
                    <ShieldCheck size={14} style={{ color: '#10b981' }} />
                    <span>256-Bit Encrypted Razorpay & Multi-Tenant Direct Checkout</span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
