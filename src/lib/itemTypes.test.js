import { calculateItemPrice, getItemTypeConfig } from './itemTypes';

describe('getItemTypeConfig', () => {
  test('returns correct config for hsp', () => {
    const config = getItemTypeConfig('hsp');
    expect(config.hasSize).toBe(true);
    expect(config.hasMeat).toBe(true);
    expect(config.hasSauces).toBe(true);
    expect(config.hasSalad).toBe(true);
  });

  test('returns correct config for skewer (has sauces + skew base)', () => {
    const config = getItemTypeConfig('skewer');
    expect(config.hasSize).toBe(false);
    expect(config.hasMeat).toBe(false);
    expect(config.hasSauces).toBe(true);
    expect(config.hasSalad).toBe(false);
    expect(config.hasSkewBase).toBe(true);
  });

  test('returns no-customisation fallback for unknown type', () => {
    const config = getItemTypeConfig('unknown');
    expect(config.hasSize).toBe(false);
  });
});

describe('calculateItemPrice', () => {
  test('wrap with no extras returns base price', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: false, selectedSauces: [],
    })).toBe(12);
  });

  test('wrap with extra meat adds $2', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: true, selectedSauces: [],
    })).toBe(14);
  });

  test('wrap with one sauce is free (first sauce always free)', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: false, selectedSauces: ['garlic'],
    })).toBe(12);
  });

  test('wrap with two sauces charges $2 for the second', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: false, selectedSauces: ['garlic', 'chilli'],
    })).toBe(14);
  });

  test('wrap with three sauces charges $4 (two paid sauces)', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: false, selectedSauces: ['garlic', 'chilli', 'mayo'],
    })).toBe(16);
  });

  test('wrap with two sauces + extra meat = base + 2 (sauce) + 2 (meat)', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: true, selectedSauces: ['garlic', 'chilli'],
    })).toBe(16);
  });

  test('hsp small uses sizePrices absolute value', () => {
    const item = { sizePrices: { S: 15, M: 20, L: 24, XL: 35 } };
    expect(calculateItemPrice(15, {
      itemType: 'hsp', item, selectedSize: 'S', hasExtraMeat: false, selectedSauces: [],
    })).toBe(15);
  });

  test('hsp medium uses sizePrices absolute value', () => {
    const item = { sizePrices: { S: 15, M: 20, L: 24, XL: 35 } };
    expect(calculateItemPrice(15, {
      itemType: 'hsp', item, selectedSize: 'M', hasExtraMeat: false, selectedSauces: [],
    })).toBe(20);
  });

  test('hsp xl uses sizePrices absolute value', () => {
    const item = { sizePrices: { S: 15, M: 20, L: 24, XL: 35 } };
    expect(calculateItemPrice(15, {
      itemType: 'hsp', item, selectedSize: 'XL', hasExtraMeat: false, selectedSauces: [],
    })).toBe(35);
  });

  test('chips small returns $5', () => {
    const item = { sizePrices: { S: 5, M: 7, L: 9, XL: 12 } };
    expect(calculateItemPrice(5, {
      itemType: 'chips', item, selectedSize: 'S', hasExtraMeat: false, selectedSauces: [],
    })).toBe(5);
  });

  test('chips large returns $9', () => {
    const item = { sizePrices: { S: 5, M: 7, L: 9, XL: 12 } };
    expect(calculateItemPrice(5, {
      itemType: 'chips', item, selectedSize: 'L', hasExtraMeat: false, selectedSauces: [],
    })).toBe(9);
  });

  test('bowl salad type uses saladPrice', () => {
    const item = { saladPrice: 15, ricePrice: 16 };
    expect(calculateItemPrice(15, {
      itemType: 'bowl', item, bowlType: 'salad', hasExtraMeat: false, selectedSauces: [],
    })).toBe(15);
  });

  test('bowl rice type uses ricePrice', () => {
    const item = { saladPrice: 15, ricePrice: 16 };
    expect(calculateItemPrice(15, {
      itemType: 'bowl', item, bowlType: 'rice', hasExtraMeat: false, selectedSauces: [],
    })).toBe(16);
  });

  test('skewer returns base price with no extras', () => {
    expect(calculateItemPrice(10, {
      itemType: 'skewer', selectedSize: null, hasExtraMeat: false, selectedSauces: [],
    })).toBe(10);
  });

  test('skewer with one sauce is free', () => {
    expect(calculateItemPrice(10, {
      itemType: 'skewer', selectedSize: null, hasExtraMeat: false, selectedSauces: ['garlic'],
    })).toBe(10);
  });
});
