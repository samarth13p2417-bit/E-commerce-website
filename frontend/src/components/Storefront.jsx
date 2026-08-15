import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import {
  Search,
  Sparkles,
  Star,
  Tag,
  ShoppingCart,
  Eye,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Minus,
  CheckSquare,
  Square,
  Layers
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

const Storefront = ({ onQuickViewProduct }) => {
  const { currentTenant, switchTenant } = useTenant();
  const { addToCart, addMultipleToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [addedItem, setAddedItem] = useState(null);

  // Multi-product selection & quantity state
  const [cardQuantities, setCardQuantities] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Fetch products for current tenant
  const loadTenantProducts = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      let url = `/products?tenant=${currentTenant._id}`;
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setProducts(res.data.data);
      }

      // Fetch categories
      const catRes = await api.get(`/products/categories/list?tenant=${currentTenant._id}`);
      if (catRes.data.success && catRes.data.data.productCategories) {
        setCategories(['All', ...catRes.data.data.productCategories]);
      }
    } catch (err) {
      console.error('Error fetching tenant products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantProducts();
  }, [currentTenant, selectedCategory, searchQuery]);

  const handleSeedStarterProducts = async () => {
    if (!currentTenant?._id) return;
    setSeedLoading(true);
    try {
      const res = await api.post('/products/seed-starter', null, {
        headers: { 'x-tenant-id': currentTenant._id }
      });
      if (res.data.success) {
        await loadTenantProducts();
      }
    } catch (err) {
      console.error('Failed to seed starter products:', err);
    } finally {
      setSeedLoading(false);
    }
  };

  const getCardQty = (prodId) => cardQuantities[prodId] || 1;

  const setCardQty = (prodId, val, maxStock = 99) => {
    const newQty = Math.max(1, Math.min(maxStock, val));
    setCardQuantities((prev) => ({ ...prev, [prodId]: newQty }));
  };

  const handleAddToCart = (product) => {
    const qty = getCardQty(product._id);
    addToCart(product, qty);
    setAddedItem(`${qty}x ${product.name}`);
    setTimeout(() => setAddedItem(null), 2500);
  };

  const toggleSelectProduct = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p._id === product._id);
      if (exists) {
        return prev.filter((p) => p._id !== product._id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleAddMultipleSelected = () => {
    if (selectedProducts.length === 0) return;

    const itemsToAdd = selectedProducts.map((p) => ({
      product: p,
      quantity: getCardQty(p._id)
    }));

    addMultipleToCart(itemsToAdd);
    setAddedItem(`${selectedProducts.length} unique products added to cart`);
    setSelectedProducts([]);
    setIsMultiSelectMode(false);
    setTimeout(() => setAddedItem(null), 3000);
  };

  const selectedTotalAmount = selectedProducts.reduce(
    (acc, p) => acc + p.price * getCardQty(p._id),
    0
  );

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.5rem', minHeight: '80vh' }}>
      {/* Toast Notification */}
      {addedItem && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 1200,
            background: '#10b981',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            animation: 'modalIn 0.2s ease-out'
          }}
        >
          <CheckCircle2 size={18} />
          <span>Added "{addedItem}" to cart</span>
        </div>
      )}

      {/* Tenant Hero Banner */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '2rem',
          background: `radial-gradient(ellipse at 80% 50%, var(--tenant-glow), transparent 70%), var(--bg-card)`
        }}
      >
        <div style={{ maxWidth: '650px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--tenant-primary)',
              marginBottom: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Sparkles size={14} />
            <span>Storefront Preview • {currentTenant?.name}</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', lineHeight: '1.15', marginBottom: '0.8rem', color: '#fff' }}>
            {currentTenant?.tagline || 'Curated luxury essentials'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem', maxWidth: '500px' }}>
            Experience isolated multi-tenant catalog architecture. Every product shown here is strictly partitioned for{' '}
            <strong style={{ color: '#fff' }}>{currentTenant?.name}</strong>.
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              <ShieldCheck size={16} style={{ color: '#10b981' }} />
              <span>Multi-Tenant DB Isolated</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)' }}>•</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total Products: <strong style={{ color: '#fff' }}>{products.length}</strong>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)' }}>•</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Plan: <span className="badge badge-tenant" style={{ textTransform: 'capitalize' }}>{currentTenant?.plan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem'
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  border: isActive ? '1px solid var(--tenant-primary)' : '1px solid var(--border-subtle)',
                  background: isActive ? 'var(--tenant-primary)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 10px var(--tenant-glow)' : 'none'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search & Multi-Select Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setIsMultiSelectMode((prev) => !prev);
              if (isMultiSelectMode) setSelectedProducts([]);
            }}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '0.5rem 0.85rem',
              borderColor: isMultiSelectMode ? 'var(--tenant-primary)' : undefined,
              background: isMultiSelectMode ? 'rgba(99, 102, 241, 0.15)' : undefined,
              color: isMultiSelectMode ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <CheckSquare size={15} style={{ color: isMultiSelectMode ? 'var(--tenant-primary)' : undefined }} />
            <span>{isMultiSelectMode ? 'Exit Bulk Select' : 'Select Multiple Products'}</span>
          </button>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Search store catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Floating Multi-Product Add-to-Cart Bar */}
      {selectedProducts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1250,
            background: '#0e172a',
            border: '1px solid var(--tenant-primary)',
            boxShadow: '0 10px 35px rgba(0,0,0,0.8), 0 0 25px var(--tenant-glow)',
            borderRadius: 'var(--radius-full)',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            animation: 'fadeInUp 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--tenant-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.85rem'
              }}
            >
              {selectedProducts.length}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>
                {selectedProducts.length} products selected
              </div>
              <div style={{ fontSize: '0.75rem', color: '#86efac' }}>
                Total: {formatCurrency(selectedTotalAmount, currentTenant?.currency || 'INR')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedProducts([])}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '0.35rem 0.6rem'
              }}
            >
              Clear
            </button>
            <button
              onClick={handleAddMultipleSelected}
              className="btn btn-primary"
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: '700'
              }}
            >
              <ShoppingCart size={16} />
              <span>Add All to Cart</span>
            </button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Loading Store Catalog...</div>
          <div style={{ fontSize: '0.85rem' }}>Fetching tenant-isolated product records</div>
        </div>
      ) : products.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            textAlign: 'center',
            padding: '3.5rem 2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.4)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(99, 102, 241, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--tenant-primary)'
            }}
          >
            <Tag size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.5rem', fontWeight: '700' }}>
            Store Catalog Empty
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 1.75rem auto', lineHeight: 1.5 }}>
            <strong>{currentTenant?.name}</strong> is an isolated multi-tenant partition with 0 products currently added. You can generate sample products with images or switch to one of the 5 pre-seeded flagship stores.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <button
              onClick={handleSeedStarterProducts}
              disabled={seedLoading}
              className="btn btn-primary"
              style={{
                padding: '0.7rem 1.5rem',
                fontSize: '0.9rem',
                gap: '0.5rem',
                boxShadow: '0 4px 20px var(--tenant-glow)'
              }}
            >
              <Sparkles size={16} />
              <span>{seedLoading ? 'Generating Products...' : `✨ Add Sample Products with Images to ${currentTenant?.name}`}</span>
            </button>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Or view complete catalogs with product photos in seeded stores:
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => switchTenant('apex-luxe')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                ⌚ Apex Luxe (Luxury)
              </button>
              <button
                onClick={() => switchTenant('nova-tech')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                🎧 Nova Tech (Audio & Gear)
              </button>
              <button
                onClick={() => switchTenant('verdant-organics')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                🌿 Verdant Organics (Wellness)
              </button>
              <button
                onClick={() => switchTenant('komorebi-living')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                🏺 Komorebi Living (Japandi)
              </button>
              <button
                onClick={() => switchTenant('velocity-fit')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                🏃 Velocity Pro (Athletics)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {products.map((p) => {
            const hasDiscount = p.comparePrice && p.comparePrice > p.price;
            const discountPercent = hasDiscount ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;
            const isSelected = selectedProducts.some((item) => item._id === p._id);
            const currentCardQty = getCardQty(p._id);

            return (
              <div
                key={p._id}
                className="glass-panel glass-panel-hover"
                style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: isSelected ? '2px solid var(--tenant-primary)' : undefined,
                  boxShadow: isSelected ? '0 0 20px var(--tenant-glow)' : undefined
                }}
              >
                {/* Product Image */}
                <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden', background: '#111827' }}>
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                    alt={p.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                  />

                  {/* Multi-select checkbox */}
                  {(isMultiSelectMode || isSelected) && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectProduct(p);
                      }}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        zIndex: 10,
                        background: isSelected ? 'var(--tenant-primary)' : 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '0.35rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                      }}
                      title={isSelected ? 'Deselect product' : 'Select for multi-add'}
                    >
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                  )}

                  {/* Badges */}
                  <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                    {p.isFeatured && (
                      <span className="badge" style={{ background: '#f59e0b', color: '#000' }}>
                        ★ Featured
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="badge" style={{ background: '#ef4444', color: '#fff' }}>
                        -{discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Category Pill */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      left: '0.75rem',
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(6px)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.7rem',
                      color: '#e2e8f0',
                      fontWeight: '600'
                    }}
                  >
                    {p.category}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', color: '#f59e0b' }}>
                      <Star size={13} fill="#f59e0b" />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f8fafc' }}>{p.rating || 4.8}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({p.reviewsCount || 12})</span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: '700',
                      color: '#fff',
                      marginBottom: '0.4rem',
                      lineHeight: '1.3'
                    }}
                  >
                    {p.name}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flexGrow: 1
                    }}
                  >
                    {p.description}
                  </p>

                  {/* Pricing and Action */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>
                            {formatCurrency(p.price, currentTenant?.currency || 'INR')}
                          </span>
                          {hasDiscount && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              {formatCurrency(p.comparePrice, currentTenant?.currency || 'INR')}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: p.stock > 0 ? '#10b981' : '#ef4444' }}>
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </div>
                      </div>

                      {/* Card Quantity Stepper */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '6px'
                        }}
                      >
                        <button
                          onClick={() => setCardQty(p._id, currentCardQty - 1, p.stock)}
                          disabled={currentCardQty <= 1}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: currentCardQty <= 1 ? 'var(--text-muted)' : '#fff',
                            cursor: currentCardQty <= 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.1rem'
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', minWidth: '16px', textAlign: 'center' }}>
                          {currentCardQty}
                        </span>
                        <button
                          onClick={() => setCardQty(p._id, currentCardQty + 1, p.stock)}
                          disabled={currentCardQty >= (p.stock || 99)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: currentCardQty >= (p.stock || 99) ? 'var(--text-muted)' : '#fff',
                            cursor: currentCardQty >= (p.stock || 99) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.1rem'
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => onQuickViewProduct(p)}
                        className="btn btn-secondary btn-sm"
                        title="Quick View"
                        style={{ padding: '0.45rem 0.6rem' }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="btn btn-primary btn-sm"
                        disabled={p.stock <= 0}
                        style={{ flexGrow: 1, padding: '0.45rem 0.75rem', justifyContent: 'center' }}
                      >
                        <ShoppingCart size={15} />
                        Add {currentCardQty > 1 ? `(${currentCardQty})` : ''} to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Storefront;
