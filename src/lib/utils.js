import { WOUND_RANKS, WOUND_COLORS, SCHOOL_DATA, SAHIR_SCHOOLS, WEAPONS_LIST } from '../data/constants';

// ── Wound helpers ─────────────────────────────────────────────────────────────
export function getWoundRank(current, max, earth) {
  if (!current || current <= 0) return 0;
  // Correct LBS wound thresholds: Healthy=Earth×5, each rank=Earth×2
  // If earth not provided, approximate from max_wounds (max_wounds = Earth×5 + Earth×2×6 = Earth×17)
  const e = earth || Math.max(1, Math.round((max || 20) / 17));
  const h = e * 5;
  const r = e * 2;
  // Cumulative wound thresholds - wounds at START of each rank
  const thresholds = [h, h+r, h+r*2, h+r*3, h+r*4, h+r*5, h+r*6];
  for (let i = 0; i < thresholds.length; i++) {
    if (current <= thresholds[i]) return i;
  }
  return 7; // Out
}

// Effective Stamina for natural wound-recovery purposes only (not used for wound RANK thresholds,
// which are Earth-based). Quick Healer (+2) and Blessed by the Keeper of Years (+1) raise this;
// stacks if a character somehow has both.
export function getEffectiveStamina(char) {
  const base = char?.stamina || 2;
  const advNames = (char?.advantages || []).map(a => (typeof a === 'string' ? a : a?.name) || '');
  const bonus = (advNames.includes('Quick Healer') ? 2 : 0) + (advNames.includes('Blessed by the Keeper of Years') ? 1 : 0);
  return base + bonus;
}

// Full natural-healing calculation: Stamina (with advantage bonuses) + Insight Rank, halved if
// Cursed by the Keeper of Years (natural healing rate halved).
// Effective Water Ring for Move Action range purposes only. Lame overrides to 1 outright (more severe);
// Small reduces by 1 rank (min 1). Lame takes priority if a character somehow has both.
export function getEffectiveWaterRing(char) {
  const base = char?.water || 2;
  const disNames = (char?.disadvantages || []).map(d => (typeof d === 'string' ? d : d?.name) || '');
  if (disNames.includes('Lame')) return 1; // most severe - overrides everything else
  let val = base;
  if (disNames.includes('Small')) val -= 1;
  if (disNames.includes('Blind')) val -= 2;
  return Math.max(1, val);
}

export function getNaturalHealAmount(char) {
  const raw = getEffectiveStamina(char) + (char?.insight_rank || char?.school_rank || 1);
  const disNames = (char?.disadvantages || []).map(d => (typeof d === 'string' ? d : d?.name) || '');
  return disNames.includes('Cursed by the Keeper of Years') ? Math.max(1, Math.floor(raw / 2)) : raw;
}

export function woundColor(rank) { return WOUND_COLORS[rank] || WOUND_COLORS[0]; }
export function woundLabel(rank) { return WOUND_RANKS[rank] || 'Healthy'; }

// ── Dice ──────────────────────────────────────────────────────────────────────
export function rollN(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10) + 1);
}

// Roll XkY with exploding 10s and return the summed total - used for behind-the-scenes opposed rolls
// (shopkeeper haggling, Disarm contests, etc.) where a full interactive dice modal isn't appropriate.
export function rollExplodingKeep(rolled, kept) {
  const dice = Array.from({ length: Math.max(1, rolled) }, () => {
    let total = Math.floor(Math.random() * 10) + 1;
    let cur = total;
    while (cur === 10) {
      cur = Math.floor(Math.random() * 10) + 1;
      total += cur;
    }
    return total;
  });
  dice.sort((a, b) => b - a);
  return dice.slice(0, Math.max(1, Math.min(kept, dice.length))).reduce((s, v) => s + v, 0);
}

