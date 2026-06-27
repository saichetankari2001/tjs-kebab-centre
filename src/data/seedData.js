// Full TJ's Kebab Centre menu — use via AdminDashboard "Seed Database" button
// Each item needs: name, description, price, category, categoryId, categoryOrder, order, available, itemType
// Bowl items also need: saladPrice, ricePrice
// HSP items need: sizePrices { S, M, L, XL }
// Chips need: sizePrices { S, M, L, XL }, isChips: true, itemType: 'chips'
// Loaded upgrade needs: sizePrices { Reg, Large }, itemType: 'loaded'

export const SEED_MENU_V2 = [
  // ─── KEBAB WRAPS (categoryOrder: 1) ───
  { name: 'Original Kebab — Chicken', description: 'Tender chicken, fresh salad (lettuce, tomato, onion), your choice of sauce. Rolled in Turkish bread.', price: 16, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 1, available: true, itemType: 'wrap' },
  { name: 'Original Kebab — Lamb',    description: 'Seasoned lamb, fresh salad, your choice of sauce. Rolled in Turkish bread.',                           price: 18, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 2, available: true, itemType: 'wrap' },
  { name: 'Original Kebab — Mix',     description: 'Chicken and lamb mix, fresh salad, your choice of sauce. Rolled in Turkish bread.',                    price: 18, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 3, available: true, itemType: 'wrap' },
  { name: 'Chargrilled Kebab — Chicken', description: 'Chargrilled chicken skewer meat, fresh salad, your choice of sauce. Rolled in Turkish bread.',      price: 18, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 4, available: true, itemType: 'wrap' },
  { name: 'Chargrilled Kebab — Lamb',    description: 'Chargrilled lamb skewer meat, fresh salad, your choice of sauce. Rolled in Turkish bread.',         price: 20, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 5, available: true, itemType: 'wrap' },
  { name: 'Chargrilled Kebab — Mix',     description: 'Chargrilled chicken and lamb mix, fresh salad, your choice of sauce. Rolled in Turkish bread.',     price: 20, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 6, available: true, itemType: 'wrap' },
  { name: 'Falafel OG Wrap',   description: 'Crispy homemade falafel, fresh salad, tahini and your choice of sauce in Turkish bread.',                     price: 16, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 7, available: true, itemType: 'wrap' },
  { name: 'Falafel Garden',    description: 'Loaded falafel wrap with garden salad, hummus, tabouli and house garlic sauce.',                              price: 18, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 8, available: true, itemType: 'wrap' },

  // ─── SIGNATURE BOWLS (categoryOrder: 2) ───
  // price = saladPrice (displayed base), ricePrice = salad + $1
  { name: 'Chicken Bowl',            description: 'Seasoned chicken over your choice of salad or rice.',                   price: 15, saladPrice: 15, ricePrice: 16, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 1, available: true, itemType: 'bowl' },
  { name: 'Lamb Bowl',               description: 'Seasoned lamb over your choice of salad or rice.',                     price: 16, saladPrice: 16, ricePrice: 17, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 2, available: true, itemType: 'bowl' },
  { name: 'Mix Bowl',                description: 'Chicken and lamb mix over your choice of salad or rice.',               price: 16, saladPrice: 16, ricePrice: 17, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 3, available: true, itemType: 'bowl' },
  { name: 'Chargrilled Chicken Bowl',description: 'Chargrilled chicken skewer over your choice of salad or rice.',        price: 16, saladPrice: 16, ricePrice: 17, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 4, available: true, itemType: 'bowl' },
  { name: 'Chargrilled Lamb Bowl',   description: 'Chargrilled lamb skewer over your choice of salad or rice.',           price: 17, saladPrice: 17, ricePrice: 18, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 5, available: true, itemType: 'bowl' },
  { name: 'The Special Bowl',        description: "Our chef's special selection — chargrilled mix over salad or rice.",   price: 23, saladPrice: 23, ricePrice: 24, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 6, available: true, itemType: 'bowl' },

  // ─── HSP (categoryOrder: 3) ───
  // sizePrices are absolute prices per size
  { name: 'Chicken HSP', description: 'Halal snack pack — chips, chicken doner, cheese, garlic sauce and chilli. Choose your size.', price: 15, sizePrices: { S: 15, M: 20, L: 24, XL: 35 }, category: 'HSP', categoryId: 'hsp', categoryOrder: 3, order: 1, available: true, itemType: 'hsp' },
  { name: 'Lamb HSP',    description: 'Halal snack pack — chips, lamb doner, cheese, garlic sauce and chilli. Choose your size.',   price: 16, sizePrices: { S: 16, M: 22, L: 27, XL: 40 }, category: 'HSP', categoryId: 'hsp', categoryOrder: 3, order: 2, available: true, itemType: 'hsp' },
  { name: 'Mixed HSP',   description: 'Halal snack pack — chips, chicken and lamb mix, cheese, garlic sauce and chilli.',          price: 16, sizePrices: { S: 16, M: 22, L: 27, XL: 40 }, category: 'HSP', categoryId: 'hsp', categoryOrder: 3, order: 3, available: true, itemType: 'hsp' },

  // ─── SKEWERS (categoryOrder: 4) ───
  { name: 'Chargrilled Chicken Skewer', description: 'Chargrilled chicken skewer served with your choice of rice or salad.', price: 10, category: 'Skewers', categoryId: 'skewers', categoryOrder: 4, order: 1, available: true, itemType: 'skewer' },
  { name: 'Lamb Skewer',                description: 'Chargrilled lamb skewer served with your choice of rice or salad.',    price: 12, category: 'Skewers', categoryId: 'skewers', categoryOrder: 4, order: 2, available: true, itemType: 'skewer' },

  // ─── CHIPS (categoryOrder: 5) ───
  { name: 'Chips', description: 'Golden hot chips. Choose your size.', price: 5, sizePrices: { S: 5, M: 7, L: 9, XL: 12 }, isChips: true, category: 'Chips', categoryId: 'chips', categoryOrder: 5, order: 1, available: true, itemType: 'chips' },

  // ─── SNACKS (categoryOrder: 6) ───
  { name: 'Nuggets',                 description: '8 piece crispy chicken nuggets.',                              price: 8,  category: 'Snacks', categoryId: 'snacks', categoryOrder: 6, order: 1, available: true, itemType: 'snack' },
  { name: 'Chicken Tenders',         description: '4 piece crispy chicken tenders.',                             price: 8,  category: 'Snacks', categoryId: 'snacks', categoryOrder: 6, order: 2, available: true, itemType: 'snack' },
  { name: 'Chips & Nuggets',         description: 'Large chips plus 8 piece nuggets. Great value combo.',        price: 15, category: 'Snacks', categoryId: 'snacks', categoryOrder: 6, order: 3, available: true, itemType: 'snack' },
  { name: 'Chips & Chicken Tenders', description: 'Large chips plus 4 piece chicken tenders. Great value combo.',price: 15, category: 'Snacks', categoryId: 'snacks', categoryOrder: 6, order: 4, available: true, itemType: 'snack' },

  // ─── LOADED UPGRADE (categoryOrder: 7) ───
  { name: 'The Loaded Upgrade', description: 'Hot, crunchy golden chips and a can drink. Regular or large size.', price: 7, sizePrices: { Reg: 7, Large: 9 }, category: 'Loaded Upgrade', categoryId: 'loaded', categoryOrder: 7, order: 1, available: true, itemType: 'loaded' },

  // ─── HOMEMADE DIPS (categoryOrder: 8) ───
  { name: 'Chilli Dip',   description: 'House-made spicy chilli dip.',  price: 2, category: 'Homemade Dips', categoryId: 'dips', categoryOrder: 8, order: 1, available: true, itemType: 'dip' },
  { name: 'Tzatziki Dip', description: 'Classic creamy tzatziki dip.', price: 2, category: 'Homemade Dips', categoryId: 'dips', categoryOrder: 8, order: 2, available: true, itemType: 'dip' },
];

export const SEED_DRINKS_V2 = [
  { name: 'Can',            description: '375ml soft drink can.',    price: 3, order: 1, available: true },
  { name: 'Regular Bottle', description: '600ml bottle.',            price: 5, order: 2, available: true },
  { name: 'Large Bottle',   description: '1.25L bottle.',            price: 7, order: 3, available: true },
];

// Keep old exports as aliases so AdminDashboard doesn't break until Plan 4 updates it
export const SEED_MENU   = SEED_MENU_V2;
export const SEED_DRINKS = SEED_DRINKS_V2;
