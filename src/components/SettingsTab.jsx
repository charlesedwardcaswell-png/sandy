import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';

const PLAYER_PASSWORD = 'test';

// ── Export campaign ───────────────────────────────────────────────────────────
async function exportCampaign() {
  const tables = ['characters','npcs','quests','map_pins','faction_reputation','group_inventory','encounter_log','sessions'];
  const backup = { version: 1, exported_at: new Date().toISOString(), game_id: GAME_ID, tables: {} };

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
async function importCampaign(backup) {
  if (!backup?.tables || backup.version !== 1) throw new Error('Invalid backup file');

  const ORDER = ['characters','npcs','quests','map_pins','faction_reputation','group_inventory','encounter_log','sessions'];

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
        <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {step === 1 && <span style={{ fontSize: 10, color: 'var(--red)' }}>Are you sure?</span>}
        {step === 2
          ? <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Done</span>
          : <button className={`btn btn-sm ${step === 1 ? 'btn-d' : ''}`} onClick={handleClick}>
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
  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importStep, setImportStep] = useState(0);
  const [pendingBackup, setPendingBackup] = useState(null);
  const fileRef = useRef(null);

  const SETTINGS = ['Streets','Sewers','Desert','Palace','Indoors',"Khan's Warcamp","Barracks Lounge"];
  const [mapUrl, setMapUrl] = useState('https://i.imgur.com/6fuMHqq.jpeg');
  const [settingUrls, setSettingUrls] = useState({});
  const [imagesSaved, setImagesSaved] = useState(false);

  React.useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      if (data?.settings) {
        if (data.settings.map_url) setMapUrl(data.settings.map_url);
        if (data.settings.setting_urls) setSettingUrls(data.settings.setting_urls);
      }
    });
  }, []);

  const saveImageSettings = async () => {
    const { error } = await supabase.from('games')
      .update({ settings: { map_url: mapUrl, setting_urls: settingUrls } })
      .eq('id', GAME_ID);
    if (!error) { setImagesSaved(true); setTimeout(() => setImagesSaved(false), 2500); }
  };

  const savePlayerPassword = async () => {
    const { error } = await supabase.from('games').update({ player_password: playerPw }).eq('id', GAME_ID);
    if (error) { setStatus('Error saving — does games table have player_password column?'); }
    else { setPwSaved(true); setStatus('Updated. Change in AuthScreen.jsx → PLAYER_PASSWORD.'); setTimeout(() => setPwSaved(false), 3000); }
  };

  const wipeTable = async (table, filter = {}) => {
    let q = supabase.from(table).delete();
    Object.entries({ game_id: GAME_ID, ...filter }).forEach(([k, v]) => { q = q.eq(k, v); });
    const { error } = await q;
    if (error) console.error(`Wipe ${table} failed:`, error.message);
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
        if (!backup?.tables || backup.version !== 1) { setImportStatus('Invalid backup file.'); return; }
        const total = Object.values(backup.tables).reduce((s, t) => s + t.length, 0);
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
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        <i className="ti ti-settings" style={{ marginRight: 8 }} />GM Settings
      </div>

      {/* Image Settings */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><i className="ti ti-photo" style={{ marginRight: 6 }} />Background Images</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Paste direct image URLs (imgur, etc). Leave blank to use defaults. Changes take effect after saving.
        </div>

        {/* Map background */}
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem', fontWeight: 600 }}>City Map (Map Tab)</div>
          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
            <input value={mapUrl} onChange={e => setMapUrl(e.target.value)}
              placeholder="https://i.imgur.com/6fuMHqq.jpeg"
              style={{ flex: 1, fontSize: 10 }} />
            <button className="btn btn-sm" style={{ fontSize: 9, flexShrink: 0 }}
              onClick={() => setMapUrl('https://i.imgur.com/6fuMHqq.jpeg')}
              title="Reset to default map">↺</button>
          </div>
        </div>

        {/* Per-setting backgrounds */}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.4rem', fontWeight: 600 }}>Encounter Setting Backgrounds <span style={{ fontWeight: 400 }}>(shown on battle grid at 25% opacity)</span></div>
        {SETTINGS.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', minWidth: 120 }}>{s}</span>
            <input value={settingUrls[s] || ''} onChange={e => setSettingUrls(u => ({ ...u, [s]: e.target.value }))}
              placeholder="Image URL (optional)" style={{ flex: 1, fontSize: 10 }} />
          </div>
        ))}

        <button className="btn btn-p btn-sm" style={{ marginTop: '.75rem' }} onClick={saveImageSettings}>
          {imagesSaved ? '✓ Saved' : 'Save Image Settings'}
        </button>
      </div>

      {/* Campaign Backup */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><i className="ti ti-database-export" style={{ marginRight: 6 }} />Campaign Backup</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Export saves all characters, NPCs, quests, map pins, faction reputation, inventory, and session archive to a single JSON file. Import restores from that file — this overwrites everything.
        </div>

        {/* Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Export Campaign</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Downloads a .json backup of all game data</div>
          </div>
          <button className="btn btn-p btn-sm" onClick={handleExport}>
            <i className="ti ti-download" style={{ fontSize: 11, marginRight: 4 }} />Export
          </button>
        </div>
        {exportStatus && <div style={{ fontSize: 10, color: 'var(--green)', padding: '.3rem 0' }}>{exportStatus}</div>}

        {/* Import */}
        <div style={{ padding: '.6rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: importStatus ? '.5rem' : 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Import Campaign</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Restore from a .json backup — overwrites current data</div>
            </div>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileSelect} />
            {importStep === 0 && (
              <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                <i className="ti ti-upload" style={{ fontSize: 11, marginRight: 4 }} />Select File
              </button>
            )}
            {importStep === 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-sm btn-d" onClick={handleImportConfirm}>Confirm Import</button>
                <button className="btn btn-sm" onClick={() => { setImportStep(0); setImportStatus(''); setPendingBackup(null); }}>Cancel</button>
              </div>
            )}
            {importStep === 2 && <span style={{ fontSize: 10, color: 'var(--gold)' }}>Importing...</span>}
            {importStep === 3 && <button className="btn btn-sm" onClick={() => window.location.reload()}>Reload Page</button>}
          </div>
          {importStatus && (
            <div style={{ fontSize: 10, color: importStep === 3 ? 'var(--green)' : importStep === 1 ? 'var(--gold)' : 'var(--text-muted)', lineHeight: 1.5 }}>
              {importStatus}
            </div>
          )}
        </div>
      </div>

      {/* Passwords */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">Passwords</div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.3rem' }}>GM Password</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', padding: '.4rem .6rem', background: 'var(--bg-panel)', borderRadius: 4, display: 'inline-block', color: 'var(--text-secondary)' }}>gm1234</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.25rem' }}>Change in <code>src/data/constants.js</code> → GM_PASSWORD</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Player Password</div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <input type="text" value={playerPw} onChange={e => { setPlayerPw(e.target.value); setPwSaved(false); }}
              style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && savePlayerPassword()} />
            <button className="btn btn-p btn-sm" onClick={savePlayerPassword}>{pwSaved ? '✓ Saved' : 'Save'}</button>
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
        <DangerAction label="Wipe All Map Pins" description="Removes every pin from both map layers" onConfirm={() => wipeTable('map_pins')} />
        <DangerAction label="Wipe All Quests" description="Removes all quest objectives from all sessions" onConfirm={() => wipeTable('quests')} />
        <DangerAction label="Wipe Encounter Log" description="Clears the full encounter history" onConfirm={() => wipeTable('encounter_log')} />
        <DangerAction label="Wipe Session Archive" description="Deletes all archived sessions and their recaps" onConfirm={() => wipeTable('sessions', { is_active: false })} />
        <DangerAction label="Wipe All NPCs" description="Removes every NPC from the log" onConfirm={() => wipeTable('npcs')} />
        <DangerAction label="Wipe All Characters" description="Deletes every player character — use before a new campaign" onConfirm={() => wipeTable('characters')} />
        <DangerAction label="Reset Faction Reputation" description="Sets all faction reputations back to 0"
          onConfirm={async () => { await supabase.from('faction_reputation').update({ reputation: 0 }).eq('game_id', GAME_ID); }} />
      </div>
    </div>
  );
}
