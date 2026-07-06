import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';
import MagicItemCreator, { MagicItemBadge } from './MagicItemCreator';

// GM's Inventory is a GM-only staging area (stored on the games row, like other dev/GM config) —
// items land here from the shared item creator (mundane or magic), then the GM hands them off to
// the party or a specific character whenever it's convenient.
//
// The "Custom item / From base item" picker used to be duplicated here and in MagicItemCreator.jsx
// (which only had a Weapon-only base picker). Both flows now share one creator component and one
// base-item catalog — see MagicItemCreator.jsx.
export default function ItemCreatorTab({ characters = [], onUpdateCharacter, inventory, onUpdateInventory, onLogEvent }) {
  const [gmInventory, setGmInventory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [giveTarget, setGiveTarget] = useState({}); // itemId -> selected destination ('party' or char id)

  const pcChars = characters.filter(c => !c.is_npc);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setGmInventory(data?.settings?.gm_inventory || []);
      setLoaded(true);
    });
  }, []);

  const persistGmInventory = async (next) => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), gm_inventory: next } })
      .eq('id', GAME_ID);
    if (!error) setGmInventory(next);
    else console.error('save gm_inventory failed:', error.message);
  };

  const deleteItem = (id) => persistGmInventory(gmInventory.filter(i => i.id !== id));

  const giveItem = (item) => {
    const dest = giveTarget[item.id] || 'party';
    const { id, added_at, ...itemData } = item;
    if (dest === 'party') {
      onUpdateInventory({ items: [...(inventory?.items || []).filter(Boolean), { ...itemData, added_at: new Date().toISOString() }] });
      onLogEvent && onLogEvent('ti-package', `${item.name} → Party Inventory`);
    } else {
      const char = pcChars.find(c => c.id === dest);
      if (!char) return;
      onUpdateCharacter(dest, { equipment: [...(char.equipment || []), { ...itemData, equipped: false, inUse: false }] });
      onLogEvent && onLogEvent('ti-package', `${item.name} → ${char.name}`);
    }
    deleteItem(item.id);
  };

  // Shared item creator (mundane or magic — see MagicItemCreator.jsx) always adds to GM's Inventory
  // from this tab; the item it hands back already carries its own category/qty, so this wrapper
  // just needs to stamp an id and timestamp, same as before for both kinds of item.
  const addItemToGMInventory = (item) => {
    const entry = { id: `gmitem_${Date.now()}`, ...item, added_at: new Date().toISOString() };
    return persistGmInventory([...gmInventory, entry]);
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {showCreator && (
        <MagicItemCreator
          onClose={() => setShowCreator(false)}
          characters={pcChars}
          onCreateForGMInventory={addItemToGMInventory}
          onCreateForParty={(item) => {
            onUpdateInventory({ items: [...(inventory?.items || []).filter(Boolean), { ...item, added_at: new Date().toISOString() }] });
          }}
          onCreateForCharacter={(charId, item) => {
            const char = pcChars.find(c => c.id === charId);
            if (char) onUpdateCharacter(charId, { equipment: [...(char.equipment || []), { ...item, equipped: true, inUse: false }] });
          }}
        />
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-p" onClick={() => setShowCreator(true)}>+ Create Item</button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: '.5rem' }}>
        <i className="ti ti-briefcase" style={{ marginRight: 6 }} />GM's Inventory
      </div>
      {gmInventory.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Nothing stashed yet.</div>
      )}
      {gmInventory.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '.5rem', marginBottom: 5, background: 'rgba(107,78,40,.08)', borderRadius: 5, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            {item.category === 'Magic' ? <MagicItemBadge item={item} compact /> : (
              <>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>{item.category}</span>
                <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                {item.baseItemName && item.baseItemName !== item.name && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>(base: {item.baseItemName})</span>}
                {item.qty > 1 && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>×{item.qty}</span>}
                {item.price && <span style={{ fontSize: 11, color: 'var(--gold-dim)', marginLeft: 6 }}>{item.price}</span>}
                {item.mechanicsSummary && <div style={{ fontSize: 11, color: 'var(--gold-dim)' }}>{item.mechanicsSummary}</div>}
                {item.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{item.notes}</div>}
              </>
            )}
          </div>
          <select value={giveTarget[item.id] || 'party'} onChange={e => setGiveTarget(prev => ({ ...prev, [item.id]: e.target.value }))} style={{ fontSize: 11 }}>
            <option value="party">Party Inventory</option>
            {pcChars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-sm btn-p" style={{ fontSize: 11 }} onClick={() => giveItem(item)}>Give</button>
          <button className="btn btn-sm" style={{ fontSize: 11, color: 'var(--red)' }} onClick={() => deleteItem(item.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
