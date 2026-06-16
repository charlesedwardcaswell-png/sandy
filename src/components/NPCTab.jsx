import React, { useState } from 'react';
import { FacIcon, Silhouette, Empty } from './UI';
import { SCHOOL_DATA, FACTIONS_DATA, NPC_BY_FACTION, FACTION_SCHOOLS } from '../data/constants';
import { repColor, repLabel, getArchetype, getSchoolMaxRank } from '../lib/utils';

// ── Faction lore blurbs ───────────────────────────────────────────────────────
const FACTION_LORE = {
  'City Guard': 'The most enduring institution of Medinaat al-Salaam. A volunteer organization — the only group legally allowed to carry swords. Many factions enroll their warriors specifically to gain that right. All Qadi were once guardsmen.',
  'Dahab': 'Eight houses — Asmari, Basiri, Enour, Haffit, Hazaad, Mendadi, Menjari, Rashid — dominate the city\'s economy. Behind the merchant facade lurks the Qolat conspiracy, pulling strings across all factions. House Hazaad held special dispensation to practice magic.',
  'Qabal': 'The organized magical tradition of the Burning Sands. They operate from a fortified Stronghold and are divided between Progressivists and Traditionalists. During the Immortal Caliph\'s reign they were persecuted; now they teach magic openly.',
  'Assassins': 'Formally the Order of the Mountain. Female membership dominates leadership; male Assassins bear the Curse of the Grey Crone. Not merely killers — they have a deep code and political ambitions. One of their own, Adira, served as Caliph for 20 years.',
  'Ashalan': 'Immortal, blue-skinned beings created by jinn at the dawn of the world. Their tattoos glow with the power of Shilah\'s sun — beautiful, but deadly in direct sunlight. Once 12 led them; three of the original twelve remain. Most were lost in the Awakening.',
  "Ra'Shari": 'Nomadic people organized into four Great Caravans: Mysticism, Entertainment, Commerce, Memory. Their unique Cokaloi magic is found nowhere else. Widely mistrusted for deals that don\'t quite deliver — but their knowledge of the sands is unparalleled.',
  'Senpet': 'A once-great empire now under Yodotai occupation. Their priests and warriors maintain traditions in exile. The Senpet religion demands ritual sacrifice to the Ten Thousand Gods. Their Sahir carry the most sophisticated ghul knowledge outside the Jackals.',
  'Yodotai': 'An unstoppable military empire from the west. They failed to take the Jewel directly but crushed the Senpet and absorbed their lands. Ethnically diverse — their empire absorbs conquered peoples. All Yodotai begin with +1 Strength.',
  'Ebonites': 'The Order of the Ebon Hand was founded to guard the Black Stone. When it shattered at the Awakening, the Ebonites entered the Caliph\'s service as an informal holy police force. Their code emphasizes Integrity — they gain combat bonuses against lower-Integrity opponents.',
  'Jackals': 'A criminal cult devoted to Kali-Ma, goddess of death and rebirth. Jani on the streets, Kabir diplomats, and feared Necromancers who command ghuls. Their Hall of Souls was burned at the Awakening. They are slowly rebuilding in the sewers.',
  'Merchants': 'Independent traders not affiliated with the Dahabi houses. No unified organization — weakness (no political protection) and strength (no Qolat obligation). Some rival minor Dahabi houses; others barely scrape by.',
  'Rogues / Foreigners': 'Medinaat al-Salaam draws people from across the known world. Scorpion Clan exiles, Ivory Kingdoms merchants, gaijin soldiers, desert bandits, escaped slaves. The city\'s cosmopolitan nature means foreigners are more tolerated here than almost anywhere.',
  'Monsters': 'Jinn — beings of smokeless fire, first children of the gods — can be summoned and bargained with. Ghuls haunt the sewers. Rocs circle overhead. And somewhere in the deep places beneath the city, things eat the ghuls. Not all are hostile.',
};

