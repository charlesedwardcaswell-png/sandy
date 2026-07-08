import React, { useState } from 'react';

// ── Integrity Actions Table (LBS p.81) ───────────────────────────────────────
// Columns: action, then gain/loss at Integrity Ranks 0,1,2,3,4,5
const INTEGRITY_ACTIONS = [
  { action: 'Accepting a bribe',                             vals: [0, 0, -1, -1, -2, -3],   type: 'bad' },
  { action: 'Acknowledging a superior opponent',             vals: [1, 1, 1, 0, 0, 0],        type: 'good' },
  { action: 'Aiding a wounded enemy',                        vals: [3, 2, 2, 2, 2, 1],        type: 'good' },
  { action: 'Accomplice to a heinous crime (murder, kidnap)',vals: [0, 0, -1, -3, -7, -9],   type: 'bad' },
  { action: 'Accomplice to a minor crime (theft, espionage)',vals: [0, -1, -3, -3, -3, -5],  type: 'bad' },
  { action: 'Betraying your sworn leader or Faction',        vals: [-1, -1, 0, -2, -6, -8],  type: 'bad' },
  { action: 'Duped into performing a criminal act',          vals: [0, 0, 0, -2, -3, -3],    type: 'bad' },
  { action: 'Duped into performing a disloyal act',          vals: [0, -1, 0, -3, -3, -5],   type: 'bad' },
  { action: 'Duped into performing a foolish act',           vals: [0, 0, 0, -1, -2, -3],    type: 'bad' },
  { action: 'Deliberately deceiving another',                vals: [0, -1, -1, -1, -2, -3],  type: 'bad' },
  { action: 'Disobeying your leader\'s commands',            vals: [0, -1, -1, -3, -3, -5],  type: 'bad' },
  { action: 'Facing a clearly superior foe for your Faction',vals: [4, 3, 3, 2, 2, 1],      type: 'good' },
  { action: 'Fleeing from battle',                           vals: [0, -1, -2, -3, -4, -5],  type: 'bad' },
  { action: 'Fulfilling a promise despite great personal cost',vals:[4,4, 3, 2, 1, 0],      type: 'good' },
  { action: 'Instigating unwarranted violence',              vals: [0, 0, -1, -1, -2, -3],   type: 'bad' },
  { action: 'Lying to bolster your own reputation',          vals: [0, 0, 0, -1, -2, -3],    type: 'bad' },
  { action: 'Protecting Faction interests at great risk',    vals: [3, 3, 2, 2, 1, 1],       type: 'good' },
  { action: 'Showing kindness to one beneath your station',  vals: [5, 4, 3, 3, 2, 1],      type: 'good' },
];

// ── Status Table (LBS p.77) ──────────────────────────────────────────────────
const STATUS_TABLE = [
  { status: 9.5, title: 'Leader of a Faction', desc: 'The Caliph, the Old Man of the Mountain, Amru al-Zaqra.' },
  { status: 9,   title: 'Senior Lieutenant of a Faction', desc: 'Major officers, trusted inner circle of a Faction leader.' },
  { status: 8,   title: 'Senior Qadi / Faction Commander', desc: 'Judges of the Caliphate; commanding officers.' },
  { status: 7,   title: 'Ebonite Crusader / Faction Officer', desc: 'Trusted enforcers; second-tier leadership.' },
  { status: 6,   title: 'Senior Officer of the City Guard', desc: 'Captains; established Faction representatives.' },
  { status: 5,   title: 'Official of the Caliphate / Sultanate', desc: 'Mid-rank bureaucrats; established merchants.' },
  { status: 4,   title: 'Successful Merchant / Faction Veteran', desc: 'Anyone with a reputation and some resources.' },
  { status: 3,   title: 'City Guardsman / Average Faction Member', desc: 'Rank and file. Most starting characters.' },
  { status: 2,   title: 'Average Faction Member', desc: 'New arrivals, apprentices, minor members.' },
  { status: 1.5, title: 'Domestic Servant', desc: 'Household staff, minor functionaries.' },
  { status: 1,   title: 'Common Laborer', desc: 'Dockworkers, market vendors, beggars with some presence.' },
  { status: 0.3, title: 'Street Urchin', desc: 'Children of the Maze; the utterly forgotten.' },
  { status: 0,   title: 'Outcast', desc: 'No social standing whatsoever.' },
];

