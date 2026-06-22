// ── Game constants ────────────────────────────────────────────────────────────
export const GAME_ID = '843ba09a-1e47-46b3-80f0-b7b5279f9de0';
export const GM_PASSWORD = 'gm1234';

export const WOUND_RANKS = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'];
export const WOUND_COLORS = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'];
export const STANCES = ['Attack','Full Attack','Defense','Full Defense','Center'];
export const NPC_ACTIONS = ['Attack','Move','Full Defense','Draw Weapon','Cast Spell','Use Technique','Pass'];
export const STATUS_EFFECTS = ['Dazed','Fatigued','Prone','Blinded','Frightened','Stunned','Bleeding','Burning','Grappled'];
export const RAISE_OPTIONS = ['More Effect','Flashy','Custom (notify GM)'];
export const ATTACK_MANEUVERS = ['Knockdown','Feint','Disarm','Extra Attack','Called Shot','Stun','Narrative'];
export const ROUND_LIMITS = { Action: null, Intrigue: 5, Travel: 3, Downtime: 2 };
export const TRAITS = ['Reflexes','Awareness','Stamina','Willpower','Agility','Intelligence','Strength','Perception'];

// ── Full skill list ───────────────────────────────────────────────────────────
// Grouped by category. Lore: / Craft: / Perform: are open-ended — a special
// placeholder value signals the UI to show a free-text input for the subtopic.
export const SKILL_CATEGORIES = {
  'Bugei (Combat)': [
    'Athletics','Archery','Assassin Ranged Weapons','Battle','Brawling',
    'Defense','Horsemanship','Hunting','Intimidation','Knives',
    'Polearms','Spears','Staves','Swordsmanship','Tahaddi',
  ],
  'High (Social/Scholarly)': [
    'Calligraphy','Courtier','Divination','Etiquette','Games',
    'Medicine','Meditation','Sincerity','Storytelling','Tea Ceremony',
  ],
  'Low (Common/Criminal)': [
    'Acting','Forgery','Gambling','Sleight of Hand','Stealth',
  ],
  'Merchant': [
    'Appraisal','Commerce','Temptation',
  ],
  'LBS-Specific': [
    'Locksmithing','Spellcraft',
  ],
  'Lore': [
    'Lore: Burning Sands','Lore: Ebonites','Lore: History','Lore: Jackal',
    'Lore: Khadi','Lore: Law','Lore: Theology','Lore: Undead',
    'Lore: Underworld','Lore: Yodotai History','Lore: [Custom]',
  ],
  'Craft': ['Craft: Poison','Craft: Weaponsmith','Craft: Armorsmith','Craft: [Custom]'],
  'Perform': ['Perform: Dancing','Perform: Singing','Perform: [Custom]'],
};

// Flat list of all skills for convenience (custom placeholders excluded)
export const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat().filter(s => !s.endsWith('[Custom]'));
// Skills that are open-ended and need a free-text subtopic field
export const OPEN_SKILLS = ['Lore','Craft','Perform'];

export const FACTION_ICONS = {
  'City Guard':          'ti-shield-filled',
  'Dahab':               'ti-coin',
  'Qabal':               'ti-wand',
  'Assassins':           'ti-knife',
  'Ashalan':             'ti-moon-stars',
  "Ra'Shari":            'ti-crystal-ball',
  'Senpet':              'ti-sun-filled',
  'Yodotai':             'ti-helmet',
  'Ebonites':            'ti-diamond-filled',
  'Jackals':             'ti-skull',
  'Merchants':           'ti-building-store',
  'Rogues / Foreigners': 'ti-eye-off',
  'Monsters':            'ti-ghost-2',
  'Independent':         'ti-user',
};

export const PIN_TYPES = [
  { id: 'palace',   label: 'Palace',           color: '#9060c8' },
  { id: 'noble',    label: 'Noble District',    color: '#c8962a' },
  { id: 'faction',  label: 'Faction Quarter',   color: '#4a8a40' },
  { id: 'merchant', label: 'Merchant District', color: '#4a7a8a' },
  { id: 'outer',    label: 'Outer City',        color: '#a8947a' },
  { id: 'streets',  label: 'Streets',           color: '#c8b060' },
  { id: 'sewers',   label: 'Sewers',            color: '#7a6a3a' },
  { id: 'desert',   label: 'Desert',            color: '#c8a050' },
  { id: 'indoors',  label: 'Indoors',           color: '#5a8a9a' },
  { id: 'encounter',label: 'Encounter Site',    color: '#c84030' },
];

export const FACTIONS_LIST = [
  'City Guard','Dahab','Qabal','Assassins','Ashalan',"Ra'Shari",'Senpet','Yodotai','Ebonites','Jackals','Merchants','Rogues / Foreigners','Independent'
];

const PATHS = ['Alley Thug','Scholar','Street Rat'];
const CITY_GUARD_SCHOOL = ['Soldier of the City Guard'];

export const FACTION_SCHOOLS = {
  'City Guard':          ['Soldier of the City Guard', ...PATHS],
  'Dahab':               ['Dahabi Enforcer','Dahabi Bargainer','Dahabi Merchant', ...CITY_GUARD_SCHOOL, ...PATHS],
  'Qabal':               ['Qabal Agent','Qabal Summoner', ...CITY_GUARD_SCHOOL, ...PATHS],
  'Assassins':           ['Assassin Slayer','Assassin Keeper', ...CITY_GUARD_SCHOOL, ...PATHS],
  'Ashalan':             ['Blood-Sworn','Children of Midnight','Heart-Seekers', ...PATHS],
  "Ra'Shari":            ["Ra'Shari Knife-Fighter","Ra'Shari Trader","Ra'Shari Diviner", ...CITY_GUARD_SCHOOL, ...PATHS],
  'Senpet':              ['Senpet Legionnaire','Senpet Charioteer','Senpet Sahir', ...PATHS],
  'Yodotai':             ['Yodotai Legionnaire','Yodotai Mercenary', ...PATHS],
  'Ebonites':            ['Ebonite Templar', ...CITY_GUARD_SCHOOL, ...PATHS],
  'Jackals':             ['Jani','Necromancer','Kabir', ...PATHS],
  'Merchants':           ['Dahabi Merchant',"Ra'Shari Trader", ...CITY_GUARD_SCHOOL, ...PATHS],
  'Rogues / Foreigners': ['Assassin Slayer', ...CITY_GUARD_SCHOOL, ...PATHS],
  'Independent':         ['Free Sahir', ...PATHS],
};

export const SUBFACTION_BONUSES = {
  'City Guard':  { 'City Guard': 'Willpower' },
  'Dahab':       { 'House Asmari':'Strength','House Basiri':'Intelligence','House Enour':'Willpower','House Haffit':'Agility','House Hazaad':'Awareness','House Mendadi':'Reflexes','House Menjari':'Perception','House Rashid':'Stamina' },
  'Qabal':       { 'Traditionalists':'Intelligence','Progressivists':'Willpower' },
  'Assassins':   { 'Qadi / Caliphate Guards':'Perception','Daughters / Sons of the Mountain':'Reflexes','Order of the Blood-Red Tiger':'Agility' },
  'Ashalan':     { 'Ashalan':'Void' },
  "Ra'Shari":    { 'Great Caravan of Commerce':'Willpower','Great Caravan of Entertainment':'Awareness','Great Caravan of Memory':'Intelligence','Great Caravan of Mysticism':'Perception' },
  'Senpet':      { 'Senpet':'Void' },
  'Yodotai':     { 'Yodotai':'Strength' },
  'Ebonites':    { 'Order of the Ebon Hand':'Any' },
  'Jackals':     { 'Jackals':'Agility' },
  'Merchants':   { 'Independent Merchant':'Awareness' },
  'Rogues / Foreigners': { 'Rogue':'Agility', 'Foreigner':'Any' },
  'Independent': { 'Free Agent':'Willpower' },
};

export const SAHIR_SCHOOLS = ['Dahabi Bargainer','Qabal Summoner','Children of Midnight',"Ra'Shari Diviner",'Senpet Sahir','Necromancer','Heartless Khadi'];

// ── Item Quality Tiers ───────────────────────────────────────────────────────
export const ITEM_QUALITIES = {
  poor:       { label: 'Poor',       mult: 0.5, rollBonus: 0,  keepBonus: 0,  desc: 'Shoddy. May break or misfire at GM discretion.' },
  standard:   { label: 'Standard',   mult: 1,   rollBonus: 0,  keepBonus: 0,  desc: 'Well-made. No special modifier.' },
  fine:       { label: 'Fine',       mult: 2,   rollBonus: 1,  keepBonus: 0,  desc: 'Excellent craft. +1 rolled die on attacks with this weapon.' },
  masterwork: { label: 'Masterwork', mult: 4,   rollBonus: 1,  keepBonus: 1,  desc: 'The finest available. +1k1 on attacks with this weapon.' },
};

// ── Poisons & Powders (LBS p.72-76) ─────────────────────────────────────────
export const POISONS_LIST = [
  {
    name: 'Generic Poison',
    method: 'Ingested',
    onset: '60 minutes',
    effect: '-1 to one Trait (GM choice)',
    resist: 'Raw Stamina after 60 min. Exceeds TN by 10+: ends immediately',
    resistTN: 10,
    healTN: 10,
    craftTN: 10,
    craftNotes: '3 Raises: increase Trait loss to -2 or lower additional Trait. Void cannot be reduced.',
    disease: 'Causes same Trait loss again on day 2.',
    color: '#6a6a30',
  },
  {
    name: 'Dripping Poison (Lassitude)',
    method: 'Ingested (sleeping victim)',
    onset: 'Immediate',
    effect: '-2 Strength',
    resist: 'Raw Stamina hourly. TN increases +5 per failed roll',
    resistTN: 15,
    healTN: 15,
    craftTN: 20,
    craftNotes: 'Administered via thread dripped into a sleeping victim. TN rises +5 per hour.',
    disease: 'Incubates 1 day; manifests overnight. Loss of energy and motivation.',
    color: '#6a4a20',
  },
  {
    name: 'Fauntei Shi',
    method: 'Any',
    onset: 'Immediate',
    effect: 'Must resist every 10 minutes or die',
    resist: 'Raw Stamina every 10 minutes',
    resistTN: 35,
    healTN: 50,
    craftTN: 55,
    craftNotes: 'TN 50 to identify only. No known cure in the Burning Sands.',
    disease: 'No natural disease kills as effectively.',
    color: '#8a1a1a',
  },
  {
    name: 'Fire Biter (Water Imbalance)',
    method: 'Bloodstream (applied to bladed weapons)',
    onset: '10 seconds',
    effect: '-2 Agility + 2k2 Wounds',
    resist: 'Raw Stamina TN 30 halves penalties on success',
    resistTN: 30,
    healTN: 25,
    craftTN: 25,
    craftNotes: '2 Raises: +1k1 damage OR +1 Agility penalty. Agility penalty lasts full day.',
    disease: 'Contact or ingested. Effects every morning. Agility penalty reduced to -1.',
    color: '#8a3a10',
  },
  {
    name: 'Hot Madness (Boiled Mind)',
    method: 'Ingested',
    onset: 'Immediate',
    effect: '-2 Intelligence and -2 Willpower',
    resist: 'Stamina TN 30 reduces penalties to -1 on success',
    resistTN: 30,
    healTN: 20,
    craftTN: 30,
    craftNotes: '2 Raises: extends duration by 1 day. Cannot kill via Trait loss alone.',
    disease: 'Effects reapplied daily. 0 Int or Will triggers coma; death after 3 days untreated.',
    color: '#7a4a6a',
  },
  {
    name: 'Kirei-ko',
    method: 'Contact (long-term) or Ingested',
    onset: 'Weeks',
    effect: 'Contact: -1 Stamina per 2 weeks. Ingested: -2 Stamina per week',
    resist: 'No avoidance possible',
    resistTN: null,
    healTN: 40,
    craftTN: 35,
    craftNotes: 'Heal TN reduced by 5 per Stamina point lost. Recovery: +1 Stamina per 2 weeks of rest after exposure ends.',
    disease: 'Effects continue 1 week after exposure ends.',
    color: '#4a6a4a',
  },
  {
    name: 'Night Milk (Night Rot)',
    method: 'Bloodstream',
    onset: 'Immediate',
    effect: '2k1 Wounds per minute for 5 rolls. Losing 2 Wound Ranks treated as Down.',
    resist: 'Raw Stamina every minute. 5 consecutive rolls required.',
    resistTN: 25,
    healTN: 20,
    craftTN: 25,
    craftNotes: '2 Raises: extends damage by 1 round. Wounds cannot heal normally until treated or after 1 full day rest.',
    disease: 'Effects measured in days. Appetite loss, stomach cramps, dizziness.',
    color: '#3a5a3a',
  },
  {
    name: 'Snake / Scorpion Venom',
    method: 'Bite, blood, or ingested',
    onset: 'Immediate',
    effect: '-1 Agility and -1 Reflexes per hour untreated',
    resist: 'Raw Stamina hourly, TN increases +5 per failed roll',
    resistTN: 10,
    healTN: 15,
    craftTN: 10,
    craftNotes: 'TN 30 to synthesize without actual venom. 2 Raises: adds blindness after 2 failed rolls.',
    disease: 'Rolls measured in days. Joint aches and spasms.',
    color: '#5a6a20',
  },
  {
    name: 'Spider Venom (Red Lung)',
    method: 'Blood or ingested',
    onset: 'Immediate',
    effect: '-1 Stamina per hour',
    resist: 'Raw Stamina hourly TN 10, TN+5 per fail. Exceed by 10+: ignored entirely.',
    resistTN: 10,
    healTN: 10,
    craftTN: 15,
    craftNotes: 'After 6 hours rest victim continues rolls but poison fades.',
    disease: 'Rolls measured in days. Shortness of breath, blood when coughing.',
    color: '#4a4a7a',
  },
  {
    name: 'Stolen Breath (Desert Throat)',
    method: 'Ingested (ineffective in blood)',
    onset: '1 hour tingle; voice gone after 1 day',
    effect: 'Voice reduced to whisper. After 6 hours voiceless: Stamina TN 30 or permanent.',
    resist: 'Stamina TN 30 after 6 hours voiceless, then every 2 hours',
    resistTN: 30,
    healTN: 15,
    craftTN: 30,
    craftNotes: 'TN 40 to diagnose as poison (requires Antidote emphasis). Closely resembles disease.',
    disease: 'Mechanically identical to Isora Anger disease.',
    color: '#4a5a6a',
  },
  {
    name: 'Wish You Dead (Air Imbalance)',
    method: 'Bloodstream',
    onset: 'Immediate',
    effect: '-1 Stamina + nausea (-1 rolled die on all Skill rolls)',
    resist: 'Stamina TN 20 negates nausea only. Lasts 8 hours (4 if initial roll succeeds).',
    resistTN: 20,
    healTN: 20,
    craftTN: 25,
    craftNotes: '1 Raise: extends duration by 8 hours.',
    disease: '+1 Stamina loss per day, fatigue added to nausea.',
    color: '#6a3a5a',
  },
];