// ── Lore reference content ────────────────────────────────────────────────────
const LORE_SECTIONS = [
  {
    key: 'history', label: 'History & Setting',
    entries: [
      { key: 'wrath', label: 'The Day of Wrath', text: 'Before recorded history, the gods sent a great fire from the sky. It razed the desert, created the jinn, and reshaped the world. The Ashalan remember it. Everyone else has myths.' },
      { key: 'awakening', label: 'The Awakening', text: 'One hundred years ago, the Immortal Caliph — who had ruled for a thousand years — died. Factions that had hidden for centuries surfaced. The Ashalan emerged from underground. The Jackals\' Hall of Souls was burned. In a single generation, everything changed.' },
      { key: 'city', label: 'Medinaat al-Salaam Today', text: 'The Jewel of the Desert. A city of 200,000 souls at the crossroads of every trade route in the known world. The new Caliph rules with less iron. Factions jostle openly. The Qabal teaches magic. The City Guard keeps order — mostly.' },
    ],
  },
  {
    key: 'magic', label: 'Magic Systems',
    entries: [
      { key: 'sahir', label: 'Sahir Magic', text: 'Taught by the Qabal in five disciplines: summoning, divination, warding, transmutation, enchantment. Requires a Spellcraft roll and preparation. Hakhim\'s Seal forbids certain magics entirely — breaching it risks destruction. Only Sahir schools can learn it.' },
      { key: 'cokaloi', label: 'Cokaloi (Ra\'Shari)', text: 'The unique magic of Ra\'Shari Diviners. Three categories: Dawn (blessings, foresight), Dusk (illusion, misdirection), Night (healing, spirit-binding). Cannot be taught — only Ra\'Shari Diviners possess it.' },
      { key: 'jinn', label: 'Jinn', text: 'Beings of smokeless fire, created before humanity. Not demons — they have their own morality and politics. Qabal Summoners can bargain with them. A jinn who is insulted or poorly bound is extraordinarily dangerous.' },
    ],
  },
  {
    key: 'concepts', label: 'Key Concepts',
    entries: [
      { key: 'integrity', label: 'Integrity (not Honor)', text: 'The LBS equivalent of Honor is Integrity. Values are doubled from the original LBS book. High Integrity grants social advantages and activates school techniques — Ebonite Templars gain combat bonuses against lower-Integrity targets.' },
      { key: 'tahaddi', label: 'Tahaddi Dueling', text: 'The Burning Sands\' dueling tradition, fought with knives. Uses Iaijutsu duel rules but with Knives skill. Ra\'Shari Knife-Fighters are specifically trained for it. Legal and culturally respected.' },
      { key: 'crysteel', label: 'Crysteel & Crystal', text: 'Crystal-infused metal, forged only by the Ashalan. The only material that reliably harms spiritual beings. Blood-Sworn and Heart-Seekers carry crysteel weapons. The Ishanti Crystal is a legendary Ashalan artifact.' },
    ],
  },
];

