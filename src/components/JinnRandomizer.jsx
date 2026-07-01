import React, { useState, useCallback } from 'react';
import { SAHIR_SCHOOLS, SAHIR_DISCIPLINES } from '../data/constants';

// ── Static Data ─────────────────────────────────────────────────────────────────

const TIERS = {
  Minor:  { label: 'Minor',  rankReq: 1, base: { air: 2, earth: null, fire: 2, water: 2, void: 2, attack: '4k2', damage: '4k2', tn: 10, wounds: 4 }, skills: { brawling: 2, commerce: 3 }, cpBase: 40, maxAdv: 1 },
  Medium: { label: 'Medium', rankReq: 3, base: { air: 3, earth: 3,    fire: 4, water: 3, void: 4, attack: '6k4', damage: '6k4', tn: 20, wounds: 6 }, skills: { brawling: 4, commerce: 4 }, cpBase: 60, maxAdv: 3 },
  Major:  { label: 'Major',  rankReq: 5, base: { air: null, earth: 4, fire: 6, water: 4, void: 6, attack: '8k6', damage: '8k6', tn: 30, wounds: 8 }, skills: { brawling: 6, commerce: 5 }, cpBase: 80, maxAdv: 5 },
};

const TYPES = {
  Mighty:  { desc: 'Warriors and bodyguards.',    traitRolls: [3,5,7], protRolls: [1,2,3], abilRolls: [1,2,3], combatRolls: [2,3,4] },
  Sly:     { desc: 'Spies and infiltrators.',     traitRolls: [3,5,7], protRolls: [0,1,2], abilRolls: [1,2,3], combatRolls: [3,4,5] },
  Hardy:   { desc: 'Hard to kill — tanks.',       traitRolls: [3,5,7], protRolls: [1,2,3], abilRolls: [0,1,2], combatRolls: [2,3,4] },
  Mystical:{ desc: 'Magic-heavy assistants.',     traitRolls: [3,5,9], protRolls: [0,1,2], abilRolls: [4,5,6], combatRolls: [0,1,2] },
  Labor:   { desc: 'Manual labor and crafting.',  traitRolls: [5,7,9], protRolls: [0,0,0], abilRolls: [1,2,3], combatRolls: [0,0,0] },
};

const TRAIT_TABLE = [null,'+1 Awareness','+1 Reflexes','+1 Willpower','+1 Stamina','+1 Intelligence','+1 Intelligence','+1 Agility','+1 Agility','+1 Perception',null];
const TRAIT_OPTIONS = ['+1 Awareness','+1 Reflexes','+1 Willpower','+1 Stamina','+1 Intelligence','+1 Agility','+1 Perception','+1 Strength'];

const PROTECTION_TABLE = [null,'Suffers no Wound Penalties','Cannot be affected by spells','Reduce Wounds from arrows by highest Ring','Reduce Wounds from swords by highest Ring','Reduce Wounds from heavy weapons by highest Ring','Reduce Wounds from knives by highest Ring','Reduce Wounds from polearms by highest Ring','+10 TN To Be Hit','Cannot be knocked down','Add highest Ring to Wounds at each Wound Rank'];
const PROTECTION_OPTIONS = PROTECTION_TABLE.filter(Boolean);

const ABILITY_TYPE_TABLE = [null,'Summoning','Summoning','Black Magic','Black Magic','Blessings & Curses','Blessings & Curses','Control','Control','Celestial','Celestial'];
const ABILITY_SUBTABLES = {
  'Summoning':        [null,'ML1 Primal Elements','ML1 Primal Elements','ML2 Primal Elements','ML3 Primal Elements','ML1 Implements','ML1 Implements','ML2 Implements','ML3 Implements','ML2 Jinn Summoning','ML2 Jinn Summoning'],
  'Black Magic':      [null,'ML1 Life','ML1 Life','ML2 Life','ML2 Life','ML1 Death','ML1 Death','ML2 Death','ML2 Death','ML3 Life or Death','ML3 Life or Death'],
  'Blessings & Curses':[null,'ML1 Blessings','ML2 Blessings','ML3 Blessings','ML1 Curses','ML2 Curses','ML3 Curses','ML1 Fortune Magic','ML2 Fortune Magic','ML3 Fortune Magic',null],
  'Control':          [null,'ML1 Influence','ML2 Influence','ML3 Influence','ML1 Illusions','ML2 Illusions','ML3 Illusions','ML1 Transformation','ML2 Transformation','ML3 Transformation',null],
  'Celestial':        [null,'ML1 Farsight','ML2 Farsight','ML3 Farsight','ML1 Astrology','ML2 Astrology','ML3 Astrology','ML1 Divination','ML2 Divination','ML3 Divination',null],
};
const ABILITY_OPTIONS = Object.entries(ABILITY_SUBTABLES).flatMap(([type, subs]) =>
  subs.filter(Boolean).map(s => `${type}: ${s}`)
);

const COMBAT_TABLE = [null,'Attack bonus = highest Ring','Attack bonus = highest Ring','Damage bonus = highest Ring','Damage bonus = highest Ring','+TN to Be Hit = highest Ring','+TN to Be Hit = highest Ring','Initiative bonus = highest Ring','Initiative bonus = highest Ring','Extra Wounds per Wound Rank = highest Ring','Extra Wounds per Wound Rank = highest Ring'];
const COMBAT_OPTIONS = COMBAT_TABLE.filter(Boolean).filter((v,i,a) => a.indexOf(v) === i);

const DURATION_BONUSES = [
  { label: 'A month of service', bonus: 0 },
  { label: 'A week of service',  bonus: 5 },
  { label: 'A day of service',   bonus: 10 },
  { label: 'A conversation',     bonus: 15 },
];