export const POWDERS_LIST = [
  {
    name: 'Poison Powder',
    delivery: 'Reflexes / Assassin Ranged Weapons attack roll',
    duration: '10 minus victim Stamina rounds (minimum 1)',
    craft: 'Intelligence / Poison TN 25 per dose (1 copper ingredients). +2 Raises per extra effect. +1 Raise: safe to spit from own mouth.',
    effects: ['Blindness', 'Choking (Stamina TN 15 per action or lose it)', 'Itching (-10 Initiative)', 'Nausea (-1 rolled die on Stamina/Agility)'],
    note: 'Flushing with water reduces duration by 3 rounds per round spent. No unskilled penalty on attack.',
    color: '#7a3a3a',
  },
  {
    name: 'Mundane Powder (Blinding Dust)',
    delivery: 'Reflexes / Assassin Ranged Weapons or blowgun',
    duration: '10 minus victim Stamina rounds (minimum 1)',
    craft: 'Craft (Powders) TN 10 per dose. Free materials (dirt/refuse). +2 Raises per extra effect.',
    effects: ['Blindness', 'Choking (Stamina TN 15 per action or lose it)', 'Itching (-10 Initiative)'],
    note: 'Easier to craft and explain. Masks grant +10 TN to be hit by any powder attack.',
    color: '#6a5a30',
  },
];


// Maps technique names to which skills/areas they modify — used to show glow badges on skill rows
export const TECHNIQUE_SKILL_LINKS = {
  // City Guard
  'Trained For War':         ['Athletics', 'Battle', 'Defense', 'Initiative'],
  'Strike With Fury':        ['Initiative', 'Attack'],
  'Implacable Foe':          ['Swordsmanship', 'Spears', 'Knives', 'Polearms', 'Staves', 'Attack'],
  'Instrument of the Caliph': ['Defense', 'Initiative'],
  'The Sublime Warrior':     ['Defense', 'Initiative', 'Armor TN'],
  // Dahabi Enforcer
  'Moonless Night':          ['Attack', 'Damage'],
  'Dangerous Maneuvers':     ['Brawling', 'Damage'],
  'Show of Force':           ['Attack', 'Brawling'],
  'Bitter Shadows':          ['Brawling', 'Damage'],
  'Final Strike':            ['Damage', 'Center Stance'],
  // Dahabi Bargainer
  'Penetrating Words':       ['Spellcraft', 'Commerce'],
  // Dahabi Merchant
  'Master of the Subtle Flow': ['Commerce', 'Sincerity', 'Temptation'],
  'Upstanding Citizen':      ['Commerce', 'Sincerity', 'Temptation'],
  'An Eye for a Deal':       ['Commerce', 'Sincerity', 'Temptation'],
  'Silver Tongued Devil':    ['Sincerity', 'Commerce'],
  'Merchant King':           ['Commerce'],
  // Qabal Agent
  'No One of Import':        ['Sincerity', 'Stealth'],
  'A Good Excuse':           ['Sincerity'],
  'Unassailable Reputation': ['Courtier', 'Etiquette'],
  'The Ordered Bolthole':    ['Stealth', 'Investigation'],
  'Pillar of the Community': ['Stealth', 'Spellcraft'],
  // Qabal Summoner
  'The Crucible of Knowledge': ['Spellcraft'],
  // Ashalan Blood-Sworn
  'Blessed by the Crystal':  ['Battle', 'Defense'],
  'Your Blood is My Blood':  ['Medicine'],
  'Fortification in Form':   ['Defense', 'Armor TN'],
  'To Fight for the Future': ['Attack'],
  'One is Never Truly Alone': ['Damage'],
  // Ashalan Children of Midnight
  'Wisdom of the Stars':     ['Spellcraft'],
  // Ashalan Heart-Seekers
  'Truth is My Ally':        ['Investigation'],
  'Diligence is the Best Teacher': ['Investigation', 'Awareness'],
  'One Mind, One Action':    ['Defense', 'Armor TN', 'Spellcraft'],
  'Bane of the Heartless':   ['Attack'],
  "My Will is My Fortress":  ['Defense'],
  // Assassin Slayer
  'All Shadows Walk in the Light': ['Sincerity', 'Etiquette', 'Stealth', 'Damage'],
  'Rite of Assassination':   ['Armor TN', 'Stealth', 'Tahaddi'],
  'Let Him Bleed':           ['Attack'],
  'Blood Calls for Blood':   ['Attack', 'Knives'],
  'Swifter Than Life Itself': ['Initiative'],
  // Assassin Keeper
  "The Keeper's Courage":    ['Investigation', 'Damage'],
  "The Keeper's Judgment":   ['Attack'],
  "The Keeper's Justice":    ['Attack', 'Brawling'],
  "The Keeper's Art":        ['Attack'],
  'By the Force of Will Alone': ['Defense', 'Armor TN'],
  // Assassin Duelist
  'The Tiger Claw Cut':      ['Tahaddi', 'Center Stance'],
  'No Escape':               ['Knives', 'Attack'],
  'The Final Strike':        ['Tahaddi', 'Damage'],
  // Ra'Shari Knife-Fighter
  'The Endless Dance':       ['Armor TN', 'Initiative'],
  'Flashing Talons':         ['Knives', 'Damage'],
  // Senpet (placeholder — add as schools are built out)
  // Yodotai, Ebonites, Jackals — to be added when those school techniques are confirmed
};


