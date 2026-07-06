import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';

const BACKUP_FORMAT_VERSION = 1; // bump only if the backup JSON's own shape changes, not for new tables/columns

// ── Export campaign ───────────────────────────────────────────────────────────
async function exportCampaign() {
  const tables = ['characters','npcs','quests','map_pins','faction_reputation','group_inventory','encounter_log','sessions','feedback'];
  const backup = { backup_format_version: BACKUP_FORMAT_VERSION, exported_at: new Date().toISOString(), game_id: GAME_ID, game: null, tables: {} };

  // Game settings row — image config, player accounts, passwords, etc. Part of a full campaign backup.
  const { data: gameRow, error: gameErr } = await supabase.from('games').select('*').eq('id', GAME_ID).maybeSingle();
  if (gameErr) console.error('Export games failed:', gameErr.message);
  backup.game = gameRow || null;

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').eq('game_id', GAME_ID);
    if (error) { console.error(`Export ${table} failed:`, error.message); continue; }
    backup.tables[table] = data || [];
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sandy-campaign-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return backup.tables;
}

// ── Import campaign ───────────────────────────────────────────────────────────
// Tolerant of backups from older or newer app versions — only requires a valid
// `tables` object, not an exact version match, so backups stay usable across updates.
async function importCampaign(backup) {
  if (!backup?.tables || typeof backup.tables !== 'object') throw new Error('Invalid backup file — missing campaign data.');

  const ORDER = ['characters','npcs','quests','map_pins','faction_reputation','group_inventory','encounter_log','sessions','feedback'];

  // Game settings — update the existing row in place. Every other table has a
  // foreign key pointing at games, so we never delete/recreate this one.
  if (backup.game) {
    const { id, ...gameFields } = backup.game;
    const { error } = await supabase.from('games').update(gameFields).eq('id', GAME_ID);
    if (error) console.warn('Restore game settings failed (may be missing/renamed columns):', error.message);
  }

  // Wipe existing data in reverse order to respect foreign keys
  for (const table of [...ORDER].reverse()) {
    const { error } = await supabase.from(table).delete().eq('game_id', GAME_ID);
    if (error) console.warn(`Wipe ${table} during import:`, error.message);
  }

  // Insert in dependency order
  for (const table of ORDER) {
    const rows = backup.tables[table];
    if (!rows?.length) continue;
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw new Error(`Import ${table} failed: ${error.message}`);
  }
}

// ── Danger action button ──────────────────────────────────────────────────────
function DangerAction({ label, description, onConfirm }) {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const handleClick = async () => {
    if (step === 0) { setStep(1); return; }
    if (step === 1) {
      const r = await onConfirm();
      setResult(r || { ok: true, message: 'Done' });
      setStep(2);
      setTimeout(() => { setStep(0); setResult(null); }, r?.ok === false ? 5000 : 2500);
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.6rem 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {step === 1 && <span style={{ fontSize: 12, color: 'var(--red)' }}>Are you sure?</span>}
        {step === 2
          ? <span style={{ fontSize: 13, color: result?.ok === false ? 'var(--red)' : 'var(--green)' }}>
              {result?.ok === false ? `✗ ${result.message}` : `✓ ${result?.message || 'Done'}`}
            </span>
          : <button className={`btn btn-sm ${step === 1 ? 'btn-d' : ''}`} onClick={handleClick}>
              {step === 0 ? label : 'Confirm'}
            </button>
        }
        {step === 1 && <button className="btn btn-sm" onClick={() => setStep(0)}>Cancel</button>}
      </div>
    </div>
  );
}

// ── Player Accounts — 8 username/password slots for player login ──────────────
function PlayerAccounts() {
  const EMPTY_SLOTS = Array.from({ length: 8 }, () => ({ username: '', password: '' }));
  const [slots, setSlots] = useState(EMPTY_SLOTS);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data, error }) => {
      if (!error && data?.settings?.player_accounts) {
        const loaded = [...EMPTY_SLOTS];
        data.settings.player_accounts.forEach((p, i) => { if (i < 8) loaded[i] = p; });
        setSlots(loaded);
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaveError('');
    const { data, error: fetchErr } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    if (fetchErr) { setSaveError(`Couldn't load current settings: ${fetchErr.message}`); return; }
    const current = data?.settings || {};
    const { error } = await supabase.from('games').update({ settings: { ...current, player_accounts: slots.filter(s => s.username.trim()) } }).eq('id', GAME_ID);
    if (error) { setSaveError(`Save failed: ${error.message} — does games.settings column exist?`); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-title">Player Accounts</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.75rem', lineHeight: 1.5 }}>
        Create up to 8 player accounts. Each player logs in with their username and password. Leave rows blank to skip them.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginBottom: '.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Username</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Password</div>
        {slots.map((slot, i) => (
          <React.Fragment key={i}>
            <input value={slot.username} onChange={e => { const s = [...slots]; s[i] = { ...s[i], username: e.target.value }; setSlots(s); }}
              placeholder={`Player ${i + 1}`} style={{ fontSize: 13 }} />
            <input value={slot.password} onChange={e => { const s = [...slots]; s[i] = { ...s[i], password: e.target.value }; setSlots(s); }}
              placeholder="password" style={{ fontSize: 13 }} />
          </React.Fragment>
        ))}
      </div>
      <button className="btn btn-p btn-sm" onClick={save}>{saved ? '✓ Saved' : 'Save Accounts'}</button>
      {saveError && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: '.5rem' }}>{saveError}</div>}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.5rem' }}>
        Players log in at the login screen with their username and password.
      </div>
    </div>
  );
}

