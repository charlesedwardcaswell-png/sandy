import React, { useState } from 'react';
import { Empty } from './UI';
import { formatDate } from '../lib/utils';

const TYPES = [
  { key: 'visual', label: 'Visual', icon: 'ti-palette', color: 'var(--gold)', placeholder: 'A layout, color, or display issue you noticed...' },
  { key: 'feature', label: 'Feature Requests', icon: 'ti-bulb', color: 'var(--green)', placeholder: 'Something you wish Sandy could do...' },
  { key: 'bug', label: 'Broken Things', icon: 'ti-bug', color: 'var(--red)', placeholder: 'Something that didn\'t work right...' },
];

// ── FeedbackTab ─────────────────────────────────────────────────────────────
// Append-only feedback board, visible to all players. Three sections matching
// TYPES above. Nothing can be edited or deleted from here by design — it's a
// running record for Charles to triage between sessions, not a chat.
export default function FeedbackTab({ feedback = [], onAddFeedback, username, isGM }) {
  const [activeType, setActiveType] = useState('bug');
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const submit = async () => {
    const text = draft.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    const result = await onAddFeedback(activeType, text, username || 'Anonymous');
    if (result) {
      setDraft('');
    } else {
      setSubmitError('Post failed to save — check the browser console, or ask Charles to verify the feedback table\'s RLS policy in Supabase.');
    }
    setSubmitting(false);
  };

  const activeMeta = TYPES.find(t => t.key === activeType);

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.25rem' }}>
        <i className="ti ti-message-report" style={{ marginRight: 5 }} />Feedback
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Spot something off, or wish Sandy did something differently? Drop a note below — this is a running
        list for Charles to work through between sessions, not a live chat.
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '.75rem', flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button key={t.key} className="btn btn-sm"
            style={{
              borderColor: activeType === t.key ? t.color : 'var(--border)',
              color: activeType === t.key ? t.color : 'var(--text-muted)',
              background: activeType === t.key ? `${t.color}14` : 'transparent',
            }}
            onClick={() => setActiveType(t.key)}>
            <i className={`ti ${t.icon}`} style={{ marginRight: 4 }} />{t.label}
            <span style={{ marginLeft: 5, opacity: .7 }}>({feedback.filter(f => f.type === t.key).length})</span>
          </button>
        ))}
      </div>

      {/* Composer */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) submit(); }}
          placeholder={activeMeta?.placeholder}
          style={{ flex: 1 }}
          disabled={submitting}
        />
        <button className="btn btn-p" onClick={submit} disabled={!draft.trim() || submitting}>
          <i className="ti ti-send" style={{ marginRight: 4 }} />Post
        </button>
      </div>
      {submitError && (
        <div style={{ fontSize: 12, color: 'var(--red)', marginTop: '-.75rem', marginBottom: '1rem' }}>
          <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />{submitError}
        </div>
      )}

      {/* List for the active section — newest first (feedback array is already ordered that way) */}
      {(() => {
        const items = feedback.filter(f => f.type === activeType);
        if (items.length === 0) return <Empty message={`No ${activeMeta?.label.toLowerCase()} feedback yet.`} />;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(f => (
              <div key={f.id} style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '.6rem .8rem',
              }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{f.body}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 8 }}>
                  <span>{f.author || 'Anonymous'}</span>
                  <span>·</span>
                  <span>{formatDate(f.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
