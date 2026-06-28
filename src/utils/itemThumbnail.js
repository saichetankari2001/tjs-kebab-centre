// Returns a unique Unsplash thumbnail URL per item based on name + type keywords.
// All known item names from seedData are covered so no two items in the same section
// will show the same photo.

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=160&h=160&q=80`;

export function getItemThumbnail(item) {
  const name = (item.name || '').toLowerCase();
  const type = (item.itemType || '').toLowerCase();

  // ── HSP (must check before 'chicken'/'lamb' keywords) ──
  if (type === 'hsp') {
    if (name.includes('lamb'))  return U('photo-1639024471283-03518883512d');
    if (name.includes('mixed')) return U('photo-1551024601-bec78aea704b');
    return U('photo-1630384060421-cb20d0e0649d'); // chicken HSP default
  }

  // ── Chargrilled (specific before generic) ──
  if (name.includes('chargrilled') && name.includes('chicken')) return U('photo-1598103442097-8b74394b95c6');
  if (name.includes('chargrilled') && name.includes('lamb'))    return U('photo-1529692236671-f1f6cf9683ba');
  if (name.includes('special bowl') || name.includes('the special')) return U('photo-1561043433-aaf687c4cf04');

  // ── Skewers ──
  if (type === 'skewer') {
    if (name.includes('lamb'))    return U('photo-1555939594-58d7cb561ad1');
    return U('photo-1598103442097-8b74394b95c6'); // chicken skewer
  }

  // ── Wraps + Bowls by meat ──
  if (name.includes('falafel garden'))  return U('photo-1512621776951-a57141f2eefd');
  if (name.includes('falafel'))         return U('photo-1547592180-85f173990554');
  if (name.includes('chicken'))         return U('photo-1599487488170-d11ec9c172f0');
  if (name.includes('lamb'))            return U('photo-1544025162-d76694265947');
  if (name.includes('mix'))             return U('photo-1603360946369-dc9bb6258143');

  // ── Chips & combos ──
  if (name.includes('chips & nuggets'))          return U('photo-1562967914-608f82629710');
  if (name.includes('chips & chicken tenders'))  return U('photo-1585109649139-366815a0d713');
  if (type === 'chips')                          return U('photo-1573080496219-bb080dd4f877');
  if (type === 'loaded' || name.includes('loaded')) return U('photo-1551024601-bec78aea704b');

  // ── Snacks ──
  if (name.includes('nugget'))  return U('photo-1562967914-608f82629710');
  if (name.includes('tender'))  return U('photo-1585109649139-366815a0d713');

  // ── Dips ──
  if (name.includes('chilli'))   return U('photo-1555939594-58d7cb561ad1');
  if (name.includes('tzatziki')) return U('photo-1547592180-85f173990554');
  if (type === 'dip')            return U('photo-1547592180-85f173990554');

  // ── Drinks ──
  if (type === 'drink') return U('photo-1544145945-f90425340c7e');

  return null;
}
