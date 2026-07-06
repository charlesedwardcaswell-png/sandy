import React, { useState, useEffect } from 'react';
import { SCHOOL_DATA, FACTION_SCHOOLS, SUBFACTION_BONUSES, SUBFACTION_DESCRIPTIONS, SKILL_EMPHASES, FACTIONS_LIST, FACTIONS_DATA, FACTION_AVATARS, FACTION_COLORS, ADVANTAGES, DISADVANTAGES, WEAPONS_LIST, GEAR_LIST, GEAR_DESCRIPTIONS, TRAITS, SAHIR_SCHOOLS, SAHIR_DISCIPLINES, IS_COKALOI_SCHOOL, SKILL_CATEGORIES, OPEN_SKILLS, TECHNIQUE_DESCRIPTIONS, TECHNIQUE_SKILL_LINKS, ITEM_QUALITIES, SKILL_TRAIT_MAP, STATUS_EFFECT_DEFS, SKILL_DESCRIPTIONS, getArmorBonus, ARMOR_TN_BONUS, SHIELDS, SHIELD_ATTACK_PENALTY, getShieldBonus, CREATURES_LIBRARY, CREATURE_TYPE_CATEGORIES, ARROW_TYPES, getTechniqueAutomationStatus, getAdvantageAutomationStatus, getDisadvantageAutomationStatus, CLOTHING_SLOTS, CLOTHING_STATUS_DELTA } from '../data/constants';
import { WoundBadge, SkillDots, FacIcon, CharacterSilhouette, Silhouette, Loading, Empty, AVATAR_TYPES, AVATAR_COLORS, ScrollLore, WeaponIcon, ArmorIcon, getWeaponIconType, RulebookEntryButton } from './UI';
import SpellConstellation from './SpellConstellation';
import JinnRandomizer from './JinnRandomizer';
import { MagicItemBadge } from './MagicItemCreator';
import SocialReferenceModal from './SocialReferenceModal';
import { supabase } from '../lib/supabase';
import { getWoundRank, getArchetype, buildCharacterFromForm, isSahirSchool, calcInsight, insightRankFor, traitXpCost, skillXpCost, nextRankThreshold, TRAIT_RING_MAP, RANK_THRESHOLDS, getEffectiveRankThresholds, getArmorTN } from '../lib/utils';
import { GAME_ID } from '../data/constants';

