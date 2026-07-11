import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID, FACTION_ICONS, ALL_SKILLS, GEAR_LIST_NAMES, WEAPONS_LIST, SHIELDS, STANCES } from '../data/constants';
import { TILE_TYPES } from './EncounterTab';
import { ImageUrlField, ModelUrlField } from './UI';
import DoodadsTab from './DoodadsTab';
import SoundEffectsTab from './SoundEffectsTab';

const SUBTABS = [
  { key: 'icons',   label: 'Icons' },
  { key: 'tiles',   label: 'Tiles' },
  { key: 'doodads', label: 'Doodads' },
  { key: 'models',  label: '3D Models' },
  { key: 'art',     label: 'Interface Art' },
  { key: 'sounds',  label: 'Sound Effects' },
];

export default function TilesetTab({ isDeveloper }) {
  // Subtab state has to be declared before the isDeveloper early-return below (Rules of Hooks - every
  // render must call the same hooks in the same order, so a hook can't sit after a conditional return).
  const [subtab, setSubtab] = useState('icons');
  if (!isDeveloper) return null; // App.js already gates the parent tab; belt and suspenders

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {SUBTABS.map(t => (
          <button key={t.key} className={`layer-btn ${subtab === t.key ? 'active' : ''}`} onClick={() => setSubtab(t.key)}>{t.label}</button>
        ))}
      </div>

      {subtab === 'icons' && <IconLibraryPanel />}
      {subtab === 'tiles' && (<>
        <MasterAtlasPanel />
        <TileDefaultsPanel />
        <ContainerImagePanel />
      </>)}
      {subtab === 'doodads' && <DoodadsTab isDeveloper={isDeveloper} />}
      {subtab === 'models' && <Model3DLibraryPanel />}
      {subtab === 'art' && <InterfaceArtPanel />}
      {subtab === 'sounds' && <SoundEffectsTab isDeveloper={isDeveloper} />}
    </div>
  );
}

// ── Interface Art - background art for the app's own UI chrome (not the Battle Grid tileset). Three
// slots for now: standard panes (the everyday card/panel look used across most tabs), the stance/
// action panes (PCTurnPanel and the combatant card it lives in), and the dice roller window
// (DiceModal). Upload/storage only for now - these URLs aren't wired into any actual rendering yet;
// that's a separate follow-up once Charles decides exactly how an uploaded image should apply to a
// pane (full background image? a themed border treatment? per-theme overrides?). Stored under
// `games.settings.interface_art` so it's one JSONB blob rather than three top-level settings keys.
function InterfaceArtPanel() {
  const [art, setArt] = useState({ standard_panes: '', action_panes: '', dice_roller: '' });
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setArt({ standard_panes: '', action_panes: '', dice_roller: '', ...(data?.settings?.interface_art || {}) });
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), interface_art: art } })
      .eq('id', GAME_ID);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save interface_art failed:', error.message);
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  const SLOTS = [
    { key: 'standard_panes', label: 'Standard Panes', desc: 'The everyday card/panel background used across most tabs.' },
    { key: 'action_panes', label: 'Stance & Action Panes', desc: 'The combatant turn panel (stance selection, action buttons) in the Encounter tab.' },
    { key: 'dice_roller', label: 'Dice Roller Window', desc: 'The dice roll modal.' },
  ];

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Interface Art</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        Background art for the app's own UI chrome, not the Battle Grid tileset. <strong>Upload/storage
        only for now</strong> - these images aren't applied to any pane yet, that wiring is a separate
        follow-up once the exact look (full background? border treatment? per-theme?) is decided.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0 1.5rem' }}>
        {SLOTS.map(s => (
          <div key={s.key} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <input type="checkbox" checked={!!art[s.key]} readOnly title={art[s.key] ? 'Uploaded' : 'Not uploaded yet'} style={{ margin: 0, cursor: 'default' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.desc}</div>
            <ImageUrlField value={art[s.key] || ''} onChange={v => setArt(prev => ({ ...prev, [s.key]: v }))}
              placeholder={`${s.label} image URL`} pathPrefix="tileset" inputStyle={{ fontSize: 12 }} />
          </div>
        ))}
      </div>
      <button className="btn btn-p" onClick={save} style={{ marginTop: 6 }}>{saved ? '✓ Saved' : 'Save Interface Art'}</button>
    </div>
  );
}

