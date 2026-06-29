// Maps menu items to local photos the user added to public/images/
// Falls back to Unsplash if file isn't there yet.

const LOCAL = (f) => `/images/${f}`;
const U     = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=160&h=160&q=80`;

export function getItemThumbnail(item) {
  const name = (item.name || '').toLowerCase();
  const type = (item.itemType || '').toLowerCase();

  // ── HSP ──
  if (type === 'hsp') return LOCAL('hsp-box.jpg');

  // ── Skewers (before generic chicken/lamb) ──
  if (type === 'skewer' || name.includes('skewer')) {
    if (name.includes('lamb')) return LOCAL('chicken-grill.jpg');   // grill shot
    return LOCAL('chicken-skewers.jpg');                             // plate shot
  }

  // ── Chargrilled ──
  if (name.includes('chargrilled') && name.includes('chicken')) return LOCAL('chicken-skewers.jpg');
  if (name.includes('chargrilled') && name.includes('lamb'))    return LOCAL('chicken-grill.jpg');

  // ── Bowls ──
  if (name.includes('bowl') && name.includes('rice'))   return LOCAL('bowl-rice.jpg');
  if (name.includes('bowl') && name.includes('salad'))  return LOCAL('bowl-salad.jpg');
  if (name.includes('bowl'))                            return LOCAL('bowl-rice.jpg');

  // ── Wraps by meat ──
  if (name.includes('lamb')    && (name.includes('wrap') || type === 'wrap')) return LOCAL('wrap-lamb.jpg');
  if (name.includes('chicken') && (name.includes('wrap') || type === 'wrap')) return LOCAL('wrap-chicken.jpg');
  if (name.includes('mix')     && (name.includes('wrap') || type === 'wrap')) return LOCAL('wrap-chicken.jpg');
  if (name.includes('beef')    && (name.includes('wrap') || type === 'wrap')) return LOCAL('wrap-beef.jpg');
  if (type === 'wrap' || name.includes('wrap'))                               return LOCAL('wrap-chicken.jpg');

  // ── Falafel ──
  if (name.includes('falafel garden')) return U('photo-1512621776951-a57141f2eefd');
  if (name.includes('falafel'))        return U('photo-1547592180-85f173990554');

  // ── Generic meat ──
  if (name.includes('chicken')) return LOCAL('chicken-skewers.jpg');
  if (name.includes('lamb'))    return LOCAL('wrap-lamb.jpg');
  if (name.includes('mix'))     return LOCAL('wrap-chicken.jpg');

  // ── Chips ──
  if (name.includes('chips') && name.includes('nugget'))   return U('photo-1562967914-608f82629710');
  if (name.includes('chips') && name.includes('tender'))   return U('photo-1585109649139-366815a0d713');
  if (type === 'chips')                                     return U('photo-1573080496219-bb080dd4f877');
  if (type === 'loaded' || name.includes('loaded'))         return U('photo-1551024601-bec78aea704b');

  // ── Snacks ──
  if (name.includes('nugget')) return U('photo-1562967914-608f82629710');
  if (name.includes('tender')) return U('photo-1585109649139-366815a0d713');

  // ── Dips / Sauces ──
  if (name.includes('tzatziki') || name.includes('garlic')) return LOCAL('sauce-garlic.jpg');
  if (type === 'dip')                                        return LOCAL('sauce-garlic.jpg');

  // ── Drinks ──
  if (type === 'drink') return U('photo-1544145945-f90425340c7e');

  return null;
}

// Maps a category name to a hero photo for section headers
export function getCategoryPhoto(categoryName, firestorePhoto) {
  const n = (categoryName || '').toLowerCase();
  if (n.includes('wrap'))    return LOCAL('wrap-chicken.jpg');
  if (n.includes('chicken')) return LOCAL('chicken-skewers.jpg');
  if (n.includes('lamb'))    return LOCAL('wrap-lamb.jpg');
  if (n.includes('hsp') || n.includes('halal snack')) return LOCAL('hsp-box.jpg');
  if (n.includes('bowl'))    return LOCAL('bowl-rice.jpg');
  if (n.includes('salad'))   return LOCAL('bowl-salad.jpg');
  if (n.includes('dip') || n.includes('sauce')) return LOCAL('sauce-garlic.jpg');
  return firestorePhoto; // fallback to Firestore URL
}
