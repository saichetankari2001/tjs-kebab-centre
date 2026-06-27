import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { getItemTypeConfig, calculateItemPrice } from '../lib/itemTypes';
import { SAUCE_OPTIONS, SALAD_OPTIONS, DEFAULT_WRAP_SALADS, EXTRA_MEAT_OPTIONS } from '../data/options';

const HSP_SIZE_LABELS  = { S: 'Small', M: 'Medium', L: 'Large', XL: 'X-Large' };
const SKEW_BASE_LABELS = { rice: 'With Rice', salad: 'With Salad' };
const LOADED_LABELS    = { Reg: 'Regular', Large: 'Large' };

export default function ItemModal({ item, isOpen, onClose }) {
  const { addItem } = useCart();
  const cfg = item ? getItemTypeConfig(item.itemType) : {};

  // ── State ──────────────────────────────────────────────
  const [qty,           setQty]           = useState(1);
  const [selectedSize,  setSelectedSize]  = useState(null);
  const [bowlType,      setBowlType]      = useState('salad');   // 'salad' | 'rice'
  const [skewBase,      setSkewBase]      = useState('rice');    // 'rice'  | 'salad'
  const [hasExtraMeat,  setHasExtraMeat]  = useState(false);
  const [extraMeatType, setExtraMeatType] = useState('chicken');
  const [selectedSauces,setSelectedSauces]= useState([]);
  const [selectedSalads,setSelectedSalads]= useState([]);
  const [note,          setNote]          = useState('');

  // Reset on open / item change
  useEffect(() => {
    if (!isOpen || !item) return;
    setQty(1);
    setHasExtraMeat(false);
    setExtraMeatType('chicken');
    setSelectedSauces([]);
    setNote('');
    setBowlType('salad');
    setSkewBase('rice');
    // Default salad selection
    const itemCfg = getItemTypeConfig(item.itemType);
    if (itemCfg.hasSalad) {
      setSelectedSalads(DEFAULT_WRAP_SALADS.slice());
    } else {
      setSelectedSalads([]);
    }
    // Default size
    if (itemCfg.hasSize) {
      if (item.itemType === 'hsp')         setSelectedSize('S');
      else if (item.itemType === 'chips')  setSelectedSize('S');
      else if (item.itemType === 'loaded') setSelectedSize('Reg');
      else setSelectedSize(null);
    } else {
      setSelectedSize(null);
    }
  }, [isOpen, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;

  // ── Price calculation ──────────────────────────────────
  const unitPrice = calculateItemPrice(item.price, {
    itemType: item.itemType,
    item,
    selectedSize,
    bowlType,
    hasExtraMeat,
    selectedSauces,
  });
  const totalPrice = unitPrice * qty;

  // ── Helpers ────────────────────────────────────────────
  const toggleSauce = (id) =>
    setSelectedSauces((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);

  const toggleSalad = (id) =>
    setSelectedSalads((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);

  const sauceLabel = () => {
    if (selectedSauces.length === 0) return 'First sauce free';
    if (selectedSauces.length === 1) return '1 sauce (free)';
    return `${selectedSauces.length} sauces (1 free + ${selectedSauces.length - 1} × $2)`;
  };

  const handleAdd = () => {
    const saladName = (id) => SALAD_OPTIONS.find((s) => s.id === id)?.name ?? id;
    const sauceName = (id) => SAUCE_OPTIONS.find((s) => s.id === id)?.name ?? id;
    const meatName  = (id) => EXTRA_MEAT_OPTIONS.find((m) => m.id === id)?.name ?? id;

    const cartItem = {
      ...item,
      baseId:  item.id,
      price:   unitPrice,
      displayName: item.name,
      customisations: {
        size:      selectedSize  ?? null,
        bowlType:  cfg.hasBowlType  ? (bowlType === 'rice' ? 'Rice Bowl' : 'Salad Bowl') : null,
        skewBase:  cfg.hasSkewBase  ? SKEW_BASE_LABELS[skewBase] : null,
        extraMeat: hasExtraMeat     ? meatName(extraMeatType)     : null,
        sauces:    cfg.hasSauces    ? selectedSauces.map(sauceName) : [],
        salads:    cfg.hasSalad     ? selectedSalads.map(saladName) : [],
        note:      note.trim().slice(0, 300) || null,
      },
    };

    for (let i = 0; i < qty; i++) addItem(cartItem);
    onClose();
  };

  // ── Size options for HSP / chips / loaded ──────────────
  const sizeKeys = item.sizePrices ? Object.keys(item.sizePrices) : [];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm animate-fadeIn" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-2xl max-h-[92vh] overflow-y-auto focus:outline-none max-w-[640px] mx-auto animate-slideUp"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="px-5 pb-10 pt-2">
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 pr-3">
                <Dialog.Title className="text-white font-bold text-xl leading-snug">
                  {item.name}
                </Dialog.Title>
                {item.description && (
                  <p className="text-muted text-sm mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white transition-colors flex-shrink-0 mt-0.5">
                  <X size={15} />
                </button>
              </Dialog.Close>
            </div>
            <p className="text-brand font-bold text-xl mb-4">
              ${unitPrice.toFixed(2)}
            </p>

            {/* ── Bowl type ── */}
            {cfg.hasBowlType && (
              <Section title="Bowl Type">
                <div className="grid grid-cols-2 gap-2">
                  {['salad', 'rice'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setBowlType(t)}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition-all',
                        bowlType === t
                          ? 'bg-brand border-brand text-surface'
                          : 'bg-card2 border-border text-white hover:border-brand/40'
                      )}
                    >
                      {t === 'salad' ? '🥗 Salad Bowl' : '🍚 Rice Bowl'}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Skewer base ── */}
            {cfg.hasSkewBase && (
              <Section title="Served With">
                <div className="grid grid-cols-2 gap-2">
                  {['rice', 'salad'].map((b) => (
                    <button
                      key={b}
                      onClick={() => setSkewBase(b)}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition-all',
                        skewBase === b
                          ? 'bg-brand border-brand text-surface'
                          : 'bg-card2 border-border text-white hover:border-brand/40'
                      )}
                    >
                      {SKEW_BASE_LABELS[b]}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Size (HSP / chips / loaded) ── */}
            {cfg.hasSize && sizeKeys.length > 0 && (
              <Section title="Size">
                <div className="grid grid-cols-4 gap-2">
                  {sizeKeys.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        'py-2.5 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-0.5',
                        selectedSize === size
                          ? 'bg-brand border-brand text-surface'
                          : 'bg-card2 border-border text-white hover:border-brand/40'
                      )}
                    >
                      <span>{HSP_SIZE_LABELS[size] ?? LOADED_LABELS[size] ?? size}</span>
                      <span className="opacity-75 font-bold">${item.sizePrices[size]}</span>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Extra meat ── */}
            {cfg.hasMeat && (
              <Section title="Extra Meat">
                <button
                  onClick={() => setHasExtraMeat((p) => !p)}
                  className={cn(
                    'w-full py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-between transition-all',
                    hasExtraMeat
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'bg-card2 border-border text-white hover:border-brand/40'
                  )}
                >
                  <span>Add Extra Meat</span>
                  <span className="text-xs opacity-70">+$2.00</span>
                </button>
                {hasExtraMeat && (
                  <div className="flex gap-2 mt-2">
                    {EXTRA_MEAT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setExtraMeatType(opt.id)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border text-sm font-semibold transition-all',
                          extraMeatType === opt.id
                            ? 'bg-brand border-brand text-surface'
                            : 'bg-card2 border-border text-white'
                        )}
                      >
                        {opt.name.replace('Extra ', '')}
                      </button>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* ── Sauces ── */}
            {cfg.hasSauces && (
              <Section title="Sauces" note={sauceLabel()}>
                <div className="flex flex-wrap gap-2">
                  {SAUCE_OPTIONS.map((sauce) => {
                    const active = selectedSauces.includes(sauce.id);
                    return (
                      <button
                        key={sauce.id}
                        onClick={() => toggleSauce(sauce.id)}
                        className={cn(
                          'px-3 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1',
                          active
                            ? 'bg-brand border-brand text-surface'
                            : 'bg-card2 border-border text-white hover:border-brand/40'
                        )}
                      >
                        {sauce.name}
                        {sauce.popular && <span>⭐</span>}
                        {selectedSauces.length > 0 && selectedSauces[0] !== sauce.id && active && (
                          <span className="opacity-70">+$2</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── Salad (wraps / HSP) ── */}
            {cfg.hasSalad && (
              <Section title="Salad" note="All included by default — tap to remove">
                <div className="flex flex-wrap gap-2">
                  {SALAD_OPTIONS.map((s) => {
                    const active = selectedSalads.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSalad(s.id)}
                        className={cn(
                          'px-3 py-2 rounded-full text-xs font-semibold border transition-all',
                          active
                            ? 'border-border bg-card2 text-white'
                            : 'border-transparent bg-transparent text-muted line-through'
                        )}
                      >
                        {active && '✓ '}{s.name}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── Special instructions ── */}
            <Section title="Special Instructions">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 300))}
                placeholder="e.g. extra crispy, no onion, allergy info..."
                rows={2}
                className="w-full bg-card2 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted resize-none focus:outline-none focus:border-brand/50 transition-colors"
              />
              <p className="text-muted text-xs mt-1 text-right">{note.length}/300</p>
            </Section>

            {/* ── Qty + Add ── */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center gap-3 bg-card2 rounded-xl px-3 py-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-brand transition-colors"
                >
                  <Minus size={15} />
                </button>
                <span className="text-white font-bold text-base w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-brand transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                className="flex-1 py-3.5 bg-brand hover:bg-brand-lit rounded-xl font-extrabold text-sm flex items-center justify-between px-5 transition-colors shadow shadow-brand/20"
                style={{ color: '#0f0f0f' }}
              >
                <span>Add to Order</span>
                <span>${totalPrice.toFixed(2)}</span>
              </motion.button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, note, children }) {
  return (
    <div className="mt-5 pt-5 border-t border-border">
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-white font-bold text-sm">{title}</h3>
        {note && <span className="text-muted text-xs">{note}</span>}
      </div>
      {children}
    </div>
  );
}
