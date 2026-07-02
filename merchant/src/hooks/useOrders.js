import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState([]);
  const knownIds = useRef(new Set());
  const firstLoad = useRef(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(all);
      setLoading(false);

      if (firstLoad.current) {
        // First load — just record existing IDs, no alert
        all.forEach(o => knownIds.current.add(o.id));
        firstLoad.current = false;
        return;
      }

      // Detect truly new orders
      const fresh = all.filter(
        o => !knownIds.current.has(o.id) && (o.status === 'pending' || !o.status)
      );
      if (fresh.length > 0) {
        fresh.forEach(o => knownIds.current.add(o.id));
        setNewOrderIds(prev => [...prev, ...fresh.map(o => o.id)]);
      }
    });
    return unsub;
  }, []);

  const clearNewOrder = (id) => {
    setNewOrderIds(prev => prev.filter(x => x !== id));
  };

  const clearAllNew = () => setNewOrderIds([]);

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'orders', id), { status });
    clearNewOrder(id);
  };

  const pending    = orders.filter(o => !o.status || o.status === 'pending');
  const active     = orders.filter(o => ['confirmed','preparing'].includes(o.status));
  const completed  = orders.filter(o => ['ready','delivered'].includes(o.status));

  return { orders, pending, active, completed, loading, newOrderIds, clearAllNew, clearNewOrder, updateStatus };
}