const NEGOTIATION_OUTCOMES = [
  { condition: 'Sahir wins or ties',          demand: 'Minor task — speak well of the Jinn or flatter its ego.' },
  { condition: 'Sahir loses by 1–5',          demand: 'Simple task requiring some effort — acquire a minor object or destroy something of small value.' },
  { condition: 'Sahir loses by 6–10',         demand: 'Involved or perilous task — defeat the Jinn in a contest or acquire a dangerous item.' },
  { condition: 'Sahir loses by 11–15',        demand: 'Difficult or costly task — build a work in the Jinn\'s honor or give up something valuable.' },
  { condition: 'Sahir loses by more than 15', demand: 'Monumental task — offer the sahir\'s firstborn or accept permanent amnesia.' },
];

const JINN_NAME_LISTS = {
  'Fire & Wrath':        ['Zaraq','Thurak','Vasheem','Khalbar','Nurraq','Sethaq','Farriq','Jalheem','Qahreem','Urrak','Datheel','Yabrus','Safirq','Hulmaan','Vazrak','Tambur','Kahzeel','Surrath','Fehnaq','Durraq','Zalbur','Makhzeel','Tharreq','Qubreem','Sanfeel','Vashtaq','Ruhraq','Dhaleem','Khalbur','Zarraq'],
  'Wind & Void':         ['Sifara','Huleem','Zahareel','Mawzeen','Thuheel','Kasiraq','Vatheem','Nurhaleem','Salahraq','Quweem','Fathiral','Mabzeen','Ulheem','Zaratheel','Kashiraq','Wahreem','Sabzeen','Dahreel','Khaheel','Rumahraq','Setheel','Maziraq','Fuheel','Talzeem','Qahareem','Warubzeel','Salbreen','Nuzharaq','Kutheel','Fahreem'],
  'Ancient & Primordial':['Qalanbuq','Thazuraal','Makhtureen','Dalbazeen','Surukaal','Fethaqur','Halbareen','Zaruthaal','Kanfureen','Malbuzeen','Tharukaal','Qasfureen','Valbazeen','Nuruthaal','Dabzureen','Kalbuteen','Fasmuraal','Huzrutheen','Yathuraal','Zarbuteen','Maqsuraal','Kathbureen','Dalzutheen','Surqureen','Fathbureen','Hazuthaal','Marbuzeen','Zarquteen','Haluthaal','Sabzureen'],
  'Serpentine & Subtle': ['Sazzireem','Vasleem','Zassuraq','Massireen','Hassiraq','Nassureem','Fassiraq','Kazsileem','Vassureen','Sazzirak','Hassuleem','Rassiraq','Massureen','Kassiraq','Nassuleem','Zassireem','Fassuleem','Hassireem','Kassuraq','Vassileem','Razzireen','Sazsurak','Massuleem','Zassuren','Hassibzeel','Nassibrak','Kassibzeen','Vassibrak','Fassibzeel','Sazzibreen'],
  'Cold & Moonlit':      ['Luhazeem','Nalbreen','Kuhazeen','Dalbreen','Malhazeem','Ralbreen','Zulhazeen','Falbreen','Kulhazeem','Yalbreen','Mulhazeem','Halbreen','Tulhazeem','Walbreen','Bulhazeen','Galbreen','Julhazeem','Valbreen','Xulhazeen','Qalbreen','Sulhazeem','Palbreen','Culhazeen','Nalbreen','Rulhazeem','Talbreen','Mulhazeen','Falbreen','Dulhazeen','Zalbreen'],
  'Named with Titles':   ['Vahruleem','Qazmuraal','Tharbureen','Nazzuraal','Sethbureen','Mazuraal','Fethruleen','Kalzuraal','Harbureen','Yazzuraal','Dethruleen','Mabzuraal','Rathbureen','Fazzuraal','Nethruleen','Salbzuraal','Gathruleen','Hazzuraal','Vethbureen','Qalbzuraal','Bathruleen','Razzuraal','Kethbureen','Falbzuraal','Nathruleen','Sazzuraal','Dethbureen','Halbzuraal','Matherleen','Zarrzuraal'],
  'Feminine/Flowing':    ['Sarihala','Vazhireel','Muthirala','Fazhireel','Kazirala','Nuthireel','Dazirala','Ruthireel','Sazirala','Futhireel','Mazirala','Kuthireel','Hazirala','Nuzireel','Tazirala','Vuthireel','Razirala','Suthireel','Fazirala','Muthirala','Kazireel','Nathirala','Duthireel','Rathirala','Suthireel','Fathirala','Muthireel','Kazirala','Nuthirala','Vathireel'],
};
const ALL_JINN_NAMES = Object.values(JINN_NAME_LISTS).flat();
const randomJinnName = () => ALL_JINN_NAMES[Math.floor(Math.random() * ALL_JINN_NAMES.length)];
const randomFromCategory = (cat) => { const l = JINN_NAME_LISTS[cat]; return l[Math.floor(Math.random() * l.length)]; };

// ── Dice helpers ────────────────────────────────────────────────────────────────

const d10 = () => Math.floor(Math.random() * 10) + 1;

function rollPool(rolled, kept) {
  // Roll NkK, explode 10s, return kept highest + total
  let dice = Array.from({ length: rolled }, () => {
    let v = d10();
    while (v === 10) v += d10();
    return v;
  });
  dice.sort((a, b) => b - a);
  const keptDice = dice.slice(0, kept);
  return { dice, keptDice, total: keptDice.reduce((s, d) => s + d, 0) };
}

