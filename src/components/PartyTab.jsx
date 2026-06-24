import React, { useState } from 'react';
import { Silhouette, WoundBadge, FacIcon } from './UI';
import { getArchetype, getWoundRank, repColor, repLabel, formatDate } from '../lib/utils';
import { WOUND_COLORS, WOUND_RANKS, FACTIONS_DATA, FACTION_COLORS } from '../data/constants';
import { MagicItemBadge } from './MagicItemCreator';
import MagicItemCreator from './MagicItemCreator';

const CATEGORY_ICONS = {
  'Quest Item': 'ti-map-search',
  'Weapon':     'ti-sword',
  'Armor':      'ti-shield',
  'Gear':       'ti-backpack',
  'Loot':       'ti-coin',
  'Consumable': 'ti-flask',
  'Magic':      'ti-sparkles',
};

function ItemIcon({ category }) {
  const icon = CATEGORY_ICONS[category] || 'ti-package';
  return <i className={`ti ${icon}`} style={{ fontSize: 14, color: 'var(--gold-dim)', flexShrink: 0, width: 16, textAlign: 'center' }} />;
}

export default function PartyTab({ isGM, isPCView, characters, reps, onUpdateRep, inventory, onUpdateInventory, encounterLog, onUpdateCharacter, myCharId }) {
  const gmView = isGM && !isPCView;
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCat, setNewItemCat] = useState('Gear');
  const [copperDelta, setCopperDelta] = useState('');
  const [sendToChar, setSendToChar] = useState({}); // itemIdx → charId
  const [showMagicCreator, setShowMagicCreator] = useState(false);

  const applyCopper = () => {
    const delta = parseInt(copperDelta) || 0;
    if (delta === 0) return;
    onUpdateInventory({ copper: Math.max(0, (inventory.copper || 0) + delta) });
    setCopperDelta('');
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const items = [...(inventory.items || []), { name: newItemName.trim(), qty: newItemQty, category: newItemCat }];
    onUpdateInventory({ items });
    setNewItemName(''); setNewItemQty(1); setNewItemCat('Gear');
  };

  const removeItem = idx => {
    onUpdateInventory({ items: (inventory.items || []).filter((_, i) => i !== idx) });
  };

  const sendItemToCharacter = (idx, charId) => {
    if (!charId) return;
    const item = (inventory.items || [])[idx];
    const char = characters.find(c => c.id === charId);
    if (!item || !char) return;
    // Remove from party
    onUpdateInventory({ items: (inventory.items || []).filter((_, i) => i !== idx) });
    // Add to character equipment
    const newEq = [...(char.equipment || []), item.is_magic
      ? { ...item, equipped: true, inUse: false }
      : { name: item.name, equipped: false, inUse: false }
    ];
    onUpdateCharacter(charId, { equipment: newEq });
    setSendToChar(s => { const n = { ...s }; delete n[idx]; return n; });
  };

  const pcChars = (characters || []).filter(c => !c.is_npc);
  const items = inventory.items || [];
  const magicItems = items.filter(i => i.is_magic);
  const normalItems = items.filter(i => !i.is_magic);

  return (
    <div>
      {showMagicCreator && (
        <MagicItemCreator
          onClose={() => setShowMagicCreator(false)}
          characters={pcChars}
          onCreateForParty={(item) => {
            onUpdateInventory({ items: [...items, { ...item, qty: 1, category: 'Magic' }] });
          }}
          onCreateForCharacter={(charId, item) => {
            const char = characters.find(c => c.id === charId);
            if (!char) return;
            onUpdateCharacter(charId, { equipment: [...(char.equipment || []), { ...item, equipped: true, inUse: false }] });
          }}
        />
      )}

      {/* Party members + Faction standing */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {/* Party members */}
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
            <i className="ti ti-users" style={{ marginRight: 6 }} />Party Overview
          </div>
          {characters.length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>No characters created yet.</div>
          ) : (
            <div>
              {characters.map(c => {
                const woundRank = getWoundRank(c.current_wounds || 0, c.max_wounds || 10);
                const wColor = WOUND_COLORS[woundRank];
                const magicEq = (c.equipment || []).filter(e => e.is_magic);
                return (
                  <div key={c.id} className="party-card">
                    <div style={{ width: 44, height: 56, borderRadius: 5, background: 'var(--bg-mid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      <Silhouette type={getArchetype(c.school)} size={36} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.35rem' }}>{c.faction} · {c.school} R{c.school_rank}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span className="party-stat" style={{ color: wColor, borderColor: wColor + '44' }}>{WOUND_RANKS[woundRank]}</span>
                        <span className="party-stat">Void {c.current_void || c.void}/{c.void}</span>
                        <span className="party-stat">{c.current_stance || 'Attack'}</span>
                        {c.current_weapon && <span className="party-stat" style={{ color: 'var(--gold-dim)' }}>⚔ {typeof c.current_weapon === 'string' ? c.current_weapon.split(' ')[0] : (c.current_weapon?.name || 'Weapon')}</span>}
                        {gmView && <span className="party-stat" style={{ color: 'var(--gold-dim)' }}>{(c.xp_total || 0) - (c.xp_spent || 0)} XP</span>}
                      </div>
                      {magicEq.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                          {magicEq.map((item, mi) => (
                            <MagicItemBadge key={mi} item={item} compact />
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{c.copper || 0}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>copper</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Faction standing */}
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
            <i className="ti ti-shield-half" style={{ marginRight: 6 }} />Faction Standing
          </div>
          <div className="card">
            {FACTIONS_DATA.map(fDef => {
              const rep = reps[fDef.name]?.reputation ?? 0;
              return (
                <div key={fDef.name} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.35rem .25rem', borderBottom: '1px solid rgba(107,78,40,.12)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(200,150,42,.1)', border: '1px solid var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FacIcon name={fDef.name} size={12} />
                  </div>
                  <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 13 }}>{fDef.name}</span>
                  {gmView && <button className="rep-btn" onClick={() => onUpdateRep(fDef.name, -1)}>−</button>}
                  <span style={{ fontWeight: 600, color: repColor(rep), fontSize: 14, minWidth: 24, textAlign: 'center' }}>{rep > 0 ? '+' : ''}{rep}</span>
                  {gmView && <button className="rep-btn" onClick={() => onUpdateRep(fDef.name, 1)}>+</button>}
                  <span style={{ fontSize: 12, color: repColor(rep), minWidth: 42 }}>{repLabel(rep)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Group inventory */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          <i className="ti ti-backpack" style={{ marginRight: 6 }} />Group Inventory
        </div>
        {gmView && (
          <button className="btn btn-sm" style={{ fontSize: 11, borderColor: 'rgba(160,100,220,.5)', color: '#c0a0e0' }}
            onClick={() => setShowMagicCreator(true)}>
            ✦ Create Magic Item
          </button>
        )}
      </div>

      <div style={{ maxWidth: 520 }}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          {/* Copper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', padding: '.5rem', background: 'var(--bg-panel)', borderRadius: 4 }}>
            <i className="ti ti-coin" style={{ color: 'var(--gold)', fontSize: 18 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{inventory.copper ?? 0}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>copper</span>
            {gmView && (
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
                <input type="number" placeholder="±" value={copperDelta} onChange={e => setCopperDelta(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCopper()} style={{ width: 60, fontSize: 12, padding: '2px 4px' }} />
                <button className="btn btn-sm" onClick={applyCopper}>Apply</button>
              </div>
            )}
          </div>

          {/* Magic items — shown first with full badge */}
          {magicItems.length > 0 && (
            <div style={{ marginBottom: '.75rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>✦ Magic Items</div>
              {magicItems.map((item, rawIdx) => {
                const actualIdx = items.indexOf(item);
                return (
                  <div key={actualIdx} style={{ marginBottom: '.5rem' }}>
                    <MagicItemBadge item={item} />
                    {(gmView || (!gmView && myCharId)) && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
                        {gmView
                          ? <select
                              value={sendToChar[actualIdx] || ''}
                              onChange={e => setSendToChar(s => ({ ...s, [actualIdx]: e.target.value }))}
                              style={{ flex: 1, fontSize: 11 }}>
                              <option value="">→ Send to character…</option>
                              {pcChars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          : <span style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)' }}>→ Take for yourself</span>
                        }
                        <button className="btn btn-sm"
                          disabled={gmView ? !sendToChar[actualIdx] : false}
                          onClick={() => sendItemToCharacter(actualIdx, gmView ? sendToChar[actualIdx] : myCharId)}
                          style={{ fontSize: 11 }}>Take</button>
                        {gmView && <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 11 }}
                          onClick={() => removeItem(actualIdx)}>×</button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Normal items */}
          {normalItems.map((item, rawIdx) => {
            const actualIdx = items.indexOf(item);
            return (
              <div key={actualIdx} className="inv-row">
                <ItemIcon category={item.category} />
                <span className="inv-cat">{item.category}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{item.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>×{item.qty}</span>
                {gmView && (
                  <>
                    <select
                      value={sendToChar[actualIdx] || ''}
                      onChange={e => setSendToChar(s => ({ ...s, [actualIdx]: e.target.value }))}
                      style={{ fontSize: 11, maxWidth: 110 }}>
                      <option value="">→ Char</option>
                      {pcChars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {sendToChar[actualIdx] && (
                      <button className="btn btn-sm" style={{ fontSize: 11, padding: '1px 5px' }}
                        onClick={() => sendItemToCharacter(actualIdx, sendToChar[actualIdx])}>✓</button>
                    )}
                    <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => removeItem(actualIdx)}>×</button>
                  </>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.25rem 0' }}>No items in party inventory.</div>
          )}

          {/* Add item — GM only */}
          {gmView && (
            <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="Item name" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()} style={{ flex: 1, minWidth: 100 }} />
              <select value={newItemCat} onChange={e => setNewItemCat(e.target.value)}>
                {['Quest Item','Weapon','Armor','Gear','Loot','Consumable'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min={1} value={newItemQty} onChange={e => setNewItemQty(+e.target.value)} style={{ width: 50 }} />
              <button className="btn btn-sm btn-p" disabled={!newItemName.trim()} onClick={addItem}>Add</button>
            </div>
          )}
        </div>
      </div>

      {/* Recent encounters */}
      {encounterLog && encounterLog.length > 0 && (
        <>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
            <i className="ti ti-swords" style={{ marginRight: 6 }} />Recent Encounters
          </div>
          <div className="card">
            {encounterLog.slice(0, 5).map((e, i) => (
              <div key={i} style={{ padding: '.4rem 0', borderBottom: i < Math.min(encounterLog.length, 5) - 1 ? '1px solid rgba(107,78,40,.2)' : 'none', fontSize: 13 }}>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.15rem' }}>
                  <span style={{ color: 'var(--gold-dim)', fontWeight: 600 }}>S{e.session_number}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(e.created_at)}</span>
                  <span style={{ padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontSize: 11 }}>{e.setting}</span>
                  <span style={{ padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontSize: 11 }}>{e.encounter_type}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{e.rounds} rds</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>vs {Array.isArray(e.enemies) ? e.enemies.map(en => en.name || en).join(', ') : (e.enemies || '—')}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
