import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';

const SHOP_LAT = -37.7063;
const SHOP_LNG = 145.0456;
const MAX_KM = 15;
const GOOGLE_API_KEY = 'AIzaSyDCGA8NJQiZViGwxeIF3yYi9GA-j65WYNc';

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function Field({ label, placeholder, type='text', inputMode, maxLength, error, onDone }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:12, color:'#7A9483', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6, fontWeight:700 }}>{label}</label>
      <input type={type} inputMode={inputMode} placeholder={placeholder} maxLength={maxLength} value={val}
        onChange={e=>{ setVal(e.target.value); onDone(e.target.value); }}
        style={{ width:'100%', background:'#fff', border:`1.5px solid ${error?'#E8410A':'#D1D5DB'}`, borderRadius:10, color:'#1A2E1F', padding:'13px 14px', fontSize:16, outline:'none', boxSizing:'border-box', display:'block' }}
        onFocus={e=>e.target.style.borderColor='#1A7A4A'}
        onBlur={e=>e.target.style.borderColor=error?'#E8410A':'#D1D5DB'}
      />
      {error&&<p style={{ color:'#E8410A', fontSize:12, marginTop:4 }}>{error}</p>}
    </div>
  );
}

function TextArea({ label, placeholder, onDone }) {
  const [val, setVal] = useState('');
  return (
    <div>
      <label style={{ display:'block', fontSize:12, color:'#7A9483', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6, fontWeight:700 }}>{label}</label>
      <textarea placeholder={placeholder} value={val} onChange={e=>{ setVal(e.target.value); onDone(e.target.value); }}
        style={{ width:'100%', background:'#fff', border:'1.5px solid #D1D5DB', borderRadius:10, color:'#1A2E1F', padding:'13px 14px', fontSize:16, outline:'none', resize:'vertical', minHeight:80, lineHeight:1.5, boxSizing:'border-box', display:'block', fontFamily:'Plus Jakarta Sans,sans-serif' }}
        onFocus={e=>e.target.style.borderColor='#1A7A4A'}
        onBlur={e=>e.target.style.borderColor='#D1D5DB'}
      />
    </div>
  );
}

