import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import {
  X,
  Sparkles,
  Store,
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
  Palette,
  Briefcase,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const AuthModal = ({ isOpen, onClose, initialRole = 'customer', initialTab = 'login' }) => {
  const { login, registerCustomer, registerVendor } = useAuth();
  const { currentTenant, fetchTenants, switchTenant } = useTenant();

  // Role toggle: 'customer' | 'vendor'
  const [roleMode, setRoleMode] = useState(initialRole);
  // Tab toggle: 'login' | 'register'
  const [tab, setTab] = useState(initialTab);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Vendor specific fields
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  // UI & Validation states
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRoleMode(initialRole);
    setTab(initialTab);
    setError('');
    setSuccessMsg('');
    setFieldErrors({});
  }, [initialRole, initialTab, isOpen]);

  if (!isOpen) return null;

  // Real-time password strength computation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: '#6b7280', checks: {} };
    const hasMinLen = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);

    const score = [hasMinLen, (hasUpper && hasLower), hasNum, hasSpecial].filter(Boolean).length;

    let label = 'Weak';
    let color = '#ef4444';
    if (score === 2) {
      label = 'Fair';
      color = '#f59e0b';
    } else if (score === 3) {
      label = 'Good';
      color = '#3b82f6';
    } else if (score === 4) {
      label = 'Strong & Secure';
      color = '#10b981';
    }

    return {
      score,
      label,
      color,
      checks: {
        minLen: hasMinLen,
        upperLower: hasUpper && hasLower,
        number: hasNum,
        special: hasSpecial
      }
    };
  };

  const pwdStrength = getPasswordStrength(password);

  // Client-side validation function
  const validateForm = () => {
    const errors = {};

    if (tab === 'login') {
      if (!email.trim()) errors.email = 'Email address is required';
      else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Enter a valid email format';
      if (!password) errors.password = 'Password is required';
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }

    // Registration validations
    if (roleMode === 'vendor') {
      if (!storeName.trim()) errors.storeName = 'Store name is required';
      else if (storeName.trim().length < 3) errors.storeName = 'Store name must be at least 3 characters';
      else if (storeName.trim().length > 50) errors.storeName = 'Store name cannot exceed 50 characters';
    }

    if (!name.trim()) errors.name = 'Full name is required';
    else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    else if (name.trim().length > 50) errors.name = 'Name cannot exceed 50 characters';

    if (!email.trim()) errors.email = 'Email address is required';
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Please provide a valid email (e.g. name@domain.com)';

    if (phone.trim() && !PHONE_REGEX.test(phone.replace(/[\s-]/g, ''))) {
      errors.phone = 'Phone number must be 10-15 digits';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (pwdStrength.score < 3) {
      errors.password = 'Please create a stronger password (include uppercase, lowercase, numbers & symbols)';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    setLoading(true);
    const result = await login(email, password, currentTenant?.slug, currentTenant?._id);
    setLoading(false);

    if (result.success) {
      setSuccessMsg(result.message || 'Login successful!');
      fetchTenants();
      setTimeout(() => {
        onClose();
      }, 600);
    } else {
      setError(result.message);
    }
  };

  const handleCustomerRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    setLoading(true);

    const result = await registerCustomer({
      name,
      email,
      password,
      phone,
      tenantId: currentTenant?._id,
      tenantSlug: currentTenant?.slug
    });

    setLoading(false);

    if (result.success) {
      setSuccessMsg(`Welcome to ${currentTenant?.name}! Your customer account is ready.`);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setError(result.message);
    }
  };

  const handleVendorRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    setLoading(true);

    const result = await registerVendor({
      storeName,
      ownerName: name,
      email,
      password,
      phone,
      primaryColor,
      tagline
    });

    setLoading(false);

    if (result.success) {
      setSuccessMsg(`Store '${result.tenant?.name}' created successfully! Loading your merchant workspace...`);
      await fetchTenants();
      if (result.tenant?.slug) {
        switchTenant(result.tenant.slug);
      }
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setError(result.message);
    }
  };

  const fillDemoCreds = (demoEmail, roleType = 'customer') => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setFieldErrors({});
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: '#0d131f',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background:
                  roleMode === 'customer'
                    ? 'linear-gradient(135deg, var(--tenant-primary), #06b6d4)'
                    : 'linear-gradient(135deg, #f59e0b, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)'
              }}
            >
              {roleMode === 'customer' ? (
                <ShoppingBag size={17} color="#fff" />
              ) : (
                <Store size={17} color="#fff" />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                {roleMode === 'customer'
                  ? tab === 'login'
                    ? 'Customer Sign In'
                    : 'Create Customer Account'
                  : tab === 'login'
                  ? 'Vendor / Merchant Sign In'
                  : 'Launch New Store'}
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {roleMode === 'customer'
                  ? `Shopping at ${currentTenant?.name || 'Store'}`
                  : 'Multi-Tenant Merchant & Admin Portal'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.35rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Role Toggle (Customer vs Vendor) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '0.85rem 1.5rem 0.5rem 1.5rem',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setRoleMode('customer');
              setError('');
              setSuccessMsg('');
              setFieldErrors({});
            }}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid',
              borderColor:
                roleMode === 'customer'
                  ? 'var(--tenant-primary)'
                  : 'rgba(255, 255, 255, 0.06)',
              background:
                roleMode === 'customer'
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'rgba(255, 255, 255, 0.02)',
              color: roleMode === 'customer' ? '#fff' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease'
            }}
          >
            <ShoppingBag size={15} style={{ color: roleMode === 'customer' ? 'var(--tenant-primary)' : 'inherit' }} />
            <span>Customer / Shopper</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleMode('vendor');
              setError('');
              setSuccessMsg('');
              setFieldErrors({});
            }}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid',
              borderColor:
                roleMode === 'vendor'
                  ? '#f59e0b'
                  : 'rgba(255, 255, 255, 0.06)',
              background:
                roleMode === 'vendor'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(255, 255, 255, 0.02)',
              color: roleMode === 'vendor' ? '#fff' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Briefcase size={15} style={{ color: roleMode === 'vendor' ? '#f59e0b' : 'inherit' }} />
            <span>Vendor / Store Owner</span>
          </button>
        </div>

        {/* Sub-Tab Selector (Sign In vs Register) */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0.25rem 1.5rem 0 1.5rem',
            gap: '1.25rem'
          }}
        >
          <button
            onClick={() => {
              setTab('login');
              setError('');
              setSuccessMsg('');
              setFieldErrors({});
            }}
            style={{
              padding: '0.6rem 0.25rem',
              border: 'none',
              background: 'transparent',
              color: tab === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              borderBottom:
                tab === 'login'
                  ? `2px solid ${roleMode === 'vendor' ? '#f59e0b' : 'var(--tenant-primary)'}`
                  : '2px solid transparent'
            }}
          >
            {roleMode === 'customer' ? 'Customer Sign In' : 'Vendor Sign In'}
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError('');
              setSuccessMsg('');
              setFieldErrors({});
            }}
            style={{
              padding: '0.6rem 0.25rem',
              border: 'none',
              background: 'transparent',
              color: tab === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              borderBottom:
                tab === 'register'
                  ? `2px solid ${roleMode === 'vendor' ? '#f59e0b' : 'var(--tenant-primary)'}`
                  : '2px solid transparent'
            }}
          >
            {roleMode === 'customer' ? 'Create Account' : 'Register New Store'}
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.5rem', maxHeight: '72vh', overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6ee7b7',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}
            >
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. LOGIN TAB (Handles both Customer and Vendor logins)    */}
          {/* ========================================================= */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Store Scope</label>
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>
                    Store: <strong style={{ color: '#fff' }}>{currentTenant?.name}</strong>
                  </span>
                  <span style={{ color: 'var(--tenant-primary)', fontWeight: '600', fontSize: '0.75rem' }}>
                    /{currentTenant?.slug}
                  </span>
                </div>
              </div>

              <div>
                <label className="input-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type="email"
                    required
                    className={`input-field ${fieldErrors.email ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder={roleMode === 'customer' ? 'customer@apexluxe.com' : 'owner@apexluxe.com'}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                  />
                </div>
                {fieldErrors.email && (
                  <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div>
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`input-field ${fieldErrors.password ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              {/* Quick 1-Click Demo Logins */}
              <div
                style={{
                  background:
                    roleMode === 'customer'
                      ? 'rgba(99, 102, 241, 0.06)'
                      : 'rgba(245, 158, 11, 0.06)',
                  border:
                    roleMode === 'customer'
                      ? '1px solid rgba(99, 102, 241, 0.2)'
                      : '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  marginTop: '0.2rem'
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: roleMode === 'customer' ? 'var(--tenant-primary)' : '#f59e0b',
                    marginBottom: '0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Sparkles size={13} />
                  <span>⚡ Quick Demo {roleMode === 'customer' ? 'Customer' : 'Vendor'} Credentials:</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {roleMode === 'customer' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('customer@gymstore.com', 'customer')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        🏋️ Gym Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('customer@sportsshop.com', 'customer')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        ⚽ Sports Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('customer@fruitshop.com', 'customer')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        🍎 Fruit Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('customer@poonamdresses.com', 'customer')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        👗 Poonam Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('customer@electronicshop.com', 'customer')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        ⚡ Electronic Customer
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('owner@gymstore.com', 'vendor')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        🏋️ Gym Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('owner@sportsshop.com', 'vendor')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        ⚽ Sports Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('owner@fruitshop.com', 'vendor')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        🍎 Fruit Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('owner@poonamdresses.com', 'vendor')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        👗 Poonam Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('owner@electronicshop.com', 'vendor')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        ⚡ Electronic Owner
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  marginTop: '0.5rem',
                  width: '100%',
                  background:
                    roleMode === 'vendor'
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : undefined
                }}
              >
                {loading
                  ? 'Authenticating...'
                  : roleMode === 'customer'
                  ? 'Sign In as Customer'
                  : 'Sign In to Merchant Portal'}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 2. CUSTOMER REGISTRATION TAB                              */}
          {/* ========================================================= */}
          {tab === 'register' && roleMode === 'customer' && (
            <form onSubmit={handleCustomerRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label className="input-label">Target Store</label>
                <div
                  style={{
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Registering customer profile on: <strong style={{ color: '#fff' }}>{currentTenant?.name}</strong>
                </div>
              </div>

              <div>
                <label className="input-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type="text"
                    required
                    className={`input-field ${fieldErrors.name ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                  />
                </div>
                {fieldErrors.name && (
                  <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.name}
                  </span>
                )}
              </div>

              <div>
                <label className="input-label">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type="email"
                    required
                    className={`input-field ${fieldErrors.email ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="priya.sharma@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                  />
                </div>
                {fieldErrors.email && (
                  <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div>
                <label className="input-label">Phone Number (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type="tel"
                    className={`input-field ${fieldErrors.phone ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                    }}
                  />
                </div>
                {fieldErrors.phone && (
                  <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.phone}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">Password *</label>
                  <input
                    type="password"
                    required
                    className={`input-field ${fieldErrors.password ? 'input-error' : ''}`}
                    placeholder="Min 8 chars"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                  />
                </div>
                <div>
                  <label className="input-label">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    className={`input-field ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                    }}
                  />
                </div>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Password Strength:</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: pwdStrength.color }}>
                      {pwdStrength.label}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(pwdStrength.score / 4) * 100}%`,
                        background: pwdStrength.color,
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', marginTop: '0.45rem', fontSize: '0.7rem' }}>
                    <div style={{ color: pwdStrength.checks.minLen ? '#10b981' : 'var(--text-muted)' }}>
                      {pwdStrength.checks.minLen ? '✓' : '○'} 8+ characters
                    </div>
                    <div style={{ color: pwdStrength.checks.upperLower ? '#10b981' : 'var(--text-muted)' }}>
                      {pwdStrength.checks.upperLower ? '✓' : '○'} Upper & lowercase
                    </div>
                    <div style={{ color: pwdStrength.checks.number ? '#10b981' : 'var(--text-muted)' }}>
                      {pwdStrength.checks.number ? '✓' : '○'} Number (0-9)
                    </div>
                    <div style={{ color: pwdStrength.checks.special ? '#10b981' : 'var(--text-muted)' }}>
                      {pwdStrength.checks.special ? '✓' : '○'} Symbol (@, #, $, !)
                    </div>
                  </div>
                </div>
              )}

              {fieldErrors.password && (
                <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                  {fieldErrors.password}
                </span>
              )}
              {fieldErrors.confirmPassword && (
                <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                  {fieldErrors.confirmPassword}
                </span>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                {loading ? 'Creating Account...' : 'Create Customer Account'}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 3. VENDOR / NEW STORE REGISTRATION TAB                     */}
          {/* ========================================================= */}
          {tab === 'register' && roleMode === 'vendor' && (
            <form onSubmit={handleVendorRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label className="input-label">Store / Brand Name *</label>
                <div style={{ position: 'relative' }}>
                  <Store
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type="text"
                    required
                    className={`input-field ${fieldErrors.storeName ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="e.g. Quantum Labs, Artisanal Loom"
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      if (fieldErrors.storeName) setFieldErrors({ ...fieldErrors, storeName: '' });
                    }}
                  />
                </div>
                {fieldErrors.storeName && (
                  <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.storeName}
                  </span>
                )}
              </div>

              <div>
                <label className="input-label">Store Tagline / Description</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Next-Generation Mechanical Keyboards & Peripherals"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    className={`input-field ${fieldErrors.name ? 'input-error' : ''}`}
                    placeholder="Vikram Mehta"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                  />
                  {fieldErrors.name && (
                    <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.25rem', display: 'block' }}>
                      {fieldErrors.name}
                    </span>
                  )}
                </div>
                <div>
                  <label className="input-label">Brand Color Accent</label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      className="input-field"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">Owner Business Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type="email"
                    required
                    className={`input-field ${fieldErrors.email ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="owner@quantumlabs.io"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                  />
                </div>
                {fieldErrors.email && (
                  <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div>
                <label className="input-label">Phone Number (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type="tel"
                    className={`input-field ${fieldErrors.phone ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                    }}
                  />
                </div>
                {fieldErrors.phone && (
                  <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.phone}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">Password *</label>
                  <input
                    type="password"
                    required
                    className={`input-field ${fieldErrors.password ? 'input-error' : ''}`}
                    placeholder="Min 8 chars"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                  />
                </div>
                <div>
                  <label className="input-label">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    className={`input-field ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                    }}
                  />
                </div>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Password Strength:</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: pwdStrength.color }}>
                      {pwdStrength.label}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(pwdStrength.score / 4) * 100}%`,
                        background: pwdStrength.color,
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', marginTop: '0.45rem', fontSize: '0.7rem' }}>
                    <div style={{ color: pwdStrength.checks.minLen ? '#10b981' : 'var(--text-muted)' }}>
                      {pwdStrength.checks.minLen ? '✓' : '○'} 8+ characters
                    </div>
                    <div style={{ color: pwdStrength.checks.upperLower ? '#10b981' : 'var(--text-muted)' }}>
                      {pwdStrength.checks.upperLower ? '✓' : '○'} Upper & lowercase
                    </div>
                    <div style={{ color: pwdStrength.checks.number ? '#10b981' : 'var(--text-muted)' }}>
                      {pwdStrength.checks.number ? '✓' : '○'} Number (0-9)
                    </div>
                    <div style={{ color: pwdStrength.checks.special ? '#10b981' : 'var(--text-muted)' }}>
                      {pwdStrength.checks.special ? '✓' : '○'} Symbol (@, #, $, !)
                    </div>
                  </div>
                </div>
              )}

              {fieldErrors.password && (
                <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                  {fieldErrors.password}
                </span>
              )}
              {fieldErrors.confirmPassword && (
                <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                  {fieldErrors.confirmPassword}
                </span>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  marginTop: '0.5rem',
                  width: '100%',
                  background: 'linear-gradient(135deg, #f59e0b, #ec4899)'
                }}
              >
                {loading ? 'Provisioning Tenant Store...' : 'Launch Multi-Tenant Store 🚀'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
