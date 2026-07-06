import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';
import { newShop } from './ShopTab';

// Shop-level management (create/rename/delete a shop, and the global "Hide Shop Tab From Players"
// toggle) lives here now — moved out of ShopTab.jsx, which stays focused on browsing/buying plus
// per-item editing (stock from catalogue, randomize, quality/price/visibility, custom items). Both
// tabs read/write the same games.settings.shops_v2 array, kept in sync via ShopTab's own realtime
// subscription (added separately) — this tab doesn't need its own live subscription since a GM is
// very unlikely to have two Preparation tabs open at once.
export default function ShopManagerTab({ hideShopFromPlayers = false, onSetHideShopFromPlayers }) {
  const [shops, setShops] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showNewShop, setShowNewShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopMarkupTier, setNewShopMarkupTier] = useState('fair');
  const [editingId, setEditingId] = useState(null);
  const [renameInput, setRenameInput] = useState('');

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setShops(data?.settings?.shops_v2 || []);
      setLoaded(true);
    });
  }, []);

  const persistShops = async (updatedShops) => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), shops_v2: updatedShops } })
      .eq('id', GAME_ID);
    if (!error) setShops(updatedShops);
    else console.error('save shops_v2 failed:', error.message);
  };

  const createShop = () => {
    const name = newShopName.trim() || 'New Shop';
    const shop = newShop(name, newShopMarkupTier);
    persistShops([...shops, shop]);
    setNewShopName(''); setNewShopMarkupTier('fair'); setShowNewShop(false);
  };

  const deleteShop = (id) => {
    persistShops(shops.filter(s => s.id !== id));
  };

  const renameShop = (id, name) => {
    if (!name.trim()) { setEditingId(null); return; }
    persistShops(shops.map(s => s.id === id ? { ...s, name: name.trim() } : s));
    setEditingId(null);
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem' }}
        title="Removes the Shop tab from players entirely. The GM still sees it.">
        <input type="checkbox" checked={hideShopFromPlayers} onChange={e => onSetHideShopFromPlayers && onSetHideShopFromPlayers(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
        Hide Shop Tab From Players
      </label>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Shops</div>
      {shops.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '.5rem' }}>None yet.</div>}
      {shops.map(shop => (
        <div key={shop.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, marginBottom: 3, background: 'rgba(107,78,40,.08)' }}>
          <span style={{ fontSize: 10, color: shop.open ? 'var(--green)' : 'var(--text-muted)' }}>{shop.open ? '● open' : '○ hidden'}</span>
          {editingId === shop.id ? (
            <>
              <input value={renameInput} onChange={e => setRenameInput(e.target.value)} autoFocus
                style={{ fontSize: 12, flex: 1 }}
                onKeyDown={e => { if (e.key === 'Enter') renameShop(shop.id, renameInput); if (e.key === 'Escape') setEditingId(null); }} />
              <button className="btn btn-sm btn-p" style={{ fontSize: 11 }} onClick={() => renameShop(shop.id, renameInput)}>✓</button>
              <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setEditingId(null)}>✕</button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 13, flex: 1 }}>{shop.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(shop.items || []).length} items · {shop.markup_tier || 'fair'} markup</span>
              <button onClick={() => { setEditingId(shop.id); setRenameInput(shop.name); }} title="Rename" style={{ fontSize: 11, padding: '2px 6px' }}>✎</button>
              <button onClick={() => deleteShop(shop.id)} title="Delete this shop" disabled={shops.length <= 1}
                style={{ fontSize: 11, padding: '2px 6px', color: shops.length <= 1 ? 'var(--text-muted)' : 'var(--red)' }}>✕</button>
            </>
          )}
        </div>
      ))}

      {showNewShop ? (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', marginTop: '.5rem' }}>
          <input value={newShopName} onChange={e => setNewShopName(e.target.value)}
            placeholder="Shop name" autoFocus style={{ fontSize: 12, padding: '3px 7px', flex: 1, minWidth: 120 }}
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
        <button className="btn btn-sm" style={{ fontSize: 11, marginTop: '.5rem' }} onClick={() => setShowNewShop(true)}>+ New Shop</button>
      )}
    </div>
  );
}
