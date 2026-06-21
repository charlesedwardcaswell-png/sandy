import { WOUND_RANKS, WOUND_COLORS, SCHOOL_DATA, SAHIR_SCHOOLS, WEAPONS_LIST } from '../data/constants';

// ── Wound helpers ─────────────────────────────────────────────────────────────
export function getWoundRank(current, max) {
  const thresholds = [max, 2, 3, 4, 4, 4, 4, 4];
  let cumulative = 0;
  for (let i = 0; i < thresholds.length; i++) {
    cumulative += thresholds[i];
    if (current <= cumulative) return i;
  }
  return 7;
}

export function woundColor(rank) { return WOUND_COLORS[rank] || WOUND_COLORS[0]; }
export function woundLabel(rank) { return WOUND_RANKS[rank] || 'Healthy'; }

// ── Dice ──────────────────────────────────────────────────────────────────────
export function rollN(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10) + 1);
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// ── Reputation ────────────────────────────────────────────────────────────────
export function repColor(r) {
  return r > 0 ? '#4a8a40' : r < 0 ? '#c84030' : '#6b5840';
}

export function repLabel(r) {
  const labels = { 3:'Allied', 2:'Friendly', 1:'Warm', 0:'Neutral', '-1':'Cool', '-2':'Hostile', '-3':'Enemy' };
  return labels[r] || 'Neutral';
}

// ── School helpers ────────────────────────────────────────────────────────────
export function isSahirSchool(school) {
  return SAHIR_SCHOOLS.includes(school);
}

export function getSchoolMaxRank(school) {
  return isSahirSchool(school) ? 8 : 5;
}

export function getArchetype(school) {
  const d = SCHOOL_DATA[school];
  if (!d) return 'warrior';
  if (d.type === 'Sahir') return 'sahir';
  if (d.type === 'Diplomat') return 'courtier';
  if (d.type === 'Ninja') return 'warrior';
  return 'warrior';
}

// ── Map helpers ───────────────────────────────────────────────────────────────
export function getPinColor(type) {
  const PIN_COLORS = {
    palace: '#9060c8', noble: '#c8962a', faction: '#4a8a40',
    merchant: '#4a7a8a', outer: '#a8947a', streets: '#c8b060',
    sewers: '#7a6a3a', desert: '#c8a050', indoors: '#5a8a9a',
    encounter: '#c84030',
  };
  return PIN_COLORS[type] || '#c8962a';
}

// ── Difficulty ────────────────────────────────────────────────────────────────
export function calcDifficulty(npcs, partyRank = 2) {
  const total = npcs.reduce((s, n) => s + (n.rank || 1), 0);
  const threshold = partyRank * 2;
  if (total <= threshold) return 'Easy';
  if (total <= threshold * 2) return 'Moderate';
  if (total <= threshold * 3) return 'Hard';
  return 'Deadly';
}

export function diffColor(d) {
  return d === 'Easy' ? '#4a8a40' : d === 'Moderate' ? '#8a8a30' : d === 'Hard' ? '#c86030' : '#c84030';
}

// ── Character building ────────────────────────────────────────────────────────
export function buildCharacterFromForm(form) {
  const sd = SCHOOL_DATA[form.school] || {};
  const traits = form.traits || {};
  const skills = form.skills || {};

  const insight = Object.values(traits).reduce((s, v) => s + v * 10, 0) +
    Object.values(skills).reduce((s, v) => s + v, 0);

  const insightRank = insight < 150 ? 1 : insight < 175 ? 2 : insight < 200 ? 3 : insight < 225 ? 4 : 5;

  const equipment = (sd.equipment || []).map(e => {
    const w = WEAPONS_LIST.find(w => w.name === e);
    return { name: e, dr: w?.dr || '', skill: w?.skill || '', equipped: true, inUse: e === sd.equipment?.[0] };
  });

  const firstWeapon = sd.equipment?.find(e => WEAPONS_LIST.find(w => w.name === e)?.dr);
  const firstWeaponData = WEAPONS_LIST.find(w => w.name === firstWeapon);

  return {
    game_id: null, // set by caller
    name: form.name || 'Unnamed',
    player: form.playerName || 'Player',
    faction: form.faction,
    family: form.subfaction,
    school: form.school,
    school_rank: 1,
    insight_rank: insightRank,
    integrity: sd.integrity || 3.5,
    reputation: 1,
    status: 1,
    air: Math.min(traits.Reflexes || 2, traits.Awareness || 2),
    earth: Math.min(traits.Stamina || 2, traits.Willpower || 2),
    fire: Math.min(traits.Agility || 2, traits.Intelligence || 2),
    water: Math.min(traits.Strength || 2, traits.Perception || 2),
    void: traits.Void || 2,
    reflexes: traits.Reflexes || 2,
    awareness: traits.Awareness || 2,
    stamina: traits.Stamina || 2,
    willpower: traits.Willpower || 2,
    agility: traits.Agility || 2,
    intelligence: traits.Intelligence || 2,
    strength: traits.Strength || 2,
    perception: traits.Perception || 2,
    current_wounds: 0,
    max_wounds: (traits.Stamina || 2) * 5,
    current_void: traits.Void || 2,
    current_stance: 'Attack',
    current_weapon: firstWeapon ? `${firstWeapon} (${firstWeaponData?.dr || '1k1'})` : 'Unarmed (1k1)',
    skills: Object.entries(skills).map(([name, rank]) => ({ name, rank, school: (sd.skills || []).includes(name) })),
    techniques: sd.techniques || {},
    advantages: form.advantages || [],
    disadvantages: form.disadvantages || [],
    equipment,
    spells: form.selectedSpells || [],
    spell_emphasis: form.spellEmphasis || '',
    xp_total: 0,
    xp_spent: 0,
    xp_log: [],
    copper: sd.starting_copper || 3,
    pc_password: form.pcPassword || '',
  };
}

// ── Date formatting ───────────────────────────────────────────────────────────
export function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Insight & XP ─────────────────────────────────────────────────────────────
// Insight = (sum of all ring values) × 10 + total skill ranks
export function calcInsight(char) {
  const rings = (char.air||2) + (char.earth||2) + (char.fire||2) + (char.water||2) + (char.void||2);
  const skills = (char.skills||[]).reduce((s, sk) => s + (sk.rank||0), 0);
  return rings * 10 + skills;
}

export function insightRankFor(insight) {
  if (insight >= 225) return 5;
  if (insight >= 200) return 4;
  if (insight >= 175) return 3;
  if (insight >= 150) return 2;
  return 1;
}

// XP to raise to the next rank (L5R 4th Ed standard costs)
export function traitXpCost(currentRank) { return (currentRank + 1) * 4; }
export function skillXpCost(currentRank)  { return (currentRank + 1) * 2; }

// Rank threshold to cross for the NEXT rank (null if already max)
export const RANK_THRESHOLDS = [0, 150, 175, 200, 225, Infinity];
export function nextRankThreshold(schoolRank) {
  return RANK_THRESHOLDS[schoolRank] ?? Infinity;
}

// Trait name → which ring it affects and which trait is paired with it
export const TRAIT_RING_MAP = {
  reflexes:     { ring: 'air',   paired: 'awareness' },
  awareness:    { ring: 'air',   paired: 'reflexes'  },
  stamina:      { ring: 'earth', paired: 'willpower' },
  willpower:    { ring: 'earth', paired: 'stamina'   },
  agility:      { ring: 'fire',  paired: 'intelligence' },
  intelligence: { ring: 'fire',  paired: 'agility'   },
  strength:     { ring: 'water', paired: 'perception' },
  perception:   { ring: 'water', paired: 'strength'  },
};

