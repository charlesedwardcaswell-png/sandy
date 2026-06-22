import React, { useState, useCallback } from 'react';

// ── Static Data ────────────────────────────────────────────────────────────────

const TIERS = {
  Minor: {
    label: 'Minor', rankReq: '1–2',
    base: { air: 2, earth: null, fire: 2, water: 2, void: 2, attack: '4k2', damage: '4k2', tn: 10, wounds: 4 },
    skills: { brawling: 2, commerce: 3 }, cpBase: 40, maxAdv: 1,
  },
  Medium: {
    label: 'Medium', rankReq: '3–4',
    base: { air: 3, earth: 3, fire: 4, water: 3, void: 4, attack: '6k4', damage: '6k4', tn: 20, wounds: 6 },
    skills: { brawling: 4, commerce: 4 }, cpBase: 60, maxAdv: 3,
  },
  Major: {
    label: 'Major', rankReq: '5',
    base: { air: null, earth: 4, fire: 6, water: 4, void: 6, attack: '8k6', damage: '8k6', tn: 30, wounds: 8 },
    skills: { brawling: 6, commerce: 5, jiujitsu: 4 }, cpBase: 80, maxAdv: 5,
  },
};

const TYPES = {
  Mighty:  { desc: 'Warriors and bodyguards.', traitRolls: [3,5,7], protRolls: [1,2,3], abilRolls: [1,2,3], combatRolls: [2,3,4], laborCP: false },
  Sly:     { desc: 'Spies and infiltrators.', traitRolls: [3,5,7], protRolls: [0,1,2], abilRolls: [1,2,3], combatRolls: [3,4,5], laborCP: false },
  Hardy:   { desc: 'Tanks — hard to kill.', traitRolls: [3,5,7], protRolls: [1,2,3], abilRolls: [0,1,2], combatRolls: [2,3,4], laborCP: false },
  Mystical:{ desc: 'Magic-heavy assistants.', traitRolls: [3,5,9], protRolls: [0,1,2], abilRolls: [4,5,6], combatRolls: [0,1,2], laborCP: false },
  Labor:   { desc: 'Manual labor and crafting.', traitRolls: [5,7,9], protRolls: [0,0,0], abilRolls: [1,2,3], combatRolls: [0,0,0], laborCP: true },
};

const TRAIT_TABLE = [
  null, // 0-index placeholder
  '+1 Awareness',   // 1
  '+1 Reflexes',    // 2
  '+1 Willpower',   // 3
  '+1 Stamina',     // 4
  '+1 Intelligence',// 5
  '+1 Intelligence',// 6
  '+1 Agility',     // 7
  '+1 Agility',     // 8
  '+1 Perception',  // 9
  null,             // 10 → reroll
];

const PROTECTION_TABLE = [
  null,
  'Suffers no Wound Penalties',
  'Cannot be affected by spells',
  'Reduce Wounds from arrows by highest Ring',
  'Reduce Wounds from swords by highest Ring',
  'Reduce Wounds from heavy weapons by highest Ring',
  'Reduce Wounds from knives by highest Ring',
  'Reduce Wounds from polearms by highest Ring',
  '+10 TN To Be Hit',
  'Cannot be knocked down',
  'Add highest Ring to Wounds at each Wound Rank',
];

const ABILITY_TYPE_TABLE = [
  null,
  'Summoning', 'Summoning',
  'Black Magic', 'Black Magic',
  'Blessings & Curses', 'Blessings & Curses',
  'Control', 'Control',
  'Celestial', 'Celestial',
];

const ABILITY_SUBTABLES = {
  'Summoning': [
    null,
    'ML1 Primal Elements', 'ML1 Primal Elements',
    'ML2 Primal Elements',
    'ML3 Primal Elements',
    'ML1 Implements', 'ML1 Implements',
    'ML2 Implements',
    'ML3 Implements',
    'ML2 Jinn Summoning', 'ML2 Jinn Summoning', // rank 5 only
  ],
  'Black Magic': [
    null,
    'ML1 Life', 'ML1 Life',
    'ML2 Life', 'ML2 Life',
    'ML1 Death', 'ML1 Death',
    'ML2 Death', 'ML2 Death',
    'ML3 Life or Death', 'ML3 Life or Death',
  ],
  'Blessings & Curses': [
    null,
    'ML1 Blessings',
    'ML2 Blessings',
    'ML3 Blessings',
    'ML1 Curses',
    'ML2 Curses',
    'ML3 Curses',
    'ML1 Fortune Magic',
    'ML2 Fortune Magic',
    'ML3 Fortune Magic',
    null, // reroll
  ],
  'Control': [
    null,
    'ML1 Influence',
    'ML2 Influence',
    'ML3 Influence',
    'ML1 Illusions',
    'ML2 Illusions',
    'ML3 Illusions',
    'ML1 Transformation',
    'ML2 Transformation',
    'ML3 Transformation',
    null, // reroll
  ],
  'Celestial': [
    null,
    'ML1 Farsight',
    'ML2 Farsight',
    'ML3 Farsight',
    'ML1 Astrology',
    'ML2 Astrology',
    'ML3 Astrology',
    'ML1 Divination',
    'ML2 Divination',
    'ML3 Divination',
    null, // reroll
  ],
};

