import React, { useState } from 'react';
import { Empty } from './UI';

const QUEST_TYPES = {
  main:   { label: 'Main Quest',   color: '#c84030', border: 'rgba(200,64,48,.5)',   bg: 'rgba(200,64,48,.06)'   },
  side:   { label: 'Side Quest',   color: '#4a7ac8', border: 'rgba(74,122,200,.5)',  bg: 'rgba(74,122,200,.06)'  },
  player: { label: 'Player Quest', color: '#4a8a40', border: 'rgba(74,138,64,.5)',   bg: 'rgba(74,138,64,.06)'   },
};

const STATUS_ORDER = { active: 0, carried_over: 1, complete: 2, failed: 3 };
const STATUS_STYLE = {
  active:       'q-active',
  complete:     'q-complete',
  failed:       'q-failed',
  carried_over: 'q-carried',
};

export default function QuestTab({ isGM, isPCView, session, quests, onCreateQuest, onUpdateQuest }) {
  const [showNew, setShowNew] = useState(false);
  const [newQ, setNewQ] = useState({ title: '', description: '', is_visible: false, quest_type: 'main' });
  const [showPlayerNew, setShowPlayerNew] = useState(false);
  const [playerQ, setPlayerQ] = useState({ title: '', description: '' });
  const [hideCompleted, setHideCompleted] = useState(false);
  const gmView = isGM && !isPCView;

  const visibleQuests = (gmView ? quests : quests.filter(q => q.is_visible)).filter(Boolean);
  const sorted = [...visibleQuests]
    .filter(q => !hideCompleted || q.status !== 'complete')
    .sort((a, b) => {
    // Sort by type first (main, side, player), then by status
    const typeOrder = { main: 0, side: 1, player: 2 };
    const ta = typeOrder[a.quest_type] ?? 1;
    const tb = typeOrder[b.quest_type] ?? 1;
    if (ta !== tb) return ta - tb;
    return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
  });

  const createQuest = async () => {
    if (!newQ.title.trim()) return;
    await onCreateQuest({ ...newQ, status: 'active', player_notes: '', gm_notes: '', sort_order: quests.length });
    setNewQ({ title: '', description: '', is_visible: false, quest_type: 'main' });
    setShowNew(false);
  };

  const createPlayerQuest = async () => {
    if (!playerQ.title.trim()) return;
    await onCreateQuest({ title: playerQ.title, description: playerQ.description, quest_type: 'player', status: 'active', is_visible: false, player_notes: '', gm_notes: '', sort_order: quests.length });
    setPlayerQ({ title: '', description: '' });
    setShowPlayerNew(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          Session {session?.session_number || '—'} — Objectives
        </span>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={hideCompleted} onChange={e => setHideCompleted(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Hide completed
          </label>
          {/* Players can suggest quests */}
          {!gmView && (
            <button className="btn btn-sm" style={{ borderColor: '#4a8a40', color: '#6aba60' }} onClick={() => setShowPlayerNew(!showPlayerNew)}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> Suggest Quest
            </button>
          )}
          {gmView && (
            <button className="btn btn-sm btn-p" onClick={() => setShowNew(!showNew)}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> New Objective
            </button>
          )}
        </div>
      </div>

      {/* GM new quest form */}
      {showNew && gmView && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-title">New Objective</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: '.5rem' }}>
            {Object.entries(QUEST_TYPES).map(([k, qt]) => (
              <button key={k} className="btn btn-sm"
                style={{ borderColor: newQ.quest_type === k ? qt.color : 'var(--border)', color: newQ.quest_type === k ? qt.color : 'var(--text-muted)', background: newQ.quest_type === k ? qt.bg : 'transparent' }}
                onClick={() => setNewQ({ ...newQ, quest_type: k })}>
                {qt.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <input placeholder="Objective title *" autoFocus value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} style={{ width: '100%' }} onKeyDown={e => e.key === 'Enter' && createQuest()} />
            <textarea rows={2} placeholder="Description" value={newQ.description} onChange={e => setNewQ({ ...newQ, description: e.target.value })} style={{ width: '100%', resize: 'vertical' }} />
            <label className="chk-row"><input type="checkbox" checked={newQ.is_visible} onChange={e => setNewQ({ ...newQ, is_visible: e.target.checked })} /> Reveal to players immediately</label>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-p btn-sm" disabled={!newQ.title.trim()} onClick={createQuest}>Add</button>
              <button className="btn btn-sm" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Player suggestion form */}
      {showPlayerNew && !gmView && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: '#4a8a40' }}>
          <div className="card-title" style={{ color: '#6aba60' }}>Suggest a Quest</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.5rem' }}>Your suggestion goes to the GM for review. It will appear in green until promoted.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <input placeholder="Quest title *" autoFocus value={playerQ.title} onChange={e => setPlayerQ({ ...playerQ, title: e.target.value })} style={{ width: '100%' }} />
            <textarea rows={2} placeholder="What do you think the party should pursue?" value={playerQ.description} onChange={e => setPlayerQ({ ...playerQ, description: e.target.value })} style={{ width: '100%', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-sm" style={{ borderColor: '#4a8a40', color: '#6aba60' }} disabled={!playerQ.title.trim()} onClick={createPlayerQuest}>Submit</button>
              <button className="btn btn-sm" onClick={() => setShowPlayerNew(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Quest list */}
      {sorted.length === 0 ? (
        <Empty icon="ti-target" message={gmView ? 'No objectives yet. Create one above.' : 'No objectives visible yet.'} />
      ) : sorted.map(q => {
        const qt = QUEST_TYPES[q.quest_type] || QUEST_TYPES.side;
        return (
          <div key={q.id} className="qitem" style={{ borderLeft: 'none', background: qt.bg, display: 'flex' }}>
            {/* Rotated type label — vertical stripe on the left */}
            <div style={{
              width: 24, minHeight: '100%', background: qt.color, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '4px 0 0 4px',
            }}>
              <span style={{
                writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                fontSize: 9, fontWeight: 800, letterSpacing: '.12em',
                color: '#000', textTransform: 'uppercase', userSelect: 'none',
                padding: '6px 0',
              }}>{qt.label}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
            <div className="qhdr">
              <span className={`qstat ${STATUS_STYLE[q.status] || 'q-active'}`}>
                {q.status === 'carried_over' ? 'carried' : q.status}
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: q.status === 'complete' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: q.status === 'complete' ? 'line-through' : 'none' }}>{q.title}</span>
              {/* Complete button — GM always, players for their own quests */}
              {q.status === 'active' && (gmView || q.quest_type === 'player') && (
                <button className="btn btn-sm" style={{ fontSize: 11, borderColor: 'var(--green-dim)', color: 'var(--green)', padding: '1px 6px' }}
                  onClick={() => onUpdateQuest(q.id, { status: 'complete' })}>✓ Complete</button>
              )}
              {gmView && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {q.quest_type === 'player' && (
                    <select style={{ fontSize: 11, padding: '1px 3px', borderColor: '#4a8a40', color: '#6aba60' }}
                      value="player" onChange={e => onUpdateQuest(q.id, { quest_type: e.target.value })}>
                      <option value="player">Player</option>
                      <option value="main">→ Main</option>
                      <option value="side">→ Side</option>
                    </select>
                  )}
                  {q.quest_type !== 'player' && (
                    <select style={{ fontSize: 11, padding: '1px 3px' }} value={q.quest_type} onChange={e => onUpdateQuest(q.id, { quest_type: e.target.value })}>
                      <option value="main">Main</option>
                      <option value="side">Side</option>
                      <option value="player">Player</option>
                    </select>
                  )}
                  <select style={{ fontSize: 12, padding: '2px 4px' }} value={q.status} onChange={e => onUpdateQuest(q.id, { status: e.target.value })}>
                    {['active', 'complete', 'failed', 'carried_over'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span title={q.is_visible ? 'Visible — click to hide' : 'Hidden — click to reveal'}
                    style={{ cursor: 'pointer', fontSize: 15, color: q.is_visible ? 'var(--green)' : 'var(--text-muted)' }}
                    onClick={() => onUpdateQuest(q.id, { is_visible: !q.is_visible })}>
                    {q.is_visible ? '●' : '○'}
                  </span>
                </div>
              )}
            </div>

            {q.description && (
              <div style={{ padding: '.4rem .75rem', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-dark)', borderTop: '1px solid var(--border)', lineHeight: 1.5 }}>
                {q.description}
              </div>
            )}

            {(q.player_notes || q.notes) && (
              <div style={{ padding: '.3rem .75rem', background: 'var(--bg-dark)', borderTop: '1px solid rgba(107,78,40,.2)', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Notes: {q.player_notes || q.notes}
              </div>
            )}
            {!(q.player_notes || q.notes) && (
              <div style={{ padding: '.3rem .75rem', background: 'var(--bg-dark)', borderTop: '1px solid rgba(107,78,40,.2)' }}>
                <textarea placeholder="Party notes..." value={q.player_notes || ''} onChange={e => onUpdateQuest(q.id, { player_notes: e.target.value })}
                  style={{ width: '100%', resize: 'vertical', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', minHeight: 28, fontFamily: 'inherit' }} />
              </div>
            )}

            {gmView && (
              <div className="gm-notes-area">
                <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: 2 }}>GM Notes (private):</div>
                <textarea placeholder="Private GM notes..." value={q.gm_notes || ''} onChange={e => onUpdateQuest(q.id, { gm_notes: e.target.value })} />
              </div>
            )}
            </div> {/* end inner flex-1 */}
          </div>
        );
      })}
    </div>
  );
}