// ── Reputation Effects (LBS p.78-80) ─────────────────────────────────────────
const REPUTATION_RANKS = [
  { rank: '0', title: 'Unknown', effect: 'No recognition bonus. Social rolls unaffected.', recognizeTN: 60 },
  { rank: '1', title: 'Local Notice', effect: 'Recognized occasionally in familiar places.', recognizeTN: 55 },
  { rank: '2', title: 'Known', effect: 'Word has spread. +2 to social rolls when recognized.', recognizeTN: 50 },
  { rank: '3', title: 'Notable', effect: '+3 to social rolls when recognized.', recognizeTN: 45 },
  { rank: '4', title: 'Renowned', effect: '+4 to social rolls. People seek you out.', recognizeTN: 40 },
  { rank: '5', title: 'Famous', effect: '+5 to social rolls. Hard to move unnoticed.', recognizeTN: 35 },
  { rank: '6', title: 'Celebrated', effect: '+6 to social rolls. Your name opens doors.', recognizeTN: 30 },
  { rank: '7', title: 'Legend in the Making', effect: '+7 to social rolls. Songs are written about you.', recognizeTN: 25 },
  { rank: '8', title: 'Living Legend', effect: '+8 to social rolls. Your reputation precedes you everywhere.', recognizeTN: 20 },
  { rank: '9', title: 'Icon', effect: '+9 to social rolls. Stories of your deeds span the Burning Sands.', recognizeTN: 15 },
  { rank: '10', title: 'Hero of the Jewel', effect: '+10 to social rolls. You are history incarnate.', recognizeTN: 10 },
];

const REPUTATION_GAINS = [
  { event: 'Gain an Insight Rank', gain: '+1 Rank' },
  { event: 'Win a Tahaddi duel vs. equal/higher Insight Rank', gain: '+enemy Status or Rep Rank' },
  { event: 'Win a Tahaddi duel vs. lower Insight Rank', gain: '+1/3 enemy Status or Rep (round up)' },
  { event: 'Kill opponent in fair duel', gain: '+3 points' },
  { event: 'Complete a quest given by another', gain: '+½ questgiver\'s Rep or Status (round up)' },
  { event: 'Acknowledged heroic by Status 7+ character', gain: '+1 Rank (once per year)' },
  { event: 'Survive a battle', gain: '+3 points' },
  { event: 'Win a battle', gain: '+6 points' },
  { event: 'Instrumental in winning a battle', gain: '+5 extra points' },
  { event: 'Avenge a blood feud publicly', gain: '+enemy\'s Status or Rep' },
  { event: 'Craftsmanship (work of lasting beauty)', gain: '+1 point per Raise used in creation' },
  { event: 'Month of idleness', gain: '–1 point (–2 if nothing gained that month)' },
  { event: 'Leading an army that loses / losing a duel', gain: '–1 Rank' },
  { event: 'Caught in a lie about your deeds', gain: '–double original gain' },
];

