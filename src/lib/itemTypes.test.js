import { calculateItemPrice, getItemTypeConfig } from './itemTypes';

describe('getItemTypeConfig', () => {
  test('returns correct config for hsp', () => {
    const config = getItemTypeConfig('hsp');
    expect(config.hasSize).toBe(true);
    expect(config.hasMeat).toBe(true);
    expect(config.hasSauces).toBe(true);
    expect(config.hasSalad).toBe(true);
  });

  test('returns correct config for skewer (no customisation)', () => {
    const config = getItemTypeConfig('skewer');
    expect(config.hasSize).toBe(false);
    expect(config.hasMeat).toBe(false);
    expect(config.hasSauces).toBe(false);
    expect(config.hasSalad).toBe(false);
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

  test('wrap with garlic sauce adds $3', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: false, selectedSauces: ['garlic'],
    })).toBe(15);
  });

  test('wrap with mayo adds $1', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: false, selectedSauces: ['mayo'],
    })).toBe(13);
  });

  test('wrap with garlic + chilli + extra meat = base + 3 + 3 + 2', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: true, selectedSauces: ['garlic', 'chilli'],
    })).toBe(20);
  });

  test('hsp medium adds $2 to base', () => {
    expect(calculateItemPrice(10, {
      itemType: 'hsp', selectedSize: 'M', hasExtraMeat: false, selectedSauces: [],
    })).toBe(12);
  });

  test('hsp xl adds $6 to base', () => {
    expect(calculateItemPrice(10, {
      itemType: 'hsp', selectedSize: 'XL', hasExtraMeat: false, selectedSauces: [],
    })).toBe(16);
  });

  test('chips small returns $5', () => {
    expect(calculateItemPrice(5, {
      itemType: 'snack', selectedSize: 'S', hasExtraMeat: false, selectedSauces: [], isChips: true,
    })).toBe(5);
  });

  test('chips large returns $9', () => {
    expect(calculateItemPrice(5, {
      itemType: 'snack', selectedSize: 'L', hasExtraMeat: false, selectedSauces: [], isChips: true,
    })).toBe(9);
  });

  test('skewer has no extras regardless of options passed', () => {
    expect(calculateItemPrice(10, {
      itemType: 'skewer', selectedSize: null, hasExtraMeat: false, selectedSauces: [],
    })).toBe(10);
  });
});
