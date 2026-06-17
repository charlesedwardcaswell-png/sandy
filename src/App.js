import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { AuthScreen } from './components/AuthScreen';
import { Loading } from './components/UI';
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
import {
  useCharacters, useActiveSession, useNPCs, useQuests,
  useMapPins, useFactionReputation, useEncounterLog,
  useGroupInventory, useSessionLog,
} from './hooks/useSupabase';

export default function App() {
  const [authMode, setAuthMode] = useState(() => localStorage.getItem('sandy_auth_mode') || null);
  const isGM = authMode === 'gm';
  const isObserver = authMode === 'observer';
  const isPlayer = authMode === 'player';

  const { characters, loading: charsLoading, createCharacter, updateCharacter, deleteCharacter } = useCharacters();
  const { session, loading: sessLoading, startSession, endSession, saveEncounter, saveEventLog } = useActiveSession();
  const { npcs, createNPC, updateNPC } = useNPCs();
  const { quests, createQuest, updateQuest } = useQuests(session?.id);
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
      setEncounter({ state: 'idle', setup: { type: null, setting: null, desc: '', name: '', selectedNPCs: [] }, combatants: [], activeTurn: 0, dmgBanner: null, envQuirk: null, round: 1 });
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
  const push = (icon, text) => {
    const entry = { id: Date.now() + Math.random(), icon, text, ts: new Date() };
    setTicker(prev => [entry, ...prev].slice(0, 20));
  };

  const [tab, setTab] = useState('character');
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
          setTimeout(() => push('ti-bolt', `${active.name}'s turn`), 0);
        }
      }
      if (isGM) saveEncounterDebounced(next);
      return next;
    });
  }, [saveEncounterDebounced, isGM]);

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
        onPlayerLogin={() => { localStorage.setItem('sandy_auth_mode', 'player'); setAuthMode('player'); }}
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
    if (char) push('ti-user-check', `Playing as ${char.name}`);
  };

  const handleUpdateChar = async (id, updates) => { await updateCharacter(id, updates); };
  const handleCreateChar = async (charData) => {
    const result = await createCharacter(charData);
    if (result) push('ti-user-plus', `New character created: ${result.name}`);
    return result;
  };
  const handleDeleteChar = async (id) => { await deleteCharacter(id); };

  const handleCreateNPC = async (npcData) => {
    const result = await createNPC(npcData);
    if (result) push('ti-user-bolt', `NPC added: ${result.name}`);
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

  const handleSessionEnd = async ({ xpAmount, xpReason, selectedCharIds, copperAward, recap }) => {
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
    if (copperAward > 0) {
      await updateInventory({ copper: (inventory.copper || 0) + copperAward });
      push('ti-coin', `${copperAward} copper added to party treasury`);
    }
    if (session) {
      // Save event log before closing session
      if (ticker.length > 0) {
        await saveEventLog(session.id, ticker.map(e => ({ icon: e.icon, text: e.text, ts: e.ts.toISOString() })));
      }
      await endSession(session.id, JSON.stringify(recap));
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
        <span className="hdr-title">LBS</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span className="hdr-game">The Heart of the Jewel</span>
        {encActive && <span className="enc-badge"><i className="ti ti-swords" style={{ fontSize: 10 }} /> Encounter Active</span>}
        <div className="hdr-sp" />
        {/* Time of day — centred in header */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{TIME_ICONS[timeOfDay]}</span>
          <div style={{ lineHeight: 1.2, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{timeOfDay}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Wk {campaignWeek} · Day {campaignDay}</div>
          </div>
        </div>
        {isGM && (
          <label className={`pc-toggle ${isPCView ? 'on' : ''}`} style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={isPCView} onChange={e => setIsPCView(e.target.checked)} /> PC View
          </label>
        )}
        <span className={`role-badge ${gmView ? 'role-gm' : 'role-pl'}`}>
          {gmView ? 'GM' : isObserver ? 'Observer' : 'Player'}
        </span>
        <button className="btn btn-sm" onClick={() => { localStorage.removeItem('sandy_auth_mode'); setAuthMode(null); }}>
          <i className="ti ti-logout" style={{ fontSize: 10 }} /> Logout
        </button>
      </div>

      {isGM && !isPCView && (
        <div className="sess-bar">
          <i className={`ti ${session ? 'ti-circle-filled' : 'ti-circle'}`} style={{ fontSize: 10, color: session ? 'var(--green)' : 'var(--text-muted)' }} />
          <span>Session {sessionNum}</span>
          <span className={session ? 'sess-active' : ''}>{session ? 'Active' : 'Not started'}</span>
          {/* GM time controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
            <select value={timeOfDay} onChange={e => handleSetTime(e.target.value)}
              style={{ fontSize: 10, padding: '1px 4px', background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 3 }}>
              {TIMES.map(t => <option key={t} value={t}>{TIME_ICONS[t]} {t}</option>)}
            </select>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Wk</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 14, textAlign: 'center' }}>{campaignWeek}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Day</span>
            <button className="rep-btn" onClick={() => handleSetDay(Math.max(1, campaignDay - 1))}>−</button>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 18, textAlign: 'center' }}>{campaignDay}</span>
            <button className="rep-btn" onClick={() => handleSetDay(campaignDay + 1)}>+</button>
          </div>
          <div style={{ flex: 1 }} />
          {!session
            ? <button className="btn btn-sm" style={{ borderColor: 'var(--green-dim)', color: 'var(--green)' }} onClick={() => startSession(sessionNum)}>
                <i className="ti ti-player-play" style={{ fontSize: 10 }} /> Start Session {sessionNum}
              </button>
            : <button className="btn btn-sm btn-d" onClick={() => setShowSessionEnd(true)}>
                <i className="ti ti-player-stop" style={{ fontSize: 10 }} /> End Session → Archive
              </button>
          }
        </div>
      )}

      <div className="tabbar">
        {TABS.map(id => (
          <div key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
            {id === 'encounter' && encActive && <span className="tab-dot" />}
          </div>
        ))}
      </div>

      <div className="content" style={{ paddingBottom: ticker.length > 0 ? '3rem' : '1.25rem' }}>
        {tab === 'character' && (
          <CharacterTab
            isGM={isGM} isPCView={isPCView}
            isPlayer={isPlayer}
            characters={safeChars}
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
            npcsFromLog={npcs.filter(n => n.is_visible_to_players || isGM)}
            onUpdateCharacter={handleUpdateChar}
            onAddEncounterEntry={addEncounterEntry}
            onLogSkill={logSkillUse}
            onLogEvent={push}
          />
        )}
        {tab === 'map' && (
          <MapTab
            isGM={isGM} isPCView={isPCView}
            pins={pins}
            onCreatePin={createPin}
            onUpdatePin={updatePin}
            onDeletePin={deletePin}
          />
        )}
        {tab === 'npc' && (
          <NPCTab
            isGM={isGM} isPCView={isPCView}
            npcs={npcs}
            reps={reps}
            onUpdateNPC={handleUpdateNPC}
            onUpdateRep={handleUpdateRep}
            encounter={encounter}
            setEncounter={handleSetEncounter}
            onViewCharacter={(charId) => { setViewCharId(charId); setTab('character'); }}
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
            encounterLog={encounterLog}
            sessionLog={parsedSessionLog}
            skillLog={skillLog}
          />
        )}
        {tab === 'settings' && gmView && <SettingsTab />}
      </div>

      {/* Global Dice Modal — accessible from any tab */}
      {globalModal && (
        <DiceModal
          context={globalModal}
          onClose={() => setGlobalModal(null)}
          onLogEvent={push}
          onResult={(result, damage) => {
            // Apply damage to target if attack
            if (damage !== null && damage !== undefined && globalModal?.targetId) {
              handleSetEncounter(e => ({
                ...e,
                combatants: e.combatants.map(c => c.id === globalModal.targetId ? { ...c, wound: Math.min(7, c.wound + Math.ceil(damage / 5)) } : c),
                dmgBanner: { attackerName: encounter.combatants.find(c => c.id === myCharId)?.name || 'Party', targetId: globalModal.targetId, damage, result },
              }));
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

      {/* Event Ticker */}
      {ticker.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(24,16,6,.97)', borderTop: '1px solid var(--border)',
          padding: '0 1rem', height: '2.25rem',
          display: 'flex', alignItems: 'center', gap: '1.5rem',
          overflow: 'hidden',
        }}>
          <span style={{ fontSize: 9, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.1em', flexShrink: 0 }}>Events</span>
          <div style={{ display: 'flex', gap: '1.5rem', overflow: 'hidden', alignItems: 'center', flex: 1 }}>
            {ticker.slice(0, 5).map((e, i) => (
              <span key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)', flexShrink: 0, opacity: 1 - i * 0.18 }}>
                <i className={`ti ${e.icon}`} style={{ fontSize: 11, color: i === 0 ? 'var(--gold)' : 'var(--text-muted)' }} />
                {e.text}
              </span>
            ))}
          </div>
          <button onClick={() => setTicker([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, flexShrink: 0, padding: 0 }}>×</button>
        </div>
      )}
    </div>
  );
}
