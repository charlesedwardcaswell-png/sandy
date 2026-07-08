import React, { useState } from 'react';
import { WEAPONS_LIST, SHIELDS, POISONS_LIST, POWDERS_LIST, GEAR_LIST_NAMES, GEAR_DESCRIPTIONS, GEAR_FULL_ENTRY, ARMOR_TN_BONUS } from '../data/constants';

const RARITIES = [
  { key: 'uncommon',  label: 'Uncommon',  color: '#4a7a40', glow: '#4a7a4066' },
  { key: 'rare',      label: 'Rare',      color: '#3a6a9a', glow: '#3a6a9a66' },
  { key: 'legendary', label: 'Legendary', color: '#9a6a20', glow: '#9a6a2066' },
  { key: 'artifact',  label: 'Artifact',  color: '#8a2a8a', glow: '#8a2a8a66' },
];

const TYPES = ['Weapon', 'Armor', 'Accessory', 'Consumable', 'Artifact', 'Curiosity'];
const MUNDANE_CATEGORIES = ['Quest Item', 'Weapon', 'Armor', 'Gear', 'Loot', 'Consumable'];

// Shared base-item catalog for reskinning: pick a real item, keep its mechanics/description locked,
// only override name/price/flavor-notes. Used by BOTH mundane items ("From base item") and magic items
// (a magic Weapon or Armor can lock to a real weapon/shield's stats) - this used to be two separate,
// overlapping pickers (a Weapon-only one here, and a wider one in ItemCreatorTab); merged into one.
// Normalizes several differently-shaped data sources into one shape:
// { name, price, mechanicsSummary, description, mechanicalFields (spread onto the created item as-is) }
const BASE_ITEM_CATALOG = {
  Weapon: WEAPONS_LIST.map(w => ({
    name: w.name, price: w.price !== '-' ? w.price : '',
    mechanicsSummary: `DR ${w.dr} · ${w.skill}${w.twoHanded ? ' · Two-Handed' : ''}${w.special ? ' · ' + w.special : ''}`,
    description: GEAR_FULL_ENTRY[w.name] || w.special || '',
    // item_type overrides CharacterTab's name-based wield/wear detection - without it, a renamed
    // weapon or piece of armor would silently stop registering as equippable at all.
    mechanicalFields: { dr: w.dr, skill: w.skill, size: w.size, twoHanded: w.twoHanded, isSword: w.isSword, special: w.special, item_type: 'Weapon' },
  })),
  Shield: SHIELDS.map(s => ({
    name: s.name, price: s.price || '',
    mechanicsSummary: `+${s.tnBonus} TN, Reduction ${s.reduction}${s.note ? ' · ' + s.note : ''}`,
    description: s.note || '',
    // tn_bonus (snake_case) + is_shield so getArmorBonus()/getShieldBonus() recognize a renamed shield
    // item correctly - a name-based lookup alone breaks the moment the GM renames it.
    mechanicalFields: { tn_bonus: s.tnBonus, reduction: s.reduction, size: s.size, note: s.note, item_type: 'Armor', is_shield: true },
  })),
  Poison: POISONS_LIST.map(p => ({
    name: p.name, price: p.craftInputCost || '',
    mechanicsSummary: `${p.effect} · Resist TN ${p.resistTN ?? '-'}`,
    description: `${p.method}, onset ${p.onset}. ${p.effect}. Resist: ${p.resist}.${p.craftNotes ? ' ' + p.craftNotes : ''}`,
    mechanicalFields: { method: p.method, onset: p.onset, effect: p.effect, resist: p.resist, resistTN: p.resistTN, healTN: p.healTN, craftTN: p.craftTN, craftNotes: p.craftNotes, disease: p.disease, craftInputItem: p.craftInputItem },
  })),
  Powder: POWDERS_LIST.map(p => ({
    name: p.name, price: p.craftInputCost || '',
    mechanicsSummary: p.effects.join(', '),
    description: `${p.delivery}. Duration: ${p.duration}. ${p.note || ''}`,
    mechanicalFields: { delivery: p.delivery, duration: p.duration, craft: p.craft, effects: p.effects, note: p.note, craftInputItem: p.craftInputItem },
  })),
  Gear: GEAR_LIST_NAMES.map(name => ({
    name, price: '',
    mechanicsSummary: ARMOR_TN_BONUS[name] ? `+${ARMOR_TN_BONUS[name]} Armor TN` : '',
    description: GEAR_FULL_ENTRY[name] || GEAR_DESCRIPTIONS[name] || '',
    // Armor items must carry an explicit tn_bonus field - getArmorBonus() checks this before falling
    // back to a by-name lookup, which would silently break the moment the item is renamed. item_type
    // likewise overrides CharacterTab's name-based "is this armor" detection for the same reason.
    mechanicalFields: ARMOR_TN_BONUS[name] ? { tn_bonus: ARMOR_TN_BONUS[name], item_type: 'Armor' } : {},
  })),
};
// Which numeric field(s) the GM can override per base category, alongside their locked mechanicalFields
// key and a human label. Everything else about the base item (special rules, description) stays locked.
const NUMERIC_OVERRIDES = {
  Weapon: [{ key: 'dr', label: 'Damage (DR)', type: 'text' }],
  Shield: [{ key: 'tn_bonus', label: 'TN Bonus', type: 'number' }, { key: 'reduction', label: 'Reduction', type: 'number' }],
  Poison: [{ key: 'resistTN', label: 'Resist TN', type: 'number' }],
  Powder: [],
  Gear: [{ key: 'tn_bonus', label: 'Armor TN Bonus', type: 'number', onlyIf: (base) => base.mechanicalFields.tn_bonus !== undefined }],
};
const BASE_ITEM_CATEGORY_TO_ITEM_CATEGORY = { Weapon: 'Weapon', Shield: 'Armor', Poison: 'Consumable', Powder: 'Consumable', Gear: 'Gear' };
// Which base categories a magic item's Type can lock to - a magic Weapon locks to a real weapon,
// a magic Armor locks to a real shield (inheriting is_shield so it stacks like a shield, not a
// highest-only armor slot). Other magic types (Accessory/Consumable/Artifact/Curiosity) have no
// mechanical base - they're flavor/effect-only, same as before this merge.
const MAGIC_TYPE_TO_BASE_CATEGORY = { Weapon: 'Weapon', Armor: 'Shield' };