export const SCHOOL_DATA = {
  'Soldier of the City Guard': { faction:'City Guard', type:'Warrior', integrity:5.5, bonus_trait:'Reflexes', skills:['Athletics','Defense','Lore: Law','Investigation','Spears','Swordsmanship','Intimidation'], techniques:{1:'Trained For War',2:'Strike With Fury',3:'Implacable Foe',4:'Instrument of the Caliph',5:'The Sublime Warrior'}, equipment:['Longsword','Shortsword','Composite Bow','Light Armor','Traveling Pack'], starting_copper:3 },
  'Dahabi Enforcer': { faction:'Dahab', type:'Warrior', integrity:2.5, bonus_trait:'Strength', skills:['Athletics','Defense','Knives','Lore: Underworld','Staves','Swordsmanship','Intimidation'], techniques:{1:'Moonless Night',2:'Dangerous Maneuvers',3:'Show of Force',4:'Bitter Shadows',5:'Final Strike'}, equipment:['Longsword','Knife','Light Armor','Traveling Pack'], starting_copper:5 },
  'Dahabi Bargainer': { faction:'Dahab', type:'Sahir', integrity:1.5, bonus_trait:'Perception', skills:['Calligraphy','Commerce','Courtier','Divination','Medicine','Spellcraft','Sincerity'], techniques:{1:'Penetrating Words'}, equipment:['Knife','Fine Clothes','Traveling Pack'], starting_copper:20 },
  'Dahabi Merchant': { faction:'Dahab', type:'Diplomat', integrity:4.5, bonus_trait:'Awareness', skills:['Commerce','Courtier','Sincerity','Etiquette','Lore: Underworld','Temptation','Storytelling'], techniques:{1:'Master of the Subtle Flow',2:'Upstanding Citizen',3:'An Eye for a Deal',4:'Silver Tongued Devil',5:'Merchant King'}, equipment:['Longsword','Knife','Fine Clothes','Traveling Pack'], starting_copper:5 },
  'Qabal Agent': { faction:'Qabal', type:'Diplomat', integrity:1.5, bonus_trait:'Perception', skills:['Sincerity','Etiquette','Forgery','Investigation','Sleight of Hand','Stealth','Commerce'], techniques:{1:'No One of Import',2:'A Good Excuse',3:'Unassailable Reputation',4:'The Ordered Bolthole',5:'Pillar of the Community'}, equipment:['Knife','Clothes','Cloak','Calligraphy Kit'], starting_copper:5 },
  'Qabal Summoner': { faction:'Qabal', type:'Sahir', integrity:2.5, bonus_trait:'Intelligence', skills:['Calligraphy','Divination','Spellcraft','Lore: Theology','Lore: History','Meditation','Etiquette'], techniques:{1:'The Crucible of Knowledge'}, equipment:['Staff','Knife','Clothes','Traveling Pack'], starting_copper:5 },
  'Assassin Slayer': { faction:'Assassins', type:'Ninja', integrity:1.5, bonus_trait:'Agility', skills:['Acting','Athletics','Sincerity','Stealth','Lore: Underworld','Knives','Assassin Ranged Weapons'], techniques:{1:'All Shadows Walk in the Light',2:'Rite of Assassination',3:'Let Him Bleed',4:'Blood Calls for Blood',5:'Swifter Than Life Itself'}, equipment:['Knife','Jambiya','Fine Robes','Traveling Pack'], starting_copper:10 },
  'Assassin Keeper': { faction:'Assassins', type:'Ninja', integrity:1.5, bonus_trait:'Reflexes', skills:['Athletics','Defense','Etiquette','Investigation','Swordsmanship','Lore: Burning Sands','Stealth'], techniques:{1:"The Keeper's Courage",2:"The Keeper's Judgment",3:"The Keeper's Justice",4:"The Keeper's Art",5:'By the Force of Will Alone'}, equipment:['Longsword','Shortsword','Composite Bow','Light Armor','Robes'], starting_copper:3 },
  'Blood-Sworn': { faction:'Ashalan', type:'Warrior', integrity:5.5, bonus_trait:'Strength', skills:['Athletics','Battle','Defense','Swordsmanship','Polearms','Lore: Theology','Knives'], techniques:{1:'Blessed by the Crystal',2:'Your Blood is My Blood',3:'Fortification in Form',4:'To Fight for the Future',5:'One is Never Truly Alone'}, equipment:['Scimitar','Khadja','Composite Bow','Light Armor','Robe'], starting_copper:5 },
  'Children of Midnight': { faction:'Ashalan', type:'Sahir', integrity:4.5, bonus_trait:'Awareness', skills:['Divination','Lore: History','Medicine','Meditation','Spellcraft','Lore: Theology','Lore: Burning Sands'], techniques:{1:'Wisdom of the Stars'}, equipment:['Scimitar','Khadja','Robe','Traveling Pack'], starting_copper:5 },
  'Heart-Seekers': { faction:'Ashalan', type:'Warrior', integrity:5.5, bonus_trait:'Willpower', skills:['Battle','Defense','Investigation','Lore: Khadi','Spellcraft','Stealth','Swordsmanship'], techniques:{1:'Truth is My Ally',2:'Diligence is the Best Teacher',3:'One Mind, One Action',4:'Bane of the Heartless',5:'My Will is My Fortress'}, equipment:['Scimitar','Khadja','Composite Bow','Light Armor','Robe'], starting_copper:3 },
  "Ra'Shari Knife-Fighter": { faction:"Ra'Shari", type:'Warrior', integrity:3.5, bonus_trait:'Agility', skills:['Temptation','Defense','Divination','Knives','Perform: Dancing','Tahaddi','Athletics'], techniques:{1:'The Endless Dance',2:'Flashing Talons',3:'Through the Cracks',4:'Two Knives, Two Wounds',5:'Strike to Slay'}, equipment:['Knife','Knife','Staff','Clothes','Cloak'], starting_copper:5 },
  "Ra'Shari Trader": { faction:"Ra'Shari", type:'Diplomat', integrity:2.5, bonus_trait:'Intelligence', skills:['Temptation','Commerce','Courtier','Etiquette','Lore: Underworld','Sincerity','Storytelling'], techniques:{1:'Opening Offer',2:'Acquiring the Goods',3:'Making the Deal',4:'Expediency is Important',5:'The Perfect Supplier'}, equipment:['Staff','Clothes','Cloak','Scales'], starting_copper:10 },
  "Ra'Shari Diviner": { faction:"Ra'Shari", type:'Sahir', integrity:3.5, bonus_trait:'Perception', skills:['Temptation','Divination','Medicine','Spellcraft','Lore: Theology','Perform: Dancing','Lore: Burning Sands'], techniques:{1:'The Whispers of the Song'}, equipment:['Knife','Staff','Clothes','Cloak','Traveling Pack'], starting_copper:5 },
  'Senpet Legionnaire': { faction:'Senpet', type:'Warrior', integrity:4.5, bonus_trait:'Reflexes', skills:['Battle','Defense','Hunting','Swordsmanship','Lore: Theology','Athletics','Spears'], techniques:{1:'Divine Insight',2:'Divine Strength',3:'Divine Retribution',4:'The Gods Protect Me',5:'The Gods Guide my Hand'}, equipment:['Khopesh','Chain Shirt','Sandals','Tunic'], starting_copper:5 },
  'Senpet Charioteer': { faction:'Senpet', type:'Warrior', integrity:4.5, bonus_trait:'Agility', skills:['Archery','Battle','Horsemanship','Swordsmanship','Lore: Theology','Defense','Athletics'], techniques:{1:'Ride Into Battle',2:'Swift Volley',3:'Speed is my Armor',4:'Ruthless Advance',5:'Deadly Strike'}, equipment:['Khopesh','Composite Bow','Chain Shirt','Sandals'], starting_copper:5 },
  'Senpet Sahir': { faction:'Senpet', type:'Sahir', integrity:3.5, bonus_trait:'Intelligence', skills:['Defense','Medicine','Meditation','Spellcraft','Lore: Theology','Battle','Lore: History'], techniques:{1:'By the Grace of the Gods'}, equipment:['Sandals','Tunic','Traveling Pack'], starting_copper:5 },
  'Yodotai Legionnaire': { faction:'Yodotai', type:'Warrior', integrity:4.5, bonus_trait:'Agility', skills:['Battle','Defense','Horsemanship','Lore: Yodotai History','Spears','Swordsmanship','Athletics'], techniques:{1:'Tortoise Formation',2:'In Close Quarters',3:'Deadly Strike',4:'Wedge Formation',5:'With My Brothers'}, equipment:['Gladius','Pilum','Lorica Segmentata','Sandals','Tunic'], starting_copper:5 },
  'Yodotai Mercenary': { faction:'Yodotai', type:'Diplomat', integrity:3.5, bonus_trait:'Reflexes', skills:['Intimidation','Defense','Etiquette','Spears','Swordsmanship','Sincerity','Battle'], techniques:{1:'Importance of Speed',2:'Stranger in a Foreign Land',3:'Unfriendly Glare',4:'Combat Diplomacy',5:'Hoplon Bash'}, equipment:['Gladius','Pilum','Chain Shirt','Sandals','Tunic'], starting_copper:5 },
  'Ebonite Templar': { faction:'Ebonites', type:'Warrior', integrity:5.5, bonus_trait:'Reflexes', skills:['Defense','Investigation','Lore: Law','Lore: Theology','Swordsmanship','Lore: Ebonites','Athletics'], techniques:{1:'Tapping the Inner Strength',2:'By Thy Will',3:'The Ebon Hand',4:'By Word Or By Sword',5:'Will of the Stone'}, equipment:['Longsword','Knife','Light Armor','Sturdy Clothing'], starting_copper:10 },
  'Jani': { faction:'Jackals', type:'Warrior', integrity:1.5, bonus_trait:'Agility', skills:['Athletics','Brawling','Knives','Acting','Assassin Ranged Weapons','Staves','Lore: Underworld'], techniques:{1:'Quicker Than the Eye',2:'What the Eye Sees, What the Ear Hears',3:'Strike Quickly, Strike True',4:'Seen and Not Noticed',5:'Blinding Speed'}, equipment:['Knife','Light Armor','Street Clothes'], starting_copper:1 },
  'Necromancer': { faction:'Jackals', type:'Sahir', integrity:0.5, bonus_trait:'Intelligence', skills:['Medicine','Knives','Lore: Jackal','Lore: Undead','Lore: History','Spellcraft','Staves'], techniques:{1:'Initiate of Undeath',2:'Master of Undeath and Death',3:'Creator of Undeath',4:'Leader of Undead',5:'Agent of Death'}, equipment:['Knife','Staff','Robe','Sandals'], starting_copper:2 },
  'Kabir': { faction:'Jackals', type:'Diplomat', integrity:2.5, bonus_trait:'Awareness', skills:['Courtier','Sincerity','Knives','Medicine','Craft: Poison','Sleight of Hand','Lore: Underworld'], techniques:{1:'Rotting the Foundation',2:'A Honeyed Tongue',3:'Killing with Subtlety',4:'Tearing Out the Foundation',5:'Jackal Ambassador'}, equipment:['Knife','Apothecary Kit','Clothes','Shoes'], starting_copper:2 },
  'Free Sahir': { faction:'Independent', type:'Sahir', integrity:4.5, bonus_trait:'Willpower', skills:['Etiquette','Spellcraft','Lore: Theology','Lore: History','Lore: Burning Sands','Athletics','Stealth'], techniques:{1:'Self-Taught Sorcerer'}, equipment:['Staff','Knife','Clothes','Cloak','Traveling Pack'], starting_copper:5 },
  'Alley Thug': { faction:'Independent', type:'Path', integrity:2.5, bonus_trait:'Strength', skills:['Brawling','Intimidation','Knives','Stealth','Lore: Underworld','Athletics','Sincerity'], techniques:{1:'Predator of the Alleys'}, equipment:['Knife','Street Clothes'], starting_copper:2 },
  'Scholar': { faction:'Independent', type:'Path', integrity:3.5, bonus_trait:'Intelligence', skills:['Calligraphy','Etiquette','Storytelling','Lore: History','Lore: Theology','Lore: Law','Lore: Burning Sands'], techniques:{1:'A Man of Knowledge'}, equipment:['Writing Kit','Book','Traveling Clothes'], starting_copper:5 },
  'Street Rat': { faction:'Independent', type:'Path', integrity:2.0, bonus_trait:'Agility', skills:['Athletics','Stealth','Sleight of Hand','Lore: Underworld','Brawling','Knives','Sincerity'], techniques:{1:'Master of the Streets'}, equipment:['Knife','Street Clothes'], starting_copper:1 },
};

export const WEAPONS_LIST = [
  { name:'Longsword',  dr:'3k2', skill:'Swordsmanship', price:'15c', special:'Void: +1 kept dmg' },
  { name:'Scimitar',   dr:'4k2', skill:'Swordsmanship', price:'20c', special:'Void: +1 kept dmg' },
  { name:'Shortsword', dr:'2k2', skill:'Swordsmanship', price:'7c',  special:'Void: +1 kept dmg' },
  { name:'Gladius',    dr:'2k2', skill:'Swordsmanship', price:'—',   special:'Yodotai' },
  { name:'Khopesh',    dr:'3k2', skill:'Swordsmanship', price:'—',   special:'Senpet' },
  { name:'Knife',      dr:'1k1', skill:'Knives',        price:'2c',  special:'Free draw; throwable 30ft' },
  { name:'Jambiya',    dr:'1k1', skill:'Knives',        price:'2c',  special:'Free draw; throwable 30ft' },
  { name:'Kindjal',    dr:'1k1', skill:'Knives',        price:'2c',  special:'Free draw; throwable 30ft' },
  { name:'Spear',      dr:'2k2', skill:'Spears',        price:'5c',  special:'Thrown 1k2/30ft' },
  { name:'Lance',      dr:'1k2', skill:'Spears',        price:'15c', special:'3k4 charging' },
  { name:'Khadja',     dr:'1k3', skill:'Polearms',      price:'—',   special:'Ashalan' },
  { name:'Pilum',      dr:'2k2', skill:'Spears',        price:'—',   special:'Yodotai; throwable' },
  { name:'Staff',      dr:'0k2', skill:'Staves',        price:'1c',  special:'Free Raise Knockdown' },
  { name:'Heavy Club', dr:'1k3', skill:'Heavy Weapons', price:'2c',  special:'Str 3 req' },
  { name:'Mace',       dr:'0k2', skill:'Heavy Weapons', price:'2c',  special:'Str 3 req; –10 armor TN' },
  { name:'War Axe',    dr:'0k3', skill:'Heavy Weapons', price:'1c',  special:'One-handed' },
  { name:'Standard Bow', dr:'2k2', skill:'Archery',     price:'10c', special:'Range 300ft' },
  { name:'Shortbow',   dr:'2k2', skill:'Archery',       price:'5c',  special:'Range 100ft; free draw' },
  { name:'Unarmed',    dr:'1k1', skill:'Brawling',      price:'—',   special:'Default when no weapon drawn' },
];

export const GEAR_LIST = [
  'Partial Armor (+3 TN)','Light Armor (+5 TN)','Heavy Armor (+10 TN)','Riding Armor (+8 TN)',
  'Medicine Kit','Traveling Rations','Water Skin','Rope (50 ft)','Lantern','Lantern Oil',
  'Grapple Hook','Flint and Steel','Lockpicks','Calligraphy Kit','Apothecary Kit',
  'Backpack','Tent (small)','Traveling Cloak','Suit of Clothes','Fine Clothes',
  'Sandals','Shoes','Blanket','Coin Purse','Personal Seal','Quiver (60 arrows)',
  'Musical Instrument','Book / Scroll','Writing Paper','Whetstone',
  'Generic Poison (dose)','Fire Biter (dose)','Night Milk (dose)','Snake Venom (dose)',
  'Spider Venom (dose)','Wish You Dead (dose)','Stolen Breath (dose)','Hot Madness (dose)',
  'Poison Powder (dose)','Blinding Dust (dose)',
];

export const NPC_BY_FACTION = {
  'City Guard':  { schools:['Soldier of the City Guard'] },
  'Dahab':       { schools:['Dahabi Enforcer','Dahabi Bargainer','Dahabi Merchant'] },
  'Qabal':       { schools:['Qabal Agent','Qabal Summoner'] },
  'Assassins':   { schools:['Assassin Slayer','Assassin Keeper'] },
  'Ashalan':     { schools:['Blood-Sworn','Children of Midnight','Heart-Seekers'] },
  "Ra'Shari":    { schools:["Ra'Shari Knife-Fighter","Ra'Shari Trader","Ra'Shari Diviner"] },
  'Senpet':      { schools:['Senpet Legionnaire','Senpet Charioteer','Senpet Sahir'] },
  'Yodotai':     { schools:['Yodotai Legionnaire','Yodotai Mercenary'] },
  'Ebonites':    { schools:['Ebonite Templar'] },
  'Jackals':     { schools:['Jani','Necromancer','Kabir'] },
  'Paths':       { schools:['Alley Thug','Scholar','Street Rat'] },
};

export const SETTING_FACTIONS = {
  Streets: { primary:['City Guard','Dahab','Jackals','Merchants'], secondary:['Qabal',"Ra'Shari",'Assassins'] },
  Sewers:  { primary:['Jackals','Monsters'], secondary:['Assassins','Rogues / Foreigners'] },
  Desert:  { primary:["Ra'Shari",'Monsters'], secondary:['Yodotai','Assassins','Senpet'] },
  Palace:  { primary:['City Guard','Senpet','Dahab'], secondary:['Ashalan','Qabal'] },
  Indoors: { primary:['Dahab','Merchants','Rogues / Foreigners'], secondary:['City Guard','Jackals'] },
};

export const ADVANTAGES = [
  { name:'Ally', cost:1, type:'Social', desc:'A reliable contact who will help you.' },
  { name:"Benten's Blessing", cost:3, type:'Mental', desc:'+1k0 to all Social rolls.' },
  { name:'Clear Thinker', cost:2, type:'Mental', desc:'Immune to mind-affecting magic.' },
  { name:'Dangerous Beauty', cost:2, type:'Social', desc:'+1k0 to social rolls vs those attracted to you.' },
  { name:'Fame', cost:1, type:'Social', desc:'+1 Reputation.' },
  { name:'Forbidden Knowledge', cost:2, type:'Mental', desc:"Know something you shouldn't." },
  { name:'Great Destiny', cost:5, type:'Spiritual', desc:'Once per session: reroll any one roll.' },
  { name:'Hands of Stone', cost:2, type:'Physical', desc:'+1k0 to Brawling damage.' },
  { name:'Inheritance', cost:1, type:'Material', desc:'Start with a useful item or small sum.' },
  { name:'Inner Gift (Touch)', cost:3, type:'Spiritual', desc:'Sense Sahir magic with a touch.' },
  { name:'Irreproachable', cost:2, type:'Social', desc:'+1k0 to Sincerity rolls.' },
  { name:'Large', cost:3, type:'Physical', desc:'+1 Strength, +1 Stamina.' },
  { name:'Magic Resistance', cost:4, type:'Spiritual', desc:'Difficult to affect with magic. (Yodotai: 3 pts)' },
  { name:'Quick', cost:3, type:'Physical', desc:'+1k0 to Initiative.' },
  { name:'Strength of the Earth', cost:2, type:'Physical', desc:'Ignore one wound penalty rank.' },
  { name:'Touch of the Desert', cost:2, type:'Spiritual', desc:'Sense approaching desert threats.' },
  { name:'Wealthy', cost:3, type:'Material', desc:'Start with significantly more copper.' },
];

