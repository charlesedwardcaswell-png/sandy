import React from 'react';
import { Silhouette, WoundBadge } from './UI';
import { FacIcon } from './UI';
import { getArchetype, getWoundRank, repColor, repLabel, formatDate } from '../lib/utils';
import { WOUND_COLORS, WOUND_RANKS } from '../data/constants';

// ── PartyTab ──────────────────────────────────────────────────────────────────
export default function PartyTab({ isGM, isPCView, characters, reps, inventory, encounterLog }) {
  const gmView = isGM && !isPCView;

  return (
    <div>
      {/* Party members */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
        <i className="ti ti-users" style={{ marginRight: 6 }} />Party Overview
      </div>

      {characters.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>
          No characters created yet.
        </div>
      ) : (
        <div style={{ marginBottom: '1.5rem' }}>
          {characters.map(c => {
            const woundRank = getWoundRank(c.current_wounds || 0, c.max_wounds || 10);
            const wColor = WOUND_COLORS[woundRank];
            return (
              <div key={c.id} className="party-card">
                <div style={{ width: 44, height: 56, borderRadius: 5, background: 'var(--bg-mid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  <Silhouette type={getArchetype(c.school)} size={36} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.35rem' }}>{c.faction} · {c.school} R{c.school_rank}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span className="party-stat" style={{ color: wColor, borderColor: wColor + '44' }}>{WOUND_RANKS[woundRank]}</span>
                    <span className="party-stat">Void {c.current_void || c.void}/{c.void}</span>
                    <span className="party-stat">{c.current_stance || 'Attack'}</span>
                    {c.current_weapon && <span className="party-stat" style={{ color: 'var(--gold-dim)' }}>⚔ {c.current_weapon.split(' ')[0]}</span>}
                    {gmView && <span className="party-stat" style={{ color: 'var(--gold-dim)' }}>{(c.xp_total || 0) - (c.xp_spent || 0)} XP</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{c.copper || 0}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>copper</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Faction standing */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
        <i className="ti ti-shield-half" style={{ marginRight: 6 }} />Faction Standing
      </div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {Object.entries(reps).map(([faction, repRow]) => {
            const rep = repRow?.reputation ?? 0;
            return (
              <div key={faction} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.3rem .25rem', borderBottom: '1px solid rgba(107,78,40,.15)', fontSize: 11 }}>
                <FacIcon name={faction} size={13} />
                <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 10 }}>{faction}</span>
                <span style={{ fontWeight: 600, color: repColor(rep), fontSize: 11 }}>{rep > 0 ? '+' : ''}{rep}</span>
                <span style={{ fontSize: 9, color: repColor(rep), minWidth: 34 }}>{repLabel(rep)}</span>
              </div>
            );
          })}
          {Object.keys(reps).length === 0 && (
            <div style={{ gridColumn: '1/-1', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.5rem 0' }}>
              No faction reputation data yet.
            </div>
          )}
        </div>
      </div>

      {/* Group inventory summary */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
        <i className="ti ti-backpack" style={{ marginRight: 6 }} />Group Inventory
      </div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: (inventory.items || []).length > 0 ? '.5rem' : 0 }}>
          <i className="ti ti-coin" style={{ color: 'var(--gold)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>{inventory.copper ?? 0}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>copper in party treasury</span>
        </div>
        {(inventory.items || []).map((item, i) => (
          <div key={i} className="inv-row">
            <span className="inv-cat">{item.category}</span>
            <span style={{ flex: 1, color: 'var(--text-primary)' }}>{item.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>×{item.qty}</span>
          </div>
        ))}
        {(inventory.items || []).length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>No items.</div>
        )}
      </div>

      {/* Recent encounters */}
      {encounterLog && encounterLog.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
            <i className="ti ti-swords" style={{ marginRight: 6 }} />Recent Encounters
          </div>
          <div className="card">
            {encounterLog.slice(0, 5).map((e, i) => (
              <div key={i} style={{ padding: '.4rem 0', borderBottom: i < Math.min(encounterLog.length, 5) - 1 ? '1px solid rgba(107,78,40,.2)' : 'none', fontSize: 11 }}>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.15rem' }}>
                  <span style={{ color: 'var(--gold-dim)', fontWeight: 600 }}>S{e.session_number}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{formatDate(e.created_at)}</span>
                  <span style={{ padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontSize: 9 }}>{e.setting}</span>
                  <span style={{ padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontSize: 9 }}>{e.encounter_type}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>{e.rounds} rds</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>vs {e.enemies}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
