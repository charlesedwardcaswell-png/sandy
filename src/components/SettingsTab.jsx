import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';

const PLAYER_PASSWORD = 'test';
const BACKUP_FORMAT_VERSION = 1; // bump only if the backup JSON's own shape changes, not for new tables/columns

// ── Export campaign ───────────────────────────────────────────────────────────
async function exportCampaign() {
  const tables = ['characters','npcs','quests','map_pins','faction_reputation','group_inventory','encounter_log','sessions'];
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

  const ORDER = ['characters','npcs','quests','map_pins','faction_reputation','group_inventory','encounter_log','sessions'];

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
  const handleClick = async () => {
    if (step === 0) { setStep(1); return; }
    if (step === 1) { await onConfirm(); setStep(2); setTimeout(() => setStep(0), 2000); }
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
          ? <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Done</span>
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
export default function SettingsTab({ onWipe = {} }) {
  const [playerPw, setPlayerPw] = useState(PLAYER_PASSWORD);
  const [pwSaved, setPwSaved] = useState(false);
  const [status, setStatus] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importStep, setImportStep] = useState(0);
  const [pendingBackup, setPendingBackup] = useState(null);
  const fileRef = useRef(null);

  const SETTINGS = ['Streets','Sewers','Desert','Palace','Indoors',"Khan's Warcamp","Barracks Lounge"];
  const [mapUrl, setMapUrl] = useState('https://i.imgur.com/6fuMHqq.jpeg');
  const [mapUrlNight, setMapUrlNight] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [settingUrls, setSettingUrls] = useState({});
  const [roundLimits, setRoundLimits] = useState({ Action: '', Intrigue: '', Travel: '', Downtime: '' });
  const [imagesSaved, setImagesSaved] = useState(false);

  React.useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      if (data?.settings) {
        if (data.settings.map_url) setMapUrl(data.settings.map_url);
        if (data.settings.map_url_night) setMapUrlNight(data.settings.map_url_night);
        if (data.settings.music_url) setMusicUrl(data.settings.music_url);
        if (data.settings.setting_urls) setSettingUrls(data.settings.setting_urls);
        if (data.settings.round_limits) setRoundLimits({ Action: '', Intrigue: '5', Travel: '3', Downtime: '2', ...data.settings.round_limits });
      }
    });
  }, []);

  const saveImageSettings = async () => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), map_url: mapUrl, map_url_night: mapUrlNight, music_url: musicUrl, setting_urls: settingUrls, round_limits: roundLimits } })
      .eq('id', GAME_ID);
    if (!error) { setImagesSaved(true); setTimeout(() => setImagesSaved(false), 2500); }
    else { console.error('saveImageSettings failed:', error.message); setImagesSaved(false); }
  };

  const savePlayerPassword = async () => {
    const { error } = await supabase.from('games').update({ player_password: playerPw }).eq('id', GAME_ID);
    if (error) { setStatus('Error saving — does games table have player_password column?'); }
    else { setPwSaved(true); setStatus('Updated. Change in AuthScreen.jsx → PLAYER_PASSWORD.'); setTimeout(() => setPwSaved(false), 3000); }
  };

  const wipeTable = async (table, filter = {}, afterRefetch) => {
    let q = supabase.from(table).delete();
    Object.entries({ game_id: GAME_ID, ...filter }).forEach(([k, v]) => { q = q.eq(k, v); });
    const { error } = await q;
    if (error) { console.error(`Wipe ${table} failed:`, error.message); return; }
    if (afterRefetch) afterRefetch();
  };

  const clearActiveSession = async () => {
    // Find the active session
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('game_id', GAME_ID)
      .eq('is_active', true)
      .single();
    if (error || !data) { console.warn('No active session to clear'); return; }
    // End it without archiving — wipe encounter_data, mark inactive, no recap
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ is_active: false, encounter_data: null, closed_at: new Date().toISOString() })
      .eq('id', data.id);
    if (updateError) { console.error('clearActiveSession failed:', updateError.message); }
    if (onWipe.session) onWipe.session();
  };

  const wipeAllSessions = async () => {
    // First kill the active session if one exists
    await supabase
      .from('sessions')
      .update({ is_active: false, encounter_data: null, closed_at: new Date().toISOString() })
      .eq('game_id', GAME_ID)
      .eq('is_active', true);
    // Then delete all session rows
    const { error } = await supabase.from('sessions').delete().eq('game_id', GAME_ID);
    if (error) { console.error('wipeAllSessions failed:', error.message); return; }
    if (onWipe.session) onWipe.session();
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

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        <i className="ti ti-settings" style={{ marginRight: 8 }} />GM Settings
      </div>

      {/* Image Settings */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><i className="ti ti-photo" style={{ marginRight: 6 }} />Background Images</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Paste direct image URLs (imgur, etc). Leave blank to use defaults. Changes take effect after saving.
        </div>

        {/* Map background */}
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', fontWeight: 600 }}>City Map — Day (Map Tab)</div>
          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
            <input value={mapUrl} onChange={e => setMapUrl(e.target.value)}
              placeholder="https://i.imgur.com/6fuMHqq.jpeg"
              style={{ flex: 1, fontSize: 12 }} />
            <button className="btn btn-sm" style={{ fontSize: 11, flexShrink: 0 }}
              onClick={() => setMapUrl('https://i.imgur.com/6fuMHqq.jpeg')}
              title="Reset to default map">↺</button>
          </div>
        </div>

        {/* Night map background */}
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', fontWeight: 600 }}>
            City Map — Night <span style={{ fontWeight: 400 }}>(auto-switches at Evening &amp; Night)</span>
          </div>
          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
            <input value={mapUrlNight} onChange={e => setMapUrlNight(e.target.value)}
              placeholder="https://... (night/evening variant)"
              style={{ flex: 1, fontSize: 12 }} />
            {mapUrlNight && (
              <button className="btn btn-sm" style={{ fontSize: 11, flexShrink: 0 }}
                onClick={() => setMapUrlNight('')}
                title="Clear night map">✕</button>
            )}
          </div>
        </div>

        {/* Background music */}
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', fontWeight: 600 }}>
            Background Music URL <span style={{ fontWeight: 400 }}>(mp3/ogg — toggle ♪ in top bar)</span>
          </div>
          <input value={musicUrl} onChange={e => setMusicUrl(e.target.value)}
            placeholder="https://... (direct .mp3 or .ogg link)"
            style={{ width: '100%', fontSize: 12 }} />
        </div>

        {/* Per-setting backgrounds */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.4rem', fontWeight: 600 }}>Encounter Setting Backgrounds <span style={{ fontWeight: 400 }}>(shown on battle grid at 25% opacity)</span></div>
        {SETTINGS.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 120 }}>{s}</span>
            <input value={settingUrls[s] || ''} onChange={e => setSettingUrls(u => ({ ...u, [s]: e.target.value }))}
              placeholder="Image URL (optional)" style={{ flex: 1, fontSize: 12 }} />
          </div>
        ))}

        {/* Round limits */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.4rem', marginTop: '.75rem', fontWeight: 600 }}>Round Limits per Encounter Type</div>
        {['Action','Intrigue','Travel','Downtime'].map(t => {
          const val = roundLimits[t]; // '' or null = unlimited; number string = limited
          const isUnlimited = !val || val === '';
          const numVal = isUnlimited ? null : parseInt(val, 10);
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 80 }}>{t}</span>
              <button className="rep-btn" onClick={() => {
                if (isUnlimited) return; // already unlimited
                const next = numVal - 1;
                setRoundLimits(r => ({ ...r, [t]: next <= 0 ? '' : String(next) }));
              }} disabled={isUnlimited}>−</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: isUnlimited ? 'var(--text-muted)' : 'var(--gold)', minWidth: 64, textAlign: 'center', fontStyle: isUnlimited ? 'italic' : 'normal' }}>
                {isUnlimited ? 'Unlimited' : `${numVal} rounds`}
              </span>
              <button className="rep-btn" onClick={() => {
                const next = isUnlimited ? 1 : numVal + 1;
                setRoundLimits(r => ({ ...r, [t]: String(next) }));
              }}>+</button>
              {!isUnlimited && (
                <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', color: 'var(--text-muted)' }}
                  onClick={() => setRoundLimits(r => ({ ...r, [t]: '' }))}>∞</button>
              )}
            </div>
          );
        })}

        <button className="btn btn-p btn-sm" style={{ marginTop: '.75rem' }} onClick={saveImageSettings}>
          {imagesSaved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>

      {/* Campaign Backup */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><i className="ti ti-database-export" style={{ marginRight: 6 }} />Campaign Backup</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Export saves all characters, NPCs, quests, map pins, faction reputation, inventory, and session archive to a single JSON file. Import restores from that file — this overwrites everything.
        </div>

        {/* Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Export Campaign</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Downloads a .json backup of all game data</div>
          </div>
          <button className="btn btn-p btn-sm" onClick={handleExport}>
            <i className="ti ti-download" style={{ fontSize: 13, marginRight: 4 }} />Export
          </button>
        </div>
        {exportStatus && <div style={{ fontSize: 12, color: 'var(--green)', padding: '.3rem 0' }}>{exportStatus}</div>}

        {/* Import */}
        <div style={{ padding: '.6rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: importStatus ? '.5rem' : 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Import Campaign</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Restore from a .json backup — overwrites current data</div>
            </div>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileSelect} />
            {importStep === 0 && (
              <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                <i className="ti ti-upload" style={{ fontSize: 13, marginRight: 4 }} />Select File
              </button>
            )}
            {importStep === 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-sm btn-d" onClick={handleImportConfirm}>Confirm Import</button>
                <button className="btn btn-sm" onClick={() => { setImportStep(0); setImportStatus(''); setPendingBackup(null); }}>Cancel</button>
              </div>
            )}
            {importStep === 2 && <span style={{ fontSize: 12, color: 'var(--gold)' }}>Importing...</span>}
            {importStep === 3 && <button className="btn btn-sm" onClick={() => window.location.reload()}>Reload Page</button>}
          </div>
          {importStatus && (
            <div style={{ fontSize: 12, color: importStep === 3 ? 'var(--green)' : importStep === 1 ? 'var(--gold)' : 'var(--text-muted)', lineHeight: 1.5 }}>
              {importStatus}
            </div>
          )}
        </div>
      </div>

      {/* Player Accounts */}
      <PlayerAccounts />

      {/* Passwords */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">Passwords</div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.3rem' }}>GM Password</div>
          <div style={{ fontSize: 13, fontFamily: 'monospace', padding: '.4rem .6rem', background: 'var(--bg-panel)', borderRadius: 4, display: 'inline-block', color: 'var(--text-secondary)' }}>gm1234</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.25rem' }}>Change in <code>src/data/constants.js</code> → GM_PASSWORD</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Player Password</div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <input type="text" value={playerPw} onChange={e => { setPlayerPw(e.target.value); setPwSaved(false); }}
              style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && savePlayerPassword()} />
            <button className="btn btn-p btn-sm" onClick={savePlayerPassword}>{pwSaved ? '✓ Saved' : 'Save'}</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.25rem' }}>Change in <code>src/components/AuthScreen.jsx</code> → PLAYER_PASSWORD</div>
          {status && <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: '.4rem' }}>{status}</div>}
        </div>
      </div>

      {/* Data management */}
      <div className="card">
        <div className="card-title" style={{ color: 'var(--red)' }}>
          <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />Data Management — Destructive
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
          All wipes are permanent and cannot be undone. Each requires a confirmation click.
        </div>
        <DangerAction label="Clear Active Session" description="Ends the current session without archiving it — wipes encounter state and marks it inactive" onConfirm={clearActiveSession} />
        <DangerAction label="Wipe All Sessions" description="Ends any active session AND deletes every session row including archived recaps" onConfirm={wipeAllSessions} />
        <DangerAction label="Wipe All Map Pins" description="Removes every pin from both map layers" onConfirm={() => wipeTable('map_pins')} />
        <DangerAction label="Wipe Party Inventory" description="Clears all group inventory items and resets copper to 0"
          onConfirm={async () => { await supabase.from('group_inventory').update({ copper: 0, items: [] }).eq('game_id', GAME_ID); }} />
        <DangerAction label="Wipe All Quests" description="Removes all quest objectives from all sessions" onConfirm={() => wipeTable('quests', {}, onWipe.quests)} />
        <DangerAction label="Wipe Encounter Log" description="Clears the full encounter history" onConfirm={() => wipeTable('encounter_log')} />
        <DangerAction label="Wipe All NPCs" description="Removes every NPC from the log" onConfirm={() => wipeTable('npcs', {}, onWipe.npcs)} />
        <DangerAction label="Wipe All Characters" description="Deletes every player character — use before a new campaign" onConfirm={() => wipeTable('characters', {}, onWipe.characters)} />
        <DangerAction label="Reset Faction Reputation" description="Sets all faction reputations back to 0"
          onConfirm={async () => { await supabase.from('faction_reputation').update({ reputation: 0 }).eq('game_id', GAME_ID); }} />
      </div>
    </div>
  );
}
