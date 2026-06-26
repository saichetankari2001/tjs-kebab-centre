import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { getItemTypeConfig, calculateItemPrice, HSP_SIZE_PRICES, CHIPS_SIZE_PRICES } from '../lib/itemTypes';
import { SALAD_OPTIONS, EXTRA_MEAT_OPTIONS } from '../data/options';

const SAUCE_DISPLAY = [
  { id: 'garlic',       name: 'Garlic',       price: 3, popular: true },
  { id: 'chilli',       name: 'Chilli',       price: 3, popular: true },
  { id: 'mayo',         name: 'Mayo',         price: 1 },
  { id: 'tomato-sauce', name: 'Tomato',       price: 1 },
  { id: 'sweet-chilli', name: 'Sweet Chilli', price: 1 },
  { id: 'bbq',          name: 'BBQ',          price: 1 },
  { id: 'tzaziki',      name: 'Tzaziki',      price: 1 },
];

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL'];
const SIZE_LABELS = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra Large' };

export default function ItemModal({ item, isOpen, onClose }) {
  const { addItem } = useCart();
  const config = item ? getItemTypeConfig(item.itemType) : {};

  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('S');
  const [hasExtraMeat, setHasExtraMeat] = useState(false);
  const [extraMeatType, setExtraMeatType] = useState('lamb');
  const [selectedSauces, setSelectedSauces] = useState([]);
  const [selectedSalads, setSelectedSalads] = useState(
    SALAD_OPTIONS.map(s => s.id)
  );
  const [specialNote, setSpecialNote] = useState('');

  // Reset state when a different item opens
  useEffect(() => {
    if (isOpen) {
      setQty(1);
      setSelectedSize('S');
      setHasExtraMeat(false);
      setExtraMeatType('lamb');
      setSelectedSauces([]);
      setSelectedSalads(SALAD_OPTIONS.map(s => s.id));
      setSpecialNote('');
    }
  }, [isOpen, item?.id]);

  if (!item) return null;

  const unitPrice = calculateItemPrice(item.price, {
    itemType: item.itemType,
    selectedSize,
    hasExtraMeat,
    selectedSauces,
    isChips: item.isChips,
  });

  const totalPrice = unitPrice * qty;

  const toggleSauce = (id) => {
    setSelectedSauces(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSalad = (id) => {
    setSelectedSalads(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    const sauceName = id => SAUCE_DISPLAY.find(s => s.id === id)?.name ?? id;
    const saladName = id => SALAD_OPTIONS.find(s => s.id === id)?.name ?? id;

    addItem({
      ...item,
      baseId: item.id,
      price: unitPrice,
      displayName: item.name,
      customisations: {
        size: config.hasSize ? selectedSize : null,
        extraMeat: hasExtraMeat ? extraMeatType : null,
        sauces: config.hasSauces ? selectedSauces.map(sauceName) : [],
        salads: config.hasSalad ? selectedSalads.map(saladName) : [],
        note: specialNote.trim().slice(0, 500) || null,
      },
      qty,
    });
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-fadeIn" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-[101] bg-[#1C1C1E] rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slideUp focus:outline-none max-w-[640px] mx-auto"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#3A3A3A]" />
          </div>

          {/* Item image */}
          {item.image && (
            <div className="w-full h-48 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="px-5 pb-8 pt-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-3">
                <Dialog.Title className="text-xl font-bold text-white">
                  {item.name}
                </Dialog.Title>
                {item.description && (
                  <p className="text-sm text-[#9CA3AF] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                )}
                <p className="text-amber-500 font-bold text-lg mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[#9CA3AF] hover:text-white transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            {/* Size selector (HSP and Chips) */}
            {config.hasSize && (
              <Section title="Size">
                <div className="grid grid-cols-4 gap-2">
                  {SIZE_OPTIONS.map(size => {
                    const extraCost = item.isChips
                      ? null
                      : (HSP_SIZE_PRICES[size] > 0 ? `+$${HSP_SIZE_PRICES[size]}` : 'Base');
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'py-2.5 rounded-xl text-sm font-semibold border transition-all',
                          selectedSize === size
                            ? 'bg-amber-500 border-amber-500 text-[#111111]'
                            : 'bg-[#2A2A2A] border-[#3A3A3A] text-white hover:border-amber-500/50'
                        )}
                      >
                        <div>{SIZE_LABELS[size]}</div>
                        {item.isChips && (
                          <div className="text-xs mt-0.5 opacity-75">
                            ${CHIPS_SIZE_PRICES[size]}
                          </div>
                        )}
                        {!item.isChips && (
                          <div className="text-xs mt-0.5 opacity-75">{extraCost}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Extra meat */}
            {config.hasMeat && (
              <Section title="Extra Meat">
                <button
                  onClick={() => setHasExtraMeat(p => !p)}
                  className={cn(
                    'w-full py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-between transition-all',
                    hasExtraMeat
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-[#2A2A2A] border-[#3A3A3A] text-white hover:border-amber-500/50'
                  )}
                >
                  <span>Add Extra Meat</span>
                  <span className="text-xs opacity-75">+$2.00</span>
                </button>
                {hasExtraMeat && (
                  <div className="flex gap-2 mt-2">
                    {EXTRA_MEAT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setExtraMeatType(opt.id)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border text-sm font-semibold transition-all',
                          extraMeatType === opt.id
                            ? 'bg-amber-500 border-amber-500 text-[#111111]'
                            : 'bg-[#2A2A2A] border-[#3A3A3A] text-white'
                        )}
                      >
                        {opt.name.replace('Extra ', '')}
                      </button>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Sauces */}
            {config.hasSauces && (
              <Section title="Sauces" note="First sauce is free · Garlic & Chilli +$3 · Others +$1">
                <div className="flex flex-wrap gap-2">
                  {SAUCE_DISPLAY.map(sauce => {
                    const active = selectedSauces.includes(sauce.id);
                    return (
                      <button
                        key={sauce.id}
                        onClick={() => toggleSauce(sauce.id)}
                        className={cn(
                          'px-3 py-2 rounded-full text-sm font-semibold border transition-all flex items-center gap-1.5',
                          active
                            ? 'bg-amber-500 border-amber-500 text-[#111111]'
                            : 'bg-[#2A2A2A] border-[#3A3A3A] text-white hover:border-amber-500/50'
                        )}
                      >
                        {sauce.name}
                        {sauce.popular && <span className="text-xs">⭐</span>}
                        <span className="text-xs opacity-70">+${sauce.price}</span>
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Salad */}
            {config.hasSalad && (
              <Section title="Salad" note="All included by default — tap to remove">
                <div className="flex flex-wrap gap-2">
                  {SALAD_OPTIONS.map(s => {
                    const active = selectedSalads.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSalad(s.id)}
                        className={cn(
                          'px-3 py-2 rounded-full text-sm font-semibold border transition-all',
                          active
                            ? 'bg-[#2A2A2A] border-amber-500/60 text-white'
                            : 'bg-transparent border-[#3A3A3A] text-[#9CA3AF] line-through'
                        )}
                      >
                        {active && '✓ '}{s.name}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Special instructions */}
            <Section title="Special Instructions">
              <textarea
                value={specialNote}
                onChange={e => setSpecialNote(e.target.value.slice(0, 500))}
                placeholder="e.g. extra crispy, no onion, allergies..."
                rows={3}
                className="w-full bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6B7280] resize-none focus:outline-none focus:border-amber-500/60 transition-colors"
              />
              <p className="text-xs text-[#6B7280] mt-1 text-right">
                {specialNote.length}/500
              </p>
            </Section>

            {/* Quantity + Add button */}
            <div className="flex items-center gap-3 mt-6">
              <div className="flex items-center gap-3 bg-[#2A2A2A] rounded-xl px-3 py-2">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-amber-400 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="text-white font-bold text-base w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-amber-400 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 rounded-xl font-extrabold text-base flex items-center justify-between px-5 transition-all active:scale-95"
                style={{ color: '#111111' }}
              >
                <span>Add to Order</span>
                <span>${totalPrice.toFixed(2)}</span>
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, note, children }) {
  return (
    <div className="mt-5 pt-5 border-t border-[#2A2A2A]">
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {note && <span className="text-[#9CA3AF] text-xs">{note}</span>}
      </div>
      {children}
    </div>
  );
}
