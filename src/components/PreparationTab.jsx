import React, { useState } from 'react';
import GridCreatorTab from './GridCreatorTab';
import ItemCreatorTab from './ItemCreatorTab';
import SessionPrepTab from './SessionPrepTab';

// Phase 1: Battle Grid Creator + Item/Magic Item Creator (now "GM's Inventory"). Phase 2: Session Prep
// (reveal model) - associates existing quests/npcs/shops/gm-inventory items with a not-yet-started
// session; nothing is created here, starting that session just flips visibility / hands items off.
//
// A Shop Manager sub-tab briefly lived here (shop-level create/rename/delete/hide-toggle, splitting
// off from ShopTab's per-item editing). Charles asked for it to be undone - ShopTab now owns shop
// management completely again, same as before that split. Don't re-split this without being asked.
export default function PreparationTab({ isDeveloper, characters, onUpdateCharacter, inventory, onUpdateInventory, onLogEvent, allSessions, quests, npcs, onSaveReveals, onCreatePrepSession, onSavePreparedEncounters, npcsFromLog, onCreateQuest, onUnretireSession }) {
  const [subTab, setSubTab] = useState('gminventory');

  const SUBTABS = [
    ['gminventory', "GM's Inventory"],
    ['sessionprep', 'Session Prep'],
    ['gridcreator', 'Battle Grid Creator'],
  ];

  const fullNpcs = (characters || []).filter(c => c.is_npc);
  const pcChars = (characters || []).filter(c => !c.is_npc);
  const preppedSessions = (allSessions || []).filter(s => !s.is_active && !s.closed_at);
  const completedSessions = (allSessions || []).filter(s => !s.is_active && s.closed_at)
    .sort((a, b) => (b.session_number || 0) - (a.session_number || 0));

  const SidePane = ({ icon, title, children }) => (
    <div className="card" style={{ flex: '1 1 260px', minWidth: 220, maxHeight: 420, overflowY: 'auto' }}>
      <div className="card-title" style={{ fontSize: 13 }}><i className={`ti ${icon}`} style={{ marginRight: 6 }} />{title}</div>
      {children}
    </div>
  );

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
      {subTab === 'gminventory' && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 500px', minWidth: 320 }}>
            <ItemCreatorTab
              characters={characters}
              onUpdateCharacter={onUpdateCharacter}
              inventory={inventory}
              onUpdateInventory={onUpdateInventory}
              onLogEvent={onLogEvent}
            />
          </div>

          <SidePane icon="ti-user-bolt" title="NPCs">
            {[...(npcs || []), ...fullNpcs].length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None yet.</div>
            ) : (
              <>
                {(npcs || []).map(n => (
                  <div key={`quick-${n.id}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 0', fontSize: 12, borderBottom: '1px solid rgba(107,78,40,.15)' }}>
                    <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{n.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.faction} R{n.rank || 1}</span>
                  </div>
                ))}
                {fullNpcs.map(n => (
                  <div key={`full-${n.id}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 0', fontSize: 12, borderBottom: '1px solid rgba(107,78,40,.15)' }}>
                    <span style={{ flex: 1, color: 'var(--text-primary)' }}>{n.name}</span>
                    <span style={{ fontSize: 9, color: 'var(--gold-dim)', border: '1px solid rgba(200,150,42,.3)', borderRadius: 3, padding: '0 3px' }}>Full</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.faction} R{n.school_rank || 1}</span>
                  </div>
                ))}
              </>
            )}
          </SidePane>

          <SidePane icon="ti-notebook" title="Sessions">
            <div style={{ fontSize: 10, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4, marginBottom: 2 }}>Prepped</div>
            {preppedSessions.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None.</div>
            ) : preppedSessions.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: 5, padding: '3px 0', fontSize: 12, borderBottom: '1px solid rgba(107,78,40,.15)' }}>
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{s.title || `Session ${s.session_number}`}</span>
              </div>
            ))}
            <div style={{ fontSize: 10, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 8, marginBottom: 2 }}>Completed</div>
            {completedSessions.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None.</div>
            ) : completedSessions.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: 5, padding: '3px 0', fontSize: 12, borderBottom: '1px solid rgba(107,78,40,.15)' }}>
                <span style={{ flex: 1, color: 'var(--text-muted)' }}>{s.title || `Session ${s.session_number}`}</span>
              </div>
            ))}
          </SidePane>

          <SidePane icon="ti-mood-sad" title="Player Disadvantages">
            {pcChars.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No characters yet.</div>
            ) : pcChars.map(c => (
              <div key={c.id} style={{ padding: '4px 0', borderBottom: '1px solid rgba(107,78,40,.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                {(c.disadvantages || []).length === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>None</div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {(c.disadvantages || []).map(d => (d.name || d)).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </SidePane>
        </div>
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
