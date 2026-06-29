import React, { useState, useEffect } from 'react';
import { WEAPONS_LIST, GEAR_LIST, GEAR_DESCRIPTIONS, GAME_ID, POISONS_LIST } from '../data/constants';
import PoisonReferenceModal from './PoisonReferenceModal';
import MagicItemCreator, { MagicItemBadge } from './MagicItemCreator';
import { supabase } from '../lib/supabase';

const QUALITY_TIERS = [
  { key: 'poor',       label: 'Poor',       mult: 0.5,  color: '#6a5a40' },
  { key: 'standard',   label: 'Standard',   mult: 1,    color: '#8a7a50' },
  { key: 'fine',       label: 'Fine',       mult: 2,    color: '#c0a030' },
  { key: 'masterwork', label: 'Masterwork', mult: 4,    color: '#e0c060' },
];

// Helper to make a shop item from a weapon
const wItem = (name, quality='standard') => {
  const w = WEAPONS_LIST.find(x => x.name === name);
  return { name, price: w?.price?.replace('c','0 copper') || '5 copper', dr: w?.dr || '', quality, visible: true, is_magic: false };
};
// Helper to make a shop item from gear
const gItem = (name, price='2 copper', quality='standard') => ({ name, price, dr: '', quality, visible: true, is_magic: false });

const BUNDLE_PRESETS = {
  // ── Standard shops ──────────────────────────────────────────────────────
  'Weapons Dealer': { icon: 'ti-sword', tier: 'standard', items: [
    wItem('Longsword'), wItem('Scimitar'), wItem('Shortsword'), wItem('Knife'), wItem('Jambiya'),
    wItem('Spear'), wItem('Staff'), wItem('Heavy Club'), wItem('War Axe'), wItem('Standard Bow'), wItem('Shortbow'), wItem('Knife'),
  ]},
  'Armorer': { icon: 'ti-shield', tier: 'standard', items: [
    gItem('Partial Armor (+3 TN)', '10 copper'), gItem('Light Armor (+5 TN)', '20 copper'),
    gItem('Heavy Armor (+10 TN)', '40 copper'), gItem('Riding Armor (+8 TN)', '30 copper'),
  ]},
  'Apothecary': { icon: 'ti-flask', tier: 'standard', items: [
    gItem('Medicine Kit', '5 copper'), gItem('Apothecary Kit', '8 copper'),
    gItem('Traveling Rations', '1 copper'), gItem('Water Skin', '1 copper'),
    gItem('Rope (50 ft)', '1 copper'), gItem('Lantern', '2 copper'), gItem('Lantern Oil', '1 copper'),
    gItem('Flint and Steel', '1 copper'),
  ]},
  'General Goods': { icon: 'ti-backpack', tier: 'standard', items: [
    gItem('Backpack', '2 copper'), gItem('Traveling Cloak', '3 copper'), gItem('Suit of Clothes', '2 copper'),
    gItem('Sandals', '1 copper'), gItem('Blanket', '1 copper'), gItem('Rope (50 ft)', '1 copper'),
    gItem('Lantern', '2 copper'), gItem('Lantern Oil', '1 copper'), gItem('Flint and Steel', '1 copper'),
    gItem('Water Skin', '1 copper'), gItem('Tent (small)', '5 copper'), gItem('Traveling Rations', '1 copper'),
  ]},
  'Black Market': { icon: 'ti-eye-off', tier: 'standard', items: [
    gItem('Lockpicks', '5 copper'), gItem('Generic Poison (dose)', '8 copper'),
    gItem('Fire Biter (dose)', '15 copper'), gItem('Night Milk (dose)', '12 copper'),
    gItem('Snake Venom (dose)', '15 copper'), gItem('Spider Venom (dose)', '10 copper'),
    gItem('Blinding Dust (dose)', '5 copper'), gItem('Poison Powder (dose)', '10 copper'),
    wItem('Knife'), wItem('Kindjal'),
  ]},
  'Outfitter': { icon: 'ti-hanger', tier: 'standard', items: [
    gItem('Suit of Clothes', '2 copper'), gItem('Fine Clothes', '8 copper'),
    gItem('Traveling Cloak', '3 copper'), gItem('Sandals', '1 copper'), gItem('Shoes', '2 copper'),
    gItem('Backpack', '2 copper'), gItem('Coin Purse', '1 copper'), gItem('Blanket', '1 copper'),
    gItem('Tent (small)', '5 copper'),
  ]},
  'Scribe': { icon: 'ti-pencil', tier: 'standard', items: [
    gItem('Calligraphy Kit', '5 copper'), gItem('Book / Scroll', '3 copper'),
    gItem('Writing Paper', '1 copper'), gItem('Personal Seal', '8 copper'),
  ]},

  // ── Superior shops (better stock, fine quality) ──────────────────────────
  'Superior Weapons': { icon: 'ti-sword', tier: 'superior', items: [
    wItem('Longsword','fine'), wItem('Scimitar','fine'), wItem('Jambiya','fine'),
    wItem('Spear','fine'), wItem('Standard Bow','fine'), wItem('Shortbow','fine'),
    wItem('Kindjal','fine'), wItem('War Axe','fine'),
  ]},
  'Superior Armorer': { icon: 'ti-shield', tier: 'superior', items: [
    gItem('Light Armor (+5 TN)', '60 copper', 'fine'), gItem('Heavy Armor (+10 TN)', '120 copper', 'fine'),
    gItem('Riding Armor (+8 TN)', '90 copper', 'fine'), gItem('Partial Armor (+3 TN)', '30 copper', 'fine'),
  ]},
  'Merchant District': { icon: 'ti-building-store', tier: 'superior', items: [
    gItem('Fine Clothes', '15 copper', 'fine'), gItem('Traveling Cloak', '10 copper', 'fine'),
    gItem('Personal Seal', '20 copper', 'fine'), gItem('Calligraphy Kit', '15 copper', 'fine'),
    gItem('Medicine Kit', '15 copper', 'fine'), gItem('Apothecary Kit', '20 copper', 'fine'),
    gItem('Shoes', '8 copper', 'fine'), gItem('Musical Instrument', '25 copper', 'fine'),
  ]},
  'Sahir Emporium': { icon: 'ti-sparkles', tier: 'superior', items: [
    gItem('Calligraphy Kit', '20 copper', 'fine'), gItem('Book / Scroll', '15 copper', 'fine'),
    gItem('Personal Seal', '25 copper', 'fine'), gItem('Apothecary Kit', '25 copper', 'fine'),
    gItem('Medicine Kit', '20 copper', 'fine'), gItem('Writing Paper', '5 copper'),
  ]},
};

