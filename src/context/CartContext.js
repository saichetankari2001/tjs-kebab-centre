import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [orderMode, setOrderMode] = useState(null);

  const addItem = (item) => {
    const baseId = item.baseId || item.id;
    const hasCustomisations = item.customisations && (
      item.customisations.salads?.length > 0 ||
      item.customisations.sauces?.length > 0 ||
      item.customisations.extras?.length > 0
    );

    // For items without customisations (drinks, simple items), increment qty
    if (!hasCustomisations) {
      setCart(prev => {
        const existing = prev.find(c => c.baseId === baseId && !c.customisations?.salads?.length && !c.customisations?.sauces?.length);
        if (existing) {
          return prev.map(c => c.cartId === existing.cartId ? { ...c, qty: c.qty + 1 } : c);
        }
        const cartId = baseId + '_' + Date.now();
        return [...prev, { ...item, cartId, baseId, qty: 1 }];
      });
    } else {
      // For customised items, always add as new entry
      const cartId = baseId + '_' + Date.now();
      setCart(prev => [...prev, { ...item, cartId, baseId, qty: 1 }]);
    }
  };

  const removeItem = (cartId) => {
    setCart(prev => {
      const item = prev.find(c => c.cartId === cartId);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter(c => c.cartId !== cartId);
      return prev.map(c => c.cartId === cartId ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const deleteItem = (cartId) => setCart(prev => prev.filter(c => c.cartId !== cartId));
  const clearCart = () => setCart([]);

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, deleteItem, clearCart, total, itemCount, orderMode, setOrderMode }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