export const DISADVANTAGES = [
  { name:'Antisocial', value:2, type:'Social', desc:'–1k0 to all Social rolls.' },
  { name:'Bad Reputation', value:1, type:'Social', desc:'–1 Reputation.' },
  { name:'Blackmailed', value:2, type:'Social', desc:'Someone holds damaging info over you.' },
  { name:"Can't Lie", value:2, type:'Mental', desc:'Cannot make deceptive Sincerity rolls.' },
  { name:'Compulsion', value:1, type:'Mental', desc:'Compelled to perform a specific behavior.' },
  { name:'Dark Secret', value:2, type:'Social', desc:'You hide something that would ruin you.' },
  { name:'Dependents', value:2, type:'Social', desc:'Responsible for others who need protection.' },
  { name:'Doubt', value:2, type:'Mental', desc:'–1k0 to rolls for one school skill.' },
  { name:'Enemies', value:2, type:'Social', desc:'A faction actively works against you.' },
  { name:'Frail', value:3, type:'Physical', desc:'–1 Stamina.' },
  { name:'Greedy', value:2, type:'Mental', desc:'Must resist financial gain (Willpower roll).' },
  { name:'Haunted', value:3, type:'Spiritual', desc:'Spirits disturb your sleep and focus.' },
  { name:'Obligation', value:2, type:'Social', desc:'You owe someone something significant.' },
  { name:'Overconfident', value:1, type:'Mental', desc:'Always volunteers for dangerous tasks.' },
  { name:'Small', value:3, type:'Physical', desc:'–1 Strength.' },
  { name:'Unlucky', value:3, type:'Spiritual', desc:'Once per session GM may force a reroll.' },
];

export const FACTIONS_DATA = [
  { name:'City Guard',          tagline:'The only legal armed force in the Jewel.',              rep:0,  page:100, loreKey:'caliphate',  avatar:'warrior',    color:'#4a6a8a' },
  { name:'Dahab',               tagline:'The merchant houses and their shadowy conspiracy.',       rep:0,  page:104, loreKey:'dahab',      avatar:'courtier',   color:'#8a6a20' },
  { name:'Qabal',               tagline:"Masters of summoning magic, keepers of Hakhim's Seal.", rep:0,  page:112, loreKey:'qabal',      avatar:'sahir',      color:'#5a3a7a' },
  { name:'Assassins',           tagline:'The Order of the Mountain, blades for hire.',            rep:-1, page:151, loreKey:'assassins',  avatar:'assassin',   color:'#6a2a2a' },
  { name:'Ashalan',             tagline:'Ancient immortals who remember the Day of Wrath.',       rep:0,  page:127, loreKey:'ashalan',    avatar:'ashalan',    color:'#2a5a4a' },
  { name:"Ra'Shari",            tagline:'Nomadic traders and diviners of the Great Caravan.',     rep:1,  page:173, loreKey:'rashari',    avatar:'nomad',      color:'#7a4a20' },
  { name:'Senpet',              tagline:'Priests and warriors of the Ten Thousand Gods.',         rep:0,  page:197, loreKey:'senpet',     avatar:'legionnaire',color:'#8a5a20' },
  { name:'Yodotai',             tagline:'Legionnaires of the ever-expanding Empire.',             rep:0,  page:221, loreKey:'yodotai',    avatar:'legionnaire',color:'#5a4a3a' },
  { name:'Ebonites',            tagline:'Templars of the Order of the Ebon Hand.',               rep:0,  page:261, loreKey:'ebonites',   avatar:'templar',    color:'#2a2a2a' },
  { name:'Jackals',             tagline:'A criminal cult of necromancers and diplomats.',         rep:-2, page:245, loreKey:'jackals',    avatar:'rogue',      color:'#3a2a4a' },
  { name:'Merchants',           tagline:'Independent traders not affiliated with Dahab.',         rep:0,  page:104, loreKey:'dahab',      avatar:'merchant',   color:'#6a5a30' },
  { name:'Rogues / Foreigners', tagline:'Criminals, wanderers, visitors from distant lands.',    rep:0,  page:83,  loreKey:'city',       avatar:'rogue',      color:'#4a4a4a' },
  { name:'Monsters',            tagline:'Creatures of the desert, sewers, and darker places.',   rep:0,  page:285, loreKey:'jinn',       avatar:'creature',   color:'#3a3a2a' },
];

// Faction avatar descriptors used in character creation
export const FACTION_AVATARS = {
  warrior:     { icon: '⚔',  label: 'Warrior',     desc: "Armed and trained for combat in the Jewel's streets." },
  courtier:    { icon: '💰', label: 'Merchant',    desc: 'Commerce, influence, and the art of the deal.' },
  sahir:       { icon: '✦',  label: 'Sahir',       desc: "Scholar of Hakhim's Seal and the Five Disciplines." },
  assassin:    { icon: '🗡', label: 'Assassin',    desc: 'The blade in the dark, the smile at the feast.' },
  ashalan:     { icon: '◈',  label: 'Ashalan',     desc: 'Tattooed immortal, survivor of the Day of Wrath.' },
  nomad:       { icon: '🌙', label: 'Nomad',       desc: 'Wagon-dweller, keeper of ancient knowledge.' },
  legionnaire: { icon: '🛡', label: 'Legionnaire', desc: 'Soldier of a great military tradition.' },
  templar:     { icon: '◆',  label: 'Templar',     desc: "Guardian of the Ebon Stone's legacy." },
  rogue:       { icon: '👁', label: 'Rogue',       desc: 'Operating outside the law and faction politics.' },
  merchant:    { icon: '⚖', label: 'Merchant',    desc: "Independent trader in the world's greatest market." },
  creature:    { icon: '🔥', label: 'Creature',    desc: 'Something other than human walks these streets.' },
};

// ── Sahir Spell Data ──────────────────────────────────────────────────────────
export const SAHIR_DISCIPLINES = [
  {
    id: 'summoning', name: 'Summoning', element: 'Air', color: '#a0c0e0',
    types: [
      { id: 'jinn', name: 'Jinn Spells', spells: [
        { level: 1, name: 'Jinn Summoning 1', tn: 10, desc: 'Cast on Hakhim\'s Seal before summoning a Jinn. Gain bonus unkept dice equal to Insight Rank to Commerce/Awareness rolls to bargain with the Jinn.' },
        { level: 2, name: 'Jinn Summoning 2', tn: 15, desc: 'No longer need Servant of Smokeless Fire advantage (refund 4 XP). Time to summon a Jinn is halved.' },
        { level: 3, name: 'Jinn Summoning 3', tn: 20, desc: 'Sever a Jinn\'s anchor to this world, banishing it instantly. Jinn rolls Void vs TN equal to Spellcasting Roll to avoid banishment.' },
      ]},
      { id: 'primal', name: 'Primal Elements', spells: [
        { level: 1, name: 'Primal Elements 1', tn: 10, desc: 'Named element moves at your command (water flows uphill, windstorm stops, fire crawls across stone). Matter equal to own weight. If used to heave stones, resolve as Athletics/Agility vs Armor TN.' },
        { level: 2, name: 'Primal Elements 2', tn: 15, desc: 'Summon one of the four elements to yourself, or destroy some in vicinity. Matter no greater than a fist in size.' },
        { level: 3, name: 'Primal Elements 3', tn: 20, desc: 'Render self or touched target immune to one element for one hour: Air (no need to breathe), Earth (pass through solid barriers), Fire (immune to burning), Water (breathe underwater).' },
      ]},
      { id: 'implements', name: 'Implements', spells: [
        { level: 1, name: 'Implement Summoning 1', tn: 10, desc: 'Temporarily bend and warp objects as desired while maintaining concentration. Shape change cannot break the object. Duration: concentration, then one hour.' },
        { level: 2, name: 'Implement Summoning 2', tn: 15, desc: 'Call objects to you or send them elsewhere. Must have intimate knowledge of the object or destination. Counts as disarm maneuver if used on held weapon.' },
        { level: 3, name: 'Implement Summoning 3', tn: 20, desc: 'Move any perceived object with will alone, using Air instead of Strength or Agility. May affect living creatures. Requires full concentration.' },
      ]},
    ]
  },
  {
    id: 'celestials', name: 'Celestials', element: 'Void', color: '#c0a0e0',
    types: [
      { id: 'farsight', name: 'Farsight', spells: [
        { level: 1, name: 'Farsight 1', tn: 10, desc: 'Telescopic vision. +3k0 to total of any sight-based Perception Rolls. Duration: one hour.' },
        { level: 2, name: 'Farsight 2', tn: 15, desc: 'With a placid pool or mirror, remotely view a familiar location. Sight only unless 2 Raises spent to also transmit sounds. Duration: concentration.' },
        { level: 3, name: 'Farsight 3', tn: 20, desc: 'If suspecting magical observation, cast this to end the other sahir\'s observation. Observer rendered temporarily blind for one minute and suffers Wounds equal to your Void Ring.' },
      ]},
      { id: 'astrology', name: 'Astrology', spells: [
        { level: 1, name: 'Astrology 1', tn: 10, desc: 'Requires 10 minutes, must be cast at night. Gives an oblique clue about what the next 24 hours holds for an individual. Additional clue per 2 Raises.' },
        { level: 2, name: 'Astrology 2', tn: 15, desc: 'Refinement of Astrology 1. May now ask after places or organizations as well as individuals. Additional information per Raise.' },
        { level: 3, name: 'Astrology 3', tn: 20, desc: 'Cast at dusk: you are no longer a valid target for Mastery Level 1 spells for one night (obscures your fate from diviners). Additional targets per Raise.' },
      ]},
      { id: 'obscurement', name: 'Obscurement', spells: [
        { level: 1, name: 'Obscurement 1', tn: 10, desc: 'Shroud yourself or an object from magical detection. Scrying and divination effects targeting you must overcome your Void Ring in unkept dice.' },
        { level: 2, name: 'Obscurement 2', tn: 15, desc: 'Extend the obscurement to a small area or group. Diviners attempting to scry within the area suffer penalties equal to your Void Ring.' },
        { level: 3, name: 'Obscurement 3', tn: 20, desc: 'Create a zone of magical silence. No spells may be cast within without a Contested Spellcraft roll against your casting total.' },
      ]},
    ]
  },
  {
    id: 'blackmagic', name: 'Black Magic', element: 'Earth', color: '#80c090',
    types: [
      { id: 'ghul', name: 'Ghul Creation', spells: [
        { level: 1, name: 'Ghul Creation 1', tn: 10, desc: 'Take hold of a ghul\'s mind with a barked order. Duration: one hour. Two sahir controlling the same ghul make a Contested Willpower Roll.' },
        { level: 2, name: 'Ghul Creation 2', tn: 15, desc: 'Create a ghul using a 3-hour ritual and a knife to excise the corpse\'s heart. If using Ghul Creation 1 on your own ghul, duration is 1 day.' },
        { level: 3, name: 'Ghul Creation 3', tn: 20, desc: 'Destroy ghuls with little effort. Contested Roll: your Earth/Sahir Rank vs Ghul\'s Insight Rank/Earth. Ghul Lords and intelligent ghul possess Insight Ranks.' },
      ]},
      { id: 'lifemagic', name: 'Life Magic', spells: [
        { level: 1, name: 'Life Magic 1', tn: 10, desc: 'Heal Xk1 Wounds (X = Earth Ring) on self or touched target. Raises: +0k1 per Raise.' },
        { level: 2, name: 'Life Magic 2', tn: 15, desc: 'Cures any mundane illness. With 2 Raises, cures magically-inflicted mundane illness. One disease at a time.' },
        { level: 3, name: 'Life Magic 3', tn: 20, desc: 'If cast before either preceding Life spell (within 3 rounds), heals a number of persons equal to twice Insight Rank within arm\'s reach (max 5\'). Maximum 5 targets.' },
      ]},
      { id: 'deathmagic', name: 'Death Magic', spells: [
        { level: 1, name: 'Death Magic 1', tn: 10, desc: 'Inflicts Wounds (XkX, X = Sahir Class Rank) on a target within 20\'. Range: 20\'.' },
        { level: 2, name: 'Death Magic 2', tn: 15, desc: 'Inflict a wasting curse on a target. Each day they fail to resist, they lose Stamina. Duration: one hour, or until dispelled.' },
        { level: 3, name: 'Death Magic 3', tn: 20, desc: 'Channel the power of death itself. Devastating attack that ignores armor and inflicts maximum damage on a critical success.' },
      ]},
    ]
  },
  {
    id: 'control', name: 'Control', element: 'Water', color: '#60b0d0',
    types: [
      { id: 'influence', name: 'Influence', spells: [
        { level: 1, name: 'Influence 1', tn: 10, desc: 'Subtly push a target\'s emotions in a desired direction. Target is unaware of the manipulation unless they succeed a Contested Willpower roll.' },
        { level: 2, name: 'Influence 2', tn: 15, desc: 'Plant a specific suggestion in the target\'s mind. They believe the thought is their own. Must be phrased as a simple imperative.' },
        { level: 3, name: 'Influence 3', tn: 20, desc: 'Dominate a target\'s will entirely for a short duration. They obey direct commands, though will not harm themselves or loved ones.' },
      ]},
      { id: 'illusion', name: 'Illusion', spells: [
        { level: 1, name: 'Illusion 1', tn: 10, desc: 'Create a minor illusion affecting one sense. Observers may attempt Perception roll vs your casting total to see through it.' },
        { level: 2, name: 'Illusion 2', tn: 15, desc: 'Create a full multi-sense illusion up to the size of a person. Requires concentration to maintain complex motion.' },
        { level: 3, name: 'Illusion 3', tn: 20, desc: 'Create a perfect illusion of any scene or person you have witnessed. Persists without concentration for up to one hour.' },
      ]},
      { id: 'transformation', name: 'Transformation', spells: [
        { level: 1, name: 'Transformation 1', tn: 10, desc: 'Alter the superficial appearance of an object or willing target. Cannot change size or fundamental nature.' },
        { level: 2, name: 'Transformation 2', tn: 15, desc: 'Transform a target into a different form of similar size. Target retains their mind and skills but gains physical traits of the new form.' },
        { level: 3, name: 'Transformation 3', tn: 20, desc: 'Transform a target into any form you choose, regardless of size. The transformation is permanent until dispelled.' },
      ]},
    ]
  },
  {
    id: 'blessings', name: 'Blessings & Curses', element: 'Fire', color: '#e09050',
    types: [
      { id: 'blessingtype', name: 'Blessings', spells: [
        { level: 1, name: 'Blessing 1', tn: 10, desc: 'Grant a target a +1k0 bonus to a specific Skill for one hour. Cannot stack with other Blessings.' },
        { level: 2, name: 'Blessing 2', tn: 15, desc: 'Grant a target a +1k1 bonus to a specific Skill for one hour. May affect a group of up to your Fire Ring in targets.' },
        { level: 3, name: 'Blessing 3', tn: 20, desc: 'Grant a target a Free Raise on all rolls of a specific Skill for one hour. The blessing is potent enough to affect Void-related rolls.' },
      ]},
      { id: 'cursetype', name: 'Curses', spells: [
        { level: 1, name: 'Curse Magic 1', tn: 10, desc: 'Select a single Skill and task. Target suffers -2k0 to rolls of that Skill toward that task for one hour. A specific task may only receive one Curse, but a Skill can receive any number.' },
        { level: 2, name: 'Curse Magic 2', tn: 15, desc: 'As Curse 1 but penalty is -2k1. Duration: one hour. Raises extend duration by one hour each.' },
        { level: 3, name: 'Curse Magic 3', tn: 20, desc: 'As Curse 2 (-2k1), but may be cast as a Simple Action. The curse is more difficult to detect and remove.' },
      ]},
      { id: 'warding', name: 'Wards', spells: [
        { level: 1, name: 'Ward 1', tn: 10, desc: 'Inscribe a ward on an object or threshold. The ward triggers when a specific condition is met, alerting you and causing minor harm (1k1 wounds) to the transgressor.' },
        { level: 2, name: 'Ward 2', tn: 15, desc: 'Inscribe a powerful ward. Triggers deal significant harm (3k2 wounds) and may immobilize the transgressor for one round.' },
        { level: 3, name: 'Ward 3', tn: 20, desc: 'Inscribe an unbreakable ward. Triggers deal severe harm and eject the transgressor from the warded area. The ward persists until physically destroyed.' },
      ]},
    ]
  },
];

