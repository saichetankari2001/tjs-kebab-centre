export const ITEM_TYPE_CONFIG = {
  // Kebab wraps — sauce + salad (default lettuce/tomato/onion) + extra meat
  wrap: {
    hasSize: false, hasMeat: true, hasSauces: true, hasSalad: true,
    hasBowlType: false, hasSkewBase: false,
  },
  // Signature bowls — rice or salad bowl choice + sauce
  bowl: {
    hasSize: false, hasMeat: false, hasSauces: true, hasSalad: false,
    hasBowlType: true, hasSkewBase: false,
  },
  // HSP — size (uses item.sizePrices) + extra meat + sauce + salad
  hsp: {
    hasSize: true, hasMeat: true, hasSauces: true, hasSalad: true,
    hasBowlType: false, hasSkewBase: false,
  },
  // Skewers — rice or salad base + sauce
  skewer: {
    hasSize: false, hasMeat: false, hasSauces: true, hasSalad: false,
    hasBowlType: false, hasSkewBase: true,
  },
  // Chips — size (uses item.sizePrices, isChips: true)
  chips: {
    hasSize: true, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false, isChips: true,
  },
  // Snacks (nuggets, tenders, combos) — no customisation
  snack: {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  },
  // Loaded upgrade — reg or large size (item.sizePrices)
  loaded: {
    hasSize: true, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  },
  // Dips — no customisation
  dip: {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  },
  // Drinks — no customisation
  drink: {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  },
};

export function getItemTypeConfig(itemType) {
  return ITEM_TYPE_CONFIG[itemType] ?? {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  };
}

// EXTRA_SAUCE_PRICE: charged per sauce beyond the first free one
export const EXTRA_SAUCE_PRICE = 2;
export const EXTRA_MEAT_PRICE  = 2;

// Keep legacy constants as aliases so ItemModal.js doesn't break until it is updated
export const HSP_SIZE_PRICES = { S: 0, M: 0, L: 0, XL: 0 };
export const CHIPS_SIZE_PRICES = { S: 5, M: 7, L: 9, XL: 12 };

/**
 * Calculate final unit price for an item.
 * @param {number} basePrice - item.price from Firestore
 * @param {{
 *   itemType: string,
 *   item: object,           // full Firestore item (for sizePrices, saladPrice, ricePrice)
 *   selectedSize: string,   // 'S'|'M'|'L'|'XL'|'Reg'|'Large' etc.
 *   bowlType: string,       // 'salad'|'rice'
 *   hasExtraMeat: boolean,
 *   selectedSauces: string[],
 * }} opts
 * @returns {number}
 */
export function calculateItemPrice(basePrice, opts = {}) {
  const { itemType, item = {}, selectedSize, bowlType, hasExtraMeat, selectedSauces = [] } = opts;
  let price = basePrice;

  // HSP: absolute price from sizePrices object
  if (itemType === 'hsp' && selectedSize && item.sizePrices) {
    price = item.sizePrices[selectedSize] ?? basePrice;
  }

  // Bowl: price depends on salad vs rice choice
  if (itemType === 'bowl') {
    price = bowlType === 'rice'
      ? (item.ricePrice ?? basePrice)
      : (item.saladPrice ?? basePrice);
  }

  // Chips: absolute price from sizePrices
  if (itemType === 'chips' && selectedSize && item.sizePrices) {
    price = item.sizePrices[selectedSize] ?? basePrice;
  }

  // Loaded upgrade: absolute price from sizePrices
  if (itemType === 'loaded' && selectedSize && item.sizePrices) {
    price = item.sizePrices[selectedSize] ?? basePrice;
  }

  // Extra meat
  if (hasExtraMeat) price += EXTRA_MEAT_PRICE;

  // Sauces: first is FREE, each additional costs EXTRA_SAUCE_PRICE ($2)
  const paidSauces = Math.max(0, selectedSauces.length - 1);
  price += paidSauces * EXTRA_SAUCE_PRICE;

  return price;
}
