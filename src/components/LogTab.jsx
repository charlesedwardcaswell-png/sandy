import React, { useState } from 'react';
import { Empty } from './UI';
import { formatDate } from '../lib/utils';
import EncounterBuilder from './EncounterBuilder';

// ── LogTab ────────────────────────────────────────────────────────────────────
export default function LogTab({ isGM, encounterLog, sessionLog, allSessions, activeSession, onActivateSession, onCreatePrepSession, onSavePreparedEncounters, npcsFromLog, skillLog, eventLog = [] }) {
  const [expandedSession, setExpandedSession] = useState({});
  const [showBuilderFor, setShowBuilderFor] = useState(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [showNewSession, setShowNewSession] = useState(false);

  const skillRows = Object.entries(skillLog || {}).sort((a, b) => b[1].total - a[1].total);
  const maxTotal = Math.max(...skillRows.map(([, v]) => v.total), 1);

  const encountersBySession = (encounterLog || []).reduce((acc, e) => {
    const sn = e.session_number || 0;
    if (!acc[sn]) acc[sn] = [];
    acc[sn].push(e);
    return acc;
  }, {});

  const allSess = allSessions || [];
  const nextSessionNum = allSess.length > 0 ? Math.max(...allSess.map(s => s.session_number || 0)) + 1 : 1;

  const savePrepEncounter = (sessionId, setup) => {
    const sess = allSess.find(s => s.id === sessionId);
    if (!sess) return;
    const prep = {
      id: 'prep_' + Date.now(),
      name: setup.name || `Encounter ${(sess.prepared_encounters || []).length + 1}`,
      setting: setup.setting || '',
      type: setup.type || 'Action',
      notes: setup.notes || setup.desc || '',
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
      {/* ── Session List ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            <i className="ti ti-list" style={{ marginRight: 5 }} />Campaign Sessions
          </div>
          {isGM && (
            <button className="btn btn-sm btn-p" onClick={() => setShowNewSession(s => !s)}>
              <i className="ti ti-plus" style={{ fontSize: 11 }} /> Prep Session
            </button>
          )}
        </div>

        {isGM && showNewSession && (
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', alignItems: 'center', padding: '.5rem .75rem', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Session {nextSessionNum}</span>
            <input style={{ flex: 1, fontSize: 13 }} placeholder="Title (optional)" value={newSessionTitle} onChange={e => setNewSessionTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onCreatePrepSession && onCreatePrepSession(nextSessionNum, newSessionTitle); setNewSessionTitle(''); setShowNewSession(false); } }} />
            <button className="btn btn-sm btn-p" onClick={() => { onCreatePrepSession && onCreatePrepSession(nextSessionNum, newSessionTitle); setNewSessionTitle(''); setShowNewSession(false); }}>Create</button>
            <button className="btn btn-sm" onClick={() => setShowNewSession(false)}>✕</button>
          </div>
        )}

        {allSess.length === 0 ? (
          <Empty icon="ti-calendar" message="No sessions yet. Start a session using the bar above, or prep a future session here." />
        ) : (
          allSess.map(s => {
            const isCurrent = s.is_active;
            const isPast = !s.is_active && s.closed_at;
            const isPrep = !s.is_active && !s.closed_at;
            const prep = s.prepared_encounters || [];
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
                    Session {s.session_number}
                  </span>
                  {(s.title || s.recap?.event) && (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {s.title || s.recap?.event}
                    </span>
                  )}
                  {isCurrent && <span style={{ fontSize: 10, color: 'var(--green)', border: '1px solid var(--green-dim)', borderRadius: 3, padding: '0 4px', flexShrink: 0 }}>ACTIVE</span>}
                  {isPrep && <span style={{ fontSize: 10, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 3, padding: '0 4px', flexShrink: 0 }}>PREP</span>}
                  {prep.length > 0 && <span style={{ fontSize: 11, color: 'var(--gold-dim)', flexShrink: 0 }}>{prep.length} prepared</span>}
                  {sessionEncounters.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{sessionEncounters.length} fought</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 'auto' }}>{exp ? '▲' : '▼'}</span>
                </div>

                {exp && (
                  <div style={{ background: 'var(--bg-dark)', borderTop: '1px solid var(--border)', padding: '.5rem .75rem' }}>
                    {/* GM controls */}
                    {isGM && !isCurrent && isPrep && (
                      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.6rem' }}>
                        <button className="btn btn-sm btn-p" onClick={() => onActivateSession && onActivateSession(s.id)}>
                          <i className="ti ti-player-play" style={{ fontSize: 11 }} /> Make Active Session
                        </button>
                      </div>
                    )}

                    {/* Past session recap */}
                    {isPast && Object.values(recap).some(v => v?.trim()) && (
                      <div style={{ marginBottom: '.6rem' }}>
                        {recap.event && <RecapRow label="Key Event" value={recap.event} />}
                        {recap.npcs && <RecapRow label="Key NPCs" value={recap.npcs} />}
                        {recap.factions && <RecapRow label="Faction Changes" value={recap.factions} />}
                        {recap.loot && <RecapRow label="Loot / Rewards" value={recap.loot} />}
                        {recap.changes && <RecapRow label="Character Changes" value={recap.changes} />}
                      </div>
                    )}

                    {/* Past encounters */}
                    {sessionEncounters.length > 0 && (
                      <div style={{ marginBottom: '.6rem' }}>
                        <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>Encounters Fought</div>
                        {sessionEncounters.map((e, i) => (
                          <div key={e.id || i} style={{ display: 'flex', gap: '.5rem', fontSize: 12, color: 'var(--text-muted)', padding: '.2rem 0' }}>
                            <i className="ti ti-swords" style={{ fontSize: 12, marginTop: 1 }} />
                            <span>{e.setting} — {e.encounter_type} ({e.rounds} rounds)</span>
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
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Skill Usage ────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title"><i className="ti ti-chart-bar" style={{ marginRight: 4 }} />Skill Usage This Session</div>
        {skillRows.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No skill rolls recorded yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Skill','Session','Total',''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '4px 6px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {skillRows.map(([sk, v]) => (
                <tr key={sk}>
                  <td style={{ padding: '4px 6px', color: 'var(--text-primary)' }}>{sk}</td>
                  <td style={{ padding: '4px 6px', color: 'var(--text-secondary)' }}>{v.session || 0}</td>
                  <td style={{ padding: '4px 6px', color: 'var(--text-secondary)' }}>{v.total}</td>
                  <td style={{ padding: '4px 6px' }}><div style={{ height: 3, borderRadius: 2, background: 'var(--gold)', width: `${(v.total / maxTotal) * 80}px` }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Session Event Timeline ────────────────────────────────────────────── */}
      {eventLog.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-title">
            <i className="ti ti-timeline" style={{ marginRight: 4 }} />This Session — Events
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
      )}
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
