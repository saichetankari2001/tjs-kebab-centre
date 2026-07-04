import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useMenuAdmin() {
  const [menuItems, setMenuItems] = useState([]);
  const [drinks,    setDrinks]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const unsubs = [
      onSnapshot(
        collection(db, 'menuItems'),
        snap => {
          const items = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.categoryOrder ?? 99) - (b.categoryOrder ?? 99) || (a.order ?? 99) - (b.order ?? 99));
          setMenuItems(items);
          setLoading(false);
        },
        err => { console.warn('menuItems error:', err.message); setLoading(false); }
      ),
      onSnapshot(
        collection(db, 'drinks'),
        snap => {
          const items = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
          setDrinks(items);
        },
        err => console.warn('drinks error:', err.message)
      ),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const toggleAvailable = (collName, id, current) =>
    updateDoc(doc(db, collName, id), { available: !current });

  const updatePrice = (collName, id, price) => {
    const num = parseFloat(price);
    if (!isNaN(num) && num >= 0) updateDoc(doc(db, collName, id), { price: num });
  };

  const updateName = (collName, id, name) => {
    if (name.trim()) updateDoc(doc(db, collName, id), { name: name.trim() });
  };

  const deleteItem = (collName, id) => deleteDoc(doc(db, collName, id));

  const menuByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || item.categoryId || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return { menuItems, drinks, menuByCategory, loading, toggleAvailable, updatePrice, updateName, deleteItem };
}
