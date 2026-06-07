import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const DELIVERY_STEPS = [
  { id: 'pending', icon: '✅', label: 'Order Confirmed', sub: 'Your order has been received' },
  { id: 'preparing', icon: '👨‍🍳', label: 'Preparing Your Food', sub: 'Our chefs are working on it' },
  { id: 'ready', icon: '🥙', label: 'Order Ready', sub: 'Your food is freshly prepared' },
  { id: 'picked', icon: '🛵', label: 'Out for Delivery', sub: 'Driver is on the way to you' },
  { id: 'delivered', icon: '🎉', label: 'Delivered!', sub: 'Enjoy your meal!' },
];

const PICKUP_STEPS = [
  { id: 'pending', icon: '✅', label: 'Order Confirmed', sub: 'Your order has been received' },
  { id: 'preparing', icon: '👨‍🍳', label: 'Preparing Your Food', sub: 'Our chefs are working on it' },
  { id: 'ready', icon: '🏪', label: 'Ready for Pickup!', sub: 'Come collect your order now' },
];

const DINEIN_STEPS = [
  { id: 'pending', icon: '✅', label: 'Order Confirmed', sub: 'Your order has been received' },
  { id: 'preparing', icon: '👨‍🍳', label: 'Being Prepared', sub: 'Our chefs are working on it' },
  { id: 'ready', icon: '🍽️', label: 'Ready to Serve!', sub: 'Your food is coming to your table' },
];