// ── SettingsTab ───────────────────────────────────────────────────────────────
export default function SettingsTab({ onWipe = {}, isDeveloper = false, isGM = false }) {
  const [subTab, setSubTab] = useState('gameplay');

  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importStep, setImportStep] = useState(0);
  const [pendingBackup, setPendingBackup] = useState(null);
  const fileRef = useRef(null);

  const SETTINGS = ['Streets','Sewers','Desert','Palace','Indoors',"Khan's Warcamp","Barracks Lounge"];
  const DEFAULT_MAP_URL = 'https://i.imgur.com/6fuMHqq.jpeg';
  const DEFAULT_MAP_URL_NIGHT = 'https://i.imgur.com/H9d7S7C.jpeg';
  const DEFAULT_JINN_ART_URL = 'https://i.imgur.com/AwZ72Fq.jpeg';
  const [mapUrl, setMapUrl] = useState(DEFAULT_MAP_URL);
  const [mapUrlNight, setMapUrlNight] = useState(DEFAULT_MAP_URL_NIGHT);
  const [musicUrl, setMusicUrl] = useState('');
  const [settingUrls, setSettingUrls] = useState({});
  const [jinnArtUrl, setJinnArtUrl] = useState(DEFAULT_JINN_ART_URL);
  const [roundLimits, setRoundLimits] = useState({ Action: '', Intrigue: '', Travel: '', Downtime: '' });
  const [imagesSaved, setImagesSaved] = useState(false);
  const [disableReroll, setDisableReroll] = useState(false);
  const [waterDroughtEnabled, setWaterDroughtEnabled] = useState(false);
  const [ringsOverlay, setRingsOverlay] = useState(true);
  const [portraitScale, setPortraitScale] = useState(1.0);
  const [downtimeMode, setDowntimeMode] = useState('gm_granted'); // 'unlimited' | 'gm_granted' | 'set_number'
  const [hideShopFromPlayers, setHideShopFromPlayers] = useState(false);
  const [downtimeActionsPerChar, setDowntimeActionsPerChar] = useState(3);
  const [arrowTracking, setArrowTracking] = useState(false);
  const [startingCP, setStartingCP] = useState(45);
  const [gmPwEdit, setGmPwEdit] = useState('');
  const [gmPwSaved, setGmPwSaved] = useState(false);
  const [gmPwStatus, setGmPwStatus] = useState('');

  React.useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      if (data?.settings) {
        if (data.settings.map_url) setMapUrl(data.settings.map_url);
        if (data.settings.map_url_night) setMapUrlNight(data.settings.map_url_night);
        if (data.settings.music_url) setMusicUrl(data.settings.music_url);
        if (data.settings.setting_urls) setSettingUrls(data.settings.setting_urls);
        if (data.settings.jinn_art_url) setJinnArtUrl(data.settings.jinn_art_url);
        if (data.settings.round_limits) setRoundLimits({ Action: '', Intrigue: '5', Travel: '3', ...data.settings.round_limits });
        if (data.settings.disable_reroll !== undefined) setDisableReroll(!!data.settings.disable_reroll);
        if (data.settings.water_drought_enabled !== undefined) setWaterDroughtEnabled(!!data.settings.water_drought_enabled);
        if (data.settings.rings_overlay !== undefined) setRingsOverlay(!!data.settings.rings_overlay);
        if (data.settings.portrait_scale !== undefined) setPortraitScale(data.settings.portrait_scale || 1.0);
        if (data.settings.downtime_mode) setDowntimeMode(data.settings.downtime_mode);
        if (data.settings.hide_shop_from_players !== undefined) setHideShopFromPlayers(!!data.settings.hide_shop_from_players);
        if (data.settings.downtime_actions_per_char) setDowntimeActionsPerChar(data.settings.downtime_actions_per_char);
        if (data.settings.arrow_tracking !== undefined) setArrowTracking(!!data.settings.arrow_tracking);
        if (data.settings.starting_cp !== undefined) setStartingCP(data.settings.starting_cp || 45);
      }
    });
  }, []);

  const saveImageSettings = async () => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), map_url: mapUrl, map_url_night: mapUrlNight, music_url: musicUrl, setting_urls: settingUrls, round_limits: roundLimits, jinn_art_url: jinnArtUrl, disable_reroll: disableReroll, water_drought_enabled: waterDroughtEnabled, rings_overlay: ringsOverlay, portrait_scale: portraitScale, downtime_mode: downtimeMode, downtime_actions_per_char: downtimeActionsPerChar, arrow_tracking: arrowTracking, starting_cp: startingCP, hide_shop_from_players: hideShopFromPlayers } })
      .eq('id', GAME_ID);
    if (!error) { setImagesSaved(true); setTimeout(() => setImagesSaved(false), 2500); }
    else { console.error('saveImageSettings failed:', error.message); setImagesSaved(false); }
  };

  const wipeTable = async (table, filter = {}, afterRefetch) => {
    // Supabase requires neq filter alongside eq to allow bulk deletes without RLS issues
    let q = supabase.from(table).delete({ count: 'exact' }).eq('game_id', GAME_ID).neq('id', '00000000-0000-0000-0000-000000000000');
    Object.entries(filter).forEach(([k, v]) => { q = q.eq(k, v); });
    const { error, count } = await q;
    if (error) { console.error(`Wipe ${table} failed:`, error.message); return { ok: false, message: error.message }; }
    if (afterRefetch) afterRefetch();
    return { ok: true, message: `Removed ${count ?? 0} row${count === 1 ? '' : 's'}` };
  };

  const wipeEverything = async () => {
    // Wipe all campaign data — use before handing tool to another group
    // Order matters: children before parents
    await wipeTable('quests');
    await wipeTable('encounter_log', {}, onWipe.encounterLog);
    await wipeTable('map_pins');
    await wipeTable('npcs');
    await wipeTable('characters');
    await wipeAllSessions();
    await wipeAllShops();
    // Reset group inventory
    await supabase.from('group_inventory').update({ copper: 0, items: [] }).eq('game_id', GAME_ID);
    // Reset faction reputation
    await supabase.from('faction_reputation').update({ reputation: 0 }).eq('game_id', GAME_ID);
    // Reset time/day/week in games.settings
    const { data: gameRow } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const updated = { ...(gameRow?.settings || {}), shops_v2: [], timeOfDay: 'Morning', campaignDay: 1, campaignWeek: 1 };
    await supabase.from('games').update({ settings: updated }).eq('id', GAME_ID);
    // Trigger all refetches
    if (onWipe.characters) onWipe.characters();
    if (onWipe.npcs) onWipe.npcs();
    if (onWipe.quests) onWipe.quests();
    if (onWipe.session) onWipe.session();
    if (onWipe.shops) onWipe.shops();
    return { ok: true, message: 'Campaign reset' };
  };

  const wipeAllShops = async () => {
    const { data: gameRow } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const updated = { ...(gameRow?.settings || {}), shops_v2: [] };
    const { error } = await supabase.from('games').update({ settings: updated }).eq('id', GAME_ID);
    if (error) { console.error('wipeAllShops failed:', error.message); return { ok: false, message: error.message }; }
    if (onWipe.shops) onWipe.shops();
    return { ok: true, message: 'Shops cleared' };
  };

  const clearActiveSession = async () => {
    // Find the active session
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('game_id', GAME_ID)
      .eq('is_active', true)
      .single();
    if (error || !data) { return { ok: false, message: 'No active session to clear' }; }
    // End it without archiving — wipe encounter_data, mark inactive, no recap
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ is_active: false, encounter_data: null, closed_at: new Date().toISOString() })
      .eq('id', data.id);
    if (updateError) { console.error('clearActiveSession failed:', updateError.message); return { ok: false, message: updateError.message }; }
    if (onWipe.session) onWipe.session();
    return { ok: true, message: 'Session cleared' };
  };

  // Narrower than Clear Active Session — resets the in-progress combat/encounter state back to idle
  // WITHOUT ending or archiving the session itself. Useful for a stuck/corrupted encounter mid-session.
  const wipeCurrentEncounter = async () => {
    const { data, error } = await supabase.from('sessions').select('id').eq('game_id', GAME_ID).eq('is_active', true).single();
    if (error || !data) return { ok: false, message: 'No active session' };
    const { error: updateError } = await supabase.from('sessions').update({ encounter_data: null }).eq('id', data.id);
    if (updateError) { console.error('wipeCurrentEncounter failed:', updateError.message); return { ok: false, message: updateError.message }; }
    if (onWipe.session) onWipe.session();
    return { ok: true, message: 'Current encounter reset to idle' };
  };

  // Clears prepared_encounters (the GM's saved/prepped encounter drafts) off every session row —
  // does not touch the sessions themselves or any live/in-progress encounter.
  const wipeSavedEncounters = async () => {
    const { error, count } = await supabase.from('sessions').update({ prepared_encounters: [] }, { count: 'exact' }).eq('game_id', GAME_ID);
    if (error) { console.error('wipeSavedEncounters failed:', error.message); return { ok: false, message: error.message }; }
    if (onWipe.session) onWipe.session();
    if (onWipe.sessionLog) onWipe.sessionLog();
    return { ok: true, message: `Cleared prepared encounters from ${count ?? 0} session(s)` };
  };

  // Clears the GM's Inventory staging list (Preparation > Item Creator) — does not touch party
  // inventory or character equipment, since items already handed off are no longer in this list.
  const wipeGmInventory = async () => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games').update({ settings: { ...(current?.settings || {}), gm_inventory: [] } }).eq('id', GAME_ID);
    if (error) { console.error('wipeGmInventory failed:', error.message); return { ok: false, message: error.message }; }
    return { ok: true, message: "GM's Inventory cleared" };
  };

  // Narrower than Wipe All Sessions — deletes only prepared (not-yet-started, not-yet-archived)
  // session rows, leaving the active session and all archived history untouched.
  const wipeSavedSessions = async () => {
    const { data: prepped } = await supabase.from('sessions').select('id').eq('game_id', GAME_ID).eq('is_active', false).is('closed_at', null);
    const ids = (prepped || []).map(s => s.id);
    if (ids.length === 0) return { ok: true, message: 'No prepared sessions to remove' };
    // Same FK guard as Wipe All Sessions — quests can reference a session's id
    await supabase.from('quests').update({ session_id: null }).in('session_id', ids);
    const { error, count } = await supabase.from('sessions').delete({ count: 'exact' }).in('id', ids);
    if (error) { console.error('wipeSavedSessions failed:', error.message); return { ok: false, message: error.message }; }
    if (onWipe.session) onWipe.session();
    if (onWipe.sessionLog) onWipe.sessionLog();
    if (onWipe.quests) onWipe.quests();
    return { ok: true, message: `Removed ${count ?? 0} prepared session(s)` };
  };

  const wipeAllSessions = async () => {
    // First kill the active session if one exists
    await supabase
      .from('sessions')
      .update({ is_active: false, encounter_data: null, closed_at: new Date().toISOString() })
      .eq('game_id', GAME_ID)
      .eq('is_active', true);
    // quests.session_id has a foreign key to sessions.id — deleting a session that any quest still
    // references throws a 409 (violates foreign key constraint "quests_session_id_fkey"). Since every
    // session is about to be gone anyway, null out the reference on all quests first rather than
    // deleting the quests themselves.
    const { error: questFkError } = await supabase.from('quests').update({ session_id: null }).eq('game_id', GAME_ID);
    if (questFkError) console.error('clear quests.session_id failed:', questFkError.message);
    else if (onWipe.quests) onWipe.quests();
    // Then delete all session rows — must go through wipeTable's .neq(id, zero-uuid) workaround,
    // same as every other wipe here, or Supabase RLS silently deletes zero rows.
    const result = await wipeTable('sessions');
    // A session's "log" — the completed-encounter history (name, setting, party, rounds) — lives in
    // a separate encounter_log table, not on the session row itself. Wiping sessions without also
    // wiping this left old encounter history behind, which is what "session wipe doesn't wipe the
    // session log" was actually pointing at. Wipe it too, and refresh both so the UI updates immediately
    // instead of only clearing on the next full page reload.
    const logResult = await wipeTable('encounter_log', {}, onWipe.encounterLog);
    if (onWipe.session) onWipe.session();
    if (onWipe.sessionLog) onWipe.sessionLog();
    if (!result.ok || !logResult.ok) {
      return { ok: false, message: [!result.ok && `sessions: ${result.message}`, !logResult.ok && `encounter log: ${logResult.message}`].filter(Boolean).join('; ') };
    }
    return { ok: true, message: `${result.message} (sessions), ${logResult.message} (encounter log)` };
  };

  const handleExport = async () => {
    setExportStatus('Exporting...');
    try {
      const tables = await exportCampaign();
      const total = Object.values(tables).reduce((s, t) => s + t.length, 0);
      setExportStatus(`✓ Exported ${total} records`);
      setTimeout(() => setExportStatus(''), 4000);
    } catch (e) {
      setExportStatus(`Error: ${e.message}`);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target.result);
        if (!backup?.tables || typeof backup.tables !== 'object') { setImportStatus('Invalid backup file.'); return; }
        const total = Object.values(backup.tables).reduce((s, t) => s + t.length, 0) + (backup.game ? 1 : 0);
        setPendingBackup(backup);
        setImportStatus(`Ready to import ${total} records from ${backup.exported_at?.slice(0,10) || 'unknown date'}. This will OVERWRITE all current data.`);
        setImportStep(1);
      } catch { setImportStatus('Could not parse file — must be a valid Sandy backup JSON.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    if (!pendingBackup) return;
    setImportStep(2);
    setImportStatus('Importing — do not close this page...');
    try {
      await importCampaign(pendingBackup);
      setImportStep(3);
      setImportStatus('✓ Import complete. Reload the page to see restored data.');
      setPendingBackup(null);
    } catch (e) {
      setImportStep(0);
      setImportStatus(`Import failed: ${e.message}`);
    }
  };

  const SUB_TABS = [
    { id: 'gameplay', label: 'Gameplay', icon: 'ti-adjustments-horizontal' },
    { id: 'images',   label: 'Images',   icon: 'ti-photo' },
    { id: 'campaign', label: 'Campaign', icon: 'ti-database-export' },
    { id: 'players',  label: 'Players & Passwords', icon: 'ti-users' },
  ];

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        <i className="ti ti-settings" style={{ marginRight: 8 }} />GM Settings
        {isDeveloper && <span style={{ fontSize: 11, color: '#c0a0e0', marginLeft: 10, fontWeight: 400 }}>Developer Mode</span>}
      </div>

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`btn btn-sm ${subTab === t.id ? 'btn-p' : ''}`}
            style={{ fontSize: 12 }}>
            <i className={`ti ${t.icon}`} style={{ marginRight: 4 }} />{t.label}
          </button>
        ))}
      </div>

      {/* ── GAMEPLAY ── */}
      {subTab === 'gameplay' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title"><i className="ti ti-toggles" style={{ marginRight: 6 }} />Toggles</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={waterDroughtEnabled} onChange={e => setWaterDroughtEnabled(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Water Drought</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enables the water unit system — characters track water supplies; going without has consequences.</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={disableReroll} onChange={e => setDisableReroll(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Disable Player Rerolls</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Removes the reroll button from the dice roller for all players. Luck and Unlucky rerolls are separate — players spend those themselves and are unaffected by this setting.</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={arrowTracking} onChange={e => setArrowTracking(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Arrow Tracking</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bow attacks consume arrows from inventory. After an encounter, 50% (round up) of arrows used are returned. Arrows must be in inventory to fire.</div>
              </div>
            </label>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title"><i className="ti ti-moon" style={{ marginRight: 6 }} />Downtime Actions</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.75rem', lineHeight: 1.5 }}>
              Controls how players take actions during downtime (when no encounter is active).
            </div>
            {[
              { id: 'unlimited',   label: 'Unlimited',       desc: 'No tracking — anyone can roll any downtime action freely. Disables the GM Granted Actions system entirely.' },
              { id: 'gm_granted',  label: 'GM Granted',      desc: 'Default. GM manually grants actions to specific characters. The existing Granted Actions panel.' },
              { id: 'set_number',  label: 'Set Number',      desc: 'All characters automatically receive a fixed number of granted actions at the start of each downtime.' },
            ].map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', marginBottom: '.6rem', cursor: 'pointer' }}>
                <input type="radio" name="downtime_mode" value={opt.id} checked={downtimeMode === opt.id} onChange={() => setDowntimeMode(opt.id)} style={{ accentColor: 'var(--gold)', marginTop: 3 }} />
                <div>
                  <div style={{ fontSize: 13, color: downtimeMode === opt.id ? 'var(--gold)' : 'var(--text-primary)', fontWeight: downtimeMode === opt.id ? 600 : 400 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
            {downtimeMode === 'set_number' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.25rem', paddingLeft: '1.25rem' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Actions per character:</span>
                <button className="rep-btn" onClick={() => setDowntimeActionsPerChar(n => Math.max(1, n - 1))}>−</button>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)', minWidth: 24, textAlign: 'center' }}>{downtimeActionsPerChar}</span>
                <button className="rep-btn" onClick={() => setDowntimeActionsPerChar(n => n + 1)}>+</button>
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title"><i className="ti ti-user-plus" style={{ marginRight: 6 }} />Character Creation</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              Character Points available to spend on traits and skills when building a new PC. L5R 4E default is 45.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 90 }}>Starting CP:</span>
              <button className="rep-btn" onClick={() => setStartingCP(n => Math.max(1, n - 5))}>−</button>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)', minWidth: 32, textAlign: 'center' }}>{startingCP}</span>
              <button className="rep-btn" onClick={() => setStartingCP(n => n + 5)}>+</button>
              {startingCP !== 45 && (
                <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setStartingCP(45)}>Reset to Default (45)</button>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title"><i className="ti ti-hourglass" style={{ marginRight: 6 }} />Round Limits</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.5rem' }}>Gives a warning on the last round. GM can keep going.</div>
            {['Action','Intrigue','Travel'].map(t => {
              const val = roundLimits[t];
              const isUnlimited = !val || val === '';
              const numVal = isUnlimited ? null : parseInt(val, 10);
              return (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 80 }}>{t}</span>
                  <button className="rep-btn" onClick={() => { if (isUnlimited) return; const next = numVal - 1; setRoundLimits(r => ({ ...r, [t]: next <= 0 ? '' : String(next) })); }} disabled={isUnlimited}>−</button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isUnlimited ? 'var(--text-muted)' : 'var(--gold)', minWidth: 64, textAlign: 'center', fontStyle: isUnlimited ? 'italic' : 'normal' }}>
                    {isUnlimited ? 'Unlimited' : `${numVal} rounds`}
                  </span>
                  <button className="rep-btn" onClick={() => { const next = isUnlimited ? 1 : numVal + 1; setRoundLimits(r => ({ ...r, [t]: String(next) })); }}>+</button>
                  {!isUnlimited && <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', color: 'var(--text-muted)' }} onClick={() => setRoundLimits(r => ({ ...r, [t]: '' }))}>∞</button>}
                </div>
              );
            })}
          </div>

          <button className="btn btn-p btn-sm" onClick={saveImageSettings}>{imagesSaved ? '✓ Saved' : 'Save Gameplay Settings'}</button>
        </>
      )}

      {/* ── IMAGES ── */}
      {subTab === 'images' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title"><i className="ti ti-photo" style={{ marginRight: 6 }} />Background Images</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Paste direct image URLs (imgur, Discord, etc). Leave blank to use defaults.
            </div>

            {/* Image advice */}
            <div style={{ background: 'rgba(200,150,42,.06)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 6, padding: '.75rem 1rem', marginBottom: '1rem', fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: '.4rem' }}>📐 Image Advice</div>
              <div style={{ marginBottom: '.5rem' }}><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>City Map</span> — 5000–8000px wide, landscape. Map uses a <strong>33×23 grid</strong> internally; roughly 3:2 ratio works best.</div>
              <div style={{ marginBottom: '.5rem' }}><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Encounter Backgrounds</span> — Any size. Displayed at 25% opacity. Landscape (16:9 or wider). Battle grid is <strong>variable size</strong> — 12×12 is the default.</div>
              <div style={{ marginBottom: '.5rem' }}><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Avatars</span> — 400–800px square, portrait orientation. Circular crop applied.</div>
              <div style={{ marginBottom: '.5rem' }}><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Jinn Art</span> — Full-screen on summoning. Any size. Go dramatic.</div>
              <div style={{ borderTop: '1px solid rgba(200,150,42,.15)', marginTop: '.5rem', paddingTop: '.5rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Where to host</span> — <strong>Imgur</strong>: free, direct links end in .jpg/.png. <strong>Discord</strong>: right-click image → Copy Link (can expire). <strong>Google Drive</strong>: share publicly, convert <code>drive.google.com/file/d/FILE_ID/view</code> → <code>drive.google.com/uc?export=view&id=FILE_ID</code>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.25rem', fontWeight: 600 }}>City Map</div>
            <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.5rem' }}>
              <input value={mapUrl} onChange={e => setMapUrl(e.target.value)} onBlur={saveImageSettings} placeholder="https://..." style={{ flex: 1 }} />
              <button className="btn btn-sm" style={{ fontSize: 11, flexShrink: 0 }} onClick={() => { setMapUrl(DEFAULT_MAP_URL); saveImageSettings(); }}>Use Default</button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.25rem', fontWeight: 600 }}>City Map (Night)</div>
            <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.5rem' }}>
              <input value={mapUrlNight} onChange={e => setMapUrlNight(e.target.value)} onBlur={saveImageSettings} placeholder="Leave blank to disable night mode" style={{ flex: 1 }} />
              <button className="btn btn-sm" style={{ fontSize: 11, flexShrink: 0 }} onClick={() => { setMapUrlNight(DEFAULT_MAP_URL_NIGHT); saveImageSettings(); }}>Use Default</button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={ringsOverlay}
                onChange={e => { setRingsOverlay(e.target.checked); setTimeout(saveImageSettings, 0); }}
                style={{ accentColor: 'var(--gold)' }} />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Rings Overlay</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shows the district-ring guide lines (Outer City, Merchant District, Faction Quarter, Noble District, Palace) on the surface map layer.</div>
              </div>
            </label>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.25rem', fontWeight: 600 }}>Background Music</div>
            <input value={musicUrl} onChange={e => setMusicUrl(e.target.value)} onBlur={saveImageSettings} placeholder="Direct audio URL (.mp3, .ogg...)" style={{ width: '100%', marginBottom: '.75rem' }} />

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.25rem', fontWeight: 600 }}>Jinn Art</div>
            <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.75rem' }}>
              <input value={jinnArtUrl} onChange={e => setJinnArtUrl(e.target.value)} onBlur={saveImageSettings} placeholder="https://..." style={{ flex: 1 }} />
              <button className="btn btn-sm" style={{ fontSize: 11, flexShrink: 0 }} onClick={() => { setJinnArtUrl(DEFAULT_JINN_ART_URL); saveImageSettings(); }}>Use Default</button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.5rem', fontWeight: 600 }}>Encounter Setting Backgrounds</div>
            {SETTINGS.map(s => (
              <div key={s} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.35rem' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 120 }}>{s}</span>
                <input value={settingUrls[s] || ''} onChange={e => setSettingUrls(u => ({ ...u, [s]: e.target.value }))} onBlur={saveImageSettings} placeholder="https://..." style={{ flex: 1, fontSize: 12 }} />
              </div>
            ))}

            <div style={{ marginTop: '.75rem', display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.25rem', fontWeight: 600 }}>Portrait Scale</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <button className="rep-btn" onClick={() => setPortraitScale(s => Math.round(Math.max(0.5, s - 0.1) * 10) / 10)}>−</button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', minWidth: 36, textAlign: 'center' }}>{portraitScale.toFixed(1)}×</span>
                  <button className="rep-btn" onClick={() => setPortraitScale(s => Math.round(Math.min(2.0, s + 0.1) * 10) / 10)}>+</button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: '.2rem' }}>Affects character sheet and encounter cards globally.</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-p btn-sm" onClick={saveImageSettings}>{imagesSaved ? '✓ Saved' : 'Save Image Settings'}</button>
            <button className="btn btn-sm" onClick={() => {
              setMapUrl(DEFAULT_MAP_URL); setMapUrlNight(DEFAULT_MAP_URL_NIGHT); setJinnArtUrl(DEFAULT_JINN_ART_URL);
              setTimeout(saveImageSettings, 0);
            }}>Default All</button>
          </div>
        </>
      )}

      {/* ── CAMPAIGN ── */}
      {subTab === 'campaign' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title"><i className="ti ti-database-export" style={{ marginRight: 6 }} />Campaign Backup</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Export saves all characters, NPCs, quests, map pins, faction reputation, inventory, and session archive to a single JSON file. Import restores from that file — this overwrites everything.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Export Campaign</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Downloads a .json backup of all game data</div>
              </div>
              <button className="btn btn-p btn-sm" onClick={handleExport}><i className="ti ti-download" style={{ fontSize: 13, marginRight: 4 }} />Export</button>
            </div>
            {exportStatus && <div style={{ fontSize: 12, color: 'var(--green)', padding: '.3rem 0' }}>{exportStatus}</div>}
            <div style={{ padding: '.6rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: importStatus ? '.5rem' : 0 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Import Campaign</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Restore from a .json backup — overwrites current data</div>
                </div>
                <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileSelect} />
                {importStep === 0 && <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><i className="ti ti-upload" style={{ fontSize: 13, marginRight: 4 }} />Select File</button>}
                {importStep === 1 && <div style={{ display: 'flex', gap: 4 }}><button className="btn btn-sm btn-d" onClick={handleImportConfirm}>Confirm Import</button><button className="btn btn-sm" onClick={() => { setImportStep(0); setImportStatus(''); setPendingBackup(null); }}>Cancel</button></div>}
                {importStep === 2 && <span style={{ fontSize: 12, color: 'var(--gold)' }}>Importing...</span>}
                {importStep === 3 && <button className="btn btn-sm" onClick={() => window.location.reload()}>Reload Page</button>}
              </div>
              {importStatus && <div style={{ fontSize: 12, color: importStep === 3 ? 'var(--green)' : importStep === 1 ? 'var(--gold)' : 'var(--text-muted)', lineHeight: 1.5 }}>{importStatus}</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ color: 'var(--red)' }}>
              <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />Data Management — Destructive
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              All wipes are permanent and cannot be undone. Each requires a confirmation click.
            </div>
            <DangerAction label="⚠ WIPE EVERYTHING" description="Deletes ALL campaign data — characters, NPCs, sessions, quests, shops, map pins, inventory, reputation. Use after exporting a backup to hand the tool to a new group." onConfirm={wipeEverything} />
            <div style={{ height: 1, background: 'var(--border)', margin: '.5rem 0' }} />
            <DangerAction label="Clear Active Session" description="Ends the current session without archiving it — wipes encounter state and marks it inactive" onConfirm={clearActiveSession} />
            <DangerAction label="Wipe Current Encounter" description="Resets the in-progress encounter back to idle WITHOUT ending the session — use for a stuck/corrupted encounter" onConfirm={wipeCurrentEncounter} />
            <DangerAction label="Wipe Saved Encounters" description="Clears every session's prepared/drafted encounters — does not touch the sessions themselves or any live encounter" onConfirm={wipeSavedEncounters} />
            <DangerAction label="Wipe All Sessions" description="Ends any active session AND deletes every session row including archived recaps" onConfirm={wipeAllSessions} />
            <DangerAction label="Wipe Saved Sessions" description="Deletes only prepared (not-yet-started) sessions — leaves the active session and archived history untouched" onConfirm={wipeSavedSessions} />
            <DangerAction label="Wipe All Shops" description="Removes every shop and all their inventory — cannot be undone" onConfirm={wipeAllShops} />
            <DangerAction label="Wipe All Map Pins" description="Removes every pin from both map layers" onConfirm={() => wipeTable('map_pins')} />
            <DangerAction label="Wipe Party Inventory" description="Clears all group inventory items and resets copper to 0" onConfirm={async () => { const { error } = await supabase.from('group_inventory').update({ copper: 0, items: [] }).eq('game_id', GAME_ID); return error ? { ok: false, message: error.message } : { ok: true, message: 'Inventory cleared' }; }} />
            <DangerAction label="Wipe GM Inventory" description="Clears the GM's Inventory staging list (Preparation \u2192 Item Creator) — items already handed off are unaffected" onConfirm={wipeGmInventory} />
            <DangerAction label="Wipe All Quests" description="Removes all quest objectives from all sessions" onConfirm={() => wipeTable('quests', {}, onWipe.quests)} />
            <DangerAction label="Wipe Encounter Log" description="Clears the history of past completed encounters (name, setting, party, enemies, rounds) — this is a record of what happened, not the live in-progress encounter." onConfirm={() => wipeTable('encounter_log', {}, onWipe.encounterLog)} />
            <DangerAction label="Wipe All NPCs" description="Removes every NPC — both Quick NPCs (the log) and Full NPCs (promoted character-sheet NPCs)." onConfirm={async () => {
              const a = await wipeTable('npcs', {}, onWipe.npcs);
              const b = await wipeTable('characters', { is_npc: true }, onWipe.characters);
              if (!a.ok || !b.ok) return { ok: false, message: [!a.ok && a.message, !b.ok && b.message].filter(Boolean).join('; ') };
              return { ok: true, message: `${a.message} (Quick), ${b.message} (Full)` };
            }} />
            <DangerAction label="Wipe Player Characters" description="Deletes every player character — use before a new campaign. Does not touch Full NPCs; use Wipe All NPCs for those." onConfirm={() => wipeTable('characters', { is_npc: false }, onWipe.characters)} />
            <DangerAction label="Reset Faction Reputation" description="Sets all faction reputations back to 0" onConfirm={async () => { const { error } = await supabase.from('faction_reputation').update({ reputation: 0 }).eq('game_id', GAME_ID); return error ? { ok: false, message: error.message } : { ok: true, message: 'Reputation reset' }; }} />
          </div>
        </>
      )}

      {/* ── PLAYERS & PASSWORDS ── */}
      {subTab === 'players' && (
        <>
          <PlayerAccounts />

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-title">Passwords</div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.3rem' }}>GM Password</div>
              {isDeveloper ? (
                <div>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.25rem' }}>
                    <input type="text" value={gmPwEdit} onChange={e => setGmPwEdit(e.target.value)}
                      placeholder="New GM password"
                      style={{ fontSize: 13, width: 160, fontFamily: 'monospace' }} />
                    <button className="btn btn-sm btn-p" disabled={!gmPwEdit.trim()} onClick={async () => {
                      const { error } = await supabase.from('games').update({ gm_password: gmPwEdit.trim() }).eq('id', GAME_ID);
                      if (error) { setGmPwStatus('Error saving — does games table have a gm_password column?'); }
                      else { setGmPwSaved(true); setGmPwStatus(''); setGmPwEdit(''); setTimeout(() => setGmPwSaved(false), 3000); }
                    }}>{gmPwSaved ? '✓ Saved' : 'Update'}</button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Developer-only. Takes effect immediately for new logins — no code change or redeploy needed.</div>
                  {gmPwStatus && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: '.25rem' }}>{gmPwStatus}</div>}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Set by the developer. Not shown here.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