export default function SocialReferenceModal({ onClose, initialTab = 'integrity', char }) {
  const [tab, setTab] = useState(initialTab);
  const curIntRank = char ? Math.floor(Number(char.integrity) || 0) : null;

  const fmtVal = (v) => {
    if (v === 0) return <span style={{ color: 'var(--text-muted)' }}>0</span>;
    if (v > 0) return <span style={{ color: '#4a8a40', fontWeight: 700 }}>+{v}</span>;
    return <span style={{ color: '#c84030', fontWeight: 700 }}>{v}</span>;
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>Social Standing Reference</div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
          {[
            { id: 'integrity',   label: 'Integrity',   color: '#c8a040' },
            { id: 'reputation',  label: 'Reputation',  color: '#c8a040' },
            { id: 'status',      label: 'Status',      color: '#80a8c8' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`btn btn-sm ${tab === t.id ? 'btn-p' : ''}`}
              style={tab === t.id ? { borderColor: t.color, color: t.color } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── INTEGRITY ── */}
        {tab === 'integrity' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.75rem', lineHeight: 1.6 }}>
              Integrity reflects personal character - honesty, courage, loyalty. Scale: <strong style={{ color: 'var(--gold)' }}>0.0 – 5.9</strong>.
              At session close, GM scores the session (0–5) and the new value is averaged with current.
              {char && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>Current: <strong>{(Number(char.integrity) || 0).toFixed(1)}</strong> (Rank {curIntRank})</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.5rem', fontStyle: 'italic' }}>
              Tests of Integrity: if you would lose Integrity from an action, you may make a special roll first.
              Success: +2 pts. Failure: –8 pts. These rolls may be re-rolled.
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 6px', color: 'var(--text-muted)', fontWeight: 600, minWidth: 220 }}>Action</th>
                    {[0,1,2,3,4,5].map(r => (
                      <th key={r} style={{ textAlign: 'center', padding: '4px 6px', color: r === curIntRank ? 'var(--gold)' : 'var(--text-muted)', fontWeight: r === curIntRank ? 700 : 400, minWidth: 38 }}>
                        R{r}{r === curIntRank ? ' ◄' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INTEGRITY_ACTIONS.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(107,78,40,.15)', background: i % 2 === 0 ? 'transparent' : 'rgba(107,78,40,.04)' }}>
                      <td style={{ padding: '4px 6px', color: row.type === 'good' ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                        {row.type === 'good' ? '▲ ' : '▼ '}{row.action}
                      </td>
                      {row.vals.map((v, ri) => (
                        <td key={ri} style={{ textAlign: 'center', padding: '4px 6px', background: ri === curIntRank ? 'rgba(200,150,42,.06)' : 'transparent' }}>
                          {fmtVal(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: '.75rem', fontStyle: 'italic' }}>
              Integrity cannot drop below 0.0 or exceed 5.9. Gains/losses scale by current Rank - the higher you are, the harder to rise and easier to fall.
            </div>
          </div>
        )}

        {/* ── REPUTATION ── */}
        {tab === 'reputation' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.75rem', lineHeight: 1.6 }}>
              Reputation reflects public fame from personal accomplishment. Scale: <strong style={{ color: 'var(--gold)' }}>0 – 10</strong>.
              Recognition TN = 60 – (Reputation Rank × 5). Once recognized, add Reputation Rank to social rolls.
              {char && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>Current: <strong>{char.reputation ?? 0}</strong></span>}
            </div>
            <div style={{ fontSize: 11, color: '#c84030', marginBottom: '.75rem' }}>
              <strong>Infamy:</strong> dishonorable/criminal characters become Infamous (negative Reputation). Infamy adds to Intimidation and social rolls vs. others with Infamy - but not to positive social rolls.
            </div>

            {/* Rank table */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.4rem' }}>Reputation Ranks</div>
              {REPUTATION_RANKS.map(r => {
                const isChar = char && String(Math.floor(char.reputation || 0)) === r.rank;
                return (
                  <div key={r.rank} style={{ display: 'flex', gap: '.5rem', padding: '4px 6px', borderRadius: 4, background: isChar ? 'rgba(200,150,42,.1)' : 'transparent', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, color: isChar ? 'var(--gold)' : 'var(--text-muted)', minWidth: 24 }}>{r.rank}</span>
                    <span style={{ fontWeight: 600, color: isChar ? 'var(--gold)' : 'var(--text-primary)', minWidth: 130 }}>{r.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>{r.effect}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>TN {r.recognizeTN}</span>
                  </div>
                );
              })}
            </div>

            {/* Gains & losses */}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.4rem' }}>Common Gains & Losses</div>
            {REPUTATION_GAINS.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '.5rem', padding: '3px 6px', borderBottom: '1px solid rgba(107,78,40,.12)', fontSize: 12 }}>
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{r.event}</span>
                <span style={{ color: r.gain.startsWith('+') || r.gain.startsWith('½') || r.gain.startsWith('⅓') ? '#4a8a40' : '#c84030', fontWeight: 600, minWidth: 120, textAlign: 'right' }}>{r.gain}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── STATUS ── */}
        {tab === 'status' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.75rem', lineHeight: 1.6 }}>
              Status is your objective place in Medinaat al-Salaam's social hierarchy. Scale: <strong style={{ color: '#80a8c8' }}>0 – 10</strong>.
              High Status means others defer to you. Status crosses Faction lines.
              {char && <span style={{ color: '#80a8c8', marginLeft: 8 }}>Current: <strong>{char.status ?? 0}</strong></span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.75rem' }}>
              Status can only be <strong>gained</strong> by promotion from someone with authority over you, or by usurpation.
              It can be <strong>lost</strong> voluntarily (retirement, disgrace) or by demotion. Minimum: 0.
            </div>
            {STATUS_TABLE.map((row, i) => {
              const isChar = char && Math.abs((char.status || 0) - row.status) < 0.4;
              return (
                <div key={i} style={{ display: 'flex', gap: '.75rem', padding: '.4rem .6rem', borderRadius: 5, background: isChar ? 'rgba(128,168,200,.12)' : i % 2 === 0 ? 'transparent' : 'rgba(107,78,40,.04)', marginBottom: 2, alignItems: 'flex-start', border: isChar ? '1px solid rgba(128,168,200,.3)' : '1px solid transparent' }}>
                  <span style={{ fontWeight: 700, color: isChar ? '#80a8c8' : 'var(--text-muted)', fontSize: 15, minWidth: 32, textAlign: 'right' }}>{row.status}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: isChar ? '#80a8c8' : 'var(--text-primary)', fontSize: 13 }}>{row.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
