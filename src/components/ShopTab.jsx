import React, { useState, useEffect } from 'react';
import { WEAPONS_LIST, GEAR_LIST, GEAR_DESCRIPTIONS, GAME_ID, POISONS_LIST, SHIELDS } from '../data/constants';
import PoisonReferenceModal from './PoisonReferenceModal';
import { MagicItemBadge } from './MagicItemCreator';
import { RulebookEntryButton } from './UI';
import { supabase } from '../lib/supabase';
import { rollExplodingKeep } from '../lib/utils';

const QUALITY_TIERS = [
  { key: 'poor',       label: 'Poor',       mult: 0.5,  color: '#6a5a40' },
  { key: 'standard',   label: 'Standard',   mult: 1,    color: '#8a7a50' },
  { key: 'fine',       label: 'Fine',       mult: 2,    color: '#c0a030' },
  { key: 'masterwork', label: 'Masterwork', mult: 4,    color: '#e0c060' },
];

// Helper to make a shop item from a weapon. rarity: 'always' | 'common' | 'uncommon' | 'rare'
const wItem = (name, quality='standard', rarity='common') => {
  const w = WEAPONS_LIST.find(x => x.name === name);
  return { name, price: w?.price?.replace('c','0 copper') || '5 copper', dr: w?.dr || '', quality, visible: true, is_magic: false, rarity };
};
// Helper to make a shop item from gear
const gItem = (name, price='2 copper', quality='standard', rarity='common') => ({ name, price, dr: '', quality, visible: true, is_magic: false, rarity });
// Helper to make a shop item from a shield - price/stats pulled from SHIELDS data in constants.js
const sItem = (name, quality='standard', rarity='common') => {
  const s = SHIELDS.find(x => x.name === name);
  const priceStr = s?.price?.endsWith('c') ? s.price.replace('c', ' copper') : (s?.price || '10 copper');
  return { name, price: priceStr, dr: '', quality, visible: true, is_magic: false, rarity };
};

// Rarity → inclusion chance when randomizing a shop's stock
const RARITY_CHANCE = { always: 1, common: 0.85, uncommon: 0.5, rare: 0.2 };

