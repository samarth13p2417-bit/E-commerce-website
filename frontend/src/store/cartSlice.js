import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Async thunk to validate and apply coupon via backend API
export const validateAndApplyCoupon = createAsyncThunk(
  'cart/validateAndApplyCoupon',
  async ({ code, subtotal }, { rejectWithValue }) => {
    try {
      const res = await api.post('/orders/validate-coupon', {
        code: code.trim(),
        subtotal
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Invalid promo code');
    }
  }
);

const initialState = {
  items: [],
  appliedCoupon: null,
  couponError: '',
  couponLoading: false,
  isCartOpen: false,
  isCheckoutOpen: false,
  isOrdersOpen: false,
  activeTenantId: null
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    initCartForTenant: (state, action) => {
      const tenantId = action.payload;
      state.activeTenantId = tenantId;
      state.appliedCoupon = null;
      state.couponError = '';

      if (!tenantId) {
        state.items = [];
        return;
      }

      const storageKey = `cart_${tenantId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          state.items = JSON.parse(saved);
        } catch (e) {
          state.items = [];
        }
      } else {
        state.items = [];
      }
    },
    addItem: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      if (!product) return;

      const existingIdx = state.items.findIndex((i) => i.productId === product._id);
      if (existingIdx > -1) {
        const newQty = state.items[existingIdx].quantity + quantity;
        state.items[existingIdx].quantity = Math.min(newQty, product.stock || 99);
      } else {
        state.items.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          comparePrice: product.comparePrice,
          image: product.images?.[0] || '',
          sku: product.sku || '',
          category: product.category || 'General',
          stock: product.stock || 10,
          quantity: Math.min(quantity, product.stock || 99)
        });
      }

      state.isCartOpen = true;

      if (state.activeTenantId) {
        localStorage.setItem(`cart_${state.activeTenantId}`, JSON.stringify(state.items));
      }
    },
    addMultipleItems: (state, action) => {
      const itemsToAdd = action.payload; // array of { product, quantity }
      if (!Array.isArray(itemsToAdd) || itemsToAdd.length === 0) return;

      for (const { product, quantity = 1 } of itemsToAdd) {
        if (!product) continue;
        const existingIdx = state.items.findIndex((i) => i.productId === product._id);
        if (existingIdx > -1) {
          const newQty = state.items[existingIdx].quantity + quantity;
          state.items[existingIdx].quantity = Math.min(newQty, product.stock || 99);
        } else {
          state.items.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            comparePrice: product.comparePrice,
            image: product.images?.[0] || '',
            sku: product.sku || '',
            category: product.category || 'General',
            stock: product.stock || 10,
            quantity: Math.min(quantity, product.stock || 99)
          });
        }
      }

      state.isCartOpen = true;

      if (state.activeTenantId) {
        localStorage.setItem(`cart_${state.activeTenantId}`, JSON.stringify(state.items));
      }
    },
    updateItemQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.productId !== productId);
      } else {
        const item = state.items.find((i) => i.productId === productId);
        if (item) {
          item.quantity = Math.min(quantity, item.stock || 99);
        }
      }

      if (state.activeTenantId) {
        localStorage.setItem(`cart_${state.activeTenantId}`, JSON.stringify(state.items));
      }
    },
    removeItem: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((i) => i.productId !== productId);

      if (state.activeTenantId) {
        localStorage.setItem(`cart_${state.activeTenantId}`, JSON.stringify(state.items));
      }
    },
    clearCartItems: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      state.couponError = '';

      if (state.activeTenantId) {
        localStorage.removeItem(`cart_${state.activeTenantId}`);
      }
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.couponError = '';
    },
    setCartOpen: (state, action) => {
      state.isCartOpen = action.payload;
    },
    setCheckoutOpen: (state, action) => {
      state.isCheckoutOpen = action.payload;
    },
    setOrdersOpen: (state, action) => {
      state.isOrdersOpen = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateAndApplyCoupon.pending, (state) => {
        state.couponLoading = true;
        state.couponError = '';
      })
      .addCase(validateAndApplyCoupon.fulfilled, (state, action) => {
        state.couponLoading = false;
        state.appliedCoupon = action.payload;
        state.couponError = '';
      })
      .addCase(validateAndApplyCoupon.rejected, (state, action) => {
        state.couponLoading = false;
        state.appliedCoupon = null;
        state.couponError = action.payload || 'Failed to apply coupon';
      });
  }
});

export const {
  initCartForTenant,
  addItem,
  addMultipleItems,
  updateItemQuantity,
  removeItem,
  clearCartItems,
  removeCoupon,
  setCartOpen,
  setCheckoutOpen,
  setOrdersOpen
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectAppliedCoupon = (state) => state.cart.appliedCoupon;
export const selectCouponError = (state) => state.cart.couponError;
export const selectCouponLoading = (state) => state.cart.couponLoading;
export const selectIsCartOpen = (state) => state.cart.isCartOpen;
export const selectIsCheckoutOpen = (state) => state.cart.isCheckoutOpen;
export const selectIsOrdersOpen = (state) => state.cart.isOrdersOpen;

export const selectTotalItemCount = (state) =>
  state.cart.items.reduce((acc, item) => acc + item.quantity, 0);

export const selectSubtotal = (state) =>
  state.cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

export const selectDiscountAmount = (state) => {
  const subtotal = selectSubtotal(state);
  const coupon = state.cart.appliedCoupon;
  if (!coupon || subtotal <= 0) return 0;

  if (coupon.discountType === 'percentage') {
    const calculated = Math.round((subtotal * coupon.discountValue) / 100);
    return coupon.maxDiscount && calculated > coupon.maxDiscount ? coupon.maxDiscount : calculated;
  }
  return Math.min(coupon.discountValue, subtotal);
};

export const selectShippingFee = (state) => {
  const subtotal = selectSubtotal(state);
  return state.cart.items.length === 0 ? 0 : subtotal >= 999 ? 0 : 99;
};

export const selectTotal = (state) => {
  const subtotal = selectSubtotal(state);
  const discount = selectDiscountAmount(state);
  const shipping = selectShippingFee(state);
  return Math.max(0, subtotal - discount + shipping);
};

export default cartSlice.reducer;