function AddressField({ onDone, error }) {
  const [val, setVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [checking, setChecking] = useState(false);
  const [radiusStatus, setRadiusStatus] = useState(null);

  const handleChange = async (text) => {
    setVal(text);
    onDone(text, null);
    setRadiusStatus(null);
    if (text.length < 4) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text+' Victoria Australia')}&key=${GOOGLE_API_KEY}`);
      const data = await res.json();
      if (data.results) setSuggestions(data.results.slice(0,4));
    } catch {}
  };

  const selectAddress = async (result) => {
    const addr = result.formatted_address;
    setVal(addr);
    setSuggestions([]);
    setChecking(true);
    const { lat, lng } = result.geometry.location;
    const dist = getDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
    const inRadius = dist <= MAX_KM;
    setRadiusStatus({ inRadius, dist: dist.toFixed(1) });
    onDone(addr, inRadius);
    setChecking(false);
  };

  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:12, color:'#7A9483', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6, fontWeight:700 }}>Delivery Address *</label>
      <input type="text" placeholder="Start typing your address..." value={val} onChange={e=>handleChange(e.target.value)}
        style={{ width:'100%', background:'#fff', border:`1.5px solid ${error?'#E8410A':radiusStatus?.inRadius===false?'#E8410A':radiusStatus?.inRadius?'#1A7A4A':'#D1D5DB'}`, borderRadius:10, color:'#1A2E1F', padding:'13px 14px', fontSize:16, outline:'none', boxSizing:'border-box' }}
        onFocus={e=>e.target.style.borderColor='#1A7A4A'}
      />
      {suggestions.length>0&&(
        <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, marginTop:4, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', position:'relative', zIndex:100 }}>
          {suggestions.map((s,i)=>(
            <div key={i} onClick={()=>selectAddress(s)} style={{ padding:'10px 14px', fontSize:13, color:'#1A2E1F', cursor:'pointer', borderBottom:i<suggestions.length-1?'1px solid #F3F7F4':'none', display:'flex', alignItems:'center', gap:8 }} onMouseEnter={e=>e.currentTarget.style.background='#F0FDF4'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              <span style={{ fontSize:16 }}>📍</span>{s.formatted_address}
            </div>
          ))}
        </div>
      )}
      {checking&&<p style={{ fontSize:12, color:'#1A7A4A', marginTop:6 }}>📍 Checking delivery radius...</p>}
      {radiusStatus&&!checking&&(
        <div style={{ marginTop:8, padding:'10px 14px', background:radiusStatus.inRadius?'rgba(26,122,74,0.08)':'rgba(232,65,10,0.08)', border:`1px solid ${radiusStatus.inRadius?'rgba(26,122,74,0.3)':'rgba(232,65,10,0.3)'}`, borderRadius:8, fontSize:13, fontWeight:600, color:radiusStatus.inRadius?'#1A7A4A':'#E8410A' }}>
          {radiusStatus.inRadius?`✅ Great! ${radiusStatus.dist}km from our shop — within delivery range!`:`❌ Sorry! ${radiusStatus.dist}km from our shop — outside our 15km delivery radius.`}
        </div>
      )}
      {error&&<p style={{ color:'#E8410A', fontSize:12, marginTop:4 }}>{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, total, itemCount, orderMode, clearCart } = useCart();
  const navigate = useNavigate();
  const deliveryFee = orderMode==='delivery'?5:0;
  const grandTotal = total+deliveryFee;
  const [orderType, setOrderType] = useState('now');
  const [preorderDate, setPreorderDate] = useState('');
  const [preorderTime, setPreorderTime] = useState('');
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [addressInRadius, setAddressInRadius] = useState(null);
  const formVals = React.useRef({ name:'', phone:'', address:'', notes:'', cardNumber:'', expiry:'', cvv:'', cardName:'' });

  if (itemCount===0) { navigate('/'); return null; }

  const today = new Date().toISOString().split('T')[0];

  const sendShopNotification = async (orderRef, name, total) => {
    try {
      await addDoc(collection(db, 'shopNotifications'), {
        type: 'new_order',
        orderRef, customerName: name, total,
        message: `🔔 New order #${orderRef} from ${name} — $${total.toFixed(2)}`,
        createdAt: serverTimestamp(), read: false,
      });
    } catch(e) { console.log('Shop notification error:', e); }
  };

  const handleSubmit = async () => {
    const f = formVals.current;
    const e = {};
    if (!f.name.trim()) e.name = 'Name is required';
    if (!f.phone.trim()) e.phone = 'Phone is required';
    if (orderMode==='delivery'&&!f.address.trim()) e.address = 'Address is required';
    if (orderMode==='delivery'&&addressInRadius===false) e.address = 'Address is outside our 15km delivery radius';
    if (f.cardNumber.replace(/\s/g,'').length<16) e.cardNumber = 'Enter valid card number';
    if (!f.expiry||f.expiry.length<5) e.expiry = 'Enter valid expiry MM/YY';
    if (!f.cvv||f.cvv.length<3) e.cvv = 'Enter valid CVV';
    if (!f.cardName.trim()) e.cardName = 'Enter name on card';
    if (orderType==='preorder'&&(!preorderDate||!preorderTime)) e.preorder = 'Please select date and time';
    if (Object.keys(e).length>0) { setErrors(e); return; }
    setPlacing(true);
    const orderRef = 'TJ'+Date.now().toString().slice(-6);
    try {
      await addDoc(collection(db, 'orders'), {
        orderRef, name:f.name, phone:f.phone, address:f.address||null, notes:f.notes,
        orderMode, paymentMethod:'card', orderType,
        scheduledFor:orderType==='preorder'?`${preorderDate} at ${preorderTime}`:'ASAP',
        total:grandTotal, items:cart.map(i=>({name:i.displayName||i.name||"",price:i.price||0,qty:i.qty||1,customisations:i.customisations||{}})), status:"pending",
        createdAt:serverTimestamp(),
      });
      await sendShopNotification(orderRef, f.name, grandTotal);
      clearCart();
      navigate('/order-confirmation', { state:{ orderRef, name:f.name, phone:f.phone, address:f.address, orderMode, paymentMethod:'card', total:grandTotal, items:cart.map(i=>({name:i.displayName||i.name||"",price:i.price||0,qty:i.qty||1})), orderType, scheduledFor:orderType==='preorder'?`${preorderDate} at ${preorderTime}`:'ASAP' } });
    } catch(err) { alert('Error placing order: '+err.message); }
    setPlacing(false);
  };

  const inpStyle = { width:'100%', background:'#fff', border:'1.5px solid #D1D5DB', borderRadius:10, color:'#1A2E1F', padding:'13px 14px', fontSize:16, outline:'none', boxSizing:'border-box', display:'block' };

  return (
    <div style={{ maxWidth:560, margin:'0 auto', padding:'24px 20px', background:'#F8FAF8', minHeight:'100vh' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={()=>navigate('/cart')} style={{ background:'#fff', border:'1px solid #E5E7EB', color:'#3D5944', padding:'8px 14px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>← Back</button>
        <h1 style={{ fontSize:24, fontWeight:800 }}>Checkout</h1>
      </div>

      {/* Call the shop */}
      <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#1A2E1F' }}>Questions about your order?</div>
          <div style={{ fontSize:12, color:'#7A9483' }}>Call us at (03) 8529 1244</div>
        </div>
        <a href="tel:0385291244" style={{ background:'#1A7A4A', color:'#fff', padding:'9px 16px', borderRadius:10, fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:6, textDecoration:'none', boxShadow:'0 3px 12px rgba(26,122,74,0.3)' }}>
          📞 Call Us
        </a>
      </div>

      {/* Order Timing */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, padding:'20px', marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize:17, fontWeight:800, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>🕐 When do you want it?</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:orderType==='preorder'?20:0 }}>
          {[{id:'now',icon:'⚡',title:'Order Now',sub:orderMode==='delivery'?'ASAP after 5:30pm':orderMode==='dinein'?'Seat yourself now':'Ready in 15–20 mins'},{id:'preorder',icon:'📅',title:'Pre-Order',sub:'Schedule for later'}].map(opt=>(
            <button key={opt.id} onClick={()=>setOrderType(opt.id)} style={{ background:orderType===opt.id?'#1A7A4A':'#fff', border:`2px solid ${orderType===opt.id?'#1A7A4A':'#E5E7EB'}`, borderRadius:12, padding:'16px 12px', textAlign:'center', color:orderType===opt.id?'#fff':'#1A2E1F', cursor:'pointer', transition:'all 0.2s' }}>
              <div style={{ fontSize:28, marginBottom:6 }}>{opt.icon}</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{opt.title}</div>
              <div style={{ fontSize:11, opacity:0.75 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
        {orderType==='preorder'&&(
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:10 }}>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>📅 Date</label>
                <input type="date" min={today} value={preorderDate} onChange={e=>{setPreorderDate(e.target.value);setErrors(p=>({...p,preorder:''}));}} style={{ ...inpStyle, cursor:'pointer' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#7A9483', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>🕐 Time</label>
                <input type="time" value={preorderTime} onChange={e=>{setPreorderTime(e.target.value);setErrors(p=>({...p,preorder:''}));}} style={{ ...inpStyle, cursor:'pointer' }} />
              </div>
            </div>
            {preorderDate&&preorderTime&&(
              <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#1A7A4A', fontWeight:600 }}>
                ✅ Scheduled: {new Date(preorderDate).toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'})} at {preorderTime}
              </div>
            )}
            {errors.preorder&&<p style={{ color:'#E8410A', fontSize:12, marginTop:8 }}>{errors.preorder}</p>}
          </div>
        )}
      </div>

      {/* Customer Details */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, padding:'20px', marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize:17, fontWeight:800, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>👤 Your Details</h2>
        <Field label="Full Name *" placeholder="Your full name" error={errors.name} onDone={v=>{formVals.current.name=v;setErrors(p=>({...p,name:''}));}} />
        <Field label="Mobile *" placeholder="04XX XXX XXX" type="tel" error={errors.phone} onDone={v=>{formVals.current.phone=v;setErrors(p=>({...p,phone:''}));}} />
        {orderMode==='delivery'&&(
          <>
            <AddressField error={errors.address} onDone={(addr,inRadius)=>{ formVals.current.address=addr; setAddressInRadius(inRadius); setErrors(p=>({...p,address:''})); }} />
            <p style={{ fontSize:11, color:'#7A9483', marginTop:-10, marginBottom:16 }}>🚚 Delivery within 15km of Bundoora · After 5:30pm only</p>
          </>
        )}
      </div>

      {/* Special Instructions */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, padding:'20px', marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize:17, fontWeight:800, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>📝 Special Instructions</h2>
        <TextArea placeholder="Sauce preferences, allergies, special requests..." onDone={v=>{formVals.current.notes=v;}} />
      </div>

      {/* Payment */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, padding:'20px', marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize:17, fontWeight:800, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>💳 Payment</h2>
        <div style={{ background:'#F0FDF4', border:'2px solid #1A7A4A', borderRadius:12, padding:'14px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>💳</span>
          <div><div style={{ fontWeight:700, fontSize:14 }}>Pay by Card</div><div style={{ fontSize:12, color:'#7A9483' }}>Visa, Mastercard, Amex</div></div>
          <div style={{ marginLeft:'auto', width:20, height:20, borderRadius:'50%', background:'#1A7A4A' }} />
        </div>
        <div style={{ background:'#F8FAF8', borderRadius:12, padding:'16px', border:'1px solid #E5E7EB' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span>🔒</span><span style={{ fontSize:12, color:'#7A9483', fontWeight:600 }}>Secure encrypted payment</span>
          </div>
          <Field label="Card Number" placeholder="1234 5678 9012 3456" inputMode="numeric" maxLength={19} error={errors.cardNumber} onDone={v=>{formVals.current.cardNumber=v;setErrors(p=>({...p,cardNumber:''}));}} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Expiry MM/YY" placeholder="MM/YY" inputMode="numeric" maxLength={5} error={errors.expiry} onDone={v=>{formVals.current.expiry=v;setErrors(p=>({...p,expiry:''}));}} />
            <Field label="CVV" placeholder="123" inputMode="numeric" maxLength={4} error={errors.cvv} onDone={v=>{formVals.current.cvv=v;setErrors(p=>({...p,cvv:''}));}} />
          </div>
          <Field label="Name on Card" placeholder="John Smith" error={errors.cardName} onDone={v=>{formVals.current.cardName=v;setErrors(p=>({...p,cardName:''}));}} />
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {['VISA','MC','AMEX'].map(c=><div key={c} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#7A9483' }}>{c}</div>)}
            <span style={{ fontSize:11, color:'#7A9483', marginLeft:4 }}>🔒 SSL</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, padding:'16px', marginBottom:24, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize:17, fontWeight:800, marginBottom:12 }}>Order Summary</h3>
        {orderType==='preorder'&&preorderDate&&preorderTime&&(
          <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:13, color:'#1A7A4A', fontWeight:600 }}>📅 Scheduled: {preorderDate} at {preorderTime}</div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
          {cart.map(item=>(
            <div key={item.cartId} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#3D5944' }}>
              <span>{item.displayName||item.name} × {item.qty}</span><span>${(item.price*item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid #E5E7EB', paddingTop:10, display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#3D5944' }}><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          {orderMode==='delivery'&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#3D5944' }}><span>Delivery fee</span><span>$5.00</span></div>}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:800, color:'#1A7A4A', paddingTop:6 }}><span>TOTAL</span><span>${grandTotal.toFixed(2)}</span></div>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={placing} style={{ width:'100%', background:placing?'#E5E7EB':'#1A7A4A', color:placing?'#9CA3AF':'#fff', border:'none', padding:'17px', borderRadius:14, fontWeight:800, fontSize:18, boxShadow:placing?'none':'0 6px 24px rgba(26,122,74,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor:placing?'not-allowed':'pointer' }}>
        {placing?<><span style={{ display:'inline-block', width:18, height:18, border:'2px solid #9CA3AF', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />PLACING ORDER...</>:`🔒 ${orderType==='preorder'?'CONFIRM PRE-ORDER':'PLACE ORDER'} — $${grandTotal.toFixed(2)}`}
      </button>
      <p style={{ textAlign:'center', fontSize:12, color:'#7A9483', marginTop:12 }}>🔒 Secure & encrypted</p>
    </div>
  );
}
