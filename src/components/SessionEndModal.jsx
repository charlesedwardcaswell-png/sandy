import React, { useState } from 'react';
import SocialReferenceModal from './SocialReferenceModal';
import { FactionRow } from './PartyTab';
import { FACTIONS_DATA } from '../data/constants';

const COPPER_DEFAULTS = { Action: 15, Intrigue: 8, Travel: 5, Downtime: 3 };

export default function SessionEndModal({ session, characters, encounterLog, reps, onUpdateRep, onUpdateRepNotes, onConfirm, onClose }) {
  const [tab, setTab] = useState('xp');
  const [xpAmount, setXpAmount] = useState(3);
  const [xpReason, setXpReason] = useState('');
  const [selected, setSelected] = useState(
    characters.reduce((acc, c) => ({ ...acc, [c.id]: true }), {})
  );
  // Trimmed to just the title/summary field — npcs/factions/loot/changes were free-text v1 fields that
  // duplicated what's now live-tracked elsewhere (faction standing below, quest log, character sheets).
  // "event" is kept because LogTab's session title display falls back to it (s.title || s.recap?.event).
  const [recap, setRecap] = useState({ event: '' });

  // Per-character Integrity GM input (empty = no change)
  const [integrityAwards, setIntegrityAwards] = useState(
    characters.reduce((acc, c) => ({ ...acc, [c.id]: '' }), {})
  );
  // Per-character Reputation GM input (empty = no change)
  const [repAwards, setRepAwards] = useState(
    characters.reduce((acc, c) => ({ ...acc, [c.id]: '' }), {})
  );

  // Copper
  const sessionEncounters = (encounterLog || []).filter(e => e.session_number === session?.session_number);
  const suggestedCopper = sessionEncounters.reduce((sum, e) => sum + (COPPER_DEFAULTS[e.encounter_type] || 5), 0) || 10;
  const [copperAward, setCopperAward] = useState(suggestedCopper);
  const [showRef, setShowRef] = useState(null);
  const sessionNum = session?.session_number || '?';

  const handleConfirm = () => {
    onConfirm({
      xpAmount,
      xpReason: xpReason || `Session ${sessionNum}`,
      selectedCharIds: Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
      copperAward,
      recap,
      integrityAwards,
      repAwards,
    });
  };

  const presentChars = characters.filter(c => selected[c.id]);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
          <span><i className="ti ti-player-stop" /> End Session {sessionNum}</span>
          <input type="text" placeholder="Session title — what happened that mattered most?"
            value={recap.event} onChange={e => setRecap(r => ({ ...r, event: e.target.value }))}
            style={{ flex: 1, minWidth: 180, fontSize: 13 }} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${tab === 'xp' ? 'btn-p' : ''}`} onClick={() => setTab('xp')}>XP & Copper</button>
          <button className={`btn btn-sm ${tab === 'awards' ? 'btn-p' : ''}`} onClick={() => setTab('awards')}>Integrity & Rep</button>
          <button className={`btn btn-sm ${tab === 'recap' ? 'btn-p' : ''}`} onClick={() => setTab('recap')}>Faction Adjustment</button>
        </div>

        {tab === 'xp' && (<>
          <div className="modal-section">
            <span className="modal-label">XP Amount</span>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <input type="number" min={0} max={20} value={xpAmount} onChange={e => setXpAmount(+e.target.value)} style={{ width: 70 }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>XP to each selected PC</span>
            </div>
          </div>
          <div className="modal-section">
            <span className="modal-label">Group Copper Award</span>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <input type="number" min={0} value={copperAward} onChange={e => setCopperAward(+e.target.value)} style={{ width: 70 }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>copper to party treasury</span>
            </div>
            {sessionEncounters.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--gold-dim)', marginTop: '.3rem' }}>
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
            {characters.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No characters created.</div>}
            {characters.map(c => (
              <label key={c.id} className="chk-row">
                <input type="checkbox" checked={!!selected[c.id]} onChange={() => setSelected(s => ({ ...s, [c.id]: !s[c.id] }))} />
                {c.name} — {c.school} ({c.xp_total || 0} XP)
              </label>
            ))}
          </div>
        </>)}

        {showRef && <SocialReferenceModal initialTab={showRef} onClose={() => setShowRef(null)} />}

        {tab === 'awards' && (<>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.75rem', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--gold)' }}>Integrity:</strong> enter a GM value — new integrity = average of current + your value.<br />
            <strong style={{ color: 'var(--gold)' }}>Reputation:</strong> set directly as a whole number. Leave blank to leave unchanged.
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: '.75rem' }}>
            <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowRef('integrity')}>📖 Integrity Table</button>
            <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowRef('reputation')}>📖 Reputation Table</button>
            <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowRef('status')}>📖 Status Table</button>
          </div>

          {presentChars.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No PCs marked present — check PCs Present on the XP tab first.</div>
          )}

          {presentChars.map(c => {
            const curInt = Number(c.integrity) || 0;
            const gmInt = integrityAwards[c.id];
            const newInt = gmInt !== '' && !isNaN(+gmInt)
              ? Math.round(((curInt + (+gmInt)) / 2) * 10) / 10
              : null;

            return (
              <div key={c.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '.75rem', marginBottom: '.75rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.4rem' }}>{c.name}</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Integrity */}
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                      Integrity — current: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{curInt.toFixed(1)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="number" min={0} max={10} step={0.5}
                        placeholder="GM score"
                        value={integrityAwards[c.id]}
                        onChange={e => setIntegrityAwards(a => ({ ...a, [c.id]: e.target.value }))}
                        style={{ width: 80, fontSize: 13 }} />
                      {newInt !== null && (
                        <span style={{ fontSize: 13, color: 'var(--green)' }}>
                          → <strong>{newInt.toFixed(1)}</strong>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Averaged with current value</div>
                  </div>
                  {/* Reputation */}
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                      Reputation — current: <span style={{ color: '#c8a040', fontWeight: 600 }}>{c.reputation ?? 1}</span>
                    </div>
                    <input type="number" min={0} step={1}
                      placeholder="Set value"
                      value={repAwards[c.id]}
                      onChange={e => setRepAwards(a => ({ ...a, [c.id]: e.target.value }))}
                      style={{ width: 80, fontSize: 13 }} />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Whole number, GM-set</div>
                  </div>
                </div>
              </div>
            );
          })}
        </>)}

        {tab === 'recap' && (<>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', margin: '.75rem 0 .5rem' }}>
            <i className="ti ti-shield-half" style={{ marginRight: 5 }} />Adjust faction standing for this session — applies immediately, same as the Party tab.
          </div>
          <div className="card">
            {FACTIONS_DATA.map(fDef => {
              const rep = reps?.[fDef.name]?.reputation ?? 0;
              const savedNotes = reps?.[fDef.name]?.notes ?? '';
              return (
                <FactionRow key={fDef.name} fDef={fDef} rep={rep} savedNotes={savedNotes}
                  gmView={true} onUpdateRep={onUpdateRep} onUpdateRepNotes={onUpdateRepNotes} />
              );
            })}
          </div>
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

