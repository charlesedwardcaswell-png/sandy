import React, { useState } from 'react';
import { GM_PASSWORD } from '../data/constants';
import { CharacterSilhouette } from './UI';

export function AuthScreen({ characters, onGMLogin, onPCLogin, onObserver }) {
  const [selected, setSelected] = useState(null);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const tryLogin = () => {
    setError('');
    if (selected === 'gm') {
      if (pw === GM_PASSWORD) { onGMLogin(); return; }
      setError('Incorrect GM password.');
    } else if (selected) {
      const char = characters.find(c => c.id === selected);
      if (char && pw === char.pc_password) { onPCLogin(selected); return; }
      setError('Incorrect character password.');
    }
  };

  const handleKey = e => { if (e.key === 'Enter') tryLogin(); };

  // Find characters without a created character (open slots via pc_password)
  const openSlots = characters.filter(c => c.pc_password && !c.name);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '2rem', width: 400, maxWidth: '95vw' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)', letterSpacing: '.08em', textTransform: 'uppercase' }}>LBS</div>
          <div style={{ fontSize: 13, color: 'var(--gold-dim)', marginBottom: '.25rem' }}>The Heart of the Jewel</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Select your role to enter</div>
        </div>

        {/* GM slot */}
        <Slot
          id="gm"
          selected={selected}
          onSelect={id => { setSelected(id); setPw(''); setError(''); }}
          icon={<i className="ti ti-crown" style={{ fontSize: 18, color: 'var(--gold)' }} />}
          label="Game Master"
          sub="Full control — GM password required"
          labelColor="var(--gold)"
        />

        {/* PC slots */}
        {characters.map(char => (
          <Slot
            key={char.id}
            id={char.id}
            selected={selected}
            onSelect={id => { setSelected(id); setPw(''); setError(''); }}
            icon={<CharacterSilhouette school={char.school} size={22} />}
            label={char.name}
            sub={`${char.school} · ${char.faction}`}
            labelColor="var(--text-primary)"
            accentColor="#80a8e8"
          />
        ))}

        {/* Password entry */}
        {selected && (
          <div style={{ marginTop: '.75rem', padding: '.75rem', background: 'var(--bg-panel)', borderRadius: 5, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
              {selected === 'gm' ? 'GM Password:' : 'Character Password:'}
            </div>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Enter password..."
                style={{ flex: 1 }}
                autoFocus
              />
              <button className="btn btn-p" onClick={tryLogin}>Enter</button>
            </div>
            {error && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: '.3rem' }}>{error}</div>}
          </div>
        )}

        {/* Observer */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            className="btn btn-sm"
            style={{ fontSize: 10, color: 'var(--text-muted)' }}
            onClick={onObserver}
          >
            <i className="ti ti-eye" style={{ fontSize: 10, marginRight: 4 }} />
            Enter as Observer (read-only)
          </button>
        </div>
      </div>
    </div>
  );
}

function Slot({ id, selected, onSelect, icon, label, sub, labelColor, accentColor }) {
  const isSelected = selected === id;
  const color = accentColor || 'var(--gold)';
  return (
    <div
      onClick={() => onSelect(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '.75rem',
        padding: '.6rem .75rem',
        border: `1px solid ${isSelected ? color : 'var(--border)'}`,
        borderRadius: 5,
        background: isSelected ? `rgba(${color === 'var(--gold)' ? '200,150,42' : '48,96,168'},.08)` : 'var(--bg-panel)',
        cursor: 'pointer', marginBottom: '.4rem', transition: 'all .15s',
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 4, background: 'var(--bg-mid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: isSelected ? color : labelColor }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
      {isSelected && <i className="ti ti-chevron-right" style={{ marginLeft: 'auto', color, fontSize: 14 }} />}
    </div>
  );
}
