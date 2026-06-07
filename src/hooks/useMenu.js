import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple query - no compound index needed
    const menuQ = query(collection(db, 'menuItems'));
    const unsubMenu = onSnapshot(menuQ, (snap) => {
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(item => item.available !== false)
        .sort((a, b) => (a.categoryOrder || 0) - (b.categoryOrder || 0) || (a.order || 0) - (b.order || 0));
      setMenuItems(items);
      setLoading(false);
    }, (err) => {
      console.error('Menu error:', err);
      setLoading(false);
    });

    const unsubDrinks = onSnapshot(collection(db, 'drinks'), (snap) => {
      setDrinks(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.available !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0)));
    });

    const unsubPromo = onSnapshot(collection(db, 'promotions'), (snap) => {
      setPromotions(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.active === true));
    });

    return () => { unsubMenu(); unsubDrinks(); unsubPromo(); };
  }, []);

  // Group items by category
  const categories = menuItems.reduce((acc, item) => {
    const key = item.category;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        name: item.categoryName,
        emoji: item.categoryEmoji,
        order: item.categoryOrder,
        hasSalad: item.hasSalad,
        hasSauce: item.hasSauce,
        hasExtras: item.hasExtras,
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  const sortedCategories = Object.values(categories).sort((a, b) => a.order - b.order);

  return { categories: sortedCategories, drinks, promotions, loading };
}

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { orders, loading };
}