// ── Container image - the single shared icon used for every placed chest/container. Containers are
// deliberately standalone (not a tile type, not a doodad) - nothing else on the grid is directly
// interactable, so folding "interactable" into either of those systems risked every future tile/doodad
// needing interaction-handling. Just one image for now, not a library - simple on purpose.
function ContainerImagePanel() {
  const [imageUrl, setImageUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setImageUrl(data?.settings?.container_image_url || '');
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), container_image_url: imageUrl } })
      .eq('id', GAME_ID);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save container_image_url failed:', error.message);
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Container Icon</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        Single shared image for every treasure chest/container placed on a Battle Grid, in the Grid
        Creator and live encounters alike. Leave blank to use a plain chest emoji fallback.
      </p>
      <ImageUrlField value={imageUrl} onChange={setImageUrl} placeholder="Container image URL"
        pathPrefix="tileset" inputStyle={{ fontSize: 12, marginBottom: 6 }} />
      <button className="btn btn-p" onClick={save} style={{ marginTop: 6 }}>{saved ? '✓ Saved' : 'Save Container Icon'}</button>
    </div>
  );
}

// ── Master Atlas - the shared 768×768 sprite sheet every Battle Grid's Tileset row draws from ──────
function MasterAtlasPanel() {
  const [atlasUrl, setAtlasUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setAtlasUrl(data?.settings?.master_atlas_url || '');
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), master_atlas_url: atlasUrl } })
      .eq('id', GAME_ID);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save master_atlas_url failed:', error.message);
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Master Atlas</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        768×768 image, 12×12 grid of 64×64 tiles. Rows are tilesets (themes), columns are terrain types -
        a saved Battle Grid's Tileset choice just moves down to a different row of this same shared image.
      </p>
      <ImageUrlField value={atlasUrl} onChange={setAtlasUrl} placeholder="Master atlas image URL"
        pathPrefix="tileset" inputStyle={{ fontSize: 12, marginBottom: 6 }} />
      <button className="btn btn-p" onClick={save} style={{ marginTop: 6 }}>{saved ? '✓ Saved' : 'Save Atlas URL'}</button>
    </div>
  );
}

// ── Tile Defaults - default color/icon per terrain type, with an optional default image URL ──────
function TileDefaultsPanel() {
  const [imageUrls, setImageUrls] = useState({});
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setImageUrls(data?.settings?.tile_default_images || {});
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), tile_default_images: imageUrls } })
      .eq('id', GAME_ID);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save tile_default_images failed:', error.message);
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Each terrain type's default color/label stand-in, until the master atlas image exists. Set an optional
        default image URL per type - once a real tileset image is chosen for a battle grid, that takes priority instead.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '.5rem 1rem', alignItems: 'center' }}>
        {TILE_TYPES.map(t => (
          <React.Fragment key={t.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: t.color, display: 'inline-block', border: '1px solid rgba(255,255,255,.2)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{t.short}</span>
            </div>
            <ImageUrlField value={imageUrls[t.key] || ''} onChange={v => setImageUrls(prev => ({ ...prev, [t.key]: v }))}
              placeholder={`Default image URL for ${t.label} (optional)`} pathPrefix="tileset"
              inputStyle={{ fontSize: 12, padding: '4px 8px' }} />
          </React.Fragment>
        ))}
      </div>
      <button className="btn btn-p" onClick={save} style={{ marginTop: '1rem' }}>
        {saved ? '✓ Saved' : 'Save Defaults'}
      </button>
    </div>
  );
}