const BUNDLE_PRESETS = {
  // ── Standard shops ──────────────────────────────────────────────────────
  'Weapons Dealer': { icon: 'ti-sword', tier: 'standard', items: [
    wItem('Longsword', 'standard', 'always'), wItem('Scimitar', 'standard', 'always'), wItem('Shortsword', 'standard', 'common'),
    wItem('Knife', 'standard', 'always'), wItem('Jambiya', 'standard', 'common'),
    wItem('Spear', 'standard', 'common'), wItem('Staff', 'standard', 'uncommon'), wItem('Heavy Club', 'standard', 'uncommon'),
    wItem('War Axe', 'standard', 'uncommon'), wItem('Standard Bow', 'standard', 'always'), wItem('Shortbow', 'standard', 'common'),
    wItem('Kindjal', 'standard', 'uncommon'),
    // Ammo and weapon-shop staples - always stocked, every weapons dealer needs arrows.
    // All four ARROW_TYPES bundles, not just the standard quiver - combat automation (Nock,
    // Armor Piercing, Flesh Cutter, Signal) keys off these exact names.
    gItem('Quiver (60 arrows)', '2 copper', 'standard', 'always'),
    gItem('Armor Piercing Arrows (20)', '4 copper', 'standard', 'always'),
    gItem('Flesh Cutter Arrows (20)', '5 copper', 'standard', 'always'),
    gItem('Signal Arrows (10)', '10 copper', 'standard', 'always'),
    gItem('Whetstone', '1 copper', 'standard', 'common'),
    // Shields - a weapons dealer plausibly stocks them alongside blades and bows
    sItem('Large Wooden Shield', 'standard', 'common'), sItem('Scutum', 'standard', 'uncommon'), sItem('Parma', 'standard', 'common'),
  ]},
  'Armorer': { icon: 'ti-shield', tier: 'standard', items: [
    gItem('Partial Armor (+3 TN)', '10 copper', 'standard', 'always'), gItem('Light Armor (+5 TN)', '20 copper', 'standard', 'always'),
    gItem('Heavy Armor (+10 TN)', '40 copper', 'standard', 'common'), gItem('Riding Armor (+8 TN)', '30 copper', 'standard', 'uncommon'),
    // Shields - an armorer is the other natural place to stock them, guaranteed here
    sItem('Large Wooden Shield', 'standard', 'always'), sItem('Scutum', 'standard', 'common'), sItem('Parma', 'standard', 'always'),
  ]},
  'Apothecary': { icon: 'ti-flask', tier: 'standard', items: [
    gItem('Medicine Kit', '5 copper', 'standard', 'always'), gItem('Apothecary Kit', '8 copper', 'standard', 'common'),
    gItem('Traveling Rations', '1 copper', 'standard', 'always'), gItem('Water Skin', '1 copper', 'standard', 'always'),
    gItem('Rope (50 ft)', '1 copper', 'standard', 'common'), gItem('Lantern', '2 copper', 'standard', 'common'),
    gItem('Lantern Oil', '1 copper', 'standard', 'common'), gItem('Torch', '1 copper', 'standard', 'always'),
    gItem('Oil Lamp', '1 copper', 'standard', 'common'), gItem('Flint and Steel', '1 copper', 'standard', 'always'),
  ]},
  'General Goods': { icon: 'ti-backpack', tier: 'standard', items: [
    gItem('Backpack', '2 copper', 'standard', 'always'), gItem('Traveling Cloak', '3 copper', 'standard', 'common'),
    gItem('Suit of Clothes', '2 copper', 'standard', 'always'), gItem('Sandals', '1 copper', 'standard', 'always'),
    gItem('Blanket', '1 copper', 'standard', 'always'), gItem('Rope (50 ft)', '1 copper', 'standard', 'common'),
    gItem('Lantern', '2 copper', 'standard', 'common'), gItem('Lantern Oil', '1 copper', 'standard', 'common'),
    gItem('Torch', '1 copper', 'standard', 'always'), gItem('Oil Lamp', '1 copper', 'standard', 'common'),
    gItem('Flint and Steel', '1 copper', 'standard', 'always'), gItem('Water Skin', '1 copper', 'standard', 'always'),
    gItem('Tent (small)', '5 copper', 'standard', 'uncommon'), gItem('Traveling Rations', '1 copper', 'standard', 'always'),
    gItem('Grapple Hook', '3 copper', 'standard', 'uncommon'),
  ]},
  'Black Market': { icon: 'ti-eye-off', tier: 'standard', items: [
    gItem('Lockpicks', '5 copper', 'standard', 'common'), gItem('Generic Poison (dose)', '8 copper', 'standard', 'common'),
    gItem('Fire Biter (dose)', '15 copper', 'standard', 'uncommon'), gItem('Night Milk (dose)', '12 copper', 'standard', 'common'),
    gItem('Snake Venom (dose)', '15 copper', 'standard', 'uncommon'), gItem('Spider Venom (dose)', '10 copper', 'standard', 'common'),
    gItem('Blinding Dust (dose)', '5 copper', 'standard', 'common'), gItem('Poison Powder (dose)', '10 copper', 'standard', 'common'),
    gItem('Wish You Dead (dose)', '40 copper', 'standard', 'rare'), gItem('Stolen Breath (dose)', '20 copper', 'standard', 'uncommon'),
    gItem('Hot Madness (dose)', '20 copper', 'standard', 'uncommon'),
    wItem('Knife', 'standard', 'common'), wItem('Kindjal', 'standard', 'uncommon'),
  ]},
  'Outfitter': { icon: 'ti-hanger', tier: 'standard', items: [
    gItem('Suit of Clothes', '2 copper', 'standard', 'always'), gItem('Fine Clothes', '8 copper', 'standard', 'common'),
    gItem('Traveling Cloak', '3 copper', 'standard', 'common'), gItem('Sandals', '1 copper', 'standard', 'always'),
    gItem('Shoes', '2 copper', 'standard', 'common'), gItem('Backpack', '2 copper', 'standard', 'common'),
    gItem('Coin Purse', '1 copper', 'standard', 'common'), gItem('Blanket', '1 copper', 'standard', 'common'),
    gItem('Tent (small)', '5 copper', 'standard', 'uncommon'),
  ]},
  'Scribe': { icon: 'ti-pencil', tier: 'standard', items: [
    gItem('Calligraphy Kit', '5 copper', 'standard', 'always'), gItem('Book / Scroll', '3 copper', 'standard', 'common'),
    gItem('Writing Paper', '1 copper', 'standard', 'always'), gItem('Personal Seal', '8 copper', 'standard', 'uncommon'),
  ]},
  'Stables': { icon: 'ti-paw', tier: 'standard', items: [
    // Camel: common, practical, but still a real purchase - roughly 1.5x Heavy Armor
    gItem('Camel', '60 copper', 'standard', 'always'),
    // Horse: rare status symbol, not native to the region - well above anything else in the shop
    gItem('Horse', '150 copper', 'fine', 'rare'),
    gItem('Saddle', '5 copper', 'standard', 'always'),
    gItem('Saddlebags', '3 copper', 'standard', 'common'),
    gItem('Bridle and Reins', '2 copper', 'standard', 'always'),
    gItem('Feed (1 week)', '2 copper', 'standard', 'always'),
    gItem('Hitching Post Fee (1 night)', '1 copper', 'standard', 'always'),
    gItem('Riding Armor (+8 TN)', '30 copper', 'standard', 'uncommon'),
  ]},

  // ── Superior shops (better stock, fine quality) ──────────────────────────
  'Superior Weapons': { icon: 'ti-sword', tier: 'superior', items: [
    wItem('Longsword','fine', 'always'), wItem('Scimitar','fine', 'common'), wItem('Jambiya','fine', 'common'),
    wItem('Spear','fine', 'uncommon'), wItem('Standard Bow','fine', 'common'), wItem('Shortbow','fine', 'uncommon'),
    wItem('Kindjal','fine', 'uncommon'), wItem('War Axe','fine', 'rare'),
    gItem('Quiver (60 arrows)', '4 copper', 'fine', 'always'),
    gItem('Whetstone', '2 copper', 'fine', 'common'),
  ]},
  'Superior Armorer': { icon: 'ti-shield', tier: 'superior', items: [
    gItem('Light Armor (+5 TN)', '60 copper', 'fine', 'always'), gItem('Heavy Armor (+10 TN)', '120 copper', 'fine', 'common'),
    gItem('Riding Armor (+8 TN)', '90 copper', 'fine', 'uncommon'), gItem('Partial Armor (+3 TN)', '30 copper', 'fine', 'common'),
  ]},
  'Merchant District': { icon: 'ti-building-store', tier: 'superior', items: [
    gItem('Fine Clothes', '15 copper', 'fine', 'always'), gItem('Traveling Cloak', '10 copper', 'fine', 'common'),
    gItem('Personal Seal', '20 copper', 'fine', 'uncommon'), gItem('Calligraphy Kit', '15 copper', 'fine', 'common'),
    gItem('Medicine Kit', '15 copper', 'fine', 'common'), gItem('Apothecary Kit', '20 copper', 'fine', 'uncommon'),
    gItem('Shoes', '8 copper', 'fine', 'common'), gItem('Musical Instrument', '25 copper', 'fine', 'rare'),
  ]},
  'Sahir Emporium': { icon: 'ti-sparkles', tier: 'superior', items: [
    gItem('Calligraphy Kit', '20 copper', 'fine', 'always'), gItem('Book / Scroll', '15 copper', 'fine', 'common'),
    gItem('Personal Seal', '25 copper', 'fine', 'uncommon'), gItem('Apothecary Kit', '25 copper', 'fine', 'common'),
    gItem('Medicine Kit', '20 copper', 'fine', 'common'), gItem('Writing Paper', '5 copper', 'standard', 'always'),
  ]},
  // ── Exotic Goods - a fence/rare-goods dealer. Faction weapons that are normally loot/steal-only
  // (Ashalan, Senpet, Yodotai, Assassin) can surface here at low odds, since this is where such things
  // plausibly end up. Deliberately excludes items the rules mark as truly not-for-sale or unique
  // (The Khadja, Najya, Blades of the Blood-Sworn, Ebonite Longsword - Order-only, arrest risk).
  'Exotic Goods': { icon: 'ti-diamond', tier: 'superior', items: [
    wItem('Adiva', 'fine', 'rare'), wItem('Ashalan Scimitar', 'fine', 'rare'), wItem('Falchion', 'fine', 'rare'),
    wItem('Ashalan Scythe', 'standard', 'rare'),
    wItem('Sayf-saghir', 'fine', 'uncommon'), wItem('Choking Cord', 'standard', 'uncommon'),
    wItem('Shamshir', 'fine', 'uncommon'), wItem('Composite Longbow', 'fine', 'rare'),
    wItem('Claymore', 'fine', 'rare'), wItem('Pugio', 'standard', 'uncommon'),
    wItem('Weighted Chain', 'standard', 'uncommon'), wItem('Small Club', 'standard', 'uncommon'),
    wItem('Blowgun', 'standard', 'rare'), wItem('Throwing Stone', 'standard', 'common'),
    wItem('Horseback Bow', 'fine', 'rare'),
    gItem('Armor Piercing Arrows (20)', '4 copper', 'standard', 'uncommon'),
    gItem('Flesh Cutter Arrows (20)', '5 copper', 'standard', 'uncommon'),
    gItem('Signal Arrows (10)', '10 copper', 'standard', 'common'),
  ]},
};