function newShop(name, markupTier='fair') {
  return { id: Date.now().toString(), name, open: false, items: [], markup_tier: markupTier, haggle_tn: 15 };
}

// Assign a random markup multiplier based on shop tier
function randomMarkup(tier) {
  const ranges = {
    fair:   [1.01, 1.03],
    medium: [1.05, 1.20],
    high:   [1.01, 1.50],
  };
  const [lo, hi] = ranges[tier] || ranges.fair;
  return lo + Math.random() * (hi - lo);
}

// Apply markup to an item's price
function applyMarkup(basePrice, markup) {
  if (!basePrice || basePrice === '?') return basePrice;
  const match = String(basePrice).match(/^(\d+(?:\.\d+)?)\s*(copper|pool|cp|p)?/i);
  if (!match) return basePrice;
  const val = Math.ceil(parseFloat(match[1]) * markup);
  const unit = (match[2] || 'copper').toLowerCase();
  return `${val} ${unit}`;
}

function qualityPrice(basePrice, qualityKey) {
  const tier = QUALITY_TIERS.find(t => t.key === qualityKey) || QUALITY_TIERS[1];
  if (!basePrice || basePrice === '?') return '?';
  const match = String(basePrice).match(/^(\d+(?:\.\d+)?)\s*(copper|pool|cp|p)?/i);
  if (!match) return basePrice;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'copper').toLowerCase();
  const adjusted = val * tier.mult;
  return `${adjusted % 1 === 0 ? adjusted : adjusted.toFixed(1)} ${unit}`;
}

function parseCopperAmount(priceStr, qualityKey) {
  if (!priceStr || priceStr === '?') return 0;
  if (String(priceStr).toLowerCase().includes('pool')) return 0;
  const match = String(priceStr).match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const tier = QUALITY_TIERS.find(t => t.key === qualityKey) || QUALITY_TIERS[1];
  return Math.round(parseFloat(match[1]) * tier.mult);
}

// ── Full item catalogue for shop creation ────────────────────────────────────

const CATALOGUE = [
  {
    category: 'Weapons',
    items: WEAPONS_LIST.map(w => ({ name: w.name, price: w.price || '5 copper', dr: w.dr || '', defaultQuality: 'standard' })),
  },
  {
    category: 'Armor & Shields',
    items: [
      { name: 'Partial Armor (+3 TN)',  price: '10 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Light Armor (+5 TN)',    price: '20 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Heavy Armor (+10 TN)',   price: '40 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Riding Armor (+8 TN)',   price: '30 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Shield',                 price: '5 copper',  dr: '', defaultQuality: 'standard' },
    ],
  },
  {
    category: 'Gear & Supplies',
    items: [
      'Medicine Kit','Traveling Rations','Water Skin','Rope (50 ft)','Lantern','Lantern Oil',
      'Grapple Hook','Flint and Steel','Lockpicks','Calligraphy Kit','Apothecary Kit',
      'Backpack','Tent (small)','Traveling Cloak','Suit of Clothes','Fine Clothes',
      'Sandals','Shoes','Blanket','Coin Purse','Personal Seal','Quiver (60 arrows)',
      'Musical Instrument','Book / Scroll','Writing Paper','Whetstone',
    ].map(n => ({ name: n, price: '2 copper', dr: '', defaultQuality: 'standard' })),
  },
  {
    category: 'Poisons & Powders',
    items: [
      ...POISONS_LIST.map(p => ({ name: p.name + ' (dose)', price: '15 copper', dr: '', defaultQuality: 'standard' })),
      { name: 'Poison Powder (dose)',  price: '10 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Blinding Dust (dose)', price: '5 copper',  dr: '', defaultQuality: 'standard' },
    ],
  },
];