// ── 3D Model Library - upload/storage step for a future 3D-rendered Battle Grid (see BACKLOG.md for
// the scoping notes). Deliberately mirrors DoodadLibraryPanel's shape exactly (same add/list/remove
// pattern, same games.settings persistence approach) since the two will likely serve parallel roles
// once there's a 3D renderer - a "tile" entry here is the 3D equivalent of a Tile Default image, a
// "doodad" entry is the 3D equivalent of a Doodad Library entry. Upload/storage only for now, same
// as Interface Art below - nothing reads model_library_3d to render anything yet, that's the actual
// Three.js integration work, a separate, much bigger project. .glb only (see uploadModel in
// lib/supabase.js) - the single-file embedded glTF form, not the multi-file .gltf+.bin+textures form.
function Model3DLibraryPanel() {
  const [models, setModels] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: '', category: 'tile', modelUrl: '' });

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setModels(data?.settings?.model_library_3d || []);
      setLoaded(true);
    });
  }, []);

  const persist = async (next) => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), model_library_3d: next } })
      .eq('id', GAME_ID);
    if (!error) { setModels(next); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save model_library_3d failed:', error.message);
  };

  const addModel = () => {
    if (!draft.name.trim() || !draft.modelUrl.trim()) return;
    const entry = { id: `model3d_${Date.now()}`, name: draft.name.trim(), category: draft.category, modelUrl: draft.modelUrl.trim() };
    persist([...models, entry]);
    setDraft({ name: '', category: 'tile', modelUrl: '' });
    setShowAdd(false);
  };

  const removeModel = (id) => persist(models.filter(m => m.id !== id));

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>3D Model Library</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        Upload/storage step for a possible future 3D-rendered Battle Grid - <strong>not wired into any
        rendering yet</strong>. .glb files only (embedded glTF - textures/materials packed into one
        file). Get free/cheap .glb assets from sites like Kenney.nl, Quaternius, or Sketchfab.
      </p>

      {models.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>None yet.</div>}
      {models.map(m => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 4, marginBottom: 3, background: 'rgba(107,78,40,.08)' }}>
          <i className={`ti ${m.category === 'doodad' ? 'ti-tree' : 'ti-square'}`} style={{ fontSize: 16, color: 'var(--gold-dim)' }} />
          <span style={{ fontSize: 13, flex: 1 }}>{m.name}</span>
          <span style={{ fontSize: 11, color: 'var(--gold-dim)' }}>{m.category === 'doodad' ? 'Doodad' : 'Tile'}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.modelUrl}>{m.modelUrl}</span>
          <button onClick={() => removeModel(m.id)} title="Remove" style={{ fontSize: 11, padding: '2px 6px', color: 'var(--red)' }}>✕</button>
        </div>
      ))}

      {showAdd ? (
        <div style={{ marginTop: 8, padding: '.6rem', background: 'var(--bg-panel)', borderRadius: 5, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input type="text" placeholder="Name (e.g. Stone Wall, Oak Tree)" value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} style={{ fontSize: 12 }} />
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Category
            <select value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))} style={{ fontSize: 12, marginLeft: 4 }}>
              <option value="tile">Tile / Floor</option>
              <option value="doodad">Doodad / Prop</option>
            </select>
          </label>
          <ModelUrlField value={draft.modelUrl} onChange={v => setDraft(p => ({ ...p, modelUrl: v }))}
            placeholder="Model URL (.glb)" pathPrefix="models3d" inputStyle={{ fontSize: 12 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-p" disabled={!draft.name.trim() || !draft.modelUrl.trim()} onClick={addModel}>Add</button>
            <button className="btn btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-sm" onClick={() => setShowAdd(true)}>+ New Model</button>
      )}
      {saved && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 6 }}>✓ Saved</div>}
    </div>
  );
}