// ── Cokaloi Spell Data (Ra'Shari Diviner only) ────────────────────────────────
export const COKALOI_CATEGORIES = [
  {
    id: 'dawn', name: 'Dawn', element: 'Fire', color: '#e8c050',
    desc: 'Fate and skill manipulation — blessings and curses. May be learned in any order.',
    spells: [
      { level: 1, name: 'The First Blessing', tn: 10, desc: 'Target may reroll any 1 die on a roll of the designated Skill. Duration: one day or night.' },
      { level: 1, name: 'The First Curse', tn: 10, desc: 'Target must reroll the highest die on a roll of the designated Skill. Duration: one day or night.' },
      { level: 2, name: 'The Second Blessing', tn: 15, desc: 'Target may reroll up to 2 dice on a roll of the designated Skill. Duration: one day or night.' },
      { level: 2, name: 'The Second Curse', tn: 15, desc: 'Target must reroll up to 2 dice on a roll of the designated Skill. Duration: one day or night.' },
      { level: 3, name: 'The Third Blessing', tn: 20, desc: 'Target may reroll up to 3 dice. Duration: one day or night.' },
      { level: 3, name: 'The Third Curse', tn: 20, desc: 'Target must reroll up to 3 dice. Duration: one day or night.' },
      { level: 4, name: 'The Fourth Blessing', tn: 25, desc: 'As Third Blessing, but target may also change one die to an unexploded 10.' },
      { level: 4, name: 'The Fourth Curse', tn: 25, desc: 'As Third Curse, but target must also change one die to a 1.' },
      { level: 5, name: 'The Fifth Blessing', tn: 30, desc: 'As Third Blessing, but target may change two dice to unexploded 10s.' },
      { level: 5, name: 'The Fifth Curse', tn: 30, desc: 'As Third Curse, but target must change two dice to 1s.' },
    ]
  },
  {
    id: 'dusk', name: 'Dusk', element: 'Air', color: '#9090d0',
    desc: 'Social manipulation and illusion. May only be cast upon beings with whom you can make vocal or eye contact.',
    spells: [
      { level: 1, name: 'I am not Him', tn: 10, desc: 'Target cannot suffer penalties to Acting skill rolls for 1 hour, OR gains +5 to Acting rolls for 5 minutes.' },
      { level: 1, name: 'A Good Friend', tn: 10, desc: 'Bypasses normal suspicion. Target becomes open to the possibility you are a fundamentally good person. Duration: 5 minutes.' },
      { level: 1, name: 'Propriety', tn: 10, desc: 'Make an Awareness roll to alter a being\'s attitude toward you in a positive direction. +2 targets per Raise. Duration: 5 minutes.' },
      { level: 2, name: 'Business as Usual', tn: 15, desc: 'Functions as Propriety but affects everyone within 25\' radius, with four Free Raises. Duration: 5 minutes.' },
      { level: 2, name: 'I am not Here', tn: 15, desc: 'Increases TN of all Skill Rolls to spot you by twice the number of people within 25\'. Duration: 5 minutes.' },
      { level: 2, name: 'Instant Expert', tn: 15, desc: 'Appear to be an expert on any topic. Bonus equal to twice Insight Rank to Social Skill Rolls involving your expertise. Duration: 5 minutes.' },
      { level: 3, name: 'Above Reproach', tn: 20, desc: 'Area becomes above reproach; not searched when things go missing. Concentration required. Up to 100 persons in one encampment or large building.' },
      { level: 3, name: 'Hiding from the Sun', tn: 20, desc: 'Once out of direct sunlight, effectively disappear. Investigation Rolls to find you suffer +40 TN Penalty. Duration: concentration.' },
      { level: 3, name: 'A Potential Ally', tn: 20, desc: 'Appear extremely trustworthy. People who collect Allies seek you out. Allies obtained this way cost 1 XP less. Duration: 5 minutes.' },
      { level: 4, name: 'I am Someone Else', tn: 25, desc: 'Appear as an entirely different humanoid person. Illusion adjusts as you move but does not hold to tactile inspection. Covers voice. Duration: one hour.' },
      { level: 4, name: 'This is Reasonable', tn: 25, desc: 'May say anything — listeners find it reasonable and correct. Cannot convince anyone into obvious danger. Duration: 5 minutes.' },
      { level: 5, name: 'For All of Us', tn: 30, desc: 'Become any lower-level Dusk Cokalos with Area of Effect changed to up to 100 willing targets.' },
      { level: 5, name: 'Your Heart is in my Hands', tn: 30, desc: 'Fill target with any emotion they have experienced before. Target suffers effects of a single Advantage or Disadvantage applicable to the emotion. Duration: one hour.' },
    ]
  },
  {
    id: 'night', name: 'Night', element: 'Water', color: '#50b090',
    desc: 'Healing and animal communion. May only target one person at a time.',
    spells: [
      { level: 1, name: 'The First Purity', tn: 10, desc: 'Any nonmagical disease or poison in 50 lbs of food or 10 gallons of water is negated. Duration: permanent.' },
      { level: 1, name: 'The First Wholeness', tn: 10, desc: 'Complements Medicine Skill healing. If Medicine roll succeeds, gain +1k1 bonus to wounds healed. Range: touch.' },
      { level: 2, name: 'The Second Purity', tn: 15, desc: 'When using Medicine to treat poison or disease, receive 4 Free Raises for identifying it. Range: touch.' },
      { level: 2, name: 'Tame Beast', tn: 15, desc: 'Any animal targeted is considered tame for Animal Handling skill. Duration: permanent. Range: touch.' },
      { level: 3, name: 'Command Beast', tn: 20, desc: 'Brief control of an animal\'s mind. Minds merge momentarily. Duration: one minute per Willpower Rank. Range: 25\'.' },
      { level: 3, name: 'The Third Purity', tn: 20, desc: 'Literally extract a poison or disease from the body, healing effect completely. Range: touch.' },
      { level: 3, name: 'The Third Wholeness', tn: 20, desc: 'After treating with Medicine, target\'s natural Wound recovery is doubled for three days. Full rest doubles it again.' },
      { level: 4, name: 'The Fourth Purity', tn: 25, desc: 'Retrieve foul substances purified as a fine powder. Can be reapplied. Range: touch. Duration: permanent.' },
      { level: 4, name: 'The Fourth Wholeness', tn: 25, desc: 'If more than one successful Medicine attempt in a day, may heal the same number of wounds on each subsequent attempt as the first.' },
      { level: 5, name: 'The Fifth Purity', tn: 30, desc: 'Use any lesser Purity Cokalos on two targets simultaneously. Range: touch.' },
      { level: 5, name: 'Of One Body', tn: 30, desc: 'Transform, joining form with a touched beast. Retain all Skills and Cokaloi; gain all special abilities of the beast; use highest Traits of both. Duration: one hour.' },
    ]
  },
];

export const IS_SAHIR_SCHOOL = (school) => [
  'Qabal Summoner', 'Dahabi Bargainer', 'Children of Midnight',
  'Senpet Sahir', 'Necromancer', 'Heartless Khadi', 'Free Sahir'
].includes(school);

export const IS_COKALOI_SCHOOL = (school) => school === "Ra'Shari Diviner";