// Armor TN = 5 + (Reflexes × 5) + armor bonus. Full Defense's Defense roll ADDS half its result (rounded
// up) to this base - it does not replace Reflexes × 5. This was previously duplicated across 8+ locations
// (CharacterTab, EncounterTab ×2, PCTurnPanel ×2) with real discrepancies between copies - e.g. the NPC
// attack-resolution copy was missing the Jinn TN bonus, and PCTurnPanel's getTargetTN ignored the target's
// stance entirely. Single source of truth now; callers resolve their own armor bonus (equipment array
// lookup for full characters vs. a precomputed field on lightweight combatants - that part varies by data
// shape and stays local to each caller) and pass the final number in via armorBonus.
export function getArmorTN({
  reflexes = 2,
  armorBonus = 0,
  excludeArmor = false,      // Grapple contact rolls, and Armor Piercer arrows: armor gives no TN bonus
  armorMultiplier = 1,       // Flesh Cutter arrows: armor's TN contribution doubles
  stance = null,
  fullDefenseBonus = 0,      // raw Defense roll result - half (rounded up) gets added for Full Defense
  airRing = 2,
  defenseSkillRank = 0,
  voidArmor = false,         // +10 TN from a Void-spend defensive technique/spell
  jinnBonus = 0,             // Jinn "+TN to Be Hit = highest Ring" technique
  magicResistBonus = 0,      // Magic Resistance advantage vs. elemental spells (Spellcraft only)
} = {}) {
  let tn = 5 + (reflexes || 2) * 5;
  if (!excludeArmor) tn += (armorBonus || 0) * armorMultiplier;
  if (stance === 'Full Defense') tn += Math.ceil((fullDefenseBonus || 0) / 2);
  else if (stance === 'Defense') tn += (airRing || 2) + (defenseSkillRank || 0);
  else if (stance === 'Full Attack') tn -= 10;
  if (voidArmor) tn += 10;
  tn += (jinnBonus || 0) + (magicResistBonus || 0);
  return tn;
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

// Build a { rank: techniqueName } map for a school+rank, the same shape character.techniques uses for PCs -
// shared by CharacterTab's NPC sheet view and EncounterTab's NPC combatant spawning, so any NPC (Library or
// Full) with a school+rank gets the same technique set a PC of that school/rank would have.
export function deriveTechniques(school, rank) {
  const sd = SCHOOL_DATA[school];
  const techs = {};
  if (!sd?.techniques) return techs;
  for (let r = 1; r <= (rank || 1); r++) {
    if (sd.techniques[r]) techs[r] = sd.techniques[r];
  }
  return techs;
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

// ── Grid distance / reach (for the token right-click targeting menu) ──────────
// Which cells within a doodad's width×height bounding box are actually part of its footprint.
// 'rectangle' (default) = every cell. 'circle' = cells within the inscribed ellipse of that
// bounding box (so non-square doodads still get an oval, not forced to be perfectly round).
// dx/dy are 0-indexed offsets from the doodad's top-left corner. Shared by GridCreatorTab.jsx
// (placement/preview) and EncounterTab.jsx (live rendering) so the two can never drift apart.
export function isInDoodadFootprint(def, dx, dy) {
  if (def.shape !== 'circle') return true;
  const rx = def.width / 2, ry = def.height / 2;
  const nx = (dx + 0.5 - rx) / rx;
  const ny = (dy + 0.5 - ry) / ry;
  return (nx * nx + ny * ny) <= 1;
}

// Chebyshev (king-move) distance - diagonal counts the same as straight. This is deliberately
// different from movement cost (diagonal steps cost 2 there) and is only used for "is this
// target in melee/ranged reach" checks, per Charles: "let melee range include diagonal, not
// movement or ranged attacks though" (ranged has no distance cap for now, just an adjacency
// exclusion, so this only really matters for the melee-reach check).
export function chebyshevDist(x1, y1, x2, y2) {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

// Spears and Polearms get 2-square melee reach; everything else is strict adjacency (1).
export function getMeleeReach(skillName) {
  return (skillName === 'Spears' || skillName === 'Polearms') ? 2 : 1;
}

// Archery and Assassin Ranged Weapons are the only ranged combat skills in Sandy today.
export function isRangedSkill(skillName) {
  return skillName === 'Archery' || skillName === 'Assassin Ranged Weapons';
}

// ── Line of sight ────────────────────────────────────────────────────────────
// Bresenham line between two grid cells - returns false if any wall tile lies strictly
// between them (not counting the origin or destination cell itself). Used by the lighting
// system (a light source doesn't illuminate through a wall) and intended for reuse by
// ranged-attack LOS blocking once attack range enforcement exists.
export function hasLineOfSight(x0, y0, x1, y1, gridTiles) {
  const tiles = gridTiles || {};
  if (tiles[`${x1},${y1}`]?.type === 'wall') return false;
  let x = x0, y = y0;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  // Cap iterations to the grid's own reasonable bound so a bad input can never hang the loop
  const maxSteps = (Math.abs(x1 - x0) + Math.abs(y1 - y0)) * 2 + 4;
  for (let i = 0; i < maxSteps; i++) {
    if (x === x1 && y === y1) return true;
    const e2 = 2 * err;
    const stepX = e2 >= dy, stepY = e2 <= dx;
    const prevX = x, prevY = y;
    if (stepX) { err += dy; x += sx; }
    if (stepY) { err += dx; y += sy; }
    if (stepX && stepY) {
      // Diagonal step - corner rule: light can't cut between two walls that only touch at a
      // shared corner. Blocked only if BOTH flanking orthogonal cells are walls (a single wall
      // corner doesn't block), matching the same rule applied to movement pathfinding.
      const flankA = tiles[`${prevX + sx},${prevY}`]?.type === 'wall';
      const flankB = tiles[`${prevX},${prevY + sy}`]?.type === 'wall';
      if (flankA && flankB) return false;
    }
    if (x === x1 && y === y1) return true;
    if (tiles[`${x},${y}`]?.type === 'wall') return false;
  }
  return true;
}

// A combatant is "In Melee" whenever a hostile (opposite-side) combatant with a grid position is
// within adjacency (Chebyshev distance 1) - computed live from current positions rather than stored
// as a status tag, since any single combatant's move can change several others' melee status at once
// and a stored flag would go stale. Exists so other systems (ranged/spell penalties while in melee,
// etc.) have a single, reliable place to check this rather than each re-deriving it.
export function isInMelee(combatant, allCombatants) {
  if (!combatant || combatant.gridX === undefined || combatant.gridY === undefined) return false;
  return (allCombatants || []).some(other =>
    other.id !== combatant.id &&
    other.type !== combatant.type &&
    other.gridX !== undefined && other.gridY !== undefined &&
    chebyshevDist(combatant.gridX, combatant.gridY, other.gridX, other.gridY) <= 1
  );
}

// ── Grid placement ──────────────────────────────────────────────────────────
// Finds the first free, non-wall cell for a combatant added mid-encounter (e.g. via
// NPCTab's "+Enc" button or the in-combat "Spawn Enemy"/reinforce panels). Without this,
// those combatants were added to initiative but never got gridX/gridY, so they only ever
// showed up in the grid's small "unplaced" tray instead of appearing on the battlefield.
// Scans from the enemy-side column (mirroring beginEncounter's placement) outward.
export function findFreeGridCell(gridSize, gridTiles, occupiedCombatants) {
  const G = gridSize || 24;
  const tiles = gridTiles || {};
  const occupied = new Set(
    (occupiedCombatants || [])
      .filter(c => c.gridX !== undefined && c.gridY !== undefined)
      .map(c => `${c.gridX},${c.gridY}`)
  );
  const isBlocked = (x, y) => {
    const key = `${x},${y}`;
    if (occupied.has(key)) return true;
    if (tiles[key]?.type === 'wall') return true;
    return false;
  };
  const startCol = Math.max(0, G - 3);
  // Search outward from the enemy-side column first, then sweep the whole grid.
  for (const col of [startCol, ...Array.from({ length: G }, (_, i) => i).filter(c => c !== startCol)]) {
    for (let row = 0; row < G; row++) {
      if (!isBlocked(col, row)) return { x: col, y: row };
    }
  }
  return null; // grid is entirely full/blocked - caller leaves the combatant unplaced
}

// Finds the nearest free, non-wall, unoccupied cell to a given point, expanding outward ring
// by ring (Chebyshev distance) until one is found or the grid is exhausted. Used by the PC Start
// tile: if a PC's designated start tile is already taken, cascade outward to the nearest open cell.
export function findNearestFreeCell(gridSize, gridTiles, occupied, startX, startY) {
  const G = gridSize || 24;
  const tiles = gridTiles || {};
  const isBlocked = (x, y) => {
    if (x < 0 || y < 0 || x >= G || y >= G) return true;
    const key = `${x},${y}`;
    if (occupied.has(key)) return true;
    if (tiles[key]?.type === 'wall') return true;
    return false;
  };
  if (!isBlocked(startX, startY)) return { x: startX, y: startY };
  for (let radius = 1; radius <= G; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue; // only the new outer ring
        const x = startX + dx, y = startY + dy;
        if (!isBlocked(x, y)) return { x, y };
      }
    }
  }
  return null; // grid is entirely full/blocked - caller leaves the combatant unplaced
}

// ── Battle Grid Randomizer: Sewers (pilot theme) ───────────────────────────────
// True procedural generation, not template stamps - a randomized branching walk carves a connected
// tunnel network out of solid wall. Each theme needs its own generator since the spatial logic
// differs (this one is corridor/tunnel-based; caves would want cellular automata instead, palace
// would want room-and-corridor BSP, etc. - see BACKLOG.md).
//
// Design, matching what sewers should actually feel like:
// - Mostly 1-wide corridors, tagged 'confined' (a straight corridor cell with exactly 2 opposite
//   open neighbors) - narrow, claustrophobic tunnels are the point.
// - Occasional 2-wide stretches and small 3×3 junction chambers so it isn't uniformly cramped.
// - A contiguous water channel ('flooded') winding along part of the main tunnel.
// - Sparse waste/muck ('hazardous') and light-grate ('light') tiles.
// - Connectivity is guaranteed BY CONSTRUCTION - every branch only ever starts from an
//   already-carved cell, so there's no separate reachability pass needed, unlike a generator
//   that scatters rooms first and connects them after.
// - PC Start lands at the entrance (top edge), where the party would enter from street level.
export function generateSewersGrid(gridSize) {
  const G = gridSize;
  const key = (x, y) => `${x},${y}`;
  const inBounds = (x, y) => x >= 1 && x < G - 1 && y >= 1 && y < G - 1; // keep a 1-tile wall border
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  const tiles = {};
  // 1. Solid wall block - tunnels get carved OUT of this (deleting the wall entry = open floor)
  for (let x = 0; x < G; x++) for (let y = 0; y < G; y++) tiles[key(x, y)] = { type: 'wall' };

  const carved = new Set();
  const carve = (x, y) => { if (!inBounds(x, y)) return; delete tiles[key(x, y)]; carved.add(key(x, y)); };

  // Entrance on the top edge - becomes the PC Start tile once carving is done
  const entranceX = randInt(Math.floor(G * 0.3), Math.floor(G * 0.7));
  const entranceY = 1;
  carve(entranceX, entranceY);

  const walks = [{ x: entranceX, y: entranceY, dir: [0, 1], steps: Math.floor(G * 2.8) }];
  let branchesSpawned = 0;
  const maxBranches = Math.max(4, Math.floor(G * G / 40)); // scale with grid area, not just one dimension

  while (walks.length) {
    const w = walks.pop();
    let { x, y, dir } = w;
    for (let i = 0; i < w.steps; i++) {
      if (Math.random() < 0.3) dir = pick(DIRS); // meander instead of running dead straight
      const nx = x + dir[0], ny = y + dir[1];
      if (!inBounds(nx, ny)) { dir = pick(DIRS); continue; }
      carve(nx, ny);
      // Mostly 1-wide (kept low on purpose - "lots of confined space" is the point), occasionally 2
      if (Math.random() < 0.15) {
        const side = dir[0] !== 0 ? [0, 1] : [1, 0];
        carve(nx + side[0], ny + side[1]);
      }
      // Occasional junction chamber
      if (Math.random() < 0.05) {
        for (let cx = -1; cx <= 1; cx++) for (let cy = -1; cy <= 1; cy++) carve(nx + cx, ny + cy);
      }
      // Branch off down a side tunnel, perpendicular to current heading
      if (Math.random() < 0.15 && branchesSpawned < maxBranches) {
        branchesSpawned++;
        const branchDir = dir[0] !== 0 ? pick([[0, 1], [0, -1]]) : pick([[1, 0], [-1, 0]]);
        walks.push({ x: nx, y: ny, dir: branchDir, steps: randInt(8, Math.floor(G * 1.4)) });
      }
      x = nx; y = ny;
    }
  }

  // 2. Confined tag - a straight 1-wide corridor cell (exactly 2 open orthogonal neighbors, opposite)
  carved.forEach(k => {
    const [x, y] = k.split(',').map(Number);
    const n = DIRS.filter(([dx, dy]) => carved.has(key(x + dx, y + dy)));
    const isStraight1Wide = n.length === 2 && n[0][0] === -n[1][0] && n[0][1] === -n[1][1];
    if (isStraight1Wide) tiles[key(x, y)] = { type: 'confined' };
  });

  // 3. Water channel - winds along carved cells starting from the entrance
  let wx = entranceX, wy = entranceY;
  const channelLen = Math.floor(G * 1.2);
  for (let i = 0; i < channelLen; i++) {
    if (!carved.has(key(wx, wy))) break;
    tiles[key(wx, wy)] = { type: 'flooded' };
    const options = DIRS.filter(([dx, dy]) => carved.has(key(wx + dx, wy + dy)));
    if (!options.length) break;
    const [dx, dy] = pick(options);
    wx += dx; wy += dy;
  }

  // 4. Sparse waste (hazardous) and light-grate sprinkles on remaining plain tunnel cells
  carved.forEach(k => {
    if (tiles[k]) return; // already tagged confined/flooded above
    const roll = Math.random();
    if (roll < 0.04) tiles[k] = { type: 'hazardous' };
    else if (roll < 0.07) tiles[k] = { type: 'light', radius: 2 };
  });

  // 5. PC Start at the entrance - always wins, placed last
  tiles[key(entranceX, entranceY)] = { type: 'misc3' };

  return tiles;
}

// ── Battle Grid Randomizer: Palace ──────────────────────────────────────────────
// Room-and-corridor BSP (binary space partition) - recursively split the grid into rectangles,
// carve an open room inside each leaf, then connect sibling rooms with straight corridors. Grand,
// open spaces rather than sewers' cramped tunnels: bigger rooms, elevated dais tiles, pillar cover.
export function generatePalaceGrid(gridSize) {
  const G = gridSize;
  const key = (x, y) => `${x},${y}`;
  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const tiles = {};
  for (let x = 0; x < G; x++) for (let y = 0; y < G; y++) tiles[key(x, y)] = { type: 'wall' };

  // BSP split: recursively divide [x,y,w,h] regions until they're small enough, then treat each
  // leaf as a room candidate (with a 1-tile margin kept as wall, so rooms never touch directly -
  // corridors are what connect them, per how the region tree's sibling pairs get linked below).
  const MIN_LEAF = Math.max(5, Math.floor(G / 4));
  const leaves = [];
  const split = (x, y, w, h, depth) => {
    if (w < MIN_LEAF * 2 || h < MIN_LEAF * 2 || depth > 5) { leaves.push({ x, y, w, h }); return; }
    const splitVertical = w > h ? true : w < h ? false : Math.random() < 0.5;
    if (splitVertical) {
      const cut = randInt(MIN_LEAF, w - MIN_LEAF);
      split(x, y, cut, h, depth + 1);
      split(x + cut, y, w - cut, h, depth + 1);
    } else {
      const cut = randInt(MIN_LEAF, h - MIN_LEAF);
      split(x, y, w, cut, depth + 1);
      split(x, y + cut, w, h - cut, depth + 1);
    }
  };
  split(1, 1, G - 2, G - 2, 0);

  const rooms = leaves.map(leaf => {
    const pad = 1;
    const rw = Math.max(3, leaf.w - pad * 2 - randInt(0, 2));
    const rh = Math.max(3, leaf.h - pad * 2 - randInt(0, 2));
    const rx = leaf.x + pad + randInt(0, Math.max(0, leaf.w - rw - pad * 2));
    const ry = leaf.y + pad + randInt(0, Math.max(0, leaf.h - rh - pad * 2));
    return { x: rx, y: ry, w: rw, h: rh, cx: rx + Math.floor(rw / 2), cy: ry + Math.floor(rh / 2) };
  });

  rooms.forEach(r => {
    for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) {
      if (x > 0 && x < G - 1 && y > 0 && y < G - 1) delete tiles[key(x, y)];
    }
  });

  // Connect each room to the next one in list order with an L-shaped corridor (matches BSP leaf
  // adjacency reasonably well without needing a full adjacency graph).
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    let x = a.cx, y = a.cy;
    while (x !== b.cx) { if (x > 0 && x < G - 1 && y > 0 && y < G - 1) delete tiles[key(x, y)]; x += x < b.cx ? 1 : -1; }
    while (y !== b.cy) { if (x > 0 && x < G - 1 && y > 0 && y < G - 1) delete tiles[key(x, y)]; y += y < b.cy ? 1 : -1; }
  }

  // Dais (elevated) in the largest room or two, pillar cover scattered near room edges of bigger rooms
  const sorted = [...rooms].sort((a, b) => (b.w * b.h) - (a.w * a.h));
  sorted.slice(0, Math.max(1, Math.floor(rooms.length * 0.2))).forEach(r => {
    if (r.w < 5 || r.h < 5) return;
    const dw = Math.floor(r.w / 3), dh = Math.floor(r.h / 3);
    const dx = r.x + Math.floor((r.w - dw) / 2), dy = r.y + Math.floor((r.h - dh) / 2);
    for (let x = dx; x < dx + dw; x++) for (let y = dy; y < dy + dh; y++) tiles[key(x, y)] = { type: 'elevated' };
  });
  rooms.forEach(r => {
    if (r.w < 6 || r.h < 6) return;
    if (Math.random() < 0.5) {
      [[r.x + 1, r.y + 1], [r.x + r.w - 2, r.y + 1], [r.x + 1, r.y + r.h - 2], [r.x + r.w - 2, r.y + r.h - 2]].forEach(([px, py]) => {
        if (Math.random() < 0.6) tiles[key(px, py)] = { type: 'cover' };
      });
    }
  });

  const entrance = pick(rooms);
  tiles[key(entrance.cx, entrance.cy)] = { type: 'misc3' };
  return tiles;
}

