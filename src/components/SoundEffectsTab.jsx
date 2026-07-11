import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';
import { AudioUrlField } from './UI';
import { setCustomSoundUrls, playClick, playSuccess, playFailure, playDiceRoll, playExplosionPop, playChestOpen, playDamage } from '../lib/sounds';

// Each slot's key matches lib/sounds.js's SOUND_KEYS - a custom URL here overrides that cue's default
// (a bundled file or a synthesized tone) app-wide, for everyone, the moment it's saved (setCustomSoundUrls
// is called both here on save and once at app load in App.js - see applyGameSettings).
const SLOTS = [
  { key: 'click',       label: 'Click',        desc: 'General button/tile click feedback.',                    test: playClick },
  { key: 'success',     label: 'Success',      desc: 'A roll succeeds against its TN.',                        test: playSuccess },
  { key: 'failure',     label: 'Failure',      desc: 'A roll fails against its TN.',                            test: playFailure },
  { key: 'diceRoll',    label: 'Dice Rolling', desc: 'Dice physically rolling, before the result resolves.',   test: playDiceRoll },
  { key: 'explosion',   label: 'Explosion',    desc: 'Explosive damage / a big dramatic hit.',                  test: playExplosionPop },
  { key: 'chestOpen',   label: 'Chest Opening', desc: 'A container is opened/investigated.',                   test: playChestOpen },
  { key: 'damage',      label: 'Damage Taken', desc: 'A combatant takes wounds.',                               test: playDamage },
];

export default function SoundEffectsTab({ isDeveloper }) {
  const [sounds, setSounds] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  // Same stale-closure fix as IconLibraryPanel (TilesetTab.jsx) - onCommit firing right after an
  // upload was persisting whatever `sounds` was at the last render before the upload, silently
  // reverting the just-set sound a moment later. Ref is always current regardless of render timing.
  const soundsRef = React.useRef(sounds);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setSounds(data?.settings?.sound_effects || {});
      setLoaded(true);
    });
  }, []);

  if (!isDeveloper) return null; // App.js already gates the parent tab; belt and suspenders - checked
  // after the hooks above, not before, since conditionally skipping a hook call breaks React's rule
  // that every render must call the same hooks in the same order (this component, unlike TilesetTab/
  // DoodadsTab, calls hooks directly itself rather than only in child panel components).

  const persist = async (next) => {
    soundsRef.current = next;
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), sound_effects: next } })
      .eq('id', GAME_ID);
    if (!error) { setSounds(next); setCustomSoundUrls(next); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save sound_effects failed:', error.message);
  };

  const setDraft = (key, url) => setSounds(prev => {
    const next = { ...prev, [key]: url };
    soundsRef.current = next;
    return next;
  });
  const commit = () => persist(soundsRef.current);
  const clearSound = (key) => { const next = { ...sounds }; delete next[key]; persist(next); };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Sound Effects</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Custom audio to replace the app's built-in cues (a few are bundled files, most are simple
        synthesized tones - see <code>lib/sounds.js</code>). Anything left unset keeps using its current
        default. Once saved, a custom sound applies for everyone immediately - no per-player setting.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0 1.5rem' }}>
        {SLOTS.map(s => (
          <div key={s.key} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <input type="checkbox" checked={!!sounds[s.key]} readOnly title={sounds[s.key] ? 'Custom sound uploaded' : 'Using the default sound'} style={{ margin: 0, cursor: 'default' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</span>
              <button type="button" className="btn btn-sm" style={{ fontSize: 10, padding: '1px 6px' }} onClick={s.test} title="Preview current sound (custom if set, otherwise the default)">
                <i className="ti ti-player-play" style={{ fontSize: 11 }} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.desc}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AudioUrlField value={sounds[s.key] || ''} onChange={v => setDraft(s.key, v)} onCommit={commit}
                placeholder={`${s.label} sound URL`} pathPrefix="sounds" inputStyle={{ fontSize: 12 }} />
              {sounds[s.key] && <button onClick={() => clearSound(s.key)} title="Clear (revert to default)" style={{ fontSize: 11, padding: '2px 6px', color: 'var(--red)' }}>✕</button>}
            </div>
          </div>
        ))}
      </div>

      {saved && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 6 }}>✓ Saved</div>}
    </div>
  );
}