const COMBAT_TABLE = [
  null,
  'Attack bonus = highest Ring', 'Attack bonus = highest Ring',
  'Damage bonus = highest Ring', 'Damage bonus = highest Ring',
  '+TN to Be Hit = highest Ring', '+TN to Be Hit = highest Ring',
  'Initiative bonus = highest Ring', 'Initiative bonus = highest Ring',
  'Extra Wounds per Wound Rank = highest Ring', 'Extra Wounds per Wound Rank = highest Ring',
];

const NEGOTIATION_OUTCOMES = [
  { condition: 'Sahir wins or ties', demand: 'A minor task requiring only moments — speak well of the Jinn to other sahir, or flatter its ego.' },
  { condition: 'Sahir loses by 5 or less', demand: 'A simple task requiring some effort — acquire an object of mild worth to the Jinn, or destroy something valuable to the sahir.' },
  { condition: 'Sahir loses by 6–10', demand: 'An involved or perilous task — acquire a dangerous animal for the Jinn\'s culinary appetites, or defeat the Jinn in a wrestling match.' },
  { condition: 'Sahir loses by 11–15', demand: 'A difficult or costly task — allow the Jinn to take an expensive work of art, or build a work of art in the Jinn\'s honor.' },
  { condition: 'Sahir loses by more than 15', demand: 'A monumental task — offer the sahir\'s firstborn child to the Jinn, or accept permanent amnesia.' },
];