// ── Technique Descriptions (LBS 4th Ed Conversion) ───────────────────────────
// All text from the LBS L5R RPG 4th Edition Conversion document (AEG 2010).
export const TECHNIQUE_DESCRIPTIONS = {
  // ── City Guard ──────────────────────────────────────────────────────────
  'Trained For War': 'Add your Class Rank to rolls resisting duties (Fear Rolls, Contested Social Rolls such as Intimidation or Temptation). Subtract your Class Rank from Wound penalties. When attacking using a Class Skill and spending a Void Point, gain +2k1 instead of +1k1.',
  'Strike With Fury': 'You receive a +1k0 bonus to Initiative Rolls. You receive a +1k0 bonus to Attack Rolls while in the Full Attack Stance.',
  'Implacable Foe': 'Choose any one weapon skill you possess: you receive a free Emphasis of your choice in that skill. When attacking with a melee weapon for which you possess the relevant emphasis you may make attacks as a Simple Action.',
  'Instrument of the Caliph': 'Add twice your Class Rank to rolls resisting duties. When spending Void to reduce damage, any remaining wounds incurred from that strike are not applied until the Reactions Stage of the current round.',
  'The Sublime Warrior': 'You may spend a Void Point to negate all TN penalties for one round, including Wound penalties. When spending a Void Point to increase your Armor TN or to add to your Initiative score, the benefit is increased by 5.',

  // ── Free Sahir ─────────────────────────────────────────────────────────
  'Self-Taught Sorcerer': 'You receive a +1k0 bonus to your Initiative Rolls for each rank you possess in this Class. When learning magic, you do so in the same manner as a Qabal Summoner. However, you may only learn or improve 2 Disciplines at each Insight Rank, rather than 3.',

  // ── Dahabi Enforcer ────────────────────────────────────────────────────
  'Moonless Night': 'You gain a +1k0 bonus to Attack and Damage Rolls while in the Full Attack Stance. Your penalties for fighting in poor visibility conditions and in areas of difficult terrain are halved, round down.',
  'Dangerous Maneuvers': 'You gain a +1k1 bonus to all Contested Strength Rolls and +1k0 to all Damage Rolls during a grapple. Opponents suffer a -1k0 penalty to all Skill rolls for each ally of theirs you have reduced to Down or Out. Opponents only suffer the highest dice penalty when facing multiple Dahabi Enforcers — the effect is not cumulative. Mindless enemies or those immune to Fear ignore this effect.',
  'Show of Force': 'When attacking unarmed or using weapons with the Warrior keyword, you may make attacks as Simple Actions.',
  'Bitter Shadows': 'You now gain +2k2 to all Contested Strength Rolls and +2k0 to all Damage Rolls during a grapple, replacing the benefit gained at Rank 2.',
  'Final Strike': 'Once per skirmish you may spend a Void Point to take a Complex Action or Simple Actions as normal while in the Center Stance. You gain the benefits of Center Stance this round in addition to the round following its adoption. You also gain +0k2 to all Damage Rolls while in the Center Stance and the round following its adoption.',

  // ── Dahabi Bargainer ───────────────────────────────────────────────────
  'Penetrating Words': 'When casting a Control spell you may spend a Void Point to add a number of hours to its Duration equal to your Rank in this Class. You receive a +1k1 bonus to Contested Rolls bargaining with Jinn for services.',

  // ── Dahabi Merchant ────────────────────────────────────────────────────
  'Master of the Subtle Flow': 'You receive a +2k0 bonus to all Commerce Skill Rolls. You receive a +1k0 bonus to Contested Sincerity and Temptation Skill Rolls. You may purchase the Wealthy Advantage for one point less (minimum 1).',
  'Upstanding Citizen': 'If an opponent declares any Raises on a Contested Commerce, Sincerity or Temptation Skill Roll initiated against you, you gain +2k0 to your roll.',
  'An Eye for a Deal': 'When spending Void Points on non-Weapon Skill Rolls, you add your Class Rank to the total of the roll. Anyone with the Greedy Disadvantage cannot explode or re-roll any of their dice in Contested Social Rolls against you.',
  'Silver Tongued Devil': "A number of times per session equal to your Class Rank, if you have failed a Sincerity Social Skill Roll, you may re-roll it as a Commerce Social Skill Roll instead. You must take the Commerce result. You may negate the benefit of an opponent's Irreproachable or Clear Thinker Advantages when making a Contested Social Roll. When purchasing new ranks in the Wealthy advantage during play, the gain in Copper is doubled.",
  'Merchant King': 'When making an uncontested Social Skill Roll for which you call no Raises, you gain +5k0 to the roll.',

  // ── Qabal Agent ────────────────────────────────────────────────────────
  'No One of Import': 'You learn a Mastery level 1 Control Spell, which you may cast with subtlety without the usual Awareness/Stealth Roll. Your Qabal Agent Class Rank counts as ranks of the Sahir School for determining your ability to cast Control Spells. Opponents suffer a -1k0 penalty on all rolls to determine if you are lying.',
  'A Good Excuse': 'The TN of rolls made to determine your Integrity or identity are increased by a further 10 (cumulative with the Bland Advantage). You gain a +2k0 bonus to all Sincerity (Deceit) Rolls.',
  'Unassailable Reputation': 'You learn a Mastery level 1 or 2 Control Spell, castable with subtlety. You gain a +1k0 bonus to all Contested Social Skill Rolls you do not initiate.',
  'The Ordered Bolthole': 'You gain a +2k0 bonus to all Stealth Rolls. You may spend an amount of time determined by the GM to conceal evidence or make a building inconspicuous. Anyone making an Investigation Roll on the scene suffers a -Xk0 penalty, where X is your Class Rank.',
  'Pillar of the Community': 'You learn a Mastery level 1, 2 or 3 Control Spell and a Mastery level 1, 2 or 3 Blessing or Curses Spell, both castable with subtlety. You may select spells without having the previous ranks. When an opponent makes an Investigation Skill Roll against you, you may spend a Void Point to prevent their dice from exploding.',

  // ── Qabal Summoner ─────────────────────────────────────────────────────
  'The Crucible of Knowledge': 'At Rank one and each Class Rank thereafter, choose 1 type of spell you know. You function as if you possess a skill emphasis when making Spellcasting Rolls for that type. Select one discipline; you gain a +1k1 bonus when casting spells of that discipline.',

  // ── Blood-Sworn ────────────────────────────────────────────────────────
  'Blessed by the Crystal': "You may pass impressions and emotions to others with this technique within 500' without speech, and sense their position within 500' if they wish to be sensed. You add your Class Rank to all Rolls to resist Fear, Intimidation, Temptation and effects intended to prevent you from defending your people.",
  'Your Blood is My Blood': "A number of times per round equal to your Class Rank, you may absorb an amount of damage up to your Stamina + Insight Rank taken by an ally within 50', transferring those wounds to yourself.",
  'Fortification in Form': 'You gain a special form of Reduction equal to your Earth Ring. This Reduction stacks with Reduction from armor or spells, but also applies (without stacking with other sources) to wounds taken from non-physical sources, such as magic.',
  'To Fight for the Future': 'Making an attack is a Simple Action for you.',
  'One is Never Truly Alone': "If you are surrounded on three or more sides by enemies, or fighting with no allies within 300' of you, your Strength increases by 5 and you gain an additional Wound Rank at the Nicked Wound Penalty level. Any wounds suffered remain, which may result in greater wound penalties or even death.",

  // ── Children of Midnight ───────────────────────────────────────────────
  'Wisdom of the Stars': 'The Sahir gains a Free Raise to spells from the Celestial Discipline. A number of times per day equal to their Class Rank as a Free Action they may switch this Free Raise to any other Discipline they wish, but suffer a -1k0 penalty to Spellcasting Rolls of other Disciplines for the same duration.',

  // ── Heart-Seekers ──────────────────────────────────────────────────────
  'Truth is My Ally': 'You gain a +2k0 bonus to all rolls involving finding something hidden or concealed, and against effects (mundane or magical) which would alter or mislead your perceptions.',
  'Diligence is the Best Teacher': 'You gain a Free Raise to all Perception or Awareness based rolls.',
  'One Mind, One Action': "You gain a bonus equal to 2 x your Rank in this Class to your Armor TN. When targeted by a spell, you may make an Intelligence/Spellcraft Roll vs. a TN equal to the Spellcasting Roll to avoid the spell's effects. If sufficient cover is available, you may instead make the roll using Agility/Stealth (Sneaking).",
  'Bane of the Heartless': 'Making an attack with an Ashalan Weapon is a Simple Action for you. You may make a special attack requiring 3 Raises; your opponent must succeed at a Void Roll vs. TN 5 x your Insight Rank or suffer a +30 TN penalty to all Skill or Spellcasting Rolls and have their Water Ring reduced by your Rank in this Class for a number of rounds equal to your Rank in this Class.',
  'My Will is My Fortress': "All Spells, Skills or other effects that would affect your mind have their TN increased by 5 x your Insight Rank. If you ever find a Khadi's heart, you are utterly unaffected by that Khadi's magic while you hold it.",

  // ── Assassin Slayer ────────────────────────────────────────────────────
  'All Shadows Walk in the Light': 'You gain a +1k0 bonus to all Acting, Sincerity (Deceit), Etiquette and Stealth Rolls. You gain +1k0 on Damage Rolls against opponents unaware of your presence.',
  'Rite of Assassination': 'At the beginning of each day, you may nominate a target as subject to your Rite of Assassination. You gain a bonus to your Armor TN equal to your Stealth Skill Ranks; this bonus is doubled against the target of your Rite while facing them in combat or in Tahaddi Duels.',
  'Let Him Bleed': 'Attacking a lone opponent or the target of your Rite of Assassination is a Simple Action for you.',
  'Blood Calls for Blood': 'When facing a lone opponent or the target of your Rite, you gain a bonus to all Attack and Contested Rolls equal to your Stealth Skill, and your Raises on Attack Rolls are no longer limited in any way.',
  'Swifter Than Life Itself': "Once per day when ambushing an opponent, facing a lone opponent, or facing the target of your Rite, you may switch your Initiative Score with your opponent's at the end of the Initiative Stage.",

  // ── Assassin Keeper ────────────────────────────────────────────────────
  "The Keeper's Courage": 'You gain a +1k0 bonus to all Rolls involving the Perception Trait. When inflicting Wounds to an opponent, you may ignore half of their Reduction rating (round up).',
  "The Keeper's Judgment": 'When attacking an opponent, you may choose to disable them rather than wound them — dealing no damage, but inflicting the Dazed Conditional Effect on them instead.',
  "The Keeper's Justice": 'Making an Attack which does not inflict damage (such as the Rank 2 Technique or initiating a grapple) is a Simple Action for you. If you make an attack as a Complex Action and miss your opponent you may immediately use the Rank 2 Technique as a Free Action.',
  "The Keeper's Art": 'The difficulty of resisting all Conditional Effects you inflict is raised by twice your Class Rank. When attacking a Dazed opponent you may make 1 Raise on your Attack Roll; if successful that opponent is Fatigued until the end of the Skirmish.',
  'By the Force of Will Alone': 'When adopting the Full Defense Stance you may choose one opponent: they must spend two Void Points to declare an attack against you. When adopting the Full Attack Stance you may spend a Void Point and choose one opponent: your Attack Rolls against them ignore all bonuses to their Armor TN from Stance, Skills, Mastery Abilities, Spells, Kiho or Techniques.',

  // ── Assassin Duelist ───────────────────────────────────────────────────
  'The Tiger Claw Cut': 'You gain a +2k1 bonus to all rolls while in the Center Stance.',
  'No Escape': 'Treat as the Spinning Blades style Kata from L5R 4th Edition. When fighting with a weapon in each hand, the Extra Attack maneuver costs only 3 Raises. You may not increase damage via Raises on either attack.',
  'The Final Strike': 'You may spend any amount of Void to enhance Damage Rolls during a Tahaddi Duel.',

  // ── Ra'Shari Knife-Fighter ─────────────────────────────────────────────
  'The Endless Dance': 'You gain a bonus to your Armor TN equal to your Perform (Dance) Skill when not in heavy armor or similarly encumbered. You gain a +1k0 bonus on Initiative Rolls.',
  'Flashing Talons': "You may throw knives accurately (without TN penalty) up to 60'. You gain a +1k0 bonus to Damage Rolls with bladed weapons.",
  'Through the Cracks': 'If fighting unarmed or wielding only knives, the Extra Attack maneuver only costs 3 Raises. You gain a further +1k0 bonus to Initiative Rolls (+2k0 in total).',
  'Two Knives, Two Wounds': 'Making attacks with a knife or an unarmed strike is a Simple Action for you.',
  'Strike to Slay': 'When attacking with a knife or unarmed strike, you may spend a Void Point to add +1k1 to the Damage Roll. You gain a further +1k0 bonus to Initiative Rolls (+3k0 in total).',

  // ── Ra'Shari Trader ────────────────────────────────────────────────────
  'Opening Offer': "You gain a +1k0 bonus to Sincerity, Temptation and Commerce Rolls. You may make a Contested Temptation/Awareness against an opponent's Etiquette/Awareness to determine a single material item the subject wants. When buying from another Ra'Shari Caravan, you only pay 75% of the normal price.",
  'Acquiring the Goods': 'You gain a +1k0 bonus on all Courtier, Etiquette and Lore: Underworld Rolls.',
  'Making the Deal': "You receive a further +1k0 bonus to Sincerity, Temptation and Commerce Rolls (+2k0 in total). If you satisfy an NPC's material wants, you may halve the XP cost of purchasing them as an Ally.",
  'Expediency is Important': "You gain a further +1k0 bonus to all Courtier, Etiquette, and Lore: Underworld Rolls (+2k0 in total). When waiting for goods to be shipped to you, you only wait 75% of the normal time.",
  'The Perfect Supplier': "You receive a further +1k0 bonus to Sincerity, Temptation and Commerce Rolls (+3k0 in total). If you spend 20 minutes in conversation with someone and succeed at a Contested Temptation Roll, you may learn all of the Target's material desires and potentially gain them as an Ally at no cost until the promised goods arrive.",

  // ── Ra'Shari Diviner ───────────────────────────────────────────────────
  'The Whispers of the Song': 'You may add your Divination skill to the result of all Lore skill Rolls.',

  // ── Senpet Legionnaire ─────────────────────────────────────────────────
  'Divine Insight': 'You add your Lore: Theology skill to the benefit gained from assuming the Center Stance and to your Armor TN while in the Center Stance. You gain +1k1 to all Hunting (Survival) Rolls in the desert.',
  'Divine Strength': 'You may spend one Void Point to roll an additional +1k1 damage with any weapon.',
  'Divine Retribution': 'You may make attacks as a Simple Action instead of a Complex Action while using weapons with the Senpet keyword.',
  'The Gods Protect Me': 'When assuming the Center Stance you may spend a Void Point to gain +20 to your Armor TN. This effect ends at the start of the Reactions Stage during which it was activated and does not apply during the Strike Stage of a duel.',
  'The Gods Guide my Hand': 'Once per skirmish you may spend a Void Point to gain +4k1 to Attack Rolls for one round.',

  // ── Senpet Charioteer ──────────────────────────────────────────────────
  'Ride Into Battle': 'When spending Void to increase your Armor TN you gain an additional bonus equal to your Lore: Theology Skill Ranks. While mounted on a chariot you gain a +1k0 bonus to your Initiative Rolls.',
  'Swift Volley': 'If you take 2 Simple Actions to move your full movement in a round while mounted on a chariot or in the Full Attack Stance, enemies in the Full Attack Stance cannot attack you, and spells cast against you suffer a +5 TN penalty to their Spellcasting Roll.',
  'Speed is my Armor': 'While mounted on a chariot or in the Full Attack Stance you may make attacks as a Simple Action instead of a Complex Action.',
  'Ruthless Advance': 'While mounted on a chariot or in the Full Attack Stance you may spend a Void Point to gain +3k0 to all Attack Rolls until the next Reactions Stage.',
  'Deadly Strike': 'Once per skirmish, while mounted on a chariot or assuming the Full Attack Stance, you may spend a Void Point to roll additional damage dice equal to your Lore: Theology Skill on all Damage Rolls until the Reactions Stage.',

  // ── Senpet Sahir ───────────────────────────────────────────────────────
  'By the Grace of the Gods': 'You gain a Free Raise on all Spellcasting Rolls. Add your Lore: Theology ranks to the total of all Social Skill Rolls involving religious matters.',

  // ── Yodotai Legionnaire ────────────────────────────────────────────────
  'Tortoise Formation': "You do not receive penalties to your Attack Rolls from carrying any type of Yodotai shield. You receive a bonus to your Armor TN equal to your Insight Rank while using a scutum in the Full Defense Stance. As a Free Action you may spend a Void Point to grant this bonus to all allies using scutum within 10' for a number of rounds equal to your Class Rank.",
  'In Close Quarters': "In any round you switch from Full Defense to Full Attack Stance you gain +1k0 to Attack Rolls. As a Free Action you may spend a Void Point to grant this bonus to allies within 10' wielding a gladius who made the same switch this round.",
  'Wedge Formation': 'While in the Attack Stance you gain Reduction equal to your Class Rank. If you make a Complex Action attack against an opponent in the Full Defense Stance you may ignore the Full Defense Armor TN benefit, instead calculating their Armor TN as if they were in the Attack Stance.',
  'With My Brothers': "You no longer need to spend Void to grant the benefits of your Rank 1 and 2 Class Techniques to your allies and the range is extended to 30'. All allies wielding Yodotai weapons within 30' also add +1k0 to their Damage Rolls.",

  // ── Yodotai Mercenary ──────────────────────────────────────────────────
  'Importance of Speed': 'You reduce the TN penalties associated with carrying a shield by an amount equal to your Class Rank. You may move as if your Water Ring was 1 Rank higher.',
  'Stranger in a Foreign Land': 'You gain a +1k0 to Battle, Intimidation and Courtier Rolls. If you pose a hypothetical scenario to an opponent after 5 minutes of conversation you may make a Contested Courtier/Awareness Roll against them to determine what tactics they might use.',
  'Unfriendly Glare': 'You may make attacks with Warrior and Yodotai weapons as a Simple Action.',
  'Combat Diplomacy': "You may make a Contested Battle/Perception Roll against an opponent's Sincerity/Awareness as a Simple Action to determine one of their Advantages or Disadvantages. You may spend a Void Point on first meeting someone to gain a Free Raise on rolls to gain their favor for the next 24 hours.",
  'Hoplon Bash': "You may use your shield to perform an attack as a Complex Action while in the Full Defense Stance. Roll Agility/Brawling (Shield Bash) against a target's Armor TN; if successful you inflict 1k2 damage and subject them to a Knockdown Maneuver.",

  // ── Yodotai Berserker ──────────────────────────────────────────────────
  // Rank 1 shares name "Deadly Strike" with Senpet Charioteer Rank 5 and Yodotai Legionnaire Rank 3.
  // Lookup by context in character sheet; descriptions differ.
  'Aura of Power': "While in the Full Attack Stance all allies within 30' gain +1k0 to Damage Rolls with a Yodotai weapon (not cumulative with multiple Berserkers). While in the Full Attack Stance you gain Reduction equal to your Berserker Class Rank.",
  'Killing Blow': 'While in the Full Attack Stance you may spend a Void Point to gain +5k0 to all Damage Rolls for one round.',

  // ── Jani ───────────────────────────────────────────────────────────────
  'Quicker Than the Eye': 'You gain a +1k0 bonus to all Initiative Rolls. You gain a +1k0 bonus to all Stealth Skill Rolls.',
  'What the Eye Sees, What the Ear Hears': 'You gain an additional +1k0 to all Skill Rolls using Perception. When performing the Feint Maneuver using the Knives, Staves or Assassin Ranged Weapons Skills, you add +1k0 to your Attack and Damage Rolls.',
  'Strike Quickly, Strike True': 'You gain a further +1k0 bonus to Initiative Rolls, Stealth Skill Rolls, and Perception based Rolls (+2k0 total). You gain a Free Raise when using the Disguise Emphasis of the Acting Skill.',
  'Seen and Not Noticed': 'Making Attacks with the Knives, Staves or Assassin Ranged Weapons Skills is a Simple Action for you.',
  'Blinding Speed': 'When attacking with the Knives, Staves or Assassin Ranged Weapons Skills you may make the Extra Attack Maneuver for only 3 Raises.',

  // ── Necromancer ────────────────────────────────────────────────────────
  'Initiate of Undeath': 'You may use the Soul of the Slayer to create Soul Jars. You gain three Mastery Levels of Spells from the Ghul Creation or Death Disciplines. You may cast each spell a number of times per day equal to your Earth Ring.',
  'Master of Undeath and Death': 'You gain +2k0 on all Contested Rolls involving Willpower. You gain an additional 2 Mastery Levels from Ghul Creation or Death.',
  'Creator of Undeath': 'You gain +1k0 to Intimidation, Deceit, and Sincerity Rolls and an additional 1 Mastery Level spell from Ghul Creation or Death.',
  'Leader of Undead': 'When using Ghul Creation 1, you may make Raises to target additional Undead within range, at a rate of one extra target per Raise. All Undead under your control gain a +1k0 bonus to Attack and Damage Rolls.',
  'Agent of Death': 'All Undead created by the Necromancer will do your bidding until dismissed or another Necromancer steals control. Non-necromancers may not take control of your Undead.',

  // ── Kabir ──────────────────────────────────────────────────────────────
  'Rotting the Foundation': 'When spending a Void Point to enhance a Low Skill, you gain a +2k2 bonus to the Roll rather than the usual +1k1.',
  'A Honeyed Tongue': 'You gain a +1k0 bonus to all Etiquette, Storytelling, Courtier and Deceit Rolls.',
  'Killing with Subtlety': 'You gain a +2k0 bonus to all Poison and Sleight of Hand Rolls. You gain the Herbalism Emphasis of the Medicine Skill for free.',
  'Tearing Out the Foundation': 'You gain a +2k0 bonus to Stealth and Forgery Skill Rolls. You gain 1 Free Raise to any Skill Roll to destroy, disguise or otherwise alter a physical object.',
  'Jackal Ambassador': "You gain an additional +1k0 bonus to all Etiquette, Storytelling, Courtier and Deceit Rolls (total of +2k0). You may purchase the Perceived Honor Advantage for 1 less Experience Point per Rank.",

  // ── Ebonite Templar ────────────────────────────────────────────────────
  'Tapping the Inner Strength': 'When facing an opponent with lower Integrity you roll an additional +1k0 on all Attack, Damage and Social Skill Rolls.',
  'By Thy Will': 'During the Reactions Stage at the end of the round you may spend a Void Point to increase your Initiative score as if it was the beginning of the round. This increase lasts until the end of the skirmish.',
  'The Ebon Hand': 'You may make attacks as a Simple Action when using weapons with the Warrior or Ebonite Keywords.',
  'By Word Or By Sword': 'You may spend a Void Point to gain additional rolled dice equal to half your Integrity (round down) on a single Social Skill Roll.',
  'Will of the Stone': 'You may spend a Void Point to ignore all wound penalties (including Down and Out) for the remainder of the skirmish.',

  // ── Paths of the Free ─────────────────────────────────────────────────
  'Predator of the Alleys': 'When attempting the Knockdown Maneuver you gain +1k0 to the Attack Roll. Your penalties for fighting in poor visibility conditions and in areas of difficult terrain are halved, round down.',
  'A Man of Knowledge': 'You gain a Free Raise on Lore Skill Rolls. You gain a bonus equal to the number of Lore Skills you possess to all Etiquette and Storytelling Rolls.',
  'Master of the Streets': "You add +1k0 to Sleight-of-Hand and Athletics Skill Rolls. Choose a quarter of Medinaat al-Salam; when in that quarter, you roll an additional +1k0 to Athletics, Stealth, and Underworld Skill Rolls.",

  // ── Master of Wolves (Path) ────────────────────────────────────────────
  'Master of Wolves': 'When fighting alongside your pack of wolves you may spend Void Points to augment their Attack Rolls. If one of your wolves dies you immediately suffer 5 Wounds that cannot be prevented or reduced in any way.',
};




