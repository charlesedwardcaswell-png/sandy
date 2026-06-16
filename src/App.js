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
  const handleCreateChar = async (charData) => { await createCharacter(charData); };
  const handleDeleteChar = async (id) => { await deleteCharacter(id); };

  const handleSessionEnd = async ({ xpAmount, xpReason, selectedCharIds, recap }) => {
    if (xpAmount > 0) {
      for (const charId of selectedCharIds) {
        const c = characters.find(x => x.id === charId);
        if (!c) continue;
        const newLog = [...(c.xp_log || []), { amount: xpAmount, reason: xpReason, session: sessionNum }];
        await updateCharacter(charId, { xp_total: (c.xp_total || 0) + xpAmount, xp_log: newLog });
      }
    }
    if (session) await endSession(session.id, JSON.stringify(recap));
    setSkillLog({});
    setEncounter(e => ({ ...e, state: 'idle', combatants: [], activeTurn: 0 }));
    setShowSessionEnd(false);
    refetchSessionLog();
  };

  const parsedSessionLog = sessionLog.map(s => {
    let recap = {};
    try { recap = JSON.parse(s.recap || '{}'); } catch { recap = {}; }
    return { ...s, recap };
  });

  const TABS = ['character', 'encounter', 'map', 'npc', 'quest', 'party', 'log'];

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

      <div className="content">
        {tab === 'character' && (
          <CharacterTab
            isGM={isGM} isPCView={isPCView}
            isPlayer={isPlayer}
            characters={safeChars}
            onUpdateCharacter={handleUpdateChar}
            onCreateCharacter={handleCreateChar}
            onDeleteCharacter={handleDeleteChar}
            onCreateNPC={createNPC}
          />
        )}
        {tab === 'encounter' && (
          <EncounterTab
            isGM={isGM} isPCView={isPCView}
            characters={safeChars}
            session={session}
            encounter={encounter}
            setEncounter={setEncounter}
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
            onUpdateNPC={updateNPC}
            onUpdateRep={updateRep}
            encounter={encounter}
            setEncounter={setEncounter}
          />
        )}
        {tab === 'quest' && (
          <QuestTab
            isGM={isGM} isPCView={isPCView}
            session={session}
            quests={quests}
            onCreateQuest={createQuest}
            onUpdateQuest={updateQuest}
            inventory={inventory}
            onUpdateInventory={updateInventory}
          />
        )}
        {tab === 'party' && (
          <PartyTab
            isGM={isGM} isPCView={isPCView}
            characters={safeChars}
            reps={reps}
            inventory={inventory}
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
      </div>
    </div>
  );
}
