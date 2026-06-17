import React, { useState } from 'react';
import { Empty } from './UI';
import { formatDate } from '../lib/utils';

// ── LogTab ────────────────────────────────────────────────────────────────────
export default function LogTab({ encounterLog, sessionLog, skillLog }) {
  const [expandedSession, setExpandedSession] = useState({});

  const skillRows = Object.entries(skillLog || {}).sort((a, b) => b[1].total - a[1].total);
  const maxTotal = Math.max(...skillRows.map(([, v]) => v.total), 1);

  // Group encounters by session number for display in archive
  const encountersBySession = (encounterLog || []).reduce((acc, e) => {
    const sn = e.session_number || 0;
    if (!acc[sn]) acc[sn] = [];
    acc[sn].push(e);
    return acc;
  }, {});

  return (
    <div>
      {/* Skill Usage */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title"><i className="ti ti-chart-bar" style={{ marginRight: 4 }} />Skill Usage This Session</div>
        {skillRows.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No skill rolls recorded yet. Rolls made through the dice modal are logged automatically.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Skill', 'Session', 'Total', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '4px 6px', fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skillRows.map(([sk, v]) => (
                <tr key={sk}>
                  <td style={{ padding: '4px 6px', color: 'var(--text-primary)' }}>{sk}</td>
                  <td style={{ padding: '4px 6px', color: 'var(--text-secondary)' }}>{v.session || 0}</td>
                  <td style={{ padding: '4px 6px', color: 'var(--text-secondary)' }}>{v.total}</td>
                  <td style={{ padding: '4px 6px' }}>
                    <div style={{ height: 3, borderRadius: 2, background: 'var(--gold)', width: `${(v.total / maxTotal) * 80}px` }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Encounter Log */}
      {encounterLog && encounterLog.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.6rem' }}>
            <i className="ti ti-swords" style={{ marginRight: 5 }} />Encounter Log
          </div>
          {encounterLog.map((e, i) => (
            <div key={e.id || i} style={{ border: '1px solid var(--border)', borderRadius: 5, marginBottom: '.4rem', padding: '.55rem .75rem', background: 'var(--bg-panel)' }}>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.25rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold-dim)' }}>Session {e.session_number}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(e.created_at)}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)' }}>{e.setting}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)' }}>{e.encounter_type}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{e.rounds} rounds</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Party: {e.party}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>vs: {e.enemies}</div>
            </div>
          ))}
        </div>
      )}

      {/* Session Archive */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.6rem' }}>
        <i className="ti ti-books" style={{ marginRight: 5 }} />Session Archive
      </div>

      {(!sessionLog || sessionLog.length === 0) ? (
        <Empty icon="ti-calendar" message="No archived sessions yet. End a session to create an archive entry." />
      ) : (
        sessionLog.map(s => {
          const exp = expandedSession[s.id];
          const recap = s.recap || {};
          const hasRecap = Object.values(recap).some(v => v && v.trim());
          const sessionEncounters = encountersBySession[s.session_number] || [];
          const hasContent = hasRecap || sessionEncounters.length > 0 || s.events?.length > 0;

          return (
            <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 5, marginBottom: '.4rem', background: 'var(--bg-panel)', overflow: 'hidden' }}>
              <div
                style={{ padding: '.55rem .75rem', display: 'flex', gap: '.5rem', alignItems: 'center', cursor: hasContent ? 'pointer' : 'default' }}
                onClick={() => hasContent && setExpandedSession(e => ({ ...e, [s.id]: !e[s.id] }))}
              >
                <i className="ti ti-calendar" style={{ fontSize: 12, color: 'var(--gold-dim)' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold-dim)' }}>Session {s.session_number}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(s.closed_at || s.created_at)}</span>
                {sessionEncounters.length > 0 && (
                  <span style={{ fontSize: 9, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)' }}>
                    {sessionEncounters.length} encounter{sessionEncounters.length !== 1 ? 's' : ''}
                  </span>
                )}
                <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {recap.event || `Session ${s.session_number} archived.`}
                </span>
                {hasContent && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{exp ? '▲' : '▼'}</span>}
              </div>

              {exp && (
                <div style={{ background: 'var(--bg-dark)', borderTop: '1px solid var(--border)' }}>
                  {/* Recap fields */}
                  {hasRecap && (
                    <div style={{ padding: '.5rem .75rem', borderBottom: (sessionEncounters.length > 0 || s.events?.length > 0) ? '1px solid rgba(107,78,40,.3)' : 'none' }}>
                      {recap.event && <RecapRow label="Key Event" value={recap.event} />}
                      {recap.npcs && <RecapRow label="Key NPCs" value={recap.npcs} />}
                      {recap.factions && <RecapRow label="Faction Changes" value={recap.factions} />}
                      {recap.loot && <RecapRow label="Loot / Rewards" value={recap.loot} />}
                      {recap.changes && <RecapRow label="Character Changes" value={recap.changes} />}
                    </div>
                  )}

                  {/* Encounter breakdown */}
                  {sessionEncounters.length > 0 && (
                    <div style={{ padding: '.5rem .75rem', borderBottom: s.events?.length > 0 ? '1px solid rgba(107,78,40,.3)' : 'none' }}>
                      <div style={{ fontSize: 9, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>Encounters</div>
                      {sessionEncounters.map((e, i) => (
                        <div key={e.id || i} style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', padding: '.35rem 0', borderBottom: i < sessionEncounters.length - 1 ? '1px solid rgba(107,78,40,.15)' : 'none' }}>
                          <i className="ti ti-swords" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                              <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>{e.setting || 'Unknown location'}</span>
                              <span style={{ fontSize: 9, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)' }}>{e.encounter_type}</span>
                              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{e.rounds} rounds</span>
                              {e.difficulty && <span style={{ fontSize: 9, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--gold-dim)' }}>{e.difficulty}</span>}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>vs {e.enemies || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Event log */}
                  {s.events?.length > 0 && (
                    <div style={{ padding: '.5rem .75rem' }}>
                      <div style={{ fontSize: 9, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>
                        Session Events ({s.events.length})
                      </div>
                      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {s.events.map((ev, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.2rem 0', borderBottom: '1px solid rgba(107,78,40,.1)', fontSize: 10 }}>
                            <i className={`ti ${ev.icon}`} style={{ fontSize: 10, color: 'var(--gold-dim)', flexShrink: 0, width: 14 }} />
                            <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{ev.text}</span>
                            <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
                              {ev.ts ? new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        ))}
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
  );
}

function RecapRow({ label, value }) {
  return (
    <div style={{ marginBottom: '.4rem' }}>
      <div style={{ fontSize: 9, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{value}</div>
    </div>
  );
}
