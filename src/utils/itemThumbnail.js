const U = (id, w = 320) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${w}&q=80`;

const LOCAL = {
  hsp:           '/images/HSP.jpg',
  chickenWrap:   '/images/chicken-doner-kebab.jpg',
  lambWrap:      '/images/Lamb-Kebab.jpg',
  mixedKebab:    '/images/Mixed-kebab.jpg',
  chickenSkewer: '/images/Chargrilled-ChickenSkewer.jpg',
  lambSkewer:    '/images/Chargrilled-LambSkewer.jpg',
  riceBowl:      '/images/RiceBowl.jpg',
  saladBowl:     '/images/SalaBowl.jpg',
  tabouli:       '/images/Tabouli.jpg',
  dip:           '/images/tzatziki.jpg',
  // Drinks
  coke:          '/images/coke 375ml.jpg',
  cokeZero:      '/images/Coke ZeroSugar 600ml.jpg',
  cokeDiet:      '/images/Coke diet.jpg',
  cokeClassic:   '/images/Coke Classic1.25L.jpg',
  sprite:        '/images/Sprite1.25l.jpg',
  fanta:         '/images/Fanta 600ml.jpg',
  pepsiMax:      '/images/Pepsi Max.jpg',
  solo:          '/images/Solo 375ml.jpg',
  sunkist:       '/images/Sunkist 375ml.jpg',
  schweppes:     '/images/Schweppes.jpg',
  redBull:       '/images/RedBull.jpg',
  water:         '/images/Water 600ml.jpg',
  sparklingWater:'/images/Sparkling Water.jpg',
};

const REMOTE = {
  chips:   U('photo-1573080496219-bb080dd4f877'),
  nuggets: U('photo-1562967914-608f82629710'),
  tenders: U('photo-1585109649139-366815a0d713'),
  falafel: U('photo-1547592180-85f173990554'),
};

function getDrinkPhoto(name) {
  const n = name.toLowerCase();
  if (n.includes('sparkling'))                         return LOCAL.sparklingWater;
  if (n.includes('water'))                             return LOCAL.water;
  if (n.includes('red bull') || n.includes('redbull')) return LOCAL.redBull;
  if (n.includes('schweppes'))                         return LOCAL.schweppes;
  if (n.includes('sunkist'))                           return LOCAL.sunkist;
  if (n.includes('solo'))                              return LOCAL.solo;
  if (n.includes('fanta'))                             return LOCAL.fanta;
  if (n.includes('sprite'))                            return LOCAL.sprite;
  if (n.includes('pepsi'))                             return LOCAL.pepsiMax;
  if (n.includes('zero') || n.includes('zero sugar'))  return LOCAL.cokeZero;
  if (n.includes('diet'))                              return LOCAL.cokeDiet;
  if (n.includes('1.25') || n.includes('large'))       return LOCAL.cokeClassic;
  if (n.includes('coke') || n.includes('cola') || n.includes('coca')) return LOCAL.coke;
  return LOCAL.coke;
}

export function getItemThumbnail(item) {
  const name = (item.name || '').toLowerCase();
  const type = (item.itemType || '').toLowerCase();

  if (type === 'drink' || type === 'drinks' ||
      name.includes('drink') || name.includes('coke') || name.includes('cola') ||
      name.includes('sprite') || name.includes('fanta') || name.includes('pepsi') ||
      name.includes('water') || name.includes('juice') || name.includes('red bull') ||
      name.includes('schweppes') || name.includes('sunkist') || name.includes('solo') ||
      name.includes('redbull') || name.includes('soft drink') || name.includes('sparkling'))
    return getDrinkPhoto(item.name || '');

  if (type === 'hsp' || name.includes('hsp') || name.includes('halal snack'))
    return LOCAL.hsp;

  if (type === 'skewer' || name.includes('skewer'))
    return name.includes('lamb') ? LOCAL.lambSkewer : LOCAL.chickenSkewer;

  if (name.includes('chargrilled') && name.includes('lamb'))    return LOCAL.lambSkewer;
  if (name.includes('chargrilled') && name.includes('chicken')) return LOCAL.chickenSkewer;

  if (name.includes('bowl') && name.includes('salad')) return LOCAL.saladBowl;
  if (name.includes('bowl'))                            return LOCAL.riceBowl;

  if (name.includes('tabouli') || name.includes('tabbouleh')) return LOCAL.tabouli;

  if ((name.includes('lamb') || name.includes('beef')) && (name.includes('wrap') || type === 'wrap'))
    return LOCAL.lambWrap;
  if (name.includes('mix') && (name.includes('wrap') || type === 'wrap'))
    return LOCAL.mixedKebab;
  if (name.includes('chicken') && (name.includes('wrap') || type === 'wrap'))
    return LOCAL.chickenWrap;
  if (type === 'wrap' || name.includes('wrap'))
    return LOCAL.chickenWrap;

  if (name.includes('falafel'))   return REMOTE.falafel;
  if (name.includes('chicken'))   return LOCAL.chickenSkewer;
  if (name.includes('lamb'))      return LOCAL.lambWrap;
  if (name.includes('mix'))       return LOCAL.mixedKebab;

  if (name.includes('loaded') || type === 'loaded') return REMOTE.chips;
  if (type === 'chips' || name.includes('chip'))    return REMOTE.chips;
  if (name.includes('nugget'))                      return REMOTE.nuggets;
  if (name.includes('tender'))                      return REMOTE.tenders;

  if (name.includes('tzatziki') || name.includes('garlic') || name.includes('chilli') || name.includes('sauce'))
    return LOCAL.dip;
  if (type === 'dip' || name.includes('dip')) return LOCAL.dip;

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
  if (n.includes('loaded'))                            return REMOTE.chips;
  if (n.includes('chip'))                              return REMOTE.chips;
  if (n.includes('snack') || n.includes('nugget'))    return REMOTE.nuggets;
  if (n.includes('drink') || n.includes('beverage') || n.includes('cool')) return LOCAL.coke;
  if (n.includes('falafel'))                           return REMOTE.falafel;
  if (n.includes('signature'))                         return LOCAL.riceBowl;
  return firestorePhoto || LOCAL.riceBowl;
}
