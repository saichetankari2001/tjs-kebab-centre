// Controls which customisation sections appear in ItemModal per item type
export const ITEM_TYPE_CONFIG = {
  wrap:        { hasSize: false, hasMeat: true,  hasSauces: true,  hasSalad: true  },
  hsp:         { hasSize: true,  hasMeat: true,  hasSauces: true,  hasSalad: true  },
  ricebowl:    { hasSize: false, hasMeat: true,  hasSauces: true,  hasSalad: true  },
  salad:       { hasSize: false, hasMeat: true,  hasSauces: true,  hasSalad: true  },
  chargrilled: { hasSize: false, hasMeat: true, hasSauces: true, hasSalad: true },
  skewer:      { hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false },
  snack:       { hasSize: true,  hasMeat: false, hasSauces: false, hasSalad: false },
  drink:       { hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false },
};

// HSP size price overrides (base price from Firestore is the Small price)
export const HSP_SIZE_PRICES = {
  S: 0, M: 2, L: 4, XL: 6,
};

// Chips size prices (absolute, not relative)
export const CHIPS_SIZE_PRICES = {
  S: 5, M: 7, L: 9, XL: 12,
};

export const SAUCE_PRICES = {
  garlic: 3, chilli: 3,
  mayo: 1, 'tomato-sauce': 1, 'sweet-chilli': 1, bbq: 1, tzaziki: 1, chipotle: 1,
};

export const EXTRA_MEAT_PRICE = 2;

/**
 * Returns the ITEM_TYPE_CONFIG entry for a given itemType.
 * Falls back to no-customisation config if unknown.
 */
export function getItemTypeConfig(itemType) {
  return ITEM_TYPE_CONFIG[itemType] ?? {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
  };
}

/**
 * Calculates the final price for an item given its base price and selections.
 *
 * @param {number} basePrice - Item's base price from Firestore
 * @param {{
 *   itemType: string,
 *   selectedSize: string|null,      // 'S'|'M'|'L'|'XL'|null
 *   hasExtraMeat: boolean,
 *   selectedSauces: string[],       // array of sauce ids
 * }} options
 * @returns {number} final price
 */
export function calculateItemPrice(basePrice, options) {
  const { itemType, selectedSize, hasExtraMeat, selectedSauces = [] } = options;

  let price = basePrice;

  if (itemType === 'hsp' && selectedSize) {
    price += HSP_SIZE_PRICES[selectedSize] ?? 0;
  }

  if (itemType === 'snack' && selectedSize && options.isChips) {
    price = CHIPS_SIZE_PRICES[selectedSize] ?? basePrice;
  }

  if (hasExtraMeat) {
    price += EXTRA_MEAT_PRICE;
  }

  for (const sauceId of selectedSauces) {
    price += SAUCE_PRICES[sauceId] ?? 1;
  }

  return price;
}