export function MagicItemBadge({ item, compact = false }) {
  const rarity = RARITIES.find(r => r.key === item.rarity) || RARITIES[0];
  if (compact) {
    return (
      <span style={{
        fontSize: 9, padding: '1px 5px', borderRadius: 6,
        background: rarity.glow,
        border: `1px solid ${rarity.color}88`,
        color: rarity.color,
        boxShadow: `0 0 6px ${rarity.glow}`,
        whiteSpace: 'nowrap',
      }}>
        ✦ {item.name}
      </span>
    );
  }
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(10,8,4,.95), ${rarity.glow})`,
      border: `1px solid ${rarity.color}88`,
      borderRadius: 6, padding: '.5rem .75rem',
      boxShadow: `0 0 12px ${rarity.glow}, inset 0 0 20px rgba(0,0,0,.3)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: item.effect ? '.3rem' : 0 }}>
        <span style={{ color: rarity.color, fontSize: 14 }}>✦</span>
        <span style={{ fontWeight: 700, color: rarity.color, fontSize: 14 }}>{item.name}</span>
        <span style={{ fontSize: 10, color: rarity.color + 'aa', marginLeft: 'auto', border: `1px solid ${rarity.color}44`, borderRadius: 3, padding: '0 4px' }}>
          {rarity.label}
        </span>
        {item.item_type && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.item_type}</span>}
      </div>
      {item.dr && <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: 2 }}>Damage: {item.dr}</div>}
      {typeof item.tn_bonus === 'number' && <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: 2 }}>Armor TN Bonus: +{item.tn_bonus}</div>}
      {item.effect && <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{item.effect}</div>}
      {item.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.description}</div>}
    </div>
  );
}

