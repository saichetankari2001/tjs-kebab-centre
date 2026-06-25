import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [orderMode, setOrderMode] = useState('pickup');

  const addItem = (item) => {
    const baseId = item.baseId || item.id;
    const isSimple = !item.customisations ||
      (!item.customisations.salads?.length &&
       !item.customisations.sauces?.length &&
       !item.customisations.extras?.length);

    if (isSimple) {
      setCart(prev => {
        const idx = prev.findIndex(c =>
          (c.baseId === baseId || c.id === baseId) &&
          (!c.customisations || (!c.customisations.salads?.length && !c.customisations.sauces?.length && !c.customisations.extras?.length))
        );
        if (idx !== -1) return prev.map((c,i) => i===idx ? {...c, qty:c.qty+1} : c);
        return [...prev, {...item, cartId:baseId+'_'+Date.now(), baseId, qty:1}];
      });
    } else {
      setCart(prev => [...prev, {...item, cartId:baseId+'_'+Date.now(), baseId, qty:1}]);
    }
  };

  const removeItem = (cartId) => {
    setCart(prev => {
      const item = prev.find(c => c.cartId === cartId);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter(c => c.cartId !== cartId);
      return prev.map(c => c.cartId === cartId ? {...c, qty:c.qty-1} : c);
    });
  };

  const deleteItem = (cartId) => setCart(prev => prev.filter(c => c.cartId !== cartId));
  const clearCart = () => setCart([]);
  const total = cart.reduce((s,c) => s+c.price*c.qty, 0);
  const itemCount = cart.reduce((s,c) => s+c.qty, 0);

  return (
    <CartContext.Provider value={{cart, addItem, removeItem, deleteItem, clearCart, total, itemCount, orderMode, setOrderMode}}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);