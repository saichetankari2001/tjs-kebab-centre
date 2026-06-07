import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SEED_DRINKS as drinks } from '../data/seedData';

export default function CartPage() {
  const { cart, addItem, removeItem, deleteItem, total, itemCount, orderMode } = useCart();
  const navigate = useNavigate();
  const deliveryFee = orderMode === 'delivery' ? 5 : 0;
  const grandTotal = total + deliveryFee;

  if (itemCount === 0) {
    return (
      <div style={{ textAlign:'center', padding:'80px 20px', background:'#F8FAF8', minHeight:'100vh' }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🥙</div>
        <h2 style={{ fontSize:28, fontWeight:800, marginBottom:10 }}>Your cart is empty</h2>
        <p style={{ color:'#7A9483', marginBottom:28 }}>Add some delicious items from our menu!</p>
        <button onClick={()=>navigate('/')} style={{ background:'#1A7A4A', color:'#fff', border:'none', padding:'14px 32px', borderRadius:12, fontSize:17, fontWeight:700, cursor:'pointer' }}>BROWSE MENU</button>
      </div>
    );
  }

  // Group same drinks together
  const groupedCart = cart.reduce((acc, item) => {
    const key = item.baseId || item.id;
    const isDrink = drinks.find(d => d.id === key);
    if (isDrink) {
      const existing = acc.find(i => (i.baseId||i.id) === key && !i.customisations);
      if (existing) { existing.qty += item.qty; existing.cartIds = [...(existing.cartIds||[existing.cartId]), item.cartId]; return acc; }
    }
    return [...acc, { ...item, cartIds: [item.cartId] }];
  }, []);

  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'24px 20px', background:'#F8FAF8', minHeight:'100vh' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={()=>navigate('/')} style={{ background:'#fff', border:'1px solid #E5E7EB', color:'#3D5944', padding:'8px 14px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>← Back</button>
        <h1 style={{ fontSize:26, fontWeight:800 }}>Your Order</h1>
      </div>

      {/* Mode banner */}
      <div style={{ background:orderMode==='delivery'?'rgba(232,65,10,0.06)':orderMode==='dinein'?'rgba(245,166,35,0.06)':'rgba(26,122,74,0.06)', border:`1px solid ${orderMode==='delivery'?'rgba(232,65,10,0.2)':orderMode==='dinein'?'rgba(245,166,35,0.2)':'rgba(26,122,74,0.2)'}`, borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:18 }}>{orderMode==='delivery'?'🛵':orderMode==='dinein'?'🍽️':'🏪'}</span>
        <span style={{ fontSize:14, fontWeight:600, color:orderMode==='delivery'?'#E8410A':orderMode==='dinein'?'#B45309':'#1A7A4A' }}>
          {orderMode==='delivery'?'Delivery — After 5:30pm, within 15km':orderMode==='dinein'?'Dine In — Eat at our restaurant':'Pickup — Ready in 15–20 minutes'}
        </span>
        <button onClick={()=>navigate('/')} style={{ marginLeft:'auto', background:'none', border:'none', color:'#7A9483', fontSize:12, fontWeight:600, cursor:'pointer' }}>Change</button>
      </div>

      {/* Cart Items */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        {groupedCart.map((item, idx) => (
          <div key={item.cartId+idx} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:2 }}>{item.displayName||item.name}</div>
                {item.customisations?.salads?.length>0&&<div style={{ fontSize:11, color:'#7A9483', marginTop:3 }}>🥗 {item.customisations.salads.join(', ')}</div>}
                {item.customisations?.sauces?.length>0&&<div style={{ fontSize:11, color:'#7A9483', marginTop:2 }}>🫙 {item.customisations.sauces.join(', ')}</div>}
                {item.customisations?.extras?.length>0&&<div style={{ fontSize:11, color:'#1A7A4A', marginTop:2 }}>➕ {item.customisations.extras.join(', ')}</div>}
                <div style={{ fontSize:13, color:'#1A7A4A', fontWeight:700, marginTop:6 }}>${item.price.toFixed(2)} each</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                <button onClick={()=>removeItem(item.cartId)} style={{ background:'#F3F7F4', color:'#1A2E1F', border:'1px solid #E5E7EB', width:32, height:32, borderRadius:8, fontSize:18, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>−</button>
                <span style={{ fontWeight:700, fontSize:16, minWidth:20, textAlign:'center', color:'#1A7A4A' }}>{item.qty}</span>
                <button onClick={()=>addItem({...item, id:item.baseId||item.id})} style={{ background:'#1A7A4A', color:'#fff', border:'none', width:32, height:32, borderRadius:8, fontSize:18, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>+</button>
                <div style={{ fontWeight:700, fontSize:16, color:'#F59E0B', minWidth:52, textAlign:'right' }}>${(item.price*item.qty).toFixed(2)}</div>
                <button onClick={()=>{ if(item.cartIds) item.cartIds.forEach(id=>deleteItem(id)); else deleteItem(item.cartId); }} style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:18, padding:4, cursor:'pointer' }}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drinks */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'16px', marginBottom:24 }}>
        <h3 style={{ fontSize:18, fontWeight:800, color:'#E8410A', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>🥤 Add a Drink?</h3>
        <p style={{ fontSize:12, color:'#7A9483', marginBottom:14 }}>Complete your meal with a cold drink</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8 }}>
          {drinks.map(drink=>{
            const drinkItems = cart.filter(c=>(c.baseId===drink.id||c.id===drink.id) && !c.customisations);
            const qty = drinkItems.reduce((s,c)=>s+c.qty,0);
            return (
              <div key={drink.id} style={{ background:qty>0?'rgba(26,122,74,0.06)':'#F8FAF8', border:`1px solid ${qty>0?'#1A7A4A':'#E5E7EB'}`, borderRadius:10, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all 0.2s' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#1A2E1F', marginBottom:2 }}>{drink.name}</div>
                  <div style={{ fontSize:12, color:'#1A7A4A', fontWeight:700 }}>${drink.price.toFixed(2)}</div>
                </div>
                {qty===0?(
                  <button onClick={()=>addItem(drink)} style={{ background:'#1A7A4A', color:'#fff', border:'none', width:28, height:28, borderRadius:6, fontSize:18, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>+</button>
                ):(
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <button onClick={()=>removeItem(drinkItems[drinkItems.length-1]?.cartId)} style={{ background:'#F3F7F4', color:'#1A2E1F', border:'1px solid #E5E7EB', width:24, height:24, borderRadius:4, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>−</button>
                    <span style={{ fontWeight:700, fontSize:14, color:'#1A7A4A', minWidth:16, textAlign:'center' }}>{qty}</span>
                    <button onClick={()=>addItem(drink)} style={{ background:'#1A7A4A', color:'#fff', border:'none', width:24, height:24, borderRadius:4, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'16px', marginBottom:24 }}>
        <h3 style={{ fontSize:18, fontWeight:800, marginBottom:14 }}>Order Summary</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#3D5944' }}><span>Subtotal ({itemCount} item{itemCount>1?'s':''})</span><span>${total.toFixed(2)}</span></div>
          {orderMode==='delivery'&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#3D5944' }}><span>Delivery fee</span><span>$5.00</span></div>}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:800, color:'#1A7A4A', paddingTop:10, borderTop:'1px solid #E5E7EB' }}><span>TOTAL</span><span>${grandTotal.toFixed(2)}</span></div>
        </div>
      </div>

      <button onClick={()=>navigate('/checkout')} style={{ width:'100%', background:'#1A7A4A', color:'#fff', border:'none', padding:'16px', borderRadius:12, fontSize:19, fontWeight:800, boxShadow:'0 6px 24px rgba(26,122,74,0.4)', cursor:'pointer' }}>
        PROCEED TO CHECKOUT — ${grandTotal.toFixed(2)}
      </button>
    </div>
  );
}
