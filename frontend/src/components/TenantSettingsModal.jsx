import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { X, Palette, Sliders, CheckCircle, AlertCircle } from 'lucide-react';

const TenantSettingsModal = ({ isOpen, onClose }) => {
  const { currentTenant, updateCurrentTenant } = useTenant();
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [bannerText, setBannerText] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      setName(currentTenant.name || '');
      setTagline(currentTenant.tagline || '');
      setPrimaryColor(currentTenant.branding?.primaryColor || '#6366f1');
      setBannerText(currentTenant.branding?.bannerText || '');
      setCurrency(currentTenant.currency || 'INR');
    }
    setError('');
    setSuccess('');
  }, [currentTenant, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.put(`/tenants/${currentTenant._id}`, {
        name,
        tagline,
        currency,
        branding: {
          primaryColor,
          bannerText
        }
      });

      if (res.data.success) {
        updateCurrentTenant(res.data.data);
        setSuccess('Store branding and settings updated!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Palette size={18} style={{ color: 'var(--tenant-primary)' }} />
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Store Branding & Customization</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                padding: '0.6rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#86efac',
                padding: '0.6rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <CheckCircle size={15} />
              {success}
            </div>
          )}

          <div>
            <label className="input-label">Store Brand Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Store Tagline</label>
            <input
              type="text"
              className="input-field"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Top Banner Announcement</label>
            <input
              type="text"
              className="input-field"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="input-label">Primary Brand Theme Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{
                    width: '40px',
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

            <div>
              <label className="input-label">Currency</label>
              <select
                className="input-field"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CAD">CAD ($ - Canadian Dollar)</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Apply Live Branding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantSettingsModal;