// ── Battle Grid Randomizer: Desert Ruins ────────────────────────────────────────
// Same BSP room-and-corridor skeleton as Palace, then a "ruin" pass roughs it up: punches holes in
// walls between rooms/corridors and open desert, and scatters rubble (difficult) and collapsed
// pitfalls (hazardous) across open floor - a palace-like layout that's fallen apart, not a fresh one.
export function generateDesertRuinsGrid(gridSize) {
  const tiles = generatePalaceGrid(gridSize); // reuse the room/corridor skeleton...
  const G = gridSize;
  const key = (x, y) => `${x},${y}`;
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  // Capture where Palace placed its PC Start BEFORE the ruin pass - tile objects only ever carry
  // {type}, not TILE_TYPES' isPcStart flag, so there's no property to check on the data itself. Re-
  // apply this at the very end instead, guaranteed-last, same as every other generator here.
  const entranceKey = Object.keys(tiles).find(k => tiles[k].type === 'misc3');

  // ...then rough it up. Punch random breaches through walls that are directly adjacent to open
  // floor (never touching the outer border, so the grid stays enclosed) - collapsed sections of wall.
  for (let x = 1; x < G - 1; x++) {
    for (let y = 1; y < G - 1; y++) {
      const k = key(x, y);
      if (tiles[k]?.type !== 'wall') continue;
      const adjacentOpen = DIRS.some(([dx, dy]) => {
        const nk = key(x + dx, y + dy);
        return tiles[nk] === undefined || (tiles[nk] && tiles[nk].type !== 'wall');
      });
      if (adjacentOpen && Math.random() < 0.08) delete tiles[k];
    }
  }
  // Rubble and pitfalls scattered across open floor
  Object.keys(tiles).forEach(k => {
    if (tiles[k].type === 'wall') return;
    const roll = Math.random();
    if (roll < 0.06) tiles[k] = { type: 'hazardous' };
    else if (roll < 0.18) tiles[k] = { type: 'difficult' };
  });
  // Also scatter rubble onto cells that used to be plain undefined (open) floor, not just tagged ones
  for (let x = 1; x < G - 1; x++) {
    for (let y = 1; y < G - 1; y++) {
      const k = key(x, y);
      if (tiles[k] !== undefined) continue; // already wall or tagged
      if (Math.random() < 0.1) tiles[k] = { type: 'difficult' };
    }
  }
  // PC Start always wins, placed last
  if (entranceKey) tiles[entranceKey] = { type: 'misc3' };
  return tiles;
}

