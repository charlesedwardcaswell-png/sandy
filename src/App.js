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
import ShopTab from './components/ShopTab';
import LogTab from './components/LogTab';
import SessionEndModal from './components/SessionEndModal';
import SettingsTab from './components/SettingsTab';
import PCTurnPanel from './components/PCTurnPanel';
import DiceModal from './components/DiceModal';
import DuelPane from './components/DuelPane';
import { BOOK_TOC, DRIVE_FOLDER_URL, GAME_ID, POISON_EMPHASES } from './data/constants';
import {
  useCharacters, useActiveSession, useNPCs, useQuests,
  useMapPins, useFactionReputation, useEncounterLog,
  useGroupInventory, useSessionLog, usePresence,
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
            <div key={ci} style={{ borderBottom: '1px solid rgba(107,78,40,.2)', background: chapter.isPinned ? 'rgba(200,150,42,.06)' : 'transparent' }}>
              {/* Chapter row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '.4rem .75rem', cursor: 'pointer',
                background: expanded === ci ? 'rgba(200,150,42,.07)' : 'transparent' }}
                onClick={() => setExpanded(expanded === ci ? null : ci)}>
                <span style={{ fontSize: 11, color: chapter.isPinned ? 'var(--gold)' : 'var(--text-muted)', minWidth: 30 }}>{chapter.isPinned ? '★' : `p.${chapter.page}`}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: chapter.isPinned ? 'var(--gold)' : 'var(--text-primary)' }}>{chapter.chapter}</span>
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

  // Presence — GM sees ticker notification when players join/leave
  usePresence(
    authMode ? (isGM ? 'GM' : (playerUsername || 'Player')) : null,
    isGM,
    (who) => { if (isGM) push('ti-user-check', `${who} connected`); },
    (who) => { if (isGM) push('ti-user-x', `${who} disconnected`); }
  );

  const { characters, loading: charsLoading, createCharacter, updateCharacter, deleteCharacter, refetch: refetchChars } = useCharacters();
  const { session, allSessions, loading: sessLoading, startSession, activateSession, createPrepSession, endSession, saveEncounter, saveEventLog, savePreparedEncounters, deleteSession, renumberSession, refetch: refetchSession } = useActiveSession();
  const { npcs, createNPC, updateNPC, deleteNPC, refetch: refetchNpcs } = useNPCs();
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

  // Sync encounter state from Supabase realtime — applies to ALL clients
  // GM writes are authoritative; player writes (combatants, activeTurn) propagate to GM
  const encounterDataJson = session?.encounter_data ? JSON.stringify(session.encounter_data) : null;
  const lastSavedRef = useRef(null); // prevent applying our own just-saved state
  const sessionTransitionRef = useRef(false); // prevent resetting encounter during session switchover
  useEffect(() => {
    if (!session?.encounter_data) {
      // Don't reset to idle if we're in the middle of a session transition (startSession closes old, creates new)
      // Only reset if we've been sessionless for a moment
      const timer = setTimeout(() => {
        if (!sessionTransitionRef.current) {
          setEncounter({ state: 'idle', setup: { type: null, setting: null, desc: '', name: '', selectedNPCs: [] }, combatants: [], activeTurn: 0, dmgBanner: null, envQuirk: null, round: 1, grantedActions: {}, timeOfDay: 'Morning', campaignDay: 1, campaignWeek: 1 });
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
    const incoming = session.encounter_data;
    const incomingStr = JSON.stringify(incoming);
    // Skip if this is state we just saved ourselves (avoid loop)
    if (lastSavedRef.current === incomingStr) return;
    setEncounter(prev => {
      // Fire turn notification when activeTurn advances
      if (incoming.activeTurn !== prev.activeTurn && incoming.combatants?.length) {
        const active = incoming.combatants[incoming.activeTurn % Math.max(1, incoming.combatants.length)];
        if (active?.type === 'pc') {
          const isMine = active.id === myCharId;
          if (isMine) playYourTurn();
          setTimeout(() => push('ti-bolt', `${active.name}'s turn`, { highlight: isMine }), 0);
        }
      }
      return incoming;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, encounterDataJson]);

  // Debounced save — write to Supabase 800ms after last change
  const saveTimer = useRef(null);
  const saveEncounterDebounced = useCallback((state) => {
    if (!session?.id) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      lastSavedRef.current = JSON.stringify(state);
      saveEncounter(session.id, state);
    }, 800);
  }, [session?.id, saveEncounter]);

  const [skillLog, setSkillLog] = useState({});
  const logSkillUse = (skillName) => {
    setSkillLog(prev => ({
      ...prev,
      [skillName]: {
        encounter: (prev[skillName]?.encounter || 0) + 1,
        session:   (prev[skillName]?.session   || 0) + 1,
        total:     (prev[skillName]?.total     || 0) + 1,
      },
    }));
  };
  // Reset encounter-level skill counts when an encounter ends
  const resetEncounterSkillLog = () => {
    setSkillLog(prev => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, encounter: 0 }])));
  };

  const [ticker, setTicker] = useState([]);
  const [fullEventLog, setFullEventLog] = useState([]);

  // Restore event log from active session on load/reload
  useEffect(() => {
    if (session?.event_log?.length > 0 && fullEventLog.length === 0) {
      setFullEventLog(session.event_log.map(e => ({ ...e, id: e.id || Date.now() + Math.random() })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);
  const audioRef = useRef(null);
  const shopWipeRef = useRef(null);

  // Zoom
  const [zoom, setZoom] = useState(() => {
    try { return parseFloat(localStorage.getItem('sandy_zoom') || '1'); } catch { return 1; }
  });
  useEffect(() => {
    document.getElementById('app-root')?.style?.setProperty('zoom', zoom);
    document.getElementById('app-root') && (document.getElementById('app-root').style.zoom = zoom);
    try { localStorage.setItem('sandy_zoom', zoom); } catch {}
  }, [zoom]);

  // Theme
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('sandy_theme') || 'default'; } catch { return 'default'; }
  });
  useEffect(() => {
    document.body.className = theme === 'default' ? '' : `theme-${theme}`;
    try { localStorage.setItem('sandy_theme', theme); } catch {}
  }, [theme]);
  const THEMES = [
    { id: 'default', label: 'Desert',  icon: '☀' },
    { id: 'arcane',  label: 'Arcane',  icon: '✦' },
    { id: 'marble',  label: 'Marble',  icon: '◈' },
    { id: 'void',    label: 'Void',    icon: '◆' },
    { id: 'ember',   label: 'Ember',   icon: '🔥' },
    { id: 'jade',    label: 'Jade',    icon: '◉' },
  ];
  const jinnSummonerRef = useRef(null); // called with bonus when Jinn Summoning spell succeeds
  const [jinnSummonBonus, setJinnSummonBonus] = useState(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicUrl, setMusicUrlState] = useState('');
  const [jinnArtUrl, setJinnArtUrl] = useState('https://i.imgur.com/AwZ72Fq.jpeg');

  // Load music URL and jinn art URL from games settings on mount
  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      if (data?.settings?.music_url) setMusicUrlState(data.settings.music_url);
      if (data?.settings?.jinn_art_url) setJinnArtUrl(data.settings.jinn_art_url);
    });
  }, []);

  // Debounced event log save ref
  const eventLogSaveTimer = useRef(null);

  const push = (icon, text, opts = {}) => {
    const entry = { id: Date.now() + Math.random(), icon, text, ts: new Date().toISOString(), highlight: !!opts.highlight, gmOnly: !!opts.gmOnly };
    setTicker(prev => [entry, ...prev].slice(0, 20));
    setFullEventLog(prev => {
      const updated = [entry, ...prev];
      // Auto-save to active session (debounced 3s)
      if (session?.id && isGM) {
        clearTimeout(eventLogSaveTimer.current);
        eventLogSaveTimer.current = setTimeout(() => {
          saveEventLog(session.id, updated.map(e => ({ icon: e.icon, text: e.text, ts: e.ts, gmOnly: e.gmOnly })));
        }, 3000);
      }
      return updated;
    });
  };

  // tab state — persisted in localStorage so players return to last tab on reload
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem('sandy_tab');
      return saved && ['character','encounter','map','npc','quest','party','log','shop','settings'].includes(saved) ? saved : 'character';
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
      // Save to Supabase:
      // - GM always saves everything
      // - Players save when their turn action changes combatants or advances the turn
      //   (stance, wounds, void, drawn weapon, activeTurn) so other screens update
      // - Players also save duel state so duel rolls propagate
      const touchesDuel = next.duelState !== prev.duelState;
      const touchesTurn = next.activeTurn !== prev.activeTurn
        || next.combatants !== prev.combatants;
      const touchesBanner = next.jinnBanner !== prev.jinnBanner
        || next.purchaseBanner !== prev.purchaseBanner
        || next.rollBanner !== prev.rollBanner;
      if (isGM || touchesDuel || touchesTurn || touchesBanner) saveEncounterDebounced(next);
      return next;
    });
  }, [saveEncounterDebounced, isGM, myCharId]);

  const safeChars = characters.filter(Boolean);

  const TIMES = ['Dawn','Morning','Midday','Afternoon','Dusk','Evening','Night'];
  const TIME_ICONS = { Dawn: '🌅', Morning: '☀️', Midday: '☀️', Afternoon: '🌤️', Dusk: '🌇', Evening: '🌆', Night: '🌙' };
  const [timeOfDay, setTimeOfDay] = useState('Morning');
  const [campaignDay, setCampaignDay] = useState(1);
  const [campaignWeek, setCampaignWeek] = useState(1);

  // Load persisted time/day/week from games.settings on mount
  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).maybeSingle().then(({ data }) => {
      if (data?.settings?.timeOfDay) setTimeOfDay(data.settings.timeOfDay);
      if (data?.settings?.campaignDay) setCampaignDay(data.settings.campaignDay);
      if (data?.settings?.campaignWeek) setCampaignWeek(data.settings.campaignWeek);
    });
  }, []);

  const shopOpen = !!encounter?.shopOpen; // persists to all clients via encounter state

  useEffect(() => {
    if (encounter?.timeOfDay) setTimeOfDay(encounter.timeOfDay);
    if (encounter?.campaignDay) setCampaignDay(encounter.campaignDay);
    if (encounter?.campaignWeek) setCampaignWeek(encounter.campaignWeek);
  }, [encounter?.timeOfDay, encounter?.campaignDay, encounter?.campaignWeek]);

  // Persist time/day/week to games.settings so they survive between sessions
  useEffect(() => {
    const t = setTimeout(() => {
      supabase.from('games').select('settings').eq('id', GAME_ID).maybeSingle().then(({ data }) => {
        const updated = { ...(data?.settings || {}), timeOfDay, campaignDay, campaignWeek };
        supabase.from('games').update({ settings: updated }).eq('id', GAME_ID);
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [timeOfDay, campaignDay, campaignWeek]);

  if (!authMode) {
    return (
      <AuthScreen
        onGMLogin={() => { localStorage.setItem('sandy_auth_mode', 'gm'); setAuthMode('gm'); }}
        onPlayerLogin={(username) => { localStorage.setItem('sandy_auth_mode', 'player'); localStorage.setItem('sandy_player_username', username || 'Player'); setAuthMode('player'); setPlayerUsername(username || 'Player'); setTimeout(() => push('ti-user', `${username || 'A player'} has joined the session`, { gmOnly: true }), 500); }}
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
      if (playerUsername) updateCharacter(id, { player_name: playerUsername });
    }
  };

  // Coin jingle via Web Audio API (no external file)
  const playCoinJingle = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t); osc.stop(t + 0.25);
      });
    } catch (e) {}
  };

  const handlePurchase = ({ itemName, price, copperAmt, destination, destName }) => {
    // Deduct copper
    if (copperAmt > 0) {
      if (destination === 'party') {
        updateInventory({ copper: Math.max(0, (inventory.copper || 0) - copperAmt) });
      } else {
        const char = characters.find(c => c.id === destination);
        if (char) updateCharacter(destination, { copper: Math.max(0, (char.copper || 0) - copperAmt) });
      }
    }
    // Flash banner to all players
    handleSetEncounter(e => ({ ...e, purchaseBanner: { itemName, price, destName, ts: Date.now() } }));
    playCoinJingle();
    push('ti-shopping-cart', `Purchased: ${itemName}${price ? ' — ' + price : ''} → ${destName}`);
  };

  const unclaimCharacter = (id) => {
    localStorage.removeItem('sandy_my_char_id');
    setMyCharId(null);
    // Clear player_name from the character
    updateCharacter(id, { player_name: null });
    push('ti-user-off', 'Character unclaimed', { gmOnly: true });
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
    setFullEventLog([]);
    setEncounter(e => ({ ...e, state: 'idle', combatants: [], activeTurn: 0, grantedActions: {} }));
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
  const applyPassiveHealing = (chars, isDawn = false) => {
    // Houserule: +1 wound healed per time unit (not Dead/Out)
    // At Dawn: also heal Stamina + Insight Rank (natural morning recovery)
    const WOUND_RANKS = [0, 3, 5, 10, 15, 20, 40, 999];
    chars.forEach(char => {
      const maxWounds = (char.earth || 2) * 17;
      const woundRank = (wounds) => {
        const earth = char.earth || 2;
        const thresholds = [earth*5, earth*7, earth*9, earth*11, earth*13, earth*15, earth*17];
        for (let i = 0; i < thresholds.length; i++) { if (wounds <= thresholds[i]) return i; }
        return 7;
      };
      const rank = woundRank(char.current_wounds || 0);
      if (rank >= 7) return; // Out — no passive healing
      let heal = 1; // houserule: +1 per time unit
      if (isDawn) {
        // Natural morning recovery: Stamina + Insight Rank
        heal += (char.stamina || 2) + (char.insight_rank || char.school_rank || 1);
      }
      const newWounds = Math.max(0, (char.current_wounds || 0) - heal);
      if (newWounds !== char.current_wounds) {
        handleUpdateChar(char.id, { current_wounds: newWounds });
      }
    });
  };

  const handleIncrementTime = () => {
    const idx = TIMES.indexOf(timeOfDay);
    const nextIdx = (idx + 1) % TIMES.length;
    const nextTime = TIMES[nextIdx];
    const rollingOverDay = nextIdx === 0; // Night → Dawn
    // Apply passive healing to all non-Out PCs
    applyPassiveHealing(safeChars, rollingOverDay);
    if (rollingOverDay) {
      // Compute new day/week inline and save everything in one shot
      let newDay = campaignDay + 1;
      let newWeek = campaignWeek;
      if (newDay > 7) { newDay = 1; newWeek = campaignWeek + 1; setCampaignWeek(newWeek); }
      setCampaignDay(newDay);
      setTimeOfDay(nextTime);
      handleSetEncounter(e => ({ ...e, timeOfDay: nextTime, campaignDay: newDay, campaignWeek: newWeek }));
      push('ti-sun', `Dawn — Day ${newDay}, Week ${newWeek} — party healed ${safeChars.filter(c => (c.current_wounds||0) > 0).length > 0 ? 'Stamina + Rank + 1 wounds' : '(all healthy)'}`);
    } else {
      setTimeOfDay(nextTime);
      handleSetEncounter(e => ({ ...e, timeOfDay: nextTime, campaignDay }));
    }
  };
  const handleSetDay = (d) => {
    let day = d;
    let week = campaignWeek;
    if (d > 7) { day = 1; week = campaignWeek + 1; setCampaignWeek(week); }
    else if (d < 1 && campaignWeek > 1) { day = 7; week = campaignWeek - 1; setCampaignWeek(week); }
    else if (d < 1) { day = 1; }
    setCampaignDay(day);
    // Reset time to Morning on day advance
    setTimeOfDay('Morning');
    handleSetEncounter(e => ({ ...e, timeOfDay: 'Morning', campaignDay: day, campaignWeek: week }));
    // Standard healing: Stamina + Insight Rank wounds recovered per day
    if (d > campaignDay || (d === 1 && campaignDay === 7)) {
      applyPassiveHealing(safeChars, true);
      push('ti-sun', `Day ${day}, Week ${week} — morning healing applied`);
    }
  };

  const TABS = ['character', 'encounter', 'map', 'npc', 'quest', 'party', 'log', 'shop', ...(gmView ? ['settings'] : [])];
  const TAB_LABELS = { character: 'Characters', encounter: 'Encounter', map: 'Map', npc: 'Daftar', quest: 'Quests', party: 'Party', log: 'Log', shop: 'Shop', settings: 'Settings' };
  const handleTabChange = (id) => {
    setTab(id);
    try { localStorage.setItem('sandy_tab', id); } catch {}
  };

  return (
    <div className="app" id="app-root" style={{ zoom: zoom }}>
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
        <span className="hdr-game">The Tool — v109.1</span>
        {encActive && <span className="enc-badge"><i className="ti ti-swords" style={{ fontSize: 12 }} /> Encounter Active</span>}
        <div className="hdr-sp" />
        {/* Time of day — centred in header */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{TIME_ICONS[timeOfDay]}</span>
          <div style={{ lineHeight: 1.3, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{timeOfDay}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, justifyContent: 'center' }}>
              <span>Wk {campaignWeek}</span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span>Day {campaignDay}</span>
            </div>
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
        {/* Zoom buttons */}
        <div style={{ display: 'flex', gap: 1, border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
          <button onClick={() => setZoom(z => Math.max(0.7, Math.round((z - 0.1) * 10) / 10))}
            title="Zoom out" style={{ padding: '3px 7px', fontSize: 13, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}>−</button>
          <span style={{ padding: '3px 2px', fontSize: 10, color: 'var(--text-muted)', lineHeight: '1.6', userSelect: 'none' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.4, Math.round((z + 0.1) * 10) / 10))}
            title="Zoom in" style={{ padding: '3px 7px', fontSize: 13, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}>+</button>
        </div>

        {/* Theme cycle button */}
        {(() => {
          const curr = THEMES.find(t => t.id === theme) || THEMES[0];
          const nextTheme = THEMES[(THEMES.indexOf(curr) + 1) % THEMES.length];
          return (
            <button onClick={() => setTheme(nextTheme.id)}
              title={`Theme: ${curr.label} — click for ${nextTheme.label}`}
              style={{ padding: '3px 9px', fontSize: 13, background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1, flexShrink: 0 }}>
              {curr.icon} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{curr.label}</span>
            </button>
          );
        })()}
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
            <button className="rep-btn" onClick={handleIncrementTime} title="Advance to next time period (Night → Dawn rolls the day)"
              style={{ color: 'var(--gold-dim)', borderColor: 'var(--gold-dim)' }}>→</button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Wk</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 14, textAlign: 'center' }}>{campaignWeek}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Day</span>
            <button className="rep-btn" onClick={() => handleSetDay(campaignDay - 1)}>−</button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 18, textAlign: 'center' }}>{campaignDay}</span>
            <button className="rep-btn" onClick={() => handleSetDay(campaignDay + 1)}>+</button>
          </div>
          <div style={{ flex: 1 }} />
          {!session
            ? <button className="btn btn-sm" style={{ borderColor: 'var(--green-dim)', color: 'var(--green)' }} onClick={() => {
                sessionTransitionRef.current = true;
                startSession((allSessions.length > 0 ? Math.max(...allSessions.map(s => s.session_number || 0)) : 0) + 1)
                  .finally(() => { setTimeout(() => { sessionTransitionRef.current = false; }, 3000); });
              }}>
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
            {TAB_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1)}
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
            onUnclaimCharacter={unclaimCharacter}
            jumpToCharId={viewCharId}
            onClearJump={() => setViewCharId(null)}
            jinnArtUrl={jinnArtUrl}
            onJinnSummoned={(jinnName) => {
              handleSetEncounter(e => ({ ...e, jinnBanner: { name: jinnName, artUrl: jinnArtUrl, ts: Date.now() } }));
            }}
            onUpdateInventory={updateInventory}
            partyInventoryItems={inventory?.items || []}
            onRoll={(ctx) => setGlobalModal({ ...ctx })}
            jinnSummonerRef={jinnSummonerRef}
            jinnSummonBonus={jinnSummonBonus}
            onJinnSummonDone={() => setJinnSummonBonus(null)}
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
            onDeleteNPC={deleteNPC}
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
            onUpdateQuest={(id, updates) => {
              // Fire ticker notification when quest becomes visible
              if (updates.is_visible === true) {
                const q = quests.find(x => x.id === id);
                if (q) push('ti-flag', `Quest revealed: "${q.title}"`);
              }
              handleUpdateQuest(id, updates);
            }}
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
            onUpdateCharacter={handleUpdateChar}
            myCharId={myCharId}
          />
        )}
        {tab === 'log' && (
          <LogTab
            isGM={isGM && !isPCView}
            encounterLog={encounterLog}
            sessionLog={parsedSessionLog}
            allSessions={allSessions}
            activeSession={session}
            onActivateSession={(id) => { sessionTransitionRef.current = true; activateSession(id).finally(() => setTimeout(() => { sessionTransitionRef.current = false; }, 3000)); }}
            onCreatePrepSession={createPrepSession}
            onDeleteSession={deleteSession}
            onRenumberSession={renumberSession}
            onSavePreparedEncounters={savePreparedEncounters}
            npcsFromLog={npcs}
            skillLog={skillLog}
            eventLog={fullEventLog}
          />
        )}
        {tab === 'shop' && (
          <ShopTab
            isGM={isGM} isPCView={isPCView}
            onWipeShops={shopWipeRef}
            inventory={inventory}
            onUpdateInventory={updateInventory}
            characters={safeChars}
            onUpdateCharacter={handleUpdateChar}
            onLogEvent={push}
            shopOpen={shopOpen}
            onPurchase={handlePurchase}
            onRoll={(ctx) => setGlobalModal({ ...ctx })}
            myCharId={myCharId}
            onToggleShopOpen={gmView ? () => {
              const opening = !encounter?.shopOpen;
              handleSetEncounter(e => ({ ...e, shopOpen: opening }));
              push('ti-shopping-cart', opening ? 'The Bazaar is open — browse the Shop tab.' : 'The Bazaar has closed.', { highlight: opening });
            } : undefined}
          />
        )}
        {tab === 'settings' && gmView && <SettingsTab
          onWipe={{ quests: refetchQuests, npcs: refetchNpcs, characters: refetchChars, session: refetchSession, shops: () => { if (shopWipeRef.current) shopWipeRef.current(); } }}
        />}
      </div>

      {/* Jinn Summoning Flash Banner — shown to all players when a Jinn is summoned */}
      {encounter.jinnBanner && (() => {
        const b = encounter.jinnBanner;
        if (Date.now() - (b.ts || 0) > 7000) return null;
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 450,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(8,4,18,.96)',
            pointerEvents: 'none',
            animation: 'jinnFlash 7s forwards',
          }}>
            {b.artUrl && (
              <div style={{
                width: 'min(380px, 80vw)', height: 'min(480px, 60vh)',
                borderRadius: 12, overflow: 'hidden',
                border: '2px solid rgba(160,100,220,.6)',
                boxShadow: '0 0 80px rgba(160,100,220,.5), 0 0 200px rgba(160,100,220,.2)',
                marginBottom: '1.5rem',
              }}>
                <img src={b.artUrl} alt="Jinn" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{
              fontSize: 11, letterSpacing: '.35em', textTransform: 'uppercase',
              color: 'rgba(160,100,220,.7)', marginBottom: '.5rem',
            }}>
              From the Smokeless Fire
            </div>
            <div style={{
              fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 900, color: '#c0a0e0',
              animation: 'jinnGlow 1.5s ease-in-out infinite',
              letterSpacing: '.04em', textAlign: 'center', padding: '0 1rem',
            }}>
              {b.name || 'The Jinn Appears'}
            </div>
          </div>
        );
      })()}

      {/* Purchase Flash Banner */}
      {encounter.purchaseBanner && (() => {
        const b = encounter.purchaseBanner;
        if (Date.now() - (b.ts || 0) > 3500) return null;
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 448,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(20,15,0,.92)',
            pointerEvents: 'none',
            animation: 'purchaseFlash 3.5s forwards',
          }}>
            <div style={{ fontSize: 72, lineHeight: 1, marginBottom: '.5rem', animation: 'coinSpin 0.6s ease-in-out' }}>🪙</div>
            <div style={{ fontSize: 11, letterSpacing: '.3em', textTransform: 'uppercase', color: '#a07820', marginBottom: '.4rem' }}>Purchased</div>
            <div style={{ fontSize: 'clamp(24px, 5vw, 44px)', fontWeight: 900, color: '#f0c040', textAlign: 'center', padding: '0 1rem',
              textShadow: '0 0 40px #f0c04066, 0 0 15px #f0c04088' }}>
              {b.itemName}
            </div>
            {b.price && (
              <div style={{ fontSize: 20, color: '#c0a030', marginTop: '.4rem', fontWeight: 600 }}>{b.price}</div>
            )}
            <div style={{ fontSize: 13, color: '#806010', marginTop: '.3rem' }}>→ {b.destName}</div>
          </div>
        );
      })()}

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
              {b.success ? 'SUCCESS' : '✗'}
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
            {/* Portrait + name always shown */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '.75rem' }}>
              <div style={{ width: 100, height: 130, borderRadius: 8, overflow: 'hidden', border: `3px solid ${b.color}`, marginBottom: '.5rem', boxShadow: `0 0 40px ${b.color}88`, background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {b.avatarUrl
                  ? <img src={b.avatarUrl} alt={b.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ fontSize: 48, lineHeight: 1 }}>⚔</div>
                }
              </div>
              <div style={{ fontSize: 16, letterSpacing: '.15em', textTransform: 'uppercase', color: b.color, fontWeight: 700, opacity: 0.9 }}>
                {b.charName}
              </div>
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
          onUpdateCharacter={handleUpdateChar}
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
            // ── Medicine (Wound Treatment) heal ──────────────────────────────
            if (globalModal?.isMedicineHeal && globalModal?.healTargetId) {
              const target = safeChars.find(c => c.id === globalModal.healTargetId);
              if (target && result >= 15) {
                // Success: roll healing dice (base 1kX, raises add more rolled dice, keep 1)
                const raises = Math.max(0, Math.floor((result - 15) / 5));
                const medicineSkill = (globalModal.character?.skills || []).find(s => s.name === 'Medicine');
                const skillRank = medicineSkill?.rank || 1;
                // Mastery bonuses: R3 +1k0, R5 +1k1
                const masteryRoll = skillRank >= 3 ? 1 : 0;
                const masteryKeep = skillRank >= 5 ? 1 : 0;
                const healDiceRolled = 1 + raises + masteryRoll;
                const healDiceKept = 1 + masteryKeep;
                // Roll the healing dice
                const healRolls = Array.from({ length: healDiceRolled }, () => Math.ceil(Math.random() * 10));
                healRolls.sort((a, b) => b - a);
                const woundsHealed = healRolls.slice(0, healDiceKept).reduce((s, v) => s + v, 0);
                const newWounds = Math.max(0, target.current_wounds - woundsHealed);
                handleUpdateChar(globalModal.healTargetId, { current_wounds: newWounds });
                push('ti-heart', `${globalModal.character?.name || 'Healer'} treated ${target.name} — healed ${woundsHealed} wounds (${healDiceRolled}k${healDiceKept} = ${healRolls.slice(0, healDiceKept).join('+')})`);
              } else if (target) {
                push('ti-heart-broken', `${globalModal.character?.name || 'Healer'} failed to treat ${target.name} (rolled ${result} vs TN 15)`);
              }
              setGlobalModal(null);
              return;
            }
            // ── Skill outcomes ────────────────────────────────────────────────
            const od = globalModal?.skillOutcomeData;
            const success = result >= (globalModal.tn || 15);
            const raises = success ? Math.floor((result - (globalModal.tn || 15)) / 5) : 0;
            if (od && success) {
              // Medicine — roll healing dice and apply to patient
              if (od.medicine && od.medicinePatientId) {
                const patient = safeChars.find(c => c.id === od.medicinePatientId);
                const healer = safeChars.find(c => c.id === od.characterId);
                if (patient) {
                  const masteryRoll = od.skillRank >= 3 ? 1 : 0;
                  const masteryKeep = od.skillRank >= 5 ? 1 : 0;
                  const healDiceRolled = 1 + raises + masteryRoll;
                  const healDiceKept = 1 + masteryKeep;
                  const healRolls = Array.from({ length: healDiceRolled }, () => Math.ceil(Math.random() * 10));
                  healRolls.sort((a, b) => b - a);
                  const woundsHealed = healRolls.slice(0, healDiceKept).reduce((s, v) => s + v, 0);
                  const newWounds = Math.max(0, (patient.current_wounds || 0) - woundsHealed);
                  handleUpdateChar(od.medicinePatientId, { current_wounds: newWounds });
                  push('ti-heart', `${healer?.name || 'Healer'} treated ${patient.name} — healed ${woundsHealed} wounds`);
                }
              }
              // Craft: Poison — add dose to character equipment on success
              if (od.craftPoison && od.poisonType) {
                const char = safeChars.find(c => c.id === od.characterId);
                const poisonData = POISON_EMPHASES[od.poisonType] || {};
                if (char) {
                  const doseName = `${od.poisonType} (Craft TN ${poisonData.craftTN || '?'} — ${poisonData.effect || 'see rulebook'})`;
                  const eq = [...(char.equipment || []), { name: doseName, dr: '', skill: '', equipped: false, inUse: false }];
                  handleUpdateChar(od.characterId, { equipment: eq });
                  push('ti-flask', `${char.name} crafted: ${od.poisonType} (+1 dose to inventory)`);
                }
              }
              // Acting / Stealth — create condition with TN to see through
              if (od.acting || od.stealth) {
                const conditionName = od.stealth ? 'Hidden' : 'Disguised';
                const seeThroughTN = result; // roll result IS the TN to see through
                const char = safeChars.find(c => c.id === od.characterId);
                if (char) {
                  const conditions = [...(char.xp_log || []), { note: `${conditionName} — TN ${seeThroughTN} to see through`, ts: new Date().toISOString(), type: 'condition' }];
                  handleUpdateChar(od.characterId, { xp_log: conditions });
                  push('ti-mask', `${char.name} is ${conditionName} (TN ${seeThroughTN} to see through)`);
                }
              }
              // Meditation — recover Void Points
              if (od.meditation) {
                const char = safeChars.find(c => c.id === od.characterId);
                if (char) {
                  const recovery = od.skillRank >= 5 ? 4 : 2;
                  const newVoid = Math.min(od.voidRing, (char.current_void || 0) + recovery);
                  handleUpdateChar(od.characterId, { current_void: newVoid });
                  push('ti-sparkles', `${char.name} meditated — recovered ${newVoid - (char.current_void || 0)} Void Point${newVoid - (char.current_void || 0) !== 1 ? 's' : ''}`);
                }
              }
              // Forgery — add document to player inventory
              if (od.forgery) {
                const tn = result; // the TN to detect the forgery
                const docName = od.forgeryDocName || 'Forged Document';
                const newItem = { name: `${docName} (Forgery — TN ${tn} to detect)`, qty: 1, category: 'Quest Item', added_at: new Date().toISOString() };
                const char = safeChars.find(c => c.id === od.characterId);
                if (char) {
                  const eq = [...(char.equipment || []), { name: newItem.name, dr: '', skill: '', equipped: false, inUse: false }];
                  handleUpdateChar(od.characterId, { equipment: eq });
                  push('ti-file-text', `${char.name} forged: ${docName} (TN ${tn} to detect)`);
                }
              }
              // Storytelling — boast increases target reputation
              if (od.storytelling && od.boastTargetId) {
                const target = safeChars.find(c => c.id === od.boastTargetId);
                const char = safeChars.find(c => c.id === od.characterId);
                if (target) {
                  const repGain = (1 + raises) * 0.1;
                  const newRep = Math.round(((target.reputation || 1) + repGain) * 10) / 10;
                  handleUpdateChar(od.boastTargetId, { reputation: newRep });
                  push('ti-star', `${char?.name || 'Party'} boasted — ${target.name}'s Reputation +${repGain.toFixed(1)} → ${newRep}`);
                }
              }
            }
            // ── Jinn Summoning → open Jinn Randomizer ────────────────────────
            if (od?.isJinnSummoning && success) {
              const summoning1Bonus = od.spellName === 'Jinn Summoning 1' ? od.insightRank : 0;
              setJinnSummonBonus({ spellName: od.spellName, bonus: summoning1Bonus, characterId: od.characterId });
              if (jinnSummonerRef.current) jinnSummonerRef.current(summoning1Bonus);
              push('ti-star', `${globalModal.character?.name || 'Sahir'} cast ${od.spellName} — Jinn Summoner opened`);
            }
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
            allies={safeChars.filter(c => c.id !== myCharId)}
            allCharacters={safeChars}
            onRoll={(ctx) => setGlobalModal({ ...ctx, character: myChar })}
            onStanceChange={(stance) => handleSetEncounter(e => ({ ...e, combatants: e.combatants.map(c => c.id === myCharId ? { ...c, stance } : c) }))}
            onDrawWeapon={(weapon) => handleSetEncounter(e => ({ ...e, combatants: e.combatants.map(c => c.id === myCharId ? { ...c, drawnWeapon: weapon } : c) }))}
            onPass={() => handleSetEncounter(e => ({ ...e, activeTurn: e.activeTurn + 1 }))}
            onUpdateCharacter={handleUpdateChar}
            onUpdateInventory={updateInventory}
            partyInventoryItems={inventory?.items || []}
          />
        );
      })()}

      {/* Event Ticker — always rendered, gmOnly events hidden from players */}
      {(() => {
        const visibleTicker = gmView ? ticker : ticker.filter(e => !e.gmOnly);
        return (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 110,
            transition: 'opacity .3s',
            opacity: visibleTicker.length > 0 ? 1 : 0,
            pointerEvents: visibleTicker.length > 0 ? 'auto' : 'none',
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
