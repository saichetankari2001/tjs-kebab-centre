import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  updateDoc, doc, addDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export function useMenuAdmin() {
  const [menuItems, setMenuItems] = useState([]);
  const [drinks,    setDrinks]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const unsubs = [
      onSnapshot(
        query(collection(db, 'menuItems'), orderBy('categoryOrder'), orderBy('order')),
        snap => { setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
        err  => { console.warn('menuItems error:', err); setLoading(false); }
      ),
      onSnapshot(
        query(collection(db, 'drinks'), orderBy('order')),
        snap => setDrinks(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err  => console.warn('drinks error:', err)
      ),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const toggleAvailable = async (collectionName, id, current) => {
    await updateDoc(doc(db, collectionName, id), { available: !current });
  };

  const updatePrice = async (collectionName, id, price) => {
    const num = parseFloat(price);
    if (!isNaN(num) && num >= 0) {
      await updateDoc(doc(db, collectionName, id), { price: num });
    }
  };

  const updateName = async (collectionName, id, name) => {
    if (name.trim()) await updateDoc(doc(db, collectionName, id), { name: name.trim() });
  };

  const deleteItem = async (collectionName, id) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  // Group menu items by category
  const menuByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return { menuItems, drinks, menuByCategory, loading, toggleAvailable, updatePrice, updateName, deleteItem };
}