// ── Battle Grid Randomizer: Desert Caves ────────────────────────────────────────
// Cellular automata - genuinely different technique from the BSP/tunnel-carve generators above,
// since caves need to read as organic with no straight lines. Standard approach: seed random noise,
// then repeatedly smooth ("a cell becomes wall if it has 5+ wall neighbors, floor otherwise") until
// it settles into blobby cave shapes. Finishes with a flood-fill to keep only the largest connected
// region - cellular automata can produce disconnected pockets, and unlike Sewers' carve-only-from-
// already-carved-cells approach, connectivity here isn't guaranteed by construction.
export function generateDesertCavesGrid(gridSize) {
  const G = gridSize;
  const key = (x, y) => `${x},${y}`;
  let grid = new Set(); // cells currently WALL

  for (let x = 0; x < G; x++) for (let y = 0; y < G; y++) {
    if (x === 0 || y === 0 || x === G - 1 || y === G - 1 || Math.random() < 0.45) grid.add(key(x, y));
  }
  const wallNeighborCount = (g, x, y) => {
    let n = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= G || ny >= G || g.has(key(nx, ny))) n++;
    }
    return n;
  };
  for (let iter = 0; iter < 5; iter++) {
    const next = new Set();
    for (let x = 0; x < G; x++) for (let y = 0; y < G; y++) {
      const n = wallNeighborCount(grid, x, y);
      if (x === 0 || y === 0 || x === G - 1 || y === G - 1 || n >= 5) next.add(key(x, y));
      else if (n <= 2 && !grid.has(key(x, y))) { /* stays floor */ }
    }
    grid = next;
  }

  // Flood-fill from the first open cell found to identify the largest connected floor region;
  // anything not in it gets walled off so the map is guaranteed traversable as one space.
  const isFloor = (x, y) => x >= 0 && y >= 0 && x < G && y < G && !grid.has(key(x, y));
  const seen = new Set();
  let bestRegion = new Set();
  for (let x = 0; x < G; x++) {
    for (let y = 0; y < G; y++) {
      if (!isFloor(x, y) || seen.has(key(x, y))) continue;
      const region = new Set();
      const stack = [[x, y]];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        const ck = key(cx, cy);
        if (region.has(ck) || !isFloor(cx, cy)) continue;
        region.add(ck); seen.add(ck);
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dx,dy]) => stack.push([cx+dx, cy+dy]));
      }
      if (region.size > bestRegion.size) bestRegion = region;
    }
  }

  const tiles = {};
  for (let x = 0; x < G; x++) for (let y = 0; y < G; y++) {
    if (!bestRegion.has(key(x, y))) tiles[key(x, y)] = { type: 'wall' };
  }
  // Sand drifts (difficult) and sinkholes (hazardous) scattered across the open cave floor
  bestRegion.forEach(k => {
    const roll = Math.random();
    if (roll < 0.05) tiles[k] = { type: 'hazardous' };
    else if (roll < 0.16) tiles[k] = { type: 'difficult' };
  });

  const entranceKey = [...bestRegion][0] || `${Math.floor(G/2)},${Math.floor(G/2)}`;
  tiles[entranceKey] = { type: 'misc3' };
  return tiles;
}