export function newShop(name, markupTier='fair') {
  return { id: Date.now().toString(), name, open: false, items: [], markup_tier: markupTier, appraise_tn: 15, shopkeeper_id: null };
}

// Assign a random markup multiplier based on shop tier
function randomMarkup(tier) {
  // 15% chance of a sale item priced below cost (0.5–0.7× base price)
  if (Math.random() < 0.15) return 0.5 + Math.random() * 0.2;
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
    items: WEAPONS_LIST.filter(w => !w.faction).map(w => ({ name: w.name, price: w.price || '5 copper', dr: w.dr || '', defaultQuality: 'standard' })),
  },
  {
    // Faction-specific weapons plus other unusual gear (special-ammo arrows) - GM's manual add tool,
    // so this includes even the not-for-sale/unique items (The Khadja, Najya, etc.) at GM discretion,
    // unlike the automated random shop stock which deliberately leaves those out.
    category: 'Unusual',
    items: [
      ...WEAPONS_LIST.filter(w => w.faction).map(w => ({ name: w.name, price: w.price || '-', dr: w.dr || '', defaultQuality: 'standard' })),
      { name: 'Armor Piercing Arrows (20)', price: '4 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Flesh Cutter Arrows (20)', price: '5 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Signal Arrows (10)', price: '10 copper', dr: '', defaultQuality: 'standard' },
    ],
  },
  {
    category: 'Armor & Shields',
    items: [
      { name: 'Partial Armor (+3 TN)',  price: '10 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Light Armor (+5 TN)',    price: '20 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Heavy Armor (+10 TN)',   price: '40 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Riding Armor (+8 TN)',   price: '30 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Lorica Segmentata',      price: '25 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Senpet Chain Shirt',     price: '20 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Yodotai Chain Shirt',    price: '25 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Half-Plate',            price: '45 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Ebonite Armor',          price: '-', dr: '', defaultQuality: 'standard' },
      { name: 'Adaga',                  price: '20 copper', dr: '', defaultQuality: 'standard' },
      ...SHIELDS.map(s => ({ name: s.name, price: s.price?.endsWith('c') ? s.price.replace('c', ' copper') : (s.price || '10 copper'), dr: '', defaultQuality: 'standard' })),
    ],
  },
  {
    category: 'Gear & Supplies',
    items: [
      'Medicine Kit','Traveling Rations','Water Skin','Rope (50 ft)','Lantern','Lantern Oil','Torch','Oil Lamp',
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
  {
    category: 'Mounts & Stable Supplies',
    items: [
      { name: 'Camel', price: '60 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Horse', price: '150 copper', dr: '', defaultQuality: 'fine' },
      { name: 'Saddle', price: '5 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Saddlebags', price: '3 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Bridle and Reins', price: '2 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Feed (1 week)', price: '2 copper', dr: '', defaultQuality: 'standard' },
      { name: 'Hitching Post Fee (1 night)', price: '1 copper', dr: '', defaultQuality: 'standard' },
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
                          <RulebookEntryButton itemName={item.name} size={11} />
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


export default function ShopTab({ isGM, isPCView, inventory, onUpdateInventory, characters, onUpdateCharacter, onLogEvent, onPurchase, onWipeShops, onRoll, myCharId, myGrantedActions = 0, onSpendGrantedAction, encActive = false, hideShopFromPlayers = false, onSetHideShopFromPlayers }) {
  const gmView = isGM && !isPCView;

  // All shops - loaded from/saved to Supabase
  const [shops, setShops] = useState([]);
  const [activeShopId, setActiveShopId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // UI state
  const [purchaseTarget, setPurchaseTarget] = useState(myCharId || 'party');
  const [showPoisonRef, setShowPoisonRef] = useState(false);
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
  // Appraisal: { shopId, revealQuality: true, revealTrueCost: bool } - set after successful roll
  const [appraisalResult, setAppraisalResult] = useState(null);
  // Haggle: track if last action was appraise for +1k0 bonus
  const [lastActionWasAppraise, setLastActionWasAppraise] = useState(false);
  const [hagglingItem, setHagglingItem] = useState(null); // item being haggled // { needed, have, item } // auto | weapons | armor | apothecary | general | black | outfitter | scribe | superior | sahir
  const [randomQuality, setRandomQuality] = useState('standard'); // standard | fine | superior
  const [shopNameInput, setShopNameInput] = useState('');

  // Cart state: { [shopId]: { items: [{...item, qty}] } }
  const [carts, setCarts] = useState({});
  // Per-shop appraisal result: { [shopId]: { revealQuality, revealTrueCost, bonusRolls: n } }
  // bonusRolls = stacking +1k0 charges for the next Commerce roll at this shop (from raises beyond the 1st)
  const [appraisalResults, setAppraisalResults] = useState({});
  // Per-shop pending haggle result awaiting raise spends: { [shopId]: { success, raisesAvailable, raisesSpent: { discount10: n, iCanPay: n } } }
  const [haggleResults, setHaggleResults] = useState({});

  const getCart = (shopId) => carts[shopId] || { items: [] };
  const setCart = (shopId, patch) => setCarts(prev => ({ ...prev, [shopId]: { ...getCart(shopId), ...patch } }));

  const addToCart = (shopId, item) => {
    const cart = getCart(shopId);
    const existing = cart.items.findIndex(ci => ci.name === item.name && ci.quality === item.quality);
    let newItems;
    if (existing >= 0) {
      newItems = cart.items.map((ci, idx) => idx === existing ? { ...ci, qty: (ci.qty || 1) + 1 } : ci);
    } else {
      newItems = [...cart.items, { ...item, qty: 1 }];
    }
    setCart(shopId, { items: newItems });
  };

  const removeFromCart = (shopId, idx) => {
    const cart = getCart(shopId);
    const item = cart.items[idx];
    if ((item.qty || 1) > 1) {
      setCart(shopId, { items: cart.items.map((ci, i) => i === idx ? { ...ci, qty: ci.qty - 1 } : ci) });
    } else {
      setCart(shopId, { items: cart.items.filter((_, i) => i !== idx) });
    }
  };

  // Base cart total at listed (marked-up) price, or true/base price if haggle succeeded
  const cartTotal = (shopId, useBase = false) => {
    const cart = getCart(shopId);
    return cart.items.reduce((sum, item) => {
      const unitPrice = parseCopperAmount(useBase ? item.price : (item.markup ? applyMarkup(item.price, item.markup) : item.price), item.quality);
      return sum + unitPrice * (item.qty || 1);
    }, 0);
  };

  // Haggle: success itself is a 10% discount off the marked-up price (NOT a switch to true base price).
  // Each "10% off" raise stacks another 10% on top, capped at 70% total off.
  const cartFinalTotal = (shopId) => {
    const hr = haggleResults[shopId];
    const base = cartTotal(shopId, false); // always the marked-up price - haggling never reveals/uses true base cost
    if (!hr?.success) return Math.max(1, Math.round(base));
    const discountStacks = 1 + (hr?.raisesSpent?.discount10 || 0); // the success itself counts as the first 10%
    const discount = Math.min(0.7, discountStacks * 0.1);
    return Math.max(1, Math.round(base * (1 - discount)));
  };

  const handleCartCheckout = (shop) => {
    const cart = getCart(shop.id);
    if (cart.items.length === 0) return;
    const totalCost = cartFinalTotal(shop.id);
    const destName = purchaseTarget === 'party' ? 'Party' : (characters || []).find(c => c.id === purchaseTarget)?.name || 'Character';

    const available = purchaseTarget === 'party'
      ? (inventory?.copper || 0)
      : ((characters || []).find(c => c.id === purchaseTarget)?.copper || 0);
    if (totalCost > available) {
      setInsufficientFunds({ needed: totalCost, have: available, item: `${cart.items.length} items` });
      return;
    }

    const itemEntries = cart.items.flatMap(item => {
      const qTier = QUALITY_TIERS.find(t => t.key === (item.quality || 'standard')) || QUALITY_TIERS[1];
      const displayName = item.is_magic ? item.name : (item.quality && item.quality !== 'standard' ? `${qTier.label} ${item.name}` : item.name);
      return Array.from({ length: item.qty || 1 }, () =>
        item.is_magic
          ? { ...item, equipped: false, inUse: false }
          : { name: displayName, dr: item.dr || undefined, equipped: false, inUse: false, quality: item.quality, qty: 1, category: 'Gear' }
      );
    });
    const itemNames = cart.items.map(i => `${i.qty > 1 ? i.qty + '× ' : ''}${i.name}`).join(', ');
    const hr = haggleResults[shop.id];
    const discountStacks = hr?.raisesSpent?.discount10 || 0;
    const priceStr = `${totalCost} copper${discountStacks > 0 ? ` (${Math.min(70, discountStacks * 10)}% off)` : ''}`;

    // "I can pay" integrity award - fires once at checkout if banked
    const iCanPayStacks = hr?.raisesSpent?.iCanPay || 0;
    if (iCanPayStacks > 0 && purchaseTarget !== 'party') {
      const char = (characters || []).find(c => c.id === purchaseTarget);
      if (char) {
        const curInt = Number(char.integrity) || 0;
        const intRank = Math.floor(curInt);
        const pointsPerStack = Math.max(1, 5 - intRank); // Rank 0 → +5, Rank 1 → +4, etc.
        const totalPoints = pointsPerStack * iCanPayStacks;
        const newIntegrity = Math.round((curInt + totalPoints / 10) * 10) / 10;
        onUpdateCharacter(purchaseTarget, { integrity: newIntegrity });
        if (onLogEvent) onLogEvent('ti-award', `${char.name} paid full price without complaint - integrity ${curInt.toFixed(1)} → ${newIntegrity.toFixed(1)}`);
      }
    }

    if (purchaseTarget === 'party') {
      const partyItems = itemEntries.map(e => ({ ...e, qty: 1, category: e.is_magic ? 'Magic' : 'Gear' }));
      if (onPurchase) onPurchase({ itemName: itemNames, price: priceStr, copperAmt: totalCost, destination: 'party', destName, partyItems, multiItem: true });
    } else {
      const char = (characters || []).find(c => c.id === purchaseTarget);
      if (char) onUpdateCharacter(purchaseTarget, { equipment: [...(char.equipment || []), ...itemEntries] });
      if (onPurchase) onPurchase({ itemName: itemNames, price: priceStr, copperAmt: totalCost, destination: purchaseTarget, destName });
    }

    // Fine, Masterwork, and Magic items are one-of - once bought, they're gone from this shop's stock.
    // Standard/Poor items restock indefinitely (untouched). Match by name+quality, same identity check
    // addToCart already uses to de-dupe, since catalog items don't carry a separate stable id.
    const oneOfKeys = new Set(
      cart.items
        .filter(ci => ci.is_magic || ci.quality === 'fine' || ci.quality === 'masterwork')
        .map(ci => `${ci.name}::${ci.quality || 'standard'}`)
    );
    if (oneOfKeys.size > 0) {
      const remainingItems = (shop.items || []).filter(si => !oneOfKeys.has(`${si.name}::${si.quality || 'standard'}`));
      const updatedShops = shops.map(s => s.id === shop.id ? { ...s, items: remainingItems } : s);
      updateShops(updatedShops);
    }

    setCart(shop.id, { items: [] });
    setAppraisalResults(prev => { const n = { ...prev }; delete n[shop.id]; return n; });
    setHaggleResults(prev => { const n = { ...prev }; delete n[shop.id]; return n; });
  };

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

  // Live-refresh: games.settings can change from elsewhere (another GM tab, a
  // different subsystem writing settings) - subscribe so shops_v2 updates reflect
  // without needing a page reload. Only touches `shops`/`activeShopId`; never
  // wholesale-replaces other local UI state.
  useEffect(() => {
    const channel = supabase
      .channel(`shoptab-games-${GAME_ID}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${GAME_ID}` }, (payload) => {
        const newShops = payload.new?.settings?.shops_v2;
        if (!newShops) return;
        setShops(newShops);
        setActiveShopId(prev => (prev && newShops.some(s => s.id === prev)) ? prev : (newShops[0]?.id || null));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
      'scribe': 'Scribe', 'stables': 'Stables', 'superior': 'Superior Weapons', 'sahir': 'Sahir Emporium',
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
        'stable': 'Stables', 'stables': 'Stables', 'mount': 'Stables', 'camel': 'Stables', 'horse': 'Stables',
        'superior': 'Superior Weapons', 'sahir': 'Sahir Emporium', 'magic': 'Sahir Emporium',
      };
      const match = Object.entries(keywords).find(([kw]) => shopName.includes(kw));
      presetKey = match ? match[1] : Object.keys(BUNDLE_PRESETS)[Math.floor(Math.random() * Object.keys(BUNDLE_PRESETS).length)];
    }
    const preset = BUNDLE_PRESETS[presetKey] || Object.values(BUNDLE_PRESETS)[3];
    // Roll each item against its rarity weight - 'always' items are guaranteed, rarer items are a coin flip
    // weighted toward not appearing. This keeps staples (arrows, rations, basic armor) reliably in stock
    // while specialty/rare goods are an occasional find, rather than every shop having full inventory.
    let rolledItems = preset.items.filter(item => Math.random() < (RARITY_CHANCE[item.rarity] ?? 0.85));
    // Safety net: never generate an empty shop - if the roll wipes everything, force in all 'always' items
    // plus at least 2 more at random
    if (rolledItems.length === 0) {
      const guaranteed = preset.items.filter(i => i.rarity === 'always');
      const rest = preset.items.filter(i => i.rarity !== 'always').sort(() => Math.random() - 0.5).slice(0, 2);
      rolledItems = [...guaranteed, ...rest];
    }
    // Build items with random variation
    const baseItems = rolledItems.map(item => ({ ...item, visible: true }));
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
    // Assign each item its own random markup, same system used by Load Bundle - this is what makes
    // prices vary item-to-item and shop-to-shop even for identical goods, per the shop's markup tier
    const tier = activeShop.markup_tier || 'fair';
    baseItems.forEach((item, i) => {
      baseItems[i] = { ...item, markup: randomMarkup(tier) };
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

  // Magic item shop price = base item's real cost × rarity markup, so a magic Longsword
  // costs more than a magic Knife even at the same rarity - falls back to flat pricing
  // for items with no linked base item (trinkets, custom artifacts, etc.)
  const RARITY_MARKUP_MULT = { uncommon: 2, rare: 4, legendary: 10, artifact: 25 };
  const FALLBACK_RARITY_PRICE = { uncommon: 20, rare: 50, legendary: 150, artifact: 500 };
  const magicItemPrice = (item) => {
    if (item.base_price) {
      const mult = RARITY_MARKUP_MULT[item.rarity] || 4;
      return `${Math.round(item.base_price * mult)} copper`;
    }
    return `${FALLBACK_RARITY_PRICE[item.rarity] || 50} copper`;
  };

  const addMagicItemToShop = (item) => {
    if (!activeShop) return;
    const shopItem = { ...item, price: magicItemPrice(item), quality: 'fine', visible: true };
    updateActiveItems([...(activeShop.items || []), shopItem]);
  };

  const handlePurchase = (item, useBaseCost = false, shopOverride = null, free = false) => {
    const shop = shopOverride || activeShop;
    const qTier = QUALITY_TIERS.find(t => t.key === (item.quality || 'standard')) || QUALITY_TIERS[1];
    const displayName = item.is_magic ? item.name : (item.quality && item.quality !== 'standard' ? `${qTier.label} ${item.name}` : item.name);
    // If haggling succeeded (useBaseCost), use base price; otherwise use marked-up price
    const displayedPrice = item.markup && !useBaseCost ? applyMarkup(item.price, item.markup) : item.price;
    const price = item.is_magic ? (item.price || '?') : qualityPrice(displayedPrice, item.quality);
    // GM send-to is a free grant - no currency changes hands, so no copper cost or funds check applies.
    const copperAmt = free ? 0 : parseCopperAmount(useBaseCost ? item.price : (item.markup ? applyMarkup(item.price, item.markup) : item.price), item.quality);
    const destName = purchaseTarget === 'party' ? 'Party' : (characters || []).find(c => c.id === purchaseTarget)?.name || 'Character';

    // Check if enough funds - skipped entirely for a free GM send
    if (!free && copperAmt > 0) {
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
      // Don't call onUpdateInventory here - pass partyItem up to onPurchase so App.js
      // can do one atomic update (items + copper together), avoiding race-condition overwrites
      const partyItem = { ...itemEntry, qty: 1, category: item.is_magic ? 'Magic' : 'Gear' };
      if (onPurchase) {
        onPurchase({ itemName: displayName, price, copperAmt, destination: purchaseTarget, destName, partyItem });
      }
    } else {
      const char = (characters || []).find(c => c.id === purchaseTarget);
      if (char) onUpdateCharacter(purchaseTarget, { equipment: [...(char.equipment || []), itemEntry] });
      if (onPurchase) {
        onPurchase({ itemName: displayName, price, copperAmt, destination: purchaseTarget, destName });
      }
    }

    // Fine, Masterwork, and Magic items are one-of - once bought, they're gone from this shop's stock.
    if (shop && (item.is_magic || item.quality === 'fine' || item.quality === 'masterwork')) {
      const key = `${item.name}::${item.quality || 'standard'}`;
      const remainingItems = (shop.items || []).filter(si => `${si.name}::${si.quality || 'standard'}` !== key);
      const updatedShops = shops.map(s => s.id === shop.id ? { ...s, items: remainingItems } : s);
      setShops(updatedShops);
      persistShops(updatedShops);
    }
  };

  const pcChars = (characters || []).filter(c => !c.is_npc);

  // What players see: only open shops with visible items
  if (!gmView) {
    if (encActive) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          <i className="ti ti-swords" style={{ fontSize: 32, display: 'block', marginBottom: '.5rem', opacity: 0.3 }} />
          Shops are closed during an encounter.
        </div>
      );
    }
    const openShops = shops.filter(s => s.open);
    if (openShops.length === 0) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          <i className="ti ti-shopping-cart" style={{ fontSize: 32, display: 'block', marginBottom: '.5rem', opacity: 0.3 }} />
          No shops are open right now.
        </div>
      );
    }
    const myChar = characters?.find(c => c.id === myCharId);
    const targetCopper = purchaseTarget === 'party'
      ? (inventory?.copper || 0)
      : ((characters || []).find(c => c.id === purchaseTarget)?.copper || 0);

    return (
      <div style={{ position: 'relative' }}>
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
              <button className="btn" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => setInsufficientFunds(null)}>Dismiss</button>
            </div>
          </div>
        )}
        {/* Copper watermark */}
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0, lineHeight: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#d4a020', opacity: 1, userSelect: 'none', letterSpacing: '-0.01em' }}>◈ {targetCopper}</div>
          <div style={{ fontSize: 10, color: '#d4a020', opacity: 0.7, marginTop: 1, paddingLeft: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {purchaseTarget === 'party' ? 'Party funds' : 'Personal funds'}
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: '1rem', marginLeft: 88, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-shopping-cart" /> The Bazaar
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
            const cart = getCart(shop.id);
            const apr = appraisalResults[shop.id];
            const hr = haggleResults[shop.id];
            const cartItemCount = cart.items.reduce((s, i) => s + (i.qty || 1), 0);
            const cartHasItems = cart.items.length > 0;
            const discountedTotal = cartFinalTotal(shop.id);
            const discountStacks = hr?.success ? 1 + (hr?.raisesSpent?.discount10 || 0) : 0;
            const discountPct = Math.min(70, discountStacks * 10);
            const shopkeeper = shop.shopkeeper_id ? (characters || []).find(c => c.id === shop.shopkeeper_id) : null;
            // Unspent raises waiting on the player to allocate (from the most recent haggle roll)
            const pendingRaises = hr?.raisesAvailable || 0;

            return (
              <div key={shop.id} style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <i className="ti ti-store" style={{ fontSize: 14 }} />{shop.name}
                  {shopkeeper && (
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                      - Shopkeeper: <span style={{ color: 'var(--text-secondary)' }}>{shopkeeper.name}</span>
                    </span>
                  )}
                  {apr?.revealQuality && (
                    <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '.04em', color: 'var(--green)', textTransform: 'uppercase' }}>
                      APPRAISED - QUALITY REVEALED{apr?.revealTrueCost ? ' - BASE COSTS REVEALED' : ''}
                    </span>
                  )}
                </div>

                {/* Item list */}
                <div className="card" style={{ marginBottom: cartHasItems ? '.75rem' : 0 }}>
                  {visItems.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Nothing on display.</div>}
                  {visItems.map((item, i) => {
                    const qTier = QUALITY_TIERS.find(t => t.key === (item.quality || 'standard')) || QUALITY_TIERS[1];
                    const basePrice = item.is_magic ? (item.price || '?') : qualityPrice(item.price, item.quality);
                    const markedPrice = item.markup ? applyMarkup(qualityPrice(item.price, item.quality), item.markup) : basePrice;
                    // Current/purchase price is always shown - that's what the player will actually pay and
                    // needs to see to make a decision. Base cost is shown ADDITIONALLY once Appraise reveals
                    // it, as a comparison reference, not as a replacement for the real price.
                    const shownPrice = markedPrice;
                    const showBaseCost = apr?.revealTrueCost && item.markup && item.markup > 1.03;
                    const showQuality = !!apr?.revealQuality;
                    const inCart = cart.items.find(ci => ci.name === item.name && ci.quality === item.quality);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.35rem 0', borderBottom: '1px solid rgba(107,78,40,.2)', flexWrap: 'wrap' }}>
                        {item.is_magic ? (
                          <div style={{ flex: 1 }}><MagicItemBadge item={item} compact /></div>
                        ) : (
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                                {showQuality && item.quality && item.quality !== 'standard'
                                  ? <span style={{ color: qTier.color }}>{qTier.label} </span> : null}
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
                        {!item.is_magic && <RulebookEntryButton itemName={item.name} />}
                        <span style={{ fontSize: 12, color: qTier.color, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
                          {shownPrice}
                          {showBaseCost && (
                            <span style={{ fontSize: 10, color: 'var(--green)' }}> ({basePrice})</span>
                          )}
                        </span>
                        {/* Quick buy (players) / Send-to (GM) - GM hands out loot for free via the
                            destination picker above, rather than "buying" it from their own shop. */}
                        {gmView ? (
                          <button className="btn btn-sm" style={{ fontSize: 11, borderColor: 'var(--green)', color: 'var(--green)' }}
                            title={`Send free to ${purchaseTarget === 'party' ? 'Party' : (characters || []).find(c => c.id === purchaseTarget)?.name || 'selected destination'} (no cost - set destination above)`}
                            onClick={() => handlePurchase(item, false, shop, true)}>
                            <i className="ti ti-send" style={{ marginRight: 3 }} />Send
                          </button>
                        ) : (
                          <button className="btn btn-sm" style={{ fontSize: 11 }}
                            title="Buy now at listed price - instant, no cart needed"
                            onClick={() => handlePurchase(item, false, shop)}>
                            Buy
                          </button>
                        )}
                        {/* Add to cart */}
                        {!item.is_magic && (
                          <button className="btn btn-sm" style={{ fontSize: 11, borderColor: 'var(--gold)', color: 'var(--gold)' }}
                            title="Add to cart - appraise/haggle the whole cart at once"
                            onClick={() => addToCart(shop.id, item)}>
                            {inCart ? `+Cart (${inCart.qty})` : '+ Cart'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Appraise - shop-level action, available regardless of cart contents (you assess a shop's
                    wares/prices before deciding what to buy, not after). Haggle is cart-level - it lives in
                    the cart panel below since you're haggling down the price of what's actually in your
                    cart. Both require a downtime Granted Action to attempt. */}
                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Appraise - freely available during downtime, not during encounters, costs 1 Granted Action */}
                  {onRoll && myChar && !encActive && (
                    <button className="btn btn-sm" disabled={myGrantedActions < 1}
                      style={{ borderColor: apr ? 'var(--green)' : 'var(--gold-dim)', color: apr ? 'var(--green)' : 'var(--gold)' }}
                      title={myGrantedActions < 1
                        ? 'No Granted Actions available - ask your GM for one'
                        : `Appraise - Commerce/Intelligence, TN ${shop.appraise_tn || 15}. Costs 1 Granted Action. Success reveals quality. 1st raise reveals base prices, extra raises bank +1k0 for Haggling.`}
                      onClick={() => {
                        if (myGrantedActions < 1) return;
                        const commerceSkillForAppraise = (myChar.skills || []).find(s => s.name === 'Commerce');
                        const tn = shop.appraise_tn || 15;
                        onSpendGrantedAction && onSpendGrantedAction();
                        onRoll({
                          skill: 'Commerce (Appraise)', tn, character: myChar,
                          baseRoll: (commerceSkillForAppraise?.rank || 0) + (myChar.intelligence || 2),
                          baseKeep: myChar.fire || 2,
                          label: `Appraise ${shop.name}`,
                          raiseExplainer: [
                            '✓ Success - reveals quality of all items in this shop.',
                            '★ 1st raise - also reveals true market prices (what items are actually worth).',
                            '★ Each extra raise - banks +1k0 on your next Commerce roll here (for Haggling).',
                          ].join('\n'),
                          onComplete: (total, raises, opposedRoll, success) => {
                            const r = raises || 0;
                            // Use the roll's own authoritative success flag (matches the roll banner) rather
                            // than re-deriving it here - re-deriving from the raw TN ignored any wound-penalty/
                            // technique modifiers DiceModal had already folded into the real threshold, which
                            // could disagree with the banner on an exact TN match.
                            if (success) {
                              const bonusRolls = Math.max(0, r - 1); // raises beyond the 1st bank +1k0 each
                              setAppraisalResults(prev => ({ ...prev, [shop.id]: { revealQuality: true, revealTrueCost: r >= 1, bonusRolls } }));
                              if (onLogEvent) onLogEvent('ti-zoom-money', `${myChar.name} appraised ${shop.name}${r >= 1 ? ' - base prices revealed' : ''}${bonusRolls > 0 ? ` (+${bonusRolls}k0 banked for next Commerce roll here)` : ''}`);
                            } else {
                              if (onLogEvent) onLogEvent('ti-zoom-money', `${myChar.name} failed to appraise ${shop.name}`);
                            }
                          },
                        });
                      }}>
                      <i className="ti ti-zoom-money" style={{ marginRight: 3 }} />
                      {apr ? `✓ Appraised${apr.bonusRolls > 0 ? ` (+${apr.bonusRolls}k0 banked)` : ''}` : 'Appraise (1 Granted Action)'}
                    </button>
                  )}
                  {onRoll && myChar && !encActive && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{myGrantedActions} Granted Action{myGrantedActions !== 1 ? 's' : ''} available</span>
                  )}
                </div>

                {/* Cart panel */}
                {cartHasItems && (
                  <div style={{ border: '2px solid var(--gold)', borderRadius: 8, padding: '.75rem', background: 'rgba(200,150,42,.05)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="ti ti-shopping-cart" /> Cart - {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
                      {discountPct > 0 && <span style={{ fontSize: 11, color: 'var(--green)', marginLeft: 4 }}>({discountPct}% off)</span>}
                    </div>
                    {/* Cart items */}
                    {cart.items.map((ci, idx) => {
                      const markedUnitCost = parseCopperAmount(ci.markup ? applyMarkup(ci.price, ci.markup) : ci.price, ci.quality);
                      // Haggle discounts the marked-up price by discountPct - it never reveals/uses the
                      // true base cost (see cartFinalTotal above) - so line items must apply the same
                      // percentage-off logic, not switch to base price, to stay consistent with the Total.
                      const unitCost = hr?.success ? Math.max(1, Math.round(markedUnitCost * (1 - discountPct / 100))) : markedUnitCost;
                      const lineTotal = unitCost * (ci.qty || 1);
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.2rem 0', borderBottom: '1px solid rgba(107,78,40,.15)', fontSize: 12 }}>
                          <button onClick={() => removeFromCart(shop.id, idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>×</button>
                          <span style={{ flex: 1, color: 'var(--text-primary)' }}>{ci.qty > 1 ? `${ci.qty}× ` : ''}{ci.name}</span>
                          <span style={{ color: 'var(--gold-dim)' }}>{lineTotal} copper</span>
                        </div>
                      );
                    })}
                    {/* Total */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.5rem', paddingTop: '.4rem', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total:</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: discountPct > 0 ? 'var(--green)' : 'var(--gold)' }}>
                        {discountedTotal} copper
                        {hr?.success && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4, fontWeight: 400 }}>({discountPct}% off, discounted)</span>}
                      </span>
                    </div>

                    {/* Pending raise allocation - shown after a successful Haggle roll */}
                    {pendingRaises > 0 && (
                      <div style={{ marginTop: '.6rem', padding: '.5rem .65rem', background: 'rgba(160,96,224,.1)', border: '1px solid #a060e0', borderRadius: 6 }}>
                        <div style={{ fontSize: 12, color: '#c080f0', fontWeight: 600, marginBottom: '.2rem' }}>
                          🎲 Haggle succeeded! {pendingRaises} raise{pendingRaises !== 1 ? 's' : ''} to spend:
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.4rem', lineHeight: 1.4 }}>
                          Haggle succeeded - 10% off already applied.
                          {discountPct > 10 && <span style={{ color: 'var(--green)' }}> {discountPct}% total discount so far.</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                          <button className="btn btn-sm" style={{ fontSize: 11, borderColor: 'var(--green)', color: 'var(--green)' }}
                            onClick={() => {
                              setHaggleResults(prev => ({ ...prev, [shop.id]: {
                                ...hr, raisesAvailable: pendingRaises - 1,
                                raisesSpent: { ...hr.raisesSpent, discount10: (hr.raisesSpent?.discount10 || 0) + 1 },
                              } }));
                              if (onLogEvent) onLogEvent('ti-coins', `${myChar?.name || 'Player'} spent a raise for 10% off at ${shop.name}`);
                            }}>
                            −10% off cart
                          </button>
                          <button className="btn btn-sm" style={{ fontSize: 11, borderColor: 'var(--gold)', color: 'var(--gold)' }}
                            title="Pay the asking price and call it fair - gain Integrity. The markup you already talked down stays removed."
                            onClick={() => {
                              setHaggleResults(prev => ({ ...prev, [shop.id]: {
                                ...hr, raisesAvailable: pendingRaises - 1,
                                raisesSpent: { ...hr.raisesSpent, iCanPay: (hr.raisesSpent?.iCanPay || 0) + 1 },
                              } }));
                              if (onLogEvent) onLogEvent('ti-award', `${myChar?.name || 'Player'} declined a further discount at ${shop.name} - integrity gain pending checkout`);
                            }}>
                            I can pay - +Integrity (pay the asking price and call it fair)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cart actions */}
                    <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Haggle - cart-level: negotiates down the price of what's actually in the cart.
                          Freely available during downtime, not during encounters, costs 1 Granted Action. */}
                      {onRoll && myChar && shopkeeper && !encActive && (
                        <button className="btn btn-sm" disabled={myGrantedActions < 1}
                          style={{ borderColor: '#a060e0', color: '#c080f0' }}
                          title={myGrantedActions < 1
                            ? 'No Granted Actions available - ask your GM for one'
                            : `Haggle - Commerce/Awareness opposed by ${shopkeeper.name}'s Commerce/Awareness. Costs 1 Granted Action.${apr?.bonusRolls > 0 ? ` +${apr.bonusRolls}k0 from your Appraise.` : ''} Success = 10% off; each raise = another 10% off, or Integrity instead.`}
                          onClick={() => {
                            if (myGrantedActions < 1) return;
                            const commerceSkill = (myChar.skills || []).find(s => s.name === 'Commerce');
                            const bonusRoll = apr?.bonusRolls || 0;
                            const skShopkeeperCommerce = (shopkeeper.skills || []).find(s => s.name === 'Commerce');
                            const skRoll = (skShopkeeperCommerce?.rank || 0) + (shopkeeper.awareness || 2);
                            const skKeep = shopkeeper.air || 2;
                            // Roll the shopkeeper's side now - their result becomes this roll's effective TN
                            const shopkeeperResult = rollExplodingKeep(skRoll, skKeep);
                            onSpendGrantedAction && onSpendGrantedAction();
                            onRoll({
                              skill: `Commerce (vs ${shopkeeper.name})`,
                              tn: shopkeeperResult,
                              baseRoll: (commerceSkill?.rank || 0) + (myChar.awareness || 2) + bonusRoll,
                              baseKeep: myChar.air || 2,
                              character: myChar,
                              bonusNotes: bonusRoll > 0 ? [`+${bonusRoll}k0 from Appraise`] : [],
                              label: `Haggle ${shop.name} - opposing ${shopkeeper.name} rolled ${shopkeeperResult}`,
                              raiseExplainer: [
                                '✓ Success - 10% off the cart total.',
                                '★ Each raise (after rolling) - choose one per raise:',
                                '   • 10% off the cart total (stacks, capped at 70% off)',
                                '   • "I can pay" - pay the asking price and call it fair, gain Integrity.',
                              ].join('\n'),
                              onComplete: (total, raises, opposedRoll, success) => {
                                const r = raises || 0;
                                // Use the roll's own authoritative success flag (matches the roll banner) rather
                                // than re-deriving it here - see Appraise's onComplete above for why.
                                setHaggleResults(prev => ({ ...prev, [shop.id]: { success, raisesAvailable: r, raisesSpent: { discount10: 0, iCanPay: 0 } } }));
                                // Consume banked appraise bonus rolls - they only apply to the next Commerce roll
                                if (apr?.bonusRolls > 0) setAppraisalResults(prev => ({ ...prev, [shop.id]: { ...apr, bonusRolls: 0 } }));
                                if (onLogEvent) onLogEvent('ti-coins', success
                                  ? `${myChar.name} won the haggle against ${shopkeeper.name} (${total} vs ${shopkeeperResult})${r > 0 ? ` with ${r} raise${r !== 1 ? 's' : ''} to spend` : ''}!`
                                  : `${myChar.name} lost the haggle against ${shopkeeper.name} (${total} vs ${shopkeeperResult}) - paying asking price.`);
                              },
                            });
                          }}>
                          <i className="ti ti-gavel" style={{ marginRight: 3 }} />Haggle (1 Granted Action)
                        </button>
                      )}
                      {onRoll && myChar && !shopkeeper && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          (no shopkeeper assigned - haggling unavailable)
                        </span>
                      )}
                      {/* Clear cart */}
                      <button className="btn btn-sm btn-d" style={{ marginLeft: 'auto' }}
                        onClick={() => {
                          setCart(shop.id, { items: [] });
                          setAppraisalResults(prev => { const n = { ...prev }; delete n[shop.id]; return n; });
                          setHaggleResults(prev => { const n = { ...prev }; delete n[shop.id]; return n; });
                        }}>
                        Clear
                      </button>
                      {/* Checkout */}
                      <button className="btn btn-sm btn-p" disabled={pendingRaises > 0}
                        title={pendingRaises > 0 ? 'Spend your remaining raises first' : undefined}
                        onClick={() => handleCartCheckout(shop)}>
                        <i className="ti ti-check" style={{ marginRight: 3 }} />
                        Checkout - {discountedTotal} copper
                      </button>
                    </div>
                  </div>
                )}
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
            const tier = activeShop.markup_tier || 'fair';
            const itemsWithMarkup = items.map(item => ({ ...item, markup: randomMarkup(tier) }));
            updateActiveItems([...(activeShop.items || []), ...itemsWithMarkup]);
            setShowCatalogue(false);
          }}
        />
      )}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>
          <i className="ti ti-shopping-cart" style={{ marginRight: 8 }} />The Bazaar
        </div>
        {activeShop && (activeShop.name === 'Black Market' || activeShop.name.toLowerCase().includes('apothecary') || activeShop.name.toLowerCase().includes('black')) && (
          <button className="btn btn-sm" style={{ fontSize: 11, borderColor: '#6a3a3a', color: '#c08040' }}
            onClick={() => setShowPoisonRef(true)}>⚗ Poisons</button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          {shops.filter(s => s.open).length} shop{shops.filter(s => s.open).length !== 1 ? 's' : ''} open to players
        </div>
      </div>

      {/* Shop tabs - fits 2 wide when there's room (auto-fit/minmax collapses to 1 wide on narrow
          screens without needing a media query, matching how the rest of the app has no breakpoint
          system yet) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 4, marginBottom: '1rem', alignItems: 'center' }}>
        {shops.map(shop => (
          <div key={shop.id} style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
            <button onClick={() => setActiveShopId(shop.id)} style={{
              padding: '.3rem .6rem', borderRadius: '4px 0 0 4px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', flex: 1, textAlign: 'left',
              background: activeShopId === shop.id ? 'rgba(200,150,42,.15)' : 'var(--bg-panel)',
              borderLeft: `1px solid ${activeShopId === shop.id ? 'var(--gold-dim)' : 'var(--border)'}`, borderTop: `1px solid ${activeShopId === shop.id ? 'var(--gold-dim)' : 'var(--border)'}`, borderBottom: `1px solid ${activeShopId === shop.id ? 'var(--gold-dim)' : 'var(--border)'}`,
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
              borderLeft: `1px solid ${shop.open ? 'var(--green)' : 'var(--border)'}`, borderTop: `1px solid ${shop.open ? 'var(--green)' : 'var(--border)'}`, borderBottom: `1px solid ${shop.open ? 'var(--green)' : 'var(--border)'}`,
              borderRight: activeShopId === shop.id ? '1px solid var(--gold-dim)' : '1px solid var(--border)',
              color: shop.open ? 'var(--green)' : 'var(--text-muted)',
            }}>
              {shop.open ? '👁' : '🚫'}
            </button>
            {/* Delete (only when active) */}
            {activeShopId === shop.id && shops.length > 1 && (
              <button onClick={() => deleteShop(shop.id)} title="Delete this shop" style={{
                padding: '.3rem .35rem', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                background: 'var(--bg-panel)', borderRight: `1px solid var(--border)`, borderTop: `1px solid var(--border)`, borderBottom: `1px solid var(--border)`, borderLeft: 'none', borderRadius: '0 4px 4px 0',
                color: 'var(--red)',
              }}>×</button>
            )}
            {activeShopId !== shop.id && (
              <div style={{ width: 4, borderRadius: '0 4px 4px 0', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: 'none', background: 'var(--bg-panel)', height: '100%' }} />
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 8 }}
          title="Removes the Shop tab from players entirely. The GM still sees it.">
          <input type="checkbox" checked={hideShopFromPlayers} onChange={e => onSetHideShopFromPlayers && onSetHideShopFromPlayers(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
          Hide Shop Tab From Players
        </label>
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
              {/* GM-only: appraise TN, shopkeeper, and markup tier */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <span title="Hidden from players - the TN for the Appraise roll">Appraise TN:</span>
                <input type="number" min={5} max={50} value={activeShop.appraise_tn || 15} style={{ width: 44, fontSize: 11, padding: '1px 4px' }}
                  onChange={e => updateActiveShop({ appraise_tn: parseInt(e.target.value) || 15 })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <span title="The NPC players haggle against - uses their actual Commerce/Awareness">Shopkeeper:</span>
                <select value={activeShop.shopkeeper_id || ''} onChange={e => updateActiveShop({ shopkeeper_id: e.target.value || null })} style={{ fontSize: 11, maxWidth: 140 }}>
                  <option value="">- none (no haggle) -</option>
                  {(characters || []).filter(c => c.is_npc).map(npc => (
                    <option key={npc.id} value={npc.id}>{npc.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <span title="Markup tier - affects how much prices are inflated">Markup:</span>
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
                No items - use <strong>Stock from Catalogue</strong> above to pick what this shop carries, or add custom items below.
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
