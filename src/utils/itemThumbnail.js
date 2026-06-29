// Food thumbnails — local uploads first, Unsplash fallback for items without a photo
const U = (id, w = 320) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${w}&q=80`;

// Local uploaded photos
const LOCAL = {
  hsp:            '/images/HSP.jpg',
  chickenWrap:    '/images/chicken-doner-kebab.jpg',
  lambWrap:       '/images/Lamb-Kebab.jpg',
  mixedKebab:     '/images/Mixed-kebab.jpg',
  chickenSkewer:  '/images/Chargrilled-ChickenSkewer.jpg',
  lambSkewer:     '/images/Chargrilled-LambSkewer.jpg',
  riceBowl:       '/images/RiceBowl.jpg',
  saladBowl:      '/images/SalaBowl.jpg',
  tabouli:        '/images/Tabouli.jpg',
  dip:            '/images/tzatziki.jpg',
};

// Unsplash fallbacks for items without local photos
const REMOTE = {
  chips:   U('photo-1573080496219-bb080dd4f877'),
  loaded:  U('photo-1551024601-bec78aea704b'),
  nuggets: U('photo-1562967914-608f82629710'),
  tenders: U('photo-1585109649139-366815a0d713'),
  falafel: U('photo-1547592180-85f173990554'),
  drink:   U('photo-1544145945-f90425340c7e'),
};

export function getItemThumbnail(item) {
  const name = (item.name || '').toLowerCase();
  const type = (item.itemType || '').toLowerCase();

  if (type === 'hsp' || name.includes('hsp') || name.includes('halal snack'))
    return LOCAL.hsp;

  if (type === 'skewer' || name.includes('skewer')) {
    return name.includes('lamb') ? LOCAL.lambSkewer : LOCAL.chickenSkewer;
  }

  if (name.includes('chargrilled') && name.includes('lamb'))    return LOCAL.lambSkewer;
  if (name.includes('chargrilled') && name.includes('chicken')) return LOCAL.chickenSkewer;

  if (name.includes('bowl') && name.includes('salad'))  return LOCAL.saladBowl;
  if (name.includes('bowl'))                             return LOCAL.riceBowl;

  if (name.includes('tabouli') || name.includes('tabbouleh')) return LOCAL.tabouli;

  if ((name.includes('lamb') || name.includes('beef')) && (name.includes('wrap') || type === 'wrap'))
    return LOCAL.lambWrap;
  if (name.includes('mix') && (name.includes('wrap') || type === 'wrap'))
    return LOCAL.mixedKebab;
  if (name.includes('chicken') && (name.includes('wrap') || type === 'wrap'))
    return LOCAL.chickenWrap;
  if (type === 'wrap' || name.includes('wrap'))
    return LOCAL.chickenWrap;

  if (name.includes('falafel')) return REMOTE.falafel;

  if (name.includes('chicken')) return LOCAL.chickenSkewer;
  if (name.includes('lamb'))    return LOCAL.lambWrap;
  if (name.includes('mix'))     return LOCAL.mixedKebab;

  if (name.includes('loaded') || type === 'loaded') return REMOTE.loaded;
  if (type === 'chips' || name.includes('chip'))    return REMOTE.chips;
  if (name.includes('nugget'))                      return REMOTE.nuggets;
  if (name.includes('tender'))                      return REMOTE.tenders;

  if (name.includes('tzatziki') || name.includes('garlic') || name.includes('chilli') || name.includes('sauce'))
    return LOCAL.dip;
  if (type === 'dip' || name.includes('dip')) return LOCAL.dip;

  if (type === 'drink' || name.includes('drink') || name.includes('water') || name.includes('juice') || name.includes('soft'))
    return REMOTE.drink;

  return REMOTE.chips;
}

export function getCategoryPhoto(categoryName, firestorePhoto) {
  const n = (categoryName || '').toLowerCase();
  if (n.includes('wrap'))                              return LOCAL.chickenWrap;
  if (n.includes('hsp') || n.includes('halal snack')) return LOCAL.hsp;
  if (n.includes('bowl'))                              return LOCAL.riceBowl;
  if (n.includes('dip') || n.includes('sauce'))       return LOCAL.dip;
  if (n.includes('skewer'))                            return LOCAL.chickenSkewer;
  if (n.includes('chicken'))                           return LOCAL.chickenSkewer;
  if (n.includes('lamb'))                              return LOCAL.lambSkewer;
  if (n.includes('salad'))                             return LOCAL.saladBowl;
  if (n.includes('loaded'))                            return REMOTE.loaded;
  if (n.includes('chip'))                              return REMOTE.chips;
  if (n.includes('snack') || n.includes('nugget'))    return REMOTE.nuggets;
  if (n.includes('drink') || n.includes('beverage'))  return REMOTE.drink;
  if (n.includes('falafel'))                           return REMOTE.falafel;
  if (n.includes('signature'))                         return LOCAL.riceBowl;
  return firestorePhoto || LOCAL.riceBowl;
}