// ── Creature Library ──────────────────────────────────────────────────────────
// Static bestiary — always available in the Monsters faction, no DB records needed.
// attack/damage use LBS dice notation (e.g. '6k3'). tn = TN to Be Hit. wpl = Wounds per Level.
export const CREATURES_LIBRARY = [
  // ── Animals ─────────────────────────────────────────────────────────────────
  {
    id: 'creature_camel', name: 'Camel', category: 'Animal',
    air: 2, earth: 3, fire: 2, water: 3,
    traits: { Stamina: 3, Strength: 6 },
    attack: '3k2', damage: '3k2', tn: 10, wpl: 10,
    specials: [],
    gm_notes: 'Riding animal and beast of burden. Can go long periods without water. Attacks by biting. Bad-tempered. Horsemanship (Camel emphasis).',
  },
  {
    id: 'creature_horse', name: 'Horse', category: 'Animal',
    air: 2, earth: 3, fire: 1, water: 3,
    traits: { Agility: 3, Strength: 5 },
    attack: '3k2', damage: '6k3', tn: 10, wpl: 10,
    specials: ['Fleet — uses Strength instead of Water for movement. TN 15 at gallop.'],
    gm_notes: 'Not native to Burning Sands. Status symbol for wealthy citizens.',
  },
  {
    id: 'creature_gorilla', name: 'Gorilla', category: 'Animal',
    air: 2, earth: 3, fire: 2, water: 3,
    traits: { Agility: 3, Strength: 5 },
    attack: '6k3', damage: '5k1', tn: 15, wpl: 6,
    specials: [],
    gm_notes: 'Originally from Ra\'Shari caravans. Fashionable guard pets for the wealthy. Requires ~80 lbs food/day. Dahabi House keep trained gorilla bodyguards.',
  },
  {
    id: 'creature_snake', name: 'Snake (Venomous)', category: 'Animal',
    air: 1, earth: 1, fire: 1, water: 1,
    traits: { Reflexes: 3, Agility: 3, Awareness: 3 },
    attack: '3k2', damage: '1k1', tn: 20, wpl: 4,
    specials: ['Poison — successful attack forces target to resist snake venom.'],
    gm_notes: 'Common in the Burning Sands. Used as assassination tools by Assassins, Jackals, and Senpet.',
  },
  {
    id: 'creature_monkey', name: 'Monkey', category: 'Animal',
    air: 3, earth: 1, fire: 2, water: 2,
    traits: { Reflexes: 3, Agility: 4 },
    attack: '2k2', damage: '1k1', tn: 20, wpl: 2,
    specials: [
      'Nimble — moves through trees, walls, and structures freely as a Free Action.',
      'Theft — may attempt to steal a small item from a target as a Simple Action (opposed Agility/Sleight of Hand vs Reflexes/Defense).',
    ],
    gm_notes: 'Brought in by Ra\'Shari caravans. Kept as pets or trained by thieves. Some wealthy houses use them as messengers within large compounds.',
  },
  {
    id: 'creature_jackal', name: 'Jackal', category: 'Animal',
    air: 2, earth: 2, fire: 2, water: 2,
    traits: { Reflexes: 3, Awareness: 3 },
    attack: '3k2', damage: '2k1', tn: 15, wpl: 4,
    specials: [
      'Pack Hunter — gains +1k0 to attack rolls for each additional jackal attacking the same target (max +3k0).',
      'Scent — cannot be surprised and ignores penalties for fighting in darkness.',
    ],
    gm_notes: 'Desert scavengers found in packs of 3–8 near battlefields, refuse heaps, and city edges. The Jackal faction takes its name from them. Rarely attack healthy humans alone — much bolder in packs.',
  },
  {
    id: 'creature_crocodile', name: 'Crocodile', category: 'Animal',
    air: 1, earth: 4, fire: 2, water: 4,
    traits: { Stamina: 5, Strength: 6 },
    attack: '4k2', damage: '5k2', tn: 10, wpl: 12,
    specials: [
      'Carapace 3 — thick hide reduces damage dice rolled by 3 (minimum 1 die).',
      'Ambush Predator — gains +2k0 to attack rolls when attacking from water or when target is unaware.',
      'Death Roll — on a successful grapple, may make a free damage roll each subsequent round without needing a new attack roll.',
    ],
    gm_notes: 'Found in the river and large oases outside Medinaat al-Salaam. Considered sacred by some Senpet. Slow on land (Water Ring for movement), lethal in water. Rarely ventures into the city proper — but the deeper sewer channels occasionally have them.',
  },
  // ── Supernatural ────────────────────────────────────────────────────────────
  {
    id: 'creature_cat', name: 'Cat of Many Tongues', category: 'Supernatural',
    air: 3, earth: 1, fire: 1, water: 1,
    traits: { Perception: 2 },
    attack: '3k2', damage: '1k1', tn: 15, wpl: 3,
    specials: [
      'Magic Resistance — Jinn attacks/effects suffer +10 TN; Jinn magic within 30\' suffers +20 TN.',
      'Mimicry — Repeats anything said within 30\' in the language of every listener present.',
    ],
    gm_notes: 'Appear as ordinary strays but eyes glow golden at sunrise/sunset. Sought for translation. Jinn are loathe to harm them.',
  },
  {
    id: 'creature_ghul', name: 'Ghul', category: 'Undead',
    air: 2, earth: 3, fire: 2, water: 4,
    traits: { Reflexes: 3, Agility: 3 },
    attack: '6k3', damage: '4k2', tn: 15, wpl: 8,
    specials: [
      'Fear 1 — Willpower TN 10 to confront; fail by 15+ means flee.',
      'Immune to disease and poison.',
      'No Wound penalties.',
      'Fight until destroyed unless commanded otherwise.',
    ],
    gm_notes: 'Undead haunt the sewers, serving Jackal Necromancers. Created via Sahir magic (Ghul Creation spells), Senpet ritual, or Soul of the Slayer artifact.',
  },
  {
    id: 'creature_roc', name: 'Roc', category: 'Supernatural',
    air: 2, earth: 3, fire: 2, water: 4,
    traits: { Reflexes: 6, Agility: 4, Strength: 6 },
    attack: '6k4', damage: '6k4', tn: 25, wpl: 6,
    specials: [
      'Fear 3 — Willpower TN 20 to confront.',
      'Flight — movement rate of twenty times Water Ring.',
      'May attack twice per round with talons.',
      'Pounce — if both talon attacks hit, gain 2 Free Raises on any subsequent grapple.',
    ],
    gm_notes: 'Bird of prey large enough to carry elephants. Adult wingspan 200 ft. Common near Medinaat al-Salaam since increase in Ivory Kingdoms caravans.',
  },
  {
    id: 'creature_wyrm', name: 'Desert Wyrm', category: 'Supernatural',
    air: 1, earth: 5, fire: 3, water: 4,
    traits: { Stamina: 6, Strength: 7 },
    attack: '6k3', damage: '6k3', tn: 15, wpl: 14,
    specials: [
      'Fear 2 — Willpower TN 15 to confront.',
      'Carapace 2 — thick scales reduce damage dice rolled by 2 (minimum 1).',
      'Burrow — moves through sand and loose earth as easily as open ground; attacks from below add +2k0 to the first attack roll.',
      'Constrict — on a successful grapple, deals automatic Strength+2k2 damage each round without a new attack roll; target must beat TN 25 Strength roll to break free.',
      'Invulnerable to mundane weapons of less than Damage 3k2 — hide too thick for small blades and arrows.',
    ],
    gm_notes: 'Ancient serpentine predators, longer than ten men laid end to end. Rare even in deep desert — most sightings are juveniles. A full adult can swallow a camel whole. Revered as sacred by some desert tribes; feared by everyone else. Believed to be remnants of a pre-creation age. Some scholars suggest they are degenerate Jinn who took physical form during the Day of Wrath and could not return.',
  },
  // ── Demonic ─────────────────────────────────────────────────────────────────
  {
    id: 'creature_progeny', name: 'Progeny of the Destroyer', category: 'Demonic',
    air: 3, earth: 5, fire: 3, water: 4,
    traits: { Reflexes: 4, Agility: 5 },
    attack: '8k5', damage: '7k4', tn: 25, wpl: 10,
    specials: [
      'Carapace 3 — reduces damage dice rolled by 3 (min 1).',
      'False Form — can assume form of a beautiful local woman; shapeshifting, not illusion — no magic can penetrate it.',
      'Natural Weapons — 6 clawed arms, fangs, horns; may make 4 melee attacks per round.',
      'Nightsight — sees in darkness with absolute clarity.',
      'Spellcasting — minimum Rank 2 sahir equivalent.',
    ],
    gm_notes: 'Blood-borne daughters of Kali-Ma. Exceptionally rare — only two known: Sarna and Anata.',
  },
  // ── Jinn Templates ──────────────────────────────────────────────────────────
  {
    id: 'creature_jinn_minor', name: 'Minor Jinn', category: 'Jinn',
    air: 2, earth: 2, fire: 2, water: 2, void: 2,
    traits: {},
    attack: '4k2', damage: '4k2', tn: 10, wpl: 4,
    specials: [
      'Invincible — no mortal weapon can slay a Jinn; if reduced past Out, returns to its realm.',
      'Shapeshifting — may change shape at will (self only).',
    ],
    gm_notes: 'Base template. 40 CP, max 1 Advantage. Roll on Tables A2.2–A2.10 to customize. Skills: Brawling 2, Commerce 3.',
  },
  {
    id: 'creature_jinn_medium', name: 'Medium Jinn', category: 'Jinn',
    air: 3, earth: 3, fire: 4, water: 3, void: 4,
    traits: {},
    attack: '6k4', damage: '6k4', tn: 20, wpl: 6,
    specials: [
      'Invincible — no mortal weapon can slay a Jinn.',
      'Shapeshifting — may change shape at will (self only).',
    ],
    gm_notes: 'Base template. 60 CP, max 3 Advantages. Skills: Brawling 4, Commerce 4.',
  },
];