// ── Battle Grid Randomizer: Crowded Streets ─────────────────────────────────────
// Scatter-based, not room-based at all - the whole grid starts open (a street/plaza), then market
// stalls, carts, and crates get scattered across it as small wall/cover clusters, leaving pathways
// between them. Genuinely different shape from every generator above (those all carve OUT of solid
// wall; this one starts open and adds obstacles IN).
export function generateCrowdedStreetsGrid(gridSize) {
  const G = gridSize;
  const key = (x, y) => `${x},${y}`;
  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  const tiles = {}; // undefined = open floor everywhere by default; only obstacles get an entry
  const isFree = (x, y, w, h) => {
    for (let dx = -1; dx <= w; dx++) for (let dy = -1; dy <= h; dy++) {
      const k = key(x + dx, y + dy);
      if (tiles[k]?.type === 'wall') return false;
    }
    return true;
  };
  const stallCount = Math.max(6, Math.floor((G * G) / 30));
  for (let i = 0; i < stallCount; i++) {
    const w = randInt(1, 2), h = randInt(1, 2);
    const x = randInt(2, G - 2 - w), y = randInt(2, G - 2 - h);
    if (!isFree(x, y, w, h)) continue;
    for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) tiles[key(x + dx, y + dy)] = { type: 'wall' };
    // Crate/awning cover ringing some stalls
    if (Math.random() < 0.5) {
      const ringSpots = [[x - 1, y], [x + w, y], [x, y - 1], [x, y + h]];
      ringSpots.forEach(([rx, ry]) => {
        if (rx < 1 || ry < 1 || rx >= G - 1 || ry >= G - 1) return;
        if (Math.random() < 0.4 && tiles[key(rx, ry)] === undefined) tiles[key(rx, ry)] = { type: 'cover' };
      });
    }
  }
  // Crowd/debris difficult terrain sprinkled across remaining open street
  for (let x = 1; x < G - 1; x++) {
    for (let y = 1; y < G - 1; y++) {
      const k = key(x, y);
      if (tiles[k] !== undefined) continue;
      if (Math.random() < 0.05) tiles[k] = { type: 'difficult' };
    }
  }
  // Border walls so the street reads as a contained space
  for (let x = 0; x < G; x++) { tiles[key(x, 0)] = { type: 'wall' }; tiles[key(x, G - 1)] = { type: 'wall' }; }
  for (let y = 0; y < G; y++) { tiles[key(0, y)] = { type: 'wall' }; tiles[key(G - 1, y)] = { type: 'wall' }; }

  const entranceX = randInt(Math.floor(G * 0.3), Math.floor(G * 0.7));
  tiles[key(entranceX, 1)] = { type: 'misc3' };
  return tiles;
}

