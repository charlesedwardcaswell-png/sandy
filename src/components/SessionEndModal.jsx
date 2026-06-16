import React, { useState } from 'react';

const COPPER_DEFAULTS = { Action: 15, Intrigue: 8, Travel: 5, Downtime: 3 };

export default function SessionEndModal({ session, characters, encounterLog, onConfirm, onClose }) {
  const [tab, setTab] = useState('xp');
  const [xpAmount, setXpAmount] = useState(3);
  const [xpReason, setXpReason] = useState('');
  const [selected, setSelected] = useState(
    characters.reduce((acc, c) => ({ ...acc, [c.id]: true }), {})
  );
  const [recap, setRecap] = useState({ event: '', npcs: '', factions: '', loot: '', changes: '' });

  // Copper — calculate suggestion from encounters this session
  const sessionEncounters = (encounterLog || []).filter(e => e.session_number === session?.session_number);
  const suggestedCopper = sessionEncounters.reduce((sum, e) => sum + (COPPER_DEFAULTS[e.encounter_type] || 5), 0) || 10;
  const [copperAward, setCopperAward] = useState(suggestedCopper);

  const sessionNum = session?.session_number || '?';

  const handleConfirm = () => {
    onConfirm({
      xpAmount,
      xpReason: xpReason || `Session ${sessionNum}`,
      selectedCharIds: Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
      copperAward,
      recap,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-title">
          <i className="ti ti-player-stop" /> End Session {sessionNum}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
          <button className={`btn btn-sm ${tab === 'xp' ? 'btn-p' : ''}`} onClick={() => setTab('xp')}>XP & Copper</button>
          <button className={`btn btn-sm ${tab === 'recap' ? 'btn-p' : ''}`} onClick={() => setTab('recap')}>Session Recap</button>
        </div>

        {tab === 'xp' && (<>
          <div className="modal-section">
            <span className="modal-label">XP Amount</span>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <input type="number" min={0} max={20} value={xpAmount} onChange={e => setXpAmount(+e.target.value)} style={{ width: 70 }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>XP to each selected PC</span>
            </div>
          </div>
          <div className="modal-section">
            <span className="modal-label">Group Copper Award</span>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <input type="number" min={0} value={copperAward} onChange={e => setCopperAward(+e.target.value)} style={{ width: 70 }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>copper to party treasury</span>
            </div>
            {sessionEncounters.length > 0 && (
              <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginTop: '.3rem' }}>
                Suggested {suggestedCopper}c based on {sessionEncounters.length} encounter{sessionEncounters.length !== 1 ? 's' : ''} this session
              </div>
            )}
          </div>
          <div className="modal-section">
            <span className="modal-label">Reason (optional)</span>
            <input type="text" placeholder={`e.g. Session ${sessionNum} — main story beat`}
              value={xpReason} onChange={e => setXpReason(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="modal-section">
            <span className="modal-label">PCs Present</span>
            {characters.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>No characters created.</div>}
            {characters.map(c => (
              <label key={c.id} className="chk-row">
                <input type="checkbox" checked={!!selected[c.id]} onChange={() => setSelected(s => ({ ...s, [c.id]: !s[c.id] }))} />
                {c.name} — {c.school} ({c.xp_total || 0} XP)
              </label>
            ))}
          </div>
        </>)}

        {tab === 'recap' && (<>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.75rem' }}>Saved to session archive.</div>
          {[
            { key: 'event',    label: 'Most significant event',     ph: 'What happened that mattered most?' },
            { key: 'npcs',     label: 'Key NPCs this session',      ph: 'Who did the party interact with?' },
            { key: 'factions', label: 'Faction reputation changes', ph: 'Any notable shifts in standing?' },
            { key: 'loot',     label: 'Loot / rewards distributed', ph: 'What did the party acquire?' },
            { key: 'changes',  label: 'Character changes to apply', ph: 'School ranks, techniques, healing...' },
          ].map(f => (
            <div key={f.key} className="modal-section">
              <span className="modal-label">{f.label}</span>
              <textarea rows={2} placeholder={f.ph} value={recap[f.key]}
                onChange={e => setRecap(r => ({ ...r, [f.key]: e.target.value }))} style={{ width: '100%', resize: 'vertical' }} />
            </div>
          ))}
        </>)}

        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
          <button className="btn btn-p" onClick={handleConfirm}>
            Archive Session {sessionNum}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
