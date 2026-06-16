import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthScreen } from './components/AuthScreen';
import { Loading } from './components/UI';
import CharacterTab from './components/CharacterTab';
import EncounterTab from './components/EncounterTab';
import MapTab from './components/MapTab';
import { useCharacters, useActiveSession, useNPCs, useQuests, useMapPins, useFactionReputation, useEncounterLog, useGroupInventory } from './hooks/useSupabase';
import { GAME_ID, FACTIONS_DATA } from './data/constants';

export default function App() {
  const [authMode, setAuthMode] = useState(null);
  const isGM = authMode === 'gm';
  const isObserver = authMode === 'observer';
  const myCharId = authMode && authMode !== 'gm' && authMode !== 'observer' ? authMode : null;

  const { characters, loading: charsLoading, createCharacter, updateCharacter, deleteCharacter } = useCharacters();
  const { session, loading: sessLoading, startSession, endSession } = useActiveSession();
  const { npcs } = useNPCs();
  const { quests } = useQuests(session?.id);
  const { pins, loading: pinsLoading, createPin, updatePin, deletePin } = useMapPins();
  const { reps, updateRep } = useFactionReputation();
  const { log: encounterLog, addEntry: addEncounterEntry } = useEncounterLog();
  const { inventory, updateInventory } = useGroupInventory();

  const [encounter, setEncounter] = useState({
    state: 'idle', setup: { type: null, setting: null, desc: '', name: '', selectedNPCs: [] },
    combatants: [], activeTurn: 0, dmgBanner: null, envQuirk: null, round: 1,
  });

  const [tab, setTab] = useState('character');
  const [isPCView, setIsPCView] = useState(false);
  const [pcPasswords, setPcPasswords] = useState({});

  if (!authMode) {
    return <AuthScreen characters={characters} onGMLogin={() => setAuthMode('gm')} onPCLogin={id => setAuthMode(id)} onObserver={() => setAuthMode('observer')} />;
  }

  if (charsLoading || sessLoading) return <Loading message="Loading game data..." />;

  const encActive = encounter.state === 'active';
  const myChar = myCharId ? characters.find(c => c.id === myCharId) : null;
  const sessionNum = session?.session_number || 1;

  const handleUpdateChar = async (id, updates) => { await updateCharacter(id, updates); };
  const handleCreateChar = async (charData) => { await createCharacter(charData); };
  const handleDeleteChar = async (id) => { await deleteCharacter(id); };
  const handleSessionEnd = async () => { if (session) await endSession(session.id); };

  const TABS = ['character', 'encounter', 'map', 'npc', 'quest', 'party', 'log'];

  return (
    <div className="app">
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
        <span className={`role-badge ${isGM && !isPCView ? 'role-gm' : 'role-pl'}`}>
          {isGM && !isPCView ? 'GM' : isObserver ? 'Observer' : myChar?.name || 'Player'}
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
            : <button className="btn btn-sm btn-d" onClick={handleSessionEnd}>
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
            characters={characters}
            onUpdateCharacter={handleUpdateChar}
            onCreateCharacter={handleCreateChar}
            onDeleteCharacter={handleDeleteChar}
            myCharId={myCharId}
            pcPasswords={pcPasswords}
            setPcPasswords={setPcPasswords}
          />
        )}
        {tab === 'encounter' && (
          <EncounterTab
            isGM={isGM} isPCView={isPCView}
            characters={characters}
            myCharId={myCharId}
            session={session}
            encounter={encounter}
            setEncounter={setEncounter}
            npcsFromLog={npcs.filter(n => n.is_visible_to_players || isGM)}
            onUpdateCharacter={handleUpdateChar}
            onAddEncounterEntry={addEncounterEntry}
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
        {!['character','encounter','map'].includes(tab) && (
          <div className="card">
            <div className="card-title">{tab.charAt(0).toUpperCase() + tab.slice(1)} Tab</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Being built — coming soon</div>
          </div>
        )}
      </div>
    </div>
  );
}