// ── Add NPC Modal ─────────────────────────────────────────────────────────────
function AddNPCModal({ onAdd, onClose }) {
  const [mode, setMode] = useState('named');
  const [faction, setFaction] = useState(FACTIONS_DATA[0].name);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [gmNotes, setGmNotes] = useState('');
  const [visible, setVisible] = useState(false);
  // library mode
  const [libFaction, setLibFaction] = useState('');
  const [libSchool, setLibSchool] = useState('');
  const [libRank, setLibRank] = useState(1);
  const libSchools = libFaction ? (NPC_BY_FACTION[libFaction]?.schools || []) : [];
  const libMaxRank = libSchool ? getSchoolMaxRank(libSchool) : 5;

  const submit = () => {
    if (mode === 'named') {
      if (!name.trim()) return;
      onAdd({ faction, name: name.trim(), school: school.trim() || '—', rank: 1, is_visible_to_players: visible, gm_notes: gmNotes, player_notes: '' });
    } else {
      if (!libSchool) return;
      onAdd({ faction: libFaction, name: `${libSchool} — Rank ${libRank}`, school: libSchool, rank: libRank, is_visible_to_players: false, gm_notes: '', player_notes: '' });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title"><i className="ti ti-user-plus" /> Add NPC to Log</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
          <button className={`btn btn-sm ${mode === 'named' ? 'btn-p' : ''}`} onClick={() => setMode('named')}>Named NPC</button>
          <button className={`btn btn-sm ${mode === 'library' ? 'btn-p' : ''}`} onClick={() => setMode('library')}>From Library</button>
        </div>

        {mode === 'named' && (<>
          <div className="modal-section">
            <span className="modal-label">Faction</span>
            <select value={faction} onChange={e => setFaction(e.target.value)} style={{ width: '100%' }}>
              {FACTIONS_DATA.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          <div className="modal-section">
            <span className="modal-label">Name *</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="NPC name" style={{ width: '100%' }} autoFocus />
          </div>
          <div className="modal-section">
            <span className="modal-label">School / Role</span>
            <input value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g. Dahabi Enforcer — Rank 2" style={{ width: '100%' }} />
          </div>
          <div className="modal-section">
            <span className="modal-label">GM Notes (private)</span>
            <textarea rows={2} value={gmNotes} onChange={e => setGmNotes(e.target.value)} placeholder="Secrets, motivations, plot hooks..." style={{ width: '100%', resize: 'vertical' }} />
          </div>
          <label className="chk-row" style={{ marginBottom: '1rem' }}>
            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Reveal to players immediately
          </label>
        </>)}

        {mode === 'library' && (<>
          <div className="modal-section">
            <span className="modal-label">Faction</span>
            <select value={libFaction} onChange={e => { setLibFaction(e.target.value); setLibSchool(''); setLibRank(1); }} style={{ width: '100%' }}>
              <option value="">— Select faction —</option>
              {Object.keys(NPC_BY_FACTION).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          {libFaction && (
            <div className="modal-section">
              <span className="modal-label">School</span>
              <select value={libSchool} onChange={e => { setLibSchool(e.target.value); setLibRank(1); }} style={{ width: '100%' }}>
                <option value="">— Select school —</option>
                {libSchools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {libSchool && (
            <div className="modal-section">
              <span className="modal-label">Rank</span>
              <select value={libRank} onChange={e => setLibRank(+e.target.value)} style={{ width: '100%' }}>
                {Array.from({ length: libMaxRank }, (_, i) => <option key={i + 1} value={i + 1}>Rank {i + 1}</option>)}
              </select>
            </div>
          )}
        </>)}

        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
          <button className="btn btn-p" disabled={mode === 'named' ? !name.trim() : !libSchool} onClick={submit}>Add NPC</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── NPC Detail Modal ──────────────────────────────────────────────────────────
function NPCDetailModal({ npc, isGM, onSave, onClose }) {
  const [gmNotes, setGmNotes] = useState(npc.gm_notes || '');
  const [playerNotes, setPlayerNotes] = useState(npc.player_notes || '');
  const sd = SCHOOL_DATA[npc.school] || null;

  const save = () => {
    onSave({ gm_notes: gmNotes, player_notes: playerNotes });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
          <Silhouette type={getArchetype(npc.school)} size={24} />
          <div>
            <div className="modal-title" style={{ marginBottom: 0 }}>{npc.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{npc.school}{npc.rank ? ` — Rank ${npc.rank}` : ''}</div>
          </div>
        </div>

        {/* Stat block — GM only */}
        {isGM && sd && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>
              Stat Block <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(GM only)</span>
            </div>
            <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 4, padding: '.6rem', fontSize: 11, lineHeight: 1.6 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.type}</span> <span style={{ color: 'var(--text-muted)', marginLeft: '.75rem' }}>Integrity:</span> <span style={{ color: 'var(--gold)' }}>{sd.integrity}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Bonus Trait:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.bonus_trait}</span></div>
              <div style={{ marginTop: '.3rem' }}><span style={{ color: 'var(--text-muted)' }}>School Skills:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.skills?.join(', ')}</span></div>
              <div style={{ marginTop: '.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Techniques:</span>
                <div style={{ marginTop: 2 }}>
                  {Object.entries(sd.techniques || {}).map(([r, t]) => (
                    <div key={r} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--gold-dim)', minWidth: 20, display: 'inline-block' }}>R{r}:</span> {t}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '.3rem' }}><span style={{ color: 'var(--text-muted)' }}>Equipment:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.equipment?.join(', ')}</span></div>
            </div>
          </div>
        )}

        {/* GM Notes */}
        {isGM && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>
              GM Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(private)</span>
            </div>
            <textarea
              rows={3} value={gmNotes} onChange={e => setGmNotes(e.target.value)}
              placeholder="Secrets, motivations, relationships, plot hooks..."
              style={{ width: '100%', resize: 'vertical', background: 'rgba(200,150,42,.04)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 4, color: 'var(--text-secondary)', fontSize: 11, padding: '.4rem', fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
        )}

        {/* Player Notes */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>
            Party Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(shared)</span>
          </div>
          <textarea
            rows={3} value={playerNotes} onChange={e => setPlayerNotes(e.target.value)}
            placeholder="What the party has learned about this person..."
            style={{ width: '100%', resize: 'vertical', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 11, padding: '.4rem', fontFamily: 'inherit', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-p" onClick={save}>Save</button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Lore Reference Panel ──────────────────────────────────────────────────────
function LorePanel() {
  const [open, setOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState({});
  const [entryOpen, setEntryOpen] = useState({});

  if (!open) {
    return (
      <div style={{ marginTop: '1.5rem', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem .75rem', background: 'var(--bg-panel)', cursor: 'pointer' }} onClick={() => setOpen(true)}>
          <i className="ti ti-book-2" style={{ fontSize: 14, color: 'var(--gold-dim)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Lore Reference</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>Setting background — read-only</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>▼ Expand</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem .75rem', background: 'var(--bg-panel)', cursor: 'pointer' }} onClick={() => setOpen(false)}>
        <i className="ti ti-book-2" style={{ fontSize: 14, color: 'var(--gold-dim)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Lore Reference</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>▲ Collapse</span>
      </div>
      <div style={{ padding: '.75rem', background: 'var(--bg-dark)' }}>
        {LORE_SECTIONS.map(section => (
          <div key={section.key} style={{ marginBottom: '.6rem' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '.2rem 0', borderBottom: '1px solid rgba(107,78,40,.3)', marginBottom: '.3rem' }}
              onClick={() => setSectionOpen(o => ({ ...o, [section.key]: !o[section.key] }))}
            >
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{sectionOpen[section.key] ? '▼' : '▶'}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-dim)' }}>{section.label}</span>
            </div>
            {sectionOpen[section.key] && section.entries.map(e => (
              <div key={e.key} style={{ marginLeft: '.75rem', marginBottom: '.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setEntryOpen(o => ({ ...o, [e.key]: !o[e.key] }))}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{entryOpen[e.key] ? '▼' : '▶'}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{e.label}</span>
                </div>
                {entryOpen[e.key] && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '.4rem .5rem', background: 'rgba(107,78,40,.1)', borderRadius: 3, marginTop: '.2rem', marginLeft: '.75rem' }}>
                    {e.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NPCTab ────────────────────────────────────────────────────────────────────
export default function NPCTab({ isGM, isPCView, npcs, reps, onUpdateNPC, onUpdateRep, encounter, setEncounter, onViewCharacter }) {
  const [openFactions, setOpenFactions] = useState({});
  const [detailNPC, setDetailNPC] = useState(null);
  const encActive = encounter?.state === 'active';
  const gmView = isGM && !isPCView;
  const safeNPCs = (npcs || []).filter(Boolean);

  const toggleFaction = name => setOpenFactions(o => ({ ...o, [name]: !o[name] }));

  const handleAddToEncounter = npc => {
    if (!encActive || !setEncounter) return;
    const combatant = {
      id: 'npc_log_' + Date.now(),
      name: npc.name,
      type: 'npc',
      sub: npc.school,
      wound: 0,
      stance: 'Attack',
      init: Math.floor(Math.random() * 10) + 5,
      dr: '3k2',
      statusEffects: [],
      drawnWeapon: 'Longsword (3k2)',
      archetype: getArchetype(npc.school) || 'warrior',
      traits: { Reflexes: 2, Agility: 2 },
      rings: { Air: 2 },
      skills: SCHOOL_DATA[npc.school]?.skills?.map(s => ({ name: s, rank: npc.rank || 1 })) || [{ name: 'Swordsmanship', rank: 2 }],
    };
    setEncounter(e => ({ ...e, combatants: [...e.combatants, combatant].sort((a, b) => b.init - a.init) }));
  };

  return (
    <div>
      {detailNPC && (
        <NPCDetailModal
          npc={detailNPC}
          isGM={gmView}
          onSave={updates => onUpdateNPC(detailNPC.id, updates)}
          onClose={() => setDetailNPC(null)}
        />
      )}

      <div style={{ marginBottom: '.75rem' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>NPC Log</span>
        {gmView && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: '.75rem' }}>Add NPCs from the Character tab</span>}
      </div>

      {FACTIONS_DATA.map(fDef => {
        const facNPCs = safeNPCs.filter(n => n.faction === fDef.name);
        const visibleNPCs = gmView ? facNPCs : facNPCs.filter(n => n.is_visible_to_players);
        const rep = reps[fDef.name]?.reputation ?? 0;
        const isOpen = openFactions[fDef.name];

        return (
          <div key={fDef.name} className="fac-sec">
            {/* Header — clean, matches prototype */}
            <div className="fac-hdr" onClick={() => toggleFaction(fDef.name)}>
              <span className={`fac-chev ${isOpen ? 'open' : ''}`}>▶</span>
              <FacIcon name={fDef.name} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', minWidth: 80 }}>{fDef.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fDef.tagline}</span>
              {visibleNPCs.length > 0 && (
                <span style={{ fontSize: 9, background: 'rgba(200,150,42,.15)', color: 'var(--gold-dim)', border: '1px solid var(--gold-dim)', borderRadius: 10, padding: '1px 6px', flexShrink: 0 }}>
                  {visibleNPCs.length}
                </span>
              )}
            </div>

            {isOpen && (
              <div className="fac-body">
                {/* Rep controls — GM only, inside expanded body */}
                {gmView && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '.3rem 0 .5rem', borderBottom: '1px solid rgba(107,78,40,.2)', marginBottom: '.4rem' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Reputation:</span>
                    <button className="rep-btn" onClick={() => onUpdateRep(fDef.name, -1)}>−</button>
                    <span style={{ fontSize: 12, fontWeight: 600, color: repColor(rep), minWidth: 24, textAlign: 'center' }}>{rep > 0 ? '+' : ''}{rep}</span>
                    <button className="rep-btn" onClick={() => onUpdateRep(fDef.name, 1)}>+</button>
                    <span style={{ fontSize: 10, color: repColor(rep) }}>{repLabel(rep)}</span>
                  </div>
                )}

                {/* Faction lore */}
                {FACTION_LORE[fDef.name] && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, paddingBottom: '.5rem', borderBottom: '1px solid rgba(107,78,40,.15)', marginBottom: '.4rem' }}>
                    {FACTION_LORE[fDef.name]}
                  </div>
                )}

                {/* NPC list */}
                {visibleNPCs.length === 0
                  ? <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.2rem 0' }}>No NPCs logged.</div>
                  : visibleNPCs.map(n => (
                    <div key={n.id} className="npc-row" style={{ cursor: 'pointer' }} onClick={() => setDetailNPC(n)}>
                      {gmView && (
                        <input type="checkbox" checked={!!n.is_visible_to_players}
                          onClick={e => e.stopPropagation()}
                          onChange={e => onUpdateNPC(n.id, { is_visible_to_players: e.target.checked })}
                          style={{ accentColor: 'var(--gold)', flexShrink: 0 }} title="Show to players"
                        />
                      )}
                      <Silhouette type={getArchetype(n.school)} size={16} />
                      <span style={{ flex: 1, color: 'var(--text-primary)' }}>{n.name}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{n.school}{n.rank ? ` R${n.rank}` : ''}</span>
                      {n.player_notes && <span style={{ fontSize: 9, color: 'var(--gold-dim)' }} title="Has party notes">📝</span>}
                      {gmView && <span style={{ fontSize: 9, color: n.is_visible_to_players ? 'var(--green)' : 'var(--text-muted)' }}>{n.is_visible_to_players ? '●' : '○'}</span>}
                      {n.character_id && onViewCharacter && (
                        <button className="btn btn-sm" style={{ fontSize: 9, padding: '1px 5px' }}
                          onClick={e => { e.stopPropagation(); onViewCharacter(n.character_id); }}
                          title="View full character sheet">
                          <i className="ti ti-user" style={{ fontSize: 9 }} />
                        </button>
                      )}
                      {encActive && (
                        <button className="btn btn-sm" style={{ fontSize: 9, padding: '1px 5px' }}
                          onClick={e => { e.stopPropagation(); handleAddToEncounter(n); }}>+Enc</button>
                      )}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        );
      })}

      <LorePanel />
    </div>
  );
}