function ShopCatalogue({ onAdd, onClose }) {
  // checked items: name → { checked, quality, price }
  const [checked, setChecked] = React.useState({});
  const [catOpen, setCatOpen] = React.useState(() => Object.fromEntries(CATALOGUE.map(c => [c.category, true])));
  const [defaultVisible, setDefaultVisible] = React.useState(true);

  const toggle = (item) => {
    setChecked(prev => {
      const n = { ...prev };
      if (n[item.name]) {
        delete n[item.name];
      } else {
        n[item.name] = { quality: item.defaultQuality || 'standard', price: item.price || '?', dr: item.dr || '' };
      }
      return n;
    });
  };

  const toggleAll = (category, items) => {
    const allChecked = items.every(i => checked[i.name]);
    setChecked(prev => {
      const n = { ...prev };
      if (allChecked) {
        items.forEach(i => delete n[i.name]);
      } else {
        items.forEach(i => { if (!n[i.name]) n[i.name] = { quality: i.defaultQuality || 'standard', price: i.price || '?', dr: i.dr || '' }; });
      }
      return n;
    });
  };

  const checkedCount = Object.keys(checked).length;

  const handleAdd = () => {
    const items = Object.entries(checked).map(([name, cfg]) => ({
      name,
      price: cfg.price,
      dr: cfg.dr,
      quality: cfg.quality,
      visible: defaultVisible,
      is_magic: false,
    }));
    onAdd(items);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 9200,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
        padding: '1.25rem', width: '100%', maxWidth: 620 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>
            <i className="ti ti-layout-list" style={{ marginRight: 8 }} />Stock the Shop
          </div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Default visibility toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem',
          padding: '.5rem .75rem', background: 'var(--bg-panel)', borderRadius: 5 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Added items are:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
            <input type="radio" name="vis" checked={defaultVisible} onChange={() => setDefaultVisible(true)} style={{ accentColor: 'var(--green)' }} />
            <span style={{ color: 'var(--green)' }}>Visible to players</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
            <input type="radio" name="vis" checked={!defaultVisible} onChange={() => setDefaultVisible(false)} />
            <span style={{ color: 'var(--text-muted)' }}>Hidden (GM only)</span>
          </label>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
            {checkedCount} selected
          </span>
        </div>

        {/* Catalogue */}
        <div style={{ maxHeight: '55vh', overflowY: 'auto', marginBottom: '1rem' }}>
          {CATALOGUE.map(cat => {
            const allChecked = cat.items.every(i => checked[i.name]);
            const someChecked = cat.items.some(i => checked[i.name]);
            const isOpen = catOpen[cat.category];
            return (
              <div key={cat.category} style={{ marginBottom: '.5rem', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                {/* Category header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.45rem .65rem',
                  background: 'var(--bg-panel)', cursor: 'pointer' }}
                  onClick={() => setCatOpen(o => ({ ...o, [cat.category]: !o[cat.category] }))}>
                  <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
                    onChange={() => toggleAll(cat.category, cat.items)}
                    onClick={e => e.stopPropagation()} style={{ accentColor: 'var(--gold)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{cat.category}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {cat.items.filter(i => checked[i.name]).length}/{cat.items.length}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {/* Items */}
                {isOpen && (
                  <div style={{ padding: '.35rem .65rem' }}>
                    {cat.items.map(item => {
                      const cfg = checked[item.name];
                      const isChecked = !!cfg;
                      const qTier = QUALITY_TIERS.find(t => t.key === (cfg?.quality || 'standard')) || QUALITY_TIERS[1];
                      return (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '.4rem',
                          padding: '.2rem 0', borderBottom: '1px solid rgba(107,78,40,.1)', flexWrap: 'wrap' }}>
                          <input type="checkbox" checked={isChecked} onChange={() => toggle(item)}
                            style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 12, color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)', minWidth: 100 }}>
                            {item.name}
                            {item.dr && <span style={{ fontSize: 10, color: 'var(--gold-dim)', marginLeft: 5 }}>{item.dr}</span>}
                          </span>
                          {isChecked && (
                            <>
                              <select value={cfg.quality} onChange={e => setChecked(p => ({ ...p, [item.name]: { ...p[item.name], quality: e.target.value } }))}
                                style={{ fontSize: 10, padding: '1px 2px', background: 'var(--bg-panel)', border: `1px solid ${qTier.color}`, color: qTier.color, borderRadius: 3, maxWidth: 80 }}>
                                {QUALITY_TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                              </select>
                              <input value={cfg.price} onChange={e => setChecked(p => ({ ...p, [item.name]: { ...p[item.name], price: e.target.value } }))}
                                style={{ width: 75, fontSize: 10, padding: '1px 4px' }} placeholder="price" />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-p" disabled={checkedCount === 0} onClick={handleAdd}>
            Add {checkedCount} item{checkedCount !== 1 ? 's' : ''} to Shop
          </button>
        </div>
      </div>
    </div>
  );
}


export default function ShopTab({ isGM, isPCView, inventory, onUpdateInventory, characters, onUpdateCharacter, onLogEvent, onPurchase, onWipeShops, onRoll, myCharId, myGrantedActions = 0, onSpendGrantedAction }) {
  const gmView = isGM && !isPCView;

  // All shops — loaded from/saved to Supabase
  const [shops, setShops] = useState([]);
  const [activeShopId, setActiveShopId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // UI state
  const [purchaseTarget, setPurchaseTarget] = useState(myCharId || 'party');
  const [showPoisonRef, setShowPoisonRef] = useState(false);
  const [showMagicCreator, setShowMagicCreator] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopMarkupTier, setNewShopMarkupTier] = useState('fair');
  const [showNewShop, setShowNewShop] = useState(false);
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDr, setCustomDr] = useState('');
  const [customQuality, setCustomQuality] = useState('standard');
  const [editingShopName, setEditingShopName] = useState(false);
  const [randomTheme, setRandomTheme] = useState('auto');
  const [insufficientFunds, setInsufficientFunds] = useState(null);
  // Appraisal: { shopId, revealQuality: true, revealTrueCost: bool } — set after successful roll
  const [appraisalResult, setAppraisalResult] = useState(null);
  // Haggle: track if last action was appraise for +1k0 bonus
  const [lastActionWasAppraise, setLastActionWasAppraise] = useState(false);
  const [hagglingItem, setHagglingItem] = useState(null); // item being haggled // { needed, have, item } // auto | weapons | armor | apothecary | general | black | outfitter | scribe | superior | sahir
  const [randomQuality, setRandomQuality] = useState('standard'); // standard | fine | superior
  const [shopNameInput, setShopNameInput] = useState('');

  const activeShop = shops.find(s => s.id === activeShopId) || null;

  // Load from Supabase
  // Allow parent to trigger a wipe of local shop state after DB wipe
  React.useEffect(() => {
    if (onWipeShops) onWipeShops.current = () => { setShops([]); setActiveShopId(null); };
  }, [onWipeShops]);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      const saved = data?.settings?.shops_v2 || [];
      if (saved.length > 0) {
        setShops(saved);
        setActiveShopId(saved[0].id);
      } else {
        // Migrate old shop_configs if present
        const oldConfigs = data?.settings?.shop_configs || [];
        if (oldConfigs.length > 0) {
          const migrated = oldConfigs.map((c, i) => ({ id: String(Date.now() + i), name: c.name, open: false, items: c.items || [] }));
          setShops(migrated);
          setActiveShopId(migrated[0].id);
          persistShops(migrated);
        }
      }
      setLoaded(true);
    });
  }, []);

  const persistShops = async (updatedShops) => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    await supabase.from('games').update({ settings: { ...(current?.settings || {}), shops_v2: updatedShops } }).eq('id', GAME_ID);
  };

  const updateShops = (updatedShops) => {
    setShops(updatedShops);
    persistShops(updatedShops);
  };

  // Shop management
  const createShop = () => {
    const name = newShopName.trim() || 'New Shop';
    const shop = newShop(name, newShopMarkupTier);
    const updated = [...shops, shop];
    updateShops(updated);
    setActiveShopId(shop.id);
    setNewShopName('');
    setNewShopMarkupTier('fair');
    setShowNewShop(false);
  };

  const deleteShop = (id) => {
    const updated = shops.filter(s => s.id !== id);
    updateShops(updated);
    if (activeShopId === id) setActiveShopId(updated[0]?.id || null);
  };

  const toggleShopOpen = (id) => {
    const updated = shops.map(s => s.id === id ? { ...s, open: !s.open } : s);
    updateShops(updated);
  };

  const renameShop = (id, name) => {
    const updated = shops.map(s => s.id === id ? { ...s, name } : s);
    updateShops(updated);
    setEditingShopName(false);
  };

  const loadBundle = (bundleName) => {
    if (!activeShop || !bundleName) return;
    const tier = activeShop.markup_tier || 'fair';
    const bundleItems = BUNDLE_PRESETS[bundleName].items.map(i => ({
      ...i,
      markup: randomMarkup(tier), // assign unique markup per item
    }));
    const existing = activeShop.items || [];
    const existingNames = new Set(existing.map(i => i.name));
    const newItems = bundleItems.filter(i => !existingNames.has(i.name));
    updateActiveShop({ items: [...existing, ...newItems] });
  };

  const updateActiveShop = (patch) => {
    const updated = shops.map(s => s.id === activeShopId ? { ...s, ...patch } : s);
    updateShops(updated);
  };

  const updateActiveItems = (newItems) => updateActiveShop({ items: newItems });

  const toggleItemVisible = (idx) => {
    const items = activeShop.items.map((item, i) => i === idx ? { ...item, visible: !item.visible } : item);
    updateActiveItems(items);
  };

  const setItemQuality = (idx, quality) => {
    const items = activeShop.items.map((item, i) => i === idx ? { ...item, quality } : item);
    updateActiveItems(items);
  };

  const setItemDescription = (idx, description) => {
    const items = activeShop.items.map((item, i) => i === idx ? { ...item, description } : item);
    updateActiveItems(items);
  };

  const randomizeShop = () => {
    if (!activeShop) return;
    const shopName = activeShop.name.toLowerCase();
    const THEME_MAP = {
      'weapons': 'Weapons Dealer', 'armor': 'Armorer', 'apothecary': 'Apothecary',
      'general': 'General Goods', 'black': 'Black Market', 'outfitter': 'Outfitter',
      'scribe': 'Scribe', 'superior': 'Superior Weapons', 'sahir': 'Sahir Emporium',
    };
    let presetKey;
    if (randomTheme !== 'auto') {
      presetKey = THEME_MAP[randomTheme] || 'General Goods';
    } else {
      // Auto-detect from shop name
      const keywords = {
        'weapon': 'Weapons Dealer', 'sword': 'Weapons Dealer', 'blade': 'Weapons Dealer', 'arms': 'Weapons Dealer',
        'armor': 'Armorer', 'armour': 'Armorer', 'shield': 'Armorer',
        'apothecary': 'Apothecary', 'medicine': 'Apothecary', 'herb': 'Apothecary',
        'general': 'General Goods', 'supply': 'General Goods', 'market': 'General Goods', 'bazaar': 'General Goods',
        'black': 'Black Market', 'shadow': 'Black Market', 'fence': 'Black Market', 'poison': 'Black Market',
        'cloth': 'Outfitter', 'tailor': 'Outfitter', 'outfit': 'Outfitter',
        'scribe': 'Scribe', 'scroll': 'Scribe', 'book': 'Scribe',
        'superior': 'Superior Weapons', 'sahir': 'Sahir Emporium', 'magic': 'Sahir Emporium',
      };
      const match = Object.entries(keywords).find(([kw]) => shopName.includes(kw));
      presetKey = match ? match[1] : Object.keys(BUNDLE_PRESETS)[Math.floor(Math.random() * Object.keys(BUNDLE_PRESETS).length)];
    }
    const preset = BUNDLE_PRESETS[presetKey] || Object.values(BUNDLE_PRESETS)[3];
    // Build items with random variation
    const baseItems = preset.items.map(item => ({ ...item, visible: true }));
    // Apply quality setting
    if (randomQuality === 'fine') {
      // Upgrade 2-4 random items to fine
      const count = 2 + Math.floor(Math.random() * 3);
      const indices = [...Array(baseItems.length).keys()].sort(() => Math.random() - 0.5).slice(0, count);
      indices.forEach(i => { baseItems[i] = { ...baseItems[i], quality: 'fine' }; });
    } else if (randomQuality === 'superior') {
      baseItems.forEach((_, i) => { baseItems[i] = { ...baseItems[i], quality: 'fine' }; });
      const superIdx = Math.floor(Math.random() * baseItems.length);
      baseItems[superIdx] = { ...baseItems[superIdx], quality: 'superior' };
    } else {
      // standard: upgrade exactly one random item to fine
      const upgradeIdx = Math.floor(Math.random() * baseItems.length);
      baseItems[upgradeIdx] = { ...baseItems[upgradeIdx], quality: 'fine' };
    }
    // Randomize prices ±20%
    baseItems.forEach((item, i) => {
      if (item.price && !isNaN(item.price)) {
        const variance = 0.8 + Math.random() * 0.4;
        baseItems[i] = { ...item, price: Math.round(Number(item.price) * variance) };
      }
    });
    updateActiveShop({ items: baseItems });
  };

  const removeItem = (idx) => {
    updateActiveItems(activeShop.items.filter((_, i) => i !== idx));
  };

  const addCustomItem = () => {
    if (!customName.trim() || !activeShop) return;
    const item = { name: customName.trim(), price: customPrice || '?', dr: customDr, quality: customQuality, visible: true, is_magic: false };
    updateActiveItems([...(activeShop.items || []), item]);
    setCustomName(''); setCustomPrice(''); setCustomDr(''); setCustomQuality('standard');
  };

  const rarityPrices = { uncommon: '20 copper', rare: '50 copper', legendary: '150 copper', artifact: '500 copper' };

  const addMagicItemToShop = (item) => {
    if (!activeShop) return;
    const shopItem = { ...item, price: rarityPrices[item.rarity] || '50 copper', quality: 'fine', visible: true };
    updateActiveItems([...(activeShop.items || []), shopItem]);
  };

  const addMagicItemToShopById = (shopId, item) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    const shopItem = { ...item, price: rarityPrices[item.rarity] || '50 copper', quality: 'fine', visible: true };
    const updated = shops.map(s => s.id === shopId ? { ...s, items: [...(s.items || []), shopItem] } : s);
    setShops(updated);
    persistShops(updated);
  };

  const handlePurchase = (item, useBaseCost = false) => {
    const qTier = QUALITY_TIERS.find(t => t.key === (item.quality || 'standard')) || QUALITY_TIERS[1];
    const displayName = item.is_magic ? item.name : (item.quality && item.quality !== 'standard' ? `${qTier.label} ${item.name}` : item.name);
    // If haggling succeeded (useBaseCost), use base price; otherwise use marked-up price
    const displayedPrice = item.markup && !useBaseCost ? applyMarkup(item.price, item.markup) : item.price;
    const price = item.is_magic ? (item.price || '?') : qualityPrice(displayedPrice, item.quality);
    const copperAmt = parseCopperAmount(useBaseCost ? item.price : (item.markup ? applyMarkup(item.price, item.markup) : item.price), item.quality);
    const destName = purchaseTarget === 'party' ? 'Party' : (characters || []).find(c => c.id === purchaseTarget)?.name || 'Character';

    // Check if enough funds
    if (copperAmt > 0) {
      const availableCopper = purchaseTarget === 'party'
        ? (inventory?.copper || 0)
        : ((characters || []).find(c => c.id === purchaseTarget)?.copper || 0);
      if (availableCopper < copperAmt) {
        setInsufficientFunds({ needed: copperAmt, have: availableCopper, item: displayName });
        return; // block purchase
      }
    }

    const itemEntry = item.is_magic
      ? { ...item, equipped: false, inUse: false }
      : { name: displayName, dr: item.dr || undefined, equipped: false, inUse: false, quality: item.quality, qty: 1, category: 'Gear' };

    if (purchaseTarget === 'party') {
      onUpdateInventory({ items: [...(inventory.items || []), { ...itemEntry, qty: 1, category: item.is_magic ? 'Magic' : 'Gear' }] });
    } else {
      const char = (characters || []).find(c => c.id === purchaseTarget);
      if (char) onUpdateCharacter(purchaseTarget, { equipment: [...(char.equipment || []), itemEntry] });
    }

    if (onPurchase) {
      onPurchase({ itemName: displayName, price, copperAmt, destination: purchaseTarget, destName });
    }
  };

  const pcChars = (characters || []).filter(c => !c.is_npc);

  // What players see: only open shops with visible items
  if (!gmView) {
    const openShops = shops.filter(s => s.open);
    if (openShops.length === 0) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          <i className="ti ti-shopping-cart" style={{ fontSize: 32, display: 'block', marginBottom: '.5rem', opacity: 0.3 }} />
          No shops are open right now.
        </div>
      );
    }
    // Copper balance and insufficient funds logic
    const myChar = characters?.find(c => c.id === myCharId);
    const targetCopper = purchaseTarget === 'party'
      ? (inventory?.copper || 0)
      : ((characters || []).find(c => c.id === purchaseTarget)?.copper || 0);

    return (
      <div style={{ position: 'relative' }}>
        {/* Insufficient funds popup */}
        {insufficientFunds && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg-panel)', border: '2px solid var(--red)', borderRadius: 8, padding: '2rem', maxWidth: 300, textAlign: 'center', boxShadow: '0 0 24px rgba(200,50,40,.3)' }}>
              <div style={{ fontSize: 32, marginBottom: '.5rem' }}>🪙</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)', marginBottom: '.5rem' }}>Not Enough Coin</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                <strong>{insufficientFunds.item}</strong><br />
                costs <strong style={{ color: 'var(--gold)' }}>{insufficientFunds.needed} copper</strong><br />
                but you only have <strong style={{ color: 'var(--red)' }}>{insufficientFunds.have} copper</strong>.
              </div>
              <button className="btn" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => setInsufficientFunds(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        {/* Copper balance — large watermark top left */}
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0, lineHeight: 1 }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--gold)', opacity: 0.15, userSelect: 'none' }}>
            🪙 {targetCopper}
          </div>
          <div style={{ fontSize: 10, color: 'var(--gold-dim)', opacity: 0.6, marginTop: -4, paddingLeft: 2 }}>
            {purchaseTarget === 'party' ? 'Party funds' : 'Personal funds'}
          </div>
        </div>
        <div style={{ paddingLeft: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ marginLeft: 88 }}><i className="ti ti-shopping-cart" style={{ marginRight: 8 }} />The Bazaar</span>
          {onRoll && (() => {
            const appraisalSkill = myChar ? (myChar.skills || []).find(s => s.name === 'Appraisal') : null;
            const canAppraise = myGrantedActions > 0 || appraisalSkill;
            if (!canAppraise) return null;
            const hasAppraised = !!appraisalResult;
            return (
              <button className="btn btn-sm" style={{ fontSize: 12, borderColor: hasAppraised ? 'var(--green)' : 'var(--gold-dim)', color: hasAppraised ? 'var(--green)' : 'var(--gold)' }}
                title={myGrantedActions > 0 ? 'Use a granted action to appraise shop goods' : 'Roll Appraisal to assess item value and quality'}
                onClick={() => {
                  onRoll({
                    skill: 'Appraisal', tn: 15, character: myChar,
                    baseRoll: (appraisalSkill?.rank || 0) + (myChar?.perception || myChar?.awareness || 2),
                    baseKeep: myChar?.water || myChar?.air || 2,
                    label: 'Appraisal — assess shop goods',
                    onComplete: (total, raises) => {
                      if (total >= 15) {
                        setAppraisalResult({ revealQuality: true, revealTrueCost: (raises || 0) >= 1 });
                        setLastActionWasAppraise(true);
                        if (myGrantedActions > 0 && onSpendGrantedAction) onSpendGrantedAction();
                        if (onLogEvent) onLogEvent('ti-zoom-money', `${myChar?.name || 'Player'} appraised the shop — quality revealed${raises >= 1 ? ', true costs revealed' : ''}`);
                      } else {
                        setLastActionWasAppraise(true);
                        if (myGrantedActions > 0 && onSpendGrantedAction) onSpendGrantedAction();
                        if (onLogEvent) onLogEvent('ti-zoom-money', `${myChar?.name || 'Player'} failed to appraise the shop`);
                      }
                    },
                  });
                }}>
                <i className="ti ti-zoom-money" style={{ marginRight: 4 }} />
                {hasAppraised ? '✓ Appraised' : `Appraise${appraisalSkill ? ` (${appraisalSkill.rank})` : ''}${myGrantedActions > 0 ? ' — uses granted action' : ''}`}
              </button>
            );
          })()}
        </div>
        <div style={{ marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Purchases go to:</span>
          <select value={purchaseTarget} onChange={e => setPurchaseTarget(e.target.value)} style={{ fontSize: 12 }}>
            <option value="party">Party Inventory</option>
            {pcChars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {openShops.map(shop => {
          const visItems = shop.items.filter(i => i.visible);
          return (
            <div key={shop.id} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-store" style={{ fontSize: 14 }} />{shop.name}
              </div>
              <div className="card">
                {visItems.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Nothing on display.</div>}
                {visItems.map((item, i) => {
                  const qTier = QUALITY_TIERS.find(t => t.key === (item.quality || 'standard')) || QUALITY_TIERS[1];
                  // Price: show marked-up price to players unless appraise revealed true cost
                  const basePrice = item.is_magic ? (item.price || '?') : qualityPrice(item.price, item.quality);
                  const markedPrice = item.markup ? applyMarkup(qualityPrice(item.price, item.quality), item.markup) : basePrice;
                  const shownPrice = (appraisalResult?.revealTrueCost) ? basePrice : markedPrice;
                  // Quality: only show if appraised
                  const showQuality = !!(appraisalResult?.revealQuality);
                  const canHaggle = myGrantedActions > 0 && !item.is_magic;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.35rem 0', borderBottom: '1px solid rgba(107,78,40,.2)', flexWrap: 'wrap' }}>
                      {item.is_magic ? (
                        <div style={{ flex: 1 }}><MagicItemBadge item={item} compact /></div>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                              {showQuality && item.quality && item.quality !== 'standard'
                                ? <span style={{ color: qTier.color }}>{qTier.label} </span>
                                : null}
                              {item.name}
                              {item.dr && <span style={{ fontSize: 11, color: 'var(--gold-dim)', marginLeft: 5 }}>{item.dr}</span>}
                            </span>
                          </div>
                          {(() => {
                            const weapon = WEAPONS_LIST.find(w => w.name === item.name);
                            const rulebookText = GEAR_DESCRIPTIONS[item.name] ||
                              (weapon ? `${weapon.dr ? `DR ${weapon.dr} · ` : ''}${weapon.skill}${weapon.special ? ' · ' + weapon.special : ''}` : null);
                            return (rulebookText || item.description) ? (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.5 }}>
                                {rulebookText && <span style={{ display: 'block', fontStyle: 'italic' }}>{rulebookText}</span>}
                                {item.description && <span style={{ display: 'block', color: 'var(--text-secondary)' }}>{item.description}</span>}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                      <span style={{ fontSize: 12, color: appraisalResult?.revealTrueCost ? 'var(--green)' : qTier.color, fontWeight: 600, minWidth: 65, textAlign: 'right' }}>
                        {shownPrice}
                        {appraisalResult?.revealTrueCost && item.markup && item.markup > 1.03 && (
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block' }}>true cost</span>
                        )}
                      </span>
                      <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => handlePurchase(item)}>Buy</button>
                      {canHaggle && (
                        <button className="btn btn-sm" style={{ fontSize: 11, borderColor: '#a060e0', color: '#c080f0' }}
                          title={`Haggle — Commerce/Awareness vs TN ${shop.haggle_tn || 15}${lastActionWasAppraise ? ' (+1k0 from Appraise)' : ''}`}
                          onClick={() => {
                            const myChar = characters?.find(c => c.id === myCharId);
                            const commerceSkill = (myChar?.skills || []).find(s => s.name === 'Commerce');
                            const awareness = myChar?.awareness || 2;
                            const air = myChar?.air || 2;
                            const baseRoll = (commerceSkill?.rank || 0) + awareness + (lastActionWasAppraise ? 1 : 0);
                            const baseKeep = air;
                            const tn = shop.haggle_tn || 15;
                            setHagglingItem(item);
                            setLastActionWasAppraise(false);
                            if (onSpendGrantedAction) onSpendGrantedAction();
                            onRoll({
                              skill: 'Commerce (Haggle)',
                              tn,
                              baseRoll,
                              baseKeep,
                              character: myChar,
                              bonusNotes: lastActionWasAppraise ? ['+1k0 from Appraise'] : [],
                              onComplete: (total, raises) => {
                                if (total >= tn) {
                                  handlePurchase(item, true); // buy at base cost
                                  if (onLogEvent) onLogEvent('ti-coins', `${myChar?.name || 'Player'} haggled successfully — bought at true cost!`);
                                } else {
                                  handlePurchase(item, false); // pay marked price
                                  if (onLogEvent) onLogEvent('ti-coins', `${myChar?.name || 'Player'} failed to haggle — paid asking price.`);
                                }
                                setHagglingItem(null);
                              },
                            });
                          }}>
                          Haggle
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    );
  }

  // GM VIEW
  return (
    <div>
      {showPoisonRef && <PoisonReferenceModal onClose={() => setShowPoisonRef(false)} />}
      {showCatalogue && activeShop && (
        <ShopCatalogue
          onClose={() => setShowCatalogue(false)}
          onAdd={(items) => {
            updateActiveItems([...(activeShop.items || []), ...items]);
            setShowCatalogue(false);
          }}
        />
      )}
      {showMagicCreator && (
        <MagicItemCreator
          onClose={() => setShowMagicCreator(false)}
          characters={pcChars}
          shops={shops}
          onCreateForShop={shops.length > 0 ? addMagicItemToShopById : undefined}
          onCreateForParty={(item) => {
            onUpdateInventory({ items: [...(inventory.items || []), { ...item, qty: 1, category: 'Magic' }] });
          }}
          onCreateForCharacter={(charId, item) => {
            const char = characters.find(c => c.id === charId);
            if (char) onUpdateCharacter(charId, { equipment: [...(char.equipment || []), { ...item, equipped: true, inUse: false }] });
          }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>
          <i className="ti ti-shopping-cart" style={{ marginRight: 8 }} />The Bazaar
        </div>
        <button className="btn btn-sm" style={{ fontSize: 11, borderColor: 'rgba(160,100,220,.5)', color: '#c0a0e0' }}
          onClick={() => setShowMagicCreator(true)}>
          ✦ Create Magic Item
        </button>
        {activeShop && (activeShop.name === 'Black Market' || activeShop.name.toLowerCase().includes('apothecary') || activeShop.name.toLowerCase().includes('black')) && (
          <button className="btn btn-sm" style={{ fontSize: 11, borderColor: '#6a3a3a', color: '#c08040' }}
            onClick={() => setShowPoisonRef(true)}>⚗ Poisons</button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          {shops.filter(s => s.open).length} shop{shops.filter(s => s.open).length !== 1 ? 's' : ''} open to players
        </div>
      </div>

      {/* Shop tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        {shops.map(shop => (
          <div key={shop.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button onClick={() => setActiveShopId(shop.id)} style={{
              padding: '.3rem .6rem', borderRadius: '4px 0 0 4px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
              background: activeShopId === shop.id ? 'rgba(200,150,42,.15)' : 'var(--bg-panel)',
              border: `1px solid ${activeShopId === shop.id ? 'var(--gold-dim)' : 'var(--border)'}`,
              borderRight: 'none',
              color: activeShopId === shop.id ? 'var(--gold)' : 'var(--text-muted)',
              fontWeight: activeShopId === shop.id ? 600 : 400,
            }}>
              <span style={{ fontSize: 9, marginRight: 4, color: shop.open ? 'var(--green)' : '#555' }}>{shop.open ? '●' : '○'}</span>
              {shop.name}
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>({shop.items.length})</span>
            </button>
            {/* Toggle open/close */}
            <button onClick={() => toggleShopOpen(shop.id)} title={shop.open ? 'Close shop' : 'Open to players'} style={{
              padding: '.3rem .35rem', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
              background: shop.open ? 'rgba(74,138,64,.15)' : 'var(--bg-panel)',
              border: `1px solid ${shop.open ? 'var(--green)' : 'var(--border)'}`,
              borderRight: activeShopId === shop.id ? '1px solid var(--gold-dim)' : '1px solid var(--border)',
              color: shop.open ? 'var(--green)' : 'var(--text-muted)',
            }}>
              {shop.open ? '👁' : '🚫'}
            </button>
            {/* Delete (only when active) */}
            {activeShopId === shop.id && shops.length > 1 && (
              <button onClick={() => deleteShop(shop.id)} title="Delete this shop" style={{
                padding: '.3rem .35rem', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                background: 'var(--bg-panel)', border: `1px solid var(--border)`, borderLeft: 'none', borderRadius: '0 4px 4px 0',
                color: 'var(--red)',
              }}>×</button>
            )}
            {activeShopId !== shop.id && (
              <div style={{ width: 4, borderRadius: '0 4px 4px 0', border: '1px solid var(--border)', borderLeft: 'none', background: 'var(--bg-panel)', height: '100%' }} />
            )}
          </div>
        ))}
        {/* New shop */}
        {showNewShop ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={newShopName} onChange={e => setNewShopName(e.target.value)}
              placeholder="Shop name" autoFocus style={{ fontSize: 12, padding: '3px 7px', width: 120 }}
              onKeyDown={e => { if (e.key === 'Enter') createShop(); if (e.key === 'Escape') setShowNewShop(false); }} />
            <select value={newShopMarkupTier} onChange={e => setNewShopMarkupTier(e.target.value)} style={{ fontSize: 12, padding: '3px 5px' }}>
              <option value="fair">Fair (1-3% over)</option>
              <option value="medium">Medium (5-20% over)</option>
              <option value="high">High (1-50% over)</option>
            </select>
            <button className="btn btn-sm btn-p" style={{ fontSize: 11 }} onClick={createShop}>Create</button>
            <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowNewShop(false)}>✕</button>
          </div>
        ) : (
          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowNewShop(true)}>+ New Shop</button>
        )}
      </div>

      {/* No shops yet */}
      {!loaded && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading…</div>}
      {loaded && shops.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
          No shops yet. Create one above.
        </div>
      )}

      {activeShop && (
        <>
          {/* Active shop controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
            {/* Rename */}
            {editingShopName ? (
              <>
                <input value={shopNameInput} onChange={e => setShopNameInput(e.target.value)} autoFocus
                  style={{ fontSize: 13, padding: '2px 6px', width: 150 }}
                  onKeyDown={e => { if (e.key === 'Enter') renameShop(activeShopId, shopNameInput); if (e.key === 'Escape') setEditingShopName(false); }} />
                <button className="btn btn-sm btn-p" style={{ fontSize: 11 }} onClick={() => renameShop(activeShopId, shopNameInput)}>✓ Rename</button>
                <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setEditingShopName(false)}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => { setShopNameInput(activeShop.name); setEditingShopName(true); }}>✎ Rename</button>
            )}

            {/* Load bundle */}
            <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowCatalogue(true)}>
              <i className="ti ti-layout-list" style={{ marginRight: 4, fontSize: 11 }} />Stock from Catalogue
            </button>
            <select defaultValue="" onChange={e => { if (e.target.value) loadBundle(e.target.value); e.target.value = ''; }}
              style={{ fontSize: 11, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3, padding: '2px 4px' }}>
              <option value="">Quick bundle preset…</option>
              <optgroup label="── Standard Shops ──">
                {Object.entries(BUNDLE_PRESETS).filter(([,b]) => b.tier === 'standard').map(([name]) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </optgroup>
              <optgroup label="── Superior Shops ──">
                {Object.entries(BUNDLE_PRESETS).filter(([,b]) => b.tier === 'superior').map(([name]) => (
                  <option key={name} value={name}>★ {name}</option>
                ))}
              </optgroup>
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* GM-only: haggle TN and markup tier */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <span title="Hidden from players — the TN for haggling rolls">Haggle TN:</span>
                <input type="number" min={5} max={50} value={activeShop.haggle_tn || 15} style={{ width: 44, fontSize: 11, padding: '1px 4px' }}
                  onChange={e => updateActiveShop({ haggle_tn: parseInt(e.target.value) || 15 })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <span title="Markup tier — affects how much prices are inflated">Markup:</span>
                <select value={activeShop.markup_tier || 'fair'} onChange={e => updateActiveShop({ markup_tier: e.target.value })} style={{ fontSize: 11 }}>
                  <option value="fair">Fair (1-3%)</option>
                  <option value="medium">Medium (5-20%)</option>
                  <option value="high">High (1-50%)</option>
                </select>
              </div>
              <span style={{ fontSize: 11, color: activeShop.open ? 'var(--green)' : 'var(--text-muted)' }}>
                {activeShop.open ? '● Open' : '○ Hidden'}
              </span>
            </div>
          </div>

          {/* Purchase destination */}
          <div style={{ marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Purchases go to:</span>
            <select value={purchaseTarget} onChange={e => setPurchaseTarget(e.target.value)} style={{ fontSize: 12 }}>
              <option value="party">Party Inventory</option>
              {pcChars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Items */}
          <div className="card">
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
              👁 = visible to players · quality per-item · Buy tests your copper balance
            </div>

            {(activeShop.items || []).length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.3rem 0' }}>
                No items — use <strong>Stock from Catalogue</strong> above to pick what this shop carries, or add custom items below.
              </div>
            )}

            {(activeShop.items || []).map((item, idx) => {
              const qTier = QUALITY_TIERS.find(t => t.key === (item.quality || 'standard')) || QUALITY_TIERS[1];
              const price = item.is_magic ? (item.price || '?') : qualityPrice(item.price, item.quality);
              return (
                <div key={idx} style={{ padding: '.35rem 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
                    <input type="checkbox" checked={!!item.visible} onChange={() => toggleItemVisible(idx)}
                      style={{ accentColor: 'var(--gold)', flexShrink: 0 }} title="Show to players" />
                    {item.is_magic ? (
                      <div style={{ flex: 1 }}><MagicItemBadge item={item} compact /></div>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', minWidth: 80 }}>
                          {item.name}
                          {item.dr && <span style={{ fontSize: 11, color: 'var(--gold-dim)', marginLeft: 5 }}>{item.dr}</span>}
                        </span>
                        <select value={item.quality || 'standard'} onChange={e => setItemQuality(idx, e.target.value)}
                          style={{ fontSize: 10, padding: '1px 2px', background: 'var(--bg-panel)', border: `1px solid ${qTier.color}`, color: qTier.color, borderRadius: 3, maxWidth: 85 }}>
                          {QUALITY_TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                      </>
                    )}
                    <span style={{ fontSize: 12, color: qTier.color, fontWeight: 600, minWidth: 65, textAlign: 'right' }}>{price}</span>
                    <button className="btn btn-sm" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => handlePurchase(item)}>Buy</button>
                    <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => removeItem(idx)}>×</button>
                  </div>
                  {!item.is_magic && (
                    <input
                      value={item.description || ''}
                      onChange={e => setItemDescription(idx, e.target.value)}
                      placeholder="Item description (optional)…"
                      style={{ width: '100%', fontSize: 11, marginTop: 3, boxSizing: 'border-box', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', color: 'var(--text-muted)' }}
                    />
                  )}
                </div>
              );
            })}

            {/* Randomize shop */}
            <div style={{ marginBottom: '.5rem', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={randomTheme} onChange={e => setRandomTheme(e.target.value)}
                style={{ fontSize: 11, padding: '2px 4px', background: 'var(--bg-panel)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 3 }}>
                <option value="auto">Auto theme</option>
                <option value="weapons">Weapons</option>
                <option value="armor">Armor</option>
                <option value="apothecary">Apothecary</option>
                <option value="general">General Goods</option>
                <option value="black">Black Market</option>
                <option value="outfitter">Outfitter</option>
                <option value="scribe">Scribe</option>
                <option value="superior">Superior Weapons</option>
                <option value="sahir">Sahir Emporium</option>
              </select>
              <select value={randomQuality} onChange={e => setRandomQuality(e.target.value)}
                style={{ fontSize: 11, padding: '2px 4px', background: 'var(--bg-panel)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 3 }}>
                <option value="standard">Standard quality</option>
                <option value="fine">Fine (several upgraded)</option>
                <option value="superior">Superior (all fine + one superior)</option>
              </select>
              <button className="btn btn-sm" style={{ fontSize: 11, borderColor: 'rgba(200,150,42,.4)', color: 'var(--gold-dim)' }}
                onClick={randomizeShop}>
                🎲 Randomize
              </button>
            </div>

            {/* Add custom item */}
            <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.35rem' }}>Add custom item</div>
              <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Item name" value={customName} onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomItem()} style={{ flex: 1, minWidth: 100 }} />
                <input placeholder="Price" value={customPrice} onChange={e => setCustomPrice(e.target.value)} style={{ width: 85 }} />
                <input placeholder="DR" value={customDr} onChange={e => setCustomDr(e.target.value)} style={{ width: 60 }} />
                <select value={customQuality} onChange={e => setCustomQuality(e.target.value)}
                  style={{ fontSize: 11, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3 }}>
                  {QUALITY_TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
                <button className="btn btn-sm btn-p" disabled={!customName.trim()} onClick={addCustomItem}>Add</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