// ── Icon Library - custom icons for Skills, Items, Factions, and Stances, one at a time via the same
// drag-drop-to-Supabase upload every other image field in the app uses (ImageUrlField/sandy-images) -
// replaced an earlier bulk-match-against-a-pre-uploaded-pack approach that Charles decided against in
// favor of this simpler, more direct workflow. Saved as one blob, `games.settings.icon_library =
// { skills: {name: url}, items: {name: url}, factions: {name: url}, stances: {name: url} }`. Upload/
// storage only for now - not yet wired into character sheets, faction badges, or encounter displays.
function IconLibraryPanel() {
  const [library, setLibrary] = useState({ skills: {}, items: {}, factions: {}, stances: {} });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subtab, setSubtab] = useState('skills');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setLibrary({ skills: {}, items: {}, factions: {}, stances: {}, ...(data?.settings?.icon_library || {}) });
      setLoaded(true);
    });
  }, []);

  // library changes fast (typing, or an upload completing) and commitIcon below needs to always see
  // the LATEST value, not whatever `library` was when the ImageUrlField's onCommit callback happened
  // to be captured - a plain closure over the `library` state variable goes stale the moment a newer
  // render happens before the commit actually fires (which is exactly what an upload does: onChange
  // updates state, then onCommit fires a tick later), so it was persisting the old data and silently
  // reverting the just-uploaded icon a moment after it appeared. A ref sidesteps that - always current,
  // no render/closure timing to get wrong.
  const libraryRef = React.useRef(library);
  const persist = async (next) => {
    libraryRef.current = next;
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), icon_library: next } })
      .eq('id', GAME_ID);
    if (!error) { setLibrary(next); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save icon_library failed:', error.message);
  };

  // Local-only update (typing in the URL field, or an in-flight upload) - not saved to Supabase until
  // the field commits (blur, or right after a successful upload - see ImageUrlField's onCommit).
  const setDraftIcon = (category, name, url) => {
    setLibrary(prev => {
      const next = { ...prev, [category]: { ...prev[category], [name]: url } };
      libraryRef.current = next;
      return next;
    });
  };
  const commitIcon = () => persist(libraryRef.current);
  const clearIcon = (category, name) => {
    const cat = { ...library[category] };
    delete cat[name];
    persist({ ...library, [category]: cat });
  };

  const ITEM_NAMES = React.useMemo(() => {
    return [...new Set([...GEAR_LIST_NAMES, ...WEAPONS_LIST.map(w => w.name), ...SHIELDS.map(s => s.name)])].sort();
  }, []);
  const CATALOG = { skills: ALL_SKILLS, items: ITEM_NAMES, factions: Object.keys(FACTION_ICONS), stances: STANCES };
  const SUBTABS = [
    { key: 'skills', label: 'Skills' },
    { key: 'items', label: 'Items' },
    { key: 'factions', label: 'Factions' },
    { key: 'stances', label: 'Stances' },
  ];

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  const visibleNames = CATALOG[subtab].filter(n => !filter.trim() || n.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Icon Library</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        Custom icons for skills, items/weapons, factions, and stances - upload one at a time below.
        Unassigned entries keep whatever fallback they currently use (a generic icon, or none) until you
        set one. <strong>Upload/storage only for now</strong> - not yet wired into character sheets,
        faction badges, or encounter displays.
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {SUBTABS.map(t => (
          <button key={t.key} className={`layer-btn ${subtab === t.key ? 'active' : ''}`} onClick={() => setSubtab(t.key)}>
            {t.label} ({Object.keys(library[t.key] || {}).length}/{CATALOG[t.key].length})
          </button>
        ))}
      </div>

      <input type="text" placeholder={`Search ${subtab}...`} value={filter} onChange={e => setFilter(e.target.value)}
        style={{ fontSize: 12, marginBottom: 8, width: '100%' }} />

      <div style={{ maxHeight: 640, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 6, alignContent: 'start' }}>
        {visibleNames.map(name => {
          const url = library[subtab]?.[name] || '';
          return (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 4, marginBottom: 3, background: 'rgba(107,78,40,.08)' }}>
              <input type="checkbox" checked={!!url} readOnly title={url ? 'Uploaded' : 'Not uploaded yet'} style={{ margin: 0, flexShrink: 0, cursor: 'default' }} />
              {url
                ? <img src={url} alt="" style={{ width: 24, height: 24, objectFit: 'contain', background: 'var(--bg-panel)', borderRadius: 3, flexShrink: 0 }} onError={e => { e.target.style.visibility = 'hidden'; }} />
                : <div style={{ width: 24, height: 24, borderRadius: 3, border: '1px dashed var(--border)', flexShrink: 0 }} />}
              <span style={{ fontSize: 12, width: 140, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>{name}</span>
              <ImageUrlField value={url} onChange={v => setDraftIcon(subtab, name, v)} onCommit={commitIcon}
                placeholder="Icon URL" pathPrefix="icons" inputStyle={{ fontSize: 11 }} />
              {url && <button onClick={() => clearIcon(subtab, name)} title="Clear" style={{ fontSize: 11, padding: '2px 6px', color: 'var(--red)', flexShrink: 0 }}>✕</button>}
            </div>
          );
        })}
      </div>

      {saved && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 6 }}>✓ Saved</div>}
    </div>
  );
}

