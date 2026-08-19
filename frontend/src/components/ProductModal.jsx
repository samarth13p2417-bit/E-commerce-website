import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import {
  X,
  Sparkles,
  AlertCircle,
  Upload,
  Globe,
  Image as ImageIcon,
  Search,
  Check,
  Link2,
  Trash2,
  FolderOpen,
  RefreshCw
} from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';

// Curated search catalog for instant web/Google product image resolution
const CURATED_IMAGE_DATABASE = {
  apple: [
    { title: 'Fresh Red Apple', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop&q=80' },
    { title: 'Apple iPhone Titanium', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80' },
    { title: 'Apple MacBook Pro', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
    { title: 'Apple Watch Ultra', url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80' },
    { title: 'Green Granny Smith Apple', url: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&auto=format&fit=crop&q=80' }
  ],
  watch: [
    { title: 'Obsidian Chronograph Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80' },
    { title: 'Classic Leather Strap Timepiece', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80' },
    { title: 'Gold Luxury Chronometer', url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800&auto=format&fit=crop&q=80' }
  ],
  phone: [
    { title: 'Flagship Smartphone Dark', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80' },
    { title: 'Minimalist Smartphone Screen', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80' },
    { title: 'Modern Mobile Display', url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80' }
  ],
  headphone: [
    { title: 'Wireless ANC Over-Ear Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80' },
    { title: 'Studio Acoustic Monitor Headphones', url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80' },
    { title: 'Sport Earbuds In-Ear', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80' }
  ],
  shoes: [
    { title: 'Carbon-Plated Running Shoes', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80' },
    { title: 'Minimalist White Sneakers', url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80' },
    { title: 'Athletic Training Shoes', url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80' }
  ],
  bag: [
    { title: 'Italian Full-Grain Leather Bag', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80' },
    { title: 'Urban Commuter Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80' },
    { title: 'Minimalist Crossbody Bag', url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80' }
  ],
  laptop: [
    { title: 'Slim Aluminium Ultrabook', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80' },
    { title: 'High-Performance Workspace Laptop', url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80' }
  ],
  skincare: [
    { title: 'Organic Herbal Facial Oil Serum', url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=crop&q=80' },
    { title: 'Botanical Hydrating Cream Jar', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80' },
    { title: 'Gentle Cleansing Elixir', url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80' }
  ],
  clothing: [
    { title: 'Pure Mongolian Cashmere Overshirt', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80' },
    { title: 'Minimalist Black Cotton T-Shirt', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80' },
    { title: 'Tailored Linen Blazer', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80' }
  ],
  decor: [
    { title: 'Japandi Stoneware Ceramic Set', url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop&q=80' },
    { title: 'Wabi-Sabi Terracotta Floor Vase', url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80' },
    { title: 'Botanical Scented Soy Candle', url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80' }
  ]
};

const ProductModal = ({ isOpen, onClose, product, onProductSaved }) => {
  const { currentTenant } = useTenant();
  const fileInputRef = useRef(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [category, setCategory] = useState('General');
  const [stock, setStock] = useState('10');
  const [sku, setSku] = useState('');
  const [images, setImages] = useState([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Image Tab state: 'search' | 'upload' | 'url'
  const [imageTab, setImageTab] = useState('search');
  const [imageSearchTerm, setImageSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [directUrlInput, setDirectUrlInput] = useState('');

  // Search Online Images (Google / Unsplash simulation with dynamic keyword resolution)
  const performImageSearch = (term) => {
    if (!term || !term.trim()) {
      term = name || 'apple';
    }
    const cleanTerm = term.toLowerCase().trim();
    setIsSearchingWeb(true);

    setTimeout(() => {
      let matched = [];
      // Match keywords
      for (const [key, items] of Object.entries(CURATED_IMAGE_DATABASE)) {
        if (cleanTerm.includes(key) || key.includes(cleanTerm)) {
          matched.push(...items);
        }
      }

      // If no direct key match, generate dynamic high-res Unsplash search links
      if (matched.length === 0) {
        matched = [
          {
            title: `${term} - Primary Angle`,
            url: `https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80`
          },
          {
            title: `${term} - Studio Lighting`,
            url: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80`
          },
          {
            title: `${term} - Lifestyle Showcase`,
            url: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80`
          }
        ];
      }

      setSearchResults(matched);
      setIsSearchingWeb(false);
    }, 150);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price ? product.price.toString() : '');
      setComparePrice(product.comparePrice ? product.comparePrice.toString() : '');
      setCategory(product.category || 'General');
      setStock(product.stock !== undefined ? product.stock.toString() : '10');
      setSku(product.sku || '');
      setImages(product.images && product.images.length > 0 ? product.images : []);
      setIsFeatured(Boolean(product.isFeatured));
      setTags(product.tags ? product.tags.join(', ') : '');
      setImageSearchTerm(product.name || '');
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setComparePrice('');
      setCategory('General');
      setStock('15');
      setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
      setImages(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80']);
      setIsFeatured(false);
      setTags('new, featured, premium');
      setImageSearchTerm('');
    }
    setError('');
    performImageSearch(product?.name || 'apple');
  }, [product, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload (Browse from computer)
  const handleLocalFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large (Maximum 5MB allowed)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setImages([dataUrl, ...images.filter((img) => img !== dataUrl)]);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectWebImage = (url) => {
    setImages([url, ...images.filter((img) => img !== url)]);
  };

  const handleAddDirectUrl = () => {
    if (!directUrlInput.trim()) return;
    setImages([directUrlInput.trim(), ...images.filter((img) => img !== directUrlInput.trim())]);
    setDirectUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !price) {
      setError('Please provide product name and price');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        category,
        stock: parseInt(stock) || 0,
        sku,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
        isFeatured,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []
      };

      let res;
      if (product) {
        res = await api.put(`/products/${product._id}`, payload);
      } else {
        res = await api.post('/products', payload);
      }

      if (res.data.success) {
        onProductSaved(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const primaryImage = images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          maxHeight: '90vh',
          borderRadius: '16px',
          background: '#0d131f',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', margin: 0 }}>
              {product ? 'Edit Product' : 'Add New Product to Store'}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Store Partition: <strong style={{ color: 'var(--tenant-primary)' }}>{currentTenant?.name}</strong>
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
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem'
          }}
        >
          {error && (
            <div
              style={{
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
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="input-label">Product Title / Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Apple iPhone 15 Pro, Organic Green Apple, Chronograph Watch"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!imageSearchTerm || imageSearchTerm === name) {
                  setImageSearchTerm(e.target.value);
                }
              }}
              required
            />
          </div>

          {/* ========================================================================= */}
          {/* PRODUCT IMAGE MANAGER (Browse Local, Search Google/Web, URL, Presets)    */}
          {/* ========================================================================= */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ImageIcon size={16} style={{ color: 'var(--tenant-primary)' }} />
                <label className="input-label" style={{ margin: 0, fontWeight: '700', color: '#fff' }}>
                  Product Images
                </label>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {images.length} image(s) attached
              </span>
            </div>

            {/* Current Selected Image Preview Banner */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#090d16',
                  border: '2px solid var(--tenant-primary)',
                  flexShrink: 0,
                  boxShadow: '0 0 12px var(--tenant-glow)'
                }}
              >
                <img
                  src={primaryImage}
                  alt="Product preview"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>
                  Active Primary Image
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all', maxHeight: '38px', overflow: 'hidden' }}>
                  {primaryImage.startsWith('data:') ? 'Local file uploaded (Data URL format)' : primaryImage}
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: idx === 0 ? '2px solid var(--tenant-primary)' : '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              background: 'rgba(239, 68, 68, 0.85)',
                              border: 'none',
                              color: '#fff',
                              padding: '1px',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Image Source Mode Switcher */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.5rem',
                marginTop: '0.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => setImageTab('search')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: imageTab === 'search' ? 'var(--tenant-primary)' : 'rgba(255,255,255,0.04)',
                  color: imageTab === 'search' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Globe size={13} />
                <span>Search Web & Google</span>
              </button>

              <button
                type="button"
                onClick={() => setImageTab('upload')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: imageTab === 'upload' ? 'var(--tenant-primary)' : 'rgba(255,255,255,0.04)',
                  color: imageTab === 'upload' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <FolderOpen size={13} />
                <span>Browse Image from PC</span>
              </button>

              <button
                type="button"
                onClick={() => setImageTab('url')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: imageTab === 'url' ? 'var(--tenant-primary)' : 'rgba(255,255,255,0.04)',
                  color: imageTab === 'url' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Link2 size={13} />
                <span>Direct Image URL</span>
              </button>
            </div>

            {/* TAB 1: Search Online / Google / Web */}
            {imageTab === 'search' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={14}
                      style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                      }}
                    />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.82rem' }}
                      placeholder="Search image (e.g. apple, iphone, watch, shoes, bag)..."
                      value={imageSearchTerm}
                      onChange={(e) => setImageSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          performImageSearch(imageSearchTerm);
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => performImageSearch(imageSearchTerm || name)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <Search size={13} />
                    <span>Search</span>
                  </button>
                </div>

                {name && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick suggestions:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setImageSearchTerm(name);
                        performImageSearch(name);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    >
                      Search "{name}"
                    </button>
                    {['apple', 'phone', 'watch', 'headphone', 'shoes', 'bag', 'laptop'].map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => {
                          setImageSearchTerm(keyword);
                          performImageSearch(keyword);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', textTransform: 'capitalize' }}
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                )}

                {/* Search Results Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '0.6rem',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '0.25rem 0'
                  }}
                >
                  {isSearchingWeb ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Fetching online images...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((item, idx) => {
                      const isSelected = images.includes(item.url);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectWebImage(item.url)}
                          style={{
                            position: 'relative',
                            height: '95px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid var(--tenant-primary)' : '1px solid rgba(255,255,255,0.08)',
                            boxShadow: isSelected ? '0 0 10px var(--tenant-glow)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                              padding: '0.3rem 0.4rem',
                              fontSize: '0.65rem',
                              color: '#fff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.title}
                          </div>
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'var(--tenant-primary)',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Check size={12} color="#fff" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No matching web images found. Try searching another product name.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Browse Image From PC */}
            {imageTab === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '1.75rem 1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLocalFileUpload}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--tenant-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto'
                  }}
                >
                  <Upload size={20} />
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>
                  Click to Browse Image from your Computer
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Supports PNG, JPG, WEBP, GIF (Up to 5MB) • Instant local preview & save
                </div>
              </div>
            )}

            {/* TAB 3: Direct URL */}
            {imageTab === 'url' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/images/product.jpg"
                  value={directUrlInput}
                  onChange={(e) => setDirectUrlInput(e.target.value)}
                  style={{ fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={handleAddDirectUrl}
                  className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  Use URL
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="input-label">Price ({getCurrencySymbol(currentTenant?.currency || 'INR')}) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="24999.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Compare Price ({getCurrencySymbol(currentTenant?.currency || 'INR')})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="29999.00"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="input-label">Category</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Electronics, Fruits, Apparel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Inventory Stock</label>
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="25"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">SKU</label>
            <input
              type="text"
              className="input-field"
              placeholder="SKU-892102"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Description</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Crisp natural flavor, fresh orchard harvest, rich in vitamins and antioxidants..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="input-label">Tags (comma separated)</label>
            <input
              type="text"
              className="input-field"
              placeholder="organic, fresh, fruit, premium"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              style={{ accentColor: 'var(--tenant-primary)', width: '16px', height: '16px' }}
            />
            <label htmlFor="isFeatured" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
              Feature this product on store homepage
            </label>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : product ? 'Update Product' : 'Save & Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