// ── Difficulty ────────────────────────────────────────────────────────────────
export function calcDifficulty(npcs, partyRank = 2) {
  // Use creature.difficulty for bestiary entries (was silently rank 1 for all creatures regardless of
  // actual threat - a Monkey and a Desert Wyrm contributed identically). Falls back to n.rank for
  // library NPCs which use the school-rank system.
  const total = npcs.reduce((s, n) => s + (n.difficulty ?? n.rank ?? 1), 0);
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
    max_wounds: (traits.Stamina || 2) * 17, // Earth×5 (Healthy) + Earth×2×6 (wound ranks)
    current_void: traits.Void || 2,
    current_stance: 'Attack',
    current_weapon: firstWeapon ? `${firstWeapon} (${firstWeaponData?.dr || '1k1'})` : 'Unarmed (1k1)',
    skills: Object.entries(skills).map(([name, rank]) => ({ name, rank, school: (sd.skills || []).includes(name) })),
    techniques: sd.techniques?.[1] ? { 1: sd.techniques[1] } : {},
    advantages: form.advantages || [],
    disadvantages: form.disadvantages || [],
    equipment,
    spells: form.selectedSpells || [],
    spell_emphasis: form.spellEmphasis || '',
    xp_total: Math.max(0, form.cpRemaining || 0), // unused CP converts to starting XP
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
  // Universal mastery bonuses: Rank 5 = +2 Insight, Rank 10 = +5 additional Insight (per skill)
  const masteryInsight = (char.skills||[]).reduce((s, sk) => {
    if ((sk.rank||0) >= 10) return s + 7; // +2 at R5, +5 more at R10 = +7 total
    if ((sk.rank||0) >= 5)  return s + 2; // +2 at R5
    return s;
  }, 0);
  return rings * 10 + skills + masteryInsight;
}

export function insightRankFor(insight, char) {
  const t = char ? getEffectiveRankThresholds(char) : RANK_THRESHOLDS;
  if (insight >= t[4]) return 5;
  if (insight >= t[3]) return 4;
  if (insight >= t[2]) return 3;
  if (insight >= t[1]) return 2;
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
// Curse of the Grey Crone: "XP needed per Insight Rank is reduced by 5" - cumulative per rank index,
// confirmed against the disadvantage's own examples (145 for 2nd rank, 165 for 3rd - i.e. -5, -10, -15,
// -20, not a flat -5 to every threshold). Returns a character-adjusted copy rather than mutating the
// shared global array.
export function getEffectiveRankThresholds(char) {
  const hasGreyCrone = (char?.disadvantages || []).some(d => (d.name || d) === 'Curse of the Grey Crone' && d.trait);
  if (!hasGreyCrone) return RANK_THRESHOLDS;
  return RANK_THRESHOLDS.map((t, i) => t === Infinity ? t : Math.max(0, t - 5 * i));
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