// ── Character Tab ─────────────────────────────────────────────────────────────
export default function CharacterTab({ isGM, isPCView, isPlayer, sessionLocked = false, encounterActive = false, characters, npcs, onUpdateNPC, onUpdateCharacter, onCreateCharacter, onDeleteCharacter, onCreateNPC, myCharId, myCharIds = [], onClaimCharacter, onUnclaimCharacter, playerPassword, onSavePlayerPassword, jumpToCharId, onClearJump, jumpToNpcId, onClearNpcJump, jinnArtUrl, onJinnSummoned, onUpdateInventory, partyInventoryItems, onRoll, jinnSummonerRef, jinnSummonBonus, onJinnSummonDone, onLogEvent, waterDroughtEnabled, portraitScale = 1.0, startingCP = 45 }) {
  const [view, setView] = useState('sheet');
  const [selId, setSelId] = useState(null);
  const [selNpcId, setSelNpcId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDel, setShowDel] = useState(0);
  const [addEq, setAddEq] = useState('');
  const [jinnOpen, setJinnOpen] = useState(false);
  const [jinnSummonBonusLocal, setJinnSummonBonusLocal] = useState(null);
  const [promoteError, setPromoteError] = useState(null); // surfaces a visible message if Promote to Full Character silently fails
  const [noSessionWarning, setNoSessionWarning] = useState(false);
  const [claimEncounterNotice, setClaimEncounterNotice] = useState(false);

  // Allow parent to trigger Jinn Randomizer via ref (from spell cast)
  React.useEffect(() => {
    if (jinnSummonerRef) {
      jinnSummonerRef.current = (bonus) => {
        setJinnSummonBonusLocal(bonus);
        setJinnOpen(true);
      };
    }
  }, [jinnSummonerRef]);

  // Jump to a specific character (e.g. from NPC tab)
  useEffect(() => {
    if (jumpToCharId && characters.find(c => c.id === jumpToCharId)) {
      setSelId(jumpToCharId);
      setSelNpcId(null);
      setView('sheet');
      if (onClearJump) onClearJump();
    }
  }, [jumpToCharId, characters, onClearJump]);

  // Jump to a specific Quick NPC (e.g. from NPC tab's party list)
  useEffect(() => {
    if (jumpToNpcId && (npcs || []).find(n => n.id === jumpToNpcId)) {
      setSelNpcId(jumpToNpcId);
      setSelId(null);
      setView('sheet');
      if (onClearNpcJump) onClearNpcJump();
    }
  }, [jumpToNpcId, npcs, onClearNpcJump]);

  // Set initial selection — prefer myCharId (claimed character) over first non-NPC character
  useEffect(() => {
    const playerCharsNow = characters.filter(c => !c.is_npc);
    if (playerCharsNow.length > 0) {
      const claimed = myCharId && playerCharsNow.find(c => c.id === myCharId);
      const current = selId && playerCharsNow.find(c => c.id === selId);
      if (!current) {
        // No valid selection — default to claimed character or first
        setSelId(claimed ? claimed.id : playerCharsNow[0].id);
      }
      // Do NOT forcibly reset to claimed if user has manually navigated elsewhere
    }
  }, [characters, myCharId]);

  // Player view — see all characters, but canEdit is restricted to characters this player has actually
  // claimed (myCharIds). The old "edit any (honour system)" comment here was stale/inaccurate — canEdit
  // does gate real edit capability (see CharacterSheet), it was just checking the wrong field (singular
  // myCharId, which only ever holds the FIRST-claimed character) for anyone who'd claimed more than one.
  if (!isGM && !isPCView) {
    if (view === 'create') {
      return (
        <div>
          <button className="btn btn-sm" style={{ marginBottom: '1rem' }} onClick={() => setView('sheet')}>← Back</button>
          <CharacterCreation
            isGM={false}
            startingCP={startingCP}
            onComplete={async (charData) => { await onCreateCharacter(charData); setView('sheet'); }}
            onCancel={() => setView('sheet')}
          />
        </div>
      );
    }

    const playerChars = characters.filter(c => !c.is_npc);

    const myChar = myCharId ? characters.find(c => c.id === myCharId) : null;
    const hasSummonAbility = myChar && (
      (myChar.advantages || []).some(a => a.name && a.name.toLowerCase().includes('smokeless')) ||
      (myChar.spells || []).some(s => s.discipline === 'summoning' || (s.type && s.type === 'jinn') || (s.name && s.name.toLowerCase().includes('jinn')))
    );
    const myInsightRank = myChar ? (insightRankFor ? insightRankFor(myChar) : myChar.school_rank || 1) : 1;

    return (
      <div>
        <div style={{ marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
          {playerChars.length > 0 && (
            <select className="pc-sel" value={selId || ''} onChange={e => setSelId(e.target.value)} style={{ flex: 1 }}>
              {playerChars.map(c => <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>)}
            </select>
          )}
          {(() => {
            const partyFullNpcs = characters.filter(c => c.is_npc && c.is_party_asset);
            const partyQuickNpcs = (npcs || []).filter(n => n.is_party_asset);
            if (partyFullNpcs.length === 0 && partyQuickNpcs.length === 0) return null;
            const curVal = selNpcId ? `q_${selNpcId}` : (selId && characters.find(c => c.id === selId)?.is_npc) ? `f_${selId}` : '';
            return (
              <select className="pc-sel" value={curVal}
                onChange={e => {
                  const v = e.target.value;
                  if (!v) return;
                  if (v.startsWith('q_')) { setSelNpcId(v.slice(2)); setSelId(null); }
                  else { setSelId(v.slice(2)); setSelNpcId(null); }
                  setShowDel(0);
                }}
                style={{ borderColor: 'rgba(74,122,200,.4)', color: '#80a8d8' }}>
                <option value="" disabled>Party NPCs</option>
                {partyFullNpcs.map(c => <option key={'f_' + c.id} value={'f_' + c.id}>{c.name} — {c.school || c.faction || 'NPC'}</option>)}
                {partyQuickNpcs.map(n => <option key={'q_' + n.id} value={'q_' + n.id}>{n.name} — {n.faction}</option>)}
              </select>
            );
          })()}
          <button className="btn btn-sm btn-p" onClick={() => { if (sessionLocked) { setNoSessionWarning(true); return; } setNoSessionWarning(false); setView('create'); }}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> New Character
          </button>
          {selId && onClaimCharacter && (() => {
            const selChar = characters.find(c => c.id === selId);
            if (selChar?.is_npc) return null;
            const isMine = myCharIds.includes(selId);
            const claimedBy = selChar?.claimed_by_name;
            const claimedByOther = claimedBy && !isMine;
            return (
              <button
                className={`btn btn-sm ${isMine ? 'btn-p' : ''}`}
                onClick={() => { if (encounterActive && !isMine) setClaimEncounterNotice(true); onClaimCharacter(selId); }}
                title={isMine ? 'Click to unclaim this character' : claimedByOther ? `Controlled by ${claimedBy} — click to also claim` : 'Claim this character as one you control (you can control multiple)'}
                style={isMine ? {} : claimedByOther ? { borderColor: '#4a8a40', color: '#6aba60' } : { borderColor: 'var(--gold-dim)', color: 'var(--gold-dim)' }}
              >
                {isMine
                  ? <><i className="ti ti-user-check" style={{ fontSize: 12 }} /> My Character</>
                  : claimedByOther
                    ? <><i className="ti ti-user" style={{ fontSize: 12 }} /> {claimedBy}</>
                    : <><i className="ti ti-user-question" style={{ fontSize: 12 }} /> Claim as Mine</>
                }
              </button>
            );
          })()}
          {hasSummonAbility && onCreateNPC && (
            <button className="btn btn-sm" onClick={() => setJinnOpen(true)}
              style={{ borderColor: 'rgba(160,120,200,.5)', color: 'var(--gold)' }}
              title="You know Jinn Summoning — open the Summoning ritual">
              ✦ Summon Jinn
            </button>
          )}
        </div>
        {noSessionWarning && (
          <div style={{ fontSize: 12, color: 'var(--red, #c84030)', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 12 }} />
            You can't create a character right now — there's no active session. Ask your GM to start one.
            <button onClick={() => setNoSessionWarning(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>×</button>
          </div>
        )}
        {claimEncounterNotice && (
          <div style={{ fontSize: 12, color: 'var(--gold-dim)', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 12 }} />
            Heads up — an encounter is currently active. Claiming a character mid-encounter can be confusing (turn order, granted actions, etc.) — it went through, just flagging it.
            <button onClick={() => setClaimEncounterNotice(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>×</button>
          </div>
        )}
        {playerChars.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            No characters yet — create yours above.
          </div>
        )}
        {selId && characters.find(c => c.id === selId && !c.is_npc) && (
          <CharacterSheet
            char={characters.find(c => c.id === selId)}
            isGM={false} canEdit={myCharIds.includes(selId)}
            onUpdate={onUpdateCharacter}
            myCharId={myCharId}
            myCharIds={myCharIds}
            onClaimCharacter={onClaimCharacter}
            onUnclaimCharacter={onUnclaimCharacter}
            onUpdateInventory={onUpdateInventory}
            partyInventoryItems={partyInventoryItems}
            onRoll={onRoll} allChars={characters}
            waterDroughtEnabled={waterDroughtEnabled}
            portraitScale={portraitScale}
            onLogEvent={onLogEvent}
          />
        )}
        {/* Companion sheet — party-flagged is_npc characters, viewable by any player. Control is opt-in
            via the checkbox rendered inside CharacterSheet itself (single controller, self-service). */}
        {!isGM && selId && (() => {
          const comp = characters.find(c => c.id === selId && c.is_npc && c.is_party_asset);
          if (!comp) return null;
          return (
            <div>
              <div style={{ fontSize: 12, color: '#80a8d8', marginBottom: '.4rem', padding: '.3rem .6rem', background: 'rgba(74,122,200,.08)', borderRadius: 4, border: '1px solid rgba(74,122,200,.25)' }}>
                <i className="ti ti-paw" style={{ marginRight: 5 }} />Party NPC — check the box below if you want to take actions for this NPC in encounters.
              </div>
              <CharacterSheet
                char={comp}
                isGM={false} canEdit={false}
                onUpdate={onUpdateCharacter}
                myCharId={myCharId}
                myCharIds={myCharIds}
                onClaimCharacter={null}
                onUnclaimCharacter={null}
                onUpdateInventory={null}
                partyInventoryItems={partyInventoryItems}
                onRoll={onRoll} allChars={characters}
                waterDroughtEnabled={waterDroughtEnabled}
                portraitScale={portraitScale} onLogEvent={onLogEvent} />
            </div>
          );
        })()}
        {/* Quick NPC sheet — party-flagged npcs table entries, viewable by any player */}
        {!isGM && selNpcId && (() => {
          const npc = (npcs || []).find(n => n.id === selNpcId && n.is_party_asset);
          if (!npc) return null;
          const isController = npc.controller_id === myCharId;
          return (
            <div>
              <div style={{ fontSize: 12, color: 'var(--gold-dim)', marginBottom: '.4rem', padding: '.3rem .6rem', background: 'rgba(200,150,42,.08)', borderRadius: 4, border: '1px solid rgba(200,150,42,.25)' }}>
                <i className="ti ti-user-bolt" style={{ marginRight: 5 }} />Quick NPC — check the box below if you want to take actions for this NPC in encounters.
              </div>
              <div className="card">
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{npc.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{npc.faction} — {npc.school} R{npc.rank || 1}</div>
                {npc.weapon && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Weapon: {npc.weapon} ({npc.weapon_dr || '3k2'})</div>
                )}
                {npc.player_notes && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontStyle: 'italic' }}>{npc.player_notes}</div>
                )}
                {myCharId && (
                  <label className="chk-row" style={{ fontSize: 11, marginTop: 4, color: isController ? 'var(--green)' : 'var(--text-muted)' }}
                    title={npc.controller_id && !isController
                      ? 'Someone else is controlling this NPC in encounters — checking this takes over'
                      : 'Take actions for this NPC on its turn in encounters (including downtime)'}>
                    <input type="checkbox" checked={isController}
                      onChange={e => onUpdateNPC && onUpdateNPC(npc.id, { controller_id: e.target.checked ? myCharId : null })} />
                    {npc.controller_id && !isController ? 'Controlled by another player — take over?' : 'Take actions for this NPC in encounters'}
                  </label>
                )}
              </div>
            </div>
          );
        })()}
        {jinnOpen && (
          <JinnRandomizer
            onClose={() => { setJinnOpen(false); setJinnSummonBonusLocal(null); if (onJinnSummonDone) onJinnSummonDone(); }}
            onCreateCharacter={onCreateCharacter}
            onCreateNPC={onCreateNPC}
            isGM={false}
            characters={characters}
            myCharId={myCharId}
            jinnArtUrl={jinnArtUrl}
            onJinnSummoned={onJinnSummoned}
            summoningBonus={jinnSummonBonusLocal || jinnSummonBonus}
          />
        )}
      </div>
    );
  }

  // GM view
  const char = selId ? characters.find(c => c.id === selId) : null;

  return (
    <div>
      {/* GM top bar */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '.3rem' }}>
          <button className={`btn btn-sm ${view === 'sheet' ? 'btn-p' : ''}`} onClick={() => setView('sheet')}>
            <i className="ti ti-user" style={{ fontSize: 12 }} /> Characters
          </button>
          <button className={`btn btn-sm ${view === 'create' ? 'btn-p' : ''}`} onClick={() => setView('create')}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> Full Character
          </button>
          {onCreateNPC && (
            <button className={`btn btn-sm ${view === 'npc' ? 'btn-p' : ''}`} onClick={() => setView('npc')}>
              <i className="ti ti-user-bolt" style={{ fontSize: 12 }} /> Quick NPC
            </button>
          )}
          {onCreateNPC && (
            <button className="btn btn-sm" onClick={() => setJinnOpen(true)}
              style={{ borderColor: 'rgba(160,120,200,.5)', color: 'var(--gold)' }}
              title="Open the Jinn Summoning randomizer">
              ✦ Summon Jinn
            </button>
          )}
        </div>

      {view === 'sheet' && (characters.length > 0 || (npcs?.length || 0) > 0) && (
          <>
            {/* 1 — Player Characters */}
            {characters.filter(c => !c.is_npc).length > 0 && (
              <select className="pc-sel"
                value={(!selNpcId && selId && !characters.find(c => c.id === selId)?.is_npc) ? selId : ''}
                onChange={e => { setSelId(e.target.value); setSelNpcId(null); setShowDel(0); }}>
                <option value="" disabled>Player Characters</option>
                {characters.filter(c => !c.is_npc).map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>
                ))}
              </select>
            )}
            {/* Companions assigned by GM — is_npc characters with claimed_by_name matching this player's character names */}
            {!isGM && !isPCView && (() => {
              const myCharNames = (characters || []).filter(c => myCharIds.includes(c.id) && !c.is_npc).map(c => c.name);
              const companions = characters.filter(c => c.is_npc && myCharNames.includes(c.claimed_by_name));
              if (companions.length === 0) return null;
              return (
                <select className="pc-sel"
                  value={(!selNpcId && selId && companions.some(c => c.id === selId)) ? selId : ''}
                  onChange={e => { setSelId(e.target.value); setSelNpcId(null); setShowDel(0); }}
                  style={{ borderColor: 'rgba(74,122,200,.4)', color: '#80a8d8' }}>
                  <option value="" disabled>My Companions</option>
                  {companions.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.school || c.faction || 'Companion'}</option>
                  ))}
                </select>
              );
            })()}
            {/* 2 — Full NPC sheets (GM only) */}
            {isGM && characters.filter(c => c.is_npc).length > 0 && (
              <select className="pc-sel"
                value={(!selNpcId && selId && characters.find(c => c.id === selId)?.is_npc) ? selId : ''}
                onChange={e => { setSelId(e.target.value); setSelNpcId(null); setShowDel(0); }}
                style={{ borderColor: 'rgba(200,64,48,.4)', color: 'var(--text-secondary)' }}>
                <option value="" disabled>Full NPC Sheets</option>
                {characters.filter(c => c.is_npc).map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>
                ))}
              </select>
            )}
            {/* 3 — Library (quick) NPCs */}
            {(npcs?.length || 0) > 0 && (
              <select className="pc-sel" value={selNpcId || ''} onChange={e => { setSelNpcId(e.target.value || null); setShowDel(0); }} style={{ borderColor: 'rgba(200,150,42,.4)', color: 'var(--gold-dim)' }}>
                <option value="">Quick NPCs</option>
                {npcs.map(n => <option key={n.id} value={n.id}>{n.name} — {n.faction}</option>)}
              </select>
            )}
            {/* GM-only delete — single clean confirmation flow */}
            {isGM && !isPCView && !selNpcId && (
              <>
                {showDel === 0 && (
                  <button className="btn btn-sm btn-d" onClick={() => setShowDel(1)}>
                    Delete
                  </button>
                )}
                {showDel === 1 && char && (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--red)' }}>Delete {char.name}?</span>
                    <button className="btn btn-sm btn-d" onClick={async () => { await onDeleteCharacter(char.id); setSelId(null); setShowDel(0); }}>
                      Yes, delete
                    </button>
                    <button className="btn btn-sm" onClick={() => setShowDel(0)}>Cancel</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Views */}
      {view === 'sheet' && selNpcId && (() => {
        const npc = npcs?.find(n => n.id === selNpcId);
        if (!npc) return null;
        const sd = SCHOOL_DATA[npc.school];
        const npcTechniques = [];
        for (let r = 1; r <= (npc.rank || 1); r++) { if (sd?.techniques?.[r]) npcTechniques.push({ rank: r, text: sd.techniques[r] }); }
        const combinedLore = npcTechniques.length > 0
          ? npcTechniques.map(t => `Rank ${t.rank}: ${t.text}`).join('\n\n')
          : 'No technique data found for this school — check the school name matches one in the reference data.';
        const alreadyPromoted = !!npc.character_id && characters.some(c => c.id === npc.character_id);

        const promoteNpc = async () => {
          setPromoteError(null);
          if (!onCreateCharacter) { setPromoteError('Promote failed: character creation is unavailable right now (no active session?).'); return; }
          try {
          const techs = {};
          npcTechniques.forEach(t => { techs[t.rank] = t.text; });
          const rank = npc.rank || 1;
          const sd = SCHOOL_DATA[npc.school];

          // Build sensible stats from school type and rank
          // Base: all rings at 2 (standard starting), scaled by rank
          // School type shifts primary stat emphasis; bonus_trait gets +1
          const schoolType = sd?.type || 'Warrior';
          const bonusTrait = sd?.bonus_trait || 'Agility';
          // Per-rank trait increases by school type (approximate)
          const rankBonus = Math.max(0, rank - 1); // Rank 1 = no bonus, R2 = +1, etc.
          // Type-based ring emphasis
          const typeRings = {
            'Warrior':  { air: 1, fire: 1, earth: 0, water: 0 },
            'Sahir':    { air: 1, fire: 1, earth: 0, water: 0 },
            'Diplomat': { air: 1, fire: 0, earth: 0, water: 1 },
            'Ninja':    { air: 1, fire: 1, earth: 0, water: 0 },
          }[schoolType] || { air: 0, fire: 1, earth: 0, water: 0 };
          const air   = 2 + (typeRings.air   ? Math.ceil(rankBonus * 0.5) : 0);
          const fire  = 2 + (typeRings.fire  ? Math.ceil(rankBonus * 0.5) : 0);
          const earth = 2 + Math.floor(rankBonus * 0.3);
          const water = 2 + (typeRings.water ? Math.ceil(rankBonus * 0.4) : Math.floor(rankBonus * 0.2));
          const voidR = 2;
          // Individual traits — start at ring value, bonus_trait gets +1
          const makeTrait = (ring, traitName) => ring + (bonusTrait === traitName ? 1 : 0);
          const startRef = makeTrait(air,   'Reflexes');
          const startAwa = makeTrait(air,   'Awareness');
          const startSta = makeTrait(earth, 'Stamina');
          const startWil = makeTrait(earth, 'Willpower');
          const startAgi = makeTrait(fire,  'Agility');
          const startInt = makeTrait(fire,  'Intelligence');
          const startStr = makeTrait(water, 'Strength');
          const startPer = makeTrait(water, 'Perception');

          // Build school skills at rank
          const schoolSkills = (sd?.skills || []).map(s => ({
            name: s, rank: rank, school: true
          }));

          const newChar = await onCreateCharacter({
            name: npc.name, faction: npc.faction || '', school: npc.school || '',
            school_rank: rank, insight_rank: rank,
            is_npc: true,
            air, earth, fire, water, void: voidR,
            reflexes: startRef, awareness: startAwa, stamina: startSta, willpower: startWil,
            agility: startAgi, intelligence: startInt, strength: startStr, perception: startPer,
            current_wounds: 0, max_wounds: startSta * 17, current_void: voidR,
            integrity: npc.integrity || 4, reputation: npc.reputation || 0, status: npc.status || 0,
            copper: 0, player_notes: npc.player_notes || '', gm_notes: npc.gm_notes || '',
            skills: schoolSkills, equipment: [], advantages: [], disadvantages: [],
            techniques: techs, spells: npc.spells || [],
          });
          if (newChar) {
            if (onUpdateNPC) await onUpdateNPC(npc.id, { character_id: newChar.id });
            setSelNpcId(null);
            setSelId(newChar.id);
            setEditMode(true);
          } else {
            setPromoteError('Promote failed: character creation returned no result — check the browser console for a Supabase error.');
          }
          } catch (err) {
            console.error('promoteNpc error:', err);
            setPromoteError(`Promote failed: ${err.message || err}`);
          }
        };

        return (
          <div className="card" style={{ maxWidth: 540 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {npc.name}
              <ScrollLore title={`${npc.name} — ${npc.school} Techniques`} text={combinedLore} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              {npc.faction} · {npc.school} Rank {npc.rank}
            </div>
            <div style={{ fontSize: 12, color: npc.is_visible_to_players ? 'var(--green)' : 'var(--text-muted)', marginBottom: '.75rem' }}>
              {npc.is_visible_to_players ? '● Visible to players' : '○ Hidden from players'}
            </div>

            {onUpdateNPC && (
              <div style={{ marginBottom: '.75rem', padding: '.5rem .6rem', background: 'rgba(200,150,42,.06)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 5 }}>
                <label className="chk-row" style={{ fontSize: 11, color: npc.is_party_asset ? 'var(--green)' : 'var(--text-muted)' }}
                  title="Party members show up in every player's Character tab so anyone can view the sheet or opt in to control it">
                  <input type="checkbox" checked={!!npc.is_party_asset}
                    onChange={e => onUpdateNPC(npc.id, { is_party_asset: e.target.checked, ...(e.target.checked ? {} : { controller_id: null }) })} />
                  Party Asset
                </label>
                {npc.is_party_asset && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Assign to:</span>
                    <select value={npc.controller_id || ''} onChange={e => onUpdateNPC(npc.id, { controller_id: e.target.value || null })}
                      style={{ fontSize: 11, flex: 1, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 3 }}>
                      <option value="">— Unassigned (players may self-claim) —</option>
                      {characters.filter(c => !c.is_npc).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* ── Stats block — computed same way as Promote ── */}
            {(() => {
              const rank = npc.rank || 1;
              const schoolType = sd?.type || 'Warrior';
              const bonusTrait = sd?.bonus_trait || 'Agility';
              const rankBonus = Math.max(0, rank - 1);
              const typeRings = {
                'Warrior':  { air: 1, fire: 1, earth: 0, water: 0 },
                'Sahir':    { air: 1, fire: 1, earth: 0, water: 0 },
                'Diplomat': { air: 1, fire: 0, earth: 0, water: 1 },
                'Ninja':    { air: 1, fire: 1, earth: 0, water: 0 },
              }[schoolType] || { air: 0, fire: 1, earth: 0, water: 0 };
              const air   = 2 + (typeRings.air   ? Math.ceil(rankBonus * 0.5) : 0);
              const fire  = 2 + (typeRings.fire  ? Math.ceil(rankBonus * 0.5) : 0);
              const earth = 2 + Math.floor(rankBonus * 0.3);
              const water = 2 + (typeRings.water ? Math.ceil(rankBonus * 0.4) : Math.floor(rankBonus * 0.2));
              const voidR = 2;
              const bt = (traitName) => (bonusTrait === traitName ? 1 : 0);
              const reflexes    = air   + bt('Reflexes');
              const awareness   = air   + bt('Awareness');
              const stamina     = earth + bt('Stamina');
              const agility     = fire  + bt('Agility');
              const intelligence = fire + bt('Intelligence');
              const strength    = water + bt('Strength');
              const armorTN = 5 + reflexes * 5;
              const initPool = `${reflexes + rank}k${air}`;
              const woundsPerLevel = earth * 2;
              const rings = { Air: air, Earth: earth, Fire: fire, Water: water, Void: voidR };
              return (
                <div style={{ marginBottom: '.75rem' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                    Estimated Stats — {schoolType} Rank {rank}
                    {bonusTrait && <span style={{ color: 'var(--gold-dim)', marginLeft: 6 }}>Bonus: {bonusTrait}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: 12 }}>
                    {Object.entries(rings).map(([ring, val]) => (
                      <div key={ring} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{val}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ring}</div>
                      </div>
                    ))}
                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem', display: 'flex', gap: '1rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{armorTN}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Armor TN</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{initPool}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Initiative</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{woundsPerLevel}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Wounds/lvl</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Equipment / Weapons ── */}
            {(sd?.equipment || []).length > 0 && (
              <div style={{ marginBottom: '.75rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Starting Equipment</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {sd.equipment.map((item, i) => {
                    const w = WEAPONS_LIST.find(x => x.name === item);
                    return (
                      <span key={i} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: w ? 'rgba(200,64,48,.1)' : 'rgba(107,78,40,.1)', border: `1px solid ${w ? 'rgba(200,64,48,.3)' : 'var(--border)'}`, color: w ? '#e07050' : 'var(--text-secondary)' }}>
                        {item}{w?.dr ? ` (${w.dr})` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Skills ── */}
            {(sd?.skills || []).length > 0 && (
              <div style={{ marginBottom: '.75rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>School Skills (Rank {npc.rank || 1})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {sd.skills.map((s, i) => (
                    <span key={i} style={{ fontSize: 12, padding: '2px 7px', borderRadius: 4, background: 'rgba(200,150,42,.08)', border: '1px solid rgba(200,150,42,.25)', color: 'var(--gold-dim)' }}>
                      {s} {npc.rank || 1}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Techniques ── */}
            {npcTechniques.length > 0 && (
              <div style={{ marginBottom: '.75rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Techniques</div>
                {npcTechniques.map(t => (
                  <div key={t.rank} style={{ padding: '4px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--gold-dim)', fontSize: 11, minWidth: 20 }}>R{t.rank}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t.text}</span>
                      {(() => {
                        const status = getTechniqueAutomationStatus(t.text);
                        if (status === 'auto') return null;
                        if (status === 'manual') return (
                          <i className="ti ti-hand-stop" style={{ fontSize: 11, color: 'var(--gold-dim)' }}
                            title="Not automated — this NPC's effect needs to be handled manually. Applies to attack rolls automatically where possible; this one doesn't." />
                        );
                        return (
                          <i className="ti ti-help-circle" style={{ fontSize: 11, color: 'var(--text-muted)' }}
                            title="Not yet reviewed — may not be reflected in NPC attack rolls." />
                        );
                      })()}
                    </div>
                    {TECHNIQUE_DESCRIPTIONS[t.text] && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, marginLeft: 26, lineHeight: 1.5 }}>
                        {TECHNIQUE_DESCRIPTIONS[t.text]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {npc.gm_notes && (
              <div style={{ marginBottom: '.5rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>GM Notes</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{npc.gm_notes}</div>
              </div>
            )}
            {npc.player_notes && (
              <div style={{ marginBottom: '.5rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Player Notes</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{npc.player_notes}</div>
              </div>
            )}
            {(npc.spells || []).length > 0 && (
              <div style={{ marginBottom: '.5rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Spells</div>
                {npc.spells.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.name || s}</div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: '.5rem 0' }}>
              This is a lightweight library NPC — no full sheet. Manage visibility and notes from the NPC tab.
            </div>
            {alreadyPromoted ? (
              <button className="btn btn-sm" onClick={() => { setSelId(npc.character_id); setSelNpcId(null); }}>
                <i className="ti ti-arrow-up-right" style={{ fontSize: 11, marginRight: 4 }} /> View Promoted Full Character
              </button>
            ) : (
              <button className="btn btn-sm btn-p" onClick={promoteNpc}>
                <i className="ti ti-arrow-up" style={{ fontSize: 11, marginRight: 4 }} /> Promote to Full Character
              </button>
            )}
            {promoteError && (
              <div style={{ fontSize: 12, color: 'var(--red, #c84030)', marginTop: '.5rem' }}>{promoteError}</div>
            )}
          </div>
        );
      })()}
      {view === 'sheet' && !selNpcId && (
        char
          ? <CharacterSheet char={char} isGM={true} isPCView={isPCView} canEdit={editMode} onUpdate={onUpdateCharacter} onCreateCharacter={onCreateCharacter} onToggleEdit={() => setEditMode(e => !e)} addEq={addEq} setAddEq={setAddEq} myCharId={myCharId} myCharIds={myCharIds} onClaimCharacter={onClaimCharacter} onUnclaimCharacter={onUnclaimCharacter} onUpdateInventory={onUpdateInventory} partyInventoryItems={partyInventoryItems} onRoll={onRoll} allChars={characters} waterDroughtEnabled={waterDroughtEnabled} portraitScale={portraitScale} onLogEvent={onLogEvent} />
          : <Empty icon="ti-user" message="No characters yet." action={<button className="btn btn-p" onClick={() => setView('create')}>Create First Character</button>} />
      )}

      {view === 'create' && (
        <CharacterCreation isGM={true} startingCP={startingCP} onComplete={async (charData) => {
          const newChar = await onCreateCharacter(charData);
          if (newChar?.id) setSelId(newChar.id);
          setView('sheet');
        }} onCancel={() => setView('sheet')} />
      )}

      {view === 'npc' && onCreateNPC && (
        <NPCQuickCreate onComplete={async (npcData) => {
          const result = await onCreateNPC(npcData);
          if (result) setView('sheet');
          return result;
        }} onCancel={() => setView('sheet')} />
      )}
      {jinnOpen && (
        <JinnRandomizer
          onClose={() => { setJinnOpen(false); setJinnSummonBonusLocal(null); if (onJinnSummonDone) onJinnSummonDone(); }}
          onCreateCharacter={onCreateCharacter}
          onCreateNPC={onCreateNPC}
          isGM={true}
          characters={characters}
          myCharId={myCharId}
          jinnArtUrl={jinnArtUrl}
          onJinnSummoned={onJinnSummoned}
          summoningBonus={jinnSummonBonusLocal || jinnSummonBonus}
        />
      )}
    </div>
  );
}

// ── Add Skill Control ─────────────────────────────────────────────────────────
function AddSkillControl({ char, onAdd }) {
  const [customInput, setCustomInput] = useState(null);
  const existingNames = new Set((char.skills || []).map(s => s.name));
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {customInput !== null ? (
        <div style={{ display: 'flex', gap: 2 }}>
          <input autoFocus style={{ fontSize: 11, width: 120 }} value={customInput} placeholder="Lore: Sewers"
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && customInput.trim() && !customInput.trim().endsWith(': ')) { onAdd(customInput.trim()); setCustomInput(null); } if (e.key === 'Escape') setCustomInput(null); }} />
          <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { if (customInput.trim() && !customInput.trim().endsWith(': ')) { onAdd(customInput.trim()); setCustomInput(null); } }}>Add</button>
          <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => setCustomInput(null)}>✕</button>
        </div>
      ) : (
        <select style={{ fontSize: 11 }} value="" onChange={e => {
          const val = e.target.value; if (!val) return;
          if (val.endsWith('[Custom]')) { setCustomInput(val.replace('[Custom]', '').trim() + ': '); }
          else if (!existingNames.has(val)) { onAdd(val); }
        }}>
          <option value="">+ Add skill</option>
          {Object.entries(SKILL_CATEGORIES).map(([cat, catSkills]) => (
            <optgroup key={cat} label={cat}>
              {catSkills.filter(s => !existingNames.has(s) && !s.endsWith('[Custom]')).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              {catSkills.some(s => s.endsWith('[Custom]')) && (
                <option value={catSkills.find(s => s.endsWith('[Custom]'))}>
                  {cat.split(' ')[0]}: [custom…]
                </option>
              )}
            </optgroup>
          ))}
        </select>
      )}
    </div>
  );
}

// ── Rank-Up Overlay ───────────────────────────────────────────────────────────
// Blocks the character sheet until the player chooses their new technique
function RankUpOverlay({ char, newRank, onConfirm }) {
  const [choice, setChoice] = useState(null); // { school, techName, techDesc }

  // Only the current school's technique and Rank 1 of any other school are valid choices
  const currentSchoolTech = SCHOOL_DATA[char.school]?.techniques?.[newRank];
  const currentSchoolDesc = TECHNIQUE_DESCRIPTIONS[currentSchoolTech] || '';

  // Rank 1 of every other school (multi-school option)
  const allSchoolRank1 = Object.entries(SCHOOL_DATA)
    .filter(([s]) => s !== char.school)
    .map(([s, sd]) => ({ school: s, techName: sd.techniques?.[1], techDesc: TECHNIQUE_DESCRIPTIONS[sd.techniques?.[1]] || '' }))
    .filter(x => x.techName);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,7,4,.96)', zIndex: 300, display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '.5rem' }}>Insight Rank {newRank} Achieved</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)', marginBottom: '.5rem' }}>Choose Your Next Technique</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          You have reached the insight threshold for Rank {newRank}. Select your technique below — this cannot be changed once confirmed.
        </div>

        {/* Option A — Continue current school */}
        {currentSchoolTech && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 12, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>Continue Your School</div>
            <TechOption label={`${char.school} — Rank ${newRank}`} name={currentSchoolTech} desc={currentSchoolDesc}
              selected={choice?.techName === currentSchoolTech}
              onSelect={() => setChoice({ school: char.school, techName: currentSchoolTech, techDesc: currentSchoolDesc })} />
          </div>
        )}

        {/* Option B — Rank 1 of any other school (multi-school) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>Begin a New School — Rank 1</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.5rem', fontStyle: 'italic' }}>Takes you into another tradition. You forfeit your current school's Rank {newRank} technique.</div>
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {allSchoolRank1.map(x => (
              <TechOption key={x.school} label={`${x.school} — Rank 1`} name={x.techName} desc={x.techDesc}
                selected={choice?.techName === x.techName && choice?.school === x.school}
                onSelect={() => setChoice(x)} />
            ))}
          </div>
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: 'rgba(10,7,4,.95)', padding: '1rem 0', display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          {choice && <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>Selected: <strong style={{ color: 'var(--gold)' }}>{choice.techName}</strong></div>}
          {!choice && <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Make a selection above to continue.</div>}
          <button className="btn btn-p" disabled={!choice} onClick={() => onConfirm(choice)}>
            Confirm Rank {newRank} — {choice?.techName || '…'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TechOption({ label, name, desc, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      padding: '.75rem', borderRadius: 6, cursor: 'pointer', marginBottom: '.35rem',
      border: `2px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
      background: selected ? 'rgba(200,150,42,.1)' : 'var(--bg-panel)',
    }}>
      <div style={{ fontSize: 11, color: selected ? 'var(--gold-dim)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--gold)' : 'var(--text-primary)', marginBottom: 4 }}>{name}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>}
    </div>
  );
}

// ── XP Spend Panel ────────────────────────────────────────────────────────────
function XPSpendPanel({ char, onBatchUpdate, onClose }) {
  const [cart, setCart] = useState({}); // { 'trait_agility': { type:'trait', key:'agility', from:2, to:3, cost:12 }, 'skill_Knives': {...} }
  const [showEmphasis, setShowEmphasis] = useState(false);

  const insight = calcInsight(char);
  const insightRank = insightRankFor(insight, char);
  const nextThreshold = getEffectiveRankThresholds(char)[insightRank];
  const xpAvail = (char.xp_total || 0) - (char.xp_spent || 0);
  const cartCost = Object.values(cart).reduce((s, x) => s + x.cost, 0);
  const canAfford = cartCost <= xpAvail;

  // Project the insight WITH pending cart changes applied
  const projectedChar = { ...char };
  Object.values(cart).forEach(item => {
    if (item.type === 'trait') {
      projectedChar[item.key] = item.to;
      const ringInfo = TRAIT_RING_MAP[item.key];
      if (ringInfo) projectedChar[ringInfo.ring] = Math.min(item.to, projectedChar[ringInfo.paired] || 2);
    } else if (item.type === 'skill') {
      projectedChar.skills = (projectedChar.skills || []).map(s => s.name === item.key ? { ...s, rank: item.to } : s);
    }
  });
  const projInsight = calcInsight(projectedChar);
  const projRank = insightRankFor(projInsight, char);

  const addTraitToCart = (traitKey, currentVal) => {
    // Curse of the Grey Crone: chosen Trait is locked to 1, cannot be increased with XP at all
    const greyCroneCurse = (char.disadvantages || []).find(d => (d.name || d) === 'Curse of the Grey Crone' && d.trait);
    if (greyCroneCurse && greyCroneCurse.trait.toLowerCase() === traitKey) return;
    const cartKey = `trait_${traitKey}`;
    const alreadyPending = cart[cartKey];
    const effectiveFrom = alreadyPending ? alreadyPending.to : currentVal;
    if (effectiveFrom >= 10) return; // max trait
    const to = effectiveFrom + 1;
    // Elemental Blessing: -1 XP cost per rank for Traits associated with the chosen Ring, floored at 1
    const elementalBlessing = (char.advantages || []).find(a => (a.name || a) === 'Elemental Blessing' && a.ring);
    const traitRing = TRAIT_RING_MAP[traitKey]?.ring; // lowercase e.g. 'air'; undefined for 'void', which is correct — Elemental Blessing explicitly excludes Void
    const elementalDiscount = elementalBlessing && elementalBlessing.ring.toLowerCase() === traitRing ? 1 : 0;
    // Enlightened: -2 XP cost per rank specifically for raising the Void Ring
    const hasEnlightened = (char.advantages || []).some(a => (a.name || a) === 'Enlightened');
    const enlightenedDiscount = traitKey === 'void' && hasEnlightened ? 2 : 0;
    const cost = Math.max(1, traitXpCost(effectiveFrom) - elementalDiscount - enlightenedDiscount);
    setCart(c => ({ ...c, [cartKey]: { type: 'trait', key: traitKey, from: currentVal, to, cost: (alreadyPending?.cost || 0) + cost, label: traitKey.charAt(0).toUpperCase() + traitKey.slice(1) } }));
  };

  const HIGH_SKILLS = ['Calligraphy','Courtier','Divination','Etiquette','Games','Medicine','Meditation','Sincerity','Storytelling'];
  const addSkillToCart = (skillName, currentRank) => {
    const cartKey = `skill_${skillName}`;
    const alreadyPending = cart[cartKey];
    const effectiveFrom = alreadyPending ? alreadyPending.to : currentRank;
    if (effectiveFrom >= 10) return;
    const to = effectiveFrom + 1;
    let cost = skillXpCost(effectiveFrom);
    // Obtuse: XP cost doubled for any High Skill except Investigation/Medicine
    const hasObtuse = (char.disadvantages || []).some(d => (d.name || d) === 'Obtuse');
    if (hasObtuse && HIGH_SKILLS.includes(skillName) && skillName !== 'Medicine' && skillName !== 'Investigation') cost *= 2;
    // Cursed by the Honest Hand: XP cost doubled for one chosen non-weapon skill
    const honestHand = (char.disadvantages || []).find(d => (d.name || d) === 'Cursed by the Honest Hand' && d.skill);
    if (honestHand && honestHand.skill === skillName) cost *= 2;
    setCart(c => ({ ...c, [cartKey]: { type: 'skill', key: skillName, from: currentRank, to, cost: (alreadyPending?.cost || 0) + cost, label: skillName } }));
  };

  const removeFromCart = (cartKey) => setCart(c => { const n = { ...c }; delete n[cartKey]; return n; });

  const confirmSpend = () => {
    if (!canAfford || cartCost === 0) return;
    const updates = { xp_spent: (char.xp_spent || 0) + cartCost };
    const newLog = [...(char.xp_log || []), { amount: -cartCost, reason: 'XP spent on advances', date: new Date().toLocaleDateString() }];
    updates.xp_log = newLog;
    // Apply trait/ring changes
    Object.values(cart).forEach(item => {
      if (item.type === 'trait') {
        updates[item.key] = item.to;
        const ringInfo = TRAIT_RING_MAP[item.key];
        if (ringInfo) {
          const otherVal = (updates[ringInfo.paired] !== undefined ? updates[ringInfo.paired] : char[ringInfo.paired]) || 2;
          updates[ringInfo.ring] = Math.min(item.to, otherVal);
        }
      } else if (item.type === 'skill') {
        const currentSkills = updates.skills || char.skills || [];
        const exists = currentSkills.some(s => s.name === item.key);
        if (exists) {
          updates.skills = currentSkills.map(s => s.name === item.key ? { ...s, rank: item.to } : s);
        } else {
          // New skill — add it to the character's skill list
          updates.skills = [...currentSkills, { name: item.key, rank: item.to, school: false, emphases: [] }];
        }
      } else if (item.type === 'emphasis') {
        const [skillName, emphasis] = item.key.split('|||');
        updates.skills = (updates.skills || char.skills || []).map(s => {
          if (s.name !== skillName) return s;
          const updated = { ...s, emphases: [...new Set([...(s.emphases || []), emphasis])] };
          // Gorilla Bodyguard advantage: gaining the Gorilla emphasis on Animal Handling
          // automatically grants Animal Handling 5 if below that rank — BUT ONLY if the
          // character actually has the Gorilla Bodyguard advantage
          const hasGorillaBG = (char.advantages || []).some(a => (a.name || a) === 'Gorilla Bodyguard');
          if (skillName === 'Animal Handling' && emphasis === 'Gorilla' && hasGorillaBG && (s.rank || 0) < 5) {
            updated.rank = 5;
          }
          return updated;
        });
      }
    });
    onBatchUpdate(updates);
    onClose();
  };

  const TRAIT_LIST = [
    { key: 'reflexes', label: 'Reflexes', ring: 'Air' },
    { key: 'awareness', label: 'Awareness', ring: 'Air' },
    { key: 'stamina', label: 'Stamina', ring: 'Earth' },
    { key: 'willpower', label: 'Willpower', ring: 'Earth' },
    { key: 'agility', label: 'Agility', ring: 'Fire' },
    { key: 'intelligence', label: 'Intelligence', ring: 'Fire' },
    { key: 'strength', label: 'Strength', ring: 'Water' },
    { key: 'perception', label: 'Perception', ring: 'Water' },
    { key: 'void', label: 'Void Ring', ring: 'Void' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,7,4,.95)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>Spend Experience Points</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select advances below. Changes aren't saved until you confirm.</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: canAfford ? 'var(--green)' : 'var(--red)' }}>{xpAvail - cartCost} XP</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{xpAvail} available − {cartCost} pending</div>
          </div>
        </div>

        {/* Insight tracker */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.4rem' }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Insight </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{insight}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>Rank {insightRank}</span>
            </div>
            {projInsight !== insight && (
              <div style={{ fontSize: 13, color: 'var(--green)' }}>→ {projInsight} after spending {projRank > insightRank ? <strong style={{ color: 'var(--gold)' }}> (Rank {projRank}!)</strong> : ''}</div>
            )}
          </div>
          {insightRank < 5 && (
            <div>
              <div style={{ height: 6, background: 'var(--bg-dark)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: 'var(--gold)', width: `${Math.min(100, ((projInsight - getEffectiveRankThresholds(char)[insightRank-1]) / (nextThreshold - getEffectiveRankThresholds(char)[insightRank-1])) * 100)}%`, transition: 'width .3s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Next rank at {nextThreshold} ({Math.max(0, nextThreshold - projInsight)} more insight needed)</div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Traits */}
          <div className="card">
            <div className="card-title">Traits <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>(new rank × 4 XP)</span></div>
            {TRAIT_LIST.map(t => {
              const cur = char[t.key] || 2;
              const cartKey = `trait_${t.key}`;
              const pending = cart[cartKey];
              const displayVal = pending ? pending.to : cur;
              const nextCost = traitXpCost(displayVal);
              const greyCroneCurse = (char.disadvantages || []).find(d => (d.name || d) === 'Curse of the Grey Crone' && d.trait);
              const isLockedByGreyCrone = greyCroneCurse && greyCroneCurse.trait.toLowerCase() === t.key;
              return (
                <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '4px 0', borderBottom: '1px solid rgba(107,78,40,.15)' }}>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{t.label}<span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{t.ring}</span></span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: pending ? 'var(--green)' : 'var(--gold)', minWidth: 20, textAlign: 'center' }}>{displayVal}</span>
                  {pending && <span style={{ fontSize: 11, color: 'var(--green)' }}>↑</span>}
                  {isLockedByGreyCrone && <span style={{ fontSize: 10, color: 'var(--red)' }} title="Curse of the Grey Crone — cannot be raised with XP">🔒 locked</span>}
                  {!isLockedByGreyCrone && displayVal < 5 && (
                    <button className="btn btn-sm" style={{ fontSize: 11, padding: '1px 6px' }}
                      onClick={() => addTraitToCart(t.key, cur)} title={`${nextCost} XP`}>
                      +1 ({nextCost}xp)
                    </button>
                  )}
                  {pending && <button className="btn btn-sm" style={{ fontSize: 10, color: 'var(--red)' }} onClick={() => removeFromCart(cartKey)}>✕</button>}
                </div>
              );
            })}
          </div>

          {/* Skills */}
          <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Skills <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>(new rank × 2 XP · emphasis: 2/4/6… XP)</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showEmphasis} onChange={e => setShowEmphasis(e.target.checked)} />
                Show available emphases
              </label>
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {Object.entries(SKILL_CATEGORIES).map(([cat, catSkills]) => {
                // Build full list: all category skills + character's custom skills in this category
                const customInCat = (char.skills || []).filter(sk => {
                  const n = sk.name;
                  return !catSkills.includes(n) && (
                    (cat === 'Lore' && n.startsWith('Lore:')) ||
                    (cat === 'Craft' && n.startsWith('Craft:')) ||
                    (cat === 'Perform' && n.startsWith('Perform:'))
                  );
                }).map(sk => sk.name);
                const allSkillNames = [...catSkills.filter(s => !s.endsWith('[Custom]')), ...customInCat];
                return (
                  <div key={cat} style={{ marginBottom: '.5rem' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '2px 0', borderBottom: '1px solid var(--border)', marginBottom: '.2rem' }}>{cat}</div>
                    {allSkillNames.map(sName => {
                      const s = (char.skills || []).find(x => x.name === sName);
                      const cartKey = `skill_${sName}`;
                      const pending = cart[cartKey];
                      const currentRank = s?.rank || 0;
                      const displayRank = pending ? pending.to : currentRank;
                      const nextCost = skillXpCost(displayRank);
                      const isSchool = s?.school || false;
                      return (
                        <React.Fragment key={sName}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '2px 0' }}>
                            <span className={`skill-nm ${isSchool ? 'sc' : ''}`} style={{ flex: 1, fontSize: 12, color: currentRank > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {sName}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: pending ? 'var(--green)' : currentRank > 0 ? 'var(--gold)' : 'var(--border)', minWidth: 18, textAlign: 'center' }}>
                              {displayRank || '–'}
                            </span>
                            {displayRank < 10 && (
                              <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px' }}
                                onClick={() => addSkillToCart(sName, currentRank)} title={`${nextCost} XP`}>
                                +1 ({nextCost}xp)
                              </button>
                            )}
                            {pending && <button className="btn btn-sm" style={{ fontSize: 10, color: 'var(--red)' }} onClick={() => removeFromCart(cartKey)}>✕</button>}
                          </div>
                          {/* Emphases — show owned + XP purchase option */}
                          {currentRank > 0 && (
                          <div style={{ paddingLeft: '.5rem', paddingBottom: 2 }}>
                            {(s?.emphases || []).map(e => {
                              const emphCartKey = `emph_${sName}|||${e}`;
                              return (
                                <span key={e} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, background: cart[emphCartKey] ? 'rgba(40,160,80,.15)' : 'rgba(200,150,42,.12)', border: `1px solid ${cart[emphCartKey] ? 'var(--green-dim)' : 'rgba(200,150,42,.3)'}`, color: cart[emphCartKey] ? 'var(--green)' : 'var(--gold-dim)', marginRight: 3 }}>
                                  {e}
                                </span>
                              );
                            })}
                            {/* XP emphasis purchase — from predefined list only */}
                            {showEmphasis && (() => {
                              const ownedEmphases = s?.emphases || [];
                              const allowedEmphases = SKILL_EMPHASES[sName] || [];
                              const pendingEmphases = Object.values(cart).filter(i => i.type === 'emphasis' && i.key.startsWith(sName + '|||')).map(i => i.to);
                              const allOwned = [...ownedEmphases, ...pendingEmphases];
                              const available = allowedEmphases.filter(e => !allOwned.includes(e));
                              const emphasisCap = currentRank >= 10 ? 99 : currentRank >= 7 ? 6 : currentRank >= 5 ? 5 : currentRank >= 3 ? 3 : 1;
                              const atCap = allOwned.length >= emphasisCap;
                              const nextEmphCost = (allOwned.length + 1) * 2;
                              if (available.length === 0 && allowedEmphases.length === 0) return null;
                              return (
                                <div style={{ marginTop: 2 }}>
                                  {atCap && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>Max emphases at Rank {currentRank}</span>}
                                  {!atCap && available.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 1 }}>
                                      <span style={{ fontSize: 9, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 2 }}>{nextEmphCost}xp:</span>
                                      {available.map(emp => {
                                        const emphCartKey2 = `emph_${sName}|||${emp}`;
                                        const inCart = !!cart[emphCartKey2];
                                        return (
                                          <button key={emp} onClick={() => {
                                            if (inCart) { setCart(c => { const n = {...c}; delete n[emphCartKey2]; return n; }); }
                                            else { setCart(c => ({ ...c, [emphCartKey2]: { type: 'emphasis', key: `${sName}|||${emp}`, cost: nextEmphCost, label: `${sName}: ${emp} (emphasis)`, from: '', to: emp } })); }
                                          }}
                                            style={{ fontSize: 9, padding: '1px 4px', borderRadius: 8, border: `1px solid ${inCart ? 'var(--green)' : 'rgba(200,150,42,.3)'}`, background: inCart ? 'rgba(40,160,80,.15)' : 'transparent', color: inCart ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                            {inCart ? '✓ ' : '+ '}{emp}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart summary */}
        {Object.values(cart).length > 0 && (
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '.75rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.4rem' }}>Pending Advances</div>
            {Object.values(cart).map(item => (
              <div key={item.key} style={{ display: 'flex', gap: '.5rem', fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0' }}>
                <span style={{ color: 'var(--green)' }}>+</span>
                <span style={{ flex: 1 }}>{item.label} {item.from} → {item.to}</span>
                <span style={{ color: 'var(--gold)' }}>{item.cost} XP</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '.4rem', paddingTop: '.4rem', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Total</span>
              <span style={{ fontSize: 14, color: canAfford ? 'var(--gold)' : 'var(--red)' }}>{cartCost} XP</span>
            </div>
            {!canAfford && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: '.3rem' }}>Not enough XP — remove some advances or ask your GM for more XP.</div>}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-p" disabled={!canAfford || cartCost === 0} onClick={confirmSpend}>
            Confirm — Spend {cartCost} XP
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Character Sheet ───────────────────────────────────────────────────────────
function CharacterSheet({ char, isGM, isPCView, canEdit, onUpdate, onCreateCharacter, onToggleEdit, addEq, setAddEq, myCharId, myCharIds = [], onClaimCharacter, onUnclaimCharacter, onUpdateInventory, partyInventoryItems, onRoll, allChars, waterDroughtEnabled, portraitScale = 1.0, onLogEvent }) {
  const wR = getWoundRank(char.current_wounds, char.max_wounds);
  const WOUND_TN_PENALTY = [0, 3, 5, 10, 15, 20, 40, 999];
  const hasSotESheet = (char.advantages || []).some(a => (a.name || a) === 'Strength of the Earth');
  const woundPenalty = Math.max(0, (WOUND_TN_PENALTY[wR] || 0) - (hasSotESheet ? 3 : 0));
  const xpAvail = (char.xp_total || 0) - (char.xp_spent || 0);
  const [showXpPanel, setShowXpPanel] = useState(false);
  const [pendingRankUp, setPendingRankUp] = useState(false);
  const [showSocialRef, setShowSocialRef] = useState(null); // 'integrity' | 'reputation' | 'status'
  const [skillTraitOverride, setSkillTraitOverride] = useState({}); // skillName -> trait key override
  const [expandedSkills, setExpandedSkills] = useState({}); // skillName -> bool
  const [readLipsDist, setReadLipsDist] = useState({}); // charId -> distance in feet, for the Read Lips advantage quick-roll
  const [sendTarget, setSendTarget] = useState({}); // equipment index -> 'party' or a character id, for the "Send to..." dropdown

  const insight = calcInsight(char);
  const insightRank = insightRankFor(insight, char);
  // Show rank-up overlay if insight qualifies for a higher rank than current school_rank
  const needsRankUp = insightRank > (char.school_rank || 1);

  const update = (field, value) => onUpdate(char.id, { [field]: value });

  // Batch update — one Supabase call for XP spending
  const batchUpdate = (updates) => {
    onUpdate(char.id, updates);
    // Check if the new state triggers a rank-up
    const projChar = { ...char, ...updates };
    const projInsight = calcInsight(projChar);
    const projRank = insightRankFor(projInsight, char);
    if (projRank > (char.school_rank || 1)) setPendingRankUp(true);
  };

  // Equipment slot classification — enforces single-slot rules for worn items
  const getEquipSlot = (itemName) => {
    const n = (itemName || '').toLowerCase();
    if (n.includes('shield') || n.includes('parma') || n.includes('scutum')) return 'shield';
    if (n.includes('armor') || n.includes('lorica') || n.includes('chain shirt') || n.includes('half-plate') || n.includes('ebonite armor') || n.includes('riding armor') || n.includes('partial armor') || n === 'adaga') return 'armor';
    if (n.includes('clothing') || n.includes('clothes') || n.includes('robe') || n.includes('tunic') || n.includes('toga') || n.includes('cloak') || n.includes('outfit') || n.includes('garment') || n.includes('uniform')) return 'clothing';
    if (n.includes('sandal') || n.includes('boot') || n.includes('shoe') || n.includes('slipper')) return 'footwear';
    if (n.includes('hat') || n.includes('helm') || n.includes('turban') || n.includes('crown') || n.includes('hood') || n.includes('keffiyeh') || n.includes('headwear') || n.includes('cap') || n.includes('veil')) return 'headwear';
    return 'accessory'; // accessories: multiple allowed
  };
  const SINGLE_SLOT_CATEGORIES = ['armor', 'clothing', 'footwear', 'headwear', 'shield'];

  const removeEq = (idx) => {
    const eq = (char.equipment || []).filter((_, i) => i !== idx);
    update('equipment', eq);
  };

  const addEquipment = () => {
    if (!addEq) return;
    const w = WEAPONS_LIST.find(x => x.name === addEq);
    const shield = SHIELDS.find(x => x.name === addEq);
    const arrowType = ARROW_TYPES[addEq];
    const newItem = w
      ? { name: addEq, dr: w.dr, skill: w.skill, equipped: true, inUse: false }
      : shield
      ? { name: addEq, equipped: false, inUse: false } // shield stats resolved by name via SHIELDS lookup in getArmorBonus/getShieldBonus — GM equips it explicitly
      : arrowType
      ? { name: addEq, dr: arrowType.dr, isAmmo: true, equipped: true, inUse: false, count: parseInt(addEq.match(/\((\d+)/)?.[1], 10) || 60 }
      : { name: addEq, dr: '', skill: '', equipped: true, inUse: false };
    update('equipment', [...(char.equipment || []), newItem]);
    setAddEq && setAddEq('');
  };

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarType = char.avatar_type || 'warrior';
  const avatarColor = char.avatar_color || FACTION_COLORS[char.faction] || '#c8962a';
  const avatarUrl = (char.avatar_url || '').trim();
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);
  const [urlDraft, setUrlDraft] = useState(char.avatar_url || '');
  const [descDraft, setDescDraft] = useState(char.description || '');
  useEffect(() => { setUrlDraft(char.avatar_url || ''); }, [char.id, char.avatar_url]);
  useEffect(() => { setDescDraft(char.description || ''); }, [char.id, char.description]);
  const [tokenDraft, setTokenDraft] = useState(char.token_url || '');
  useEffect(() => { setTokenDraft(char.token_url || ''); }, [char.id, char.token_url]);

  const woundLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][wR] || 'Healthy';
  const woundColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][wR] || '#4a8a40';

  const SKILL_MASTERIES = {
    // ── Weapon Skills — per L5R 4th Ed (used verbatim per LBS conversion doc) ──
    Swordsmanship: {
      3: "Damage rolls with swords are increased by +1k0.",
      5: "A sword may be readied as a Free Action rather than a Simple Action.",
      7: "Damage dice explode on a result of 9 or 10 when using a sword.",
    },
    Knives: {
      3: "Off-hand penalties do not apply when using a knife.",
      5: "Use of a sai or jitte confers one Free Raise toward the Disarm Maneuver.",
      7: "Use of any knife confers a Free Raise toward the Extra Attack Maneuver.",
    },
    Polearms: {
      3: "During the first round of a skirmish, gain +5 to Initiative Score.",
      5: "Damage rolls with polearms against mounted or significantly larger opponents are increased by +1k0.",
      7: "Polearms may be readied as a Free Action.",
    },
    Spears: {
      3: "During the first round of a skirmish, ignore 3 points of Reduction on melee attacks.",
      5: "Ranged attacks with a spear increase maximum range by 5 feet.",
      7: "Spears may be readied as a Free Action.",
    },
    Staves: {
      3: "Opponents' armor bonuses to Armor TN are no longer doubled against staff attacks.",
      5: "Use of a staff confers one Free Raise toward the Knockdown Maneuver.",
      7: "Large staves may be readied as a Free Action. Small staves gain +1k0 to damage rolls.",
    },
    Archery: {
      3: "Stringing a bow is a Simple Action rather than a Complex Action.",
      5: "The maximum range of any bow is increased by 50%.",
      7: "The Strength of the bow is increased by 1 for damage purposes.",
    },
    Brawling: {
      // Uses Jiujutsu masteries per LBS conversion
      3: "Damage of all unarmed attacks is increased by +1k0.",
      5: "Use of Brawling confers a Free Raise toward initiating a Grapple.",
      7: "Damage of all unarmed attacks is increased by +0k1 (+1k1 total from rank 3+7).",
    },
    Tahaddi: {
      // Uses Iaijutsu masteries per LBS conversion doc; rank 3 applies to readying two tahaddi knives
      3: "Readying two tahaddi knives is a Free Action rather than a Simple Action.",
      5: "During a Tahaddi Duel, gain one Free Raise on the Focus roll.",
      7: "During a Tahaddi Duel, if your Assessment roll exceeds your opponent's by 10+, gain +2k2 on your Focus roll (instead of the normal +1k1).",
    },
    'Assassin Ranged Weapons': {
      // Uses Ninjutsu masteries per LBS conversion doc
      3: "Damage of all Assassin Ranged Weapon attacks is increased by +1k0.",
      5: "Damage dice for Assassin Ranged Weapons now explode normally (they do not explode by default).",
      7: "Damage of all Assassin Ranged Weapon attacks is increased by +0k1 (+1k1 total from rank 3+7).",
    },
    Horsemanship: {
      3: "May use the Full Attack Stance when mounted.",
      5: "Mounting is a Simple Action (not Complex); dismounting is a Free Action (not Simple).",
      7: "Mounting is a Free Action rather than a Simple Action.",
    },
    // ── Combat / Physical ────────────────────────────────────────────────────
    Athletics: {
      3: "Moderate Terrain no longer impedes movement. Difficult Terrain reduces Water Ring by 1 instead of 2 for movement.",
      5: "No movement penalties regardless of terrain type.",
      7: "May add 5' to the total of one Move Action per Round (does not increase maximum possible movement).",
    },
    Defense: {
      3: "May retain the result of a previous Defense/Reflexes roll rather than re-rolling when maintaining Full Defense in subsequent rounds.",
      5: "Armor TN is considered 3 higher while in Defense or Full Defense stance.",
      7: "One Simple Action may be taken while in Full Defense stance (no attacks allowed).",
    },
    Battle: {
      5: "Add Battle Skill Rank to Initiative Score during skirmishes.",
    },
    Hunting: {
      5: "+1k0 to all Stealth rolls made in wilderness environments.",
    },
    // ── Social Skills ─────────────────────────────────────────────────────────
    Sincerity: {
      5: "+5 bonus to the total of all Contested Rolls made using Sincerity.",
    },
    Courtier: {
      3: "+3 additional Insight above what Rings and Skills normally indicate.",
      5: "+1k0 to the total of all Contested Rolls made using Courtier.",
      7: "+7 additional Insight above what Rings and Skills normally indicate (cumulative with Rank 3).",
    },
    Etiquette: {
      3: "+3 additional Insight above what Rings and Skills normally indicate.",
      5: "+1k0 to the total of all Contested Rolls made using Etiquette.",
      7: "+7 additional Insight above what Rings and Skills normally indicate (cumulative with Rank 3).",
    },
    Temptation: {
      5: "+5 bonus to the total of any Contested Roll made using Temptation.",
    },
    Intimidation: {
      5: "+5 bonus to the total of any Contested Roll made using Intimidation.",
    },
    Acting: {
      3: "TN to create a disguise is reduced by 5.",
      5: "TN to create a disguise is reduced by 10 (total).",
      7: "TN to create a disguise is reduced by 15 (total).",
    },
    // ── Scholarly Skills ──────────────────────────────────────────────────────
    Investigation: {
      3: "A second Search attempt may be made without an increase to the original TN.",
      5: "+5 bonus to the total of any Contested Roll made using Investigation.",
      7: "A third Search attempt may be made even if the second attempt failed.",
    },
    Medicine: {
      5: "Wounds healed on a successful Medicine roll is increased by +1k0.",
    },
    Divination: {
      5: "A second Divination roll may be made without spending a Void Point (all other conditions still apply). May use Awareness/Air instead of Intelligence/Fire.",
    },
    Meditation: {
      3: "A successful Meditation roll restores up to 2 Void Points.",
      5: "TN for all Meditation (Fasting) rolls is reduced by 5.",
      7: "A successful Meditation roll restores up to 3 Void Points.",
    },
    Spellcraft: {
      5: "+1k0 on Spell Casting Rolls.",
    },
    Calligraphy: {
      5: "+10 bonus when attempting to break a code or cipher.",
    },
    Commerce: {
      5: "May increase or decrease the price of an item being bought or sold by up to 20%.",
    },
    // ── Low / Criminal Skills ─────────────────────────────────────────────────
    Stealth: {
      3: "Simple Move Actions while using Stealth allow movement equal to Water Ring x 5 feet.",
      5: "Simple Move Actions while using Stealth allow movement equal to Water Ring x 10 feet.",
      7: "May make Free Move Actions normally while using Stealth.",
    },
    'Sleight of Hand': {
      5: "May use the Conceal Emphasis to conceal small weapons on your person.",
    },
    Forgery: {
      3: "+1k0 to Forgery roll result for setting the TN for others to detect it.",
      5: "+1k0 on any roll to detect a forgery made by someone else.",
      7: "+0k1 (total +1k1 with Rank 3) to Forgery roll result for setting the detection TN.",
    },
  };

  return (
    <div>
      {/* ── Overlays ── */}
      {showSocialRef && (
        <SocialReferenceModal
          initialTab={showSocialRef}
          char={char}
          onClose={() => setShowSocialRef(null)}
        />
      )}
      {showXpPanel && (
        <XPSpendPanel char={char} onBatchUpdate={batchUpdate} onClose={() => setShowXpPanel(false)} />
      )}
      {(needsRankUp || pendingRankUp) && !showXpPanel && (canEdit && (isGM || myCharIds.includes(char.id))) && (
        <RankUpOverlay
          char={char}
          newRank={(char.school_rank || 1) + 1}
          onConfirm={(choice) => {
            const newRank = (char.school_rank || 1) + 1;
            const updated = { ...(char.techniques || {}), [newRank]: choice.techName };
            onUpdate(char.id, { school_rank: newRank, techniques: updated });
            setPendingRankUp(false);
          }}
        />
      )}

      {/* ── Player name banner / GM companion assignment ── */}
      {(() => {
        const isMine = myCharIds.includes(char.id);
        const playerName = char.player_name;
        // GM companion assignment — shown only on is_npc character sheets so GM can assign
        // hirelings/animals/ghul/jinn to a player. The player sees their claimed companions in
        // their character list and can view (but not control) them. NPCs never get downtime actions.
        if (char.is_npc && isGM) {
          const assigned = char.claimed_by_name;
          const pcChars = (allChars || []).filter(c => !c.is_npc);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem', padding: '.5rem .75rem', background: assigned ? 'rgba(74,122,200,.1)' : 'var(--bg-panel)', borderRadius: 5, border: `1px solid ${assigned ? 'rgba(74,122,200,.35)' : 'var(--border)'}` }}>
              <i className="ti ti-paw" style={{ fontSize: 14, color: assigned ? '#80a8d8' : 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>Assign to:</span>
              <select value={assigned || ''} onChange={e => {
                const val = e.target.value;
                onUpdate && onUpdate(char.id, { claimed_by_name: val || null });
              }} style={{ flex: 1, fontSize: 12, background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px' }}>
                <option value="">— Unassigned —</option>
                {pcChars.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {assigned && <span style={{ fontSize: 11, color: '#80a8d8', flexShrink: 0 }}>assigned to {assigned}</span>}
            </div>
          );
        }
        if (playerName) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem', padding: '.6rem .75rem', background: isMine ? 'rgba(74,138,64,.15)' : 'var(--bg-dark)', borderRadius: 5, border: `1px solid ${isMine ? 'rgba(74,138,64,.4)' : 'var(--border)'}` }}>
              <i className="ti ti-user-check" style={{ fontSize: 16, color: isMine ? 'var(--green)' : 'var(--gold-dim)' }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: isMine ? 'var(--green)' : 'var(--text-primary)', letterSpacing: '.02em' }}>{playerName}</span>
              {isMine && <span style={{ fontSize: 11, color: 'var(--green)', marginLeft: 2, fontStyle: 'italic' }}>— your character</span>}
              {isMine && onUnclaimCharacter && (
                <button className="btn btn-sm" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                  onClick={() => onUnclaimCharacter(char.id)}
                  title="Release this character so another player can claim it">
                  <i className="ti ti-user-off" style={{ fontSize: 11, marginRight: 3 }} />Unclaim
                </button>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* ── Card 1: Portrait + Identity ── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Portrait column — large, scaleable by GM setting */}
          {avatarUrl && !imgError ? (
            <div
              style={{
                width: Math.round(110 * portraitScale), height: Math.round(150 * portraitScale),
                borderRadius: 6, border: `2px solid ${avatarColor}66`,
                overflow: 'hidden', flexShrink: 0, cursor: canEdit ? 'pointer' : 'default', position: 'relative',
                transition: 'width .2s, height .2s',
              }}
              onClick={() => canEdit && setShowAvatarPicker(p => !p)}>
              <img src={avatarUrl} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
              {canEdit && <div style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 10, color: avatarColor, background: 'rgba(0,0,0,.5)', borderRadius: 3, padding: '1px 3px' }}>✏</div>}
            </div>
          ) : (
            <div
              style={{
                width: Math.round(110 * portraitScale), height: Math.round(150 * portraitScale),
                borderRadius: 6, border: `2px solid ${avatarColor}66`,
                background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden', cursor: canEdit ? 'pointer' : 'default', position: 'relative',
                transition: 'width .2s, height .2s',
              }}
              onClick={() => canEdit && setShowAvatarPicker(p => !p)}>
              <Silhouette type={avatarType} size={Math.round(60 * portraitScale)} color={avatarColor} />
              {canEdit && <div style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 10, color: avatarColor, background: 'rgba(0,0,0,.5)', borderRadius: 3, padding: '1px 3px' }}>✏</div>}
            </div>
          )}

          {/* Name block — top left, shares row with portrait */}
          <div style={{ minWidth: 160, flexShrink: 0 }}>
            <div style={{ marginBottom: '.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{char.name}</div>
                  {isGM && (
                    <button className={`btn ${canEdit ? 'btn-p' : ''}`}
                      style={{ fontSize: 12, padding: '3px 10px', fontWeight: 700, letterSpacing: '.04em', minWidth: 52 }}
                      onClick={onToggleEdit}>
                      <i className={`ti ${canEdit ? 'ti-lock' : 'ti-pencil'}`} style={{ fontSize: 13, marginRight: 4 }} />
                      {canEdit ? 'LOCK' : 'EDIT'}
                    </button>
                  )}
                </div>
                {canEdit && isGM ? (
                  <select value={char.faction || ''} onChange={e => update('faction', e.target.value)}
                    style={{ fontSize: 11, marginTop: 2, marginBottom: 2, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3 }}>
                    <option value="">— No faction —</option>
                    {FACTIONS_LIST.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{char.faction}</div>
                )}
                {char.subfaction && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.8 }}>{char.subfaction}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--gold-dim)' }}>{char.school} R{char.school_rank}</div>
                {isGM && char.is_npc && (
                  <label className="chk-row" style={{ fontSize: 11, marginTop: 4, color: char.is_party_asset ? 'var(--green)' : 'var(--text-muted)' }}
                    title="Party members show up in every player's Character tab so anyone can view the sheet or opt in to control it">
                    <input type="checkbox" checked={!!char.is_party_asset}
                      onChange={e => update('is_party_asset', e.target.checked)} />
                    Party Asset
                  </label>
                )}
                {!isGM && char.is_npc && char.is_party_asset && myCharId && (
                  <label className="chk-row" style={{ fontSize: 11, marginTop: 4, color: char.controller_id === myCharId ? 'var(--green)' : 'var(--text-muted)' }}
                    title={char.controller_id && char.controller_id !== myCharId
                      ? 'Someone else is controlling this NPC in encounters — checking this takes over'
                      : 'Take actions for this NPC on its turn in encounters (including downtime)'}>
                    <input type="checkbox" checked={char.controller_id === myCharId}
                      onChange={e => onUpdate(char.id, { controller_id: e.target.checked ? myCharId : null })} />
                    {char.controller_id && char.controller_id !== myCharId ? 'Controlled by another player — take over?' : 'Take actions for this NPC in encounters'}
                  </label>
                )}
                <div style={{ marginTop: '.35rem', display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 6px' }} onClick={() => {
                    const { id, game_id, created_at, updated_at, ...exportData } = char;
                    const blob = new Blob([JSON.stringify({ format: 'sandy_character', version: 1, exported_at: new Date().toISOString(), character: exportData }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `${char.name.replace(/\s+/g,'-').toLowerCase()}-sheet.json`; a.click(); URL.revokeObjectURL(url);
                  }}>
                    <i className="ti ti-download" style={{ fontSize: 10, marginRight: 3 }} />Export Sheet
                  </button>
                  {onCreateCharacter && (
                    <label className="btn btn-sm" style={{ fontSize: 10, padding: '1px 6px', cursor: 'pointer' }}>
                      <i className="ti ti-upload" style={{ fontSize: 10, marginRight: 3 }} />Import Sheet
                      <input type="file" accept=".json" style={{ display: 'none' }} onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const text = await file.text();
                        try {
                          const parsed = JSON.parse(text);
                          const charData = parsed.character || parsed;
                          if (!charData.name || !charData.school) { alert('Invalid character file — missing name or school.'); return; }
                          const { id, game_id, created_at, updated_at, ...cleanData } = charData;
                          await onCreateCharacter({ ...cleanData, name: charData.name + ' (imported)' });
                        } catch { alert('Could not read that file — make sure it\'s a Sandy character export.'); }
                        e.target.value = '';
                      }} />
                    </label>
                  )}
                </div>
              </div>
            {/* Description — physical appearance / backstory, free text */}
            <div style={{ marginBottom: '.5rem' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Description</div>
              {canEdit ? (
                <textarea value={descDraft} onChange={e => setDescDraft(e.target.value)}
                  onBlur={() => { if (descDraft !== (char.description || '')) update('description', descDraft); }}
                  placeholder="Physical description, mannerisms, backstory…" rows={3}
                  style={{ width: '100%', fontSize: 12, resize: 'vertical' }} />
              ) : (
                char.description
                  ? <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{char.description}</div>
                  : <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No description yet.</div>
              )}
            </div>
            {/* Avatar picker */}
            {showAvatarPicker && canEdit && (
              <div style={{ marginBottom: '.5rem', padding: '.5rem', background: 'var(--bg-dark)', borderRadius: 4, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Portrait URL <span style={{ fontWeight: 400 }}>(card portrait in encounters)</span></div>
                <input type="text" value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
                  onBlur={() => { if (urlDraft !== (char.avatar_url || '')) update('avatar_url', urlDraft); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                  placeholder="https://..." style={{ width: '100%', fontSize: 12, marginBottom: '.5rem' }} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Token URL <span style={{ fontWeight: 400 }}>(grid map token — 64×64px GIF/PNG works best)</span></div>
                <input type="text" value={tokenDraft} onChange={e => setTokenDraft(e.target.value)}
                  onBlur={() => { if (tokenDraft !== (char.token_url || '')) update('token_url', tokenDraft); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                  placeholder="https://... (leave blank to use silhouette)" style={{ width: '100%', fontSize: 12, marginBottom: '.35rem' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', marginBottom: '.5rem', cursor: 'pointer' }}
                  title="On: crop the token into a circle (the old way). Off: fit the image's width to the token square, keep its real aspect ratio, and let it bleed upward if taller.">
                  <input type="checkbox" checked={!!char.token_circle} onChange={e => update('token_circle', e.target.checked)} />
                  Crop token to a circle
                </label>                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: '.5rem' }}>
                  {AVATAR_TYPES.map(at => (
                    <div key={at.id} onClick={() => update('avatar_type', at.id)} title={at.label}
                      style={{ width: 28, height: 36, borderRadius: 3, background: avatarType === at.id ? avatarColor + '22' : 'var(--bg-panel)', border: `1px solid ${avatarType === at.id ? avatarColor : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Silhouette type={at.id} size={20} color={avatarColor} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                  {/* Faction default swatch — click to reset to faction colour */}
                  {(() => {
                    const factionCol = FACTION_COLORS[char.faction];
                    if (!factionCol) return null;
                    const isDefault = !char.avatar_color;
                    return (
                      <div onClick={() => update('avatar_color', null)} title={`Reset to faction default (${char.faction})`}
                        style={{ width: 18, height: 18, borderRadius: '50%', background: factionCol,
                          border: `2px solid ${isDefault ? '#fff' : 'rgba(255,255,255,.15)'}`,
                          cursor: 'pointer', outline: isDefault ? `2px solid ${factionCol}88` : 'none',
                          outlineOffset: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isDefault && <span style={{ fontSize: 9, color: '#fff', fontWeight: 900, lineHeight: 1 }}>★</span>}
                      </div>
                    );
                  })()}
                  {AVATAR_COLORS.map(ac => (
                    <div key={ac.id} onClick={() => update('avatar_color', ac.id)} title={ac.label}
                      style={{ width: 18, height: 18, borderRadius: '50%', background: ac.id,
                        border: `2px solid ${char.avatar_color === ac.id ? '#fff' : 'transparent'}`,
                        cursor: 'pointer' }} />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>★ = faction default · click to reset</div>
                <button className="btn btn-sm" style={{ marginTop: '.4rem', fontSize: 11 }} onClick={() => setShowAvatarPicker(false)}>Done</button>
              </div>
            )}
            {/* Armor TN / Init — prominent */}
            <div style={{ marginTop: '.4rem' }}>
              {(() => {
                const armorBns = getArmorBonus(char.equipment || []);
                const totalTN = getArmorTN({ reflexes: char.reflexes, armorBonus: armorBns });
                const baseTN = totalTN - armorBns;
                const equippedArmor = (char.equipment || []).find(e => e.equipped && (ARMOR_TN_BONUS[e.name] !== undefined || e.name?.toLowerCase().includes('armor') || e.name?.toLowerCase().includes('chain') || e.name?.toLowerCase().includes('lorica')));
                const armorDesc = equippedArmor ? (GEAR_DESCRIPTIONS[equippedArmor.name] || '') : '';
                // Best attack roll example — highest-rank combat skill the character actually has
                const COMBAT_SKILLS = ['Swordsmanship','Knives','Spears','Archery','Brawling','Polearms','Staves','Assassin Ranged Weapons','Tahaddi'];
                const bestCombatSkill = (char.skills || [])
                  .filter(s => COMBAT_SKILLS.includes(s.name))
                  .sort((a, b) => (b.rank || 0) - (a.rank || 0))[0];
                const bestAttackPool = (() => {
                  if (!bestCombatSkill) return null;
                  const mapped = SKILL_TRAIT_MAP[bestCombatSkill.name] || { trait: 'Agility', ring: 'Fire' };
                  const traitVal = char[mapped.trait.toLowerCase()] || 2;
                  const ringVal = char[mapped.ring.toLowerCase()] || 2;
                  return { roll: (bestCombatSkill.rank || 0) + traitVal, keep: ringVal, skillName: bestCombatSkill.name };
                })();
                // Equipped weapon damage example — whatever's currently wielded
                const wieldedWeapon = (char.equipment || []).find(e => e.dr && e.inUse && !e.isAmmo);
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {/* TN, Attack, and Damage as matched stat boxes — same size/style, vertically aligned,
                          instead of TN standing alone as a huge number while Attack/Damage were tiny inline
                          text off to the side. */}
                      <div style={{ textAlign: 'center', background: 'var(--bg-panel)', border: '1px solid var(--gold-dim)', borderRadius: 6, padding: '4px 10px', minWidth: 68 }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{totalTN}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>Armor TN</div>
                      </div>
                      {bestAttackPool && (
                        <div style={{ textAlign: 'center', background: 'var(--bg-panel)', border: '1px solid var(--gold-dim)', borderRadius: 6, padding: '4px 10px', minWidth: 68 }} title={bestAttackPool.skillName}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{bestAttackPool.roll}k{bestAttackPool.keep}</div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>Attack</div>
                        </div>
                      )}
                      {wieldedWeapon && (
                        <div style={{ textAlign: 'center', background: 'var(--bg-panel)', border: '1px solid var(--gold-dim)', borderRadius: 6, padding: '4px 10px', minWidth: 68 }} title={wieldedWeapon.name}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{wieldedWeapon.dr}</div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>Damage</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginTop: 1 }}>
                        {baseTN} base{armorBns > 0 ? ` + ${armorBns} ${equippedArmor ? equippedArmor.name.split('(')[0].trim() : 'armor'}` : ' (no armor)'}
                      </div>
                      {armorDesc && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic', maxWidth: 200, lineHeight: 1.4 }}>{armorDesc}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Init <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{char.reflexes || 2}k{char.air || 2}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        XP <span style={{ color: xpAvail > 0 ? 'var(--green)' : 'var(--text-muted)', fontWeight: 600 }}>{xpAvail}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 2: Rings Diagram — five interlocking rings ── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {(() => {
            const RING_COLORS = { Air: '#a0c0e0', Earth: '#80c090', Fire: '#e09050', Water: '#60b0d0', Void: '#c0a0e0' };
              const rings = [
                { key: 'Fire',  val: char.fire,  cx: 145, cy: 70,  traits: [['Agility', char.agility],['Intelligence', char.intelligence]], side: 'left' },
                { key: 'Air',   val: char.air,   cx: 255, cy: 70,  traits: [['Reflexes', char.reflexes],['Awareness', char.awareness]], side: 'right' },
                { key: 'Earth', val: char.earth, cx: 105, cy: 155, traits: [['Stamina', char.stamina],['Willpower', char.willpower]], side: 'left' },
                { key: 'Water', val: char.water, cx: 295, cy: 155, traits: [['Strength', char.strength],['Perception', char.perception]], side: 'right' },
                { key: 'Void',  val: char.void,  cx: 200, cy: 220, traits: null, side: 'center' },
              ];
              const W = 430, H = 290;
              return (
                <div style={{ position: 'relative', width: '100%', maxWidth: W }}>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', width: '100%', height: 'auto', display: 'block' }}>
                    {/* Decorative interlocking ring strokes */}
                    {rings.map(r => (
                      <circle key={r.key + '_ring'} cx={r.cx} cy={r.cy} r={62}
                        fill="none" stroke={RING_COLORS[r.key]} strokeWidth={10} strokeOpacity={0.18} />
                    ))}
                    {rings.map(r => (
                      <circle key={r.key + '_ring2'} cx={r.cx} cy={r.cy} r={62}
                        fill="none" stroke={RING_COLORS[r.key]} strokeWidth={3} strokeOpacity={0.5} />
                    ))}
                    {/* Orbs — the value circles */}
                    {rings.map(r => (
                      <g key={r.key}>
                        <circle cx={r.cx} cy={r.cy} r={28}
                          fill="var(--bg-deep)" stroke={RING_COLORS[r.key]} strokeWidth={2} />
                        <text x={r.cx} y={r.cy - 9} textAnchor="middle" fill={RING_COLORS[r.key]}
                          fontSize={9} fontWeight={700} letterSpacing={1}>
                          {r.key.toUpperCase()}
                        </text>
                        <text x={r.cx} y={r.cy + 14} textAnchor="middle" fill={RING_COLORS[r.key]}
                          fontSize={22} fontWeight={900}>
                          {r.val || 2}
                        </text>
                      </g>
                    ))}

                    {/* Trait labels — LEFT rings (Fire, Earth): value just outside ring, name further left */}
                    {rings.filter(r => r.side === 'left').map(r =>
                      (r.traits || []).map(([name, val], ti) => {
                        const ty = r.cy + (ti === 0 ? -13 : 13);
                        const numX = r.cx - 67;   // just outside ring edge (radius=62)
                        const lblX = r.cx - 70;   // name anchor, text runs further left
                        return (
                          <g key={name}>
                            <text x={numX} y={ty + 5} textAnchor="end"
                              fill={RING_COLORS[r.key]} fontSize={16} fontWeight={800}>{val}</text>
                            <text x={lblX} y={ty + 5} textAnchor="end" dx={-16}
                              fill="var(--text-muted)" fontSize={11} fontWeight={500}>{name}</text>
                          </g>
                        );
                      })
                    )}

                    {/* Trait labels — RIGHT rings (Air, Water): value just outside ring, name further right */}
                    {rings.filter(r => r.side === 'right').map(r =>
                      (r.traits || []).map(([name, val], ti) => {
                        const ty = r.cy + (ti === 0 ? -13 : 13);
                        const numX = r.cx + 67;   // just outside ring right edge
                        const lblX = r.cx + 70;   // name anchor, text runs further right
                        return (
                          <g key={name}>
                            <text x={numX} y={ty + 5} textAnchor="start"
                              fill={RING_COLORS[r.key]} fontSize={16} fontWeight={800}>{val}</text>
                            <text x={lblX} y={ty + 5} textAnchor="start" dx={16}
                              fill="var(--text-muted)" fontSize={11} fontWeight={500}>{name}</text>
                          </g>
                        );
                      })
                    )}

                    {/* Void dots below void orb — big, black when spent.
                        GM-only: players cannot directly add/remove Void Points — only Recovery,
                        GM action, or the Meditation skill should change this. */}
                    {char.void && (() => {
                      const vr = rings.find(r => r.key === 'Void');
                      const R = 12;
                      const gap = 28;
                      return Array.from({ length: char.void }, (_, i) => {
                        const filled = i < (char.current_void || 0);
                        const cx = vr.cx - ((char.void - 1) * gap) / 2 + i * gap;
                        return (
                          <circle key={i} cx={cx} cy={vr.cy + 40}
                            r={R}
                            fill={filled ? '#111' : 'transparent'}
                            stroke={filled ? '#555' : RING_COLORS.Void + '88'}
                            strokeWidth={2}
                            style={{ cursor: isGM ? 'pointer' : 'default' }}
                            onClick={isGM ? () => update('current_void', filled ? i : i + 1) : undefined} />
                        );
                      });
                    })()}
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>

      {/* ── Card 3: Wounds & Social Stats ── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Social Stats — top right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0, minWidth: 90, order: 3 }}>
            {(() => {
              const perceivedIntegrityAdv = (char.advantages || []).find(a => (a.name || a) === 'Perceived Integrity');
              const perceivedIntegrityRank = perceivedIntegrityAdv?.rank || 1;
              const perceivedIntegrityValue = (Number(char.integrity) || 0) + perceivedIntegrityRank;
              return [
                // Perceived Integrity — derived (Integrity + advantage rank), not independently editable.
                // Shown right above real Integrity per Charles's direction, rather than trying to filter who
                // sees which value (Sandy's sheets don't have per-viewer permissions to hook that into).
                ...(perceivedIntegrityAdv ? [{ label: 'Perceived Integrity', value: perceivedIntegrityValue, color: '#e0c060', borderColor: '#c0a040', key: 'perceived_integrity', isDecimal: true, isDerived: true }] : []),
                { label: 'Integrity', value: char.integrity ?? 0, color: '#c8a040', borderColor: '#a07830', key: 'integrity', isDecimal: true },
                { label: (char.disadvantages || []).some(d => (d.name || d) === 'Infamous') ? 'Infamy' : 'Reputation', value: char.reputation ?? 1, color: '#c8a040', borderColor: '#a07830', key: 'reputation', isDecimal: true },
                { label: 'Status', value: char.status ?? 1, color: '#80a8c8', borderColor: '#6080a0', key: 'status', isDecimal: true },
                // Water units — only shown in drought mode; GM can edit, players see their own
                ...(waterDroughtEnabled && !char.is_npc ? [{ label: 'Water', value: char.water_units ?? 0, color: '#3a80c0', borderColor: '#2a60a0', key: 'water_units', isWater: true }] : []),
              ];
            })().map(({ label, value, color, borderColor, key, isDecimal, isWater, isDerived }) => (
              <div key={key} style={{ textAlign: 'center', background: 'var(--bg-panel)', border: `1px solid ${borderColor}`, borderRadius: 6, padding: '4px 12px', width: '100%' }}>
                <div
                  style={{ fontSize: 28, fontWeight: 900, color: isWater && value <= 1 ? '#c84030' : color, lineHeight: 1, cursor: isWater || isDerived ? 'default' : 'pointer' }}
                  title={isWater ? `Water units on hand (max 5)` : isDerived ? 'Integrity + Perceived Integrity advantage rank — what others perceive your Integrity to be' : `Click to view ${label} reference table`}
                  onClick={() => !isWater && !isDerived && setShowSocialRef(key)}
                >
                  {isWater
                    ? <span style={{ display: 'flex', gap: 2, justifyContent: 'center', paddingTop: 4 }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < value ? color : 'var(--border)' }} />
                        ))}
                      </span>
                    : (isDecimal ? (Number(value) || 0).toFixed(1) : (value || 0))}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: isWater ? 5 : 1 }}>{label}{!isWater && !isDerived && <span style={{ color: borderColor, opacity: 0.6 }}> ?</span>}</div>
                {canEdit && isGM && !isWater && !isDerived && (
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 3 }}>
                    <button className="rep-btn" onClick={() => update(key, Math.max(0, Math.round((+(value || 0) - (isDecimal ? 0.1 : 1)) * 10) / 10))}>−</button>
                    <button className="rep-btn" onClick={() => update(key, Math.round((+(value || 0) + (isDecimal ? 0.1 : 1)) * 10) / 10)}>+</button>
                  </div>
                )}
                {isWater && canEdit && isGM && (
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 3 }}>
                    <button className="rep-btn" onClick={() => update('water_units', Math.max(0, (value || 0) - 1))}>−</button>
                    <button className="rep-btn" onClick={() => update('water_units', Math.min(5, (value || 0) + 1))}>+</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Wounds chart — LEFT of status block ── */}
          <div style={{ flexShrink: 0, minWidth: 200, maxWidth: 260, order: 2 }}>
            {(() => {
              const earth = char.earth || char.stamina || 2;
              const healthyTotal = earth * 5;
              const rankTotal = earth * 2;
              const hasSotE = (char.advantages || []).some(a => (a.name || a) === 'Strength of the Earth');
              const soteReduction = hasSotE ? 3 : 0;
              const WRANKS = [
                { label: 'Healthy',  penalty: '+0',                                    total: healthyTotal, color: '#4a8a40' },
                { label: 'Nicked',   penalty: `+${Math.max(0, 3  - soteReduction)}`,  total: rankTotal,    color: '#8a8a30' },
                { label: 'Grazed',   penalty: `+${Math.max(0, 5  - soteReduction)}`,  total: rankTotal,    color: '#a87830' },
                { label: 'Hurt',     penalty: `+${Math.max(0, 10 - soteReduction)}`,  total: rankTotal,    color: '#c86030' },
                { label: 'Injured',  penalty: `+${Math.max(0, 15 - soteReduction)}`,  total: rankTotal,    color: '#c84030' },
                { label: 'Crippled', penalty: `+${Math.max(0, 20 - soteReduction)}`,  total: rankTotal,    color: '#a02828' },
                { label: 'Down',     penalty: `+${Math.max(0, 40 - soteReduction)}`,  total: rankTotal,    color: '#801818' },
                { label: 'Out',      penalty: '—',                                     total: earth * 5,    color: '#600010' },
              ];
              const thresholds = WRANKS.reduce((acc, r, i) => { acc.push((acc[i - 1] || 0) + r.total); return acc; }, []);
              const current = char.current_wounds || 0;
              return (
                <div style={{ border: `1px solid ${woundColor}44`, borderRadius: 4, overflow: 'hidden', fontSize: 11 }}>
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,.3)', padding: '2px 4px', gap: 2, borderBottom: '1px solid rgba(107,78,40,.3)' }}>
                    <span style={{ flex: 2, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: 9, letterSpacing: '.05em' }}>Wound Level</span>
                    <span style={{ width: 28, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: 9 }}>Pen.</span>
                    <span style={{ width: 28, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: 9 }}>Total</span>
                    <span style={{ width: 28, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: 9 }}>Curr.</span>
                  </div>
                  {WRANKS.map((r, i) => {
                    const rankStart = i === 0 ? 0 : thresholds[i - 1];
                    const rankEnd = thresholds[i];
                    const woundsInRank = Math.max(0, Math.min(current - rankStart, r.total));
                    const isActive = current > rankStart && current <= rankEnd;
                    const isPast = current > rankEnd;
                    return (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 4px', background: isActive ? `${r.color}22` : isPast ? `${r.color}11` : 'transparent', borderBottom: '1px solid rgba(107,78,40,.1)', borderLeft: isActive ? `3px solid ${r.color}` : '3px solid transparent' }}>
                        <span style={{ flex: 2, color: isActive ? r.color : isPast ? r.color + 'aa' : 'var(--text-muted)', fontWeight: isActive ? 700 : 400 }}>
                          {r.label} {isActive && woundPenalty > 0 ? <span style={{ fontSize: 9 }}>⚠</span> : ''}
                        </span>
                        <span style={{ width: 28, textAlign: 'center', color: isActive ? r.color : 'var(--text-muted)' }}>{r.penalty}</span>
                        <span style={{ width: 28, textAlign: 'center', color: 'var(--text-muted)' }}>{r.total}</span>
                        <span style={{ width: 28, textAlign: 'center', color: isActive ? r.color : 'var(--text-muted)', fontWeight: isActive ? 700 : 400 }}>
                          {isActive ? woundsInRank : isPast ? r.total : 0}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 4px', background: 'rgba(0,0,0,.15)', borderTop: '1px solid rgba(107,78,40,.2)' }}>
                    <span style={{ flex: 1, fontSize: 10, color: 'var(--text-muted)' }}>
                      Total: <strong style={{ color: woundColor }}>{current}</strong> / {thresholds[thresholds.length - 1]}
                    </span>
                    {canEdit && (
                      <>
                        <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', color: 'var(--green)' }}
                          onClick={() => update('current_wounds', Math.max(0, current - 1))}>− Heal</button>
                        <button className="btn btn-sm btn-d" style={{ fontSize: 10, padding: '1px 5px' }}
                          onClick={() => update('current_wounds', current + 1)}>+ Wound</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="g2">
      {/* Left column — Skills prominent */}
      <div>
        {/* Active Conditions (from xp_log with type='condition') */}
        {(() => {
          const conditions = (char.xp_log || []).filter(e => e.type === 'condition');
          if (conditions.length === 0) return null;
          return (
            <div className="card" style={{ marginBottom: '.75rem' }}>
              <div className="card-title">⚠ Active Conditions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {conditions.map((cond, ci) => {
                  const note = cond.note || '';
                  const effectKey = Object.keys(STATUS_EFFECT_DEFS).find(k => note.toLowerCase().includes(k.toLowerCase()));
                  const def = STATUS_EFFECT_DEFS[effectKey] || STATUS_EFFECT_DEFS[note];
                  return (
                    <span key={ci}
                      title={def ? `${def.desc}\nWears off: ${def.wearOff}` : note}
                      style={{ fontSize: 12, padding: '3px 8px', borderRadius: 10, background: 'rgba(200,64,48,.15)', border: '1px solid rgba(200,64,48,.4)', color: 'var(--red)', cursor: canEdit ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={canEdit ? () => {
                        const allConds = (char.xp_log || []).filter(e => e.type === 'condition');
                        const idx = allConds.indexOf(cond);
                        const newLog = (char.xp_log || []).filter((e, j) => {
                          if (e.type !== 'condition') return true;
                          const condIdx = allConds.indexOf(e);
                          return condIdx !== idx;
                        });
                        update('xp_log', newLog);
                      } : undefined}>
                      {def?.icon && <span>{def.icon}</span>}
                      <span>{note}</span>
                      {canEdit && <span style={{ fontSize: 10, opacity: 0.6 }}>×</span>}
                    </span>
                  );
                })}
              </div>
              {canEdit && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Hover for details · Click to remove</div>}
            </div>
          );
        })()}
        {/* Skills */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Skills</span>
            {canEdit && isGM && <AddSkillControl char={char} onAdd={(skillName) => {
              if ((char.skills || []).some(s => s.name === skillName)) return;
              update('skills', [...(char.skills || []), { name: skillName, rank: 0, school: false }]);
            }} />}
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {/* Build set of active technique names for this character */}
            {(() => {
              const charRank = char.school_rank || 1;
              const activeTechs = Object.entries(char.techniques || {})
                .filter(([rank]) => +rank <= charRank)
                .map(([, t]) => typeof t === 'object' ? (t.name || '') : t)
                .filter(Boolean);
              return (char.skills || []).map(s => {
                const masteries = SKILL_MASTERIES[s.name] || {};
                const unlockedMasteries = Object.entries(masteries).filter(([rank]) => s.rank >= +rank);
                // Which active techniques affect this skill?
                const techBadges = activeTechs.filter(techName =>
                  (TECHNIQUE_SKILL_LINKS[techName] || []).includes(s.name)
                );
                return (
                  <div key={s.name}>
                    <div className="skill-row">
                      <span className={`skill-nm ${s.school ? 'sc' : ''}`}>
                        {SKILL_DESCRIPTIONS[s.name] || SKILL_DESCRIPTIONS[s.name.split(':')[0].trim()] ? (
                          <span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                            onClick={() => setExpandedSkills(ex => ({ ...ex, [s.name]: !ex[s.name] }))}>
                            {s.name}
                            <i className={`ti ti-chevron-${expandedSkills[s.name] ? 'up' : 'down'}`} style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.6 }} />
                          </span>
                        ) : s.name}
                        {(s.emphases || []).map(e => (
                          <span key={e} style={{ fontSize: 10, color: 'var(--gold-dim)', marginLeft: 4 }}>
                            ({e}){canEdit && <span style={{ cursor: 'pointer', marginLeft: 2, color: 'var(--text-muted)' }}
                              onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, emphases: (x.emphases || []).filter(em => em !== e) } : x); update('skills', skills); }}>×</span>}
                          </span>
                        ))}
                      </span>
                      <SkillDots rank={s.rank} />
                      {/* Sample roll — click to cycle through traits */}
                      {(() => {
                        const baseName = s.name.split(':')[0].trim();
                        const traitInfo = SKILL_TRAIT_MAP[s.name] || SKILL_TRAIT_MAP[baseName];
                        if (!traitInfo) return null;
                        // Build list of all traits the player might use for this skill
                        const TRAIT_RING = {
                          reflexes: 'air', awareness: 'air', stamina: 'earth', willpower: 'earth',
                          agility: 'fire', intelligence: 'fire', strength: 'water', perception: 'water', void: 'void',
                        };
                        const defaultTrait = traitInfo.trait.toLowerCase();
                        const activeTrait = skillTraitOverride[s.name] || defaultTrait;
                        const ringKey = TRAIT_RING[activeTrait] || traitInfo.ring.toLowerCase();
                        const traitVal = char[activeTrait] || 2;
                        const ringVal = char[ringKey] || 2;
                        // Crafty: treat rank 0 Low skills as rank 1 for display purposes too
                        const LOW_SKILL_NAMES = new Set(SKILL_CATEGORIES['Low (Common/Criminal)'] || []);
                        const charHasCrafty = (char.advantages || []).some(a => (a.name || a) === 'Crafty');
                        const effectiveRank = (charHasCrafty && s.rank === 0 && LOW_SKILL_NAMES.has(s.name)) ? 1 : s.rank;
                        const roll = effectiveRank + traitVal;
                        const keep = ringVal;
                        // Clickable: cycles through all 9 traits
                        const allTraits = Object.keys(TRAIT_RING);
                        const idx = allTraits.indexOf(activeTrait);
                        const nextTrait = allTraits[(idx + 1) % allTraits.length];
                        return (
                          <span
                            onClick={() => setSkillTraitOverride(o => ({ ...o, [s.name]: nextTrait }))}
                            title={`${roll}k${keep} (${activeTrait} / ${ringKey}) — click to change trait`}
                            style={{ fontSize: 10, color: activeTrait !== defaultTrait ? 'var(--gold)' : 'var(--text-muted)', marginLeft: 2, whiteSpace: 'nowrap', cursor: 'pointer', borderBottom: '1px dashed var(--border)' }}>
                            {roll}k{keep}
                          </span>
                        );
                      })()}
                      {techBadges.map(techName => (
                        <span key={techName} title={TECHNIQUE_DESCRIPTIONS[techName] || techName} style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 8,
                          background: 'rgba(160,100,220,.18)',
                          border: '1px solid rgba(160,100,220,.5)',
                          color: '#c0a0e8',
                          boxShadow: '0 0 6px rgba(160,100,220,.4)',
                          cursor: 'default', whiteSpace: 'nowrap',
                          marginLeft: 3,
                        }}>
                          ✦ {techName}
                        </span>
                      ))}
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                          {isGM && (
                            <>
                              <button className="trait-btn" onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.max(0, x.rank - 1) } : x); update('skills', skills); }}>−</button>
                              <button className="trait-btn" onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.min(10, x.rank + 1) } : x); update('skills', skills); }}>+</button>
                            </>
                          )}
                          {isGM && (
                            <input
                              placeholder="Add emphasis (GM)…"
                              style={{ fontSize: 10, width: 100, padding: '1px 4px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontFamily: 'inherit' }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  const val = e.target.value.trim();
                                  const skills = (char.skills || []).map(x => {
                                    if (x.name !== s.name) return x;
                                    const updated = { ...x, emphases: [...(x.emphases || []).filter(em => em !== val), val] };
                                    // Only auto-set Animal Handling to 5 if the character has the Gorilla Bodyguard advantage
                                    const hasGorillaBG = (char.advantages || []).some(a => (a.name || a) === 'Gorilla Bodyguard');
                                    if (s.name === 'Animal Handling' && val === 'Gorilla' && hasGorillaBG && (x.rank || 0) < 5) {
                                      updated.rank = 5;
                                    }
                                    return updated;
                                  });
                                  update('skills', skills);
                                  e.target.value = '';
                                }
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    {unlockedMasteries.map(([rank, desc]) => (
                      <div key={rank} style={{ fontSize: 11, color: 'var(--gold-dim)', paddingLeft: 16, paddingBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-star" style={{ fontSize: 10 }} />R{rank}: {desc}
                      </div>
                    ))}
                    {/* Skill description — shown when expanded */}
                    {expandedSkills[s.name] && (() => {
                      const baseName = s.name.split(':')[0].trim();
                      const desc = SKILL_DESCRIPTIONS[s.name] || SKILL_DESCRIPTIONS[baseName];
                      if (!desc) return null;
                      return (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 16, paddingBottom: 4, lineHeight: 1.5, borderLeft: '2px solid var(--gold-dim)', marginLeft: 4 }}>
                          {desc}
                        </div>
                      );
                    })()}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* XP */}
        <div className="card">
          <div className="card-title">Experience & Insight</div>
          {/* Insight */}
          <div style={{ background: 'var(--bg-panel)', borderRadius: 5, padding: '.5rem .65rem', marginBottom: '.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: insightRank < 5 ? '.3rem' : 0 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Insight </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>{insight}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>Rank {insightRank}</span>
              </div>
              {needsRankUp && (
                <span style={{ fontSize: 11, color: 'var(--green)', border: '1px solid var(--green-dim)', borderRadius: 3, padding: '0 5px', animation: 'blink 1.4s infinite' }}>
                  ★ Rank Up Available!
                </span>
              )}
            </div>
            {insightRank < 5 && (() => {
              const threshold = getEffectiveRankThresholds(char)[insightRank];
              const prev = getEffectiveRankThresholds(char)[insightRank - 1] || 0;
              const pct = Math.min(100, ((insight - prev) / (threshold - prev)) * 100);
              return (
                <>
                  <div style={{ height: 5, background: 'var(--bg-dark)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: needsRankUp ? 'var(--green)' : 'var(--gold)', width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Rank {insightRank + 1} at {threshold} ({Math.max(0, threshold - insight)} more)
                  </div>
                </>
              );
            })()}
          </div>
          {/* XP numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: '.5rem' }}>
            {[['Total', char.xp_total || 0, 'var(--gold)'], ['Spent', char.xp_spent || 0, 'var(--text-secondary)'], ['Available', xpAvail, xpAvail > 0 ? 'var(--green)' : 'var(--red)']].map(([l, v, col]) => (
              <div key={l} style={{ textAlign: 'center', background: 'var(--bg-panel)', borderRadius: 4, padding: '.4rem' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: col }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
          {/* Recent XP log */}
          {(char.xp_log || []).slice(-3).map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '2px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
              <span style={{ color: e.amount > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{e.amount > 0 ? `+${e.amount}` : e.amount} XP</span> — {e.reason}
            </div>
          ))}
          {/* Spend XP button — visible to players for any character they've claimed (myCharIds, not
              the singular myCharId which only ever holds the first character a player ever claimed) */}
          {myCharIds.includes(char.id) && (
            <button className="btn btn-p" style={{ width: '100%', marginTop: '.5rem', opacity: xpAvail <= 0 ? 0.5 : 1 }} onClick={() => setShowXpPanel(true)}>
              <i className="ti ti-coins" style={{ marginRight: 6 }} />
              {xpAvail > 0 ? `Spend ${xpAvail} XP` : `XP Spender (${xpAvail} available)`}
            </button>
          )}
          {/* GM grant XP */}
          {isGM && !isPCView && (
            <div style={{ marginTop: '.5rem', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
              <input type="number" min={0} max={20} defaultValue={3} style={{ width: 50 }} id={`xp-${char.id}`} />
              <button className="btn btn-sm btn-p" onClick={() => {
                const amt = +document.getElementById(`xp-${char.id}`).value || 0;
                const newLog = [...(char.xp_log || []), { amount: amt, reason: 'GM grant', date: new Date().toLocaleDateString() }];
                update('xp_total', (char.xp_total || 0) + amt);
                update('xp_log', newLog);
              }}>+ Grant XP</button>
            </div>
          )}
        </div>

      </div>

      {/* Right column — Equipment, Techniques, Spells, Advantages */}
      <div>
        {/* Equipment — copper shown inline next to title, GM-only edit */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
            <span className="card-title" style={{ marginBottom: 0 }}>Equipment</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#d4a020', marginLeft: 4 }}>
              ◈ {char.copper ?? 0}
            </span>
            {canEdit && isGM && (() => {
              const inputId = `copper-delta-${char.id}`;
              return (
                <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
                  <input type="number" id={inputId} placeholder="±copper"
                    style={{ width: 68, fontSize: 11, padding: '1px 4px' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const delta = parseInt(e.target.value) || 0;
                        update('copper', Math.max(0, (char.copper || 0) + delta));
                        e.target.value = '';
                      }
                    }} />
                  <button className="btn btn-sm" onClick={() => {
                    const el = document.getElementById(inputId);
                    const delta = parseInt(el?.value) || 0;
                    update('copper', Math.max(0, (char.copper || 0) + delta));
                    if (el) el.value = '';
                  }}>±</button>
                </div>
              );
            })()}
          </div>
          {(char.equipment || []).map((e, i) => {
            const weapon = WEAPONS_LIST.find(w => w.name === e.name)
              || WEAPONS_LIST.find(w => w.name.toLowerCase().startsWith(e.name.toLowerCase()));
            const gearDesc = GEAR_DESCRIPTIONS[e.name]
              || Object.entries(GEAR_DESCRIPTIONS).find(([k]) => k.toLowerCase().startsWith(e.name.toLowerCase()))?.[1];
            const loreText = weapon
              ? `Damage: ${weapon.dr}\nSkill: ${weapon.skill}\nPrice: ${weapon.price}${weapon.special ? `\nSpecial: ${weapon.special}` : ''}`
              : gearDesc || null;
            const qualData = ITEM_QUALITIES[e.quality || 'standard'] || ITEM_QUALITIES.standard;
            // Magic items (from MagicItemCreator) often have a custom GM-chosen name that isn't in the
            // fixed WEAPONS_LIST/GEAR_LIST, so the name-based lookups below miss them — fall back to the
            // item's own item_type ('Weapon'/'Armor') which is always set correctly at creation time.
            const isWeapon = (!!e.dr || e.item_type === 'Weapon') && !e.isAmmo;
            const eqSlot = getEquipSlot(e.name);
            const isArmor = eqSlot === 'armor' || e.item_type === 'Armor';
            const isShield = eqSlot === 'shield';
            const isAmmo = !!e.isAmmo;
            const clothingSlot = CLOTHING_SLOTS[e.name]; // 'cloak' | 'clothes' | 'shoes' | undefined
            const isClothing = !!clothingSlot;
            const canToggleWield = isWeapon || isArmor || isShield || isClothing || isAmmo;
            // Player can wield/wear their own gear even without full edit mode
            const canWield = canEdit || myCharIds.includes(char.id);
            return (
              <React.Fragment key={i}>
                {e.is_magic && <div style={{ marginBottom: 3 }}><MagicItemBadge item={e} /></div>}
                <div className="eq-row">
                {/* Wield/Wear status indicator */}
                {canToggleWield && (
                  <button
                    onClick={() => {
                      if (isWeapon) {
                        // Wield: set inUse; unwield: clear inUse. Also update current_weapon.
                        const nowWielded = !e.inUse;
                        const eq = (char.equipment || []).map((x, xi) => xi === i ? { ...x, inUse: nowWielded } : x);
                        const wielded = eq.filter(x => x.dr && x.inUse && !x.isAmmo);
                        const currentWeapon = wielded.length > 0
                          ? `${wielded[0].name} (${wielded[0].dr})`
                          : null;
                        onUpdate(char.id, { equipment: eq, current_weapon: currentWeapon });
                      } else if (isAmmo) {
                        // Nocked arrow — single slot, like armor. Doesn't touch current_weapon; the bow
                        // stays the wielded weapon, this just picks which arrow type it's firing.
                        const nowNocked = !e.inUse;
                        const eq = (char.equipment || []).map((x, xi) => {
                          if (xi === i) return { ...x, inUse: nowNocked };
                          if (nowNocked && x.isAmmo && x.inUse) return { ...x, inUse: false };
                          return x;
                        });
                        onUpdate(char.id, { equipment: eq });
                      } else if (isClothing) {
                        // Clothing: one per slot (cloak/clothes/shoes). Equipping a new item in the same
                        // slot automatically removes the previously equipped one. Quality tier adjusts
                        // Status by CLOTHING_STATUS_DELTA — delta is recomputed from all equipped clothing
                        // so equipping/unequipping always lands on the correct total.
                        const nowWorn = !e.equipped;
                        const eq = (char.equipment || []).map((x, xi) => {
                          if (xi === i) return { ...x, equipped: nowWorn };
                          if (nowWorn && CLOTHING_SLOTS[x.name] === clothingSlot && x.equipped) return { ...x, equipped: false };
                          return x;
                        });
                        const prevStatusFromClothing = (char.equipment || []).filter(x => CLOTHING_SLOTS[x.name] && x.equipped)
                          .reduce((sum, x) => sum + (CLOTHING_STATUS_DELTA[x.quality || 'standard'] || 0), 0);
                        const newStatusFromClothing = eq.filter(x => CLOTHING_SLOTS[x.name] && x.equipped)
                          .reduce((sum, x) => sum + (CLOTHING_STATUS_DELTA[x.quality || 'standard'] || 0), 0);
                        const newStatus = Math.round(((char.status || 1) - prevStatusFromClothing + newStatusFromClothing) * 10) / 10;
                        onUpdate(char.id, { equipment: eq, status: newStatus });
                      } else {
                        // Armor / Shield / other single-slot items: toggle equipped, unequip any other
                        // item occupying the SAME slot (armor unequips armor, shield unequips shield —
                        // shields are their own slot so they don't conflict with armor, matching the
                        // conversion doc's rule that shields stack on top of armor rather than compete).
                        const nowWorn = !e.equipped;
                        const mySlot = getEquipSlot(e.name) === 'armor' || e.item_type === 'Armor' ? 'armor' : getEquipSlot(e.name);
                        const eq = (char.equipment || []).map((x, xi) => {
                          if (xi === i) return { ...x, equipped: nowWorn, inUse: nowWorn };
                          const xSlot = getEquipSlot(x.name) === 'armor' || x.item_type === 'Armor' ? 'armor' : getEquipSlot(x.name);
                          if (nowWorn && SINGLE_SLOT_CATEGORIES.includes(mySlot) && xSlot === mySlot) return { ...x, equipped: false, inUse: false };
                          return x;
                        });
                        onUpdate(char.id, { equipment: eq });
                      }
                    }}
                    style={{
                      flexShrink: 0, fontSize: 10, padding: '1px 6px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
                      background: ((isWeapon || isAmmo) ? e.inUse : e.equipped) ? 'rgba(200,150,42,.15)' : 'transparent',
                      border: `1px solid ${((isWeapon || isAmmo) ? e.inUse : e.equipped) ? 'var(--gold)' : 'var(--border)'}`,
                      color: ((isWeapon || isAmmo) ? e.inUse : e.equipped) ? 'var(--gold)' : 'var(--text-muted)',
                      pointerEvents: canWield ? 'auto' : 'none', opacity: canWield ? 1 : 0.5,
                    }}
                    title={isWeapon ? (e.inUse ? 'Currently wielding — click to sheathe' : 'Click to wield') : isAmmo ? (e.inUse ? 'Currently nocked — click to unnock' : 'Click to nock this arrow type') : isClothing ? (e.equipped ? `Worn (${clothingSlot} slot) — click to remove` : `Click to wear (${clothingSlot} slot)`) : (e.equipped ? 'Currently worn — click to remove' : 'Click to wear')}
                  >
                    {isWeapon
                      ? (e.inUse ? '⚔ Wielding' : 'Wield')
                      : isAmmo
                        ? (e.inUse ? '🏹 Nocked' : 'Nock')
                        : isClothing
                          ? (e.equipped ? '👘 Worn' : 'Wear')
                          : (e.equipped ? '🛡 Worn' : 'Wear')}
                  </button>
                )}
                <span style={{ flex: 1, color: (isWeapon || isAmmo ? e.inUse : isArmor ? e.equipped : true) ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  title={GEAR_DESCRIPTIONS[e.name] || undefined}>
                  {isWeapon && (() => {
                    const iconType = getWeaponIconType(e.name);
                    return iconType ? <WeaponIcon type={iconType} size={14} color="var(--gold-dim)" style={{ verticalAlign: 'middle', marginRight: 2 }} /> : null;
                  })()}
                  {isArmor && <ArmorIcon size={13} color="var(--gold-dim)" style={{ verticalAlign: 'middle', marginRight: 2 }} />}
                  {isClothing && e.equipped && (() => {
                    const delta = CLOTHING_STATUS_DELTA[e.quality || 'standard'] || 0;
                    if (delta === 0) return null;
                    return <span style={{ fontSize: 10, color: delta > 0 ? 'var(--green)' : 'var(--red)', marginLeft: 4 }}>{delta > 0 ? `+${delta}` : delta} Status</span>;
                  })()}
                  {e.name}
                  {GEAR_DESCRIPTIONS[e.name] && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 5, fontStyle: 'italic', display: 'block', lineHeight: 1.3 }}>
                      {GEAR_DESCRIPTIONS[e.name]}
                    </span>
                  )}
                  {ARROW_TYPES[e.name] && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: (e.count ?? 0) > 0 ? 'var(--gold)' : 'var(--red)' }}
                        title="Recovers 50% of arrows spent in an encounter automatically when it ends. Otherwise: buy more, or craft (later).">
                        {e.count ?? 0} left
                      </span>
                      {canWield && (
                        <button className="btn btn-sm" style={{ fontSize: 9, padding: '0 4px' }}
                          onClick={() => onUpdate(char.id, { equipment: (char.equipment || []).map((x, xi) => xi === i ? { ...x, count: Math.max(0, (x.count ?? 0) - 1) } : x) })}
                          title="Use one arrow">−</button>
                      )}
                      {canEdit && isGM && (
                        <>
                          <button className="btn btn-sm" style={{ fontSize: 9, padding: '0 4px' }}
                            onClick={() => onUpdate(char.id, { equipment: (char.equipment || []).map((x, xi) => xi === i ? { ...x, count: (x.count ?? 0) + 1 } : x) })}
                            title="GM: add one arrow (bought / looted / crafted)">+</button>
                          <button className="btn btn-sm" style={{ fontSize: 9, padding: '0 5px' }}
                            onClick={() => onUpdate(char.id, { equipment: (char.equipment || []).map((x, xi) => xi === i ? { ...x, count: parseInt(e.name.match(/\((\d+)/)?.[1], 10) || 60 } : x) })}
                            title="GM: refill to the starting amount">Refill</button>
                        </>
                      )}
                    </span>
                  )}
                </span>
                <RulebookEntryButton itemName={e.name} />
                {e.quality && e.quality !== 'standard' && (
                  <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: qualData.label === 'Poor' ? '#2a1a0a' : '#1a2a0a', color: qualData.label === 'Poor' ? '#8a5a30' : '#5a8a30', border: `1px solid ${qualData.label === 'Poor' ? '#4a2a1a' : '#3a6a1a'}` }} title={qualData.desc}>
                    {qualData.label}
                  </span>
                )}
                {!e.dr && SHIELDS.some(s => s.name === e.name) && (() => {
                  const shieldData = SHIELDS.find(s => s.name === e.name);
                  const atkPenalty = SHIELD_ATTACK_PENALTY[shieldData.size] || 0;
                  return (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 4 }}>
                      <span style={{ color: 'var(--gold-dim)', fontWeight: 600 }}>+{shieldData.tnBonus} TN</span>
                      {shieldData.reduction > 0 && <span style={{ marginLeft: 6 }}>Reduction {shieldData.reduction}</span>}
                      <span style={{ marginLeft: 6 }}>{atkPenalty} Attack/Athletics</span>
                      {shieldData.note && (
                        <span style={{ marginLeft: 6, fontStyle: 'italic', color: 'var(--text-muted)' }} title={shieldData.note}>ⓘ</span>
                      )}
                    </span>
                  );
                })()}
                {e.dr && (() => {
                  const wData = WEAPONS_LIST.find(w => w.name === e.name);
                  const skillName = e.skill || wData?.skill;
                  const charSkill = (char.skills || []).find(s => s.name === skillName);
                  const rank = charSkill?.rank || 0;
                  const agi = char.agility || 2;
                  const str = char.strength || 2;
                  const isStrWeapon = ['Heavy Weapons','Chain Weapons','Staves','Brawling'].includes(skillName);
                  const isRanged = ['Archery'].includes(skillName);
                  // Parse DR e.g. "0k4" or "3k2"
                  const drMatch = (e.dr || '').match(/^(\d+)k(\d+)$/);
                  const drRoll = drMatch ? parseInt(drMatch[1]) : 0;
                  const drKeep = drMatch ? parseInt(drMatch[2]) : 0;
                  // Attack pool: (Agility + skill rank)k(Fire ring for finesse, Strength for power)
                  const atkTrait = isStrWeapon ? (char.strength || 2) : agi;
                  const atkRing = isStrWeapon ? (char.water || 2) : (char.fire || 2);
                  const atkRoll = atkTrait + rank;
                  const atkKeep = atkRing;
                  // Damage pool: weapon DR + Strength bonus to rolled dice (kept stays weapon)
                  const dmgRoll = drRoll + (isRanged ? 0 : str);
                  const dmgKeep = drKeep;
                  return (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 4 }}>
                      <span style={{ color: 'var(--gold-dim)', fontWeight: 600 }}>DR {e.dr}</span>
                      {rank > 0 && (
                        <span style={{ marginLeft: 6 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Atk:</span> {atkRoll}k{atkKeep}{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>Dmg:</span> {dmgRoll}k{dmgKeep}
                        </span>
                      )}
                    </span>
                  );
                })()}
                {canEdit && isGM && e.dr && (
                  <select value={e.quality || 'standard'} onChange={ev => {
                    const eq = (char.equipment || []).map((x, xi) => xi === i ? { ...x, quality: ev.target.value } : x);
                    update('equipment', eq);
                  }} style={{ fontSize: 10, padding: '0 2px', background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3 }}>
                    {Object.entries(ITEM_QUALITIES).map(([k, q]) => <option key={k} value={k}>{q.label}</option>)}
                  </select>
                )}
                <ScrollLore title={e.name} text={loreText || e.name} size={10} />
                {canEdit && onUpdateInventory && (
                  <>
                    <select value={sendTarget[i] || ''} onChange={ev => setSendTarget(s => ({ ...s, [i]: ev.target.value }))}
                      style={{ fontSize: 10, padding: '1px 3px', background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3 }}>
                      <option value="">Send to...</option>
                      <option value="party">Party</option>
                      {(allChars || []).filter(c => c.id !== char.id && !c.is_npc).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', color: 'var(--text-muted)' }}
                      disabled={!sendTarget[i]}
                      title="Send this item to the chosen destination"
                      onClick={() => {
                        const item = char.equipment[i];
                        const dest = sendTarget[i];
                        update('equipment', (char.equipment || []).filter((_, idx) => idx !== i));
                        if (dest === 'party') {
                          onUpdateInventory({ items: [...(partyInventoryItems || []).filter(Boolean), { name: item.name, qty: 1, category: 'Gear', dr: item.dr || '', skill: item.skill || '' }] });
                          onLogEvent && onLogEvent('ti-arrow-left', `${item.name} → ${char.name} to Party Inventory`);
                        } else {
                          const destChar = (allChars || []).find(c => c.id === dest);
                          if (destChar) {
                            onUpdate(dest, { equipment: [...(destChar.equipment || []), { ...item, equipped: false, inUse: false }] });
                            onLogEvent && onLogEvent('ti-arrow-left', `${item.name}: ${char.name} → ${destChar.name}`);
                          }
                        }
                        setSendTarget(s => ({ ...s, [i]: '' }));
                      }}>Send</button>
                  </>
                )}
                {canEdit && <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => removeEq(i)}>×</button>}
              </div>
              </React.Fragment>
            );
          })}
          {canEdit && isGM && (
            <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
              <select value={addEq || ''} onChange={e => setAddEq && setAddEq(e.target.value)} style={{ flex: 1 }}>
                <option value="">Add equipment...</option>
                <optgroup label="Weapons">
                  {WEAPONS_LIST.filter(w => !w.faction).map(w => <option key={w.name} value={w.name}>{w.name} ({w.dr})</option>)}
                </optgroup>
                {['Ashalan', 'Senpet', 'Yodotai', 'Ebonite', 'Assassin'].map(faction => {
                  const items = WEAPONS_LIST.filter(w => w.faction === faction);
                  return items.length > 0 ? (
                    <optgroup key={faction} label={`Faction Weapons — ${faction}`}>
                      {items.map(w => <option key={w.name} value={w.name}>{w.name} ({w.dr})</option>)}
                    </optgroup>
                  ) : null;
                })}
                <optgroup label="Shields">
                  {SHIELDS.map(s => <option key={s.name} value={s.name}>{s.name} (Shield: +{s.tnBonus} TN{s.reduction ? `, Reduction ${s.reduction}` : ''})</option>)}
                </optgroup>
                <optgroup label="Armor">
                  {GEAR_LIST.filter(g => ARMOR_TN_BONUS[g] !== undefined).map(g => <option key={g} value={g}>{g}</option>)}
                </optgroup>
                <optgroup label="Gear">
                  {GEAR_LIST.filter(g => ARMOR_TN_BONUS[g] === undefined).map(g => <option key={g} value={g}>{g}</option>)}
                </optgroup>
              </select>
              <button className="btn btn-sm btn-p" disabled={!addEq} onClick={addEquipment}>Add</button>
            </div>
          )}
        </div>


        {/* Techniques */}
        <div className="card">
          <div className="card-title">Techniques</div>
          {Array.from({ length: char.school_rank || 1 }, (_, i) => i + 1).map(rank => {
            const currentTechRaw = (char.techniques || {})[rank];
            const currentTech = typeof currentTechRaw === 'object' ? (currentTechRaw?.name || '') : (currentTechRaw || '');
            const sd = SCHOOL_DATA[char.school];
            const schoolTechAtRank = sd?.techniques?.[rank];
            // All schools' rank-1 techniques (for starting a second school at this slot)
            const allSchoolRank1 = Object.entries(SCHOOL_DATA)
              .filter(([sName]) => sName !== char.school)
              .map(([sName, sData]) => ({ school: sName, tech: sData.techniques?.[1] }))
              .filter(x => x.tech);
            // Any school/path that has a technique at exactly this rank (for paths with rank 2, etc.)
            const othersAtThisRank = rank > 1 ? Object.entries(SCHOOL_DATA)
              .filter(([sName]) => sName !== char.school)
              .map(([sName, sData]) => ({ school: sName, tech: sData.techniques?.[rank] }))
              .filter(x => x.tech) : [];

            return (
              <div key={rank} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '5px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                <span style={{ color: 'var(--gold-dim)', fontSize: 12, minWidth: 20, marginTop: 2, flexShrink: 0 }}>R{rank}</span>
                {canEdit && isGM ? (
                  <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: currentTech ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: currentTech ? 'normal' : 'italic' }}>
                        {currentTech || '— not set —'}
                      </div>
                    </div>
                    <select style={{ fontSize: 11, maxWidth: 220 }}
                      value=""
                      onChange={e => {
                        if (!e.target.value) return;
                        const updated = { ...(char.techniques || {}), [rank]: e.target.value };
                        update('techniques', updated);
                      }}>
                      <option value="">Change technique…</option>
                      {schoolTechAtRank && (
                        <optgroup label={`${char.school} — Rank ${rank}`}>
                          <option value={schoolTechAtRank}>{schoolTechAtRank}</option>
                        </optgroup>
                      )}
                      {othersAtThisRank.length > 0 && (
                        <optgroup label={`Other Schools — Rank ${rank}`}>
                          {othersAtThisRank.map(x => (
                            <option key={x.school + rank} value={x.tech}>{x.school}: {x.tech}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Any School — Rank 1 (start new school)">
                        {allSchoolRank1.map(x => (
                          <option key={x.school + '1'} value={x.tech}>{x.school}: {x.tech}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {currentTech}
                        {(() => {
                          const status = getTechniqueAutomationStatus(currentTech);
                          if (status === 'auto') return null; // no icon needed — works automatically, no clutter
                          if (status === 'manual') return (
                            <i className="ti ti-hand-stop" style={{ fontSize: 12, color: 'var(--gold-dim)' }}
                              title="This technique's effects aren't automated in the dice roller — handle it manually with the GM. Its full effect is described below." />
                          );
                          return (
                            <i className="ti ti-help-circle" style={{ fontSize: 12, color: 'var(--text-muted)' }}
                              title="This technique hasn't been reviewed yet — its effects may not be reflected anywhere in the app. Handle manually with the GM for now." />
                          );
                        })()}
                      </div>
                      {TECHNIQUE_DESCRIPTIONS[currentTech] && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                          {TECHNIQUE_DESCRIPTIONS[currentTech]}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {canEdit && isGM && (
            <div style={{ marginTop: '.5rem', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              School Rank:
              <input type="number" min={1} max={8} value={char.school_rank || 1} style={{ width: 50 }}
                onChange={e => {
                  const newRank = +e.target.value;
                  const existing = char.techniques || {};
                  const sd = SCHOOL_DATA[char.school];
                  const updated = { ...existing };
                  for (let i = 1; i <= newRank; i++) {
                    if (!updated[i] && sd?.techniques?.[i]) updated[i] = sd.techniques[i];
                  }
                  update('school_rank', newRank);
                  update('techniques', updated);
                }} />
              <button className="btn btn-sm btn-p" style={{ fontSize: 11 }}
                onClick={() => setPendingRankUp(true)}
                title="Open rank-up overlay to choose next technique">
                ⬆ Rank Up
              </button>
            </div>
          )}
        </div>

        {/* Spells (Sahir/Cokaloi) */}
        {(isSahirSchool(char.school) || IS_COKALOI_SCHOOL(char.school)) && (
          <div className="card">
            <div className="card-title">Spells & Magic</div>
            <SpellConstellation
              character={char}
              mode="sheet"
              onUpdate={canEdit ? onUpdate : null}
            />
          </div>
        )}

        {/* Advantages / Disadvantages */}
        {(((char.advantages || []).length > 0 || (char.disadvantages || []).length > 0) || (canEdit && isGM)) && (
          <div className="card">
            {/* Advantages */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '.25rem' }}>
              <span className="card-title" style={{ marginBottom: 0 }}>Advantages</span>
              {canEdit && isGM && (
                <select style={{ fontSize: 10, marginLeft: 'auto', maxWidth: 160 }}
                  value=""
                  onChange={async e => {
                    const name = e.target.value;
                    if (!name) return;
                    const adv = ADVANTAGES.find(a => a.name === name);
                    const already = (char.advantages || []).some(a => a.name === name);
                    if (already) return;
                    const patch = { advantages: [...(char.advantages || []), { name, cost: adv?.cost || 0, notes: '' }] };
                    // Fame: "+1 Reputation Rank" — direct, immediate, one-time stat add (like Weakness's trait
                    // reduction) rather than a roll-time hook, since it's not a dice modifier at all.
                    if (name === 'Fame') patch.reputation = (char.reputation ?? 1) + 1;
                    // Gentry: variable cost (8-30pt) holding — LBS doesn't give an exact koku/copper table for
                    // this, so this is a documented estimate (cost × 3 copper), not an official value. Uses
                    // whatever cost was set at add time; if the GM later edits Gentry's point cost, the money
                    // grant won't retroactively adjust (same one-time-grant limitation as Weakness/Doubt).
                    if (name === 'Gentry') patch.copper = (char.copper || 0) + (adv?.cost || 8) * 3;
                    // Wealthy: "each rank grants 2 additional koku" — rank stored as a.rank (default 1, like Luck)
                    if (name === 'Wealthy') patch.copper = (char.copper || 0) + 2;
                    // Social Position: "+1 Status Rank" — direct, immediate stat change, same pattern as Fame
                    if (name === 'Social Position') patch.status = (char.status ?? 1) + 1;
                    onUpdate(char.id, patch);
                    // Gorilla Bodyguard: auto-spawn the trained ape as a full character using the confirmed
                    // Ozaru stat block, so it shows up claimable in the Character tab immediately. Sets
                    // claimed_by_name to the owner's name as a visible association — true one-click claiming
                    // for the SPECIFIC player isn't automatable from here (claim state lives in that player's
                    // own browser localStorage, not something a background handler can set remotely); the
                    // player still needs to tap "Claim" on the new gorilla themselves, one click.
                    if (name === 'Gorilla Bodyguard' && onCreateCharacter) {
                      const g = CREATURES_LIBRARY.find(c => c.id === 'creature_gorilla');
                      if (g) {
                        const [atkRoll, atkKeep] = (g.attack || '5k4').split('k').map(Number);
                        const [dmgRoll, dmgKeep] = (g.damage || '5k2').split('k').map(Number);
                        await onCreateCharacter({
                          name: `${char.name}'s Gorilla Bodyguard`, faction: char.faction || '', school: '',
                          school_rank: 1, insight_rank: 1, is_npc: true,
                          air: g.air, earth: g.earth, fire: g.fire, water: g.water, void: 2,
                          reflexes: g.traits?.Reflexes || 3, awareness: 2, stamina: g.traits?.Stamina || 4, willpower: 2,
                          agility: g.traits?.Agility || 4, intelligence: 1, strength: g.traits?.Strength || 5, perception: 2,
                          current_wounds: 0, max_wounds: (g.traits?.Stamina || 4) * 17, current_void: 2,
                          integrity: 3, reputation: 0, status: 0, copper: 0,
                          player_notes: '', gm_notes: g.gm_notes || '',
                          skills: [{ name: 'Athletics', rank: 3, school: false }],
                          equipment: [], advantages: [], disadvantages: [],
                          techniques: {}, spells: [],
                          current_weapon: `Smash (${g.attack || '5k4'})`,
                          claimed_by_name: char.name,
                        });
                        if (onLogEvent) onLogEvent('ti-paw', `${char.name}'s Gorilla Bodyguard created — tap Claim on it to control it directly`);
                      }
                    }
                  }}>
                  <option value="">+ Add advantage…</option>
                  {ADVANTAGES.map(a => <option key={a.name} value={a.name}>{a.name} ({a.cost}pt)</option>)}
                </select>
              )}
            </div>
            {(char.advantages || []).length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.25rem' }}>None</div>}
            {(char.advantages || []).map((a, ai) => {
              const adv = ADVANTAGES.find(x => x.name === a.name);
              const updateAdv = (patch) => {
                const updated = (char.advantages || []).map((x, xi) => xi === ai ? { ...x, ...patch } : x);
                update('advantages', updated);
              };
              return (
                <div key={a.name + ai} style={{ padding: '6px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {canEdit && isGM
                      ? <input value={a.customName || a.name} onChange={e => updateAdv({ customName: e.target.value })}
                          onBlur={e => !e.target.value && updateAdv({ customName: undefined })}
                          style={{ flex: 1, fontSize: 13, fontWeight: 500, background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid rgba(200,150,42,.2)', color: 'var(--text-secondary)', outline: 'none', fontFamily: 'inherit', padding: '0 2px' }} />
                      : <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{a.customName || a.name}</span>
                    }
                    {(() => {
                      const status = getAdvantageAutomationStatus(a.name);
                      if (status !== 'auto') return null; // only flag the ones with a real dice-roll hook — no clutter otherwise
                      return <i className="ti ti-bolt" style={{ fontSize: 12, color: 'var(--gold-dim)' }}
                        title="This advantage's bonus is applied automatically in the dice roller when relevant." />;
                    })()}
                    <span style={{ color: 'var(--gold-dim)', fontSize: 11 }}>({a.cost} pts)</span>
                    {canEdit && isGM && (
                      <button className="btn btn-sm btn-d" style={{ padding: '0 4px', fontSize: 11, lineHeight: 1.4 }}
                        onClick={() => update('advantages', (char.advantages || []).filter((_, xi) => xi !== ai))}>×</button>
                    )}
                  </div>
                  {adv?.desc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4, fontStyle: 'italic' }}>{adv.desc}</div>}
                  {a.name === 'Elemental Blessing' && canEdit && isGM && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chosen Ring:</span>
                      <select style={{ fontSize: 11 }} value={a.ring || ''} onChange={e => updateAdv({ ring: e.target.value || undefined })}>
                        <option value="">— choose —</option>
                        {['Air', 'Earth', 'Fire', 'Water'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {a.ring && <span style={{ fontSize: 11, color: 'var(--gold-dim)' }}>-1 XP cost to raise {a.ring}-Ring Traits</span>}
                    </div>
                  )}
                  {a.name === 'Elemental Blessing' && !isGM && a.ring && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Chosen Ring: {a.ring}</div>
                  )}
                  {a.name === 'Great Potential' && canEdit && isGM && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chosen Skill:</span>
                      <select style={{ fontSize: 11 }} value={a.skill || ''} onChange={e => updateAdv({ skill: e.target.value || undefined })}>
                        <option value="">— choose —</option>
                        {(char.skills || []).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                      {a.skill && <span style={{ fontSize: 11, color: 'var(--gold-dim)' }}>Raises on {a.skill} capped by Skill Rank instead of Void Ring, if higher.</span>}
                    </div>
                  )}
                  {a.name === 'Great Potential' && !isGM && a.skill && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Chosen Skill: {a.skill}</div>
                  )}
                  {a.name === 'Read Lips' && (canEdit || myCharIds.includes(char.id)) && onRoll && (() => {
                    const [dist, setDist] = [readLipsDist[char.id] || 20, (v) => setReadLipsDist(p => ({ ...p, [char.id]: v }))];
                    const tn = 15 + 5 * Math.ceil(dist / 20);
                    const perception = char.perception || 2;
                    const insightRank = char.insight_rank || char.school_rank || 1;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Distance:</span>
                        <input type="number" value={dist} onChange={e => setDist(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          style={{ width: 50, fontSize: 11 }} /> <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ft (TN {tn})</span>
                        <button className="btn btn-sm" onClick={() => onRoll({
                          skill: 'Read Lips', ring: 'Perception', ringVal: perception,
                          baseRoll: perception + insightRank, baseKeep: perception, tn,
                          character: char, currentVoid: char.current_void,
                          label: `Read Lips (${dist} ft, TN ${tn})`,
                        })}>
                          <i className="ti ti-dice" style={{ marginRight: 3 }} />Roll {perception + insightRank}k{perception}
                        </button>
                      </div>
                    );
                  })()}
                  {a.name === 'Well-Connected' && (canEdit || myCharIds.includes(char.id)) && onRoll && (() => {
                    const courtierSkill = (char.skills || []).find(s => s.name === 'Courtier');
                    const awareness = char.awareness || 2;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Favor from court contact (TN 20, once/session/rank):</span>
                        <button className="btn btn-sm" onClick={() => onRoll({
                          skill: 'Courtier', ring: 'Air', ringVal: awareness,
                          baseRoll: (courtierSkill?.rank || 0) + awareness, baseKeep: awareness, tn: 20,
                          character: char, currentVoid: char.current_void,
                          label: 'Well-Connected — favor from court contact',
                        })}>
                          <i className="ti ti-dice" style={{ marginRight: 3 }} />Roll {(courtierSkill?.rank || 0) + awareness}k{awareness}
                        </button>
                      </div>
                    );
                  })()}
                  {(a.name || '').startsWith('Luck') && (() => {
                    const luckRank = a.rank || 1;
                    const usesLeft = a.current_uses !== undefined ? a.current_uses : luckRank;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Uses this session:</span>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {Array.from({ length: luckRank }, (_, i) => (
                            <button key={i} onClick={() => canEdit && isGM && updateAdv({ current_uses: i < usesLeft ? usesLeft - 1 : usesLeft + 1 })}
                              style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${i < usesLeft ? 'var(--gold)' : 'var(--border)'}`, background: i < usesLeft ? 'var(--gold)' : 'transparent', cursor: canEdit && isGM ? 'pointer' : 'default', padding: 0 }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: usesLeft > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{usesLeft}/{luckRank}</span>
                        {canEdit && isGM && <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px' }} onClick={() => updateAdv({ current_uses: luckRank })}>Reset</button>}
                      </div>
                    );
                  })()}
                  {canEdit && isGM
                    ? <textarea value={a.notes || ''} onChange={e => updateAdv({ notes: e.target.value })}
                        placeholder="Notes…" rows={1}
                        style={{ width: '100%', boxSizing: 'border-box', marginTop: 3, fontSize: 11, resize: 'vertical', background: 'rgba(107,78,40,.06)', border: '1px solid rgba(107,78,40,.2)', borderRadius: 3, color: 'var(--text-muted)', fontFamily: 'inherit', padding: '2px 5px' }} />
                    : a.notes ? <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.notes}</div> : null
                  }
                </div>
              );
            })}

            {/* Disadvantages */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '.5rem', marginBottom: '.25rem' }}>
              <span className="card-title" style={{ marginBottom: 0 }}>Disadvantages</span>
              {canEdit && isGM && (
                <select style={{ fontSize: 10, marginLeft: 'auto', maxWidth: 160 }}
                  value=""
                  onChange={e => {
                    const name = e.target.value;
                    if (!name) return;
                    const dis = DISADVANTAGES.find(d => d.name === name);
                    const already = (char.disadvantages || []).some(d => d.name === name);
                    if (already) return;
                    const patch = { disadvantages: [...(char.disadvantages || []), { name, value: dis?.value || 0, notes: '' }] };
                    // Dishonored: "Status Rank 1" — direct, immediate stat set (the "may not gain Status while
                    // active" restriction isn't enforced — would need to gate the Status-editing UI, not done)
                    if (name === 'Dishonored') patch.status = 1;
                    // Social Disadvantage: "begin with Status Rank 0" — same pattern
                    if (name === 'Social Disadvantage') patch.status = 0;
                    onUpdate(char.id, patch);
                  }}>
                  <option value="">+ Add disadvantage…</option>
                  {DISADVANTAGES.map(d => <option key={d.name} value={d.name}>{d.name} (+{d.value}CP)</option>)}
                </select>
              )}
            </div>
            {(char.disadvantages || []).length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>None</div>}
            {(char.disadvantages || []).map((d, di) => {
              const dis = DISADVANTAGES.find(x => x.name === d.name);
              const updateDis = (patch) => {
                const updated = (char.disadvantages || []).map((x, xi) => xi === di ? { ...x, ...patch } : x);
                update('disadvantages', updated);
              };
              return (
                <div key={d.name + di} style={{ padding: '6px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {canEdit && isGM
                      ? <input value={d.customName || d.name} onChange={e => updateDis({ customName: e.target.value })}
                          onBlur={e => !e.target.value && updateDis({ customName: undefined })}
                          style={{ flex: 1, fontSize: 13, fontWeight: 500, background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid rgba(200,64,48,.2)', color: 'var(--text-secondary)', outline: 'none', fontFamily: 'inherit', padding: '0 2px' }} />
                      : <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{d.customName || d.name}</span>
                    }
                    {(() => {
                      const status = getDisadvantageAutomationStatus(d.name);
                      if (status !== 'auto') return null; // only flag the ones with a real dice-roll hook — no clutter otherwise
                      return <i className="ti ti-bolt" style={{ fontSize: 12, color: 'var(--red)' }}
                        title="This disadvantage's penalty is applied automatically in the dice roller when relevant." />;
                    })()}
                    <span style={{ color: 'var(--red)', fontSize: 11 }}>(+{d.value} CP)</span>
                    {canEdit && isGM && (
                      <button className="btn btn-sm btn-d" style={{ padding: '0 4px', fontSize: 11, lineHeight: 1.4 }}
                        onClick={() => {
                          const filtered = (char.disadvantages || []).filter((_, xi) => xi !== di);
                          if (d.name === 'Weakness' && d.trait) {
                            const traitField = d.trait.toLowerCase();
                            onUpdate(char.id, { disadvantages: filtered, [traitField]: (char[traitField] || 1) + 1 });
                          } else {
                            update('disadvantages', filtered);
                          }
                        }}>×</button>
                    )}
                  </div>
                  {dis?.desc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4, fontStyle: 'italic' }}>{dis.desc}</div>}
                  {d.name === 'Weakness' && canEdit && isGM && (() => {
                    const traitField = (t) => t.toLowerCase();
                    const chooseTrait = (newTrait) => {
                      const patch = {};
                      // Restore the previously-chosen trait if switching
                      if (d.trait) patch[traitField(d.trait)] = (char[traitField(d.trait)] || 1) + 1;
                      // Apply -1 to the newly chosen trait (min 1)
                      const baseVal = patch[traitField(newTrait)] !== undefined ? patch[traitField(newTrait)] : (char[traitField(newTrait)] || 2);
                      patch[traitField(newTrait)] = Math.max(1, baseVal - 1);
                      const updatedDisadvantages = (char.disadvantages || []).map((x, xi) => xi === di ? { ...x, trait: newTrait } : x);
                      onUpdate(char.id, { ...patch, disadvantages: updatedDisadvantages });
                    };
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Affected Trait:</span>
                        <select style={{ fontSize: 11 }} value={d.trait || ''} onChange={e => e.target.value && chooseTrait(e.target.value)}>
                          <option value="">— choose —</option>
                          {TRAITS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {d.trait && <span style={{ fontSize: 11, color: 'var(--red)' }}>{d.trait} reduced by 1 (permanent, until this disadvantage is removed)</span>}
                      </div>
                    );
                  })()}
                  {d.name === 'Weakness' && !isGM && d.trait && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Affected Trait: {d.trait} (reduced by 1)</div>
                  )}
                  {d.name === 'Curse of the Grey Crone' && canEdit && isGM && (() => {
                    const traitField = (t) => t.toLowerCase();
                    const chooseTrait = (newTrait) => {
                      const patch = {};
                      // Restore the previously-chosen trait to a sane default if switching (can't know their
                      // true pre-curse value once locked, so restore to 2 — GM can correct manually if needed)
                      if (d.trait) patch[traitField(d.trait)] = 2;
                      patch[traitField(newTrait)] = 1;
                      const updatedDisadvantages = (char.disadvantages || []).map((x, xi) => xi === di ? { ...x, trait: newTrait } : x);
                      onUpdate(char.id, { ...patch, disadvantages: updatedDisadvantages });
                    };
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Locked Trait:</span>
                        <select style={{ fontSize: 11 }} value={d.trait || ''} onChange={e => e.target.value && chooseTrait(e.target.value)}>
                          <option value="">— choose —</option>
                          {TRAITS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {d.trait && <span style={{ fontSize: 11, color: 'var(--red)' }}>{d.trait} locked to 1, cannot be raised with XP. Insight Rank XP thresholds reduced by 5 each.</span>}
                      </div>
                    );
                  })()}
                  {d.name === 'Curse of the Grey Crone' && !isGM && d.trait && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Locked Trait: {d.trait} (cannot be raised)</div>
                  )}
                  {d.name === 'Unlucky' && (() => {
                    const unluckyRank = d.rank || 1;
                    const usesLeft = d.current_uses !== undefined ? d.current_uses : unluckyRank;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>GM uses this session:</span>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {Array.from({ length: unluckyRank }, (_, i) => (
                            <button key={i} onClick={() => canEdit && isGM && updateDis({ current_uses: i < usesLeft ? usesLeft - 1 : usesLeft + 1 })}
                              style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${i < usesLeft ? 'var(--red)' : 'var(--border)'}`, background: i < usesLeft ? 'var(--red)' : 'transparent', cursor: canEdit && isGM ? 'pointer' : 'default', padding: 0 }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: usesLeft > 0 ? 'var(--red)' : 'var(--text-muted)' }}>{usesLeft}/{unluckyRank}</span>
                        {canEdit && isGM && <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px' }} onClick={() => updateDis({ current_uses: unluckyRank })}>Reset</button>}
                      </div>
                    );
                  })()}
                  {d.name === 'Cursed by the Honest Hand' && canEdit && isGM && (() => {
                    const options = (char.skills || []).map(s => s.name);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chosen Skill:</span>
                        <select style={{ fontSize: 11 }} value={d.skill || ''} onChange={e => updateDis({ skill: e.target.value || undefined })}>
                          <option value="">— choose —</option>
                          {options.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {d.skill && <span style={{ fontSize: 11, color: 'var(--red)' }}>XP cost to raise {d.skill} is doubled</span>}
                      </div>
                    );
                  })()}
                  {d.name === 'Cursed by the Honest Hand' && !isGM && d.skill && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Chosen Skill: {d.skill} (XP cost doubled)</div>
                  )}
                  {d.name === 'Doubt' && canEdit && isGM && (() => {
                    const options = (char.skills || []).map(s => s.name);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chosen School Skill:</span>
                        <select style={{ fontSize: 11 }} value={d.skill || ''} onChange={e => updateDis({ skill: e.target.value || undefined })}>
                          <option value="">— choose —</option>
                          {options.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {d.skill && <span style={{ fontSize: 11, color: 'var(--red)' }}>+5 TN on every {d.skill} roll (mandatory wasted Raise)</span>}
                      </div>
                    );
                  })()}
                  {d.name === 'Doubt' && !isGM && d.skill && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Chosen School Skill: {d.skill} (+5 TN mandatory wasted Raise)</div>
                  )}
                  {d.name === 'Missing Limb' && canEdit && isGM && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Missing:</span>
                      <select style={{ fontSize: 11 }} value={d.limb || ''} onChange={e => updateDis({ limb: e.target.value || undefined })}>
                        <option value="">— choose —</option>
                        <option value="Arm/Hand">Arm / Hand</option>
                        <option value="Leg/Foot">Leg / Foot</option>
                        <option value="Eye">Eye</option>
                      </select>
                      {d.limb && <span style={{ fontSize: 11, color: 'var(--red)' }}>+10 TN on rolls involving a {d.limb}</span>}
                    </div>
                  )}
                  {d.name === 'Missing Limb' && !isGM && d.limb && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Missing: {d.limb} (+10 TN on affected rolls)</div>
                  )}
                  {canEdit && isGM
                    ? <textarea value={d.notes || ''} onChange={e => updateDis({ notes: e.target.value })}
                        placeholder="Notes…" rows={1}
                        style={{ width: '100%', boxSizing: 'border-box', marginTop: 3, fontSize: 11, resize: 'vertical', background: 'rgba(107,78,40,.06)', border: '1px solid rgba(107,78,40,.2)', borderRadius: 3, color: 'var(--text-muted)', fontFamily: 'inherit', padding: '2px 5px' }} />
                    : d.notes ? <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{d.notes}</div> : null
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
function CharacterCreation({ onComplete, onCancel, defaultIsNpc = false, isGM = false, startingCP = 45 }) {
  const [step, setStep] = useState(1);
  const [isNpc, setIsNpc] = useState(defaultIsNpc);
  const [faction, setFaction] = useState('');
  const [subfaction, setSubfaction] = useState('');
  const [school, setSchool] = useState('');
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');
  const [traits, setTraits] = useState({ Reflexes:2,Awareness:2,Stamina:2,Willpower:2,Agility:2,Intelligence:2,Strength:2,Perception:2,Void:2 });
  const [skills, setSkills] = useState({});
  const [customSkillInput, setCustomSkillInput] = useState(null); // null = hidden, string = text being entered
  const [advantages, setAdvantages] = useState([]);
  const [disadvantages, setDisadvantages] = useState([]);
  const [eboniteAny, setEboniteAny] = useState('Strength');
  const [selectedSpells, setSelectedSpells] = useState([]);
  const [spellEmphasis, setSpellEmphasis] = useState('');
  const [spellDisciplineBonus, setSpellDisciplineBonus] = useState('');
  const TOTAL_CP = startingCP || 45;

  const schoolIsSahir = isSahirSchool(school);
  const startingSpells = school === "Ra'Shari Diviner" ? 6 : 3;
  const subfactions = faction ? Object.keys(SUBFACTION_BONUSES[faction] || {}) : [];
  const [showAllSchools, setShowAllSchools] = useState(false);
  const schools = faction ? FACTION_SCHOOLS[faction] || [] : [];
  const allSchoolNames = Object.keys(SCHOOL_DATA);
  const displayedSchools = showAllSchools ? allSchoolNames : schools;

  function getBaseTraitValue(trait) {
    let base = 2;
    const sd = SCHOOL_DATA[school];
    if (sd?.bonus_trait === trait) base = 3;
    if (subfaction && SUBFACTION_BONUSES[faction]) {
      const bonus = SUBFACTION_BONUSES[faction][subfaction];
      if (bonus === trait || (bonus === 'Any' && trait === eboniteAny)) base = Math.max(base, 3);
      if (bonus === trait && sd?.bonus_trait === trait) base = 4;
    }
    if (trait === 'Void' && (faction === 'Ashalan' || faction === 'Senpet')) base = Math.max(base, 3);
    if (trait === 'Void' && faction === 'Yodotai') base = 3; // from subfaction bonus on Strength, not Void
    return base;
  }

  function initTraits(s, sf) {
    const sd = SCHOOL_DATA[s]; if (!sd) return;
    const t = { Reflexes:2,Awareness:2,Stamina:2,Willpower:2,Agility:2,Intelligence:2,Strength:2,Perception:2,Void:2 };
    if (sd.bonus_trait && sd.bonus_trait !== 'Void') t[sd.bonus_trait] = 3;
    if (sd.bonus_trait === 'Void') t.Void = 3;
    const sfBonus = sf ? SUBFACTION_BONUSES[faction]?.[sf] : '';
    if (sfBonus && sfBonus !== 'Any' && sfBonus !== 'Void' && t[sfBonus] !== undefined) {
      t[sfBonus] = Math.max(t[sfBonus], 3);
      if (sd.bonus_trait === sfBonus) t[sfBonus] = 4;
    }
    if (sfBonus === 'Void') t.Void = Math.max(t.Void, 3);
    if (faction === 'Ashalan' || faction === 'Senpet') t.Void = Math.max(t.Void, 3);
    if (faction === 'Yodotai') t.Strength = Math.max(t.Strength, 3);
    setTraits(t);
    const sk = {}; (sd.skills || []).forEach(s => { sk[s] = 1; });
    setSkills(sk);
  }

  // CP calculation
  const traitCost = Object.entries(traits).reduce((s, [k, v]) => {
    const base = getBaseTraitValue(k);
    return s + Array.from({ length: v - base }, (_, i) => (base + i + 1) * 4).reduce((a, b) => a + b, 0);
  }, 0);
  const skillCost = Object.entries(skills).reduce((s, [, v]) => s + Array.from({ length: v }, (_, i) => i + 1).reduce((a, b) => a + b, 0), 0);
  const advCost = advantages.reduce((s, a) => s + (a.cost || 0), 0);
  const disRawTotal = disadvantages.reduce((s, d) => s + (d.value || 0), 0);
  const disCost = Math.min(disRawTotal, 10); // CP gain capped at 10; can take more disads without further CP
  const cpSpent = traitCost + skillCost + advCost;
  const cpAvailable = TOTAL_CP + disCost;
  const cpRemaining = cpAvailable - cpSpent;
  const disTotal = disRawTotal; // for display purposes — full total

  function adjustTrait(trait, delta) {
    const cur = traits[trait], base = getBaseTraitValue(trait);
    const next = cur + delta;
    if (next < base || next > base + 2) return;
    if (delta > 0 && next * 4 > cpRemaining) return;
    setTraits(t => ({ ...t, [trait]: next }));
  }

  function adjustSkill(skill, delta) {
    const cur = skills[skill] || 0, next = cur + delta;
    if (next < 0 || next > 7) return;
    if (delta > 0 && next > cpRemaining) return;
    setSkills(s => ({ ...s, [skill]: next }));
  }

  const steps = schoolIsSahir
    ? ['Faction','Sub-faction','School','Advantages','Traits & Skills','Spells','Identity']
    : ['Faction','Sub-faction','School','Advantages','Traits & Skills','Identity'];
  const advStep = 4;
  const spellStep = schoolIsSahir ? 6 : null;
  const traitsStep = 5;
  const identityStep = schoolIsSahir ? 7 : 6;

  const handleComplete = () => {
    const charData = buildCharacterFromForm({ faction, subfaction, school, name, playerName, traits, skills, advantages, disadvantages, selectedSpells, spellEmphasis, cpRemaining });
    onComplete({ ...charData, game_id: GAME_ID, is_npc: isNpc, avatar_url: portraitUrl.trim() });
  };

  return (
    <div style={{ maxWidth: 700 }}>

      {/* Top navigation bar */}
      {(() => {
        const backAction = step === 1 ? onCancel : () => setStep(step - 1);
        // Compute next disabled state per step
        const nextDisabled =
          step === 1 ? !faction :
          step === 2 ? !subfaction :
          step === 3 ? !school :
          step === advStep ? false :
          step === traitsStep ? cpRemaining < 0 :
          step === spellStep ? (selectedSpells.length < startingSpells || (!IS_COKALOI_SCHOOL(school) && (!spellEmphasis || !spellDisciplineBonus))) :
          step === identityStep ? !name :
          false;
        const nextAction = () => {
          if (step === 1) setStep(2);
          else if (step === 2) setStep(3);
          else if (step === 3) setStep(advStep);
          else if (step === advStep) setStep(traitsStep);
          else if (step === traitsStep) setStep(spellStep || identityStep);
          else if (step === spellStep) setStep(identityStep);
          else if (step === identityStep) handleComplete();
        };
        const isLastStep = step === identityStep;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            {(step > 1 || onCancel) && (
              <button className="btn btn-sm" onClick={backAction}>{step === 1 ? '✕ Cancel Creation' : '← Back'}</button>
            )}
            <div style={{ flex: 1 }} />
            <button className="btn btn-p btn-sm" disabled={nextDisabled} onClick={nextAction}>
              {isLastStep ? 'Create Character' : 'Next →'}
            </button>
          </div>
        );
      })()}

      {/* PC / NPC toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', padding: '.5rem .75rem', background: isNpc ? 'rgba(200,64,48,.08)' : 'rgba(74,138,64,.08)', border: `1px solid ${isNpc ? 'rgba(200,64,48,.3)' : 'rgba(74,138,64,.3)'}`, borderRadius: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Creating:</span>
        <button className={`btn btn-sm ${!isNpc ? 'btn-p' : ''}`} onClick={() => setIsNpc(false)}>
          <i className="ti ti-user" style={{ fontSize: 12, marginRight: 4 }} />Player Character
        </button>
        <button className={`btn btn-sm ${isNpc ? 'btn-p' : ''}`} style={isNpc ? { borderColor: '#c84030', background: 'rgba(200,64,48,.2)', color: '#e86050' } : {}} onClick={() => setIsNpc(true)}>
          <i className="ti ti-user-bolt" style={{ fontSize: 12, marginRight: 4 }} />NPC (Full Sheet)
        </button>
        {isNpc && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>GM-only, won't appear on player character list</span>}
      </div>

      {/* Progress */}
      <div className="cc-progress">{steps.map((_, i) => <div key={i} className={`cc-prog-dot ${i < step - 1 ? 'done' : i === step - 1 ? 'active' : ''}`} />)}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.25rem' }}>Step {step}: {steps[step - 1]}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {step === 1 ? 'Choose your faction.' : step === 2 ? 'Choose your sub-faction — grants a bonus trait.' : step === 3 ? 'Choose your school.' : step === advStep ? 'Choose advantages and disadvantages. They may grant or cost Character Points.' : step === traitsStep ? 'Spend your Character Points on traits and skills.' : step === spellStep ? `Select starting ${school === "Ra'Shari Diviner" ? 'Cokaloi (6)' : 'spells (3)'}.` : 'Name your character and set a login password.'}
      </div>

      {/* Step 1: Faction */}
      {step === 1 && (
        <div>
          {FACTIONS_LIST.map(f => {
            const fd = FACTIONS_DATA.find(x => x.name === f);
            const av = fd?.avatar ? FACTION_AVATARS[fd.avatar] : null;
            const isSelected = faction === f;
            return (
              <div key={f} className={`faction-card ${isSelected ? 'sel' : ''}`} onClick={() => setFaction(f)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  {/* Avatar icon block */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                    background: fd?.color ? fd.color + '33' : 'var(--bg-panel)',
                    border: `1px solid ${fd?.color || 'var(--border)'}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {av?.icon || <FacIcon name={f} size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{f}</span>
                      {fd?.page && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                          p.{fd.page}
                        </span>
                      )}
                      {isSelected && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 14, marginLeft: 'auto' }} />}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{fd?.tagline}</div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{ marginTop: '.6rem', paddingTop: '.6rem', borderTop: '1px solid rgba(200,150,42,.2)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: '.3rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Schools: </span>
                      {(FACTION_SCHOOLS[f] || []).join(', ')}
                    </div>
                    {av?.desc && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '.3rem' }}>
                        {av.desc}
                      </div>
                    )}
                    {fd?.page && (
                      <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginTop: '.2rem' }}>
                        📖 Read more in the rulebook — page {fd.page}
                        {fd.loreKey && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                            · see Lore Reference in NPC tab
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        </div>
      )}

      {/* Step 2: Sub-faction */}
      {step === 2 && (
        <div>
          {Object.entries(SUBFACTION_BONUSES[faction] || {}).map(([sf, trait]) => (
            <div key={sf} className={`faction-card ${subfaction === sf ? 'sel' : ''}`} onClick={() => setSubfaction(sf)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{sf}</span>
                <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>+1 {trait === 'Any' ? 'Any Trait' : trait}</span>
                {subfaction === sf && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 16 }} />}
              </div>
              {SUBFACTION_DESCRIPTIONS[sf] && (
                <div style={{ fontSize: 12, color: subfaction === sf ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: '.35rem', lineHeight: 1.5, opacity: subfaction === sf ? 1 : 0.7 }}>
                  {SUBFACTION_DESCRIPTIONS[sf]}
                </div>
              )}
              {subfaction === sf && trait === 'Any' && (
                <div style={{ marginTop: '.5rem' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: '.5rem' }}>Choose trait:</span>
                  <select value={eboniteAny} onChange={e => setEboniteAny(e.target.value)} style={{ fontSize: 13 }}>
                    {TRAITS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}

        </div>
      )}

      {/* Step 3: School */}
      {step === 3 && (
        <div>
          <div style={{ marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: showAllSchools ? 'var(--gold)' : 'var(--text-muted)' }}>
              <input type="checkbox" checked={showAllSchools} onChange={e => setShowAllSchools(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }} />
              Show all schools (GM permission / Different School advantage)
            </label>
          </div>
          {displayedSchools.map(s => {
            const sd = SCHOOL_DATA[s]; if (!sd) return null;
            return (
              <div key={s} className={`school-card ${school === s ? 'sel' : ''}`} onClick={() => { setSchool(s); initTraits(s, subfaction); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.25rem' }}>
                  <CharacterSilhouette school={s} size={24} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{s}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sd.type} · Integrity {sd.integrity} · +1 {sd.bonus_trait}</div>
                  </div>
                  {school === s && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 16, marginLeft: 'auto' }} />}
                </div>
                {school === s && (
                  <div style={{ marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid rgba(107,78,40,.3)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.25rem' }}>School Skills:</div>
                    <div style={{ fontSize: 12, color: 'var(--gold-light)' }}>{sd.skills.join(', ')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.25rem' }}>R1 Technique: <span style={{ color: 'var(--text-secondary)' }}>{sd.techniques?.[1] || '—'}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.25rem' }}>Equipment: <span style={{ color: 'var(--text-secondary)' }}>{sd.equipment?.join(', ')}</span></div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      )}

      {/* Step 4: Traits & Skills */}
      {step === traitsStep && (
        <div>
          <div className="cp-meter">
            <div><div className="cp-val" style={{ color: cpRemaining < 0 ? 'var(--red)' : 'var(--gold)' }}>{cpRemaining}</div><div className="cp-label">CP Remaining</div></div>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-mid)', margin: '0 .75rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: cpRemaining < 0 ? 'var(--red)' : 'var(--gold)', width: `${Math.max(0, Math.min(100, (cpAvailable - cpRemaining) / cpAvailable * 100))}%`, transition: 'width .2s' }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cpSpent}/{cpAvailable} spent{disCost > 0 ? ` (+${disCost} dis)` : ''}</div>
          </div>
          <div className="g2">
            <div className="card">
              <div className="card-title">Traits</div>
              {/* Ring labels before trait pairs */}
              {[...TRAITS, 'Void'].map((t, idx) => {
                const base = getBaseTraitValue(t), cur = traits[t] || 2;
                // Compute ring value for this trait
                const TRAIT_PAIRS = {
                  'Reflexes': ['Reflexes','Awareness'], 'Awareness': ['Reflexes','Awareness'],
                  'Stamina': ['Stamina','Willpower'], 'Willpower': ['Stamina','Willpower'],
                  'Agility': ['Agility','Intelligence'], 'Intelligence': ['Agility','Intelligence'],
                  'Strength': ['Strength','Perception'], 'Perception': ['Strength','Perception'],
                };
                const RING_NAME = { 'Reflexes':'Air','Awareness':'Air','Stamina':'Earth','Willpower':'Earth','Agility':'Fire','Intelligence':'Fire','Strength':'Water','Perception':'Water','Void':'Void' };
                const pair = TRAIT_PAIRS[t];
                const ringVal = pair ? Math.min(traits[pair[0]] || 2, traits[pair[1]] || 2) : (traits[t] || 2);
                const ringName = RING_NAME[t] || '';
                const isFirstOfPair = !pair || pair[0] === t || t === 'Void';
                return (
                  <div key={t}>
                    {isFirstOfPair && pair && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 0 0', marginTop: idx > 0 ? 4 : 0 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 32 }}>{ringName}</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)', minWidth: 22, textAlign: 'center' }}>{ringVal}</span>
                      </div>
                    )}
                    {t === 'Void' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 0 0', marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 32 }}>Void</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#a080d0', minWidth: 22, textAlign: 'center' }}>{traits.Void || 2}</span>
                      </div>
                    )}
                    <div className="trait-row" style={{ paddingLeft: 12 }}>
                      <span className="trait-label" style={{ color: cur > base ? 'var(--gold-light)' : 'var(--text-muted)' }}>{t}</span>
                      <button className="trait-btn" onClick={() => adjustTrait(t, -1)} disabled={cur <= base}>−</button>
                      <span className="trait-val">{cur}</span>
                      <button className="trait-btn" onClick={() => adjustTrait(t, 1)} disabled={cur >= base + 2}>+</button>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>base {base}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <div className="card-title">Skills</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {(SCHOOL_DATA[school]?.skills || []).map(s => (
                  <div key={s} className="skill-row">
                    <span className="skill-nm sc" style={{ flex: 1 }}>{s}</span>
                    <button className="trait-btn" onClick={() => adjustSkill(s, -1)} disabled={(skills[s] || 0) <= 1}>−</button>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold)', width: 20, textAlign: 'center' }}>{skills[s] || 0}</span>
                    <button className="trait-btn" onClick={() => adjustSkill(s, 1)} disabled={(skills[s] || 0) >= 7}>+</button>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '.4rem 0', borderTop: '1px solid var(--border)', marginTop: '.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Additional Skills <span style={{ fontStyle: 'italic' }}>(2 CP/rank)</span></span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select style={{ fontSize: 11, maxWidth: 150 }} value="" onChange={e => {
                      if (!e.target.value) return;
                      const val = e.target.value;
                      if (OPEN_SKILLS.some(p => val === p + ': [Custom]')) {
                        const prefix = val.replace(': [Custom]', ': ');
                        setCustomSkillInput(prefix);
                      } else if (!skills[val]) {
                        adjustSkill(val, 1);
                      }
                    }}>
                      <option value="">+ Add skill…</option>
                      {Object.entries(SKILL_CATEGORIES).map(([cat, catSkills]) => (
                        <optgroup key={cat} label={cat}>
                          {catSkills.filter(s => !(SCHOOL_DATA[school]?.skills || []).includes(s) && !s.endsWith('[Custom]')).map(s => (
                            <option key={s} value={s}>{s} {skills[s] ? `(${skills[s]})` : ''}</option>
                          ))}
                          {catSkills.some(s => s.endsWith('[Custom]')) && (
                            <option value={catSkills.find(s => s.endsWith('[Custom]'))}>{cat.split(' ')[0]}: [type your own…]</option>
                          )}
                        </optgroup>
                      ))}
                    </select>
                    {customSkillInput !== null && (
                      <form onSubmit={e => { e.preventDefault(); const n = customSkillInput.trim(); if (n && !n.endsWith(': ')) { adjustSkill(n, 1); setCustomSkillInput(null); } }} style={{ display: 'flex', gap: 2 }}>
                        <input autoFocus style={{ fontSize: 11, width: 110 }} value={customSkillInput} placeholder="Lore: Sewers"
                          onChange={e => setCustomSkillInput(e.target.value)} />
                        <button type="submit" className="btn btn-sm" style={{ fontSize: 10, padding: '0 4px' }}>Add</button>
                        <button type="button" className="btn btn-sm" style={{ fontSize: 10, padding: '0 4px' }} onClick={() => setCustomSkillInput(null)}>✕</button>
                      </form>
                    )}
                  </div>
                </div>
                {Object.keys(skills).filter(s => !(SCHOOL_DATA[school]?.skills || []).includes(s) && (skills[s] || 0) > 0).map(s => (
                  <div key={s} className="skill-row">
                    <span className="skill-nm" style={{ flex: 1 }}>{s}</span>
                    <button className="trait-btn" onClick={() => { if ((skills[s] || 0) <= 1) { adjustSkill(s, -1); } else adjustSkill(s, -1); }} disabled={!(skills[s]) || skills[s] <= 0}>−</button>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold)', width: 20, textAlign: 'center' }}>{skills[s] || 0}</span>
                    <button className="trait-btn" onClick={() => adjustSkill(s, 1)}>+</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between' }}>

          </div>
        </div>
      )}

      {/* Step 5: Spells (Sahir schools only) */}
      {spellStep && step === spellStep && (
        <div>
          <SpellConstellation
            character={{
              id: 'creation',
              school,
              school_rank: 1,
              spells: selectedSpells,
              spell_type_emphases: spellEmphasis ? [spellEmphasis] : [],
              spell_discipline_bonus: spellDisciplineBonus,
            }}
            mode="create"
            isGM={isGM}
            onUpdate={(_, updates) => {
              if (updates.spells) setSelectedSpells(updates.spells);
            }}
            spellEmphasis={spellEmphasis}
            setSpellEmphasis={setSpellEmphasis}
            spellDisciplineBonus={spellDisciplineBonus}
            setSpellDisciplineBonus={setSpellDisciplineBonus}
          />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: selectedSpells.length >= startingSpells ? 'var(--green)' : 'var(--text-muted)' }}>
              {selectedSpells.length}/{startingSpells} spells selected
            </div>
            <button className="btn btn-p"
              disabled={selectedSpells.length < startingSpells || (!IS_COKALOI_SCHOOL(school) && (!spellEmphasis || !spellDisciplineBonus))}
              onClick={() => setStep(traitsStep)}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 5/6: Advantages */}
      {step === advStep && (
        <div>
          <div className="cp-meter">
            <div><div className="cp-val">{cpRemaining}</div><div className="cp-label">CP Remaining</div></div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>Disad. CP gained: {Math.min(disTotal, 10)}/10{disTotal > 10 ? ` (${disTotal} total)` : ''}</div>
          </div>
          <div className="g2">
            <div className="card">
              <div className="card-title">Advantages</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {ADVANTAGES.map(a => {
                  const has = advantages.find(x => x.name === a.name);
                  return (
                    <div key={a.name} className="adv-item">
                      <span className="adv-cost">{has ? (has.cost || a.cost) : a.cost}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: has ? 'var(--gold)' : 'var(--text-primary)' }}>{a.name}{has && a.maxRank > 1 ? ` (Rank ${has.rank || 1})` : ''}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
                      </div>
                      {a.maxRank > 1 && has ? (
                        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          {Array.from({ length: a.maxRank }, (_, ri) => ri + 1).map(r => (
                            <button key={r} className="btn btn-sm" style={{ fontSize: 11, padding: '1px 6px', background: (has.rank||1) === r ? 'var(--gold)' : 'transparent', color: (has.rank||1) === r ? '#1a1208' : 'var(--text-muted)', borderColor: (has.rank||1) === r ? 'var(--gold)' : 'var(--border)' }}
                              onClick={() => setAdvantages(p => p.map(x => x.name === a.name ? { ...x, rank: r, cost: (a.costPerRank || a.cost) * r } : x))}>
                              {r}
                            </button>
                          ))}
                          <button className="btn btn-sm" style={{ color: 'var(--red)', marginLeft: 2 }} onClick={() => setAdvantages(p => p.filter(x => x.name !== a.name))}>✕</button>
                        </div>
                      ) : (
                      <button className="btn btn-sm" style={{ color: has ? 'var(--red)' : 'inherit' }}
                        onClick={() => has ? setAdvantages(p => p.filter(x => x.name !== a.name)) : (a.cost <= cpRemaining && setAdvantages(p => [...p, { ...a, rank: 1 }]))}>
                        {has ? 'Remove' : 'Add'}
                      </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <div className="card-title">Disadvantages <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(gain CP up to 10pts; can exceed 10 without further CP gain)</span></div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {DISADVANTAGES.map(d => {
                  const has = disadvantages.find(x => x.name === d.name);
                  return (
                    <div key={d.name} className="adv-item">
                      <span className="adv-cost neg">+{has ? (has.value || d.value) : d.value}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: has ? 'var(--red)' : 'var(--text-primary)' }}>{d.name}{has && d.maxRank > 1 ? ` (Rank ${has.rank || 1})` : ''}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.desc}</div>
                      </div>
                      {d.maxRank > 1 && has ? (
                        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          {Array.from({ length: d.maxRank }, (_, ri) => ri + 1).map(r => (
                            <button key={r} className="btn btn-sm" style={{ fontSize: 11, padding: '1px 6px', background: (has.rank||1) === r ? 'var(--red)' : 'transparent', color: (has.rank||1) === r ? '#fff' : 'var(--text-muted)', borderColor: (has.rank||1) === r ? 'var(--red)' : 'var(--border)' }}
                              onClick={() => setDisadvantages(p => p.map(x => x.name === d.name ? { ...x, rank: r, value: (d.costPerRank || d.value) * r } : x))}>
                              {r}
                            </button>
                          ))}
                          <button className="btn btn-sm" style={{ color: 'var(--gold)', marginLeft: 2 }} onClick={() => setDisadvantages(p => p.filter(x => x.name !== d.name))}>✕</button>
                        </div>
                      ) : (
                      <button className="btn btn-sm" style={{ color: has ? 'var(--gold)' : 'inherit' }}
                        onClick={() => has ? setDisadvantages(p => p.filter(x => x.name !== d.name)) : setDisadvantages(p => [...p, { ...d, rank: 1 }])}>
                        {has ? 'Remove' : 'Add'}
                      </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between' }}>

          </div>
        </div>
      )}

      {/* Identity step */}
      {step === identityStep && (
        <div>
          <div className="card">
            <div className="card-title">Character Identity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Character Name *</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter character name" style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Player Name</label><input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter player name" style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Portrait URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label><input type="text" value={portraitUrl} onChange={e => setPortraitUrl(e.target.value)} placeholder="https://..." style={{ width: '100%' }} /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {[['Faction', faction], ['Sub-faction', subfaction], ['School', school], ['Type', SCHOOL_DATA[school]?.type || '—'], ['Integrity', SCHOOL_DATA[school]?.integrity || '—'], ['Starting Copper', SCHOOL_DATA[school]?.starting_copper || 0]].map(([l, v]) => (
                <div key={l} className="srow"><span className="sl">{l}</span><span className="sv">{v}</span></div>
              ))}
            </div>
            <div style={{ marginTop: '.5rem', fontSize: 12, color: 'var(--text-muted)' }}>
              R1 Technique: <span style={{ color: 'var(--text-secondary)' }}>{SCHOOL_DATA[school]?.techniques?.[1] || '—'}</span>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between' }}>
            <button className="btn btn-p btn-lg" disabled={!name} onClick={handleComplete}><i className="ti ti-check" /> Create Character</button>
          </div>
        </div>
      )}
    </div>
  );
}


function NPCQuickCreate({ onComplete, onCancel }) {
  const [createMode, setCreateMode] = useState('npc'); // 'npc' | 'creature'
  const [faction, setFaction] = useState('');
  const [school, setSchool] = useState('');
  const [rank, setRank] = useState(1);
  const [name, setName] = useState('');
  const [gmNotes, setGmNotes] = useState('');
  const [visible, setVisible] = useState(false);
  const [creatureType, setCreatureType] = useState('');
  const [creatureId, setCreatureId] = useState('');

  const schools = faction ? (FACTION_SCHOOLS[faction] || []) : [];
  const sd = SCHOOL_DATA[school] || null;
  const maxRank = school ? (SAHIR_SCHOOLS_LIST.includes(school) ? 8 : 5) : 5;

  // Derive default name from school + rank
  const defaultName = school ? `${school} — Rank ${rank}` : '';
  const creatureChoices = creatureType
    ? CREATURES_LIBRARY.filter(c => (CREATURE_TYPE_CATEGORIES[creatureType] || []).includes(c.category))
    : [];
  const selectedCreature = creatureId ? CREATURES_LIBRARY.find(c => c.id === creatureId) : null;

  const [saveError, setSaveError] = useState('');

  const submit = async () => {
    const npcName = name.trim() || defaultName;
    if (!faction || !school || !npcName) return;
    setSaveError('');
    const isSahir = SAHIR_SCHOOLS_LIST.includes(school);
    const result = await onComplete({
      game_id: GAME_ID,
      faction,
      name: npcName,
      school,
      rank,
      is_visible_to_players: visible,
      gm_notes: gmNotes,
      player_notes: '',
      spells: isSahir ? generateNpcSpells(rank) : [],
    });
    if (!result) setSaveError("Couldn't save this NPC — check the browser console for the error, or that the npcs table matches expected columns.");
  };

  const submitCreature = async () => {
    if (!selectedCreature) return;
    setSaveError('');
    const npcName = name.trim() || selectedCreature.name;
    const result = await onComplete({
      game_id: GAME_ID,
      faction: selectedCreature.category,
      name: npcName,
      school: selectedCreature.category,
      rank: Math.max(1, Math.round(selectedCreature.difficulty || 1)),
      weapon: `${selectedCreature.name} (${selectedCreature.attack})`,
      weapon_dr: selectedCreature.damage,
      rings: { Air: selectedCreature.air, Earth: selectedCreature.earth, Fire: selectedCreature.fire, Water: selectedCreature.water },
      traits: selectedCreature.traits || {},
      is_visible_to_players: visible,
      gm_notes: gmNotes || selectedCreature.gm_notes || '',
      player_notes: '',
      notes: selectedCreature.specials?.join('; ') || '',
      from_bestiary: true,
      is_party_asset: false,
    });
    if (!result) setSaveError("Couldn't save this NPC — check the browser console for the error, or that the npcs table matches expected columns.");
  };

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.75rem' }}>
        Quick Add NPC to Log
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '.3rem', marginBottom: '1rem' }}>
        <button className={`btn btn-sm ${createMode === 'npc' ? 'btn-p' : ''}`}
          onClick={() => { setCreateMode('npc'); setCreatureType(''); setCreatureId(''); setName(''); }}>NPC (Faction/School)</button>
        <button className={`btn btn-sm ${createMode === 'creature' ? 'btn-p' : ''}`}
          onClick={() => { setCreateMode('creature'); setFaction(''); setSchool(''); setName(''); }}>Creature / Monster</button>
      </div>

      {createMode === 'creature' ? (
        <>
          {/* Type */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Type</div>
            <div style={{ display: 'flex', gap: '.3rem' }}>
              {['Creatures', 'Monsters'].map(t => (
                <button key={t} className={`btn btn-sm ${creatureType === t ? 'btn-p' : ''}`}
                  onClick={() => { setCreatureType(t); setCreatureId(''); setName(''); }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Creature */}
          {creatureType && (
            <div style={{ marginBottom: '.75rem' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Creature</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                {creatureChoices.map(c => (
                  <button key={c.id} className={`btn btn-sm ${creatureId === c.id ? 'btn-p' : ''}`}
                    onClick={() => { setCreatureId(c.id); setName(''); }}>{c.name}</button>
                ))}
              </div>
            </div>
          )}

          {selectedCreature && (
            <>
              <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 5, padding: '.6rem .75rem', marginBottom: '.75rem', fontSize: 13 }}>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '.3rem' }}>
                  <span><span style={{ color: 'var(--text-muted)' }}>Attack:</span> <span style={{ color: 'var(--gold)' }}>{selectedCreature.attack}</span></span>
                  <span><span style={{ color: 'var(--text-muted)' }}>Damage:</span> <span style={{ color: 'var(--gold)' }}>{selectedCreature.damage}</span></span>
                  <span><span style={{ color: 'var(--text-muted)' }}>TN:</span> <span style={{ color: 'var(--text-secondary)' }}>{selectedCreature.tn}</span></span>
                  <span><span style={{ color: 'var(--text-muted)' }}>W/lvl:</span> <span style={{ color: 'var(--text-secondary)' }}>{selectedCreature.wpl}</span></span>
                </div>
                {selectedCreature.specials?.length > 0 && (
                  <div style={{ color: 'var(--text-secondary)' }}>{selectedCreature.specials.join(' · ')}</div>
                )}
              </div>

              <div style={{ marginBottom: '.75rem' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Name (leave blank for generic)</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={selectedCreature.name} style={{ width: '100%' }} />
              </div>

              <div style={{ marginBottom: '.75rem' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>GM Notes (private)</div>
                <textarea rows={2} value={gmNotes} onChange={e => setGmNotes(e.target.value)}
                  placeholder="Motivations, secrets, plot hooks..." style={{ width: '100%', resize: 'vertical' }} />
              </div>

              <label className="chk-row" style={{ marginBottom: '1rem' }}>
                <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
                Reveal to players immediately
              </label>

              {saveError && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: '.75rem' }}>{saveError}</div>}

              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="btn btn-p" onClick={submitCreature}>Add to NPC Log</button>
                <button className="btn" onClick={onCancel}>Cancel</button>
              </div>
            </>
          )}

          {!creatureType && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1rem' }}>
              Select a type to begin.
            </div>
          )}
        </>
      ) : (
      <>
      {/* Faction */}
      <div style={{ marginBottom: '.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Faction</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
          {Object.keys(FACTION_SCHOOLS).map(f => (
            <button
              key={f}
              className={`btn btn-sm ${faction === f ? 'btn-p' : ''}`}
              onClick={() => { setFaction(f); setSchool(''); setRank(1); setName(''); }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* School */}
      {faction && (
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>School</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
            {schools.map(s => (
              <button
                key={s}
                className={`btn btn-sm ${school === s ? 'btn-p' : ''}`}
                onClick={() => { setSchool(s); setRank(1); setName(''); }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rank + stat preview */}
      {school && (
        <>
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Rank</div>
            <div style={{ display: 'flex', gap: '.3rem' }}>
              {Array.from({ length: maxRank }, (_, i) => i + 1).map(r => (
                <button key={r} className={`btn btn-sm ${rank === r ? 'btn-p' : ''}`} onClick={() => setRank(r)}>
                  R{r}
                </button>
              ))}
            </div>
          </div>

          {/* Stat preview */}
          {sd && (
            <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 5, padding: '.6rem .75rem', marginBottom: '.75rem', fontSize: 13 }}>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '.3rem' }}>
                <span><span style={{ color: 'var(--text-muted)' }}>Type:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.type}</span></span>
                <span><span style={{ color: 'var(--text-muted)' }}>Integrity:</span> <span style={{ color: 'var(--gold)' }}>{sd.integrity}</span></span>
                <span><span style={{ color: 'var(--text-muted)' }}>+1 Trait:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.bonus_trait}</span></span>
              </div>
              <div style={{ marginBottom: '.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rank {rank} Technique: </span>
                <span style={{ color: 'var(--gold-dim)' }}>{sd.techniques?.[rank] || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Skills: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{sd.skills?.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Name (leave blank for generic)</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={defaultName}
              style={{ width: '100%' }}
            />
          </div>

          {/* GM Notes */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>GM Notes (private)</div>
            <textarea
              rows={2}
              value={gmNotes}
              onChange={e => setGmNotes(e.target.value)}
              placeholder="Motivations, secrets, plot hooks..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <label className="chk-row" style={{ marginBottom: '1rem' }}>
            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
            Reveal to players immediately
          </label>

          {saveError && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: '.75rem' }}>{saveError}</div>}

          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-p" onClick={submit}>Add to NPC Log</button>
            <button className="btn" onClick={onCancel}>Cancel</button>
          </div>
        </>
      )}

      {!faction && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1rem' }}>
          Select a faction to begin.
        </div>
      )}
      </>
      )}
    </div>
  );
}

// Need GAME_ID for NPCQuickCreate (already imported above)
const SAHIR_SCHOOLS_LIST = SAHIR_SCHOOLS;

// Generate random rank-appropriate spells for a Sahir NPC
// 2 spells per rank, respecting level prerequisites within each type
function generateNpcSpells(rank) {
  const result = [];
  const totalSpells = rank * 2;
  // Flatten all spells with their type tracking
  const allTypes = SAHIR_DISCIPLINES.flatMap(d =>
    d.types.map(t => ({ disciplineId: d.id, typeId: t.id, spells: t.spells }))
  );
  // Track learned per type for prerequisite checking
  const learnedByType = {};
  let attempts = 0;
  while (result.length < totalSpells && attempts < 200) {
    attempts++;
    const typeGroup = allTypes[Math.floor(Math.random() * allTypes.length)];
    const key = typeGroup.typeId;
    const learned = learnedByType[key] || 0;
    // Can only learn level 1, or next level if previous known
    const nextLevel = learned + 1;
    if (nextLevel > 3) continue;
    const spell = typeGroup.spells.find(s => s.level === nextLevel);
    if (!spell || result.includes(spell.name)) continue;
    // Level cap: level 1 always ok, level 2 needs rank 2+, level 3 needs rank 4+
    if (nextLevel === 2 && rank < 2) continue;
    if (nextLevel === 3 && rank < 4) continue;
    result.push(spell.name);
    learnedByType[key] = nextLevel;
  }
  return result;
}
