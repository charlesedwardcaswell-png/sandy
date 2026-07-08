import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';

const PACK_FORMAT_VERSION = 1;

// Same field list SettingsTab itself persists together as "Settings" - gameplay toggles plus the
// image/media URLs also managed from that tab. Deliberately excludes anything covered by its own
// Resource Pack category already (shops_v2, saved_battle_grids, gm_inventory, doodad_library, etc.)
// and anything instance-specific that should never travel between campaigns (gm_password, campaignDay/
// Week, timeOfDay, user_themes, party_name).
const SETTINGS_KEYS = [
  'map_url', 'map_url_night', 'music_url', 'setting_urls', 'round_limits', 'jinn_art_url',
  'disable_reroll', 'water_drought_enabled', 'rings_overlay', 'portrait_scale',
  'downtime_mode', 'downtime_actions_per_char', 'arrow_tracking', 'starting_cp',
  'hide_shop_from_players', 'hide_feedback_tab', 'player_glow_default', 'disable_time_tracking',
  'everyone_helps', 'everyone_helps_plus', 'hide_pc_sheets_from_others',
];

// ── Resource Packs ──────────────────────────────────────────────────────────────
// Unlike the Campaign Backup (Danger Zone) export/import, which is a full, destructive
// snapshot of the whole game, a Resource Pack is a hand-picked SUBSET of content -
// specific quests, NPCs, pins, shops, battle grids, etc. - bundled into a portable
// JSON file that ADDS into any campaign's existing data without touching anything
// already there. Think "share a pre-made dungeon + its NPCs with another table,"
// not "restore my whole campaign."
//
// Cross-references that would otherwise dangle across campaigns (ids are campaign-
// specific and DB-generated, so an id copied verbatim into someone else's game will
// never resolve) are handled by denormalizing a NAME alongside the id at export time,
// then re-resolving that name against whatever exists in the target campaign at
// import time. See resolveShopkeeper/resolveDoodad below for the two places this
// actually matters today (shops → shopkeeper NPC, battle grids → doodad library).
export default function ResourcePackTab({ isGM }) {
  const [loading, setLoading] = useState(true);
  const [quests, setQuests] = useState([]);
  const [quickNpcs, setQuickNpcs] = useState([]);
  const [fullNpcs, setFullNpcs] = useState([]);
  const [mapPins, setMapPins] = useState([]);
  const [shops, setShops] = useState([]);
  const [battleGrids, setBattleGrids] = useState([]);
  const [gmInventory, setGmInventory] = useState([]);
  const [preppedSessions, setPreppedSessions] = useState([]);
  const [factionStandings, setFactionStandings] = useState([]);
  const [partyInventory, setPartyInventory] = useState([]);
  const [doodadLibrary, setDoodadLibrary] = useState([]);
  const [gameSettings, setGameSettings] = useState({});

  const [sel, setSel] = useState({
    quests: [], quickNpcs: [], fullNpcs: [], mapPins: [], shops: [], battleGrids: [],
    gmInventory: [], preppedSessions: [], factionStandings: [], partyInventory: [], settings: [],
  });
  const [open, setOpen] = useState({}); // which category sections are expanded
  const [packName, setPackName] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [pendingPack, setPendingPack] = useState(null);
  const fileRef = React.useRef(null);

  const fetchAll = async () => {
    setLoading(true);
    const [questsR, npcsR, charsR, pinsR, sessionsR, repsR, invR, gameR] = await Promise.all([
      supabase.from('quests').select('*').eq('game_id', GAME_ID),
      supabase.from('npcs').select('*').eq('game_id', GAME_ID),
      supabase.from('characters').select('*').eq('game_id', GAME_ID),
      supabase.from('map_pins').select('*').eq('game_id', GAME_ID),
      supabase.from('sessions').select('*').eq('game_id', GAME_ID),
      supabase.from('faction_reputation').select('*').eq('game_id', GAME_ID),
      supabase.from('group_inventory').select('*').eq('game_id', GAME_ID).maybeSingle(),
      supabase.from('games').select('settings').eq('id', GAME_ID).maybeSingle(),
    ]);
    setQuests(questsR.data || []);
    setQuickNpcs(npcsR.data || []);
    setFullNpcs((charsR.data || []).filter(c => c.is_npc));
    setMapPins(pinsR.data || []);
    setPreppedSessions((sessionsR.data || []).filter(s => !s.is_active && !s.closed_at));
    setFactionStandings(repsR.data || []);
    setPartyInventory(invR.data?.items || []);
    const settings = gameR.data?.settings || {};
    setShops(settings.shops_v2 || []);
    setBattleGrids(settings.saved_battle_grids || []);
    setGmInventory(settings.gm_inventory || []);
    setDoodadLibrary(settings.doodad_library || []);
    setGameSettings(SETTINGS_KEYS.reduce((acc, k) => { if (settings[k] !== undefined) acc[k] = settings[k]; return acc; }, {}));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSel = (cat, id) => setSel(prev => ({
    ...prev,
    [cat]: prev[cat].includes(id) ? prev[cat].filter(x => x !== id) : [...prev[cat], id],
  }));
  const totalSelected = Object.values(sel).reduce((s, arr) => s + arr.length, 0);

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExportPack = () => {
    if (totalSelected === 0) return;
    const pack = {
      format: 'sandy_resource_pack',
      version: PACK_FORMAT_VERSION,
      exported_at: new Date().toISOString(),
      pack_name: packName.trim() || 'Untitled Pack',
      categories: {
        quests: quests.filter(q => sel.quests.includes(q.id)).map(({ id, game_id, ...rest }) => rest),
        quickNpcs: quickNpcs.filter(n => sel.quickNpcs.includes(n.id)).map(({ id, game_id, ...rest }) => rest),
        // controller_id/claimed_by_name are ownership state from THIS campaign's players - meaningless
        // (or actively wrong) in a target campaign, same reasoning as single-character import.
        fullNpcs: fullNpcs.filter(c => sel.fullNpcs.includes(c.id)).map(({ id, game_id, controller_id, claimed_by_name, ...rest }) => rest),
        mapPins: mapPins.filter(p => sel.mapPins.includes(p.id)).map(({ id, game_id, ...rest }) => rest),
        shops: shops.filter(s => sel.shops.includes(s.id)).map(s => {
          const keeper = s.shopkeeper_id ? (fullNpcs.find(c => c.id === s.shopkeeper_id) || quickNpcs.find(n => n.id === s.shopkeeper_id)) : null;
          const { shopkeeper_id, ...rest } = s;
          return { ...rest, _shopkeeper_name: keeper?.name || null };
        }),
        battleGrids: battleGrids.filter(g => sel.battleGrids.includes(g.id)).map(g => {
          const { id, ...rest } = g;
          // Embed a full copy of every doodad definition this grid actually uses, keyed by name, so
          // the grid is self-contained on import even if the target campaign has no matching Doodad
          // Library entries yet - same self-contained principle the embedded prebuiltNpcs already use.
          const usedDefIds = new Set((g.doodads || []).map(d => d.defId));
          const embeddedDoodadDefs = doodadLibrary.filter(d => usedDefIds.has(d.id)).map(({ id, ...defRest }) => ({ _origId: id, ...defRest }));
          return { ...rest, _embeddedDoodadDefs: embeddedDoodadDefs };
        }),
        gmInventory: gmInventory.filter(i => sel.gmInventory.includes(i.id || i.name)),
        preppedSessions: preppedSessions.filter(s => sel.preppedSessions.includes(s.id)).map(({ id, game_id, ...rest }) => rest),
        factionStandings: factionStandings.filter(f => sel.factionStandings.includes(f.id)).map(({ id, game_id, ...rest }) => rest),
        partyInventory: partyInventory.filter(i => sel.partyInventory.includes(i.id || i.name)),
        settings: sel.settings.length > 0 ? gameSettings : {},
      },
    };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sandy-pack-${(pack.pack_name || 'untitled').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus(`✓ Exported ${totalSelected} item(s) as "${pack.pack_name}"`);
    setTimeout(() => setExportStatus(''), 5000);
  };

  // ── Import (additive - never touches or overwrites existing data) ────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const pack = JSON.parse(ev.target.result);
        if (pack?.format !== 'sandy_resource_pack' || !pack.categories) { setImportStatus('Not a valid Sandy resource pack file.'); return; }
        const settingsCount = Object.keys(pack.categories.settings || {}).length;
        const total = Object.values(pack.categories).reduce((s, arr) => s + (arr?.length || 0), 0) + settingsCount;
        setPendingPack(pack);
        const factionNote = pack.categories.factionStandings?.length
          ? ` Note: this pack includes Faction Standings, which will REPLACE your current standings entirely (one exception to the additive rule).`
          : '';
        const settingsNote = settingsCount > 0
          ? ` Note: this pack includes ${settingsCount} Setting(s), which will OVERWRITE those specific settings in your current campaign (another exception to the additive rule).`
          : '';
        setImportStatus(`"${pack.pack_name}" - ${total} item(s) ready to add. This ADDS to your current campaign; nothing existing is touched or overwritten.${factionNote}${settingsNote}`);
      } catch { setImportStatus('Could not parse file - must be a valid Sandy resource pack JSON.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    if (!pendingPack) return;
    setImportStatus('Importing...');
    try {
      const cats = pendingPack.categories;
      const log = [];

      if (cats.quests?.length) {
        const { error } = await supabase.from('quests').insert(cats.quests.map(q => ({ ...q, game_id: GAME_ID })));
        if (error) throw new Error(`Quests: ${error.message}`);
        log.push(`${cats.quests.length} quest(s)`);
      }
      if (cats.quickNpcs?.length) {
        const { error } = await supabase.from('npcs').insert(cats.quickNpcs.map(n => ({ ...n, game_id: GAME_ID })));
        if (error) throw new Error(`Quick NPCs: ${error.message}`);
        log.push(`${cats.quickNpcs.length} quick NPC(s)`);
      }
      // Full NPCs are inserted one at a time (not a batch insert) because shops below need each new
      // NPC's freshly-generated id back to resolve _shopkeeper_name against - a batch insert only
      // returns rows in the same request, which is fine, but doing it this way keeps the id-lookup
      // logic in one simple place rather than juggling a batch result array.
      const importedFullNpcs = [];
      if (cats.fullNpcs?.length) {
        for (const c of cats.fullNpcs) {
          const { data, error } = await supabase.from('characters').insert({ ...c, game_id: GAME_ID, controller_id: null, claimed_by_name: null }).select().single();
          if (error) throw new Error(`Full NPC "${c.name}": ${error.message}`);
          if (data) importedFullNpcs.push(data);
        }
        log.push(`${importedFullNpcs.length} full NPC(s)`);
      }
      const importedQuickNpcs = cats.quickNpcs?.length
        ? (await supabase.from('npcs').select('*').eq('game_id', GAME_ID).in('name', cats.quickNpcs.map(n => n.name))).data || []
        : [];

      if (cats.mapPins?.length) {
        const { error } = await supabase.from('map_pins').insert(cats.mapPins.map(p => ({ ...p, game_id: GAME_ID })));
        if (error) throw new Error(`Map pins: ${error.message}`);
        log.push(`${cats.mapPins.length} map pin(s)`);
      }

      // Faction standings - the one deliberate exception to "additive, never overwrite": a pack's
      // faction standings REPLACE the target's entirely, since they're exported as a single
      // all-or-nothing snapshot, not individually picked entries to merge in.
      if (cats.factionStandings?.length) {
        const { error: delErr } = await supabase.from('faction_reputation').delete().eq('game_id', GAME_ID);
        if (delErr) throw new Error(`Faction standings: ${delErr.message}`);
        const { error } = await supabase.from('faction_reputation').insert(cats.factionStandings.map(f => ({ ...f, game_id: GAME_ID })));
        if (error) throw new Error(`Faction standings: ${error.message}`);
        log.push(`${cats.factionStandings.length} faction standing(s) (replaced existing)`);
      }

      // Prepped sessions - re-numbered sequentially onto the end of whatever session numbers already
      // exist, matching the existing auto-sequential numbering convention rather than trusting the
      // source campaign's own numbers (which would very likely collide).
      if (cats.preppedSessions?.length) {
        const { data: existingSessions } = await supabase.from('sessions').select('session_number').eq('game_id', GAME_ID);
        let nextNum = 1 + Math.max(0, ...(existingSessions || []).map(s => s.session_number || 0));
        for (const s of cats.preppedSessions) {
          const { error } = await supabase.from('sessions').insert({ ...s, game_id: GAME_ID, is_active: false, closed_at: null, session_number: nextNum++ });
          if (error) throw new Error(`Session "${s.title}": ${error.message}`);
        }
        log.push(`${cats.preppedSessions.length} prepped session(s)`);
      }

      // Everything below lives inside games.settings - fetch once, merge all of it, write once.
      const { data: gameRow } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
      const settings = { ...(gameRow?.settings || {}) };

      // Settings - the second deliberate exception to "additive, never overwrite": each key present in
      // the pack overwrites that same key in the target campaign. Only ever touches the whitelisted
      // settings keys themselves, never anything else sharing this same JSONB column (shops, grids, etc).
      if (cats.settings && Object.keys(cats.settings).length > 0) {
        Object.assign(settings, cats.settings);
        log.push(`${Object.keys(cats.settings).length} setting(s) (overwrote matching keys)`);
      }

      if (cats.gmInventory?.length) {
        settings.gm_inventory = [...(settings.gm_inventory || []), ...cats.gmInventory];
        log.push(`${cats.gmInventory.length} GM inventory item(s)`);
      }
      if (cats.partyInventory?.length) {
        // Party inventory items live on the group_inventory row, not games.settings - handled separately below.
      }

      // Doodad Library - auto-add any embedded doodad def whose NAME doesn't already exist in the
      // target's library (name match, not id - ids never carry over). Build a name→id map as we go so
      // battle grids below can remap their placedDoodads' defId to whatever id ends up correct here.
      const doodadLib = [...(settings.doodad_library || [])];
      const doodadNameToId = new Map(doodadLib.map(d => [d.name, d.id]));
      if (cats.battleGrids?.length) {
        for (const grid of cats.battleGrids) {
          for (const def of (grid._embeddedDoodadDefs || [])) {
            if (!doodadNameToId.has(def.name)) {
              const { _origId, ...defData } = def;
              const newId = `doodad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
              doodadLib.push({ ...defData, id: newId });
              doodadNameToId.set(def.name, newId);
            }
          }
        }
        settings.doodad_library = doodadLib;
      }

      if (cats.shops?.length) {
        const nameToNpc = new Map([...importedFullNpcs, ...importedQuickNpcs, ...fullNpcs, ...quickNpcs].map(n => [n.name, n.id]));
        const newShops = cats.shops.map(s => {
          const { _shopkeeper_name, ...rest } = s;
          const shopkeeper_id = _shopkeeper_name ? (nameToNpc.get(_shopkeeper_name) || null) : null;
          return { ...rest, id: `shop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, shopkeeper_id };
        });
        settings.shops_v2 = [...(settings.shops_v2 || []), ...newShops];
        log.push(`${newShops.length} shop(s)`);
      }

      if (cats.battleGrids?.length) {
        const newGrids = cats.battleGrids.map(g => {
          const { _embeddedDoodadDefs, doodads, ...rest } = g;
          const remappedDoodads = (doodads || []).map(d => {
            const originalDef = (_embeddedDoodadDefs || []).find(def => def._origId === d.defId);
            const newDefId = originalDef ? doodadNameToId.get(originalDef.name) : d.defId;
            return { ...d, id: `doodadinst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, defId: newDefId };
          });
          return { ...rest, id: `grid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, doodads: remappedDoodads };
        });
        settings.saved_battle_grids = [...(settings.saved_battle_grids || []), ...newGrids];
        log.push(`${newGrids.length} battle grid(s)`);
      }

      const { error: settingsErr } = await supabase.from('games').update({ settings }).eq('id', GAME_ID);
      if (settingsErr) throw new Error(`Settings save: ${settingsErr.message}`);

      // Party inventory - its own row, separate from games.settings.
      if (cats.partyInventory?.length) {
        const { data: inv } = await supabase.from('group_inventory').select('*').eq('game_id', GAME_ID).maybeSingle();
        if (inv) {
          const { error } = await supabase.from('group_inventory').update({ items: [...(inv.items || []), ...cats.partyInventory] }).eq('id', inv.id);
          if (error) throw new Error(`Party inventory: ${error.message}`);
          log.push(`${cats.partyInventory.length} party inventory item(s)`);
        }
      }

      setImportStatus(`✓ Added: ${log.join(', ')}. Reload the page to see everything.`);
      setPendingPack(null);
      fetchAll();
    } catch (e) {
      setImportStatus(`Import failed: ${e.message}`);
    }
  };

  // ── UI ──────────────────────────────────────────────────────────────────────
  const Section = ({ catKey, label, icon, items, getId, getLabel, getSublabel }) => {
    const isOpen = !!open[catKey];
    const count = sel[catKey].length;
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '.5rem', border: '1px solid var(--border)', borderRadius: 5 }}>
        <div onClick={() => setOpen(p => ({ ...p, [catKey]: !p[catKey] }))}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '.5rem .75rem', cursor: 'pointer', background: count > 0 ? 'rgba(200,150,42,.08)' : 'transparent' }}>
          <i className={`ti ${isOpen ? 'ti-chevron-down' : 'ti-chevron-right'}`} style={{ fontSize: 13, color: 'var(--text-muted)' }} />
          <i className={`ti ${icon}`} style={{ fontSize: 14, color: 'var(--gold-dim)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{items.length} available</span>
          {count > 0 && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>{count} selected</span>}
        </div>
        {isOpen && (
          <div style={{ padding: '.4rem .75rem .6rem', borderTop: '1px solid var(--border)', maxHeight: 220, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 6px' }} onClick={() => setSel(p => ({ ...p, [catKey]: items.map(getId) }))}>Select All</button>
              <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 6px' }} onClick={() => setSel(p => ({ ...p, [catKey]: [] }))}>Clear</button>
            </div>
            {items.map(item => {
              const id = getId(item);
              return (
                <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={sel[catKey].includes(id)} onChange={() => toggleSel(catKey, id)} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{getLabel(item)}</span>
                  {getSublabel && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{getSublabel(item)}</span>}
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!isGM) return null;
  if (loading) return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading resource pack data...</div>;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-title"><i className="ti ti-package" style={{ marginRight: 6 }} />Resource Packs</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Export a hand-picked subset of your campaign - specific quests, NPCs, pins, shops, battle grids,
        and more - as a standalone file anyone can import into their own campaign. Unlike Campaign Backup,
        this is purely <strong>additive</strong>: importing a pack never touches or overwrites anything
        already in the target campaign, it only adds new entries.
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>Build a Pack</div>
        <Section catKey="quests" label="Quests" icon="ti-flag" items={quests} getId={q => q.id} getLabel={q => q.title} />
        <Section catKey="quickNpcs" label="Quick NPCs" icon="ti-user" items={quickNpcs} getId={n => n.id} getLabel={n => n.name} getSublabel={n => n.faction} />
        <Section catKey="fullNpcs" label="Full NPCs" icon="ti-user-star" items={fullNpcs} getId={c => c.id} getLabel={c => c.name} getSublabel={c => `${c.school} R${c.school_rank}`} />
        <Section catKey="mapPins" label="Map Pins" icon="ti-map-pin" items={mapPins} getId={p => p.id} getLabel={p => p.label || p.title || 'Pin'} />
        <Section catKey="shops" label="Shops" icon="ti-building-store" items={shops} getId={s => s.id} getLabel={s => s.name} />
        <Section catKey="battleGrids" label="Battle Grids" icon="ti-grid-dots" items={battleGrids} getId={g => g.id} getLabel={g => g.label || g.name} />
        <Section catKey="gmInventory" label="GM Inventory" icon="ti-briefcase" items={gmInventory} getId={i => i.id || i.name} getLabel={i => i.name} />
        <Section catKey="preppedSessions" label="Prepped Sessions" icon="ti-notebook" items={preppedSessions} getId={s => s.id} getLabel={s => s.title || `Session ${s.session_number}`} />
        {/* Faction standings aren't individually selectable - it's an all-or-nothing export of the
            current standings as they are, and importing REPLACES the target's faction standings
            entirely (the one deliberate exception to the additive/never-overwrite rule below). */}
        {factionStandings.length > 0 && (
          <div style={{ marginBottom: '.5rem', border: '1px solid var(--border)', borderRadius: 5, padding: '.5rem .75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={sel.factionStandings.length > 0}
                onChange={e => setSel(p => ({ ...p, factionStandings: e.target.checked ? factionStandings.map(f => f.id) : [] }))} />
              <i className="ti ti-shield-half-filled" style={{ fontSize: 14, color: 'var(--gold-dim)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>Faction Standings</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{factionStandings.length} factions - all or nothing, replaces on import</span>
            </label>
          </div>
        )}
        <Section catKey="partyInventory" label="Party Inventory" icon="ti-backpack" items={partyInventory} getId={i => i.id || i.name} getLabel={i => i.name} />
        {/* Settings - same all-or-nothing pattern as Faction Standings. Overwrites just the matching
            keys in the target campaign's games.settings on import; everything else in that shared JSONB
            column (shops, grids, etc, each its own category above) is left untouched. */}
        {Object.keys(gameSettings).length > 0 && (
          <div style={{ marginBottom: '.5rem', border: '1px solid var(--border)', borderRadius: 5, padding: '.5rem .75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={sel.settings.length > 0}
                onChange={e => setSel(p => ({ ...p, settings: e.target.checked ? ['__settings__'] : [] }))} />
              <i className="ti ti-settings" style={{ fontSize: 14, color: 'var(--gold-dim)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>Settings</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Object.keys(gameSettings).length} keys - all or nothing, overwrites matching keys on import</span>
            </label>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: '.5rem' }}>
        <input value={packName} onChange={e => setPackName(e.target.value)} placeholder="Pack name (e.g. 'Desert Ruins Set')"
          style={{ flex: 1, minWidth: 180, fontSize: 12 }} />
        <button className="btn btn-p btn-sm" disabled={totalSelected === 0} onClick={handleExportPack}>
          <i className="ti ti-download" style={{ fontSize: 13, marginRight: 4 }} />Export {totalSelected > 0 ? `(${totalSelected})` : ''}
        </button>
      </div>
      {exportStatus && <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: '.5rem' }}>{exportStatus}</div>}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '.75rem', marginTop: '.5rem' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>Import a Pack</div>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileSelect} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><i className="ti ti-upload" style={{ fontSize: 13, marginRight: 4 }} />Select Pack File</button>
          {pendingPack && <button className="btn btn-sm btn-p" onClick={handleImportConfirm}>Confirm Import</button>}
        </div>
        {importStatus && <div style={{ fontSize: 12, color: pendingPack ? 'var(--gold)' : 'var(--green)', marginTop: '.5rem' }}>{importStatus}</div>}
      </div>
    </div>
  );
}
