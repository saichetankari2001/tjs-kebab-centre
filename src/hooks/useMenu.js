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
        query(collection(db, 'menuItems'), orderBy('categoryOrder'), orderBy('order')),
        (snap) => {
          setMenuItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((i) => i.available !== false));
          setLoading(false);
        },
        (err) => {
          console.error('Menu error:', err);
          setLoading(false);
        }
      ),
      onSnapshot(
        query(collection(db, 'drinks'), orderBy('order')),
        (snap) => setDrinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.available !== false)),
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
