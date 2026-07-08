import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';
import EncounterBuilder from './EncounterBuilder';
import { QuestCreateForm } from './QuestTab';

// Reveal model: this only stores associations (ids) on the session row. Nothing is created or hidden
// here - quests/npcs/shops/items already exist elsewhere and keep working normally regardless of this
// page. The association just means "when THIS session starts, flip these to visible / hand these off."
// Quest creation is the one exception: available here too (in addition to the Quests tab, per Charles)
// via the same shared QuestCreateForm, since prepping a session is a natural place to jot down a new
// objective without leaving Preparation.
export default function SessionPrepTab({ allSessions = [], quests = [], npcs = [], characters = [], onSaveReveals, onCreatePrepSession, onSavePreparedEncounters, npcsFromLog = [], onCreateQuest, onUnretireSession }) {
  const [sessionId, setSessionId] = useState('');
  const [shops, setShops] = useState([]);
  const [gmInventory, setGmInventory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({ questIds: [], npcIds: [], shopIds: [], gmInventoryItemIds: [], npcAssignments: {} });
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showNewQuest, setShowNewQuest] = useState(false);

  const nextSessionNum = allSessions.length > 0 ? Math.max(...allSessions.map(s => s.session_number || 0)) + 1 : 1;

  const savePrepEncounter = (setup) => {
    const sess = allSessions.find(s => s.id === sessionId);
    if (!sess) return;
    const prep = {
      id: 'prep_' + Date.now(),
      name: setup.name || `Encounter ${(sess.prepared_encounters || []).length + 1}`,
      setting: setup.setting || '',
      type: setup.type || 'Action',
      notes: setup.notes || setup.desc || '',
      gridSize: setup.gridSize || 24,
      bgUrl: setup.bgUrl || '',
      presetGridId: setup.presetGridId || null,
      gridTiles: setup.gridTiles || {},
      npcs: (setup.selectedNPCs || []).map(n => ({
        ...n,
        gridX: undefined, gridY: undefined, startX: undefined, startY: undefined,
        _actionsLeft: undefined, _action: undefined,
      })),
      created_at: new Date().toISOString(),
    };
    onSavePreparedEncounters && onSavePreparedEncounters(sessionId, [...(sess.prepared_encounters || []), prep]);
    setShowBuilder(false);
  };

  const removePrepEncounter = (prepId) => {
    const sess = allSessions.find(s => s.id === sessionId);
    if (!sess) return;
    onSavePreparedEncounters && onSavePreparedEncounters(sessionId, (sess.prepared_encounters || []).filter(p => p.id !== prepId));
  };

  const pcChars = characters.filter(c => !c.is_npc);
  const preppedSessions = allSessions.filter(s => !s.is_active && !s.closed_at);
  // Archived = anything that's been started and/or closed - once a prepped session is used, it drops
  // out of the picker above (correct, it's no longer "prepped"), but Charles wants a way to still find
  // and, if needed, un-retire it back to prepped status without losing any of its recorded history.
  const archivedSessions = allSessions.filter(s => s.is_active || s.closed_at);
  const [archivedId, setArchivedId] = useState('');

  useEffect(() => {
    const activeSess = allSessions.find(s => s.id === sessionId);
    setDraft(activeSess?.prepared_reveals || { questIds: [], npcIds: [], shopIds: [], gmInventoryItemIds: [], npcAssignments: {} });
  }, [sessionId, allSessions]);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setShops(data?.settings?.shops_v2 || []);
      setGmInventory(data?.settings?.gm_inventory || []);
      setLoaded(true);
    });
  }, []);

  const toggle = (listKey, id) => {
    setDraft(prev => {
      const list = prev[listKey] || [];
      return { ...prev, [listKey]: list.includes(id) ? list.filter(x => x !== id) : [...list, id] };
    });
  };

  const setAssignment = (npcId, charId) => {
    setDraft(prev => ({ ...prev, npcAssignments: { ...(prev.npcAssignments || {}), [npcId]: charId || null } }));
  };

  const save = async () => {
    if (!sessionId || !onSaveReveals) return;
    await onSaveReveals(sessionId, draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  if (showBuilder) {
    const sess = allSessions.find(s => s.id === sessionId);
    return (
      <EncounterBuilder
        mode="prep"
        initialSetup={{}}
        npcsFromLog={npcsFromLog}
        characters={[]}
        sessionNumber={sess?.session_number}
        preparedEncounters={sess?.prepared_encounters || []}
        onCancel={() => setShowBuilder(false)}
        onCommit={(setup) => savePrepEncounter(setup)}
      />
    );
  }

  const hiddenQuests = quests.filter(q => !q.is_visible);
  const hiddenNpcs = npcs.filter(n => !n.is_visible_to_players);
  const closedShops = shops.filter(s => !s.open);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.4rem' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Prepping For</span>
          <button className="btn btn-sm btn-p" onClick={() => setShowNewSession(s => !s)}>
            <i className="ti ti-plus" style={{ fontSize: 11 }} /> New Prepared Session
          </button>
        </div>
        {showNewSession && (() => {
          const doCreate = () => {
            onCreatePrepSession && onCreatePrepSession(nextSessionNum, newSessionTitle);
            setNewSessionTitle(''); setShowNewSession(false);
          };
          return (
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', alignItems: 'center', padding: '.5rem .75rem', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Session #{nextSessionNum}</span>
              <input style={{ flex: 1, fontSize: 13, minWidth: 120 }} placeholder="Title (optional)" value={newSessionTitle} onChange={e => setNewSessionTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') doCreate(); }} />
              <button className="btn btn-sm btn-p" onClick={doCreate}>Create</button>
              <button className="btn btn-sm" onClick={() => setShowNewSession(false)}>✕</button>
            </div>
          );
        })()}
        {preppedSessions.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No prepared (not-yet-started) sessions exist. Create one above.
          </div>
        ) : (
          <select value={sessionId} onChange={e => setSessionId(e.target.value)} style={{ width: '100%' }}>
            <option value="">- choose a prepared session -</option>
            {preppedSessions.map(s => <option key={s.id} value={s.id}>{s.title || `Session ${s.session_number}`}</option>)}
          </select>
        )}
      </div>

      {sessionId && (
        <>
          <Section title="Prepared Encounters">
            {(() => {
              const sess = allSessions.find(s => s.id === sessionId);
              const prep = sess?.prepared_encounters || [];
              return (
                <>
                  <div style={{ marginBottom: 6 }}>
                    <button className="btn btn-sm btn-p" style={{ fontSize: 11 }} onClick={() => setShowBuilder(true)}>+ Add Encounter</button>
                  </div>
                  {prep.length === 0 && <Empty text="No prepared encounters yet." />}
                  {prep.map(p => (
                    <div key={p.id} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', padding: '.3rem .5rem', background: 'rgba(107,78,40,.1)', borderRadius: 4, marginBottom: '.3rem', border: '1px solid var(--border)' }}>
                      <i className="ti ti-swords" style={{ fontSize: 12, color: 'var(--gold-dim)' }} />
                      <span style={{ flex: 1, fontSize: 13 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.setting} · {p.type}{p.npcs?.length ? ` · ${p.npcs.length} NPCs` : ''}</span>
                      <button className="btn btn-sm" style={{ fontSize: 11, color: 'var(--red)' }} onClick={() => removePrepEncounter(p.id)}>✕</button>
                    </div>
                  ))}
                </>
              );
            })()}
          </Section>

          <Section title="Quests to Reveal">
            {onCreateQuest && (
              <div style={{ marginBottom: '.5rem' }}>
                {showNewQuest ? (
                  <QuestCreateForm quests={quests} onCreateQuest={onCreateQuest} onCancel={() => setShowNewQuest(false)} />
                ) : (
                  <button className="btn btn-sm btn-p" onClick={() => setShowNewQuest(true)}>
                    <i className="ti ti-plus" style={{ fontSize: 13 }} /> New Objective
                  </button>
                )}
              </div>
            )}
            {hiddenQuests.length === 0 && <Empty text="No hidden quests." />}
            {hiddenQuests.map(q => (
              <CheckRow key={q.id} checked={(draft.questIds || []).includes(q.id)} onChange={() => toggle('questIds', q.id)} label={q.title} />
            ))}
          </Section>

          <Section title="NPCs to Reveal">
            {hiddenNpcs.length === 0 && <Empty text="No hidden NPCs." />}
            {hiddenNpcs.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <CheckRow checked={(draft.npcIds || []).includes(n.id)} onChange={() => toggle('npcIds', n.id)} label={n.name} />
                {(draft.npcIds || []).includes(n.id) && (
                  <select value={draft.npcAssignments?.[n.id] || ''} onChange={e => setAssignment(n.id, e.target.value)} style={{ fontSize: 11 }}>
                    <option value="">Not assigned (GM-controlled)</option>
                    {pcChars.map(c => <option key={c.id} value={c.id}>Assign to {c.name}</option>)}
                  </select>
                )}
              </div>
            ))}
          </Section>

          <Section title="Shops to Open">
            {closedShops.length === 0 && <Empty text="No closed shops." />}
            {closedShops.map(s => (
              <CheckRow key={s.id} checked={(draft.shopIds || []).includes(s.id)} onChange={() => toggle('shopIds', s.id)} label={s.name} />
            ))}
          </Section>

          <Section title="Items to Give to the Party (from GM's Inventory)">
            {gmInventory.length === 0 && <Empty text="GM's Inventory is empty." />}
            {gmInventory.map(item => (
              <CheckRow key={item.id} checked={(draft.gmInventoryItemIds || []).includes(item.id)} onChange={() => toggle('gmInventoryItemIds', item.id)} label={item.name} />
            ))}
          </Section>

          <button className="btn btn-p" onClick={save}>{saved ? '✓ Saved' : 'Save Session Plan'}</button>
        </>
      )}

      {/* Archived (started/closed) sessions - rarely used, kept out of the way at the bottom */}
      {archivedSessions.length > 0 && (
        <div style={{ marginTop: '1.5rem', paddingTop: '.75rem', borderTop: '1px solid rgba(107,78,40,.2)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={archivedId} onChange={e => setArchivedId(e.target.value)} style={{ fontSize: 12, flex: 1, minWidth: 160 }}>
            <option value="">- archived (started/closed) sessions -</option>
            {archivedSessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.title || `Session ${s.session_number}`}{s.is_active ? ' (active)' : s.closed_at ? ' (closed)' : ''}
              </option>
            ))}
          </select>
          <button className="btn btn-sm" disabled={!archivedId || archivedSessions.find(s => s.id === archivedId)?.is_active}
            title={archivedSessions.find(s => s.id === archivedId)?.is_active ? "Can't un-retire the currently active session - use End Session for that" : 'Move this session back to Prepared (its recap, encounter log, etc. are untouched)'}
            onClick={() => { if (onUnretireSession && archivedId) { onUnretireSession(archivedId); setArchivedId(''); } }}>
            <i className="ti ti-arrow-back-up" style={{ marginRight: 4 }} />Un-retire
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</div>
      {children}
    </div>
  );
}
function Empty({ text }) {
  return <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{text}</div>;
}
function CheckRow({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 4, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
