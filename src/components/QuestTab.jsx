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
export default function QuestTab({ isGM, isPCView, session, quests, onCreateQuest, onUpdateQuest }) {
  const [showNew, setShowNew] = useState(false);
  const [newQ, setNewQ] = useState({ title: '', description: '', is_visible: false });
  const gmView = isGM && !isPCView;

  const visibleQuests = gmView ? quests : quests.filter(q => q.is_visible);
  const sorted = [...visibleQuests].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  const createQuest = async () => {
    if (!newQ.title.trim()) return;
    await onCreateQuest({ ...newQ, status: 'active', player_notes: '', gm_notes: '', sort_order: quests.length });
    setNewQ({ title: '', description: '', is_visible: false });
    setShowNew(false);
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
    </div>
  );
}
