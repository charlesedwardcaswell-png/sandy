import React, { useState } from 'react';

const RARITIES = [
  { key: 'uncommon',  label: 'Uncommon',  color: '#4a7a40', glow: '#4a7a4066' },
  { key: 'rare',      label: 'Rare',      color: '#3a6a9a', glow: '#3a6a9a66' },
  { key: 'legendary', label: 'Legendary', color: '#9a6a20', glow: '#9a6a2066' },
  { key: 'artifact',  label: 'Artifact',  color: '#8a2a8a', glow: '#8a2a8a66' },
];

const TYPES = ['Weapon', 'Armor', 'Accessory', 'Consumable', 'Artifact', 'Curiosity'];

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
      {item.effect && <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{item.effect}</div>}
      {item.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.description}</div>}
    </div>
  );
}

export default function MagicItemCreator({ onClose, onCreateForCharacter, onCreateForParty, onCreateForShop, characters, shops = [] }) {
  const [name, setName] = useState('');
  const [rarity, setRarity] = useState('rare');
  const [itemType, setItemType] = useState('Weapon');
  const [dr, setDr] = useState('');
  const [effect, setEffect] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState(onCreateForShop && shops.length > 0 ? shops[0].id : 'party');
  const [saving, setSaving] = useState(false);

  const rarityData = RARITIES.find(r => r.key === rarity) || RARITIES[0];

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const item = {
      name: name.trim(),
      rarity,
      item_type: itemType,
      dr: dr.trim() || undefined,
      effect: effect.trim(),
      description: description.trim(),
      is_magic: true,
      equipped: false,
      inUse: false,
    };

    if (onCreateForShop && shops.some(s => s.id === destination)) {
      await onCreateForShop(destination, item);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>✦ Create Magic Item</div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Rarity selector */}
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

        {/* Name */}
        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Item Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Blade of Smokeless Fire"
            style={{ width: '100%', boxSizing: 'border-box' }} autoFocus />
        </div>

        {/* Type + DR row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Type</label>
            <select value={itemType} onChange={e => setItemType(e.target.value)} style={{ width: '100%' }}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Damage (if weapon, e.g. 3k2)</label>
            <input value={dr} onChange={e => setDr(e.target.value)} placeholder="e.g. 3k2" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Effect */}
        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Magical Effect (shown on sheet)</label>
          <input value={effect} onChange={e => setEffect(e.target.value)} placeholder="e.g. +1k0 damage vs Jinn; deals wounds that cannot be healed magically"
            style={{ width: '100%', boxSizing: 'border-box' }} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Flavour Description (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Forged from crysteel and tempered in the breath of a bound Major Jinn…"
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

        {/* Preview */}
        {name && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Preview</label>
            <MagicItemBadge item={{ name, rarity, item_type: itemType, dr, effect, description }} />
          </div>
        )}

        {/* Destination */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Send to</label>
          <select value={destination} onChange={e => setDestination(e.target.value)} style={{ width: '100%' }}>
            {shops.map(s => <option key={s.id} value={s.id}>🏪 {s.name}</option>)}
            <option value="party">Party Inventory (Loot)</option>
            {(characters || []).filter(c => !c.is_npc).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-p" disabled={!name.trim() || saving} onClick={handleCreate}
            style={{ borderColor: rarityData.color, color: rarityData.color, boxShadow: `0 0 8px ${rarityData.glow}` }}>
            {saving ? 'Creating…' : `✦ Create ${rarityData.label} Item`}
          </button>
        </div>
      </div>
    </div>
  );
}