function rollAll(tier, type, isMajor) {
  const typeData = TYPES[type];
  const tierIdx = tier === 'Minor' ? 0 : tier === 'Medium' ? 1 : 2;

  const traits = [];
  for (let i = 0; i < typeData.traitRolls[tierIdx]; i++) {
    let r; do { r = d10(); } while (r === 10 || !TRAIT_TABLE[r]);
    traits.push(TRAIT_TABLE[r]);
  }

  const protections = [];
  for (let i = 0; i < typeData.protRolls[tierIdx]; i++) {
    let r, tries = 0;
    do { r = d10(); tries++; } while (tries < 20 && (!PROTECTION_TABLE[r] || protections.includes(PROTECTION_TABLE[r])));
    if (PROTECTION_TABLE[r]) protections.push(PROTECTION_TABLE[r]);
  }

  const abilities = [];
  for (let i = 0; i < typeData.abilRolls[tierIdx]; i++) {
    let type2, tries = 0;
    do { type2 = ABILITY_TYPE_TABLE[d10()]; tries++; } while (!type2 && tries < 20);
    if (!type2) continue;
    const sub = ABILITY_SUBTABLES[type2];
    let entry, tries2 = 0;
    do { const r = d10(); entry = sub[r]; if (entry === 'ML2 Jinn Summoning' && !isMajor) entry = null; tries2++; } while (!entry && tries2 < 20);
    if (entry) abilities.push(`${type2}: ${entry}`);
  }

  const combat = [];
  for (let i = 0; i < typeData.combatRolls[tierIdx]; i++) {
    let r, tries = 0;
    do { r = d10(); tries++; } while (tries < 20 && (!COMBAT_TABLE[r] || combat.includes(COMBAT_TABLE[r])));
    if (COMBAT_TABLE[r]) combat.push(COMBAT_TABLE[r]);
  }

  return { traits, protections, abilities, combat };
}

// ── DicePicker ──────────────────────────────────────────────────────────────────

