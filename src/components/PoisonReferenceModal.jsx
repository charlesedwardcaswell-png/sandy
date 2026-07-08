import React, { useState } from 'react';
import { POISONS_LIST, POWDERS_LIST } from '../data/constants';

export default function PoisonReferenceModal({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('poisons');

  const list = tab === 'poisons' ? POISONS_LIST : POWDERS_LIST;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#c08040' }}>⚗ Poisons & Powders Reference</div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.75rem', lineHeight: 1.5 }}>
          Poisons are crafted with <strong>Craft: Poison</strong> skill. Resist rolls use <strong>Raw Stamina</strong> unless noted.
          Treatment uses <strong>Medicine</strong> skill vs Heal TN. Characters wearing masks gain <strong>+10 TN</strong> vs powder attacks.
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: '.75rem' }}>
          <button className={`btn btn-sm ${tab === 'poisons' ? 'btn-p' : ''}`} onClick={() => { setTab('poisons'); setSelected(null); }}>Poisons ({POISONS_LIST.length})</button>
          <button className={`btn btn-sm ${tab === 'powders' ? 'btn-p' : ''}`} onClick={() => { setTab('powders'); setSelected(null); }}>Powders ({POWDERS_LIST.length})</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* List */}
          <div style={{ flex: '0 0 220px', minWidth: 0 }}>
            {tab === 'poisons' && POISONS_LIST.map((p, i) => (
              <div key={i} onClick={() => setSelected(i)}
                style={{ padding: '.4rem .6rem', borderRadius: 4, marginBottom: 3, cursor: 'pointer',
                  background: selected === i ? (p.color + '33') : 'var(--bg-panel)',
                  borderRight: `1px solid ${selected === i ? p.color : 'var(--border)'}`, borderTop: `1px solid ${selected === i ? p.color : 'var(--border)'}`, borderBottom: `1px solid ${selected === i ? p.color : 'var(--border)'}`,
                  borderLeft: `3px solid ${p.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected === i ? p.color : 'var(--text-primary)' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.method}</div>
              </div>
            ))}
            {tab === 'powders' && POWDERS_LIST.map((p, i) => (
              <div key={i} onClick={() => setSelected(i)}
                style={{ padding: '.4rem .6rem', borderRadius: 4, marginBottom: 3, cursor: 'pointer',
                  background: selected === i ? (p.color + '33') : 'var(--bg-panel)',
                  borderRight: `1px solid ${selected === i ? p.color : 'var(--border)'}`, borderTop: `1px solid ${selected === i ? p.color : 'var(--border)'}`, borderBottom: `1px solid ${selected === i ? p.color : 'var(--border)'}`,
                  borderLeft: `3px solid ${p.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected === i ? p.color : 'var(--text-primary)' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.delivery.slice(0, 40)}</div>
              </div>
            ))}
          </div>

          {/* Detail */}
          {selected !== null && tab === 'poisons' && (() => {
            const p = POISONS_LIST[selected];
            return (
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: p.color, marginBottom: '.5rem' }}>{p.name}</div>

                {[
                  { label: 'Method', val: p.method },
                  { label: 'Onset', val: p.onset },
                  { label: 'Effect', val: p.effect },
                  { label: 'Resist', val: p.resist + (p.resistTN ? ` (TN ${p.resistTN})` : '') },
                  { label: 'Heal TN', val: p.healTN ? String(p.healTN) : '-' },
                  { label: 'Craft TN', val: p.craftTN ? String(p.craftTN) : '-' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: '.5rem', marginBottom: '.3rem', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)', minWidth: 70, flexShrink: 0 }}>{row.label}:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{row.val}</span>
                  </div>
                ))}

                {p.craftNotes && (
                  <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginTop: '.4rem', padding: '.3rem .5rem', background: 'rgba(200,150,42,.06)', borderRadius: 3, borderLeft: `2px solid ${p.color}` }}>
                    <span style={{ color: 'var(--text-muted)' }}>Craft notes: </span>{p.craftNotes}
                  </div>
                )}
                {p.disease && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: '.4rem', padding: '.3rem .5rem', background: 'rgba(107,78,40,.08)', borderRadius: 3 }}>
                    <span style={{ fontWeight: 600 }}>Disease form: </span>{p.disease}
                  </div>
                )}
              </div>
            );
          })()}

          {selected !== null && tab === 'powders' && (() => {
            const p = POWDERS_LIST[selected];
            return (
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: p.color, marginBottom: '.5rem' }}>{p.name}</div>
                {[
                  { label: 'Delivery', val: p.delivery },
                  { label: 'Duration', val: p.duration },
                  { label: 'Craft', val: p.craft },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: '.5rem', marginBottom: '.3rem', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)', minWidth: 70, flexShrink: 0 }}>{row.label}:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{row.val}</span>
                  </div>
                ))}
                <div style={{ marginTop: '.5rem' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Available Effects:</div>
                  {p.effects.map((ef, i) => (
                    <div key={i} style={{ fontSize: 12, color: p.color, padding: '2px 6px', background: p.color + '18', borderRadius: 3, marginBottom: 3 }}>
                      • {ef}
                    </div>
                  ))}
                </div>
                {p.note && (
                  <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginTop: '.5rem', padding: '.3rem .5rem', background: 'rgba(200,150,42,.06)', borderRadius: 3 }}>
                    {p.note}
                  </div>
                )}
              </div>
            );
          })()}

          {selected === null && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
              Select a {tab === 'poisons' ? 'poison' : 'powder'} to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
