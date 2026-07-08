import React, { useState } from 'react';
import { Empty } from './UI';

export const QUEST_TYPES = {
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

// GM "new objective" form - shared between QuestTab (Quests tab) and Preparation → Session Prep,
// per Charles's call that quest creation should be available in both places, not moved out of Quests.
export function QuestCreateForm({ quests, onCreateQuest, onCancel }) {
  const [newQ, setNewQ] = useState({ title: '', description: '', is_visible: false, quest_type: 'main', parent_quest_id: null });
  const parents = (quests || []).filter(Boolean).filter(q => !q.parent_quest_id);

  const createQuest = async () => {
    if (!newQ.title.trim()) return;
    await onCreateQuest({ ...newQ, status: 'active', player_notes: '', gm_notes: '', sort_order: (quests || []).length });
    setNewQ({ title: '', description: '', is_visible: false, quest_type: 'main', parent_quest_id: null });
    if (onCancel) onCancel();
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-title">New Objective</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: '.5rem', flexWrap: 'wrap' }}>
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
        {/* Parent quest selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Slave to:</span>
          <select value={newQ.parent_quest_id || ''} onChange={e => setNewQ({ ...newQ, parent_quest_id: e.target.value || null })} style={{ flex: 1, fontSize: 12 }}>
            <option value="">- stand-alone quest -</option>
            {parents.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <label className="chk-row"><input type="checkbox" checked={newQ.is_visible} onChange={e => setNewQ({ ...newQ, is_visible: e.target.checked })} /> Reveal to players immediately</label>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-p btn-sm" disabled={!newQ.title.trim()} onClick={createQuest}>Add</button>
          {onCancel && <button className="btn btn-sm" onClick={onCancel}>Cancel</button>}
        </div>
      </div>
    </div>
  );
}

// Quest player notes with local state - saves on blur to prevent per-keystroke re-render reset
function QuestNotes({ q, onUpdateQuest }) {
  const [localNotes, setLocalNotes] = React.useState(q.player_notes || '');
  React.useEffect(() => { setLocalNotes(q.player_notes || ''); }, [q.player_notes]);
  return (
    <div style={{ padding: '.3rem .75rem', background: 'var(--bg-dark)', borderTop: '1px solid rgba(107,78,40,.2)' }}>
      <textarea
        placeholder="Party notes..."
        value={localNotes}
        onChange={e => setLocalNotes(e.target.value)}
        onBlur={() => { if (localNotes !== (q.player_notes || '')) onUpdateQuest(q.id, { player_notes: localNotes }); }}
        style={{ width: '100%', resize: 'vertical', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', minHeight: 28, fontFamily: 'inherit' }}
      />
    </div>
  );
}

// A single quest card - used for both parents and children
function QuestCard({ q, quests, gmView, onUpdateQuest, onDeleteQuest, indent = false }) {
  const qt = QUEST_TYPES[q.quest_type] || QUEST_TYPES.side;
  const [collapsed, setCollapsed] = React.useState(q.status === 'complete');

  return (
    <div style={{ marginLeft: indent ? 24 : 0, marginBottom: indent ? 4 : 0, position: 'relative' }}>
      {/* Indent connector line */}
      {indent && (
        <div style={{
          position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)',
          width: 12, height: 1, background: 'var(--border)',
        }} />
      )}
      <div className="qitem" style={{ borderLeft: 'none', background: indent ? 'rgba(0,0,0,.12)' : qt.bg, display: 'flex', opacity: q.status === 'failed' ? 0.6 : 1 }}>
        {/* Rotated type stripe */}
        <div style={{ width: indent ? 16 : 24, minHeight: '100%', background: indent ? qt.color + '80' : qt.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px 0 0 4px' }}>
          {!indent && (
            <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 9, fontWeight: 800, letterSpacing: '.12em', color: '#000', textTransform: 'uppercase', userSelect: 'none', padding: '6px 0' }}>
              {qt.label}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="qhdr" style={{ cursor: 'pointer' }} onClick={e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return; setCollapsed(c => !c); }}>
            <span className={`qstat ${STATUS_STYLE[q.status] || 'q-active'}`}>
              {q.status === 'carried_over' ? 'carried' : q.status}
            </span>
            {gmView
              ? <input
                  value={q.title}
                  onChange={e => onUpdateQuest(q.id, { title: e.target.value })}
                  style={{ flex: 1, fontSize: indent ? 13 : 14, fontWeight: indent ? 400 : 500,
                    background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid rgba(200,150,42,.2)',
                    color: q.status === 'complete' ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: q.status === 'complete' ? 'line-through' : 'none',
                    outline: 'none', padding: '0 2px', fontFamily: 'inherit' }}
                />
              : <span style={{ flex: 1, fontSize: indent ? 13 : 14, fontWeight: indent ? 400 : 500, color: q.status === 'complete' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: q.status === 'complete' ? 'line-through' : 'none' }}>
                  {q.title}
                </span>
            }

            <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 4, userSelect: 'none' }}>
              {collapsed ? '▶' : '▼'}
            </span>
            {gmView && (
              <button className="btn btn-sm" title="Delete quest"
                style={{ fontSize: 10, color: 'var(--red)', padding: '0 3px' }}
                onClick={e => { e.stopPropagation(); if (window.confirm(`Delete quest "${q.title}"?`)) onDeleteQuest && onDeleteQuest(q.id); }}>
                <i className="ti ti-trash" />
              </button>
            )}
            {gmView && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {/* Parent quest selector */}
                <select
                  style={{ fontSize: 11, padding: '1px 3px', maxWidth: 100 }}
                  value={q.parent_quest_id || ''}
                  onChange={e => onUpdateQuest(q.id, { parent_quest_id: e.target.value || null })}
                  title="Slave to parent quest">
                  <option value="">- stand-alone -</option>
                  {quests.filter(p => p.id !== q.id && !p.parent_quest_id).map(p => (
                    <option key={p.id} value={p.id}>{p.title.slice(0, 28)}{p.title.length > 28 ? '…' : ''}</option>
                  ))}
                </select>
                {q.quest_type !== 'player' && (
                  <select style={{ fontSize: 11, padding: '1px 3px' }} value={q.quest_type} onChange={e => onUpdateQuest(q.id, { quest_type: e.target.value })}>
                    <option value="main">Main</option>
                    <option value="side">Side</option>
                    <option value="player">Player</option>
                  </select>
                )}
                {q.quest_type === 'player' && (
                  <select style={{ fontSize: 11, padding: '1px 3px', borderColor: '#4a8a40', color: '#6aba60' }}
                    value="player" onChange={e => onUpdateQuest(q.id, { quest_type: e.target.value })}>
                    <option value="player">Player</option>
                    <option value="main">→ Main</option>
                    <option value="side">→ Side</option>
                  </select>
                )}
                <select style={{ fontSize: 12, padding: '2px 4px' }} value={q.status} onChange={e => onUpdateQuest(q.id, { status: e.target.value })}>
                  {['active', 'complete', 'failed', 'carried_over'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span title={q.is_visible ? 'Visible - click to hide' : 'Hidden - click to reveal'}
                  style={{ cursor: 'pointer', fontSize: 15, color: q.is_visible ? 'var(--green)' : 'var(--text-muted)' }}
                  onClick={() => onUpdateQuest(q.id, { is_visible: !q.is_visible })}>
                  {q.is_visible ? '●' : '○'}
                </span>
              </div>
            )}
          </div>

          {(q.description || gmView) && (
            gmView
              ? <textarea
                  value={q.description || ''}
                  onChange={e => onUpdateQuest(q.id, { description: e.target.value })}
                  placeholder="Quest description…"
                  rows={2}
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical',
                    background: 'var(--bg-dark)', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', borderTop: '1px solid var(--border)',
                    color: 'var(--text-secondary)', fontSize: 12, padding: '.4rem .75rem',
                    fontFamily: 'inherit', lineHeight: 1.5, outline: 'none' }}
                />
              : <div style={{ padding: '.4rem .75rem', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-dark)', borderTop: '1px solid var(--border)', lineHeight: 1.5 }}>
                  {q.description}
                </div>
          )}

          <QuestNotes q={q} onUpdateQuest={onUpdateQuest} />

          {gmView && (
            <div className="gm-notes-area">
              <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: 2 }}>GM Notes (private):</div>
              <textarea placeholder="Private GM notes..." value={q.gm_notes || ''} onChange={e => onUpdateQuest(q.id, { gm_notes: e.target.value })} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestTab({ isGM, isPCView, session, quests, onCreateQuest, onUpdateQuest, onDeleteQuest }) {
  const [showNew, setShowNew] = useState(false);
  const [showPlayerNew, setShowPlayerNew] = useState(false);
  const [playerQ, setPlayerQ] = useState({ title: '', description: '' });
  const [hideCompleted, setHideCompleted] = useState(false);
  const gmView = isGM && !isPCView;

  const visibleQuests = (gmView ? quests : quests.filter(q => q.is_visible)).filter(Boolean);

  const createPlayerQuest = async () => {
    if (!playerQ.title.trim()) return;
    await onCreateQuest({ title: playerQ.title, description: playerQ.description, quest_type: 'player', status: 'active', is_visible: false, player_notes: '', gm_notes: '', sort_order: quests.length });
    setPlayerQ({ title: '', description: '' });
    setShowPlayerNew(false);
  };

  // Build parent→children hierarchy for display
  const parents = visibleQuests.filter(q => !q.parent_quest_id);
  const childrenOf = (parentId) => visibleQuests.filter(q => q.parent_quest_id === parentId);

  const sortQ = (list) => [...list].sort((a, b) => {
    const typeOrder = { main: 0, side: 1, player: 2 };
    const ta = typeOrder[a.quest_type] ?? 1;
    const tb = typeOrder[b.quest_type] ?? 1;
    if (ta !== tb) return ta - tb;
    return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
  });

  const visibleParents = sortQ(parents).filter(q => !hideCompleted || q.status !== 'complete');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          Session {session?.session_number || '-'} - Objectives
        </span>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={hideCompleted} onChange={e => setHideCompleted(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Hide completed
          </label>
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
        <QuestCreateForm quests={quests} onCreateQuest={onCreateQuest} onCancel={() => setShowNew(false)} />
      )}

      {/* Player suggestion form */}
      {showPlayerNew && !gmView && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: '#4a8a40' }}>
          <div className="card-title" style={{ color: '#6aba60' }}>Suggest a Quest</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.5rem' }}>Your suggestion goes to the GM for review.</div>
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

      {/* Quest list - parents with children indented below */}
      {visibleParents.length === 0 ? (
        <Empty icon="ti-target" message={gmView ? 'No objectives yet. Create one above.' : 'No objectives visible yet.'} />
      ) : visibleParents.map(q => {
        const kids = sortQ(childrenOf(q.id)).filter(c => !hideCompleted || c.status !== 'complete');
        return (
          <div key={q.id} style={{ marginBottom: '1rem' }}>
            {/* Parent quest */}
            <QuestCard q={q} quests={quests} gmView={gmView} onUpdateQuest={onUpdateQuest} onDeleteQuest={onDeleteQuest} indent={false} />
            {/* Child quests - indented below, connected visually */}
            {kids.length > 0 && (
              <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: '2px solid var(--border)', marginLeft: 20 }}>
                {kids.map(child => (
                  <QuestCard key={child.id} q={child} quests={quests} gmView={gmView} onUpdateQuest={onUpdateQuest} onDeleteQuest={onDeleteQuest} indent={true} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
