import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';
import { TILE_TYPES, ATLAS_COLUMNS, ATLAS_SIZE, ATLAS_TILE } from './EncounterTab';
import { NPCPicker } from './EncounterBuilder';
import { generateSewersGrid } from '../lib/utils';

// Same 7 environment themes used elsewhere in the app for setting art (SettingsTab's SETTINGS list),
// mapped to atlas rows 0-6 per the master_atlas design doc. Rows 7-11 are reserved for future sets.
const THEMES = ['Streets', 'Sewers', 'Desert', 'Palace', 'Indoors', "Khan's Warcamp", 'Barracks Lounge'];
const ROW_LABELS = [...THEMES, ...Array.from({ length: 12 - THEMES.length }, (_, i) => `Reserved ${THEMES.length + i}`)];
const GRID_SIZES = [12, 24, 36, 48];

// GMs get full use of the creator/saver. The only dev-only difference: a checkbox to mark a saved
// grid as a locked default, which GMs can load and use but not delete.
export default function GridCreatorTab({ isDeveloper }) {
  const [size, setSize] = useState(24);
  const [bgUrl, setBgUrl] = useState('');
  const [themeRow, setThemeRow] = useState(0);
  const [tiles, setTiles] = useState({}); // "x,y" -> { type, radius? }
  const [brush, setBrush] = useState(null);
  const [brushRadius, setBrushRadius] = useState(3);
  const [isPainting, setIsPainting] = useState(false);
  const [paintBuffer, setPaintBuffer] = useState({});
  const [savedGrids, setSavedGrids] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeGridId, setActiveGridId] = useState(null);
  // The name a grid had when it was loaded (or null for a brand-new grid) — if the user changes
  // saveName away from this before saving, that's a rename, which should "Save As" a new entry
  // rather than silently overwriting the original under a different name.
  const [loadedSaveName, setLoadedSaveName] = useState(null);
  // Environment type is a naming/sorting label, independent of which atlas row (Tileset) renders it —
  // a grid can be tagged "Rooftop" for sorting purposes while still using an existing atlas row's art.
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [envType, setEnvType] = useState(THEMES[0]);
  const [envIsCustom, setEnvIsCustom] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveLocked, setSaveLocked] = useState(false); // dev-only: "save as default" — GMs can't delete it
  // Preload NPCs: built-in library NPCs/creatures only (via the shared NPCPicker), positioned on
  // specific tiles, saved alongside the grid so loading it in EncounterBuilder can seed an encounter
  // with enemies already placed. Deliberately not live game-state NPCs — keeps a saved grid a fully
  // self-contained, shareable file.
  const [prebuiltNpcs, setPrebuiltNpcs] = useState([]); // [{ ...npcData, x, y }] — x/y null until placed
  const [placingNpcIdx, setPlacingNpcIdx] = useState(null); // index into prebuiltNpcs currently awaiting a grid click
  const [atlasUrl, setAtlasUrl] = useState(''); // Master Atlas (Tileset tab) — preview here so the painter shows real tileset art, not just labeled colors
  const [tileDefaultImages, setTileDefaultImages] = useState({}); // per-type fallback images (Tileset tab) — same fallback tier the live Battle Grid already uses

  // Doodads: dev-defined multi-square props (Settings → Tileset → Doodad Library), placed here.
  // Placing one auto-assigns its tileType to every cell in its footprint (a plain width×height
  // rectangle for now — see DoodadLibraryPanel comment for the planned irregular-footprint extension),
  // then the doodad's own image renders on top of that footprint.
  const [doodadLibrary, setDoodadLibrary] = useState([]); // [{id, name, width, height, imageUrl, tileType}]
  const [placedDoodads, setPlacedDoodads] = useState([]); // [{id, defId, x, y}] — x/y null until placed
  const [placingDoodadIdx, setPlacingDoodadIdx] = useState(null);
  const [doodadDimFilter, setDoodadDimFilter] = useState(''); // "2x1" etc. — '' means "all"

  // Zoom/pan — same convention as the live Battle Grid: 1.0 = fully fit, lower = zoomed in.
  // Needed once grids got up to 48×48 — the old fixed "shrink the whole grid into 480px" view made
  // precise painting on large grids impractical.
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panDrag, setPanDrag] = useState(null); // { startClientX, startClientY, startOffset }
  const svgRef = useRef(null);
  useEffect(() => { setPanOffset({ x: 0, y: 0 }); }, [zoom >= 1.0]);

  const CELL = 20;
  const W = size * CELL;
  const displayTiles = { ...tiles, ...paintBuffer };

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      const grids = data?.settings?.saved_battle_grids || [];
      setSavedGrids([...grids].sort((a, b) => (a.label || '').localeCompare(b.label || ''))); // label starts with environment type
      setAtlasUrl(data?.settings?.master_atlas_url || '');
      setTileDefaultImages(data?.settings?.tile_default_images || {});
      setDoodadLibrary(data?.settings?.doodad_library || []);
      setLoaded(true);
    });
  }, []);

  const paintCell = (x, y) => {
    const key = `${x},${y}`;
    setPaintBuffer(buf => ({ ...buf, [key]: brush === '__erase__' ? null : (brush === 'light' ? { type: 'light', radius: brushRadius } : { type: brush }) }));
  };
  const commitPaint = () => {
    if (Object.keys(paintBuffer).length) {
      setTiles(prev => {
        const merged = { ...prev };
        Object.entries(paintBuffer).forEach(([k, v]) => { if (v === null) delete merged[k]; else merged[k] = v; });
        return merged;
      });
    }
    setPaintBuffer({});
    setIsPainting(false);
  };

  const cellFromEvent = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Read the actual current viewBox rather than assuming it's always "0 0 W W" — when zoomed in
    // (viewBox smaller than the full grid), screen-to-cell math must offset/scale by the viewBox's
    // own origin and size, matching the same fix already applied on the live Battle Grid.
    const vb = (svgRef.current?.getAttribute('viewBox') || `0 0 ${W} ${W}`).split(' ').map(Number);
    const [vx, vy, vw, vh] = vb;
    const svgX = ((e.clientX - rect.left) / rect.width) * vw + vx;
    const svgY = ((e.clientY - rect.top) / rect.height) * vh + vy;
    const x = Math.floor(svgX / CELL);
    const y = Math.floor(svgY / CELL);
    if (x < 0 || x >= size || y < 0 || y >= size) return null;
    return { x, y };
  };

  // Stamps a doodad's tileType across its whole footprint (clamped to the grid bounds) directly into
  // the committed tiles state — this is the "auto-convert the terrain" behavior, a real state write,
  // not just a visual overlay pretending the tiles changed.
  const stampFootprint = (def, x, y, clear = false) => {
    setTiles(prev => {
      const next = { ...prev };
      for (let dx = 0; dx < def.width; dx++) {
        for (let dy = 0; dy < def.height; dy++) {
          const cx = x + dx, cy = y + dy;
          if (cx < 0 || cx >= size || cy < 0 || cy >= size) continue;
          const key = `${cx},${cy}`;
          if (clear) delete next[key];
          else next[key] = { type: def.tileType };
        }
      }
      return next;
    });
  };

  const confirmSaveGrid = async () => {
    if (!saveName.trim() || !envType.trim()) return;
    const label = `${envType} - ${saveName} - ${size}x${size}`;
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const existing = current?.settings?.saved_battle_grids || [];
    // Renaming (saveName changed from what this grid was loaded with) creates a new entry instead of
    // overwriting the original — otherwise "Save Changes" after a rename would silently replace the
    // old saved grid under its new name, losing it rather than acting like the "Save As" it should be.
    const isRename = activeGridId && loadedSaveName !== null && saveName.trim() !== loadedSaveName;
    const targetId = isRename ? null : activeGridId;
    // Non-devs can't see or change the lock checkbox — preserve whatever lock state an existing entry already had
    const priorLocked = targetId ? (existing.find(g => g.id === targetId)?.locked || false) : false;
    const locked = isDeveloper ? saveLocked : priorLocked;
    const entry = { id: targetId || `grid_${Date.now()}`, label, envType, name: saveName, size, themeRow, bgUrl, tiles, prebuiltNpcs, doodads: placedDoodads, locked, createdAt: Date.now() };
    const next = targetId ? existing.map(g => g.id === targetId ? entry : g) : [...existing, entry];
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), saved_battle_grids: next } })
      .eq('id', GAME_ID);
    if (!error) {
      setSavedGrids([...next].sort((a, b) => (a.label || '').localeCompare(b.label || '')));
      setActiveGridId(entry.id);
      setLoadedSaveName(entry.name);
      setShowSaveForm(false);
    } else console.error('save battle grid failed:', error.message);
  };

  const loadGrid = (g) => {
    setSize(g.size); setBgUrl(g.bgUrl || ''); setThemeRow(g.themeRow || 0);
    setTiles(g.tiles || {}); setPaintBuffer({}); setActiveGridId(g.id);
    setLoadedSaveName(g.name || '');
    setEnvType(g.envType || ROW_LABELS[g.themeRow || 0]);
    setEnvIsCustom(!THEMES.includes(g.envType));
    setSaveName(g.name || '');
    setSaveLocked(!!g.locked);
    setPrebuiltNpcs(g.prebuiltNpcs || []);
    setPlacingNpcIdx(null);
    setPlacedDoodads(g.doodads || []);
    setPlacingDoodadIdx(null);
  };

  const deleteGrid = async (id) => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const next = (current?.settings?.saved_battle_grids || []).filter(g => g.id !== id);
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), saved_battle_grids: next } })
      .eq('id', GAME_ID);
    if (!error) { setSavedGrids(next); if (activeGridId === id) setActiveGridId(null); }
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  const doodadDims = [...new Set(doodadLibrary.map(d => `${d.width}x${d.height}`))].sort();
  const visibleDoodads = doodadDimFilter ? doodadLibrary.filter(d => `${d.width}x${d.height}` === doodadDimFilter) : doodadLibrary;

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ flex: '1 1 420px', minWidth: 320 }}>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.75rem', alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Size{' '}
            <select value={size} onChange={e => setSize(Number(e.target.value))} style={{ fontSize: 12 }}>
              {GRID_SIZES.map(s => <option key={s} value={s}>{s}×{s}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Tileset{' '}
            <select value={themeRow} onChange={e => setThemeRow(Number(e.target.value))} style={{ fontSize: 12 }}>
              {ROW_LABELS.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
          </label>
        </div>
        <input type="text" placeholder="Background image URL (optional)" value={bgUrl}
          onChange={e => setBgUrl(e.target.value)} style={{ fontSize: 12, width: '100%', marginBottom: '.5rem' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 4, background: 'rgba(10,8,4,.6)', border: '1px solid rgba(107,78,40,.3)', borderRadius: 4, marginBottom: 6 }}>
          {TILE_TYPES.map(t => (
            <button key={t.key} onClick={() => setBrush(b => b === t.key ? null : t.key)} title={t.label}
              style={{ fontSize: 10, padding: '3px 7px', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                background: brush === t.key ? t.color : 'var(--bg-panel)',
                border: `1px solid ${brush === t.key ? t.color : 'var(--border)'}`,
                color: brush === t.key ? '#fff' : 'var(--text-muted)' }}>
              {t.short}
            </button>
          ))}
          <button onClick={() => setBrush(b => b === '__erase__' ? null : '__erase__')} title="Erase tile"
            style={{ fontSize: 10, padding: '3px 7px', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
              background: brush === '__erase__' ? '#c84030' : 'var(--bg-panel)',
              border: `1px solid ${brush === '__erase__' ? '#c84030' : 'var(--border)'}`,
              color: brush === '__erase__' ? '#fff' : 'var(--text-muted)' }}>
            ERASE
          </button>
          {brush === 'light' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Radius</span>
              <button onClick={() => setBrushRadius(r => Math.max(1, r - 1))} style={{ fontSize: 12, padding: '0 6px' }}>−</button>
              <span style={{ fontSize: 11, color: 'var(--gold)', minWidth: 12, textAlign: 'center' }}>{brushRadius}</span>
              <button onClick={() => setBrushRadius(r => Math.min(size, r + 1))} style={{ fontSize: 12, padding: '0 6px' }}>+</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 6, alignItems: 'center' }}>
          <button onClick={() => setZoom(z => Math.min(1.0, z + 0.25))} title="Zoom out"
            style={{ background: 'rgba(107,78,40,.3)', border: '1px solid rgba(107,78,40,.5)', color: 'var(--gold-dim)', borderRadius: 3, cursor: 'pointer', padding: '1px 7px', fontSize: 13, lineHeight: 1 }}>−</button>
          <button onClick={() => setZoom(1.0)} title="Reset zoom"
            style={{ background: 'rgba(107,78,40,.2)', border: '1px solid rgba(107,78,40,.4)', color: 'var(--text-muted)', borderRadius: 3, cursor: 'pointer', padding: '1px 6px', fontSize: 10, lineHeight: 1 }}>{Math.round((1 / zoom) * 100)}%</button>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} title="Zoom in"
            style={{ background: 'rgba(107,78,40,.3)', border: '1px solid rgba(107,78,40,.5)', color: 'var(--gold-dim)', borderRadius: 3, cursor: 'pointer', padding: '1px 7px', fontSize: 13, lineHeight: 1 }}>+</button>
          {zoom < 1.0 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Drag the canvas to pan</span>}
        </div>

        <svg ref={svgRef}
          viewBox={(() => {
            if (zoom >= 1.0) return `0 0 ${W} ${W}`;
            const cx = W / 2 + panOffset.x;
            const cy = W / 2 + panOffset.y;
            const vw = W * zoom;
            const vh = W * zoom;
            const vx = Math.max(0, Math.min(W - vw, cx - vw / 2));
            const vy = Math.max(0, Math.min(W - vh, cy - vh / 2));
            return `${vx} ${vy} ${vw} ${vh}`;
          })()}
          width="100%" style={{ maxWidth: 480, background: 'rgba(10,8,4,.8)', border: '1px solid rgba(107,78,40,.4)', borderRadius: 4, display: 'block', cursor: panDrag ? 'grabbing' : (placingNpcIdx !== null || placingDoodadIdx !== null || brush) ? 'crosshair' : zoom < 1.0 ? 'grab' : 'default', userSelect: 'none' }}
          onMouseDown={e => {
            const c = cellFromEvent(e);
            if (!c) {
              // Missed the grid entirely (or nothing to place/paint) — if zoomed in, treat this as
              // the start of a pan drag instead of doing nothing.
              if (zoom < 1.0 && placingNpcIdx === null && placingDoodadIdx === null && !brush) {
                setPanDrag({ startClientX: e.clientX, startClientY: e.clientY, startOffset: panOffset });
              }
              return;
            }
            if (placingDoodadIdx !== null) {
              const inst = placedDoodads[placingDoodadIdx];
              const def = doodadLibrary.find(d => d.id === inst?.defId);
              if (def) {
                // Clear the old footprint first if this doodad was already placed (i.e. being moved)
                if (inst.x !== null && inst.x !== undefined) stampFootprint(def, inst.x, inst.y, true);
                stampFootprint(def, c.x, c.y, false);
                setPlacedDoodads(prev => prev.map((p, i) => i === placingDoodadIdx ? { ...p, x: c.x, y: c.y } : p));
              }
              setPlacingDoodadIdx(null);
              return;
            }
            if (placingNpcIdx !== null) {
              setPrebuiltNpcs(prev => prev.map((n, i) => i === placingNpcIdx ? { ...n, x: c.x, y: c.y } : n));
              setPlacingNpcIdx(null);
              return;
            }
            if (!brush) {
              // No brush selected — if zoomed in, dragging the canvas pans the view instead.
              if (zoom < 1.0) setPanDrag({ startClientX: e.clientX, startClientY: e.clientY, startOffset: panOffset });
              return;
            }
            setIsPainting(true); paintCell(c.x, c.y);
          }}
          onMouseMove={e => {
            if (panDrag) {
              const deltaXpx = e.clientX - panDrag.startClientX;
              const deltaYpx = e.clientY - panDrag.startClientY;
              const rect = e.currentTarget.getBoundingClientRect();
              // Screen px → viewBox units, using the actual rendered size (not W) since this SVG is
              // scaled to fit its container rather than rendered 1:1.
              const scaleX = (W * zoom) / rect.width;
              const scaleY = (W * zoom) / rect.height;
              setPanOffset({ x: panDrag.startOffset.x - deltaXpx * scaleX, y: panDrag.startOffset.y - deltaYpx * scaleY });
              return;
            }
            if (!isPainting) return;
            const c = cellFromEvent(e);
            if (c) paintCell(c.x, c.y);
          }}
          onMouseUp={() => { if (panDrag) { setPanDrag(null); return; } commitPaint(); }}
          onMouseLeave={() => { if (isPainting) commitPaint(); if (panDrag) setPanDrag(null); }}>
          {bgUrl && <image href={bgUrl} x={0} y={0} width={W} height={W} preserveAspectRatio="xMidYMid slice" opacity="0.25" />}
          {Array.from({ length: size + 1 }, (_, i) => (
            <g key={i}>
              <line x1={i * CELL} y1={0} x2={i * CELL} y2={W} stroke="rgba(107,78,40,.25)" strokeWidth="0.5" />
              <line x1={0} y1={i * CELL} x2={W} y2={i * CELL} stroke="rgba(107,78,40,.25)" strokeWidth="0.5" />
            </g>
          ))}
          {atlasUrl && (
            <defs>
              {[...new Set(Object.values(displayTiles).filter(Boolean).map(t => t.type))]
                .filter(type => ATLAS_COLUMNS[type] !== undefined)
                .map(type => {
                  const col = ATLAS_COLUMNS[type];
                  const scale = CELL / ATLAS_TILE;
                  return (
                    <pattern key={`atlas-${type}`} id={`gc-atlas-pat-${type}`} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
                      <image href={atlasUrl}
                        x={-col * ATLAS_TILE * scale} y={-themeRow * ATLAS_TILE * scale}
                        width={ATLAS_SIZE * scale} height={ATLAS_SIZE * scale} />
                    </pattern>
                  );
                })}
            </defs>
          )}
          <defs>
            <pattern id="gc-confined-stripes" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#4a4a4a" />
              <rect width="4" height="8" fill="#141414" />
            </pattern>
          </defs>
          {Object.entries(displayTiles).map(([key, t]) => {
            if (!t) return null;
            const def = TILE_TYPES.find(tt => tt.key === t.type);
            if (!def) return null;
            const [tx, ty] = key.split(',').map(Number);
            const hasAtlas = atlasUrl && ATLAS_COLUMNS[t.type] !== undefined;
            const defaultImg = !hasAtlas && tileDefaultImages[t.type];
            if (hasAtlas) {
              return (
                <rect key={`tile-${key}`} x={tx * CELL} y={ty * CELL} width={CELL} height={CELL}
                  fill={`url(#gc-atlas-pat-${t.type})`} style={{ pointerEvents: 'none' }} />
              );
            }
            if (defaultImg) {
              return (
                <image key={`tile-${key}`} href={defaultImg} x={tx * CELL} y={ty * CELL} width={CELL} height={CELL}
                  preserveAspectRatio="xMidYMid slice" style={{ pointerEvents: 'none' }} />
              );
            }
            return (
              <g key={`tile-${key}`} style={{ pointerEvents: 'none' }}>
                <rect x={tx * CELL + 1} y={ty * CELL + 1} width={CELL - 2} height={CELL - 2}
                  fill={t.type === 'confined' ? 'url(#gc-confined-stripes)' : def.color} opacity="0.5" rx="1" />
                {CELL >= 14 && <text x={tx * CELL + CELL / 2} y={ty * CELL + CELL / 2 + 3} textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff" fontFamily="sans-serif">{def.short}</text>}
              </g>
            );
          })}
          {prebuiltNpcs.map((n, i) => {
            if (n.x === null || n.x === undefined || n.y === null || n.y === undefined) return null;
            const cx = n.x * CELL + CELL / 2;
            const cy = n.y * CELL + CELL / 2;
            const initial = (n.name || '?').trim().charAt(0).toUpperCase();
            return (
              <g key={`npc-${i}`} style={{ pointerEvents: 'none' }}>
                <circle cx={cx} cy={cy} r={CELL * 0.4} fill="#c84030" opacity={placingNpcIdx === i ? 0.5 : 0.85} stroke="#fff" strokeWidth="1" />
                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="sans-serif">{initial}</text>
              </g>
            );
          })}
          {/* Doodads render on top of their (already auto-converted) footprint tiles */}
          {placedDoodads.map((inst, i) => {
            if (inst.x === null || inst.x === undefined || inst.y === null || inst.y === undefined) return null;
            const def = doodadLibrary.find(d => d.id === inst.defId);
            if (!def) return null;
            return (
              <image key={`doodad-${inst.id || i}`} href={def.imageUrl}
                x={inst.x * CELL} y={inst.y * CELL} width={def.width * CELL} height={def.height * CELL}
                opacity={placingDoodadIdx === i ? 0.5 : 1}
                preserveAspectRatio="xMidYMax meet" style={{ pointerEvents: 'none' }} />
            );
          })}
        </svg>
        {placingNpcIdx !== null && (
          <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>
            Click the grid to place: <strong>{prebuiltNpcs[placingNpcIdx]?.name}</strong>
            <button className="btn btn-sm" style={{ fontSize: 11, marginLeft: 8, padding: '1px 6px' }} onClick={() => setPlacingNpcIdx(null)}>Cancel</button>
          </div>
        )}
        {placingDoodadIdx !== null && (
          <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>
            Click the grid to place: <strong>{doodadLibrary.find(d => d.id === placedDoodads[placingDoodadIdx]?.defId)?.name}</strong>
            <button className="btn btn-sm" style={{ fontSize: 11, marginLeft: 8, padding: '1px 6px' }} onClick={() => setPlacingDoodadIdx(null)}>Cancel</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: '.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-p" onClick={() => setShowSaveForm(v => !v)}>{activeGridId ? 'Save Changes…' : 'Save As…'}</button>
          <button className="btn" onClick={() => { setActiveGridId(null); setLoadedSaveName(null); setTiles({}); setPaintBuffer({}); setBgUrl(''); setSaveName(''); setSaveLocked(false); setShowSaveForm(false); setPrebuiltNpcs([]); setPlacingNpcIdx(null); setPlacedDoodads([]); setPlacingDoodadIdx(null); }}>New Grid</button>
          <button className="btn" style={{ borderColor: 'rgba(60,140,180,.5)', color: '#7ab8d0' }}
            title="Procedurally generates a connected tunnel network — narrow confined corridors, a water channel, occasional junction chambers. Replaces the current tiles."
            onClick={() => {
              setTiles(generateSewersGrid(size));
              setPaintBuffer({});
              setPrebuiltNpcs([]);
              setPlacingNpcIdx(null);
              setPlacedDoodads([]);
              setPlacingDoodadIdx(null);
              setThemeRow(THEMES.indexOf('Sewers'));
              setEnvType('Sewers');
              setEnvIsCustom(false);
            }}>
            <i className="ti ti-refresh" style={{ marginRight: 4 }} />Randomize (Sewers)
          </button>
        </div>

        {showSaveForm && (
          <div className="card" style={{ marginTop: '.75rem', padding: '.75rem' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>Environment Type</div>
            <div style={{ marginBottom: '.5rem' }}>
              {THEMES.map(t => (
                <button key={t} className={`opt-btn ${envType === t && !envIsCustom ? 'sel' : ''}`}
                  onClick={() => { setEnvType(t); setEnvIsCustom(false); }}>{t}</button>
              ))}
              <button className={`opt-btn ${envIsCustom ? 'sel' : ''}`} onClick={() => { setEnvType(''); setEnvIsCustom(true); }}>Custom...</button>
            </div>
            {envIsCustom && (
              <input type="text" value={envType} onChange={e => setEnvType(e.target.value)}
                placeholder="Type an environment name..." autoFocus style={{ width: '100%', marginBottom: '.5rem', fontSize: 12 }} />
            )}
            <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
              placeholder="Grid name..." style={{ width: '100%', marginBottom: '.5rem', fontSize: 12 }} />
            {isDeveloper && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gold-dim)', marginBottom: '.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={saveLocked} onChange={e => setSaveLocked(e.target.checked)} />
                Save as default (GMs can't delete)
              </label>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              Will save as: <span style={{ color: 'var(--gold-dim)' }}>{envType || '?'} - {saveName || '?'} - {size}x{size}</span>
            </div>
            {activeGridId && loadedSaveName !== null && saveName.trim() !== loadedSaveName && (
              <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: '.5rem' }}>
                <i className="ti ti-copy" style={{ marginRight: 4 }} />
                New name — this will save as a new grid, not overwrite "{loadedSaveName}".
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-p" onClick={confirmSaveGrid} disabled={!saveName.trim() || !envType.trim()}>Save</button>
              <button className="btn" onClick={() => setShowSaveForm(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 260px', minWidth: 240 }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Saved Battle Grids</div>
          {savedGrids.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None saved yet.</div>}
          {savedGrids.map(g => {
            const canDelete = isDeveloper || !g.locked;
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, marginBottom: 3,
                background: activeGridId === g.id ? 'rgba(200,150,42,.15)' : 'rgba(107,78,40,.08)' }}>
                {g.locked && <i className="ti ti-lock" title="Default grid — protected from deletion" style={{ fontSize: 11, color: 'var(--gold-dim)' }} />}
                <span style={{ fontSize: 12, flex: 1, cursor: 'pointer' }} onClick={() => loadGrid(g)}>{g.label}</span>
                <button onClick={() => loadGrid(g)} title="Load" style={{ fontSize: 11, padding: '2px 6px' }}>Load</button>
                {canDelete && <button onClick={() => deleteGrid(g.id)} title="Delete" style={{ fontSize: 11, padding: '2px 6px', color: 'var(--red)' }}>✕</button>}
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
            Preload NPCs <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>(built-in library only)</span>
          </div>
          <NPCPicker
            label="Add"
            onAdd={npc => {
              setPrebuiltNpcs(prev => {
                const next = [...prev, { ...npc, x: null, y: null }];
                setPlacingNpcIdx(next.length - 1);
                return next;
              });
            }}
          />
          {prebuiltNpcs.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6 }}>None yet — add one above, then click the grid to place it.</div>}
          {prebuiltNpcs.map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, marginTop: 4,
              background: placingNpcIdx === i ? 'rgba(200,150,42,.15)' : 'rgba(107,78,40,.08)' }}>
              <span style={{ fontSize: 12, flex: 1 }}>{n.name}</span>
              <span style={{ fontSize: 11, color: (n.x !== null && n.x !== undefined) ? 'var(--green)' : 'var(--text-muted)' }}>
                {(n.x !== null && n.x !== undefined) ? `(${n.x},${n.y})` : 'unplaced'}
              </span>
              <button onClick={() => setPlacingNpcIdx(i)} title="Place on grid" style={{ fontSize: 11, padding: '2px 6px' }}>
                {(n.x !== null && n.x !== undefined) ? 'Move' : 'Place'}
              </button>
              <button onClick={() => { setPrebuiltNpcs(prev => prev.filter((_, j) => j !== i)); if (placingNpcIdx === i) setPlacingNpcIdx(null); }}
                title="Remove" style={{ fontSize: 11, padding: '2px 6px', color: 'var(--red)' }}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
            Doodads <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>(defined in Settings → Tileset, dev-only)</span>
          </div>
          {doodadLibrary.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None defined yet.</div>
          ) : (
            <>
              <select value={doodadDimFilter} onChange={e => setDoodadDimFilter(e.target.value)} style={{ fontSize: 12, width: '100%', marginBottom: 6 }}>
                <option value="">All dimensions</option>
                {doodadDims.map(dim => <option key={dim} value={dim}>{dim}</option>)}
              </select>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                {visibleDoodads.map(def => (
                  <button key={def.id} onClick={() => {
                    setPlacedDoodads(prev => {
                      const next = [...prev, { id: `doodadinst_${Date.now()}_${Math.random()}`, defId: def.id, x: null, y: null }];
                      setPlacingDoodadIdx(next.length - 1);
                      return next;
                    });
                  }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', background: 'rgba(107,78,40,.08)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', textAlign: 'left' }}>
                    <img src={def.imageUrl} alt={def.name} style={{ width: 24, height: 24, objectFit: 'contain', background: 'var(--bg-panel)', borderRadius: 3 }}
                      onError={e => { e.target.style.visibility = 'hidden'; }} />
                    <span style={{ fontSize: 12, flex: 1, color: 'var(--text-primary)' }}>{def.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{def.width}×{def.height}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {placedDoodads.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {placedDoodads.map((inst, i) => {
                const def = doodadLibrary.find(d => d.id === inst.defId);
                const isPlaced = inst.x !== null && inst.x !== undefined;
                return (
                  <div key={inst.id || i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, marginTop: 4,
                    background: placingDoodadIdx === i ? 'rgba(200,150,42,.15)' : 'rgba(107,78,40,.08)' }}>
                    <span style={{ fontSize: 12, flex: 1 }}>{def?.name || '(unknown)'}</span>
                    <span style={{ fontSize: 11, color: isPlaced ? 'var(--green)' : 'var(--text-muted)' }}>
                      {isPlaced ? `(${inst.x},${inst.y})` : 'unplaced'}
                    </span>
                    <button onClick={() => setPlacingDoodadIdx(i)} title="Place on grid" style={{ fontSize: 11, padding: '2px 6px' }}>
                      {isPlaced ? 'Move' : 'Place'}
                    </button>
                    <button onClick={() => {
                      if (isPlaced && def) stampFootprint(def, inst.x, inst.y, true);
                      setPlacedDoodads(prev => prev.filter((_, j) => j !== i));
                      if (placingDoodadIdx === i) setPlacingDoodadIdx(null);
                    }} title="Remove (also clears its footprint tiles)" style={{ fontSize: 11, padding: '2px 6px', color: 'var(--red)' }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
