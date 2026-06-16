import React, { useState } from 'react';
import { Silhouette, WoundBadge } from './UI';
import { FacIcon } from './UI';
import { getArchetype, getWoundRank, repColor, repLabel, formatDate } from '../lib/utils';
import { WOUND_COLORS, WOUND_RANKS } from '../data/constants';

// ── PartyTab ──────────────────────────────────────────────────────────────────
export default function PartyTab({ isGM, isPCView, characters, reps, inventory, onUpdateInventory, encounterLog }) {
  const gmView = isGM && !isPCView;
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCat, setNewItemCat] = useState('Gear');
  const [copperDelta, setCopperDelta] = useState('');

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

  return (
    <div>
      {/* Party members */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
        <i className="ti ti-users" style={{ marginRight: 6 }} />Party Overview
      </div>

      {characters.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>
          No characters created yet.
        </div>
      ) : (
        <div style={{ marginBottom: '1.5rem' }}>
          {characters.map(c => {
            const woundRank = getWoundRank(c.current_wounds || 0, c.max_wounds || 10);
            const wColor = WOUND_COLORS[woundRank];
            return (
              <div key={c.id} className="party-card">
                <div style={{ width: 44, height: 56, borderRadius: 5, background: 'var(--bg-mid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  <Silhouette type={getArchetype(c.school)} size={36} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.35rem' }}>{c.faction} · {c.school} R{c.school_rank}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span className="party-stat" style={{ color: wColor, borderColor: wColor + '44' }}>{WOUND_RANKS[woundRank]}</span>
                    <span className="party-stat">Void {c.current_void || c.void}/{c.void}</span>
                    <span className="party-stat">{c.current_stance || 'Attack'}</span>
                    {c.current_weapon && <span className="party-stat" style={{ color: 'var(--gold-dim)' }}>⚔ {c.current_weapon.split(' ')[0]}</span>}
                    {gmView && <span className="party-stat" style={{ color: 'var(--gold-dim)' }}>{(c.xp_total || 0) - (c.xp_spent || 0)} XP</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{c.copper || 0}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>copper</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Faction standing */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
        <i className="ti ti-shield-half" style={{ marginRight: 6 }} />Faction Standing
      </div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {Object.entries(reps).map(([faction, repRow]) => {
            const rep = repRow?.reputation ?? 0;
            return (
              <div key={faction} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.3rem .25rem', borderBottom: '1px solid rgba(107,78,40,.15)', fontSize: 11 }}>
                <FacIcon name={faction} size={13} />
                <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 10 }}>{faction}</span>
                <span style={{ fontWeight: 600, color: repColor(rep), fontSize: 11 }}>{rep > 0 ? '+' : ''}{rep}</span>
                <span style={{ fontSize: 9, color: repColor(rep), minWidth: 34 }}>{repLabel(rep)}</span>
              </div>
            );
          })}
          {Object.keys(reps).length === 0 && (
            <div style={{ gridColumn: '1/-1', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.5rem 0' }}>
              No faction reputation data yet.
            </div>
          )}
        </div>
      </div>

      {/* Group inventory — full editable */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
        <i className="ti ti-backpack" style={{ marginRight: 6 }} />Group Inventory
      </div>
      <div style={{ maxWidth: 480 }}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          {/* Copper row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', padding: '.5rem', background: 'var(--bg-panel)', borderRadius: 4 }}>
            <i className="ti ti-coin" style={{ color: 'var(--gold)', fontSize: 16 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{inventory.copper ?? 0}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>copper</span>
            {gmView && (
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
                <input type="number" placeholder="±" value={copperDelta} onChange={e => setCopperDelta(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCopper()} style={{ width: 60, fontSize: 10, padding: '2px 4px' }} />
                <button className="btn btn-sm" onClick={applyCopper}>Apply</button>
              </div>
            )}
          </div>

          {/* Items */}
          {(inventory.items || []).map((item, i) => (
            <div key={i} className="inv-row">
              <span className="inv-cat">{item.category}</span>
              <span style={{ flex: 1, color: 'var(--text-primary)' }}>{item.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>×{item.qty}</span>
              {gmView && <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 9 }} onClick={() => removeItem(i)}>×</button>}
            </div>
          ))}
          {(inventory.items || []).length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.25rem 0' }}>No items.</div>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
            <i className="ti ti-swords" style={{ marginRight: 6 }} />Recent Encounters
          </div>
          <div className="card">
            {encounterLog.slice(0, 5).map((e, i) => (
              <div key={i} style={{ padding: '.4rem 0', borderBottom: i < Math.min(encounterLog.length, 5) - 1 ? '1px solid rgba(107,78,40,.2)' : 'none', fontSize: 11 }}>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.15rem' }}>
                  <span style={{ color: 'var(--gold-dim)', fontWeight: 600 }}>S{e.session_number}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{formatDate(e.created_at)}</span>
                  <span style={{ padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontSize: 9 }}>{e.setting}</span>
                  <span style={{ padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontSize: 9 }}>{e.encounter_type}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>{e.rounds} rds</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>vs {e.enemies}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