const DURATION_BONUSES = [
  { label: 'A month of service', bonus: 0 },
  { label: 'A week of service', bonus: 5 },
  { label: 'A day of service', bonus: 10 },
  { label: 'A conversation', bonus: 15 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const d10 = () => Math.floor(Math.random() * 10) + 1;

function rollTrait() {
  let r = d10();
  while (r === 10) r = d10(); // reroll 10s
  return TRAIT_TABLE[r];
}

function rollProtection(existing) {
  let r, attempts = 0;
  do { r = d10(); attempts++; } while ((r === 0 || PROTECTION_TABLE[r] === null || existing.includes(PROTECTION_TABLE[r])) && attempts < 20);
  return PROTECTION_TABLE[r] || PROTECTION_TABLE[1];
}

function rollAbility(isMajor) {
  let type, attempts = 0;
  do { type = ABILITY_TYPE_TABLE[d10()]; attempts++; } while (!type && attempts < 20);

  const subtable = ABILITY_SUBTABLES[type];
  let sub, subAttempts = 0;
  do {
    const r = d10();
    sub = subtable[r];
    // Block ML2 Jinn Summoning for non-Major
    if (sub === 'ML2 Jinn Summoning' && !isMajor) sub = null;
    subAttempts++;
  } while (!sub && subAttempts < 20);

  return `${type}: ${sub || subtable[1]}`;
}

function rollCombat(existing) {
  let r, attempts = 0;
  const EXTRA_WOUNDS = 'Extra Wounds per Wound Rank = highest Ring';
  do {
    r = d10();
    attempts++;
  } while ((!COMBAT_TABLE[r] || (COMBAT_TABLE[r] === EXTRA_WOUNDS && existing.includes(EXTRA_WOUNDS))) && attempts < 20);
  return COMBAT_TABLE[r] || COMBAT_TABLE[1];
}

function rollAll(tier, type) {
  const tierData = TIERS[tier];
  const typeData = TYPES[type];
  const tierIdx = tier === 'Minor' ? 0 : tier === 'Medium' ? 1 : 2;
  const isMajor = tier === 'Major';

  // Trait bonuses — applied to base traits
  const traits = {};
  const numTraits = typeData.traitRolls[tierIdx];
  for (let i = 0; i < numTraits; i++) {
    const bonus = rollTrait();
    if (bonus) {
      const key = bonus.replace('+1 ', '');
      traits[key] = (traits[key] || 0) + 1;
    }
  }

  // Protections
  const protections = [];
  const numProt = typeData.protRolls[tierIdx];
  for (let i = 0; i < numProt; i++) {
    protections.push(rollProtection(protections));
  }

  // Abilities
  const abilities = [];
  const numAbil = typeData.abilRolls[tierIdx];
  for (let i = 0; i < numAbil; i++) {
    abilities.push(rollAbility(isMajor));
  }

  // Combat bonuses
  const combat = [];
  const numCombat = typeData.combatRolls[tierIdx];
  for (let i = 0; i < numCombat; i++) {
    combat.push(rollCombat(combat));
  }

  // Skill CP
  const cp = typeData.laborCP
    ? [60, 80, 100][tierIdx]
    : tierData.cpBase;

  return { traits, protections, abilities, combat, cp };
}

function describeNegotiation(sahirRoll, jinnRoll) {
  const diff = sahirRoll - jinnRoll;
  if (diff >= 0) return NEGOTIATION_OUTCOMES[0];
  const loss = Math.abs(diff);
  if (loss <= 5) return NEGOTIATION_OUTCOMES[1];
  if (loss <= 10) return NEGOTIATION_OUTCOMES[2];
  if (loss <= 15) return NEGOTIATION_OUTCOMES[3];
  return NEGOTIATION_OUTCOMES[4];
}

// ── Component ──────────────────────────────────────────────────────────────────

// ── Jinn Name Lists ────────────────────────────────────────────────────────────
const JINN_NAME_LISTS = {
  'Fire & Wrath': ['Zaraq','Thurak','Vasheem','Khalbar','Nurraq','Sethaq','Farriq','Jalheem','Qahreem','Urrak','Datheel','Yabrus','Safirq','Hulmaan','Vazrak','Tambur','Kahzeel','Surrath','Fehnaq','Durraq','Zalbur','Makhzeel','Tharreq','Qubreem','Sanfeel','Vashtaq','Ruhraq','Dhaleem','Khalbur','Zarraq'],
  'Wind & Void': ['Sifara','Huleem','Zahareel','Mawzeen','Thuheel','Kasiraq','Vatheem','Nurhaleem','Salahraq','Quweem','Fathiral','Mabzeen','Ulheem','Zaratheel','Kashiraq','Wahreem','Sabzeen','Dahreel','Khaheel','Rumahraq','Setheel','Maziraq','Fuheel','Talzeem','Qahareem','Warubzeel','Salbreen','Nuzharaq','Kutheel','Fahreem'],
  'Ancient & Primordial': ['Qalanbuq','Thazuraal','Makhtureen','Dalbazeen','Surukaal','Fethaqur','Halbareen','Zaruthaal','Kanfureen','Malbuzeen','Tharukaal','Qasfureen','Valbazeen','Nuruthaal','Dabzureen','Kalbuteen','Fasmuraal','Huzrutheen','Yathuraal','Zarbuteen','Maqsuraal','Kathbureen','Dalzutheen','Surqureen','Fathbureen','Hazuthaal','Marbuzeen','Zarquteen','Haluthaal','Sabzureen'],
  'Serpentine & Subtle': ['Sazzireem','Vasleem','Zassuraq','Massireen','Hassiraq','Nassureem','Fassiraq','Kazsileem','Vassureen','Sazzirak','Hassuleem','Rassiraq','Massureen','Kassiraq','Nassuleem','Zassireem','Fassuleem','Hassireem','Kassuraq','Vassileem','Razzireen','Sazsurak','Massuleem','Zassuren','Hassibzeel','Nassibrak','Kassibzeen','Vassibrak','Fassibzeel','Sazzibreen'],
  'Cold & Moonlit': ['Luhazeem','Nalbreen','Kuhazeen','Dalbreen','Malhazeem','Ralbreen','Zulhazeen','Falbreen','Kulhazeem','Yalbreen','Mulhazeem','Halbreen','Tulhazeem','Walbreen','Bulhazeen','Galbreen','Julhazeem','Valbreen','Xulhazeen','Qalbreen','Sulhazeem','Palbreen','Culhazeen','Nalbreen','Rulhazeem','Talbreen','Mulhazeen','Falbreen','Dulhazeen','Zalbreen'],
  'Named with Titles': ['Vahruleem','Qazmuraal','Tharbureen','Nazzuraal','Sethbureen','Mazuraal','Fethruleen','Kalzuraal','Harbureen','Yazzuraal','Dethruleen','Mabzuraal','Rathbureen','Fazzuraal','Nethruleen','Salbzuraal','Gathruleen','Hazzuraal','Vethbureen','Qalbzuraal','Bathruleen','Razzuraal','Kethbureen','Falbzuraal','Nathruleen','Sazzuraal','Dethbureen','Halbzuraal','Matherleen','Zarrzuraal'],
  'Feminine/Flowing': ['Sarihala','Vazhireel','Muthirala','Fazhireel','Kazirala','Nuthireel','Dazirala','Ruthireel','Sazirala','Futhireel','Mazirala','Kuthireel','Hazirala','Nuzireel','Tazirala','Vuthireel','Razirala','Suthireel','Fazirala','Muthirala','Kazireel','Nathirala','Duthireel','Rathirala','Suthireel','Fathirala','Muthireel','Kazirala','Nuthirala','Vathireel'],
};

const ALL_JINN_NAMES = Object.values(JINN_NAME_LISTS).flat();

function randomJinnName() {
  return ALL_JINN_NAMES[Math.floor(Math.random() * ALL_JINN_NAMES.length)];
}

function randomJinnNameFromCategory(category) {
  const list = JINN_NAME_LISTS[category];
  if (!list) return randomJinnName();
  return list[Math.floor(Math.random() * list.length)];
}


export default function JinnRandomizer({ onClose, onCreateNPC, onCreateCharacter, isGM, summonsInsightRank = 1, jinnArtUrl, onJinnSummoned }) {
  const [step, setStep] = useState(1); // 1=tier, 2=type, 3=build, 4=negotiate, 5=finish
  const [tier, setTier] = useState(null);
  const [type, setType] = useState(null);
  const [rolled, setRolled] = useState(null); // { traits, protections, abilities, combat, cp }
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [gmNotes, setGmNotes] = useState('');
  const [duration, setDuration] = useState(0); // index into DURATION_BONUSES
  const [sahirRoll, setSahirRoll] = useState('');
  const [jinnRoll, setJinnRoll] = useState('');
  const [chosenResults, setChosenResults] = useState(0); // each +5 to summon TN
  const [summonRollResult, setSummonRollResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tierIdx = tier ? (tier === 'Minor' ? 0 : tier === 'Medium' ? 1 : 2) : 0;

  const handleRollAll = useCallback(() => {
    if (!tier || !type) return;
    setRolled(rollAll(tier, type));
  }, [tier, type]);

  const rerollSection = useCallback((section) => {
    if (!rolled || !tier || !type) return;
    const typeData = TYPES[type];
    const tierIdx2 = tier === 'Minor' ? 0 : tier === 'Medium' ? 1 : 2;
    const isMajor = tier === 'Major';
    const newRolled = { ...rolled };

    if (section === 'traits') {
      const traits = {};
      const num = typeData.traitRolls[tierIdx2];
      for (let i = 0; i < num; i++) {
        const bonus = rollTrait();
        if (bonus) { const k = bonus.replace('+1 ', ''); traits[k] = (traits[k] || 0) + 1; }
      }
      newRolled.traits = traits;
    } else if (section === 'protections') {
      const p = [];
      const num = typeData.protRolls[tierIdx2];
      for (let i = 0; i < num; i++) p.push(rollProtection(p));
      newRolled.protections = p;
    } else if (section === 'abilities') {
      const a = [];
      const num = typeData.abilRolls[tierIdx2];
      for (let i = 0; i < num; i++) a.push(rollAbility(isMajor));
      newRolled.abilities = a;
    } else if (section === 'combat') {
      const c = [];
      const num = typeData.combatRolls[tierIdx2];
      for (let i = 0; i < num; i++) c.push(rollCombat(c));
      newRolled.combat = c;
    }
    setRolled(newRolled);
  }, [rolled, tier, type]);

  const negotiationResult = (sahirRoll && jinnRoll)
    ? describeNegotiation(Number(sahirRoll) + DURATION_BONUSES[duration].bonus, Number(jinnRoll))
    : null;

  const handleSave = async () => {
    if (!rolled || saving) return;
    setSaving(true);

    const tierData = TIERS[tier];
    const traitSummary = Object.entries(rolled.traits).map(([k,v]) => `+${v} ${k}`).join(', ');
    const abilityList = rolled.abilities.join('; ');
    const combatList = rolled.combat.join('; ');
    const protList = rolled.protections.join('; ');

    const mechSummary = [
      `TIER: ${tier} | TYPE: ${type} Jinn`,
      `BASE: Attack ${tierData.base.attack}, Damage ${tierData.base.damage}, TN to Be Hit ${tierData.base.tn}, Wounds/level ${tierData.base.wounds}`,
      `TRAIT BONUSES: ${traitSummary || 'None'}`,
      `PROTECTIONS: ${protList || 'None'}`,
      `MAGICAL ABILITIES: ${abilityList || 'None'}`,
      `COMBAT BONUSES: ${combatList || 'None'}`,
      `SKILL CP TO SPEND: ${rolled.cp} (base skills: ${Object.entries(tierData.skills).map(([k,v]) => k+' '+v).join(', ')})`,
      negotiationResult ? `NEGOTIATION DEMAND: ${negotiationResult.demand}` : '',
    ].filter(Boolean).join('\n');

    // Build base trait values from tier, then apply rolled bonuses
    const baseTraits = {
      air: tierData.base.air || 2,
      earth: tierData.base.earth || 2,
      fire: tierData.base.fire || 2,
      water: tierData.base.water || 2,
      void: tierData.base.void || 2,
    };
    // Map trait bonus names to trait fields
    const traitMap = {
      'Awareness': 'awareness', 'Reflexes': 'reflexes',
      'Willpower': 'willpower', 'Stamina': 'stamina',
      'Intelligence': 'intelligence', 'Agility': 'agility',
      'Strength': 'strength', 'Perception': 'perception',
    };
    const traitVals = {
      reflexes: baseTraits.air, awareness: baseTraits.air,
      stamina: baseTraits.earth, willpower: baseTraits.earth,
      agility: baseTraits.fire, intelligence: baseTraits.fire,
      strength: baseTraits.water, perception: baseTraits.water,
    };
    Object.entries(rolled.traits).forEach(([trait, bonus]) => {
      const key = traitMap[trait];
      if (key) traitVals[key] = (traitVals[key] || 2) + bonus;
    });

    // Build skills from tier base + blank XP pool
    const baseSkills = Object.entries(tierData.skills).map(([name, rank]) => ({ name: name.charAt(0).toUpperCase()+name.slice(1), rank, school: true }));
    // Add ability-related skills
    rolled.abilities.forEach((a, i) => {
      baseSkills.push({ name: `Ability: ${a}`, rank: 1, school: true });
    });

    const charData = {
      name: name || `${type} ${tier} Jinn`,
      player: 'GM (Summoned)',
      faction: 'Jinn',
      family: type,
      school: `${type} Jinn (${tier})`,
      school_rank: tierIdx + 1,
      insight_rank: tierIdx + 1,
      integrity: 4.0,
      reputation: 0,
      status: 0,
      air: baseTraits.air, earth: baseTraits.earth,
      fire: baseTraits.fire, water: baseTraits.water, void: baseTraits.void,
      reflexes: traitVals.reflexes, awareness: traitVals.awareness,
      stamina: traitVals.stamina, willpower: traitVals.willpower,
      agility: traitVals.agility, intelligence: traitVals.intelligence,
      strength: traitVals.strength, perception: traitVals.perception,
      current_wounds: 0,
      max_wounds: (traitVals.stamina || 2) * tierData.base.wounds,
      current_void: baseTraits.void,
      current_stance: 'Attack',
      current_weapon: 'Unarmed (1k1)',
      skills: baseSkills,
      spells: rolled.abilities.map((a, i) => ({ name: a, level: i + 1 })),
      advantages: [],
      disadvantages: [],
      equipment: [],
      techniques: { 1: `${type} Jinn abilities: ${abilityList || 'none'}` },
      gm_notes: mechSummary + (gmNotes ? '\n\n' + gmNotes : ''),
      player_notes: personality,
      is_npc: false, // full character sheet so GM can spend XP
    };

    const creator = onCreateCharacter || onCreateNPC;
    await creator(charData);
    setSaving(false);
    setSaved(true);
    // Fire summoning flash for all players, then close the modal
    if (onJinnSummoned) onJinnSummoned(charData.name);
    // Close after a short delay so the flash starts before the modal disappears
    setTimeout(() => { if (onClose) onClose(); }, 400);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9000, padding: '1rem',
  };
  const panelStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '1.5rem', width: '100%', maxWidth: 640,
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 8px 40px rgba(0,0,0,.6)',
  };

  const stepLabel = ['', 'Choose Tier', 'Choose Type', 'Build the Jinn', 'Negotiate', 'Summon'][step];

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
              ✦ Jinn Summoning
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Step {step} of 5 — {stepLabel}
            </div>
          </div>
          <button className="btn btn-sm" onClick={onClose} style={{ fontSize: 16, padding: '2px 8px' }}>✕</button>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '1.5rem' }}>
          {[1,2,3,4,5].map(s => (
            <div key={s} style={{
              width: 28, height: 4, borderRadius: 2,
              background: s <= step ? 'var(--gold)' : 'var(--border)',
              flex: 1,
            }} />
          ))}
        </div>

        {/* ── STEP 1: Tier ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              The tier of jinn you can summon depends on your Insight Rank. The GM can override this for dramatic purposes.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              {Object.entries(TIERS).map(([key, t]) => {
                const locked = !isGM && (
                  (key === 'Medium' && summonsInsightRank < 3) ||
                  (key === 'Major' && summonsInsightRank < 5)
                );
                return (
                  <button key={key}
                    className={`btn ${tier === key ? 'btn-p' : ''}`}
                    onClick={() => !locked && setTier(key)}
                    style={{
                      opacity: locked ? 0.4 : 1,
                      cursor: locked ? 'not-allowed' : 'pointer',
                      padding: '0.75rem',
                      display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start',
                    }}>
                    <span style={{ fontWeight: 700 }}>{key}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ranks {t.rankReq}</span>
                    <span style={{ fontSize: 11 }}>Attack {t.base.attack}</span>
                    <span style={{ fontSize: 11 }}>TN {t.base.tn}</span>
                    {locked && <span style={{ fontSize: 10, color: 'var(--red)' }}>Rank too low</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-p" disabled={!tier} onClick={() => setStep(2)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Type ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              The type of jinn determines what it excels at and how many rolls you make on each table.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(TYPES).map(([key, t]) => {
                const tierData = TIERS[tier];
                const idx = tier === 'Minor' ? 0 : tier === 'Medium' ? 1 : 2;
                return (
                  <button key={key}
                    className={`btn ${type === key ? 'btn-p' : ''}`}
                    onClick={() => setType(key)}
                    style={{ display: 'grid', gridTemplateColumns: '90px 1fr repeat(4,60px)', gap: 8, padding: '0.6rem 0.75rem', textAlign: 'left', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{key}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</span>
                    <span style={{ fontSize: 10 }} title="Trait rolls">🎲 {t.traitRolls[idx]} traits</span>
                    <span style={{ fontSize: 10 }} title="Protections">🛡 {t.protRolls[idx]} prot</span>
                    <span style={{ fontSize: 10 }} title="Abilities">✨ {t.abilRolls[idx]} abil</span>
                    <span style={{ fontSize: 10 }} title="Combat bonuses">⚔ {t.combatRolls[idx]} cbt</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
              <button className="btn btn-sm" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-p" disabled={!type} onClick={() => { handleRollAll(); setStep(3); }}>
                Roll All & Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Build ── */}
        {step === 3 && rolled && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Results for <strong style={{ color: 'var(--gold)' }}>{type} {tier} Jinn</strong>. Reroll any section if you don't like the result.
              </div>
              <button className="btn btn-sm btn-p" onClick={handleRollAll} title="Reroll everything">
                🎲 Reroll All
              </button>
            </div>

            {/* Base Stats */}
            <StatBlock tier={tier} type={type} />

            {/* Trait Bonuses */}
            <Section label="Trait Bonuses" onReroll={() => rerollSection('traits')}>
              {Object.entries(rolled.traits).length > 0
                ? Object.entries(rolled.traits).map(([trait, val]) => (
                    <Tag key={trait} color="var(--gold-dim)">+{val} {trait}</Tag>
                  ))
                : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>None</span>
              }
            </Section>

            {/* Protections */}
            {rolled.protections.length > 0 && (
              <Section label="Protections" onReroll={() => rerollSection('protections')}>
                {rolled.protections.map((p, i) => <Tag key={i} color="#3a4a2a">{p}</Tag>)}
              </Section>
            )}

            {/* Abilities */}
            {rolled.abilities.length > 0 && (
              <Section label="Magical Abilities" onReroll={() => rerollSection('abilities')}>
                {rolled.abilities.map((a, i) => <Tag key={i} color="#2a3a4a">{a}</Tag>)}
              </Section>
            )}

            {/* Combat Bonuses */}
            {rolled.combat.length > 0 && (
              <Section label="Combat Bonuses" onReroll={() => rerollSection('combat')}>
                {rolled.combat.map((c, i) => <Tag key={i} color="#3a2a2a">{c}</Tag>)}
              </Section>
            )}

            {/* Skills */}
            <div style={{ background: 'var(--bg-panel)', borderRadius: 6, padding: '0.6rem 0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Skills</div>
              <div style={{ fontSize: 12 }}>
                Base skills from template + <strong>{rolled.cp} CP</strong> to spend freely (max 1–{TIERS[tier].maxAdv} Advantages).
                <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                  {Object.entries(TIERS[tier].skills).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)} ${v}`).join(' · ')}
                </div>
              </div>
            </div>

            {/* Personality / name */}
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Jinn Name</label>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <select defaultValue="" onChange={e => { if (e.target.value) setName(randomJinnNameFromCategory(e.target.value)); e.target.value = ''; }}
                  style={{ flex: 1, fontSize: 11, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3 }}>
                  <option value="">Roll by category…</option>
                  {Object.keys(JINN_NAME_LISTS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button className="btn btn-sm" style={{ fontSize: 11, flexShrink: 0 }}
                  onClick={() => setName(randomJinnName())} title="Random name from any category">
                  🎲 Any
                </button>
              </div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={`${type} ${tier} Jinn`}
                style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Personality / Desires (visible to players)</label>
              <textarea value={personality} onChange={e => setPersonality(e.target.value)}
                placeholder="Proud and suspicious. Values water above all else. Has a taste for fine music..."
                style={{ width: '100%', boxSizing: 'border-box', minHeight: 60, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>GM Notes (private)</label>
              <textarea value={gmNotes} onChange={e => setGmNotes(e.target.value)}
                placeholder="True name, hidden agenda, relationship to Kaleel's Legion..."
                style={{ width: '100%', boxSizing: 'border-box', minHeight: 50, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button className="btn btn-sm" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-p" onClick={() => setStep(4)}>Proceed to Negotiation →</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Negotiation ── */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              The Jinn is present within Hakhim's Seal. Now negotiate the terms of service. Both sides make a <strong>Contested Commerce roll</strong>. The sahir's roll gains a bonus based on the term requested.
            </div>

            {/* Duration selector */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Desired Duration of Service</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {DURATION_BONUSES.map((d, i) => (
                  <button key={i}
                    className={`btn btn-sm ${duration === i ? 'btn-p' : ''}`}
                    onClick={() => setDuration(i)}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.75rem' }}>
                    <span>{d.label}</span>
                    <span style={{ fontSize: 11, color: duration === i ? 'white' : 'var(--gold)' }}>
                      +{d.bonus} to Commerce roll
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Roll inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  Sahir's Commerce Roll Total
                  <span style={{ color: 'var(--gold)', marginLeft: 4 }}>
                    (before +{DURATION_BONUSES[duration].bonus} bonus)
                  </span>
                </label>
                <input type="number" value={sahirRoll} onChange={e => setSahirRoll(e.target.value)}
                  placeholder="e.g. 22" style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  Jinn's Commerce Roll Total
                </label>
                <input type="number" value={jinnRoll} onChange={e => setJinnRoll(e.target.value)}
                  placeholder="e.g. 18" style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Result */}
            {negotiationResult && (
              <div style={{
                background: 'var(--bg-panel)', border: '1px solid var(--gold-dim)',
                borderRadius: 6, padding: '0.75rem', marginBottom: '1rem',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {negotiationResult.condition} — the Jinn demands:
                </div>
                <div style={{ fontSize: 13, color: 'var(--gold)' }}>
                  {negotiationResult.demand}
                </div>
                {Number(sahirRoll) + DURATION_BONUSES[duration].bonus >= Number(jinnRoll) && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    The Jinn is satisfied with minimal tribute. The Seal holds.
                  </div>
                )}
              </div>
            )}

            {/* Reference table */}
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 6 }}>
                Full Negotiation Outcome Table
              </summary>
              <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {NEGOTIATION_OUTCOMES.map((o, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{o.condition}</span>
                    <span>{o.demand}</span>
                  </div>
                ))}
              </div>
            </details>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-sm" onClick={() => setStep(3)}>← Back</button>
              <button className="btn btn-p" onClick={() => setStep(5)}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Summon ── */}
        {step === 5 && (
          <div>
            {/* Summoning Roll */}
            <div style={{ background: 'rgba(160,100,220,.08)', border: '1px solid rgba(160,100,220,.3)', borderRadius: 6, padding: '.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#c0a0e0', marginBottom: '.5rem' }}>
                ✦ Summoning Roll — Air / Sahir Rank
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.5rem', lineHeight: 1.5 }}>
                Cast Jinn Summoning 1 (Spellcasting roll). Base TN: <strong style={{ color: 'var(--gold)' }}>10</strong>.
                Each table result the summoner <em>chose</em> instead of rolling adds <strong style={{ color: '#c0a0e0' }}>+5 TN</strong>.
              </div>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chosen results:</span>
                  <button className="rep-btn" onClick={() => setChosenResults(r => Math.max(0, r-1))}>−</button>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#c0a0e0', minWidth: 20, textAlign: 'center' }}>{chosenResults}</span>
                  <button className="rep-btn" onClick={() => setChosenResults(r => r+1)}>+</button>
                </div>
                <div style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>
                  TN {10 + chosenResults * 5}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Roll result:</span>
                  <input type="number" min={1} value={summonRollResult ?? ''} onChange={e => setSummonRollResult(e.target.value ? +e.target.value : null)}
                    style={{ width: 60, fontSize: 13, textAlign: 'center' }} placeholder="—" />
                </div>
                {summonRollResult != null && (
                  <div style={{ fontSize: 13, fontWeight: 700,
                    color: summonRollResult >= (10 + chosenResults * 5) ? 'var(--green)' : '#c84030' }}>
                    {summonRollResult >= (10 + chosenResults * 5) ? '✓ Success' : '✗ Failed'}
                    {summonRollResult >= (10 + chosenResults * 5) &&
                      Math.floor((summonRollResult - (10 + chosenResults * 5)) / 5) > 0 &&
                      <span style={{ color: 'var(--gold-dim)', fontSize: 11, marginLeft: 4 }}>
                        +{Math.floor((summonRollResult - (10 + chosenResults * 5)) / 5)} Raise{Math.floor((summonRollResult - (10 + chosenResults * 5)) / 5) > 1 ? 's' : ''}
                      </span>
                    }
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Review the Jinn below and summon it — creates a Quick NPC in the Character tab.
            </div>

            {/* Summary */}
            <div style={{ background: 'var(--bg-panel)', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', fontSize: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)', marginBottom: 6 }}>
                {name || `${type} ${tier} Jinn`}
              </div>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{type} {tier} · Faction: Jinn</div>
              {rolled && (
                <>
                  {Object.entries(rolled.traits).length > 0 && (
                    <div style={{ marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Traits: </span>
                      {Object.entries(rolled.traits).map(([k,v]) => `+${v} ${k}`).join(', ')}
                    </div>
                  )}
                  {rolled.protections.length > 0 && (
                    <div style={{ marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Protections: </span>
                      {rolled.protections.join('; ')}
                    </div>
                  )}
                  {rolled.abilities.length > 0 && (
                    <div style={{ marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Abilities: </span>
                      {rolled.abilities.join('; ')}
                    </div>
                  )}
                  {rolled.combat.length > 0 && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Combat: </span>
                      {rolled.combat.join('; ')}
                    </div>
                  )}
                </>
              )}
              {negotiationResult && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', color: 'var(--gold)' }}>
                  Demands: {negotiationResult.demand}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <button className="btn btn-sm" onClick={() => setStep(4)}>← Back</button>
              {saved
                ? <div style={{ fontSize: 13, color: 'var(--green)', alignSelf: 'center' }}>
                    ✓ Jinn summoned — find it in Quick NPCs
                  </div>
                : <button className="btn btn-p" onClick={handleSave} disabled={saving || !rolled}>
                    {saving ? 'Summoning…' : '✦ Summon the Jinn'}
                  </button>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ label, onReroll, children }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
        {onReroll && (
          <button className="btn btn-sm" onClick={onReroll} style={{ fontSize: 10, padding: '1px 6px' }}>
            🎲 Reroll
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{
      background: color || 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 4, padding: '2px 8px',
      fontSize: 12, color: 'var(--text-primary)',
    }}>
      {children}
    </span>
  );
}

function StatBlock({ tier, type }) {
  const t = TIERS[tier];
  const rings = [
    t.base.air != null && `Air ${t.base.air}`,
    t.base.earth != null && `Earth ${t.base.earth}`,
    t.base.fire != null && `Fire ${t.base.fire}`,
    t.base.water != null && `Water ${t.base.water}`,
    `Void ${t.base.void}`,
  ].filter(Boolean);

  return (
    <div style={{
      background: 'var(--bg-panel)', borderRadius: 6,
      padding: '0.6rem 0.75rem', marginBottom: '0.75rem',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem',
      fontSize: 12,
    }}>
      <div style={{ gridColumn: '1/-1', color: 'var(--text-muted)', fontSize: 11, marginBottom: 3 }}>
        Base Statistics — {type} {tier} Jinn
      </div>
      <div><span style={{ color: 'var(--text-muted)' }}>Rings: </span>{rings.join(' · ')}</div>
      <div><span style={{ color: 'var(--text-muted)' }}>Wounds/level: </span>{t.base.wounds}</div>
      <div><span style={{ color: 'var(--text-muted)' }}>Attack: </span>{t.base.attack}</div>
      <div><span style={{ color: 'var(--text-muted)' }}>Damage: </span>{t.base.damage}</div>
      <div><span style={{ color: 'var(--text-muted)' }}>TN to Be Hit: </span>{t.base.tn}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Invincible · Shapeshifting</div>
    </div>
  );
}
