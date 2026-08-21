import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTenant } from './TenantContext';
import {
  initCartForTenant,
  addItem,
  addMultipleItems,
  updateItemQuantity,
  removeItem,
  clearCartItems,
  validateAndApplyCoupon,
  removeCoupon as removeCouponAction,
  setCartOpen,
  setCheckoutOpen,
  setOrdersOpen,
  selectCartItems,
  selectAppliedCoupon,
  selectCouponError,
  selectCouponLoading,
  selectIsCartOpen,
  selectIsCheckoutOpen,
  selectIsOrdersOpen,
  selectTotalItemCount,
  selectSubtotal,
  selectDiscountAmount,
  selectShippingFee,
  selectTotal
} from '../store/cartSlice';

export const CartProvider = ({ children }) => {
  const { currentTenant } = useTenant();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initCartForTenant(currentTenant?._id || null));
  }, [currentTenant, dispatch]);

  return <>{children}</>;
};

export const useCart = () => {
  const dispatch = useDispatch();

  const cartItems = useSelector(selectCartItems);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const couponError = useSelector(selectCouponError);
  const couponLoading = useSelector(selectCouponLoading);
  const isCartOpen = useSelector(selectIsCartOpen);
  const isCheckoutOpen = useSelector(selectIsCheckoutOpen);
  const isOrdersOpen = useSelector(selectIsOrdersOpen);
  const totalItemCount = useSelector(selectTotalItemCount);
  const subtotal = useSelector(selectSubtotal);
  const discountAmount = useSelector(selectDiscountAmount);
  const shippingFee = useSelector(selectShippingFee);
  const total = useSelector(selectTotal);

  const addToCart = (product, quantity = 1) => {
    dispatch(addItem({ product, quantity }));
  };

  const addMultipleToCart = (items) => {
    dispatch(addMultipleItems(items));
  };

  const updateQuantity = (productId, quantity) => {
    dispatch(updateItemQuantity({ productId, quantity }));
  };

  const removeFromCart = (productId) => {
    dispatch(removeItem(productId));
  };

  const clearCart = () => {
    dispatch(clearCartItems());
  };

  const applyCoupon = async (code) => {
    const result = await dispatch(validateAndApplyCoupon({ code, subtotal }));
    return !result.error;
  };

  const removeCoupon = () => {
    dispatch(removeCouponAction());
  };

  const setIsCartOpen = (open) => {
    dispatch(setCartOpen(open));
  };

  const setIsCheckoutOpen = (open) => {
    dispatch(setCheckoutOpen(open));
  };

  const setIsOrdersOpen = (open) => {
    dispatch(setOrdersOpen(open));
  };

  return {
    cartItems,
    appliedCoupon,
    couponError,
    couponLoading,
    isCartOpen,
    isCheckoutOpen,
    isOrdersOpen,
    totalItemCount,
    subtotal,
    discountAmount,
    shippingFee,
    total,
    addToCart,
    addMultipleToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    setIsCartOpen,
    setIsCheckoutOpen,
    setIsOrdersOpen
  };
};

export default useCart;
