import React, { useState } from 'react';
import { Empty } from './UI';
import { formatDate } from '../lib/utils';
import EncounterBuilder from './EncounterBuilder';
import { QUEST_TYPES } from './QuestTab';

// ── LogTab ────────────────────────────────────────────────────────────────────
export default function LogTab({ isGM, encounterLog, sessionLog, allSessions, activeSession, onDeleteSession, onSavePreparedEncounters, onSavePreparedQuests, npcsFromLog, skillLog, eventLog = [], onUpdateSessionRecap, isPlayer }) {
  const [expandedSession, setExpandedSession] = useState({});
  const [showBuilderFor, setShowBuilderFor] = useState(null);
  const [showQuestFormFor, setShowQuestFormFor] = useState(null);
  const [newQuest, setNewQuest] = useState({ title: '', quest_type: 'main', description: '' });

  // All-Time skill usage = sum of each closed session's own recorded count, plus the live current
  // session's count. The old "total" field on skillLog just incremented forever in memory with no
  // session-boundary awareness, and got reset to {} whenever a session ended - so it was never a
  // real all-time figure. This aggregates from what's actually persisted per session instead.
  const allTimeTotals = {};
  (sessionLog || []).forEach(s => {
    if (s.is_active) return; // current session's live count comes from the skillLog prop instead
    Object.entries(s.recap?.skill_log || {}).forEach(([skill, v]) => {
      allTimeTotals[skill] = (allTimeTotals[skill] || 0) + (v.session || 0);
    });
  });
  Object.entries(skillLog || {}).forEach(([skill, v]) => {
    allTimeTotals[skill] = (allTimeTotals[skill] || 0) + (v.session || 0);
  });

  const skillRows = Object.entries({ ...Object.fromEntries(Object.keys(allTimeTotals).map(k => [k, {}])), ...(skillLog || {}) })
    .map(([sk, v]) => [sk, { ...v, allTime: allTimeTotals[sk] || 0 }])
    .sort((a, b) => b[1].allTime - a[1].allTime);
  const maxTotal = Math.max(...skillRows.map(([, v]) => v.allTime), 1);

  const encountersBySession = (encounterLog || []).reduce((acc, e) => {
    const sn = e.session_number || 0;
    if (!acc[sn]) acc[sn] = [];
    acc[sn].push(e);
    return acc;
  }, {});

  // Prep-only (not-yet-started) sessions now live exclusively in Preparation → Session Prep - Log stays
  // "pure record keeping" and only ever shows sessions that are active or have actually been played.
  const rawSess = allSessions || [];
  const allSess = rawSess.filter(s => s.is_active || s.closed_at);
  // Display numbering is purely "the order sessions were closed" per Charles - not the stored
  // session_number field, which stays untouched since encounter/skill logs are still tagged and
  // correlated against it (see encountersBySession below). The active session (not yet closed)
  // always sorts last, as the most recent. No more manual renumbering - this is always correct.
  const displayNumberById = Object.fromEntries(
    [...allSess]
      .sort((a, b) => {
        if (a.is_active) return 1;
        if (b.is_active) return -1;
        return new Date(a.closed_at) - new Date(b.closed_at);
      })
      .map((s, i) => [s.id, i + 1])
  );

  const savePrepEncounter = (sessionId, setup) => {
    const sess = allSess.find(s => s.id === sessionId);
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
        // strip live-encounter-only fields for storage
        gridX: undefined, gridY: undefined, startX: undefined, startY: undefined,
        _actionsLeft: undefined, _action: undefined,
      })),
      created_at: new Date().toISOString(),
    };
    onSavePreparedEncounters && onSavePreparedEncounters(sessionId, [...(sess.prepared_encounters || []), prep]);
    setShowBuilderFor(null);
  };

  const savePrepQuest = (sessionId) => {
    const sess = allSess.find(s => s.id === sessionId);
    if (!sess || !newQuest.title.trim()) return;
    const prep = {
      id: 'prepq_' + Date.now(),
      title: newQuest.title.trim(),
      quest_type: newQuest.quest_type,
      description: newQuest.description || '',
      created_at: new Date().toISOString(),
    };
    onSavePreparedQuests && onSavePreparedQuests(sessionId, [...(sess.prepared_quests || []), prep]);
    setNewQuest({ title: '', quest_type: 'main', description: '' });
    setShowQuestFormFor(null);
  };

  const removePrepQuest = (sessionId, prepId) => {
    const sess = allSess.find(s => s.id === sessionId);
    if (!sess) return;
    onSavePreparedQuests && onSavePreparedQuests(sessionId, (sess.prepared_quests || []).filter(p => p.id !== prepId));
  };

  // If the full encounter builder is open for a session, show it full-screen
  if (showBuilderFor) {
    const sess = allSess.find(s => s.id === showBuilderFor);
    return (
      <EncounterBuilder
        mode="prep"
        initialSetup={{}}
        npcsFromLog={npcsFromLog || []}
        characters={[]}
        sessionNumber={sess?.session_number}
        preparedEncounters={sess?.prepared_encounters || []}
        onCancel={() => setShowBuilderFor(null)}
        onCommit={(setup) => savePrepEncounter(showBuilderFor, setup)}
      />
    );
  }

  const removePrepEncounter = (sessionId, prepId) => {
    const sess = allSess.find(s => s.id === sessionId);
    if (!sess) return;
    onSavePreparedEncounters && onSavePreparedEncounters(sessionId, (sess.prepared_encounters || []).filter(p => p.id !== prepId));
  };

  return (
    <div>
      {/* ── Session List + Event Log share a row on wide screens (same flex-wrap pattern used
          elsewhere), stacking vertically on narrow/mobile screens automatically. ── */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      <div style={{ flex: '1 1 380px', minWidth: 300 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
          <i className="ti ti-list" style={{ marginRight: 5 }} />Campaign Sessions
        </div>

        {allSess.length === 0 ? (
          <Empty icon="ti-calendar" message="No sessions yet. Start one using the bar above, or prep a future session from Preparation → Session Prep." />
        ) : (
          allSess.map(s => {
            const isCurrent = s.is_active;
            const isPast = !s.is_active && s.closed_at;
            const prep = s.prepared_encounters || [];
            const prepQuests = s.prepared_quests || [];
            const exp = expandedSession[s.id];
            const sessionEncounters = encountersBySession[s.session_number] || [];
            const recap = s.recap || {};

            return (
              <div key={s.id} style={{ border: `1px solid ${isCurrent ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 6, marginBottom: '.5rem', background: 'var(--bg-panel)', overflow: 'hidden' }}>
                <div style={{ padding: '.6rem .75rem', display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}
                  onClick={() => setExpandedSession(e => ({ ...e, [s.id]: !e[s.id] }))}>
                  {/* Golden spear for current session */}
                  {isCurrent
                    ? <i className="ti ti-spear" style={{ fontSize: 15, color: 'var(--gold)', flexShrink: 0 }} />
                    : <i className={`ti ${isPast ? 'ti-calendar-check' : 'ti-calendar'}`} style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? 'var(--gold)' : 'var(--text-secondary)' }}>
                    Session {displayNumberById[s.id]}
                  </span>
                  {(s.title || s.recap?.event) && (
                    <span style={{ fontFamily: "'El Messiri', serif", fontWeight: 700, fontSize: 19, color: 'var(--gold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, letterSpacing: '.02em' }}>
                      {s.title || s.recap?.event}
                    </span>
                  )}
                  {isCurrent && <span style={{ fontSize: 10, color: 'var(--green)', border: '1px solid var(--green-dim)', borderRadius: 3, padding: '0 4px', flexShrink: 0 }}>ACTIVE</span>}
                  {prep.length > 0 && <span style={{ fontSize: 11, color: 'var(--gold-dim)', flexShrink: 0 }}>{prep.length} prepared</span>}
                  {prepQuests.length > 0 && <span style={{ fontSize: 11, color: 'var(--gold-dim)', flexShrink: 0 }}>{prepQuests.length} quest{prepQuests.length !== 1 ? 's' : ''} prepped</span>}
                  {sessionEncounters.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{sessionEncounters.length} fought</span>}
                  {isGM && !isCurrent && (
                    <button className="btn btn-sm" title="Delete session"
                      style={{ fontSize: 11, color: 'var(--red)', padding: '0 5px', flexShrink: 0 }}
                      onClick={e => { e.stopPropagation(); if (window.confirm(`Delete Session ${displayNumberById[s.id]}?`)) onDeleteSession && onDeleteSession(s.id); }}>
                      <i className="ti ti-trash" />
                    </button>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 'auto' }}>{exp ? '▲' : '▼'}</span>
                </div>

                {exp && (
                  <div style={{ background: 'var(--bg-dark)', borderTop: '1px solid var(--border)', padding: '.5rem .75rem' }}>
                    {/* Past session recap */}
                    {isPast && (
                      <div style={{ marginBottom: '.6rem' }}>
                        {recap._stamp && (
                          <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: '.4rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="ti ti-calendar" style={{ fontSize: 11 }} />
                            {recap._stamp}
                          </div>
                        )}
                        {Object.values(recap).some(v => v && typeof v === 'string' && v.trim()) && (<>
                          {recap.event && <RecapRow label="Key Event" value={recap.event} />}
                          {recap.npcs && <RecapRow label="Key NPCs" value={recap.npcs} />}
                          {recap.factions && <RecapRow label="Faction Changes" value={recap.factions} />}
                          {recap.loot && <RecapRow label="Loot / Rewards" value={recap.loot} />}
                          {recap.changes && <RecapRow label="Character Changes" value={recap.changes} />}
                        </>)}
                        {/* Full archived event timeline for this closed session - dice rolled, equipment
                            changes, spells cast, everything that was logged while it was live. Previously
                            this data was saved to event_log but never displayed once a session closed.
                            Filters out gmOnly entries (character claims, NPC creation, etc.) for players,
                            same as the live ticker already does - this view previously showed everyone
                            everything regardless of viewer. */}
                        {(() => {
                          const visibleEvents = (s.events || []).filter(e => isGM || !e.gmOnly);
                          return visibleEvents.length > 0 && (
                          <div style={{ marginTop: '.6rem' }}>
                            <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>
                              Full Event Log <span style={{ fontWeight: 400, textTransform: 'none' }}>({visibleEvents.length} events)</span>
                            </div>
                            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--border)', borderRadius: 4, padding: '.3rem' }}>
                              {visibleEvents.map((e, i) => (
                                <div key={e.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 6px', borderBottom: i < visibleEvents.length - 1 ? '1px solid rgba(107,78,40,.1)' : 'none' }}>
                                  <i className={`ti ${e.icon || 'ti-point'}`} style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }} />
                                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{e.text}</span>
                                  <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
                                    {e.ts ? new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* GM Notes & Player Notes - live-editable on any session, active or archived.
                        GM Notes is GM-only (private prep/secrets); Player Notes is collaborative,
                        visible and editable by everyone. */}
                    <SessionNotesSection session={s} isGM={isGM} onUpdateSessionRecap={onUpdateSessionRecap} />

                    {/* Past encounters */}
                    {sessionEncounters.length > 0 && (
                      <div style={{ marginBottom: '.6rem' }}>
                        <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>Encounters Fought</div>
                        {sessionEncounters.map((e, i) => (
                          <div key={e.id || i} style={{ padding: '.3rem 0', borderBottom: '1px solid rgba(107,78,40,.15)' }}>
                            <div style={{ display: 'flex', gap: '.5rem', fontSize: 12, color: 'var(--text-muted)', alignItems: 'center' }}>
                              <i className="ti ti-swords" style={{ fontSize: 12, flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{e.encounter_name || e.setting || 'Encounter'}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· {e.encounter_type} · {e.rounds} rounds</span>
                            </div>
                            {e.description && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, marginLeft: 20, fontStyle: 'italic', lineHeight: 1.4 }}>{e.description}</div>
                            )}
                            {((e.party_members?.length > 0) || (e.enemies?.length > 0)) && (
                              <div style={{ marginTop: 3, marginLeft: 20, fontSize: 11, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {e.party_members?.length > 0 && (
                                  <span style={{ color: 'var(--green-dim)' }}>
                                    <i className="ti ti-users" style={{ fontSize: 10, marginRight: 3 }} />
                                    {e.party_members.map(p => p.name).join(', ')}
                                  </span>
                                )}
                                {e.enemies?.length > 0 && (
                                  <span style={{ color: 'var(--red-dim)' }}>
                                    <i className="ti ti-skull" style={{ fontSize: 10, marginRight: 3 }} />
                                    {e.enemies.map(en => en.name).join(', ')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Prepared encounters for this session */}
                    {isGM && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Prepared Encounters</span>
                          <button className="btn btn-sm btn-p" style={{ fontSize: 10 }} onClick={() => setShowBuilderFor(s.id)}>
                            + Add Encounter
                          </button>
                        </div>
                        {prep.length === 0 && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No prepared encounters yet.</div>
                        )}
                        {prep.map(p => (
                          <div key={p.id} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', padding: '.3rem .5rem', background: 'rgba(107,78,40,.1)', borderRadius: 4, marginBottom: '.3rem', border: '1px solid var(--border)' }}>
                            <i className="ti ti-swords" style={{ fontSize: 12, color: 'var(--gold-dim)' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.setting} · {p.type} · {p.npcs?.length || 0} NPCs</div>
                            </div>
                            <button className="btn btn-sm" style={{ fontSize: 10, color: 'var(--red)' }} onClick={() => removePrepEncounter(s.id, p.id)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Prepared quests for this session - auto-created when the session becomes active */}
                    {isGM && (
                      <div style={{ marginTop: '.6rem' }}>
                        <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Prepared Quests</span>
                          <button className="btn btn-sm btn-p" style={{ fontSize: 10 }}
                            onClick={() => setShowQuestFormFor(showQuestFormFor === s.id ? null : s.id)}>
                            + Add Quest
                          </button>
                        </div>
                        {showQuestFormFor === s.id && (
                          <div style={{ padding: '.5rem', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 4, marginBottom: '.4rem' }}>
                            <input placeholder="Quest name *" autoFocus value={newQuest.title}
                              onChange={e => setNewQuest(q => ({ ...q, title: e.target.value }))}
                              style={{ width: '100%', marginBottom: '.35rem' }} />
                            <div style={{ display: 'flex', gap: 4, marginBottom: '.35rem' }}>
                              {Object.entries(QUEST_TYPES).filter(([k]) => k !== 'player').map(([k, qt]) => (
                                <button key={k} className="btn btn-sm" style={{
                                  fontSize: 10, borderColor: newQuest.quest_type === k ? qt.color : 'var(--border)',
                                  color: newQuest.quest_type === k ? qt.color : 'var(--text-muted)',
                                  background: newQuest.quest_type === k ? qt.bg : 'transparent',
                                }} onClick={() => setNewQuest(q => ({ ...q, quest_type: k }))}>
                                  {qt.label}
                                </button>
                              ))}
                            </div>
                            <textarea placeholder="Quest description" rows={2} value={newQuest.description}
                              onChange={e => setNewQuest(q => ({ ...q, description: e.target.value }))}
                              style={{ width: '100%', resize: 'vertical', marginBottom: '.35rem' }} />
                            <div style={{ display: 'flex', gap: '.4rem' }}>
                              <button className="btn btn-sm btn-p" disabled={!newQuest.title.trim()} onClick={() => savePrepQuest(s.id)}>Save</button>
                              <button className="btn btn-sm" onClick={() => { setShowQuestFormFor(null); setNewQuest({ title: '', quest_type: 'main', description: '' }); }}>Cancel</button>
                            </div>
                          </div>
                        )}
                        {prepQuests.length === 0 && showQuestFormFor !== s.id && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No prepared quests yet.</div>
                        )}
                        {prepQuests.map(p => {
                          const qt = QUEST_TYPES[p.quest_type] || QUEST_TYPES.main;
                          return (
                            <div key={p.id} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', padding: '.3rem .5rem', background: 'rgba(107,78,40,.1)', borderRadius: 4, marginBottom: '.3rem', border: '1px solid var(--border)' }}>
                              <i className="ti ti-target" style={{ fontSize: 12, color: qt.color }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.title}</div>
                                <div style={{ fontSize: 11, color: qt.color }}>{qt.label}</div>
                              </div>
                              <button className="btn btn-sm" style={{ fontSize: 10, color: 'var(--red)' }} onClick={() => removePrepQuest(s.id, p.id)}>×</button>
                            </div>
                          );
                        })}
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: prepQuests.length > 0 ? '.3rem' : 0 }}>
                          Created automatically in the Quest Log when this session becomes active.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div style={{ flex: '1 1 320px', minWidth: 280 }}>
        {eventLog.length > 0 ? (
          <div className="card">
            <div className="card-title">
              <i className="ti ti-timeline" style={{ marginRight: 4 }} />This Session - Events
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>{eventLog.length} events</span>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {eventLog.map((e, i) => (
                <div key={e.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderBottom: '1px solid rgba(107,78,40,.1)', background: e.highlight ? 'rgba(200,150,42,.06)' : 'transparent' }}>
                  <i className={`ti ${e.icon || 'ti-point'}`} style={{ fontSize: 12, color: e.highlight ? 'var(--gold)' : 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: e.highlight ? 'var(--gold)' : 'var(--text-secondary)' }}>{e.text}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {e.ts ? new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No events logged yet this session.</div>
        )}
      </div>
      </div>

      {/* ── Skill Usage ────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title"><i className="ti ti-chart-bar" style={{ marginRight: 4 }} />Skill Usage</div>
        {skillRows.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No skill rolls recorded yet this session.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Skill','Encounter','Session','All-Time',''].map(h => (
                <th key={h} style={{ textAlign: h === 'Skill' ? 'left' : 'center', padding: '4px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {skillRows.map(([sk, v]) => (
                <tr key={sk} style={{ borderBottom: '1px solid rgba(107,78,40,.1)' }}>
                  <td style={{ padding: '4px 6px', color: v.session > 3 ? 'var(--gold)' : 'var(--text-primary)', fontWeight: v.session > 3 ? 600 : 400 }}>{sk}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: v.encounter > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{v.encounter || 0}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>{v.session || 0}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>{v.allTime}</td>
                  <td style={{ padding: '4px 6px' }}>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-panel)', width: 80 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: v.session > 5 ? 'var(--red)' : v.session > 2 ? 'var(--gold)' : 'var(--gold-dim)', width: `${Math.min((v.session / Math.max(...skillRows.map(([,x]) => x.session || 0), 1)) * 80, 80)}px` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function RecapRow({ label, value }) {
  return (
    <div style={{ marginBottom: '.4rem' }}>
      <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{value}</div>
    </div>
  );
}

// GM Notes (private, GM-only) and Player Notes (collaborative, everyone) for a single session.
// Both live inside the session's recap JSON blob, merge-patched on blur to avoid per-keystroke saves.
function SessionNotesSection({ session, isGM, onUpdateSessionRecap }) {
  let recap = {};
  try { recap = JSON.parse(session.recap || '{}'); } catch { recap = {}; }
  const [gmDraft, setGmDraft] = useState(recap.gmNotes || '');
  const [playerDraft, setPlayerDraft] = useState(recap.playerNotes || '');
  React.useEffect(() => { setGmDraft(recap.gmNotes || ''); }, [recap.gmNotes]);
  React.useEffect(() => { setPlayerDraft(recap.playerNotes || ''); }, [recap.playerNotes]);

  if (!onUpdateSessionRecap) return null;

  return (
    <div style={{ marginBottom: '.6rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {isGM && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-lock" style={{ fontSize: 11 }} /> GM Notes <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>(private - only you see this)</span>
          </div>
          <textarea value={gmDraft} onChange={e => setGmDraft(e.target.value)}
            onBlur={() => { if (gmDraft !== (recap.gmNotes || '')) onUpdateSessionRecap(session.id, { gmNotes: gmDraft }); }}
            placeholder="Secrets, hooks, what's coming next..."
            style={{ width: '100%', minHeight: 50, fontSize: 12, padding: '.4rem .5rem', resize: 'vertical', boxSizing: 'border-box', background: 'rgba(160,40,40,.04)', borderColor: 'rgba(160,40,40,.25)' }} />
        </div>
      )}
      <div>
        <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem', display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="ti ti-users" style={{ fontSize: 11 }} /> Player Notes <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>(everyone can edit)</span>
        </div>
        <textarea value={playerDraft} onChange={e => setPlayerDraft(e.target.value)}
          onBlur={() => { if (playerDraft !== (recap.playerNotes || '')) onUpdateSessionRecap(session.id, { playerNotes: playerDraft }); }}
          placeholder="What we remember, theories, things to follow up on..."
          style={{ width: '100%', minHeight: 50, fontSize: 12, padding: '.4rem .5rem', resize: 'vertical', boxSizing: 'border-box' }} />
      </div>
    </div>
  );
}
