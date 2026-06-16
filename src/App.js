import React, { useState } from 'react';
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
import {
  useCharacters, useActiveSession, useNPCs, useQuests,
  useMapPins, useFactionReputation, useEncounterLog,
  useGroupInventory, useSessionLog,
} from './hooks/useSupabase';

export default function App() {
  const [authMode, setAuthMode] = useState(null); // null | 'gm' | 'player' | 'observer'
  const isGM = authMode === 'gm';
  const isObserver = authMode === 'observer';
  const isPlayer = authMode === 'player';

  const { characters, loading: charsLoading, createCharacter, updateCharacter, deleteCharacter } = useCharacters();
  const { session, loading: sessLoading, startSession, endSession } = useActiveSession();
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

  const [skillLog, setSkillLog] = useState({});
  const logSkillUse = (skillName) => {
    setSkillLog(prev => ({
      ...prev,
      [skillName]: { session: (prev[skillName]?.session || 0) + 1, total: (prev[skillName]?.total || 0) + 1 },
    }));
  };

  const [ticker, setTicker] = useState([]); // [{id, icon, text, ts}]
  const push = (icon, text) => {
    const entry = { id: Date.now() + Math.random(), icon, text, ts: new Date() };
    setTicker(prev => [entry, ...prev].slice(0, 20));
  };

  const [tab, setTab] = useState('character');
  const [isPCView, setIsPCView] = useState(false);
  const [showSessionEnd, setShowSessionEnd] = useState(false);

  const safeChars = characters.filter(Boolean);

  if (!authMode) {
    return (
      <AuthScreen
        onGMLogin={() => setAuthMode('gm')}
        onPlayerLogin={() => setAuthMode('player')}
        onObserver={() => setAuthMode('observer')}
      />
    );
  }

  if (charsLoading || sessLoading) return <Loading message="Loading game data..." />;

  const encActive = encounter.state === 'active';
  const sessionNum = session?.session_number || (sessionLog.length > 0 ? Math.max(...sessionLog.map(s => s.session_number || 0)) + 1 : 1);
  const gmView = isGM && !isPCView;

  const handleUpdateChar = async (id, updates) => { await updateCharacter(id, updates); };
  const handleCreateChar = async (charData) => {
    const result = await createCharacter(charData);
    if (result) push('ti-user-plus', `New character created: ${result.name}`);
    return result;
  };
  const handleDeleteChar = async (id) => { await deleteCharacter(id); };

  // Wrapped NPC create with ticker
  const handleCreateNPC = async (npcData) => {
    const result = await createNPC(npcData);
    if (result) push('ti-user-bolt', `NPC added: ${result.name}`);
    return result;
  };

  // Wrapped quest handlers with ticker
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

  // Wrapped rep update with ticker
  const handleUpdateRep = async (faction, delta) => {
    await updateRep(faction, delta);
    push('ti-shield-half', `${faction} reputation ${delta > 0 ? '+1' : '−1'}`);
  };

  // Wrapped NPC update — fire ticker when revealed
  const handleUpdateNPC = async (id, updates) => {
    const result = await updateNPC(id, updates);
    if (result && updates.is_visible_to_players === true) push('ti-user', `NPC revealed: ${result.name}`);
    return result;
  };

  const handleSessionEnd = async ({ xpAmount, xpReason, selectedCharIds, recap }) => {
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
    if (session) await endSession(session.id, JSON.stringify(recap));
    push('ti-books', `Session ${sessionNum} archived`);
    setSkillLog({});
    setEncounter(e => ({ ...e, state: 'idle', combatants: [], activeTurn: 0 }));
    setShowSessionEnd(false);
    refetchSessionLog();
  };

  // Wrapped setEncounter that fires ticker on key transitions
  const handleSetEncounter = (updater) => {
    setEncounter(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Encounter started
      if (prev.state !== 'active' && next.state === 'active') {
        setTimeout(() => push('ti-swords', `Encounter started: ${next.setup?.name || next.setup?.type || 'Combat'}`), 0);
      }
      // Encounter ended
      if (prev.state === 'active' && next.state === 'idle') {
        setTimeout(() => push('ti-flag', 'Encounter ended'), 0);
      }
      // Turn advanced — fire for PC turns
      if (next.state === 'active' && next.activeTurn !== prev.activeTurn) {
        const active = next.combatants[next.activeTurn % Math.max(1, next.combatants.length)];
        if (active?.type === 'pc') {
          setTimeout(() => push('ti-bolt', `${active.name}'s turn`), 0);
        }
      }
      return next;
    });
  };

  const parsedSessionLog = sessionLog.map(s => {
    let recap = {};
    try { recap = JSON.parse(s.recap || '{}'); } catch { recap = {}; }
    return { ...s, recap };
  });

  const TABS = ['character', 'encounter', 'map', 'npc', 'quest', 'party', 'log', ...(gmView ? ['settings'] : [])];

  return (
    <div className="app">
      {showSessionEnd && (
        <SessionEndModal
          session={session}
          characters={safeChars}
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
        {isGM && (
          <label className={`pc-toggle ${isPCView ? 'on' : ''}`} style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={isPCView} onChange={e => setIsPCView(e.target.checked)} /> PC View
          </label>
        )}
        <span className={`role-badge ${gmView ? 'role-gm' : 'role-pl'}`}>
          {gmView ? 'GM' : isObserver ? 'Observer' : 'Player'}
        </span>
        <button className="btn btn-sm" onClick={() => setAuthMode(null)}>
          <i className="ti ti-logout" style={{ fontSize: 10 }} /> Logout
        </button>
      </div>

      {isGM && !isPCView && (
        <div className="sess-bar">
          <i className={`ti ${session ? 'ti-circle-filled' : 'ti-circle'}`} style={{ fontSize: 10, color: session ? 'var(--green)' : 'var(--text-muted)' }} />
          <span>Session {sessionNum}</span>
          <span className={session ? 'sess-active' : ''}>{session ? 'Active' : 'Not started'}</span>
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
          />
        )}
        {tab === 'encounter' && (
          <EncounterTab
            isGM={isGM} isPCView={isPCView}
            characters={safeChars}
            session={session}
            encounter={encounter}
            setEncounter={handleSetEncounter}
            npcsFromLog={npcs.filter(n => n.is_visible_to_players || isGM)}
            onUpdateCharacter={handleUpdateChar}
            onAddEncounterEntry={addEncounterEntry}
            onLogSkill={logSkillUse}
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