// defaultMagic controls the initial state of the "Magic Item" toggle depending on which button
// opened the modal (PartyTab's "✦ Create Magic Item" vs Preparation's single "+ Create Item"),
// but the toggle itself is always available - either entry point can create either kind of item.
export default function MagicItemCreator({ onClose, onCreateForCharacter, onCreateForParty, onCreateForShop, onCreateForGMInventory, characters, shops = [], defaultMagic = false }) {
  const [isMagic, setIsMagic] = useState(defaultMagic);
  const [name, setName] = useState('');
  const [rarity, setRarity] = useState('rare');
  const [itemType, setItemType] = useState('Weapon');          // magic mode: TYPES
  const [mundaneCategory, setMundaneCategory] = useState('Gear'); // mundane mode, custom (no base): MUNDANE_CATEGORIES
  const [qty, setQty] = useState(1);       // mundane only - magic items are always qty 1
  const [price, setPrice] = useState('');  // mundane only - magic items show computed base/estimated price instead
  const [useBaseItem, setUseBaseItem] = useState(false); // mundane only; magic mode's base linking is implied by picking a base item name directly
  const [baseCategory, setBaseCategory] = useState('Weapon'); // mundane only: Weapon | Shield | Poison | Powder | Gear
  const [baseItemName, setBaseItemName] = useState('');
  const [numOverrides, setNumOverrides] = useState({}); // { fieldKey: overriddenValue }
  const [customDr, setCustomDr] = useState('');         // magic, un-based Weapon only
  const [customTnBonus, setCustomTnBonus] = useState(''); // magic, un-based Armor only
  const [effect, setEffect] = useState('');   // magic only
  const [flavorText, setFlavorText] = useState(''); // shared: magic "description" / mundane "notes"
  const [destination, setDestination] = useState(
    onCreateForGMInventory ? 'gm_inventory'
    : (onCreateForShop && shops.length > 0 ? shops[0].id : 'party')
  );
  const [saving, setSaving] = useState(false);

  const rarityData = RARITIES.find(r => r.key === rarity) || RARITIES[0];

  // In magic mode, which base category applies is implied by Type (Weapon→Weapon, Armor→Shield -
  // a magic shield-based Armor item inherits is_shield so it stacks like a shield, not a highest-only
  // armor slot). Other magic types have no mechanical base, same as before this merge.
  const magicBaseCategory = MAGIC_TYPE_TO_BASE_CATEGORY[itemType] || null;
  const effectiveBaseCategory = isMagic ? magicBaseCategory : baseCategory;
  const baseOptions = effectiveBaseCategory ? (BASE_ITEM_CATALOG[effectiveBaseCategory] || []) : [];
  const selectedBase = isMagic
    ? (magicBaseCategory ? baseOptions.find(b => b.name === baseItemName) || null : null)
    : (useBaseItem ? baseOptions.find(b => b.name === baseItemName) || null : null);
  const activeOverrides = selectedBase
    ? (NUMERIC_OVERRIDES[effectiveBaseCategory] || []).filter(o => !o.onlyIf || o.onlyIf(selectedBase))
    : [];
  const mergedFields = { ...selectedBase?.mechanicalFields, ...numOverrides };

  const handleSelectBaseItem = (chosenName) => {
    setBaseItemName(chosenName);
    const base = baseOptions.find(b => b.name === chosenName);
    if (!base) { setNumOverrides({}); return; }
    const defaults = {};
    (NUMERIC_OVERRIDES[effectiveBaseCategory] || []).forEach(o => {
      if (!o.onlyIf || o.onlyIf(base)) defaults[o.key] = base.mechanicalFields[o.key];
    });
    setNumOverrides(defaults);
    if (isMagic) {
      if (!name.trim()) setName(base.name); // pre-fill name if empty, GM can still rename
    } else {
      setName(base.name); setPrice(base.price || '');
    }
  };

  const toggleMagic = () => {
    setIsMagic(v => !v);
    setBaseItemName(''); setNumOverrides({}); setUseBaseItem(false);
  };
  const changeItemType = (t) => { setItemType(t); setBaseItemName(''); setNumOverrides({}); };
  const changeBaseCategory = (c) => { setBaseCategory(c); setBaseItemName(''); setNumOverrides({}); setName(''); setPrice(''); };

  // Base cost (magic only): the linked base item's real price if chosen, otherwise a flat fallback
  // by rarity. Magic markup on top scales with rarity - shown so the GM knows what a shop would charge.
  const FALLBACK_BASE_PRICE = { uncommon: 10, rare: 20, legendary: 50, artifact: 100 };
  const parseBasePrice = (priceStr) => {
    if (!priceStr || priceStr === '-') return FALLBACK_BASE_PRICE[rarity] || 20;
    const match = String(priceStr).match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : (FALLBACK_BASE_PRICE[rarity] || 20);
  };
  const basePrice = selectedBase ? parseBasePrice(selectedBase.price) : (FALLBACK_BASE_PRICE[rarity] || 20);
  const RARITY_MARKUP_MULT = { uncommon: 2, rare: 4, legendary: 10, artifact: 25 };
  const estimatedShopPrice = Math.round(basePrice * (RARITY_MARKUP_MULT[rarity] || 4));

  // Mundane "From base item" mechanics summary, generalized across all 5 base categories (previously
  // lived only in ItemCreatorTab; now shared since the underlying catalog is shared too).
  const mundaneSummary = (!isMagic && selectedBase) ? (() => {
    const f = mergedFields;
    if (baseCategory === 'Weapon') return `DR ${f.dr} · ${f.skill}${f.twoHanded ? ' · Two-Handed' : ''}${f.special ? ' · ' + f.special : ''}`;
    if (baseCategory === 'Shield') return `+${f.tn_bonus} TN, Reduction ${f.reduction}${f.note ? ' · ' + f.note : ''}`;
    if (baseCategory === 'Poison') return `${f.effect} · Resist TN ${f.resistTN ?? '-'}`;
    if (baseCategory === 'Gear') return f.tn_bonus ? `+${f.tn_bonus} Armor TN` : selectedBase.mechanicsSummary;
    return selectedBase.mechanicsSummary;
  })() : null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    let item;
    if (isMagic) {
      item = {
        name: name.trim(),
        category: 'Magic',
        qty: 1,
        rarity,
        item_type: itemType,
        base_item: selectedBase ? selectedBase.name : undefined,
        skill: mergedFields.skill,
        base_price: basePrice,
        dr: (selectedBase ? mergedFields.dr : customDr.trim()) || undefined,
        tn_bonus: selectedBase ? mergedFields.tn_bonus : (itemType === 'Armor' && customTnBonus.trim() ? (parseInt(customTnBonus, 10) || undefined) : undefined),
        reduction: selectedBase ? mergedFields.reduction : undefined,
        is_shield: selectedBase ? mergedFields.is_shield : undefined,
        size: selectedBase ? mergedFields.size : undefined,
        effect: effect.trim(),
        description: flavorText.trim(),
        is_magic: true,
        equipped: false,
        inUse: false,
      };
    } else {
      item = useBaseItem && selectedBase
        ? {
            name: name.trim(), category: BASE_ITEM_CATEGORY_TO_ITEM_CATEGORY[baseCategory] || 'Gear', qty,
            price: price.trim(), notes: flavorText.trim(),
            baseItemName: selectedBase.name, mechanicsSummary: mundaneSummary, mechanicalDescription: selectedBase.description,
            ...mergedFields,
          }
        : { name: name.trim(), category: mundaneCategory, qty, price: price.trim(), notes: flavorText.trim() };
    }

    if (onCreateForShop && shops.some(s => s.id === destination)) {
      await onCreateForShop(destination, item);
    } else if (destination === 'gm_inventory' && onCreateForGMInventory) {
      await onCreateForGMInventory(item);
    } else if (destination === 'party') {
      await onCreateForParty(item);
    } else {
      await onCreateForCharacter(destination, item);
    }
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 9100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.5rem', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{isMagic ? '✦ Create Magic Item' : '+ Create Item'}</div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c0a0e0', marginBottom: '1rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={isMagic} onChange={toggleMagic} /> ✦ This is a Magic Item
        </label>

        {isMagic && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Rarity</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {RARITIES.map(r => (
                <button key={r.key} onClick={() => setRarity(r.key)} style={{
                  flex: 1, padding: '.4rem', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                  background: rarity === r.key ? r.glow : 'var(--bg-panel)',
                  border: `2px solid ${rarity === r.key ? r.color : 'var(--border)'}`,
                  color: rarity === r.key ? r.color : 'var(--text-muted)',
                  boxShadow: rarity === r.key ? `0 0 10px ${r.glow}` : 'none',
                }}>{r.label}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Item Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={isMagic ? 'e.g. Blade of Smokeless Fire' : (useBaseItem ? 'Rename (optional)' : 'Item name')}
            style={{ width: '100%', boxSizing: 'border-box' }} autoFocus />
        </div>

        {isMagic ? (
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Type</label>
            <select value={itemType} onChange={e => changeItemType(e.target.value)} style={{ width: '100%' }}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, marginBottom: '.6rem' }}>
            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="radio" checked={!useBaseItem} onChange={() => { setUseBaseItem(false); setBaseItemName(''); setNumOverrides({}); }} /> Custom item
            </label>
            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="radio" checked={useBaseItem} onChange={() => setUseBaseItem(true)} /> From base item
            </label>
          </div>
        )}

        {/* Base item picker - magic mode: implied by Type, single dropdown. Mundane mode: pick a base category first. */}
        {isMagic && magicBaseCategory && (
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
              Base {magicBaseCategory === 'Weapon' ? 'Weapon' : 'Shield'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(determines mechanics and base cost)</span>
            </label>
            <select value={baseItemName} onChange={e => handleSelectBaseItem(e.target.value)} style={{ width: '100%' }}>
              <option value="">- custom / not a standard {magicBaseCategory.toLowerCase()} -</option>
              {baseOptions.map(b => <option key={b.name} value={b.name}>{b.name}{b.mechanicsSummary ? ` (${b.mechanicsSummary})` : ''}</option>)}
            </select>
          </div>
        )}
        {!isMagic && useBaseItem && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '.5rem' }}>
            <select value={baseCategory} onChange={e => changeBaseCategory(e.target.value)} style={{ fontSize: 12 }}>
              {Object.keys(BASE_ITEM_CATALOG).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={baseItemName} onChange={e => handleSelectBaseItem(e.target.value)} style={{ fontSize: 12, flex: 1, minWidth: 160 }}>
              <option value="">- choose base {baseCategory.toLowerCase()} -</option>
              {baseOptions.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        )}

        {/* Locked mechanics preview - shared between magic and mundane base-linked items */}
        {selectedBase && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.75rem', padding: '.4rem .5rem', background: 'rgba(107,78,40,.08)', borderRadius: 4 }}>
            <span style={{ color: 'var(--gold-dim)', fontWeight: 600 }}>Mechanics (locked): </span>{isMagic ? (selectedBase.mechanicsSummary || '-') : (mundaneSummary || '-')}
            {selectedBase.description && <div style={{ marginTop: 3, fontStyle: 'italic' }}>{selectedBase.description}</div>}
          </div>
        )}

        {/* Numeric overrides - shared, e.g. DR for a magic/mundane weapon, TN Bonus + Reduction for a shield */}
        {selectedBase && activeOverrides.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '.75rem' }}>
            {activeOverrides.map(o => (
              <label key={o.key} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {o.label}
                <input type={o.type} value={numOverrides[o.key] ?? ''} onChange={e => setNumOverrides(prev => ({ ...prev, [o.key]: o.type === 'number' ? +e.target.value : e.target.value }))}
                  style={{ fontSize: 11, width: o.type === 'number' ? 55 : 70 }} />
              </label>
            ))}
          </div>
        )}

        {/* Freeform mechanics - magic items with no base linked (custom weapon/armor, as before this merge) */}
        {isMagic && itemType === 'Weapon' && !selectedBase && (
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Damage (if weapon, e.g. 3k2)</label>
            <input value={customDr} onChange={e => setCustomDr(e.target.value)} placeholder="e.g. 3k2" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
        )}
        {isMagic && itemType === 'Armor' && !selectedBase && (
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
              Armor TN Bonus <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(added to Armor TN when worn)</span>
            </label>
            <input type="number" value={customTnBonus} onChange={e => setCustomTnBonus(e.target.value)} placeholder="e.g. 5" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
        )}

        {/* Base cost - magic only, shown so the GM knows what shop price will be derived from */}
        {isMagic && (
          <div style={{ marginBottom: '.75rem', padding: '.5rem .65rem', background: 'var(--bg-panel)', borderRadius: 5, fontSize: 11, color: 'var(--text-muted)' }}>
            Base item cost: <strong style={{ color: 'var(--gold-dim)' }}>{basePrice} copper</strong>
            {' '}→ estimated shop price at {rarityData.label}: <strong style={{ color: 'var(--gold)' }}>{estimatedShopPrice} copper</strong>
            {!selectedBase && magicBaseCategory && <span> (no base item selected - using rarity fallback)</span>}
          </div>
        )}

        {/* Mundane-only: category (when not using a base item), quantity, price */}
        {!isMagic && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '.5rem' }}>
            {!useBaseItem && (
              <select value={mundaneCategory} onChange={e => setMundaneCategory(e.target.value)} style={{ fontSize: 12 }}>
                {MUNDANE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Qty <input type="number" min={1} value={qty} onChange={e => setQty(+e.target.value)} style={{ width: 55, fontSize: 12 }} />
            </label>
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Cost (optional)" style={{ fontSize: 12, width: 150 }} />
          </div>
        )}

        {/* Effect - magic only */}
        {isMagic && (
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Magical Effect (shown on sheet)</label>
            <input value={effect} onChange={e => setEffect(e.target.value)} placeholder="e.g. +1k0 damage vs Jinn; deals wounds that cannot be healed magically"
              style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
        )}

        {/* Flavor text - shared, stored as description (magic) or notes (mundane) */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
            {isMagic ? 'Flavour Description (optional)' : (useBaseItem ? 'Flavor description (optional - reskin text, mechanics stay locked)' : 'Notes (optional)')}
          </label>
          {isMagic ? (
            <textarea value={flavorText} onChange={e => setFlavorText(e.target.value)} rows={2}
              placeholder="Forged from crysteel and tempered in the breath of a bound Major Jinn…"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
          ) : (
            <input value={flavorText} onChange={e => setFlavorText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{ width: '100%', boxSizing: 'border-box' }} />
          )}
        </div>

        {/* Preview - magic only */}
        {isMagic && name && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Preview</label>
            <MagicItemBadge item={{ name, rarity, item_type: itemType, dr: selectedBase ? mergedFields.dr : customDr, effect, description: flavorText }} />
          </div>
        )}

        {/* Destination - shared */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Send to</label>
          <select value={destination} onChange={e => setDestination(e.target.value)} style={{ width: '100%' }}>
            {onCreateForGMInventory && <option value="gm_inventory">📦 GM's Inventory (Stash)</option>}
            {shops.map(s => <option key={s.id} value={s.id}>🏪 {s.name}</option>)}
            {onCreateForParty && <option value="party">Party Inventory (Loot)</option>}
            {(characters || []).filter(c => !c.is_npc).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-p" disabled={!name.trim() || saving} onClick={handleCreate}
            style={isMagic ? { borderColor: rarityData.color, color: rarityData.color, boxShadow: `0 0 8px ${rarityData.glow}` } : {}}>
            {saving ? 'Creating…' : (isMagic ? `✦ Create ${rarityData.label} Item` : 'Create Item')}
          </button>
        </div>
      </div>
    </div>
  );
}
