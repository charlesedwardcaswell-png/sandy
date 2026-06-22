import React, { useState, useEffect } from 'react';
import { WEAPONS_LIST, GEAR_LIST, GAME_ID } from '../data/constants';
import PoisonReferenceModal from './PoisonReferenceModal';
import MagicItemCreator, { MagicItemBadge } from './MagicItemCreator';
import { supabase } from '../lib/supabase';

const QUALITY_TIERS = [
  { key: 'poor',       label: 'Poor',       mult: 0.5,  color: '#6a5a40' },
  { key: 'standard',   label: 'Standard',   mult: 1,    color: '#8a7a50' },
  { key: 'fine',       label: 'Fine',       mult: 2,    color: '#c0a030' },
  { key: 'masterwork', label: 'Masterwork', mult: 4,    color: '#e0c060' },
];

const BUNDLE_PRESETS = {
  'Weapons Dealer':   { icon: 'ti-sword',    items: WEAPONS_LIST.slice(0, 12).map(w => ({ name: w.name, price: w.price || '5 copper', dr: w.dr || '', quality: 'standard', visible: true, is_magic: false })) },
  'Armorer':          { icon: 'ti-shield',   items: ['Light Armor','Heavy Armor','Partial Armor','Riding Armor','Shield'].map(n => ({ name: n, price: '20 copper', dr: '', quality: 'standard', visible: true, is_magic: false })) },
  'Apothecary':       { icon: 'ti-flask',    items: ['Medicine Kit','Antidote','Healing Poultice','Pain Salve','Smelling Salts'].map(n => ({ name: n, price: '5 copper', dr: '', quality: 'standard', visible: true, is_magic: false })) },
  'General Goods':    { icon: 'ti-backpack', items: GEAR_LIST.slice(0, 10).map(n => ({ name: n, price: '2 copper', dr: '', quality: 'standard', visible: true, is_magic: false })) },
  'Black Market':     { icon: 'ti-eye-off',  items: ['Poison (Contact)','Poison (Ingested)','Choking Cord','Concealed Blade Rig','Forgery Kit','Lock Picks','Fire Biter (dose)','Night Milk (dose)'].map(n => ({ name: n, price: '10 copper', dr: '', quality: 'standard', visible: true, is_magic: false })) },
  'Magic Merchant':   { icon: 'ti-sparkles', items: ['Crysteel Dagger','Sahir Focus Stone','Warding Charm','Smokeless Fire Oil','Seal Fragment'].map(n => ({ name: n, price: '50 copper', dr: '', quality: 'fine', visible: true, is_magic: false })) },
};

