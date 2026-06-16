import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';

const PLAYER_PASSWORD = 'test'; // matches AuthScreen

// ── Danger action button with confirm ─────────────────────────────────────────
function DangerAction({ label, description, onConfirm }) {
  const [step, setStep] = useState(0); // 0=idle 1=confirm 2=done

  const handleClick = async () => {
    if (step === 0) { setStep(1); return; }
    if (step === 1) {
      await onConfirm();
      setStep(2);
      setTimeout(() => setStep(0), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.6rem 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {step === 1 && <span style={{ fontSize: 10, color: 'var(--red)' }}>Are you sure?</span>}
        {step === 2
          ? <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Done</span>
          : <button
              className={`btn btn-sm ${step === 1 ? 'btn-d' : ''}`}
              onClick={handleClick}
            >
              {step === 0 ? label : 'Confirm'}
            </button>
        }
        {step === 1 && <button className="btn btn-sm" onClick={() => setStep(0)}>Cancel</button>}
      </div>
    </div>
  );
}

// ── SettingsTab ───────────────────────────────────────────────────────────────
export default function SettingsTab() {
  const [playerPw, setPlayerPw] = useState(PLAYER_PASSWORD);
  const [pwSaved, setPwSaved] = useState(false);
  const [status, setStatus] = useState('');

  const savePlayerPassword = async () => {
    // Store in games table
    const { error } = await supabase
      .from('games')
      .update({ player_password: playerPw })
      .eq('id', GAME_ID);
    if (error) {
      setStatus('Error saving password — does games table have player_password column?');
    } else {
      setPwSaved(true);
      setStatus('Password updated. Note: AuthScreen still uses hardcoded "test" until you update AuthScreen.jsx.');
      setTimeout(() => setPwSaved(false), 3000);
    }
  };

  const wipeTable = async (table, filter = {}) => {
    let q = supabase.from(table).delete();
    Object.entries({ game_id: GAME_ID, ...filter }).forEach(([k, v]) => { q = q.eq(k, v); });
    const { error } = await q;
    if (error) console.error(`Wipe ${table} failed:`, error.message);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        <i className="ti ti-settings" style={{ marginRight: 8 }} />GM Settings
      </div>

      {/* Passwords */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">Passwords</div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.3rem' }}>GM Password</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', padding: '.4rem .6rem', background: 'var(--bg-panel)', borderRadius: 4, display: 'inline-block' }}>
            gm1234
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.25rem' }}>Change in <code>src/data/constants.js</code> → GM_PASSWORD</div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Player Password</div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={playerPw}
              onChange={e => { setPlayerPw(e.target.value); setPwSaved(false); }}
              style={{ flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && savePlayerPassword()}
            />
            <button className="btn btn-p btn-sm" onClick={savePlayerPassword}>
              {pwSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.25rem' }}>Change in <code>src/components/AuthScreen.jsx</code> → PLAYER_PASSWORD</div>
          {status && <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: '.4rem' }}>{status}</div>}
        </div>
      </div>

      {/* Data management */}
      <div className="card">
        <div className="card-title" style={{ color: 'var(--red)' }}>
          <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />Data Management — Destructive
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '1rem' }}>
          All wipes are permanent and cannot be undone. Each requires a confirmation click.
        </div>

        <DangerAction
          label="Wipe All Map Pins"
          description="Removes every pin from both map layers"
          onConfirm={() => wipeTable('map_pins')}
        />
        <DangerAction
          label="Wipe All Quests"
          description="Removes all quest objectives from all sessions"
          onConfirm={() => wipeTable('quests')}
        />
        <DangerAction
          label="Wipe Encounter Log"
          description="Clears the full encounter history"
          onConfirm={() => wipeTable('encounter_log')}
        />
        <DangerAction
          label="Wipe Session Archive"
          description="Deletes all archived sessions and their recaps"
          onConfirm={() => wipeTable('sessions', { is_active: false })}
        />
        <DangerAction
          label="Wipe All NPCs"
          description="Removes every NPC from the log"
          onConfirm={() => wipeTable('npcs')}
        />
        <DangerAction
          label="Wipe All Characters"
          description="Deletes every player character — use before a new campaign"
          onConfirm={() => wipeTable('characters')}
        />
        <DangerAction
          label="Reset Faction Reputation"
          description="Sets all faction reputations back to 0"
          onConfirm={async () => {
            await supabase
              .from('faction_reputation')
              .update({ reputation: 0 })
              .eq('game_id', GAME_ID);
          }}
        />
      </div>
    </div>
  );
}
