// Unsplash-first thumbnails — replace IMG.* constants with LOCAL('/images/file.jpg') once photos are in public/images/
const U = (id, w = 320) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${w}&q=80`;

// Confirmed-working Unsplash IDs for each food type
const IMG = {
  wrap:    U('photo-1599487489082-78e929282ae0'),
  hsp:     U('photo-1568901346375-23c9450c58cd'),
  chicken: U('photo-1598103442097-8b74394b95c3'),
  lamb:    U('photo-1544025162-d76538485696'),
  bowl:    U('photo-1512621776951-a57141f2eefd'),
  chips:   U('photo-1573080496219-bb080dd4f877'),
  loaded:  U('photo-1551024601-bec78aea704b'),
  nuggets: U('photo-1562967914-608f82629710'),
  tenders: U('photo-1585109649139-366815a0d713'),
  falafel: U('photo-1547592180-85f173990554'),
  sauce:   U('photo-1534353436294-0dbd4bdac845'),
  drink:   U('photo-1544145945-f90425340c7e'),
  salad:   U('photo-1512621776951-a57141f2eefd'),
};

// Once photos are in public/images/, swap these to LOCAL('filename.jpg')
const LOCAL_WRAP_CHICKEN = IMG.wrap;
const LOCAL_WRAP_LAMB    = IMG.lamb;
const LOCAL_WRAP_BEEF    = IMG.wrap;
const LOCAL_CHICKEN      = IMG.chicken;
const LOCAL_GRILL        = IMG.lamb;
const LOCAL_HSP          = IMG.hsp;
const LOCAL_BOWL_RICE    = IMG.bowl;
const LOCAL_BOWL_SALAD   = IMG.salad;
const LOCAL_SAUCE        = IMG.sauce;

export function getItemThumbnail(item) {
  const name = (item.name || '').toLowerCase();
  const type = (item.itemType || '').toLowerCase();

  if (type === 'hsp')                                               return LOCAL_HSP;

  if (type === 'skewer' || name.includes('skewer')) {
    if (name.includes('lamb'))  return LOCAL_GRILL;
    return LOCAL_CHICKEN;
  }

  if (name.includes('chargrilled') && name.includes('chicken')) return LOCAL_CHICKEN;
  if (name.includes('chargrilled') && name.includes('lamb'))    return LOCAL_GRILL;

  if (name.includes('bowl') && name.includes('rice'))   return LOCAL_BOWL_RICE;
  if (name.includes('bowl') && name.includes('salad'))  return LOCAL_BOWL_SALAD;
  if (name.includes('bowl'))                            return LOCAL_BOWL_RICE;

  if (name.includes('lamb')    && (name.includes('wrap') || type === 'wrap')) return LOCAL_WRAP_LAMB;
  if (name.includes('chicken') && (name.includes('wrap') || type === 'wrap')) return LOCAL_WRAP_CHICKEN;
  if (name.includes('mix')     && (name.includes('wrap') || type === 'wrap')) return LOCAL_WRAP_CHICKEN;
  if (name.includes('beef')    && (name.includes('wrap') || type === 'wrap')) return LOCAL_WRAP_BEEF;
  if (type === 'wrap' || name.includes('wrap'))                               return LOCAL_WRAP_CHICKEN;

  if (name.includes('falafel garden')) return IMG.falafel;
  if (name.includes('falafel'))        return IMG.falafel;

  if (name.includes('chicken')) return LOCAL_CHICKEN;
  if (name.includes('lamb'))    return LOCAL_WRAP_LAMB;
  if (name.includes('mix'))     return LOCAL_WRAP_CHICKEN;

  if (name.includes('loaded') || type === 'loaded') return IMG.loaded;
  if (type === 'chips')                             return IMG.chips;
  if (name.includes('chip'))                        return IMG.chips;
  if (name.includes('nugget'))                      return IMG.nuggets;
  if (name.includes('tender'))                      return IMG.tenders;

  if (name.includes('tzatziki') || name.includes('garlic')) return LOCAL_SAUCE;
  if (type === 'dip')                                        return LOCAL_SAUCE;

  if (type === 'drink') return IMG.drink;

  return IMG.chips; // last-resort so something always shows
}

export function getCategoryPhoto(categoryName, firestorePhoto) {
  const n = (categoryName || '').toLowerCase();
  if (n.includes('wrap'))                           return LOCAL_WRAP_CHICKEN;
  if (n.includes('chicken'))                        return LOCAL_CHICKEN;
  if (n.includes('lamb'))                           return LOCAL_WRAP_LAMB;
  if (n.includes('hsp') || n.includes('halal snack')) return LOCAL_HSP;
  if (n.includes('bowl'))                           return LOCAL_BOWL_RICE;
  if (n.includes('salad'))                          return LOCAL_BOWL_SALAD;
  if (n.includes('dip') || n.includes('sauce'))    return LOCAL_SAUCE;
  if (n.includes('loaded'))                         return IMG.loaded;
  if (n.includes('chip'))                           return IMG.chips;
  if (n.includes('snack') || n.includes('nugget')) return IMG.nuggets;
  if (n.includes('drink') || n.includes('beverage')) return IMG.drink;
  if (n.includes('falafel'))                        return IMG.falafel;
  if (n.includes('skewer'))                         return IMG.chicken;
  if (n.includes('signature'))                      return IMG.chicken; // "Signature Bowls" fallback
  // Only fall back to Firestore URL if we have nothing better
  return firestorePhoto || IMG.bowl;
}
