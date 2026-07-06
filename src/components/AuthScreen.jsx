import React, { useState, useEffect } from 'react';
import { GM_PASSWORD, GAME_ID } from '../data/constants';
import { supabase } from '../lib/supabase';
import { playLogin } from '../lib/sounds';

export function AuthScreen({ onGMLogin, onPlayerLogin, onObserver, onDeveloperLogin }) {
  const [selected, setSelected] = useState(null);
  const [pw, setPw] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [playerAccounts, setPlayerAccounts] = useState([]);
  // Live GM password: defaults to the constant, but a developer can override it
  // from Settings → Players & Passwords (games.gm_password) without a code deploy.
  const [gmPassword, setGmPassword] = useState(GM_PASSWORD);

  useEffect(() => {
    supabase.from('games').select('settings, gm_password').eq('id', GAME_ID).single().then(({ data }) => {
      if (data?.settings?.player_accounts) setPlayerAccounts(data.settings.player_accounts);
      if (data?.gm_password) setGmPassword(data.gm_password);
    });
  }, []);

  const tryLogin = () => {
    setError('');
    // Developer backdoor — works regardless of which slot is selected; never displayed in UI
    if (pw === 'dev') { playLogin(); onDeveloperLogin(); return; }
    if (selected === 'gm') {
      if (pw === gmPassword) { playLogin(); onGMLogin(); return; }
      setError('Incorrect GM password.');
    } else if (selected === 'player') {
      // Try named accounts first
      if (playerAccounts.length > 0) {
        const match = playerAccounts.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === pw);
        if (match) { playLogin(); onPlayerLogin(match.username); return; }
        // Fallback: if no username, try password-only match against any account
        if (!username && playerAccounts.some(a => a.password === pw)) { playLogin(); onPlayerLogin('Player'); return; }
        setError('Incorrect username or password.');
      } else {
        // Fallback to old single password
        if (pw === 'test') { playLogin(); onPlayerLogin('Player'); return; }
        setError('Incorrect player password.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '2rem', width: 360, maxWidth: '95vw' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)', letterSpacing: '.08em', textTransform: 'uppercase' }}>LBS</div>
          <div style={{ fontSize: 15, color: 'var(--gold-dim)', marginBottom: '.25rem' }}>The Heart of the Jewel</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select your role to enter</div>
        </div>

        <Slot id="gm" selected={selected} onSelect={id => { setSelected(id); setPw(''); setUsername(''); setError(''); }}
          icon={<i className="ti ti-crown" style={{ fontSize: 20, color: 'var(--gold)' }} />}
          label="Game Master" sub="Full control" color="var(--gold)" />

        <Slot id="player" selected={selected} onSelect={id => { setSelected(id); setPw(''); setUsername(''); setError(''); }}
          icon={<i className="ti ti-users" style={{ fontSize: 20, color: '#80a8e8' }} />}
          label="Player" sub="See all characters, play your character" color="#80a8e8" />

        {selected && (
          <div style={{ marginTop: '.75rem', padding: '.75rem', background: 'var(--bg-panel)', borderRadius: 5, border: '1px solid var(--border)' }}>
            {selected === 'player' && playerAccounts.length > 0 && (
              <div style={{ marginBottom: '.4rem' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.25rem' }}>Username:</div>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && tryLogin()}
                  placeholder="Your name..." style={{ width: '100%', marginBottom: '.4rem' }} autoFocus />
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
              {selected === 'gm' ? 'GM Password:' : 'Password:'}
            </div>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && tryLogin()}
                placeholder="Enter password..." style={{ flex: 1 }}
                autoFocus={selected === 'gm' || playerAccounts.length === 0} />
              <button className="btn btn-p" onClick={tryLogin}>Enter</button>
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--red)', marginTop: '.3rem' }}>{error}</div>}
          </div>
        )}

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button className="btn btn-sm" style={{ fontSize: 12, color: 'var(--text-muted)' }} onClick={() => { playLogin(); onObserver(); }}>
            <i className="ti ti-eye" style={{ fontSize: 12, marginRight: 4 }} />
            Enter as Observer (read-only)
          </button>
        </div>
      </div>
    </div>
  );
}

function Slot({ id, selected, onSelect, icon, label, sub, color }) {
  const isSelected = selected === id;
  return (
    <div onClick={() => onSelect(id)} style={{
      display: 'flex', alignItems: 'center', gap: '.75rem',
      padding: '.6rem .75rem', marginBottom: '.4rem',
      border: `1px solid ${isSelected ? color : 'var(--border)'}`,
      borderRadius: 5, cursor: 'pointer', transition: 'all .15s',
      background: isSelected ? `color-mix(in srgb, ${color} 8%, transparent)` : 'var(--bg-panel)',
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 4, background: 'var(--bg-mid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: isSelected ? color : 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
      {isSelected && <i className="ti ti-chevron-right" style={{ marginLeft: 'auto', color, fontSize: 16 }} />}
    </div>
  );
}
