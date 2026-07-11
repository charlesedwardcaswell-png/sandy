import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';
import { TILE_TYPES } from './EncounterTab';
import { ImageUrlField } from './UI';

// Purely cosmetic overlay effects for doodads - do NOT block line-of-sight or feed into the lighting
// system (confirmed with Charles: visual only for now). Rendered in GridCreatorTab.jsx/EncounterTab.jsx.
const DOODAD_EFFECTS = [
  { key: 'none', label: 'None' },
  { key: 'sandstorm', label: 'Sandstorm' },
  { key: 'fog', label: 'Thick Fog' },
  { key: 'smoke', label: 'Smoke' },
];

export default function DoodadsTab({ isDeveloper }) {
  if (!isDeveloper) return null; // App.js already gates the parent tab; belt and suspenders
  return (
    <div>
      <DoodadLibraryPanel />
    </div>
  );
}

// ── Doodad Library - dev-defined multi-square props (trees, buildings, ponds, etc.) that the Battle
// Grid Creator's placement panel reads from. Footprint is a plain width×height rectangle for now
// (every occupied cell gets the same tileType) - irregular/L-shaped footprints are a deliberate
// later extension (add an optional per-cell mask; absent = full rectangle, so nothing here needs to
// change to support it). Placement/auto-terrain-assignment and rendering live in GridCreatorTab.jsx.
// Moved out of Tileset into its own tab this pass (Charles) - was previously one panel among several
// in TilesetTab.jsx; unchanged internally, just relocated.
function DoodadLibraryPanel() {
  const [doodads, setDoodads] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: '', width: 1, height: 1, imageUrl: '', tileType: 'wall', shape: 'rectangle', effect: 'none' });

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setDoodads(data?.settings?.doodad_library || []);
      setLoaded(true);
    });
  }, []);

  const persist = async (next) => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), doodad_library: next } })
      .eq('id', GAME_ID);
    if (!error) { setDoodads(next); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save doodad_library failed:', error.message);
  };

  const addDoodad = () => {
    if (!draft.name.trim() || !draft.imageUrl.trim()) return;
    const entry = { id: `doodad_${Date.now()}`, name: draft.name.trim(), width: Math.max(1, draft.width), height: Math.max(1, draft.height), imageUrl: draft.imageUrl.trim(), tileType: draft.tileType, shape: draft.shape || 'rectangle', effect: draft.effect || 'none' };
    persist([...doodads, entry]);
    setDraft({ name: '', width: 1, height: 1, imageUrl: '', tileType: 'wall', shape: 'rectangle', effect: 'none' });
    setShowAdd(false);
  };

  const removeDoodad = (id) => persist(doodads.filter(d => d.id !== id));

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Doodad Library</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        Multi-square props (trees, buildings, ponds, fire pits...) for the Battle Grid Creator's placement panel.
        Every cell the doodad occupies automatically becomes the chosen tile type when placed - the doodad's own
        image then renders on top of that. Each doodad is its own image, not a shared spritesheet.
      </p>

      {doodads.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>None yet.</div>}
      {doodads.map(d => (
        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 4, marginBottom: 3, background: 'rgba(107,78,40,.08)' }}>
          <img src={d.imageUrl} alt={d.name} style={{ width: 28, height: 28, objectFit: 'contain', background: 'var(--bg-panel)', borderRadius: 3 }}
            onError={e => { e.target.style.visibility = 'hidden'; }} />
          <span style={{ fontSize: 13, flex: 1 }}>{d.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.width}×{d.height}</span>
          <span style={{ fontSize: 11, color: 'var(--gold-dim)' }}>{TILE_TYPES.find(t => t.key === d.tileType)?.label || d.tileType}</span>
          {d.shape === 'circle' && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>◯ circle</span>}
          {d.effect && d.effect !== 'none' && <span style={{ fontSize: 11, color: 'var(--gold)' }}>✨ {DOODAD_EFFECTS.find(e => e.key === d.effect)?.label || d.effect}</span>}
          <button onClick={() => removeDoodad(d.id)} title="Remove" style={{ fontSize: 11, padding: '2px 6px', color: 'var(--red)' }}>✕</button>
        </div>
      ))}

      {showAdd ? (
        <div style={{ marginTop: 8, padding: '.6rem', background: 'var(--bg-panel)', borderRadius: 5, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input type="text" placeholder="Name (e.g. Oak Tree)" value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} style={{ fontSize: 12 }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Width <input type="number" min={1} max={12} value={draft.width} onChange={e => setDraft(p => ({ ...p, width: +e.target.value }))} style={{ width: 45, fontSize: 12 }} /></label>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Height <input type="number" min={1} max={12} value={draft.height} onChange={e => setDraft(p => ({ ...p, height: +e.target.value }))} style={{ width: 45, fontSize: 12 }} /></label>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tile Type
              <select value={draft.tileType} onChange={e => setDraft(p => ({ ...p, tileType: e.target.value }))} style={{ fontSize: 12, marginLeft: 4 }}>
                {TILE_TYPES.filter(t => !t.isPcStart).map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shape
              <select value={draft.shape} onChange={e => setDraft(p => ({ ...p, shape: e.target.value }))} style={{ fontSize: 12, marginLeft: 4 }}>
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
              </select>
            </label>
          </div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Effect (visual only, purely cosmetic - no line-of-sight impact)
            <select value={draft.effect} onChange={e => setDraft(p => ({ ...p, effect: e.target.value }))} style={{ fontSize: 12, marginLeft: 4 }}>
              {DOODAD_EFFECTS.map(ef => <option key={ef.key} value={ef.key}>{ef.label}</option>)}
            </select>
          </label>
          <ImageUrlField value={draft.imageUrl} onChange={v => setDraft(p => ({ ...p, imageUrl: v }))}
            placeholder="Image URL" pathPrefix="tileset" inputStyle={{ fontSize: 12 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-p" disabled={!draft.name.trim() || !draft.imageUrl.trim()} onClick={addDoodad}>Add</button>
            <button className="btn btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-sm" onClick={() => setShowAdd(true)}>+ New Doodad</button>
      )}
      {saved && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 6 }}>✓ Saved</div>}
    </div>
  );
}