// ── LBS Book Reference — Table of Contents ────────────────────────────────────
// File IDs from Google Drive share links (the string between /d/ and /view in the URL)
export const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1ItTpn0-2yRB-06sJLJm_ZZxWF1I8kgCZ';

export const BOOK_TOC = [
  {
    chapter: 'Introduction & Table of Contents',
    page: 1,
    fileId: '1dRtdGMcXCpZbsce_x95VShAZL52fmczs',
    sections: [
      { title: 'Introduction — Journal of Iuchi Yue', page: 5 },
      { title: 'Tales of Yesterday and Today', page: 7 },
      { title: 'How to Use This Book', page: 8 },
      { title: 'The Line of the Prophet (Mekhem / Shinsei)', page: 10 },
      { title: 'Rokugan and the Gaijin', page: 11 },
    ],
  },
  {
    chapter: 'Chapter 1: Rules — Roll & Keep, Characters, Skills',
    page: 15,
    fileId: '1ntnWXNsrUESkFT-00TW_iu7_rlOAIymi',
    sections: [
      { title: 'Basic Game Mechanics — Roll and Keep', page: 13 },
      { title: 'Rings and Traits', page: 19 },
      { title: 'Character Creation', page: 22 },
      { title: 'High Skills (Calligraphy, Courtier, Lore, Medicine…)', page: 28 },
      { title: 'Merchant Skills (Commerce, Appraisal, Temptation)', page: 34 },
      { title: 'Combat Skills (Athletics, Knives, Swordsmanship, Tahaddi…)', page: 36 },
    ],
  },
  {
    chapter: 'Chapter 1 cont.: Low Skills, Advantages & Disadvantages',
    page: 41,
    fileId: '1eSpvzCVSzbPweVmd971S3GBQR1g88O57',
    sections: [
      { title: 'Low Skills (Acting, Stealth, Forgery, Sleight of Hand…)', page: 39 },
      { title: 'Advantages (full list)', page: 42 },
      { title: 'Disadvantages (full list)', page: 48 },
    ],
  },
  {
    chapter: 'Chapter 1 cont.: Equipment, Combat & Magic',
    page: 49,
    fileId: '1RSw5RZdj0y1LeGAE4ivlaoK4xQzZSY5c',
    sections: [
      { title: 'Equipment — Weapons, Armor, Gear', page: 53 },
      { title: 'Combat Resolution', page: 61 },
      { title: 'Tahaddi (Knife-Fighting Duel Rules)', page: 68 },
      { title: 'Spellcasting', page: 70 },
      { title: 'Void Points', page: 71 },
      { title: 'Poison, Disease and Powders', page: 72 },
      { title: 'Building Character (XP and advancement)', page: 77 },
    ],
  },
  {
    chapter: 'Chapter 2: Medinaat al-Salaam',
    page: 85,
    fileId: '1gPtlmQe2VbqpwOSNyCcYTH6shQf78iKY',
    sections: [
      { title: 'Overview — Government, Economics, Landscape, Demographics', page: 84 },
      { title: 'History of the Jewel', page: 90 },
      { title: 'The Caliphate and the Khadi', page: 95 },
      { title: 'The Immortal Caliph Hanan', page: 95 },
      { title: 'Houses of Dahab', page: 104 },
      { title: 'The Qolat (secret conspiracy)', page: 105 },
      { title: 'The Qabal — Politics of Sorcery', page: 112 },
      { title: 'The Five Sahir Disciplines (magic system)', page: 118 },
      { title: 'City Guard / Free Sahir / Heartless Khadi', page: 100 },
    ],
  },
  {
    chapter: 'Chapter 3: The Ashalan',
    page: 127,
    fileId: '1HmBetSHE-SDA6sK2XRq61CgMS4kYy-Xt',
    sections: [
      { title: 'Overview — Blue-Skinned Immortals', page: 128 },
      { title: 'History — Creation and the Day of Wrath', page: 129 },
      { title: 'Political and Social Organization', page: 134 },
      { title: 'The Ishanti Crystal', page: 136 },
      { title: 'Religious Beliefs — Souls of the Twelve', page: 136 },
      { title: 'Culture — Tattoos, Reproduction, Sandsmithing', page: 139 },
      { title: 'Blood-Sworn / Children of Midnight / Heart-Seekers / Sun-Riders', page: 144 },
    ],
  },
  {
    chapter: 'Chapter 4: The Assassins',
    page: 153,
    fileId: '1cyspJdsDUKB2AJ2mBG-NThh0h3YSPYyL',
    sections: [
      { title: 'Overview and Secret History', page: 153 },
      { title: 'History — Order of the Mountain', page: 155 },
      { title: 'Political and Social Organization', page: 162 },
      { title: 'Assassin Slayer / Keeper / Duelist', page: 163 },
      { title: 'The Curse of the Grey Crone', page: 169 },
    ],
  },
  {
    chapter: "Chapter 5: The Ra'Shari",
    page: 175,
    fileId: '1l_DiU4LhHu0ltfW1ENlnszFIZTMgg605',
    sections: [
      { title: 'Overview and History', page: 175 },
      { title: 'The Four Great Caravans (Mysticism, Entertainment, Commerce, Memory)', page: 180 },
      { title: "Ra'Shari and the Jinn", page: 183 },
      { title: 'Culture — Nomadic Life and Language', page: 184 },
      { title: "Ra'Shari Knife-Fighter / Trader / Diviner", page: 188 },
      { title: 'Cokaloi Magic — Dawn, Dusk, Night', page: 190 },
    ],
  },
  {
    chapter: 'Chapter 6: The Senpet',
    page: 199,
    fileId: '18kDmzy2duRSTSKPXxVi4FTOOB3qTvPXe',
    sections: [
      { title: 'Overview — Fallen Empire', page: 197 },
      { title: 'History', page: 199 },
      { title: 'Political and Social Organization', page: 204 },
      { title: 'Religious Beliefs — The Ten Thousand Gods', page: 206 },
      { title: 'Culture — Ritual, Sacrifice, Military Tradition', page: 208 },
      { title: 'Senpet Legionnaire / Charioteer / Sahir', page: 212 },
      { title: 'Avatar of the Ten Thousand / New Spells', page: 215 },
    ],
  },
  {
    chapter: 'Chapter 7: The Yodotai',
    page: 223,
    fileId: '17RmOCCAbXCY3RDXNv0LiDV9ztSgr0IQZ',
    sections: [
      { title: 'A Letter to Moto Chagatai', page: 223 },
      { title: 'History — The Unstoppable Empire', page: 223 },
      { title: 'Political and Social Organization', page: 227 },
      { title: 'Religious Beliefs — Ancestral Warrior Spirits', page: 230 },
      { title: 'Culture and Language', page: 233 },
      { title: 'Yodotai Legionnaire / Mercenary / Berserker', page: 236 },
    ],
  },
  {
    chapter: 'Chapter 8: The Jackals',
    page: 245,
    fileId: '13Cs_ywbbD8itTaq6UWkXKJMR5l6cHg-G',
    sections: [
      { title: 'Overview and History', page: 246 },
      { title: 'The Hall of Souls', page: 249 },
      { title: 'Kali-Ma — Religion of Death and Rebirth', page: 249 },
      { title: 'Culture — Sewers, Ghuls, Necromancy', page: 252 },
      { title: 'Jani / Necromancer / Kabir', page: 255 },
    ],
  },
  {
    chapter: 'Chapter 9: The Ebonites',
    page: 263,
    fileId: '1PgA8uJzyCVAS_h0VnR-kQwDjzboteWfb',
    sections: [
      { title: 'Overview and History — The Ebon Hand', page: 263 },
      { title: 'The Ebon Stone and the Virtues', page: 271 },
      { title: 'The Code of the Ebonites', page: 273 },
      { title: 'Culture, Language, Naming Conventions', page: 275 },
      { title: 'Ebonite Templar / New Paths / Martial Arts', page: 278 },
    ],
  },
  {
    chapter: 'Appendix: Creatures, Jinn & Maps',
    page: 284,
    fileId: '1OHUaIzqFxgrrfxFtVIXmzf7dTIQZlKu2',
    sections: [
      { title: 'Creatures of the Burning Sands (stat blocks)', page: 286 },
      { title: 'Special Abilities — Carapace, Fear, Invulnerability', page: 290 },
      { title: 'The Jinn — Creation Templates and Tables', page: 291 },
      { title: 'Negotiating with Jinn', page: 295 },
      { title: 'Map of the Burning Sands', page: 296 },
    ],
  },
];
