import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';

const SHOP_LAT = -37.7063;
const SHOP_LNG = 145.0456;
const MAX_KM = 15;
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function AddressField({ onDone, error }) {
  const [val, setVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [checking, setChecking] = useState(false);
  const [radiusStatus, setRadiusStatus] = useState(null);

  const handleChange = async (text) => {
    setVal(text); onDone(text, null); setRadiusStatus(null);
    if (text.length < 4) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text+' Victoria Australia')}&key=${GOOGLE_API_KEY}`);
      const data = await res.json();
      if (data.results) setSuggestions(data.results.slice(0, 4));
    } catch {}
  };

  const selectAddress = async (result) => {
    const addr = result.formatted_address;
    setVal(addr); setSuggestions([]); setChecking(true);
    const { lat, lng } = result.geometry.location;
    const dist = getDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
    const inRadius = dist <= MAX_KM;
    setRadiusStatus({ inRadius, dist: dist.toFixed(1) });
    onDone(addr, inRadius); setChecking(false);
  };

  return (
    <div>
      <input type="text" placeholder="Enter your delivery address" value={val} onChange={e => handleChange(e.target.value)}
        style={{ width:'100%', background:'#fff', border:`1.5px solid ${error?'#E8410A':radiusStatus?.inRadius===false?'#E8410A':radiusStatus?.inRadius?'#1A7A4A':'#E5E7EB'}`, borderRadius:10, color:'#1A2E1F', padding:'13px 14px', fontSize:15, outline:'none', boxSizing:'border-box' }} />
      {suggestions.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, marginTop:4, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', position:'relative', zIndex:100 }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => selectAddress(s)} style={{ padding:'10px 14px', fontSize:13, cursor:'pointer', borderBottom:i<suggestions.length-1?'1px solid #F3F4F6':'none' }}
              onMouseEnter={e=>e.currentTarget.style.background='#F0FDF4'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              📍 {s.formatted_address}
            </div>
          ))}
        </div>
      )}
      {checking && <p style={{ fontSize:12, color:'#1A7A4A', marginTop:6 }}>Checking delivery radius...</p>}
      {radiusStatus && !checking && (
        <div style={{ marginTop:8, padding:'8px 12px', background:radiusStatus.inRadius?'rgba(26,122,74,0.08)':'rgba(232,65,10,0.08)', border:`1px solid ${radiusStatus.inRadius?'rgba(26,122,74,0.3)':'rgba(232,65,10,0.3)'}`, borderRadius:8, fontSize:13, fontWeight:600, color:radiusStatus.inRadius?'#1A7A4A':'#E8410A' }}>
          {radiusStatus.inRadius ? `${radiusStatus.dist}km away — within delivery range` : `${radiusStatus.dist}km away — outside 15km delivery radius`}
        </div>
      )}
      {error && <p style={{ color:'#E8410A', fontSize:12, marginTop:4 }}>{error}</p>}
    </div>
  );
}

// Stamp card visual component
function StampCard({ stamps }) {
  const total = 5;
  return (
    <div style={{ background:'linear-gradient(135deg,#1A7A4A,#22A060)', borderRadius:14, padding:'16px 20px', color:'#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, opacity:0.85 }}>Your Loyalty Stamps</div>
          <div style={{ fontSize:11, opacity:0.7, marginTop:2 }}>5 stamps = Free Kebab + Chips + Drink</div>
        </div>
        <span style={{ fontSize:22 }}>🥙</span>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width:40, height:40, borderRadius:'50%',
            background: i < stamps ? '#FCD34D' : 'rgba(255,255,255,0.2)',
            border: `2px solid ${i < stamps ? '#F59E0B' : 'rgba(255,255,255,0.3)'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, transition:'all 0.3s',
          }}>
            {i < stamps ? '⭐' : ''}
          </div>
        ))}
      </div>
      <div style={{ textAlign:'center', marginTop:10, fontSize:12, opacity:0.85 }}>
        {stamps >= total ? '🎉 Reward ready!' : `${total - stamps} more order${total - stamps !== 1 ? 's' : ''} to earn a free meal!`}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, total, itemCount, orderMode, clearCart } = useCart();
  const navigate = useNavigate();
  const serviceFee = 1.50;
  const deliveryFee = orderMode === 'delivery' ? 5.00 : 0;
  const grandTotal = total + deliveryFee + serviceFee;

  // Payment method: 'shop' (pay in store) or 'online' (card)
  const [payMethod, setPayMethod] = useState(orderMode === 'pickup' ? 'shop' : 'online');
  const [deliverySpeed, setDeliverySpeed] = useState('standard');
  const [promoCode, setPromoCode] = useState('');
  const [promoTried, setPromoTried] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [preorderDate, setPreorderDate] = useState('');
  const [preorderTime, setPreorderTime] = useState('');
  const [signUpOffers, setSignUpOffers] = useState(false);
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [addressInRadius, setAddressInRadius] = useState(null);
  const formVals = React.useRef({ name:'', phone:'', email:'', address:'' });
  const cardVals = React.useRef({ number:'', expiry:'', cvv:'', name:'' });

  if (itemCount === 0) { navigate('/'); return null; }

  const today = new Date().toISOString().split('T')[0];
  const isPickup = orderMode === 'pickup';
  const isDelivery = orderMode === 'delivery';

  const speedOptions = isDelivery
    ? [
        { id:'priority', label:'Priority', sub:'ASAP · Fastest', fee:'+$4.99' },
        { id:'standard', label:'Standard', sub:'20–35 min', fee:'' },
        { id:'schedule', label:'Schedule', sub:'Choose a time', fee:'' },
      ]
    : [
        { id:'standard', label:'Ready Now', sub:'15–20 min', fee:'' },
        { id:'schedule', label:'Schedule', sub:'Pre-order for later', fee:'' },
      ];

  // Update loyalty stamps in Firestore
  const updateLoyalty = async (phone) => {
    try {
      const normalized = phone.replace(/\s/g, '').replace(/^0/, '+61');
      const ref = doc(db, 'loyalty', normalized);
      const snap = await getDoc(ref);
      const current = snap.exists() ? (snap.data().stamps || 0) : 0;
      const newStamps = current + 1;
      const freeReward = newStamps >= 5;
      await setDoc(ref, {
        phone: normalized,
        stamps: freeReward ? 0 : newStamps,
        totalOrders: increment(1),
        freeRewardAvailable: freeReward,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
      return { stamps: freeReward ? 5 : newStamps, freeReward };
    } catch { return { stamps: 1, freeReward: false }; }
  };

  const saveSubscriber = async (name, phone, email) => {
    try {
      await addDoc(collection(db, 'subscribers'), {
        name, phone, email, subscribedAt: serverTimestamp(),
      });
    } catch {}
  };

  const sendShopNotification = async (orderRef, name, total) => {
    try {
      await addDoc(collection(db, 'shopNotifications'), {
        type:'new_order', orderRef, customerName:name, total,
        message:`New order #${orderRef} from ${name} — $${total.toFixed(2)}`,
        createdAt:serverTimestamp(), read:false,
      });
    } catch {}
  };

  const handlePlaceOrder = async () => {
    const f = formVals.current;
    const c = cardVals.current;
    const e = {};
    if (!f.name.trim()) e.name = 'Name is required';
    if (!f.phone.trim()) e.phone = 'Phone is required';
    if (isDelivery && !f.address.trim()) e.address = 'Address is required';
    if (isDelivery && addressInRadius === false) e.address = 'Address is outside our 15km delivery radius';
    if (payMethod === 'online') {
      if (c.number.replace(/\s/g,'').length < 16) e.cardNumber = 'Enter valid card number';
      if (!c.expiry || c.expiry.length < 5) e.expiry = 'Enter valid expiry';
      if (!c.cvv || c.cvv.length < 3) e.cvv = 'Enter CVV';
      if (!c.name.trim()) e.cardName = 'Name on card required';
    }
    if (deliverySpeed === 'schedule' && (!preorderDate || !preorderTime)) e.preorder = 'Select date and time';
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setPlacing(true);
    const orderRef = 'TJ' + Date.now().toString().slice(-6);
    try {
      // Loyalty stamps
      const { stamps, freeReward } = await updateLoyalty(f.phone);

      // Save subscriber if opted in
      if (signUpOffers && f.email) {
        await saveSubscriber(f.name, f.phone, f.email);
      }

      const scheduledFor = (deliverySpeed === 'schedule' && preorderDate && preorderTime)
        ? `${preorderDate} at ${preorderTime}` : 'ASAP';

      await addDoc(collection(db, 'orders'), {
        orderRef, name:f.name, phone:f.phone, address:f.address||null,
        notes:instructions, orderMode, paymentMethod:payMethod==='shop'?'Pay in Shop':'Card',
        orderType:deliverySpeed==='schedule'?'preorder':'now',
        scheduledFor,
        total:grandTotal,
        items:cart.map(i=>({ name:i.displayName||i.name||'', price:i.price||0, qty:i.qty||1, customisations:i.customisations||{} })),
        loyaltyStamps:stamps, freeRewardEarned:freeReward,
        status:'pending', createdAt:serverTimestamp(),
      });
      await sendShopNotification(orderRef, f.name, grandTotal);
      clearCart();
      navigate('/order-confirmation', {
        state:{
          orderRef, name:f.name, phone:f.phone, address:f.address,
          orderMode, paymentMethod:payMethod==='shop'?'Pay in Shop':'Card',
          total:grandTotal,
          items:cart.map(i=>({ name:i.displayName||i.name||'', price:i.price||0, qty:i.qty||1 })),
          orderType:deliverySpeed==='schedule'?'preorder':'now',
          scheduledFor, stamps, freeReward,
        }
      });
    } catch (err) { alert('Error placing order: '+err.message); }
    setPlacing(false);
  };

  const inp = { width:'100%', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:10, color:'#1A2E1F', padding:'13px 14px', fontSize:15, outline:'none', boxSizing:'border-box', display:'block', fontFamily:'Plus Jakarta Sans,sans-serif' };
  const sectionStyle = { background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', marginBottom:12, overflow:'hidden' };
  const sectionHead = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 20px' };
  const editBtn = { background:'none', border:'1px solid #1A7A4A', color:'#1A7A4A', borderRadius:8, padding:'5px 14px', fontSize:13, fontWeight:700, cursor:'pointer' };

  return (
    <div style={{ background:'#F8FAF8', minHeight:'100vh' }}>

      {/* Top bar */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'14px 20px', display:'flex', alignItems:'center', gap:14, position:'sticky', top:63, zIndex:50 }}>
        <button onClick={()=>navigate('/cart')} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#1A2E1F', padding:0 }}>←</button>
        <h1 style={{ fontSize:18, fontWeight:800 }}>Checkout</h1>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'20px 16px' }}>
        <div className="checkout-grid" style={{ display:'grid', gap:20, alignItems:'start' }}>

          {/* ── LEFT ── */}
          <div>

            {/* Delivery address */}
            {isDelivery && (
              <div style={sectionStyle}>
                <div style={sectionHead}>
                  <div>
                    <div style={{ fontSize:11, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:2 }}>Deliver to</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#1A2E1F' }}>{formVals.current.address||'Add your address'}</div>
                  </div>
                  <button style={editBtn} onClick={()=>setEditingAddress(v=>!v)}>{editingAddress?'Done':'Edit'}</button>
                </div>
                {editingAddress && (
                  <div style={{ padding:'0 20px 20px' }}>
                    <AddressField error={errors.address} onDone={(addr,inRadius)=>{ formVals.current.address=addr; setAddressInRadius(inRadius); setErrors(p=>({...p,address:''})); }} />
                    <p style={{ fontSize:11, color:'#7A9483', marginTop:8 }}>Delivery within 15km · After 5:30pm only</p>
                  </div>
                )}
              </div>
            )}

            {/* Delivery instructions */}
            <div style={sectionStyle}>
              <div style={sectionHead}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:instructions?'#1A2E1F':'#9CA3AF' }}>{instructions||'Add delivery instructions'}</div>
                  {!instructions && <div style={{ fontSize:12, color:'#7A9483', marginTop:2 }}>Meet in lobby, ring doorbell, leave at door...</div>}
                </div>
                <button style={editBtn} onClick={()=>setEditingInstructions(v=>!v)}>{editingInstructions?'Done':'Edit'}</button>
              </div>
              {editingInstructions && (
                <div style={{ padding:'0 20px 20px' }}>
                  <textarea placeholder="e.g. meet in lobby, call when arrived..." value={instructions} onChange={e=>setInstructions(e.target.value)}
                    style={{ ...inp, resize:'vertical', minHeight:80, lineHeight:1.5 }} />
                </div>
              )}
            </div>

            {/* Your details */}
            <div style={sectionStyle}>
              <div style={{ padding:'18px 20px 20px' }}>
                <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16, color:'#1A2E1F' }}>Your details</h2>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Full name *</label>
                  <input style={{ ...inp, borderColor:errors.name?'#E8410A':'#E5E7EB' }} placeholder="Your name" onChange={e=>{ formVals.current.name=e.target.value; setErrors(p=>({...p,name:''})); }} />
                  {errors.name&&<p style={{ color:'#E8410A', fontSize:12, marginTop:4 }}>{errors.name}</p>}
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Mobile *</label>
                  <input style={{ ...inp, borderColor:errors.phone?'#E8410A':'#E5E7EB' }} placeholder="04XX XXX XXX" type="tel" onChange={e=>{ formVals.current.phone=e.target.value; setErrors(p=>({...p,phone:''})); }} />
                  {errors.phone&&<p style={{ color:'#E8410A', fontSize:12, marginTop:4 }}>{errors.phone}</p>}
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Email</label>
                  <input style={inp} placeholder="you@email.com" type="email" onChange={e=>{ formVals.current.email=e.target.value; }} />
                </div>
              </div>
            </div>

            {/* Delivery / Pickup options */}
            <div style={sectionStyle}>
              <div style={{ padding:'18px 20px 20px' }}>
                <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16, color:'#1A2E1F' }}>{isDelivery?'Delivery options':'Pickup options'}</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {speedOptions.map(opt=>(
                    <label key={opt.id} onClick={()=>setDeliverySpeed(opt.id)} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', border:`2px solid ${deliverySpeed===opt.id?'#1A7A4A':'#E5E7EB'}`, borderRadius:12, cursor:'pointer', background:deliverySpeed===opt.id?'rgba(26,122,74,0.04)':'#fff', transition:'all 0.18s' }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${deliverySpeed===opt.id?'#1A7A4A':'#D1D5DB'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {deliverySpeed===opt.id&&<div style={{ width:10, height:10, borderRadius:'50%', background:'#1A7A4A' }} />}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:'#1A2E1F' }}>{opt.label}</div>
                        <div style={{ fontSize:12, color:'#7A9483', marginTop:1 }}>{opt.sub}</div>
                      </div>
                      {opt.fee&&<span style={{ fontSize:13, fontWeight:700, color:'#E8410A' }}>{opt.fee}</span>}
                    </label>
                  ))}
                </div>
                {deliverySpeed==='schedule'&&(
                  <div style={{ marginTop:16, padding:16, background:'#F8FAF8', borderRadius:10, border:'1px solid #E5E7EB' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Date</label>
                        <input type="date" min={today} value={preorderDate} onChange={e=>{ setPreorderDate(e.target.value); setErrors(p=>({...p,preorder:''})); }} style={inp} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Time</label>
                        <input type="time" value={preorderTime} onChange={e=>{ setPreorderTime(e.target.value); setErrors(p=>({...p,preorder:''})); }} style={inp} />
                      </div>
                    </div>
                    {preorderDate&&preorderTime&&(
                      <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(26,122,74,0.08)', borderRadius:8, fontSize:13, color:'#1A7A4A', fontWeight:600 }}>
                        Scheduled: {new Date(preorderDate).toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'})} at {preorderTime}
                      </div>
                    )}
                    {errors.preorder&&<p style={{ color:'#E8410A', fontSize:12, marginTop:8 }}>{errors.preorder}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Payment method */}
            <div style={sectionStyle}>
              <div style={{ padding:'18px 20px 20px' }}>
                <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16, color:'#1A2E1F' }}>Payment</h2>

                {/* Payment type selection */}
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                  {(isPickup ? [
                    { id:'shop', icon:'🏪', label:'Pay in Shop', sub:'Cash or card at the counter — no payment needed now' },
                    { id:'online', icon:'💳', label:'Online Payment', sub:'Pay now with card — secure checkout' },
                  ] : [
                    { id:'online', icon:'💳', label:'Pay by Card', sub:'Visa, Mastercard, Amex — secure checkout' },
                  ]).map(opt=>(
                    <label key={opt.id} onClick={()=>setPayMethod(opt.id)} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', border:`2px solid ${payMethod===opt.id?'#1A7A4A':'#E5E7EB'}`, borderRadius:12, cursor:'pointer', background:payMethod===opt.id?'rgba(26,122,74,0.04)':'#fff', transition:'all 0.18s' }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${payMethod===opt.id?'#1A7A4A':'#D1D5DB'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {payMethod===opt.id&&<div style={{ width:10, height:10, borderRadius:'50%', background:'#1A7A4A' }} />}
                      </div>
                      <span style={{ fontSize:20, flexShrink:0 }}>{opt.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:'#1A2E1F' }}>{opt.label}</div>
                        <div style={{ fontSize:12, color:'#7A9483', marginTop:1 }}>{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Card details (only for online payment) */}
                {payMethod==='online'&&(
                  <div style={{ background:'#F8FAF8', borderRadius:12, padding:'16px', border:'1px solid #E5E7EB' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                      <span>🔒</span><span style={{ fontSize:12, color:'#7A9483', fontWeight:600 }}>Secure encrypted payment</span>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Card number</label>
                      <input style={{ ...inp, borderColor:errors.cardNumber?'#E8410A':'#E5E7EB' }} placeholder="1234 5678 9012 3456" inputMode="numeric" maxLength={19} onChange={e=>{ cardVals.current.number=e.target.value; setErrors(p=>({...p,cardNumber:''})); }} />
                      {errors.cardNumber&&<p style={{ color:'#E8410A', fontSize:12, marginTop:4 }}>{errors.cardNumber}</p>}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Expiry</label>
                        <input style={{ ...inp, borderColor:errors.expiry?'#E8410A':'#E5E7EB' }} placeholder="MM/YY" inputMode="numeric" maxLength={5} onChange={e=>{ cardVals.current.expiry=e.target.value; setErrors(p=>({...p,expiry:''})); }} />
                        {errors.expiry&&<p style={{ color:'#E8410A', fontSize:12, marginTop:4 }}>{errors.expiry}</p>}
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>CVV</label>
                        <input style={{ ...inp, borderColor:errors.cvv?'#E8410A':'#E5E7EB' }} placeholder="123" inputMode="numeric" maxLength={4} onChange={e=>{ cardVals.current.cvv=e.target.value; setErrors(p=>({...p,cvv:''})); }} />
                        {errors.cvv&&<p style={{ color:'#E8410A', fontSize:12, marginTop:4 }}>{errors.cvv}</p>}
                      </div>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Name on card</label>
                      <input style={{ ...inp, borderColor:errors.cardName?'#E8410A':'#E5E7EB' }} placeholder="John Smith" onChange={e=>{ cardVals.current.name=e.target.value; setErrors(p=>({...p,cardName:''})); }} />
                      {errors.cardName&&<p style={{ color:'#E8410A', fontSize:12, marginTop:4 }}>{errors.cardName}</p>}
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:14 }}>
                      {['VISA','MC','AMEX'].map(c=><div key={c} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#7A9483' }}>{c}</div>)}
                    </div>
                  </div>
                )}

                {payMethod==='shop'&&(
                  <div style={{ background:'rgba(26,122,74,0.06)', border:'1px solid rgba(26,122,74,0.2)', borderRadius:12, padding:'14px 16px', fontSize:13, color:'#1A7A4A', fontWeight:600 }}>
                    No payment needed now — pay cash or card when you pick up your order.
                  </div>
                )}
              </div>
            </div>

            {/* Mobile place order button */}
            <div className="checkout-btn-mobile">
              <button onClick={handlePlaceOrder} disabled={placing} style={{ width:'100%', background:placing?'#9CA3AF':'#1A2E1F', color:'#fff', border:'none', padding:'17px', borderRadius:14, fontWeight:800, fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor:placing?'not-allowed':'pointer', boxShadow:placing?'none':'0 4px 16px rgba(0,0,0,0.2)' }}>
                {placing?<><span style={{ display:'inline-block', width:18, height:18, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Placing order...</>:`Continue to payment — $${grandTotal.toFixed(2)}`}
              </button>
              <p style={{ textAlign:'center', fontSize:12, color:'#7A9483', marginTop:10 }}>🔒 Secure & encrypted</p>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ position:'sticky', top:120 }}>

            {/* Cart summary */}
            <div style={{ ...sectionStyle, marginBottom:12 }}>
              <button onClick={()=>setCartOpen(v=>!v)} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>🛒</span>
                  <span style={{ fontSize:15, fontWeight:700, color:'#1A2E1F' }}>Cart summary ({itemCount} item{itemCount>1?'s':''})</span>
                </div>
                <span style={{ fontSize:18, color:'#7A9483', transform:cartOpen?'rotate(90deg)':'none', transition:'transform 0.2s' }}>›</span>
              </button>
              {cartOpen&&(
                <div style={{ padding:'0 20px 16px', borderTop:'1px solid #F3F4F6' }}>
                  {cart.map(item=>(
                    <div key={item.cartId} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 0', borderBottom:'1px solid #F9FAFB' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#1A2E1F' }}>{item.displayName||item.name} × {item.qty}</div>
                        {item.customisations?.salads?.length>0&&<div style={{ fontSize:11, color:'#7A9483' }}>{item.customisations.salads.join(', ')}</div>}
                        {item.customisations?.sauces?.length>0&&<div style={{ fontSize:11, color:'#7A9483' }}>{item.customisations.sauces.join(', ')}</div>}
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:'#1A2E1F' }}>${(item.price*item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Promo code */}
            <div style={{ ...sectionStyle, marginBottom:12 }}>
              <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:18 }}>🏷️</span>
                <input placeholder="Add promo code" value={promoCode} onChange={e=>{ setPromoCode(e.target.value); setPromoTried(false); }}
                  style={{ flex:1, border:'none', background:'none', fontSize:15, color:'#1A2E1F', outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif' }} />
                <button onClick={()=>setPromoTried(true)} style={{ background:'none', border:'none', color:'#1A7A4A', fontWeight:700, fontSize:14, cursor:'pointer', flexShrink:0 }}>›</button>
              </div>
              {promoTried&&promoCode&&<div style={{ padding:'0 20px 14px', fontSize:12, color:'#E8410A', fontWeight:600 }}>Invalid promo code</div>}
            </div>

            {/* Order total */}
            <div style={{ ...sectionStyle, marginBottom:12 }}>
              <div style={{ padding:'18px 20px' }}>
                <h2 style={{ fontSize:16, fontWeight:800, color:'#1A2E1F', marginBottom:16 }}>Order total</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#3D5944' }}><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                  {isDelivery&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#3D5944' }}><span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span></div>}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#3D5944' }}><span>Service fee</span><span>${serviceFee.toFixed(2)}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:800, color:'#1A2E1F', paddingTop:10, borderTop:'1px solid #E5E7EB' }}><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            {/* Email sign-up (like Uber Eats) */}
            <div style={{ ...sectionStyle, marginBottom:12 }}>
              <div style={{ padding:'16px 20px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div onClick={()=>setSignUpOffers(v=>!v)} style={{ width:20, height:20, border:`2px solid ${signUpOffers?'#1A7A4A':'#D1D5DB'}`, borderRadius:4, background:signUpOffers?'#1A7A4A':'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:2 }}>
                    {signUpOffers&&<span style={{ color:'#fff', fontSize:13, fontWeight:800 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1A2E1F', marginBottom:4 }}>Sign up to receive offers and news from TJ's Kebab Centre</div>
                    <div style={{ fontSize:11, color:'#7A9483', lineHeight:1.5 }}>By ticking this box, you agree to receive promotional emails. You can unsubscribe anytime.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Place order button (desktop) */}
            <button onClick={handlePlaceOrder} disabled={placing} style={{ width:'100%', background:placing?'#9CA3AF':'#1A2E1F', color:'#fff', border:'none', padding:'17px', borderRadius:14, fontWeight:800, fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor:placing?'not-allowed':'pointer', boxShadow:placing?'none':'0 4px 16px rgba(0,0,0,0.2)', marginBottom:8 }}>
              {placing?<><span style={{ display:'inline-block', width:18, height:18, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Placing order...</>:`Continue to payment — $${grandTotal.toFixed(2)}`}
            </button>
            <p style={{ textAlign:'center', fontSize:12, color:'#7A9483' }}>🔒 Secure & encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );
}
