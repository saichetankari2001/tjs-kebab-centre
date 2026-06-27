export const SALAD_OPTIONS = [
  { id: 'lettuce',    name: 'Lettuce' },
  { id: 'tomato',     name: 'Tomato' },
  { id: 'onion',      name: 'Onion' },
  { id: 'cheese',     name: 'Cheese' },
  { id: 'tabouli',    name: 'Tabouli' },
  { id: 'salad-mix',  name: 'Salad Mix' },
];

// Default salad for wraps (pre-selected)
export const DEFAULT_WRAP_SALADS = ['lettuce', 'tomato', 'onion'];

// First sauce FREE — additional sauces $2 each (see calculateItemPrice)
export const SAUCE_OPTIONS = [
  { id: 'garlic',       name: 'Garlic',       price: 0, popular: true, note: 'House-made ⭐' },
  { id: 'tomato',       name: 'Tomato',        price: 0 },
  { id: 'chilli',       name: 'Chilli',        price: 0 },
  { id: 'sweet-chilli', name: 'Sweet Chilli',  price: 0 },
  { id: 'mayo',         name: 'Mayo',          price: 0 },
  { id: 'chipotle',     name: 'Chipotle',      price: 0 },
  { id: 'bbq',          name: 'BBQ',           price: 0 },
];

export const EXTRA_MEAT_OPTIONS = [
  { id: 'chicken', name: 'Extra Chicken', price: 2 },
  { id: 'lamb',    name: 'Extra Lamb',    price: 2 },
];

// Keep EXTRAS_OPTIONS as alias so CustomiseModal.js doesn't break until it is updated
export const EXTRAS_OPTIONS = [];
