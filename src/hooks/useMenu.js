import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CATEGORIES } from '../data/menu';

export function useMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [drinks,    setDrinks]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const unsubs = [
      onSnapshot(
        collection(db, 'menuItems'),
        (snap) => {
          const items = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((i) => i.available !== false)
            .sort((a, b) => (a.categoryOrder ?? 99) - (b.categoryOrder ?? 99) || (a.order ?? 99) - (b.order ?? 99));
          setMenuItems(items);
          setLoading(false);
        },
        (err) => {
          console.error('Menu error:', err);
          setLoading(false);
        }
      ),
      onSnapshot(
        collection(db, 'drinks'),
        (snap) => {
          const items = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((d) => d.available !== false)
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
          setDrinks(items);
        },
        (err) => console.error('Drinks error:', err)
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Build ordered category list with items attached — CATEGORIES is canonical for order/metadata
  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.id === 'drinks'
      ? drinks
      : menuItems.filter((item) => item.categoryId === cat.id),
  })).filter((cat) => cat.items.length > 0);

  return { categories, loading };
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
