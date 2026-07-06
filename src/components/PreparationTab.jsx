import React, { useState } from 'react';
import GridCreatorTab from './GridCreatorTab';
import ItemCreatorTab from './ItemCreatorTab';
import SessionPrepTab from './SessionPrepTab';

// Phase 1: Battle Grid Creator + Item/Magic Item Creator. Phase 2: Session Prep (reveal model) —
// associates existing quests/npcs/shops/gm-inventory items with a not-yet-started session; nothing
// is created here, starting that session just flips visibility / hands items off.
//
// A Shop Manager sub-tab briefly lived here (shop-level create/rename/delete/hide-toggle, splitting
// off from ShopTab's per-item editing). Charles asked for it to be undone — ShopTab now owns shop
// management completely again, same as before that split. Don't re-split this without being asked.
export default function PreparationTab({ isDeveloper, characters, onUpdateCharacter, inventory, onUpdateInventory, onLogEvent, allSessions, quests, npcs, onSaveReveals, onCreatePrepSession, onSavePreparedEncounters, npcsFromLog, onCreateQuest, onUnretireSession }) {
  const [subTab, setSubTab] = useState('sessionprep');

  const SUBTABS = [
    ['sessionprep', 'Session Prep'],
    ['gridcreator', 'Battle Grid Creator'],
    ['itemcreator', 'Item Creator'],
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', borderBottom: '1px solid rgba(107,78,40,.3)', paddingBottom: 6 }}>
        {SUBTABS.map(([id, label]) => (
          <div key={id} onClick={() => setSubTab(id)}
            style={{ padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: subTab === id ? 'rgba(200,150,42,.15)' : 'transparent',
              color: subTab === id ? 'var(--gold)' : 'var(--text-muted)' }}>
            {label}
          </div>
        ))}
      </div>
      {subTab === 'gridcreator' && <GridCreatorTab isDeveloper={isDeveloper} />}
      {subTab === 'itemcreator' && (
        <ItemCreatorTab
          characters={characters}
          onUpdateCharacter={onUpdateCharacter}
          inventory={inventory}
          onUpdateInventory={onUpdateInventory}
          onLogEvent={onLogEvent}
        />
      )}
      {subTab === 'sessionprep' && (
        <SessionPrepTab
          allSessions={allSessions}
          quests={quests}
          npcs={npcs}
          characters={characters}
          onSaveReveals={onSaveReveals}
          onCreatePrepSession={onCreatePrepSession}
          onSavePreparedEncounters={onSavePreparedEncounters}
          npcsFromLog={npcsFromLog}
          onCreateQuest={onCreateQuest}
          onUnretireSession={onUnretireSession}
        />
      )}
    </div>
  );
}
