import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { Loading } from './components/UI';
import { playYourTurn } from './lib/sounds';
import CharacterTab from './components/CharacterTab';
import EncounterTab from './components/EncounterTab';
import MapTab from './components/MapTab';
import NPCTab from './components/NPCTab';
import QuestTab from './components/QuestTab';
import PartyTab from './components/PartyTab';
import LogTab from './components/LogTab';
import SessionEndModal from './components/SessionEndModal';
import SettingsTab from './components/SettingsTab';
import PCTurnPanel from './components/PCTurnPanel';
import DiceModal from './components/DiceModal';
import DuelPane from './components/DuelPane';
import { BOOK_TOC, DRIVE_FOLDER_URL, GAME_ID } from './data/constants';
import {
  useCharacters, useActiveSession, useNPCs, useQuests,
  useMapPins, useFactionReputation, useEncounterLog,
  useGroupInventory, useSessionLog,
} from './hooks/useSupabase';

// ── Book Reference Dropdown ────────────────────────────────────────────────────
function BookDropdown() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPage = (chapter) => {
    const url = chapter.fileId
      ? `https://drive.google.com/file/d/${chapter.fileId}/view`
      : DRIVE_FOLDER_URL;
    window.open(url, '_blank');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="LBS Rulebook" style={{
        background: 'none', border: '1px solid var(--border)', borderRadius: 5,
        color: open ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
        padding: '3px 8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <i className="ti ti-book-2" style={{ fontSize: 14 }} />
        <span style={{ fontSize: 11 }}>Rulebook</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', zIndex: 500,
          background: 'var(--bg-panel)', border: '1px solid var(--border)',
          borderRadius: 7, boxShadow: '0 8px 32px rgba(0,0,0,.7)',
          width: 320, maxHeight: '80vh', overflowY: 'auto',
        }}>
          <div style={{ padding: '.6rem .75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-book-2" style={{ color: 'var(--gold)', fontSize: 15 }} />
            <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>Legend of the Burning Sands</span>
            <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer"
              style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none' }}>
              Open Folder ↗
            </a>
          </div>

          {BOOK_TOC.map((chapter, ci) => (
            <div key={ci} style={{ borderBottom: '1px solid rgba(107,78,40,.2)' }}>
              {/* Chapter row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '.4rem .75rem', cursor: 'pointer',
                background: expanded === ci ? 'rgba(200,150,42,.07)' : 'transparent' }}
                onClick={() => setExpanded(expanded === ci ? null : ci)}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 30 }}>p.{chapter.page}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{chapter.chapter}</span>
                <button onClick={e => { e.stopPropagation(); openPage(chapter); }}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--gold-dim)', cursor: 'pointer', fontSize: 10, padding: '1px 5px' }}>
                  {chapter.fileId ? 'Open PDF ↗' : 'Folder ↗'}
                </button>
                <i className={`ti ${expanded === ci ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 11, color: 'var(--text-muted)' }} />
              </div>
              {/* Subsections */}
              {expanded === ci && (
                <div style={{ paddingBottom: '.25rem' }}>
                  {chapter.sections.map((s, si) => (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '.2rem .75rem .2rem 1.5rem', cursor: 'pointer' }}
                      onClick={() => openPage(chapter)}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 30 }}>p.{s.page}</span>
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{s.title}</span>
                      <i className="ti ti-external-link" style={{ fontSize: 10, color: 'var(--text-muted)' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ padding: '.5rem .75rem', fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
            To link specific PDFs: add fileId values to BOOK_TOC in constants.js
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [authMode, setAuthMode] = useState(() => localStorage.getItem('sandy_auth_mode') || null);
  const [playerUsername, setPlayerUsername] = useState(() => localStorage.getItem('sandy_player_username') || '');
  const isGM = authMode === 'gm';
  const isObserver = authMode === 'observer';
  const isPlayer = authMode === 'player';

  const { characters, loading: charsLoading, createCharacter, updateCharacter, deleteCharacter, refetch: refetchChars } = useCharacters();
  const { session, allSessions, loading: sessLoading, startSession, activateSession, createPrepSession, endSession, saveEncounter, saveEventLog, savePreparedEncounters, refetch: refetchSession } = useActiveSession();
  const { npcs, createNPC, updateNPC, refetch: refetchNpcs } = useNPCs();
  const { quests, createQuest, updateQuest, refetch: refetchQuests } = useQuests(session?.id);
  const { pins, createPin, updatePin, deletePin } = useMapPins();
  const { reps, updateRep } = useFactionReputation();
  const { log: encounterLog, addEntry: addEncounterEntry } = useEncounterLog();
  const { inventory, updateInventory } = useGroupInventory();
  const { sessionLog, refetch: refetchSessionLog } = useSessionLog();

  const [encounter, setEncounter] = useState({
    state: 'idle', setup: { type: null, setting: null, desc: '', name: '', selectedNPCs: [] },
    combatants: [], activeTurn: 0, dmgBanner: null, envQuirk: null, round: 1,
  });

  // Load encounter state from session — only for non-GM clients
  // Use JSON stringify as dependency to detect actual content changes
  const encounterDataJson = session?.encounter_data ? JSON.stringify(session.encounter_data) : null;
  useEffect(() => {
    if (isGM) return;
    if (session?.encounter_data) {
      setEncounter(session.encounter_data);
    } else if (session && !session.encounter_data) {
      setEncounter({ state: 'idle', setup: { type: null, setting: null, desc: '', name: '', selectedNPCs: [] }, combatants: [], activeTurn: 0, dmgBanner: null, envQuirk: null, round: 1, timeOfDay: 'Morning', campaignDay: 1, campaignWeek: 1 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, encounterDataJson, isGM]);

  // Debounced save — write to Supabase 800ms after last change
  const saveTimer = useRef(null);
  const saveEncounterDebounced = useCallback((state) => {
    if (!session?.id) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveEncounter(session.id, state);
    }, 800);
  }, [session?.id, saveEncounter]);

  const [skillLog, setSkillLog] = useState({});
  const logSkillUse = (skillName) => {
    setSkillLog(prev => ({
      ...prev,
      [skillName]: { session: (prev[skillName]?.session || 0) + 1, total: (prev[skillName]?.total || 0) + 1 },
    }));
  };

  const [ticker, setTicker] = useState([]);
  const [fullEventLog, setFullEventLog] = useState([]);
  const audioRef = useRef(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicUrl, setMusicUrlState] = useState('');

  // Load music URL from games settings on mount
  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      if (data?.settings?.music_url) setMusicUrlState(data.settings.music_url);
    });
  }, []);

  const push = (icon, text, opts = {}) => {
    const entry = { id: Date.now() + Math.random(), icon, text, ts: new Date().toISOString(), highlight: !!opts.highlight, gmOnly: !!opts.gmOnly };
    setTicker(prev => [entry, ...prev].slice(0, 20));
    setFullEventLog(prev => [entry, ...prev]);
  };

  // tab state — persisted in localStorage so players return to last tab on reload
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem('sandy_tab');
      return saved && ['character','encounter','map','npc','quest','party','log','settings'].includes(saved) ? saved : 'character';
    } catch { return 'character'; }
  });
  const [isPCView, setIsPCView] = useState(false);
  const [showSessionEnd, setShowSessionEnd] = useState(false);
  const [viewCharId, setViewCharId] = useState(null);
  const [globalModal, setGlobalModal] = useState(null); // dice modal accessible from any tab

  // My character — stored in localStorage, player picks once
  const [myCharId, setMyCharId] = useState(() => localStorage.getItem('sandy_my_char_id') || null);

  // Wrapped setEncounter — fires ticker; only GM saves to Supabase
  const handleSetEncounter = useCallback((updater) => {
    setEncounter(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (prev.state !== 'active' && next.state === 'active') {
        setTimeout(() => push('ti-swords', `Encounter started: ${next.setup?.name || next.setup?.type || 'Combat'}`), 0);
      }
      if (prev.state === 'active' && next.state === 'idle') {
        setTimeout(() => push('ti-flag', 'Encounter ended'), 0);
      }
      if (next.state === 'active' && next.activeTurn !== prev.activeTurn) {
        const active = next.combatants[next.activeTurn % Math.max(1, next.combatants.length)];
        if (active?.type === 'pc') {
          const isMine = active.id === myCharId;
          if (isMine) playYourTurn();
          setTimeout(() => push('ti-bolt', `${active.name}'s turn`, { highlight: isMine }), 0);
        }
      }
      if (isGM) saveEncounterDebounced(next);
      return next;
    });
  }, [saveEncounterDebounced, isGM, myCharId]);

  const safeChars = characters.filter(Boolean);

  const TIMES = ['Dawn','Morning','Midday','Afternoon','Dusk','Evening','Night'];
  const TIME_ICONS = { Dawn: '🌅', Morning: '☀️', Midday: '☀️', Afternoon: '🌤️', Dusk: '🌇', Evening: '🌆', Night: '🌙' };
  const [timeOfDay, setTimeOfDay] = useState('Morning');
  const [campaignDay, setCampaignDay] = useState(1);
  const [campaignWeek, setCampaignWeek] = useState(1);

  useEffect(() => {
    if (encounter?.timeOfDay) setTimeOfDay(encounter.timeOfDay);
    if (encounter?.campaignDay) setCampaignDay(encounter.campaignDay);
    if (encounter?.campaignWeek) setCampaignWeek(encounter.campaignWeek);
  }, [encounter?.timeOfDay, encounter?.campaignDay, encounter?.campaignWeek]);

  if (!authMode) {
    return (
      <AuthScreen
        onGMLogin={() => { localStorage.setItem('sandy_auth_mode', 'gm'); setAuthMode('gm'); }}
        onPlayerLogin={(username) => { localStorage.setItem('sandy_auth_mode', 'player'); localStorage.setItem('sandy_player_username', username || 'Player'); setAuthMode('player'); setPlayerUsername(username || 'Player'); }}
        onObserver={() => { localStorage.setItem('sandy_auth_mode', 'observer'); setAuthMode('observer'); }}
      />
    );
  }

  if (charsLoading || sessLoading) return <Loading message="Loading game data..." />;

  const encActive = encounter.state === 'active';
  const sessionNum = session?.session_number || (sessionLog.length > 0 ? Math.max(...sessionLog.map(s => s.session_number || 0)) + 1 : 1);
  const gmView = isGM && !isPCView;

  const claimCharacter = (id) => {
    localStorage.setItem('sandy_my_char_id', id);
    setMyCharId(id);
    const char = characters.find(c => c.id === id);
    if (char) {
      push('ti-user-check', `Playing as ${char.name}`, { gmOnly: true });
      // Write player_name to Supabase so it shows on the character sheet for everyone
      if (playerUsername) updateCharacter(id, { player_name: playerUsername });
    }
  };

  const handleUpdateChar = async (id, updates) => { await updateCharacter(id, updates); };
  const handleCreateChar = async (charData) => {
    const result = await createCharacter(charData);
    if (result) push('ti-user-plus', `New character created: ${result.name}`, { gmOnly: true });
    return result;
  };
  const handleDeleteChar = async (id) => { await deleteCharacter(id); };

  const handleCreateNPC = async (npcData) => {
    const result = await createNPC(npcData);
    if (result) push('ti-user-bolt', `NPC added: ${result.name}`, { gmOnly: true });
    return result;
  };

  const handleCreateQuest = async (questData) => {
    const result = await createQuest(questData);
    if (result) push('ti-target', `New objective: ${result.title}`);
    return result;
  };
  const handleUpdateQuest = async (id, updates) => {
    const result = await updateQuest(id, updates);
    if (result) {
      if (updates.status) push('ti-target', `Objective "${result.title}" → ${updates.status}`);
      else if (updates.is_visible === true) push('ti-eye', `Objective revealed: "${result.title}"`);
    }
    return result;
  };

  const handleUpdateRep = async (faction, delta) => {
    await updateRep(faction, delta);
    push('ti-shield-half', `${faction} reputation ${delta > 0 ? '+1' : '−1'}`);
  };

  const handleUpdateNPC = async (id, updates) => {
    const result = await updateNPC(id, updates);
    if (result && updates.is_visible_to_players === true) push('ti-user', `NPC revealed: ${result.name}`);
    return result;
  };

  const handleSessionEnd = async ({ xpAmount, xpReason, selectedCharIds, copperAward, recap, integrityAwards = {}, repAwards = {} }) => {
    if (xpAmount > 0) {
      for (const charId of selectedCharIds) {
        const c = characters.find(x => x.id === charId);
        if (!c) continue;
        const newLog = [...(c.xp_log || []), { amount: xpAmount, reason: xpReason, session: sessionNum }];
        await updateCharacter(charId, { xp_total: (c.xp_total || 0) + xpAmount, xp_log: newLog });
      }
      const names = selectedCharIds.map(id => characters.find(c => c.id === id)?.name).filter(Boolean).join(', ');
      push('ti-star', `${xpAmount} XP granted to ${names || 'selected characters'} — ${xpReason}`);
    }

    // Apply Integrity averaging and Reputation setting per character
    for (const charId of selectedCharIds) {
      const c = characters.find(x => x.id === charId);
      if (!c) continue;
      const updates = {};
      // Integrity — average current with GM value
      const gmInt = integrityAwards[charId];
      if (gmInt !== '' && gmInt !== undefined && !isNaN(+gmInt)) {
        const curInt = Number(c.integrity) || 0;
        updates.integrity = Math.round(((curInt + +gmInt) / 2) * 10) / 10;
        push('ti-award', `${c.name} integrity ${curInt.toFixed(1)} → ${updates.integrity.toFixed(1)}`);
      }
      // Reputation — direct whole number set by GM
      const gmRep = repAwards[charId];
      if (gmRep !== '' && gmRep !== undefined && !isNaN(+gmRep)) {
        updates.reputation = Math.round(+gmRep);
        push('ti-shield-star', `${c.name} reputation set to ${updates.reputation}`);
      }
      if (Object.keys(updates).length > 0) {
        await updateCharacter(charId, updates);
      }
    }

    if (copperAward > 0) {
      await updateInventory({ copper: (inventory.copper || 0) + copperAward });
      push('ti-coin', `${copperAward} copper added to party treasury`);
    }
    if (session) {
      if (ticker.length > 0) {
        await saveEventLog(session.id, ticker.map(e => ({ icon: e.icon, text: e.text, ts: typeof e.ts === 'string' ? e.ts : e.ts.toISOString() })));
      }
      const stampedRecap = {
        ...recap,
        _stamp: `Week ${campaignWeek}, Day ${campaignDay} — ${timeOfDay}`,
      };
      await endSession(session.id, JSON.stringify(stampedRecap));
    }
    push('ti-books', `Session ${sessionNum} archived`);
    clearTimeout(saveTimer.current);
    setSkillLog({});
    setEncounter(e => ({ ...e, state: 'idle', combatants: [], activeTurn: 0 }));
    setShowSessionEnd(false);
    refetchSessionLog();
  };

  const parsedSessionLog = sessionLog.map(s => {
    let recap = {};
    try { recap = JSON.parse(s.recap || '{}'); } catch { recap = {}; }
    return { ...s, recap, events: s.event_log || [] };
  });

  const handleSetTime = (t) => {
    setTimeOfDay(t);
    handleSetEncounter(e => ({ ...e, timeOfDay: t, campaignDay }));
  };
  const handleSetDay = (d) => {
    let day = d;
    let week = campaignWeek;
    if (d > 7) { day = 1; week = campaignWeek + 1; setCampaignWeek(week); }
    else if (d < 1 && campaignWeek > 1) { day = 7; week = campaignWeek - 1; setCampaignWeek(week); }
    else if (d < 1) { day = 1; } // week 1, can't go back further
    setCampaignDay(day);
    handleSetEncounter(e => ({ ...e, timeOfDay, campaignDay: day, campaignWeek: week }));
  };

  const TABS = ['character', 'encounter', 'map', 'npc', 'quest', 'party', 'log', ...(gmView ? ['settings'] : [])];
  const handleTabChange = (id) => {
    setTab(id);
    try { localStorage.setItem('sandy_tab', id); } catch {}
  };

  return (
    <div className="app">
      {showSessionEnd && (
        <SessionEndModal
          session={session}
          characters={safeChars}
          encounterLog={encounterLog}
          onConfirm={handleSessionEnd}
          onClose={() => setShowSessionEnd(false)}
        />
      )}

      <div className="hdr">
        <span className="hdr-title">Legend of the Burning Sands</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span className="hdr-game">The Tool — v65</span>
        {encActive && <span className="enc-badge"><i className="ti ti-swords" style={{ fontSize: 12 }} /> Encounter Active</span>}
        <div className="hdr-sp" />
        {/* Time of day — centred in header */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{TIME_ICONS[timeOfDay]}</span>
          <div style={{ lineHeight: 1.2, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{timeOfDay}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wk {campaignWeek} · Day {campaignDay}</div>
          </div>
        </div>
        {isGM && (
          <label className={`pc-toggle ${isPCView ? 'on' : ''}`} style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={isPCView} onChange={e => setIsPCView(e.target.checked)} /> PC View
          </label>
        )}
        <BookDropdown />
        {musicUrl && (
          <button onClick={() => {
            const a = audioRef.current;
            if (!a) return;
            if (musicPlaying) { a.pause(); setMusicPlaying(false); }
            else { a.play().catch(() => {}); setMusicPlaying(true); }
          }} title={musicPlaying ? 'Pause music' : 'Play music'}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 5, color: musicPlaying ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', padding: '3px 8px', fontSize: 13 }}>
            <i className={`ti ${musicPlaying ? 'ti-player-pause' : 'ti-player-play'}`} style={{ fontSize: 14 }} />
          </button>
        )}
        <span className={`role-badge ${gmView ? 'role-gm' : 'role-pl'}`}>
          {gmView ? 'GM' : isObserver ? 'Observer' : 'Player'}
        </span>
        <button className="btn btn-sm" onClick={() => { localStorage.removeItem('sandy_auth_mode'); setAuthMode(null); }}>
          <i className="ti ti-logout" style={{ fontSize: 12 }} /> Logout
        </button>
      </div>

      {isGM && !isPCView && (
        <div className="sess-bar">
          <i className={`ti ${session ? 'ti-circle-filled' : 'ti-circle'}`} style={{ fontSize: 12, color: session ? 'var(--green)' : 'var(--text-muted)' }} />
          <span>Session {session?.session_number || allSessions.filter(s => !s.is_active).length + 1}</span>
          <span className={session ? 'sess-active' : ''}>{session ? 'Active' : 'Not started'}</span>
          {/* GM time controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
            <select value={timeOfDay} onChange={e => handleSetTime(e.target.value)}
              style={{ fontSize: 12, padding: '1px 4px', background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 3 }}>
              {TIMES.map(t => <option key={t} value={t}>{TIME_ICONS[t]} {t}</option>)}
            </select>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Wk</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 14, textAlign: 'center' }}>{campaignWeek}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Day</span>
            <button className="rep-btn" onClick={() => handleSetDay(campaignDay - 1)}>−</button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 18, textAlign: 'center' }}>{campaignDay}</span>
            <button className="rep-btn" onClick={() => handleSetDay(campaignDay + 1)}>+</button>
          </div>
          <div style={{ flex: 1 }} />
          {!session
            ? <button className="btn btn-sm" style={{ borderColor: 'var(--green-dim)', color: 'var(--green)' }} onClick={() => startSession((allSessions.length > 0 ? Math.max(...allSessions.map(s => s.session_number || 0)) : 0) + 1)}>
                <i className="ti ti-player-play" style={{ fontSize: 12 }} /> Start Session
              </button>
            : <button className="btn btn-sm btn-d" onClick={() => setShowSessionEnd(true)}>
                <i className="ti ti-player-stop" style={{ fontSize: 12 }} /> End Session → Archive
              </button>
          }
        </div>
      )}

      <div className="tabbar">
        {TABS.map(id => (
          <div key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => handleTabChange(id)}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
            {id === 'encounter' && encActive && <span className="tab-dot" />}
          </div>
        ))}
      </div>

      <div className="content" style={{ paddingBottom: (gmView ? ticker : ticker.filter(e => !e.gmOnly)).length > 0 ? '3rem' : '1.25rem' }}>
        {tab === 'character' && (
          <CharacterTab
            isGM={isGM} isPCView={isPCView}
            isPlayer={isPlayer}
            characters={safeChars}
            npcs={npcs}
            onUpdateNPC={handleUpdateNPC}
            onUpdateCharacter={handleUpdateChar}
            onCreateCharacter={handleCreateChar}
            onDeleteCharacter={handleDeleteChar}
            onCreateNPC={handleCreateNPC}
            myCharId={myCharId}
            onClaimCharacter={claimCharacter}
            jumpToCharId={viewCharId}
            onClearJump={() => setViewCharId(null)}
          />
        )}
        {tab === 'encounter' && (
          <EncounterTab
            isGM={isGM} isPCView={isPCView}
            characters={safeChars}
            myCharId={myCharId}
            session={session}
            encounter={encounter}
            setEncounter={handleSetEncounter}
            npcsFromLog={npcs.filter(Boolean).filter(n => n.is_visible_to_players || isGM)}
            onUpdateCharacter={handleUpdateChar}
            onAddEncounterEntry={addEncounterEntry}
            onLogSkill={logSkillUse}
            onLogEvent={push}
            preparedEncounters={session?.prepared_encounters || []}
            onSavePreparedEncounters={enc => savePreparedEncounters(session?.id, enc)}
          />
        )}
        {tab === 'map' && (
          <MapTab
            isGM={isGM} isPCView={isPCView}
            pins={pins}
            onCreatePin={createPin}
            onUpdatePin={updatePin}
            onDeletePin={deletePin}
            timeOfDay={timeOfDay}
          />
        )}
        {tab === 'npc' && (
          <NPCTab
            isGM={isGM} isPCView={isPCView}
            npcs={npcs}
            fullNpcs={safeChars.filter(c => c.is_npc)}
            onUpdateFullNpc={handleUpdateChar}
            reps={reps}
            onUpdateNPC={handleUpdateNPC}
            onUpdateRep={handleUpdateRep}
            encounter={encounter}
            setEncounter={handleSetEncounter}
            onViewCharacter={(charId) => { setViewCharId(charId); handleTabChange('character'); }}
          />
        )}
        {tab === 'quest' && (
          <QuestTab
            isGM={isGM} isPCView={isPCView}
            session={session}
            quests={quests}
            onCreateQuest={handleCreateQuest}
            onUpdateQuest={handleUpdateQuest}
          />
        )}
        {tab === 'party' && (
          <PartyTab
            isGM={isGM} isPCView={isPCView}
            characters={safeChars}
            reps={reps}
            onUpdateRep={handleUpdateRep}
            inventory={inventory}
            onUpdateInventory={updateInventory}
            encounterLog={encounterLog}
          />
        )}
        {tab === 'log' && (
          <LogTab
            isGM={isGM && !isPCView}
            encounterLog={encounterLog}
            sessionLog={parsedSessionLog}
            allSessions={allSessions}
            activeSession={session}
            onActivateSession={activateSession}
            onCreatePrepSession={createPrepSession}
            onSavePreparedEncounters={savePreparedEncounters}
            npcsFromLog={npcs}
            skillLog={skillLog}
            eventLog={fullEventLog}
          />
        )}
        {tab === 'settings' && gmView && <SettingsTab
          onWipe={{ quests: refetchQuests, npcs: refetchNpcs, characters: refetchChars, session: refetchSession }}
        />}
      </div>

      {/* Global Roll Result Banner */}
      {encounter.rollBanner && (() => {
        const b = encounter.rollBanner;
        if (Date.now() - (b.ts || 0) > 5000) return null;
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 400,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: b.success ? 'rgba(20,50,20,.93)' : 'rgba(60,10,5,.93)',
            pointerEvents: 'none',
            animation: 'resultFade 5s forwards',
          }}>
            {(b.charName || b.skillName) && (
              <div style={{ fontSize: 13, letterSpacing: '.18em', textTransform: 'uppercase', color: b.success ? '#6aba60' : '#e06050', marginBottom: '.75rem', opacity: 0.85 }}>
                {[b.charName, b.skillName].filter(Boolean).join(' — ')}
              </div>
            )}
            <div style={{
              fontSize: 'clamp(72px, 14vw, 130px)',
              fontWeight: 900, lineHeight: 1,
              color: b.success ? '#6aba60' : '#e06050',
              textShadow: b.success ? '0 0 80px #6aba6066, 0 0 20px #6aba60aa' : '0 0 80px #e0605066, 0 0 20px #e06050aa',
              letterSpacing: '-0.02em',
            }}>
              {b.success ? 'SUCCESS' : 'FAILURE'}
            </div>
            {b.total !== undefined && b.tn !== undefined && (
              <div style={{ fontSize: 24, color: b.success ? '#6aba60' : '#e06050', marginTop: '.75rem', opacity: 0.7, fontWeight: 600 }}>
                {b.total} vs TN {b.tn}
              </div>
            )}
            {/* Damage + wound change for NPC attacks */}
            {b.success && b.damage !== undefined && (
              <div style={{ marginTop: '.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#e09050' }}>
                  {b.damage} damage → {b.targetName}
                </div>
                {b.newWoundLabel && (
                  <div style={{ fontSize: 20, color: '#e06050', marginTop: '.3rem', fontWeight: 700 }}>
                    {b.oldWoundLabel} → <span style={{ color: '#e03030' }}>{b.newWoundLabel}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Global Status / Wound Banner — shows portrait + condition/wound rank change */}
      {encounter.statusBanner && !encounter.rollBanner && (() => {
        const b = encounter.statusBanner;
        if (Date.now() - (b.ts || 0) > 4000) return null;
        const isDown = b.label === 'DOWN' || b.label === 'OUT';
        const bgColor = isDown ? 'rgba(60,5,5,.95)' : `${b.color}22`;
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 399,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: bgColor,
            pointerEvents: 'none',
            animation: 'resultFade 4s forwards',
          }}>
            {/* Portrait */}
            {b.avatarUrl && (
              <div style={{ width: 120, height: 150, borderRadius: 8, overflow: 'hidden', border: `3px solid ${b.color}`, marginBottom: '1rem', boxShadow: `0 0 40px ${b.color}88` }}>
                <img src={b.avatarUrl} alt={b.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ fontSize: 14, letterSpacing: '.2em', textTransform: 'uppercase', color: b.color, marginBottom: '.4rem', opacity: 0.9 }}>
              {b.charName}
            </div>
            <div style={{
              fontSize: b.type === 'condition' ? 'clamp(50px,10vw,90px)' : 'clamp(60px,12vw,110px)',
              fontWeight: 900, lineHeight: 1,
              color: b.color,
              textShadow: `0 0 60px ${b.color}66, 0 0 20px ${b.color}88`,
              letterSpacing: '-0.02em',
            }}>
              {b.label}
            </div>
            {b.sublabel && (
              <div style={{ fontSize: 18, color: b.color, marginTop: '.5rem', opacity: 0.65, fontWeight: 600 }}>
                {b.sublabel}
              </div>
            )}
          </div>
        );
      })()}

      {/* Background music player — hidden, controlled by toggle button */}
      {musicUrl && (
        <audio ref={audioRef} src={musicUrl} loop style={{ display: 'none' }}
          onEnded={() => setMusicPlaying(false)} />
      )}

      {/* Global Duel Pane — full-screen overlay, all players see it */}
      {encounter.duelState && (
        <DuelPane
          duel={encounter.duelState}
          myCharId={myCharId}
          isGM={isGM && !isPCView}
          pcsMap={safeChars.reduce((acc, c) => ({ ...acc, [c.id]: c }), {})}
          onUpdate={(patch) => handleSetEncounter(e => ({ ...e, duelState: { ...e.duelState, ...patch } }))}
          onClose={() => handleSetEncounter(e => ({ ...e, duelState: null }))}
        />
      )}

      {/* Global Dice Modal — accessible from any tab */}
      {globalModal && (
        <DiceModal
          context={globalModal}
          onClose={() => setGlobalModal(null)}
          onLogEvent={push}
          onResult={(result, damage) => {
            const banner = {
              success: result >= (globalModal.tn || 15),
              total: result,
              tn: globalModal.tn || 15,
              skillName: globalModal.skill || '',
              charName: globalModal.character?.name || '',
              ts: Date.now(),
            };
            // Apply damage to target if attack
            if (damage !== null && damage !== undefined && globalModal?.targetId) {
              handleSetEncounter(e => ({
                ...e,
                combatants: e.combatants.map(c => c.id === globalModal.targetId ? { ...c, wound: Math.min(7, c.wound + Math.ceil(damage / 5)) } : c),
                dmgBanner: { attackerName: encounter.combatants.find(c => c.id === myCharId)?.name || 'Party', targetId: globalModal.targetId, damage, result },
                rollBanner: banner,
              }));
            } else {
              handleSetEncounter(e => ({ ...e, rollBanner: banner }));
            }
            setGlobalModal(null);
          }}
        />
      )}

      {/* Global Sticky Turn Panel — shows on any tab when it's myCharId's turn */}
      {encounter.state === 'active' && (() => {
        const activeCombatant = encounter.combatants[encounter.activeTurn % Math.max(1, encounter.combatants.length)];
        const isMyTurnGlobal = activeCombatant?.id === myCharId;
        const myChar = isMyTurnGlobal ? safeChars.find(c => c.id === myCharId) : null;
        if (!isMyTurnGlobal || !myChar || tab === 'encounter') return null; // don't double-render on encounter tab
        const enemies = encounter.combatants.filter(c => c.type === 'npc');
        return (
          <PCTurnPanel
            combatant={activeCombatant}
            character={myChar}
            enemies={enemies}
            onRoll={(ctx) => setGlobalModal({ ...ctx, character: myChar })}
            onStanceChange={(stance) => handleSetEncounter(e => ({ ...e, combatants: e.combatants.map(c => c.id === myCharId ? { ...c, stance } : c) }))}
            onDrawWeapon={(weapon) => handleSetEncounter(e => ({ ...e, combatants: e.combatants.map(c => c.id === myCharId ? { ...c, drawnWeapon: weapon } : c) }))}
            onPass={() => handleSetEncounter(e => ({ ...e, activeTurn: e.activeTurn + 1 }))}
          />
        );
      })()}

      {/* Event Ticker — gmOnly events hidden from players */}
      {(() => {
        const visibleTicker = gmView ? ticker : ticker.filter(e => !e.gmOnly);
        if (visibleTicker.length === 0) return null;
        return (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
            background: 'rgba(24,16,6,.97)', borderTop: '1px solid var(--border)',
            padding: '0 1rem', height: '2.25rem',
            display: 'flex', alignItems: 'center', gap: '1.5rem',
            overflow: 'hidden',
          }}>
            <span style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.1em', flexShrink: 0 }}>Events</span>
            <div style={{ display: 'flex', gap: '1.5rem', overflow: 'hidden', alignItems: 'center', flex: 1 }}>
              {visibleTicker.slice(0, 5).map((e, i) => (
                <span key={e.id} className={e.highlight ? 'ticker-mine' : ''} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: e.highlight ? 17 : 13,
                  fontWeight: e.highlight ? 700 : 400,
                  color: e.highlight ? 'var(--gold)' : (i === 0 ? 'var(--text-primary)' : 'var(--text-muted)'),
                  flexShrink: 0, opacity: e.highlight ? 1 : 1 - i * 0.18,
                }}>
                  <i className={`ti ${e.icon}`} style={{ fontSize: e.highlight ? 17 : 13, color: e.highlight ? 'var(--gold)' : (i === 0 ? 'var(--gold)' : 'var(--text-muted)') }} />
                  {e.text}
                </span>
              ))}
            </div>
            <button onClick={() => setTicker([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, flexShrink: 0, padding: 0 }}>×</button>
          </div>
        );
      })()}
    </div>
  );
}
