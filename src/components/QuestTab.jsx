import React, { useState } from 'react';
import { Empty } from './UI';

const STATUS_ORDER = { active: 0, carried_over: 1, complete: 2, failed: 3 };

const STATUS_STYLE = {
  active:       'q-active',
  complete:     'q-complete',
  failed:       'q-failed',
  carried_over: 'q-carried',
};

// ── QuestTab ──────────────────────────────────────────────────────────────────
export default function QuestTab({ isGM, isPCView, session, quests, onCreateQuest, onUpdateQuest, inventory, onUpdateInventory }) {
  const [showNew, setShowNew] = useState(false);
  const [newQ, setNewQ] = useState({ title: '', description: '', is_visible: false });
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCat, setNewItemCat] = useState('Gear');
  const [copperDelta, setCopperDelta] = useState('');
  const gmView = isGM && !isPCView;

  const visibleQuests = gmView ? quests : quests.filter(q => q.is_visible);
  const sorted = [...visibleQuests].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  const createQuest = async () => {
    if (!newQ.title.trim()) return;
    await onCreateQuest({ ...newQ, status: 'active', player_notes: '', gm_notes: '', sort_order: quests.length });
    setNewQ({ title: '', description: '', is_visible: false });
    setShowNew(false);
  };

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
    const items = (inventory.items || []).filter((_, i) => i !== idx);
    onUpdateInventory({ items });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Session {session?.session_number || '—'} — Objectives
        </span>
        {gmView && (
          <button className="btn btn-sm btn-p" onClick={() => setShowNew(!showNew)}>
            <i className="ti ti-plus" style={{ fontSize: 11 }} /> New Objective
          </button>
        )}
      </div>

      {/* New objective form */}
      {showNew && gmView && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-title">New Objective</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <input
              placeholder="Objective title *" autoFocus
              value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })}
              style={{ width: '100%' }}
              onKeyDown={e => e.key === 'Enter' && createQuest()}
            />
            <textarea
              rows={2} placeholder="Description (shown to players when visible)"
              value={newQ.description} onChange={e => setNewQ({ ...newQ, description: e.target.value })}
              style={{ width: '100%', resize: 'vertical' }}
            />
            <label className="chk-row">
              <input type="checkbox" checked={newQ.is_visible} onChange={e => setNewQ({ ...newQ, is_visible: e.target.checked })} />
              Reveal to players immediately
            </label>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-p btn-sm" disabled={!newQ.title.trim()} onClick={createQuest}>Add</button>
              <button className="btn btn-sm" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Objectives list */}
      {sorted.length === 0 ? (
        <Empty icon="ti-target" message={gmView ? 'No objectives yet. Create one above.' : 'No objectives visible yet.'} />
      ) : sorted.map(q => {
        return (
          <div key={q.id} className="qitem">
            <div className="qhdr">
              <span className={`qstat ${STATUS_STYLE[q.status] || 'q-active'}`}>
                {q.status === 'carried_over' ? 'carried' : q.status}
              </span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{q.title}</span>
              {gmView && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <select
                    style={{ fontSize: 10, padding: '2px 4px' }}
                    value={q.status}
                    onChange={e => onUpdateQuest(q.id, { status: e.target.value })}
                  >
                    {['active', 'complete', 'failed', 'carried_over'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span
                    title={q.is_visible ? 'Visible — click to hide' : 'Hidden — click to reveal'}
                    style={{ cursor: 'pointer', fontSize: 13, color: q.is_visible ? 'var(--green)' : 'var(--text-muted)' }}
                    onClick={() => onUpdateQuest(q.id, { is_visible: !q.is_visible })}
                  >
                    {q.is_visible ? '●' : '○'}
                  </span>
                </div>
              )}
            </div>

            <>
              {q.description && (
                <div style={{ padding: '.4rem .75rem', fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-dark)', borderTop: '1px solid var(--border)', lineHeight: 1.5 }}>
                  {q.description}
                </div>
              )}

              {/* Player notes */}
              {(q.player_notes || q.notes) && (
                <div style={{ padding: '.3rem .75rem', background: 'var(--bg-dark)', borderTop: '1px solid rgba(107,78,40,.2)', fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Notes: {q.player_notes || q.notes}
                </div>
              )}
              {!(q.player_notes || q.notes) && (
                <div style={{ padding: '.3rem .75rem', background: 'var(--bg-dark)', borderTop: '1px solid rgba(107,78,40,.2)' }}>
                  <textarea
                    placeholder="Party notes..."
                    value={q.player_notes || ''}
                    onChange={e => onUpdateQuest(q.id, { player_notes: e.target.value })}
                    style={{ width: '100%', resize: 'vertical', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 10, outline: 'none', minHeight: 28, fontFamily: 'inherit' }}
                  />
                </div>
              )}

              {/* GM notes */}
              {gmView && (
                <div className="gm-notes-area">
                  <div style={{ fontSize: 9, color: 'var(--gold-dim)', marginBottom: 2 }}>GM Notes (private):</div>
                  <textarea
                    placeholder="Private GM notes..."
                    value={q.gm_notes || ''}
                    onChange={e => onUpdateQuest(q.id, { gm_notes: e.target.value })}
                  />
                </div>
              )}
            </>
          </div>
        );
      })}
      {/* Group Inventory */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
          <i className="ti ti-backpack" style={{ marginRight: 6 }} />Group Inventory
        </div>
        <div className="card">
          {/* Copper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', padding: '.5rem', background: 'var(--bg-panel)', borderRadius: 4 }}>
            <i className="ti ti-coin" style={{ color: 'var(--gold)', fontSize: 16 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{inventory.copper ?? 0}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>copper</span>
            {gmView && (
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
                <input
                  type="number" placeholder="±amount"
                  value={copperDelta} onChange={e => setCopperDelta(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCopper()}
                  style={{ width: 70, fontSize: 10, padding: '2px 4px' }}
                />
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
              {gmView && (
                <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 9 }} onClick={() => removeItem(i)}>×</button>
              )}
            </div>
          ))}
          {(inventory.items || []).length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.25rem 0' }}>No items in party inventory.</div>
          )}

          {/* Add item — GM only */}
          {gmView && (
            <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="Item name" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                style={{ flex: 1, minWidth: 100 }}
              />
              <select value={newItemCat} onChange={e => setNewItemCat(e.target.value)}>
                {['Quest Item', 'Weapon', 'Armor', 'Gear', 'Loot', 'Consumable'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min={1} value={newItemQty} onChange={e => setNewItemQty(+e.target.value)} style={{ width: 50 }} />
              <button className="btn btn-sm btn-p" disabled={!newItemName.trim()} onClick={addItem}>Add</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