function DicePicker({ rolled, kept, bonus = 0, tn, onConfirm, allowVoid = false, currentVoid = 0 }) {
  const [useVoid, setUseVoid] = useState(false);
  const [raises, setRaises] = useState(0);
  const actualRolled = rolled + (useVoid ? 1 : 0);
  const actualKept   = kept   + (useVoid ? 1 : 0);
  const actualTN     = tn ? tn + raises * 5 : undefined;
  const [dice, setDice] = useState(() => Array.from({ length: actualRolled }, () => d10()));
  const [keptSet, setKeptSet] = useState(new Set());
  const [exploded, setExploded] = useState(new Set());
  const [rolled2, setRolled2] = useState(false);

  const rerollDice = () => {
    setDice(Array.from({ length: actualRolled }, () => d10()));
    setKeptSet(new Set());
    setExploded(new Set());
    setRolled2(true);
  };

  // Re-roll when void or raises change (pool changed)
  React.useEffect(() => {
    if (rolled2) rerollDice();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useVoid]);

  const toggle = (i) => {
    const d = dice[i];
    const n = new Set(keptSet);
    if (n.has(i)) { n.delete(i); setKeptSet(n); return; }
    if (n.size >= actualKept) return;
    if (d === 10 && !exploded.has(i)) {
      const b = d10();
      setDice(prev => { const nd = [...prev]; nd[i] = 10 + b; return nd; });
      setExploded(p => new Set([...p, i]));
    }
    n.add(i); setKeptSet(n);
  };

  const total = [...keptSet].reduce((s, i) => s + dice[i], 0) + bonus;
  const ready = keptSet.size === actualKept;
  const success = actualTN != null && total >= actualTN;

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Void + Raises controls */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {allowVoid && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: useVoid ? '#c0a0e0' : 'var(--text-muted)' }}>
            <input type="checkbox" checked={useVoid} onChange={e => setUseVoid(e.target.checked)}
              disabled={currentVoid < 1} style={{ accentColor: '#c0a0e0' }} />
            Void Point (+1k1) {currentVoid < 1 ? '— none left' : `(${currentVoid} remaining)`}
          </label>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Raises:</span>
          <button className="rep-btn" onClick={() => setRaises(r => Math.max(0, r-1))} disabled={raises === 0}>−</button>
          <span style={{ minWidth: 16, textAlign: 'center', color: raises > 0 ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700 }}>{raises}</span>
          <button className="rep-btn" onClick={() => setRaises(r => r+1)}>+</button>
          {raises > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>+{raises*5} TN</span>}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
        {actualRolled}k{actualKept}{bonus > 0 ? ` +${bonus}` : ''} — keep {actualKept} highest
        {actualTN ? <span style={{ marginLeft: 8, color: 'var(--gold-dim)' }}>TN {actualTN}</span> : ''}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.4rem' }}>Click to keep · click unkept 10 to explode</div>

      {!rolled2
        ? <button className="btn btn-p" onClick={rerollDice} style={{ marginBottom: '.6rem' }}>🎲 Roll {actualRolled}k{actualKept}</button>
        : <>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginBottom: '.6rem' }}>
            {dice.map((d, i) => {
              const isKept = keptSet.has(i);
              const isExp = d > 10;
              const isTen = d === 10 && !exploded.has(i);
              return (
                <div key={i} onClick={() => toggle(i)} style={{
                  minWidth: 38, height: 38, borderRadius: 6, cursor: 'pointer',
                  background: isKept ? (isExp ? '#7040a8' : 'var(--gold)') : 'var(--bg-panel)',
                  border: `2px solid ${isKept ? (isExp ? '#b080e8' : '#c8a040') : isTen ? '#c0a0e0' : 'var(--border)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 900, color: isKept ? '#1a1208' : isTen ? '#c0a0e0' : 'var(--text-primary)',
                }}>
                  <span>{d}</span>
                  {isExp && <span style={{ fontSize: 7 }}>💥</span>}
                  {isTen && !isKept && <span style={{ fontSize: 7, color: '#c0a0e0' }}>tap</span>}
                </div>
              );
            })}
          </div>
          {ready && (
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: '.4rem',
              color: success ? 'var(--green)' : actualTN ? '#c84030' : '#c8a040' }}>
              {total}{actualTN ? (success ? ` ✓ vs TN ${actualTN}` : ` ✗ vs TN ${actualTN}`) : ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <button className="btn btn-p" disabled={!ready} onClick={() => onConfirm(total, raises, useVoid)}>
              Confirm {ready ? total : '…'}
            </button>
            <button className="btn btn-sm" onClick={rerollDice}>Reroll</button>
          </div>
        </>
      }
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────

export default function JinnRandomizer({ onClose, onCreateNPC, onCreateCharacter, isGM, jinnArtUrl, onJinnSummoned, characters = [], myCharId, summoningBonus = 0 }) {
  // Step: 'roll' → 'tier' → 'type' → 'build' → 'summon' → 'negotiate'
  const [step, setStep]     = useState('roll');
  const [summoner, setSummoner]   = useState(myCharId || null);
  const [summonRoll, setSummonRoll] = useState(null);   // total from dice picker
  const [rolling, setRolling]     = useState(false);
  // chosenResults derived live from preCommits — no separate state needed
  const [tier, setTier]     = useState(null);
  const [type, setType]     = useState(null);
  const [built, setBuilt]   = useState(null);           // { traits, protections, abilities, combat }
  const [preCommits, setPreCommits] = useState({ traits: [], protections: [], abilities: [], combat: [] }); // pre-roll choices
  const [choices, setChoices] = useState([]);           // list of table-result replacements used
  const [name, setName]     = useState('');
  const [personality, setPersonality] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedJinn, setSavedJinn] = useState(null);     // the created jinn character

  // Negotiate
  const [duration, setDuration]   = useState(0);
  const [pcCommerce, setPcCommerce] = useState('');
  const [jinnRoll, setJinnRoll]   = useState(null);
  const [negResult, setNegResult] = useState(null);

  const summonerChar = characters.find(c => c.id === summoner);
  const summonerInsight = summonerChar?.school_rank || summonerChar?.insight_rank || 1;

  // Summoning roll pool: Air Ring + Sahir Rank (school_rank)
  const airRing = summonerChar?.air || summonerChar?.awareness || 2;
  const theologyRank = (summonerChar?.skills || []).find(s => s.name === 'Lore: Theology')?.rank || 1;
  const rollPool_n = airRing + theologyRank;
  const rollPool_k = airRing;

  // Raises declared by the player before rolling — each raise = 1 table choice
  const baseTN = 5;
  const [declaredRaises, setDeclaredRaises] = useState(0); // set when roll confirms
  const maxChoices = declaredRaises;
  const choicesUsed = choices.length;
  const choicesLeft = maxChoices - choicesUsed;

  const isSahirChar = (c) => {
    if (!c || c.is_npc) return false;
    if (SAHIR_SCHOOLS.includes(c.school)) return true;
    if ((c.advantages || []).some(a => (typeof a === 'string' ? a : a.name || '').toLowerCase().includes('smokeless'))) return true;
    return false;
  };
  const pcChars = characters.filter(isSahirChar);

  const buildJinn = useCallback((commits = {}) => {
    if (!tier || !type) return;
    const result = rollAll(tier, type, tier === 'Major');
    // Overlay precommitted choices onto random results
    const merged = { ...result };
    Object.entries(commits).forEach(([section, chosenVals]) => {
      if (!chosenVals?.length) return;
      // Replace the first N random results with chosen ones
      merged[section] = [
        ...chosenVals,
        ...(result[section] || []).slice(chosenVals.length),
      ];
    });
    setBuilt(merged);
    // Track choices for display separation
    const choicesList = [];
    Object.entries(commits).forEach(([section, chosenVals]) => {
      (chosenVals || []).forEach((val, idx) => choicesList.push({ section, idx, newVal: val }));
    });
    setChoices(choicesList);
    setName(randomJinnName());
  }, [tier, type]);

  const applyChoice = (section, idx, newVal) => {
    // Replace a rolled result with a chosen one (costs 1 choice)
    if (choicesLeft <= 0) return;
    setBuilt(prev => {
      const updated = { ...prev, [section]: [...prev[section]] };
      updated[section][idx] = newVal;
      return updated;
    });
    setChoices(prev => [...prev, { section, idx, newVal }]);
  };

  const handleSave = async () => {
    if (!built || saving) return;
    setSaving(true);
    const tierData = TIERS[tier];
    const ringBase = tier === 'Minor' ? 2 : tier === 'Medium' ? 3 : 4;

    // Apply trait bonuses
    const traitMap = { 'Awareness': 'awareness', 'Reflexes': 'reflexes', 'Willpower': 'willpower', 'Stamina': 'stamina', 'Intelligence': 'intelligence', 'Agility': 'agility', 'Strength': 'strength', 'Perception': 'perception' };
    const traitVals = { reflexes: ringBase, awareness: ringBase, stamina: ringBase, willpower: ringBase, agility: ringBase, intelligence: ringBase, strength: ringBase, perception: ringBase };
    built.traits.forEach(t => { const key = traitMap[t.replace('+1 ', '')]; if (key) traitVals[key] = (traitVals[key] || ringBase) + 1; });

    // ── Build techniques from Jinn abilities ──────────────────────────────────
    // All Jinn have Invincible and Shapeshifting. Abilities become named techniques.
    // Protections and combat bonuses are also recorded as techniques.
    // Techniques must be strings (rank → string) per character schema
    const techniques = {
      1: 'Invincible — No mortal weapon can permanently slay a Jinn. If reduced past Out, the Jinn returns to its realm and remembers.',
      2: 'Shapeshifting — May change its own shape at will as a Free Action.',
    };
    let techRank = 3;
    built.protections.forEach(p => { techniques[techRank++] = `Protection — ${p}`; });
    built.combat.forEach(c => { techniques[techRank++] = `Combat Bonus — ${c}`; });
    built.abilities.forEach(a => { techniques[techRank++] = a.split(': ')[1] || a; });
    if (personality) techniques[techRank++] = `Personality — ${personality}`;

    // ── Map ability strings to actual spells from SAHIR_DISCIPLINES ────────────
    // e.g. "Summoning: ML2 Primal Elements" → find spell name "Primal Elements 2"
    const abilityToSpells = (abilityStr) => {
      const m = abilityStr.match(/ML(\d)\s+(.+)/);
      if (!m) return [];
      const level = parseInt(m[1]);
      const typeName = m[2].trim();
      // Search SAHIR_DISCIPLINES for matching spells
      const results = [];
      if (true) {
        SAHIR_DISCIPLINES.forEach(disc => {
          disc.types.forEach(t => {
            t.spells.forEach(sp => {
              if (sp.level === level && sp.name.toLowerCase().includes(typeName.toLowerCase().split(' ')[0].toLowerCase())) {
                results.push({ name: sp.name, tn: sp.tn, discipline: disc.name, level: sp.level, desc: sp.desc });
              }
            });
          });
        });
      }
      return results;
    };

    const spells = built.abilities.flatMap(a => abilityToSpells(a));

    // ── Build skills: base Jinn skills + Spellcasting for magical Jinn ─────────
    const skills = [
      ...Object.entries(tierData.skills).map(([n, rank]) => ({ name: n.charAt(0).toUpperCase() + n.slice(1), rank, school: true })),
    ];
    if (spells.length > 0) {
      skills.push({ name: 'Spellcasting', rank: tier === 'Minor' ? 2 : tier === 'Medium' ? 4 : 6, school: true });
      skills.push({ name: 'Theology', rank: tier === 'Minor' ? 2 : tier === 'Medium' ? 3 : 4, school: true });
    }

    const jinnNotes = [
      `BASE: Attack ${tierData.base.attack}, Damage ${tierData.base.damage}, TN ${tierData.base.tn}, Wounds/rank ${tierData.base.wounds}`,
      built.protections.length ? `PROTECTIONS: ${built.protections.join('; ')}` : '',
      built.combat.length      ? `COMBAT BONUSES: ${built.combat.join('; ')}` : '',
    ].filter(Boolean).join('\n');

    const charData = {
      name: name || `${type} ${tier} Jinn`,
      player: 'Summoned Jinn',
      faction: 'Jinn',
      family: type,
      school: `${type} Jinn (${tier})`,
      school_rank: tier === 'Minor' ? 1 : tier === 'Medium' ? 2 : 3,
      insight_rank: tier === 'Minor' ? 1 : tier === 'Medium' ? 2 : 3,
      integrity: 4.0, reputation: 1, status: 1,
      air: ringBase, earth: ringBase, fire: ringBase, water: ringBase,
      void: tierData.base.void,
      ...traitVals,
      current_wounds: 0,
      max_wounds: (traitVals.stamina || ringBase) * tierData.base.wounds,
      current_void: tierData.base.void,
      current_stance: 'Attack',
      current_weapon: 'Unarmed (1k1)',
      skills,
      techniques,
      advantages: [],
      disadvantages: [],
      equipment: [],
      spells,
      spell_emphasis: spells.length > 0 ? built.abilities[0] || '' : '',
      xp_total: 0, xp_spent: 0,
      xp_log: [{ note: jinnNotes, ts: new Date().toISOString() }],
      copper: 0,
      pc_password: '',
      is_npc: true,
    };

    // Jinn go into the characters table (is_npc: true) — full stat block requires it
    const creator = onCreateCharacter || onCreateNPC;
    if (!creator) {
      console.error('JinnRandomizer: no creator function available');
      setSaving(false);
      alert('Error: could not save Jinn — no create function available.');
      return;
    }
    const result = await creator(charData);
    setSaving(false);
    if (!result) {
      alert('Error: Jinn could not be saved to the database. Check console for details.');
      return;
    }
    setSavedJinn(result);
    if (onJinnSummoned) onJinnSummoned(charData.name);
    setStep('negotiate');
  };

  const rollJinnCommerce = () => {
    if (!built) return;
    // Jinn Commerce: Commerce skill vs Awareness Ring (keep Awareness)
    const tierData = TIERS[tier];
    const commerce = tierData.skills.commerce || 3;
    const ringBase = tier === 'Minor' ? 2 : tier === 'Medium' ? 3 : 4;
    const { total } = rollPool(commerce + ringBase, ringBase);
    setJinnRoll(total);
  };

  const resolveNegotiation = () => {
    const pcTotal = Number(pcCommerce); // duration bonus already added at roll time
    const diff = pcTotal - (jinnRoll || 0);
    let outcome;
    if (diff >= 0)        outcome = NEGOTIATION_OUTCOMES[0];
    else if (diff >= -5)  outcome = NEGOTIATION_OUTCOMES[1];
    else if (diff >= -10) outcome = NEGOTIATION_OUTCOMES[2];
    else if (diff >= -15) outcome = NEGOTIATION_OUTCOMES[3];
    else                  outcome = NEGOTIATION_OUTCOMES[4];
    setNegResult({ pcTotal, jinnRoll, diff, outcome });
  };

  const STEPS = ['roll','tier','type','choose','build','summon','negotiate'];
  const stepIdx = STEPS.indexOf(step);
  const STEP_LABELS = { roll: 'Summoning Roll', tier: 'Jinn Tier', type: 'Jinn Type', choose: 'Make Choices', build: 'Review Jinn', summon: 'Summon', negotiate: 'Negotiate' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && step !== 'negotiate' && onClose()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.5rem', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>✦ Jinn Summoning</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{STEP_LABELS[step]}</div>
          </div>
          {step !== 'negotiate'
            ? <button className="btn btn-sm" onClick={onClose}>✕</button>
            : <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Roll to complete</span>
          }
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIdx ? 'var(--gold)' : 'var(--border)' }} title={STEP_LABELS[s]} />
          ))}
        </div>

        {/* ── STEP: ROLL ── */}
        {step === 'roll' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Cast <strong>Jinn Summoning 1</strong> on Hakhim's Seal.<br />
              Roll <strong>Air / Lore: Theology</strong> (keep Air). Base TN: <strong style={{ color: 'var(--gold)' }}>5</strong>.<br />
              Call Raises to choose Jinn attributes manually — one raise per choice.
            </div>

            {/* Summoner picker */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Who is summoning?</div>
              {isGM ? (
                <select value={summoner || ''} onChange={e => setSummoner(e.target.value || null)}
                  style={{ width: '100%', fontSize: 13 }}>
                  <option value="">— Select character —</option>
                  {pcChars.map(c => <option key={c.id} value={c.id}>{c.name} (Rank {c.school_rank || 1})</option>)}
                </select>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {summonerChar?.name || 'Your character'}
                </div>
              )}
            </div>

            {summoner && (
              <div style={{ marginBottom: '1rem', padding: '.5rem .75rem', background: 'rgba(200,150,42,.08)', borderRadius: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                Air Ring: <strong style={{ color: 'var(--gold)' }}>{airRing}</strong> · Lore: Theology: <strong style={{ color: 'var(--gold)' }}>{theologyRank}</strong> → Roll <strong>{rollPool_n}k{rollPool_k}</strong> vs TN {baseTN + Object.values(preCommits).reduce((s, arr) => s + (arr?.length || 0), 0) * 5}
              </div>
            )}

            {!rolling && summonRoll === null && (
              <button className="btn btn-p" disabled={!summoner} onClick={() => setRolling(true)}>
                🎲 Roll {rollPool_n}k{rollPool_k}
              </button>
            )}
            {rolling && summoner && (
              <DicePicker rolled={rollPool_n} kept={rollPool_k} tn={baseTN + Object.values(preCommits).reduce((s, arr) => s + (arr?.length || 0), 0) * 5}
                allowVoid={true}
                currentVoid={summonerChar?.current_void || 0}
                onConfirm={(total, raisesUsed, usedVoid) => {
                  setSummonRoll(total);
                  setDeclaredRaises(raisesUsed || 0);
                  setRolling(false);
                }} />
            )}
            {summonRoll !== null && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: summonRoll >= 10 ? 'var(--green)' : '#c84030' }}>{summonRoll}</div>
                {summonRoll >= 10 ? (
                  <div style={{ fontSize: 14, color: 'var(--green)', fontWeight: 600 }}>
                    ✓ Success — TN {baseTN + Object.values(preCommits).reduce((s, arr) => s + (arr?.length || 0), 0) * 5}
                    {declaredRaises > 0 && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>+{declaredRaises} raise{declaredRaises > 1 ? 's' : ''} → {declaredRaises} free table choice{declaredRaises > 1 ? 's' : ''}</span>}
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: '#c84030' }}>
                    ✗ Failed — Jinn does not appear. {isGM && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>GM may override for dramatic purposes.</span>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: '1rem' }}>
                  <button className="btn btn-sm" onClick={() => { setSummonRoll(null); setRolling(false); }}>Reroll</button>
                  {(summonRoll >= 10 || isGM) && (
                    <button className="btn btn-p" onClick={() => setStep('tier')}>Continue →</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: TIER ── */}
        {step === 'tier' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Choose the tier of Jinn to summon. Higher tiers require greater Insight Rank.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
              {Object.entries(TIERS).map(([key, t]) => {
                const locked = summonerInsight < t.rankReq; // always enforced — GM picks summoner who must meet rank
                return (
                  <button key={key} className={`btn ${tier === key ? 'btn-p' : ''}`}
                    disabled={locked}
                    onClick={() => !locked && setTier(key)}
                    style={{ opacity: locked ? 0.4 : 1, padding: '.75rem', flexDirection: 'column', gap: 4, display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 700 }}>{key}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rank {t.rankReq}+</span>
                    <span style={{ fontSize: 11 }}>TN to hit: {t.base.tn}</span>
                    {locked && <span style={{ fontSize: 10, color: '#c84030' }}>Requires Rank {t.rankReq}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-sm" onClick={() => setStep('roll')}>← Back</button>
              <button className="btn btn-p" disabled={!tier} onClick={() => setStep('type')}>Next →</button>
            </div>
          </div>
        )}

        {/* ── STEP: TYPE ── */}
        {step === 'type' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>Choose the nature of the Jinn.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
              {Object.entries(TYPES).map(([key, t]) => (
                <button key={key} className={`btn ${type === key ? 'btn-p' : ''}`}
                  onClick={() => setType(key)}
                  style={{ padding: '.6rem .75rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
                  <span style={{ fontWeight: 700, minWidth: 80 }}>{key}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.desc}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-sm" onClick={() => setStep('tier')}>← Back</button>
              <button className="btn btn-p" disabled={!type} onClick={() => { setPreCommits({ traits: [], protections: [], abilities: [], combat: [] }); setStep('choose'); }}>Make Choices →</button>
            </div>
          </div>
        )}

        {/* ── STEP: CHOOSE ── pre-commit selections before rolling */}
        {step === 'choose' && (() => {
          const typeData = type ? TYPES[type] : null;
          if (!typeData) return null;
          const tierIdx = tier === 'Minor' ? 0 : tier === 'Medium' ? 1 : 2;
          const counts = {
            traits:      typeData.traitRolls[tierIdx],
            protections: typeData.protRolls[tierIdx],
            abilities:   typeData.abilRolls[tierIdx],
            combat:      typeData.combatRolls[tierIdx],
          };
          const totalChosen = Object.values(preCommits).reduce((s, arr) => s + (arr?.length || 0), 0);
          const choicesRemaining = maxChoices - totalChosen;

          const sections = [
            { key: 'traits', label: 'Trait Bonuses', options: TRAIT_OPTIONS },
            { key: 'protections', label: 'Protections', options: PROTECTION_OPTIONS },
            { key: 'abilities', label: 'Magical Abilities', options: ABILITY_OPTIONS },
            { key: 'combat', label: 'Combat Bonuses', options: COMBAT_OPTIONS },
          ];

          return (
            <div>
              <div style={{ marginBottom: '1rem', padding: '.5rem .75rem', background: 'rgba(160,100,220,.08)', border: '1px solid rgba(160,100,220,.25)', borderRadius: 5, fontSize: 12 }}>
                You called <strong style={{ color: 'var(--gold)' }}>{maxChoices}</strong> raise{maxChoices !== 1 ? 's' : ''} — you may choose <strong style={{ color: '#c0a0e0' }}>{choicesRemaining}</strong> result{choicesRemaining !== 1 ? 's' : ''} from the tables below.
                The rest will be rolled randomly. Choose wisely — the random results won't be revealed until after you commit.
              </div>

              {sections.map(({ key, label, options }) => {
                const count = counts[key];
                if (!count) return null;
                const committed = preCommits[key] || [];
                return (
                  <div key={key} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                      {label} ({count} slot{count !== 1 ? 's' : ''}{committed.length ? ` — ${committed.length} chosen` : ' — all random'})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                      {committed.map((val, i) => (
                        <span key={i} onClick={() => setPreCommits(p => ({ ...p, [key]: (p[key] || []).filter((_, xi) => xi !== i) }))}
                          style={{ fontSize: 12, padding: '2px 8px', background: 'rgba(160,100,220,.2)', border: '1px solid rgba(160,100,220,.5)', borderRadius: 4, color: '#c0a0e0', cursor: 'pointer' }}
                          title="Click to remove">✦ {val} ×</span>
                      ))}
                      {committed.length < count && (choicesRemaining > 0 ? (
                        <select style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontFamily: 'inherit' }}
                          defaultValue="" onChange={e => { if (e.target.value) { setPreCommits(p => ({ ...p, [key]: [...(p[key] || []), e.target.value] })); e.target.value = ''; }}}>
                          <option value="">+ Choose a result…</option>
                          {options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{count - committed.length} will be rolled randomly</span>
                      ))}
                    </div>
                    {committed.length < count && committed.length === 0 && choicesRemaining <= 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>All {count} will be rolled randomly</div>
                    )}
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <button className="btn btn-sm" onClick={() => setStep('type')}>← Back</button>
                <button className="btn btn-p" onClick={() => { buildJinn(preCommits); setStep('build'); }}>
                  🎲 Roll Remaining & Build →
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── STEP: BUILD ── */}
        {step === 'build' && built && (
          <div>
            {maxChoices > 0 && (
              <div style={{ marginBottom: '1rem', padding: '.5rem .75rem', background: 'rgba(160,100,220,.1)', border: '1px solid rgba(160,100,220,.3)', borderRadius: 5, fontSize: 12 }}>
                <strong style={{ color: '#c0a0e0' }}>✦ {choicesLeft} free choice{choicesLeft !== 1 ? 's' : ''} remaining</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>Click any result to swap it for a chosen value (uses 1 choice)</span>
              </div>
            )}

            {/* Jinn name */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Jinn Name</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <select defaultValue="" onChange={e => { if (e.target.value) { setName(randomFromCategory(e.target.value)); } e.target.value = ''; }}
                  style={{ flex: 1, fontSize: 11, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3 }}>
                  <option value="">Roll by category…</option>
                  {Object.keys(JINN_NAME_LISTS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setName(randomJinnName())}>🎲 Any</button>
              </div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={`${type} ${tier} Jinn`} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>

            {/* Chosen results FIRST — then rolled results */}
            {(() => {
              const sections = [
                { label: 'Trait Bonuses', key: 'traits', options: TRAIT_OPTIONS },
                { label: 'Protections', key: 'protections', options: PROTECTION_OPTIONS },
                { label: 'Magical Abilities', key: 'abilities', options: ABILITY_OPTIONS },
                { label: 'Combat Bonuses', key: 'combat', options: COMBAT_OPTIONS },
              ];

              // Separate chosen vs rolled per section
              const chosenEntries = []; // { label, key, idx, val }
              const rolledEntries = []; // { label, key, idx, val }
              sections.forEach(({ label, key, options }) => {
                (built[key] || []).forEach((val, idx) => {
                  const wasChosen = choices.some(c => c.section === key && c.idx === idx);
                  if (wasChosen) chosenEntries.push({ label, key, idx, val, options });
                  else rolledEntries.push({ label, key, idx, val, options });
                });
              });

              const renderTag = (entry, isChosen) => (
                <div key={`${entry.key}-${entry.idx}`} style={{ position: 'relative' }}>
                  <span style={{ fontSize: 12, padding: '2px 8px',
                    background: isChosen ? 'rgba(160,100,220,.15)' : 'var(--bg-panel)',
                    border: `1px solid ${isChosen ? 'rgba(160,100,220,.5)' : 'var(--border)'}`,
                    borderRadius: 4, color: isChosen ? '#c0a0e0' : 'var(--text-primary)', display: 'block' }}>
                    {isChosen && <span style={{ fontSize: 9, marginRight: 3 }}>✦</span>}{entry.val}
                  </span>
                  {!isChosen && choicesLeft > 0 && (
                    <select style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                      onChange={e => { if (e.target.value) applyChoice(entry.key, entry.idx, e.target.value); e.target.value = ''; }}>
                      <option value="">Swap for chosen…</option>
                      {entry.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                </div>
              );

              return (
                <>
                  {/* CHOSEN results — shown first, purple */}
                  {chosenEntries.length > 0 && (
                    <div style={{ marginBottom: '.75rem', padding: '.5rem .75rem', background: 'rgba(160,100,220,.06)', border: '1px solid rgba(160,100,220,.2)', borderRadius: 5 }}>
                      <div style={{ fontSize: 11, color: '#c0a0e0', fontWeight: 600, marginBottom: 6 }}>✦ Your Chosen Results</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {chosenEntries.map(e => renderTag(e, true))}
                      </div>
                    </div>
                  )}
                  {/* ROLLED results — shown after */}
                  {rolledEntries.length > 0 && (
                    <div style={{ marginBottom: '.75rem' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                        Rolled Results
                        {choicesLeft > 0 && <span style={{ color: '#c0a0e0', fontWeight: 400, marginLeft: 6 }}>(click a result to swap it for a chosen value — {choicesLeft} remaining)</span>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {rolledEntries.map(e => renderTag(e, false))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div style={{ marginBottom: '.75rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Personality / Desires</div>
              <textarea rows={2} value={personality} onChange={e => setPersonality(e.target.value)}
                placeholder="Proud and suspicious. Values water. Has a taste for music…"
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontSize: 12 }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-sm" onClick={() => setStep('type')}>← Back</button>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" onClick={buildJinn}>🎲 Reroll All</button>
                <button className="btn btn-p" onClick={() => setStep('summon')}>Review →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: SUMMON ── */}
        {step === 'summon' && built && (
          <div>
            <div style={{ background: 'var(--bg-panel)', borderRadius: 6, padding: '.75rem', marginBottom: '1rem', fontSize: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gold)', marginBottom: 6 }}>{name || `${type} ${tier} Jinn`}</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{type} {tier} · Faction: Jinn</div>
              {built.traits.length > 0 && <div style={{ marginBottom: 3 }}><span style={{ color: 'var(--text-muted)' }}>Traits: </span>{built.traits.join(', ')}</div>}
              {built.protections.length > 0 && <div style={{ marginBottom: 3 }}><span style={{ color: 'var(--text-muted)' }}>Protections: </span>{built.protections.join('; ')}</div>}
              {built.abilities.length > 0 && <div style={{ marginBottom: 3 }}><span style={{ color: 'var(--text-muted)' }}>Abilities: </span>{built.abilities.join('; ')}</div>}
              {built.combat.length > 0 && <div><span style={{ color: 'var(--text-muted)' }}>Combat: </span>{built.combat.join('; ')}</div>}
            </div>
            {choicesUsed > 0 && (
              <div style={{ fontSize: 11, color: '#c0a0e0', marginBottom: '.75rem' }}>
                ✦ {choicesUsed} result{choicesUsed > 1 ? 's' : ''} chosen (summoning TN was {baseTN + choicesUsed * 5})
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-sm" onClick={() => setStep('build')}>← Back</button>
              <button className="btn btn-p" onClick={handleSave} disabled={saving || !built}>
                {saving ? 'Summoning…' : '✦ Summon the Jinn'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: NEGOTIATE ── */}
        {step === 'negotiate' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--green)' }}>✓ {savedJinn?.name || name} has been summoned.</strong><br />
              Now negotiate terms. Both roll <strong>Commerce / Awareness</strong>. The sahir may offer a shorter service period for a bonus to their roll.
            </div>
            {summoningBonus > 0 && (
              <div style={{ background: 'rgba(200,150,42,.1)', border: '1px solid rgba(200,150,42,.3)', borderRadius: 5, padding: '.4rem .75rem', marginBottom: '.75rem', fontSize: 12, color: 'var(--gold)' }}>
                <i className="ti ti-star" style={{ marginRight: 6 }} />
                Jinn Summoning 1 active — +{summoningBonus} rolled dice already added to your Commerce/Awareness roll below
              </div>
            )}

            {/* Duration bonus */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Service offered (bonus to sahir's roll)</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {DURATION_BONUSES.map((d, i) => (
                  <button key={i} className={`btn btn-sm ${duration === i ? 'btn-p' : ''}`}
                    onClick={() => { setDuration(i); setNegResult(null); }}>
                    {d.label}{d.bonus > 0 ? ` (+${d.bonus})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Jinn roll — automatic */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Jinn's Commerce roll ({TIERS[tier]?.skills?.commerce || 3} skill, rolled automatically)
              </div>
              {jinnRoll === null ? (
                <button className="btn btn-p" onClick={rollJinnCommerce}>🎲 Roll Jinn Commerce</button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#c84030' }}>{jinnRoll}</span>
                  <button className="btn btn-sm" onClick={() => { setJinnRoll(null); setNegResult(null); }}>Reroll</button>
                </div>
              )}
            </div>

            {/* PC Commerce/Awareness roll — full DicePicker */}
            {jinnRoll !== null && (() => {
              // Commerce skill + Awareness ring
              const commerceSkill = (summonerChar?.skills || []).find(s => s.name === 'Commerce')?.rank || 1;
              const awarenessRing = summonerChar?.awareness || 2;
              // Jinn Summoning 1 bonus: +Insight Rank unkept dice to Commerce/Awareness rolls
              const comRolled = commerceSkill + awarenessRing + (summoningBonus || 0);
              const comKept = awarenessRing;
              return (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Sahir's Commerce / Awareness roll — {comRolled}k{comKept}
                    {summoningBonus > 0 && <span style={{ color: 'var(--gold)', marginLeft: 6 }}>+{summoningBonus} rolled dice (Jinn Summoning 1)</span>}
                    {DURATION_BONUSES[duration].bonus > 0 && <span style={{ color: '#c0a0e0', marginLeft: 6 }}>+{DURATION_BONUSES[duration].bonus} duration bonus added to total</span>}
                  </div>
                  {pcCommerce === ''
                    ? <DicePicker
                        rolled={comRolled}
                        kept={comKept}
                        allowVoid={true}
                        currentVoid={summonerChar?.current_void || 0}
                        onConfirm={(total) => { setPcCommerce(String(total + DURATION_BONUSES[duration].bonus)); setNegResult(null); }}
                      />
                    : <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>{pcCommerce}</span>
                        <button className="btn btn-sm" onClick={() => { setPcCommerce(''); setNegResult(null); }}>Reroll</button>
                      </div>
                  }
                </div>
              );
            })()}

            {jinnRoll !== null && pcCommerce && (
              <button className="btn btn-p" onClick={resolveNegotiation} style={{ marginBottom: '1rem' }}>
                Resolve Negotiation
              </button>
            )}

            {negResult && (
              <div style={{ background: negResult.diff >= 0 ? 'rgba(74,138,64,.12)' : 'rgba(200,50,30,.12)', border: `1px solid ${negResult.diff >= 0 ? 'var(--green)' : '#c84030'}`, borderRadius: 6, padding: '.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: negResult.diff >= 0 ? 'var(--green)' : '#c84030', marginBottom: '.35rem' }}>
                  {negResult.diff >= 0 ? '✓ Sahir wins' : `✗ Jinn wins by ${Math.abs(negResult.diff)}`}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '.25rem' }}>
                  {negResult.outcome.condition}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  <strong>Demand:</strong> {negResult.outcome.demand}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button className="btn btn-p" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