function newShop(name) {
  return { id: Date.now().toString(), name, open: false, items: [] };
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

export default function ShopTab({ isGM, isPCView, inventory, onUpdateInventory, characters, onUpdateCharacter, onLogEvent, onPurchase }) {
  const gmView = isGM && !isPCView;

  // All shops — loaded from/saved to Supabase
  const [shops, setShops] = useState([]);
  const [activeShopId, setActiveShopId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // UI state
  const [purchaseTarget, setPurchaseTarget] = useState('party');
  const [showPoisonRef, setShowPoisonRef] = useState(false);
  const [showMagicCreator, setShowMagicCreator] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [showNewShop, setShowNewShop] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDr, setCustomDr] = useState('');
  const [customQuality, setCustomQuality] = useState('standard');
  const [editingShopName, setEditingShopName] = useState(false);
  const [shopNameInput, setShopNameInput] = useState('');

  const activeShop = shops.find(s => s.id === activeShopId) || null;

  // Load from Supabase
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
    const shop = newShop(name);
    const updated = [...shops, shop];
    updateShops(updated);
    setActiveShopId(shop.id);
    setNewShopName('');
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
    const bundleItems = BUNDLE_PRESETS[bundleName].items.map(i => ({ ...i }));
    updateActiveShop({ items: bundleItems });
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

  const removeItem = (idx) => {
    updateActiveItems(activeShop.items.filter((_, i) => i !== idx));
  };

  const addCustomItem = () => {
    if (!customName.trim() || !activeShop) return;
    const item = { name: customName.trim(), price: customPrice || '?', dr: customDr, quality: customQuality, visible: true, is_magic: false };
    updateActiveItems([...(activeShop.items || []), item]);
    setCustomName(''); setCustomPrice(''); setCustomDr(''); setCustomQuality('standard');
  };

  const addMagicItemToShop = (item) => {
    if (!activeShop) return;
    // Magic items get a price field derived from rarity
    const rarityPrices = { uncommon: '20 copper', rare: '50 copper', legendary: '150 copper', artifact: '500 copper' };
    const shopItem = {
      ...item,
      price: rarityPrices[item.rarity] || '50 copper',
      quality: 'fine',
      visible: true,
    };
    updateActiveItems([...(activeShop.items || []), shopItem]);
  };

  const handlePurchase = (item) => {
    const qTier = QUALITY_TIERS.find(t => t.key === (item.quality || 'standard')) || QUALITY_TIERS[1];
    const displayName = item.is_magic ? item.name : (item.quality && item.quality !== 'standard' ? `${qTier.label} ${item.name}` : item.name);
    const price = item.is_magic ? (item.price || '?') : qualityPrice(item.price, item.quality);
    const copperAmt = parseCopperAmount(item.price, item.quality);
    const destName = purchaseTarget === 'party' ? 'Party' : (characters || []).find(c => c.id === purchaseTarget)?.name || 'Character';

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
    return (
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: '1.25rem' }}>
          <i className="ti ti-shopping-cart" style={{ marginRight: 8 }} />The Bazaar
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
                  const price = item.is_magic ? (item.price || '?') : qualityPrice(item.price, item.quality);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.35rem 0', borderBottom: '1px solid rgba(107,78,40,.2)', flexWrap: 'wrap' }}>
                      {item.is_magic ? (
                        <div style={{ flex: 1 }}><MagicItemBadge item={item} compact /></div>
                      ) : (
                        <>
                          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>
                            {item.name}
                            {item.dr && <span style={{ fontSize: 11, color: 'var(--gold-dim)', marginLeft: 5 }}>{item.dr}</span>}
                          </span>
                          {item.quality && item.quality !== 'standard' && (
                            <span style={{ fontSize: 10, padding: '1px 4px', border: `1px solid ${qTier.color}55`, borderRadius: 3, color: qTier.color }}>{qTier.label}</span>
                          )}
                        </>
                      )}
                      <span style={{ fontSize: 12, color: qTier.color, fontWeight: 600, minWidth: 65, textAlign: 'right' }}>{price}</span>
                      <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => handlePurchase(item)}>Buy</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // GM VIEW
  return (
    <div>
      {showPoisonRef && <PoisonReferenceModal onClose={() => setShowPoisonRef(false)} />}
      {showMagicCreator && (
        <MagicItemCreator
          onClose={() => setShowMagicCreator(false)}
          characters={pcChars}
          onCreateForShop={activeShop ? addMagicItemToShop : undefined}
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
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input value={newShopName} onChange={e => setNewShopName(e.target.value)}
              placeholder="Shop name" autoFocus style={{ fontSize: 12, padding: '3px 7px', width: 120 }}
              onKeyDown={e => { if (e.key === 'Enter') createShop(); if (e.key === 'Escape') setShowNewShop(false); }} />
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
            <select defaultValue="" onChange={e => { if (e.target.value) loadBundle(e.target.value); e.target.value = ''; }}
              style={{ fontSize: 11, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3, padding: '2px 4px' }}>
              <option value="">Load bundle preset…</option>
              {Object.entries(BUNDLE_PRESETS).map(([name, b]) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <div style={{ marginLeft: 'auto', fontSize: 11, color: activeShop.open ? 'var(--green)' : 'var(--text-muted)' }}>
              {activeShop.open ? '● Open to players' : '○ Hidden from players'} — click 👁/🚫 above to toggle
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
                No items. Load a bundle, add custom items, or create a magic item above.
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
                </div>
              );
            })}

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