const STATUS_ORDER = ['pending', 'preparing', 'ready', 'picked', 'delivered'];

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state;
  const [liveStatus, setLiveStatus] = useState('pending');
  const [notifGranted, setNotifGranted] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Find the order in Firebase to get real-time updates
  useEffect(() => {
    if (!order?.orderRef) return;
    const { query, collection, where, onSnapshot: snap } = require('firebase/firestore');
    // Listen for the order by orderRef
    import('firebase/firestore').then(({ query, collection, where, onSnapshot }) => {
      const q = query(collection(db, 'orders'), where('orderRef', '==', order.orderRef));
      const unsub = onSnapshot(q, snapshot => {
        if (!snapshot.empty) {
          const orderDoc = snapshot.docs[0];
          setOrderId(orderDoc.id);
          setLiveStatus(orderDoc.data().status || 'pending');
        }
      });
      return unsub;
    });
  }, [order?.orderRef]);

  // Request notification permission
  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotifGranted(true);
      // Show a test notification
      new Notification("TJ's Kebab Centre 🥙", {
        body: `Order #${order?.orderRef} confirmed! We'll notify you of updates.`,
        icon: '/icon-192.png',
      });
    }
  };

  if (!order) { navigate('/'); return null; }

  const isDelivery = order.orderMode === 'delivery';
  const isDineIn = order.orderMode === 'dinein';
  const steps = isDelivery ? DELIVERY_STEPS : isDineIn ? DINEIN_STEPS : PICKUP_STEPS;
  const currentStepIndex = STATUS_ORDER.indexOf(liveStatus);
  const isComplete = liveStatus === 'delivered' || (liveStatus === 'ready' && !isDelivery);

  const getStepIndex = (stepId) => STATUS_ORDER.indexOf(stepId);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px', background: '#F8FAF8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 60, marginBottom: 12, animation: isComplete ? 'bounce 1s ease 3' : 'none' }}>
          {isComplete ? '🎉' : '🥙'}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: isComplete ? '#1A7A4A' : '#1A2E1F', marginBottom: 6 }}>
          {isComplete ? (isDelivery ? 'Delivered!' : 'Ready!') : 'Order Placed!'}
        </h1>
        <p style={{ color: '#7A9483', fontSize: 15 }}>
          Order <span style={{ fontWeight: 800, color: '#E8410A', fontFamily: 'monospace' }}>#{order.orderRef}</span>
        </p>
        {order.orderType === 'preorder' && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '8px 16px', display: 'inline-block', marginTop: 8, fontSize: 13, color: '#1A7A4A', fontWeight: 600 }}>
            📅 Scheduled: {order.scheduledFor}
          </div>
        )}
      </div>

      {/* Notification Permission Banner */}
      {!notifGranted && (
        <div style={{ background: 'linear-gradient(135deg, #1A7A4A, #22A060)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 4 }}>Get order updates!</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Allow notifications to track your order like Uber Eats</div>
          </div>
          <button
            onClick={requestNotifications}
            style={{ background: '#fff', color: '#1A7A4A', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
          >
            Allow 🔔
          </button>
        </div>
      )}

      {notifGranted && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#1A7A4A', fontWeight: 600 }}>
          ✅ Notifications enabled — you'll be updated every step of the way!
        </div>
      )}

      {/* Live Tracking */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800 }}>
            {isDelivery ? '🛵 Live Delivery Tracking' : '📍 Order Status'}
          </h2>
          {!isComplete && (
            <span style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '3px 10px', animation: 'pulse 2s infinite' }}>
              ● LIVE
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #1A7A4A, #22A060)', borderRadius: 3, width: `${(currentStepIndex / (steps.length - 1)) * 100}%`, transition: 'width 0.8s ease' }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((step, idx) => {
            const stepStatusIndex = getStepIndex(step.id);
            const isDone = stepStatusIndex < currentStepIndex || (stepStatusIndex === currentStepIndex && isComplete);
            const isActive = stepStatusIndex === currentStepIndex && !isComplete;
            const isPending = stepStatusIndex > currentStepIndex;
            return (
              <div key={step.id} style={{ display: 'flex', gap: 14, paddingBottom: idx < steps.length - 1 ? 20 : 0, position: 'relative' }}>
                {idx < steps.length - 1 && (
                  <div style={{ position: 'absolute', left: 19, top: 40, width: 2, height: 'calc(100% - 20px)', background: isDone ? '#1A7A4A' : '#E5E7EB', transition: 'background 0.5s' }} />
                )}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? '#1A7A4A' : isActive ? '#F0FDF4' : '#F8FAF8',
                  border: `2px solid ${isDone ? '#1A7A4A' : isActive ? '#1A7A4A' : '#E5E7EB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, transition: 'all 0.5s',
                  animation: isActive ? 'pulse 2s ease infinite' : 'none',
                  color: isDone ? '#fff' : 'inherit',
                }}>
                  {isDone ? '✓' : step.icon}
                </div>
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: isPending ? '#9CA3AF' : '#1A2E1F', transition: 'color 0.3s' }}>{step.label}</div>
                  <div style={{ fontSize: 12, color: '#7A9483', marginTop: 2 }}>{step.sub}</div>
                  {isActive && isDelivery && step.id === 'picked' && (
                    <div style={{ marginTop: 12, background: '#F8FAF8', borderRadius: 10, padding: '12px 14px', border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: 12, color: '#7A9483', marginBottom: 8 }}>Driver location</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ animation: 'trackMove 1.5s ease-in-out infinite', display: 'inline-block', fontSize: 20 }}>🛵</span>
                        <div style={{ flex: 1, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '60%', background: '#1A7A4A', borderRadius: 2, animation: 'progress 3s ease-in-out infinite' }} />
                        </div>
                        <span style={{ fontSize: 14 }}>📍</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#7A9483', marginTop: 8 }}>Estimated arrival: <strong style={{ color: '#1A2E1F' }}>15–25 minutes</strong></p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Order Details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {order.items?.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#3D5944' }}>
              <span>{item.displayName || item.name} × {item.qty}</span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#1A7A4A' }}>
            <span>TOTAL</span><span>${order.total?.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0', fontSize: 13, color: '#1A7A4A', fontWeight: 600 }}>
          💳 Payment via Card — Secure & Encrypted
        </div>
      </div>

      {isDelivery && order.address && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
          📍 Delivering to: <strong>{order.address}</strong>
        </div>
      )}

      <button onClick={() => navigate('/')} style={{ width: '100%', background: '#fff', color: '#1A2E1F', border: '1px solid #E5E7EB', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        ORDER AGAIN
      </button>

      <style>{`
        @keyframes trackMove { 0% { transform: translateX(0); } 50% { transform: translateX(30px); } 100% { transform: translateX(0); } }
        @keyframes progress { 0% { width: 20%; } 50% { width: 70%; } 100% { width: 20%; } }
      `}</style>
    </div>
  );
}
