// ── Game constants ────────────────────────────────────────────────────────────
export const GAME_ID = '843ba09a-1e47-46b3-80f0-b7b5279f9de0';
export const GM_PASSWORD = 'gm';

export const WOUND_RANKS = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'];
export const WOUND_COLORS = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'];
export const STANCES = ['Attack','Full Attack','Defense','Full Defense','Center'];
export const NPC_ACTIONS = ['Attack','Move','Full Defense','Draw Weapon','Cast Spell','Use Technique','Pass'];
export const STATUS_EFFECTS = ['Dazed','Fatigued','Prone','Blinded','Frightened','Stunned','Bleeding','Burning','Grappled'];

// Rich status effect definitions with tooltips and wear-off rules
export const STATUS_EFFECT_DEFS = {
  'Dazed':      { icon: '💫', desc: 'Cannot take Complex Actions this round. May still take Simple and Free Actions.', wearOff: 'End of next round', mechanical: 'noComplex' },
  'Fatigued':   { icon: '😓', desc: '+5 TN penalty to all rolls. After 8 hours of rest, this condition is removed.', wearOff: '8 hours rest', mechanical: 'tn+5' },
  'Prone':      { icon: '⬇', desc: '+10 TN to be hit by melee; -10 TN to be hit by ranged. Must spend a Simple Action to stand.', wearOff: 'Stand up (Simple Action)', mechanical: null },
  'Blinded':    { icon: '🙈', desc: '-3k3 to all ranged attacks; -1k1 to melee attacks. Cannot make Perception rolls requiring sight.', wearOff: 'Duration varies (typically 1-3 rounds)', mechanical: 'tn+10' },
  'Frightened': { icon: '😨', desc: 'Must move away from source of fear on your turn or pass Willpower TN 20. -1k0 to all attack rolls.', wearOff: 'Leave presence of fear source', mechanical: null },
  'Stunned':    { icon: '⚡', desc: 'Lose your next action (Simple or Complex). This condition is removed after losing the action.', wearOff: 'After losing one action', mechanical: 'noAction' },
  'Bleeding':   { icon: '🩸', desc: 'Take 2 wounds at the start of each of your turns. Requires a Medicine roll (TN 10) or binding to stop.', wearOff: 'Medicine roll TN 10 or binding', mechanical: 'bleeding' },
  'Burning':    { icon: '🔥', desc: 'Take 1k1 fire damage at the start of each turn. Spend a Complex Action rolling on the ground or dousing with water to remove.', wearOff: 'Douse or roll (Complex Action)', mechanical: 'burning' },
  'Grappled':   { icon: '🤼', desc: 'Cannot move or attack with weapons. May only attempt to break free (Contested Strength vs grappler each round).', wearOff: 'Break free (Contested Strength)', mechanical: 'noMove' },
  'Disarmed':   { icon: '🗡', desc: 'Your weapon has been knocked away. You are fighting unarmed until you recover it (Simple Action).', wearOff: 'Recover weapon (Simple Action)', mechanical: null },
  'Disguised':  { icon: '🎭', desc: 'Your true identity is concealed. Others must beat your Acting roll total to see through the disguise.', wearOff: 'Varies (GM adjudicates)', mechanical: null },
  'Hidden':     { icon: '👁', desc: 'You are concealed. Others must beat your Stealth roll total to detect you.', wearOff: 'End of round or when you act offensively', mechanical: null },
};
export const RAISE_OPTIONS = ['More Effect','Flashy','Custom (notify GM)'];
// L5R 4th Edition core rules (the authoritative maneuver text, confirmed against the actual rulebook).
// Called Shot and Increased Damage are split into individual selectable tiers since their costs are
// variable, not flat; Knockdown has two distinct versions depending on the target's leg count.
export const ATTACK_MANEUVERS = [
  'Feint (2)',                      // Bonus damage = half margin over Armor TN after raises, max 5x Insight Rank
  'Guard (0)',                      // Simple Action, not an attack roll - handled separately, not a raise spend
  'Knockdown - Biped (2)',
  'Knockdown - Quadruped (4)',
  'Disarm (3)',                      // Flat 2k1 damage, then Contested Strength roll
  'Extra Attack (5)',
  'Called Shot - Limb (1)',
  'Called Shot - Hand/Foot (2)',
  'Called Shot - Head (3)',
  'Called Shot - Eye/Ear/Finger (4)',
  'Narrative (1)',
];
export const ROUND_LIMITS = { Action: null, Intrigue: 5, Travel: 3 };
export const TRAITS = ['Reflexes','Awareness','Stamina','Willpower','Agility','Intelligence','Strength','Perception'];

// ── Full skill list ───────────────────────────────────────────────────────────
// Grouped by category. Lore: / Craft: / Perform: are open-ended - a special
// placeholder value signals the UI to show a free-text input for the subtopic.
export const SKILL_CATEGORIES = {
  'Bugei (Combat)': [
    'Athletics','Archery','Assassin Ranged Weapons','Battle','Brawling',
    'Defense','Horsemanship','Hunting','Intimidation','Knives',
    'Polearms','Spears','Staves','Swordsmanship','Tahaddi',
  ],
  'High (Social/Scholarly)': [
    'Calligraphy','Courtier','Divination','Etiquette','Games',
    'Medicine','Meditation','Sincerity','Storytelling',
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
    'Lore: Anatomy','Lore: Burning Sands','Lore: Ebonites','Lore: History','Lore: Jackal',
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

// Suggested emphases per skill - used in skill picker and Craft: Poison inventory outcome
export const SKILL_EMPHASES = {
  // ── Bugei (Martial) Skills ────────────────────────────────────────────────
  'Athletics':       ['Climbing', 'Running', 'Swimming', 'Throwing'],
  'Battle':          ['Mass Combat', 'Skirmish'],
  'Defense':         [], // no emphases per rulebook
  'Horsemanship':    ['Camels', 'Horses'], // LBS adaptation: Rokugani/Utaku specific mounts replaced
  'Hunting':         ['Survival', 'Tracking', 'Trailblazing'],
  'Tahaddi':         ['Assessment', 'Focus'], // LBS name for Iaijutsu
  'Brawling':        ['Grappling', 'Improvised Weapons', 'Strikes'], // LBS name for Jiujutsu; Martial Arts → Strikes

  // Weapon skills - verified against the actual rulebook page text/image (previous data had real errors:
  // extra weapons not in the book, missing ones that are). Spears/Polearms/Chain Weapons were read directly
  // from the scanned page image since the OCR text badly interleaved two columns there - flagging that as
  // slightly lower confidence than the others, which came from clean OCR text.
  'Archery':         ['Composite Bow', 'Horse Archery', 'Short Bow'], // LBS name for Kyujutsu
  'Assassin Ranged Weapons': ['Blowgun', 'Stone (Rokugani Tsubute)'], // was missing entirely before
  'Chain Weapons':   ['Kama', 'Kusarigama', 'Manrikigusari', 'Nunchaku'],
  'Heavy Weapons':   ['Heavy Club', 'Mace', 'War Axe'],
  'Knives':          ['Adira', 'Jambiya', 'Kindjal', 'Pugio', 'Sikin'],
  'Polearms':        ['Bisento', 'Glaive', 'Khadja', 'Scythe'],
  'Spears':          ['Lance', 'Naginata', 'Pilum', 'Yari'],
  'Staves':          ['Small Club', 'Staff'],
  'Swordsmanship':   ['Claymore', 'Falchion', 'Gladius', 'Khopesh', 'Longsword', 'Najya', 'Sayf-Saghir', 'Scimitar', 'Shamshir'], // LBS name for Kenjutsu

  // ── High Skills ───────────────────────────────────────────────────────────
  'Acting':          ['Disguise', 'Faction', 'Profession'], // LBS: Clan → Faction
  'Calligraphy':     ['Cipher', 'High Rokugani'],
  'Courtier':        ['Gossip', 'Manipulation', 'Rhetoric'],
  'Divination':      ['Astrology', 'Cokaloi', 'Omens'], // Cokaloi = Ra'Shari divination stones
  'Etiquette':       ['Bureaucracy', 'Conversation', 'Courtesy'],
  'Investigation':   ['Interrogation', 'Notice', 'Search'],
  'Meditation':      ['Fasting', 'Void Recovery'],
  'Medicine':        ['Antidotes', 'Disease', 'Herbalism', 'Nonhuman Medicine', 'Wound Treatment'],
  'Perform: Dancing':['Folk Dance', 'Ritual Dance', 'Sword Dance'],
  'Perform: Singing':['Epic', 'Lament', 'Sacred'],
  'Perform: Oratory':['Debate', 'Narration', 'Recitation'],
  'Sincerity':       ['Deceit', 'Honesty'],
  'Spellcraft':      ['Importune', 'Spell Research'],
  'Storytelling':    ['Epic Poetry', 'Legends', 'Oral History'],
  'Tea Ceremony':    [], // no emphases per rulebook

  // ── Merchant Skills ───────────────────────────────────────────────────────
  'Animal Handling': ['Camels', 'Dogs', 'Falcons', 'Horses'],
  'Commerce':        ['Appraisal', 'Haggling', 'Mathematics'],
  'Engineering':     ['Construction', 'Siege'],
  'Sailing':         ['Knot-work', 'Navigation'],

  // ── Low Skills ────────────────────────────────────────────────────────────
  'Forgery':         ['Artwork', 'Documents', 'Personal Seals'],
  'Intimidation':    ['Bullying', 'Control', 'Torture'],
  'Sleight of Hand': ['Conceal', 'Escape', 'Pick Pockets', 'Prestidigitation'],
  'Stealth':         ['Ambush', 'Shadowing', 'Sneaking', 'Spell Casting'],
  'Temptation':      ['Bribery', 'Seduction'],

  // ── Craft sub-skills ──────────────────────────────────────────────────────
  'Craft: Poison': [
    'Generic Poison', 'Dripping Poison', 'Wish You Dead', 'Fire Biter',
    'Night Milk', 'Hot Madness', 'Stolen Breath', 'Kirei-ko', 'Fauntei Shi',
    'Snake Venom', 'Scorpion Venom', 'Poison Powder', 'Crafted Powder',
  ],
  'Craft: Weaponsmith': ['Swords', 'Knives', 'Polearms', 'Bows'],
  'Craft: Armorsmith':  ['Light Armor', 'Heavy Armor', 'Shields'],

  // ── Lore sub-skills ───────────────────────────────────────────────────────
  'Lore: Theology':    ['Senpet Gods', 'Ivory Kingdoms', "Ra'Shari Beliefs", 'Ebonite Faith'],
  'Lore: Underworld':  ['Smuggling', 'Assassination', 'Fencing'],
  'Lore: Undead':      ['Ghuls', 'Khadi', 'Necromancy'],
  'Lore: Burning Sands':['Desert Survival', 'Trade Routes', 'Settlements'],
  'Lore: History':     ['Ancient Empires', 'The Awakening', 'Bloodsword Wars'],
};

// Craft: Poison emphasis → inventory item data
export const POISON_EMPHASES = {
  'Generic Poison': { craftTN: 10, effect: '-1 Trait until sleep', category: 'Poison' },
  'Dripping Poison': { craftTN: 20, effect: '-2 Strength; Stamina roll TN 15 hourly', category: 'Poison' },
  'Wish You Dead': { craftTN: 25, effect: '-1 Stamina + nausea for 8 hours', category: 'Poison' },
  'Fire Biter': { craftTN: 25, effect: '-2 Agility + 2k2 wounds (bloodstream)', category: 'Poison' },
  'Night Milk': { craftTN: 25, effect: 'Stamina TN 25 per minute or 2k1 wounds', category: 'Poison' },
  'Hot Madness': { craftTN: 30, effect: '-2 Intelligence and Willpower until rest', category: 'Poison' },
  'Stolen Breath': { craftTN: 30, effect: 'Voice loss; Stamina TN 30 to shake off', category: 'Poison' },
  'Kirei-ko': { craftTN: 35, effect: '-1 Stamina every 2 weeks contact', category: 'Poison' },
  'Fauntei Shi': { craftTN: 55, effect: 'Stamina TN 35 every 10 min or die', category: 'Poison' },
  'Snake Venom': { craftTN: 20, effect: '-1 Agility and Reflexes per hour untreated', category: 'Poison' },
  'Scorpion Venom': { craftTN: 20, effect: '-1 Agility and Reflexes per hour untreated', category: 'Poison' },
  'Poison Powder': { craftTN: 25, effect: 'Blindness/Choking/Itching/Nausea (choose)', category: 'Poison' },
  'Crafted Powder': { craftTN: 10, effect: 'Blindness/choking/itching/nausea (cheap)', category: 'Poison' },
};


// Poison status-effect definitions - same shape as STATUS_EFFECT_DEFS, one per POISON_EMPHASES entry.
// This defines WHAT each poison does mechanically; it does not implement applying them (clicking a poison
// in inventory to use it on a weapon/attack) - that's a separate, later feature per Charles, since items
// don't trigger any actions yet. Where a poison's effect is really just an existing status (e.g. the
// Blindness option on Poison Powder), appliesStatus points at that STATUS_EFFECT_DEFS key instead of
// duplicating it.
export const POISON_STATUS_EFFECTS = {
  'Generic Poison': {
    icon: '🧪', desc: '-1 to a Trait chosen by the GM, until the victim next sleeps.',
    wearOff: 'Sleep', mechanical: null,
  },
  'Dripping Poison': {
    icon: '🧪', desc: '-2 Strength immediately. Stamina roll TN 15 each hour, or the effect persists.',
    wearOff: 'Pass Stamina TN 15 (rolled hourly)', mechanical: null,
  },
  'Wish You Dead': {
    icon: '🧪', desc: '-1 Stamina and nausea for 8 hours (GM discretion on the mechanical nausea penalty).',
    wearOff: '8 hours', mechanical: null,
  },
  'Fire Biter': {
    icon: '🩸', desc: '-2 Agility immediately, plus 2k2 wounds as the poison spreads through the bloodstream.',
    wearOff: 'Medicine treatment / GM discretion', mechanical: null,
  },
  'Night Milk': {
    icon: '🧪', desc: 'Stamina roll TN 25 every minute, or take 2k1 wounds.',
    wearOff: 'Antidote or poison runs its course (GM discretion)', mechanical: null,
  },
  'Hot Madness': {
    icon: '🧪', desc: '-2 Intelligence and Willpower until the victim rests.',
    wearOff: 'Rest', mechanical: null,
  },
  'Stolen Breath': {
    icon: '🔇', desc: 'Total voice loss - cannot speak, or cast Sahir spells requiring incantation. Stamina TN 30 to shake off.',
    wearOff: 'Pass Stamina TN 30', mechanical: null,
  },
  'Kirei-ko': {
    icon: '🧪', desc: 'Slow-acting contact poison - -1 Stamina every 2 weeks of continued exposure.',
    wearOff: 'Remove source of contact', mechanical: null,
  },
  'Fauntei Shi': {
    icon: '☠️', desc: 'Lethal. Stamina roll TN 35 every 10 minutes, or die.',
    wearOff: 'Antidote (GM discretion)', mechanical: null,
  },
  'Snake Venom': {
    icon: '🐍', desc: '-1 Agility and Reflexes each hour until treated.',
    wearOff: 'Medicine treatment', mechanical: null,
  },
  'Scorpion Venom': {
    icon: '🦂', desc: '-1 Agility and Reflexes each hour until treated.',
    wearOff: 'Medicine treatment', mechanical: null,
  },
  'Poison Powder': {
    icon: '🧪', desc: 'Choose one on exposure: Blindness, Choking, Itching, or Nausea (crafter/GM discretion at time of use).',
    wearOff: 'Varies by chosen effect', mechanical: null,
    // "Blindness" option reuses the existing Blinded status rather than a separate poison-specific one
    appliesStatus: { Blindness: 'Blinded' },
  },
  'Crafted Powder': {
    icon: '🧪', desc: 'Cheaper version of Poison Powder - choose one on exposure: Blindness, Choking, Itching, or Nausea.',
    wearOff: 'Varies by chosen effect', mechanical: null,
    appliesStatus: { Blindness: 'Blinded' },
  },
};

export const FACTION_ICONS = {
  'City Guard':          'ti-shield-filled',
  'Dahab':               'ti-coin',
  'Qabal':               'ti-wand',
  'Assassins':           'ti-sword',
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

// ── Faction default avatar colors ────────────────────────────────────────────
export const FACTION_COLORS = {
  'City Guard':         '#4a7ac8', // Cobalt - civic authority
  'Dahab':              '#c8962a', // Gold - merchant wealth
  'Qabal':              '#8050c8', // Violet - arcane summoners
  'Assassins':          '#404858', // Shadow - Children of the Mountain
  'Ashalan':            '#2a9a8a', // Teal - ancient crystalline immortals
  "Ra'Shari":           '#c87030', // Amber - wagon-folk, firelight
  'Senpet':             '#c8a030', // Desert gold - Senpet empire
  'Yodotai':            '#a0a0b0', // Silver - iron legion
  'Ebonites':           '#3060a8', // Sapphire - Ebon Stone guardians
  'Jackals':            '#c84030', // Crimson - lawless and dangerous
  'Merchants':          '#c8962a', // Gold - commerce
  'Rogues / Foreigners':'#7a5030', // Bronze - outsiders
  'Independent':        '#4a8a40', // Jade - free agents
  'Creatures':          '#707078', // Ash grey - monsters and beasts
};


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

export const SUBFACTION_DESCRIPTIONS = {
  // City Guard
  'City Guard': "The only legal armed force in Medinaat al-Salaam, the City Guard maintains order under the Caliph's authority. Guardsmen come from every faction - many houses enroll their warriors here to gain the legal right to bear weapons openly. The Qadi, the city's judges and magistrates, are all former guardsmen. Service is respected but unglamorous; the work is dirty, the pay modest, and the politics treacherous.",

  // Dahab Houses
  'House Asmari': "The eldest of the Dahabi houses, House Asmari made its fortune in bulk trade - grain, livestock, and building materials. They are known for brute pragmatism, preferring direct force to subtlety. Their warriors are among the most feared in the merchant quarter, and they have long-standing ties to the City Guard that other houses envy.",
  'House Basiri': "Scholars and alchemists, House Basiri's wealth flows from knowledge - particularly knowledge others would pay dearly to keep secret. They deal in rare books, arcane formulae, and forbidden information. Their members are disproportionately intelligent, and their inner circle is rumored to include sahir who never formally joined the Qabal.",
  'House Enour': "House Enour controls the flow of will - they are kingmakers, political brokers, and the architects of alliances across the city. Their coin funds elections, their pressure dissolves inconvenient marriages, and their grudges last for generations. They are patient, methodical, and almost impossible to outmaneuver on their home ground of politics.",
  'House Haffit': "The acrobats of commerce, House Haffit deal in speed - fast ships, fast horses, fast couriers. They run the city's most reliable courier network and maintain depots across the desert trade routes. Their enforcers are known for their agility and their willingness to operate in environments no sane merchant would enter.",
  'House Hazaad': "Once favored by the Immortal Caliph herself, House Hazaad holds the most dangerous secret in Dahab: they were legally permitted to practice sahir magic under the old regime. With the Caliph dead, that dispensation is contested - but so is the power behind it. House Hazaad walks a knife's edge between the Qabal's suspicion and the Guard's authority.",
  'House Mendadi': "Reflexes, they say in the merchant quarter, are a House Mendadi virtue. They work in swift, decisive deals - spices, silk, and items that move too fast for customs agents. They have the best network of lookouts and informants of any house, and their enforcers are famous for striking first and asking questions afterward.",
  'House Menjari': "Famed for the merchant who first brought a gorilla to the city - and turned the spectacle into a gold mine - House Menjari specializes in the exotic. Foreign goods, imported novelties, creatures from distant lands. They cultivate Perception as a virtue: the ability to see what will be fashionable before anyone else does.",
  'House Rashid': "The oldest money in Dahab belongs to House Rashid - old enough that their ancestors remember when the current merchant quarter was a camel market. They deal in endurance: long-term contracts, patient investments, multi-generational partnerships. Their Stamina as a house mirrors their Stamina as merchants. They are slow to anger and very slow to forgive.",

  // Qabal
  'Traditionalists': "The Traditionalists believe Hakhim's Seal exists for a reason, and that reason has not changed in a thousand years. They teach magic only to those who have proven themselves worthy through years of study, and they distrust innovation as much as they distrust outsiders. Their techniques are older, their discipline stricter, and their power arguably deeper.",
  'Progressivists': "The Progressivists believe that the sahir tradition must evolve or atrophy. They experiment with new disciplines, accept students from unusual backgrounds, and are more willing to share knowledge with allied factions. Their critics say they are reckless; their supporters say they are the only reason the Qabal is still relevant in a changed city.",

  // Assassins
  'Qadi / Caliphate Guards': "The public face of the Order - guardsmen and magistrates who serve the law while serving the Mountain's agenda. They gather intelligence, protect strategic interests, and make sure that the right people receive justice. Their Perception is their greatest asset: they see everything, remember everything, and report to the Order what the city cannot afford to know.",
  'Daughters / Sons of the Mountain': "The warrior heart of the Assassins, trained at the hidden Keep. Slayers, Keepers, Duelists - all begin here. Their training is brutal and their loyalty absolute. The female membership dominates the highest ranks, carrying the ancient traditions of the Order. Those who emerge carry the Mountain's mark: excellence, silence, and the knowledge of when to act.",
  'Order of the Blood-Red Tiger': "A splinter tradition within the Assassins, the Blood-Red Tiger emphasizes aggressive attack over patient observation. Their members are faster, more reckless, and more willing to operate in the open. Some say they are the Order's answer to a world that no longer fears subtlety. Others say they are a liability that will eventually get the whole Order killed.",

  // Ashalan
  'Ashalan': "Ancient blue-skinned immortals, created by jinn at the dawn of the world, the Ashalan live beneath Medinaat al-Salaam in the City of the Seventh Star. Their tattoos glow with Shilah's power - beautiful in darkness, deadly in direct sunlight. Once the Council of Twelve led them; now only three of the original twelve remain. They watch, advise, and endure, searching for ways to preserve a race that the world slowly forgets.",

  // Ra'Shari
  "Great Caravan of Commerce": "The merchants and dealers of the Ra'Shari world, the Commerce Caravan does not merely sell goods - they are living repositories of market knowledge, price history, and trade route information across the entire Burning Sands. Their Willpower comes from the discipline of negotiation: knowing when to hold and when to yield.",
  "Great Caravan of Entertainment": "Dancers, storytellers, musicians, and illusionists - the Entertainment Caravan is both the Ra'Shari's public face and their most effective cover. While audiences watch the performance, the Caravan watches the audience. Their Awareness is legendary, and their ability to vanish into a crowd is unmatched.",
  "Great Caravan of Memory": "Scholars and archivists of the Ra'Shari tradition, the Memory Caravan carries the history of their people in their minds - and the history of everyone else's people too. Their Intelligence is their armor. They know things that the city's great libraries have forgotten, and they sell that knowledge carefully, to those who can be trusted to use it well.",
  "Great Caravan of Mysticism": "Diviners, seers, and the most spiritually gifted of the Ra'Shari. The Mysticism Caravan interprets the bones - the Cokaloi - and reads the patterns of fate. Their Perception goes beyond the physical; they see connections that others miss and patterns in events that seem random. They are the keepers of the old task the Ashalan gave their people.",

  // Senpet
  'Senpet': "Warriors of the Ten Thousand Gods, the Senpet come from a vast empire to the south and west. Their religion permeates every aspect of their lives - even their magic is a form of devotion. Senpet warriors in Medinaat al-Salaam serve as soldiers, mercenaries, and missionaries. They are disciplined, proud, and convinced that their gods' favor is both real and deserved.",

  // Yodotai
  'Yodotai': "Soldiers of an empire that has conquered everything it has touched, the Yodotai bring their military discipline, their unit tactics, and their unshakeable belief in the Yodotai Way to every posting. They are not comfortable in the Burning Sands - too much sand, too little order - but they are effective. Their Strength is legendary and their unit cohesion unmatched.",

  // Ebonites
  'Order of the Ebon Hand': "Knights of an ancient order dedicated to fighting the Khadi and the undead, the Ebonites have come to Medinaat al-Salaam because this is where the battle is thickest. Their Integrity is their weapon as much as their swords. They accept recruits from any background and any faction, provided those recruits can pass the Test of the Ebon Stone - a trial that breaks most who attempt it.",

  // Jackals
  'Jackals': "The criminal underground of Medinaat al-Salaam - smugglers, necromancers, assassins who work for coin rather than principle. The Jackals are not a unified faction so much as a shared identity: everyone who operates outside the law, everyone who profits from what the city officially forbids. Their Agility is survival: the ability to move fast, shift identity, and be somewhere else when the Guard arrives.",

  // Merchants
  'Independent Merchant': "Not every merchant belongs to one of the great Houses. Independent traders navigate the city without the protection of a House name - which means no political cover, no enforcers, and no bailouts. What they gain is freedom: the ability to deal with anyone, broker agreements that House pride would forbid, and keep all of the profit. Their Awareness comes from necessity: in this city, an unaffiliated merchant who isn't watching will not be an unaffiliated merchant for long.",

  // Rogues
  'Rogue': "Former soldiers, disgraced nobles, travelers stranded far from home - rogues are defined by what they are not. No faction, no House, no Order. They survive on adaptability and the willingness to do what others won't. The city always needs people who ask no questions.",
  'Foreigner': "You came from elsewhere. Rokugan, the Ivory Kingdoms, the far north - it doesn't matter much. What matters is that Medinaat al-Salaam is not your home and everyone can tell. That's a disadvantage in politics and an advantage in the shadows: no one expects you to know the rules.",

  // Independent
  'Free Agent': "You belong to no faction by choice. This is either principled independence or dangerous foolishness depending on who you ask. Free Agents operate in the spaces between the great powers, taking contracts from anyone and answering to no one. The Willpower required to maintain neutrality in this city is considerable.",
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
    craftInputItem: 'Belladonna Berries', craftInputCost: '1 Copper', dosesProduced: 1,
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
    craftInputItem: 'Shosuro Poppy Pods', craftInputCost: '1 Copper', dosesProduced: 1,
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
    craftInputItem: 'Strychnos Nut Crystals', craftInputCost: '1 Copper', dosesProduced: 1,
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
    craftInputItem: 'Red Cinnabar Clay', craftInputCost: '1 Copper', dosesProduced: 1,
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
    craftInputItem: 'Dried Madder-Root Bundle', craftInputCost: '1 Copper', dosesProduced: 1,
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
    craftInputItem: 'Oleander Nectar', craftInputCost: '1 Copper', dosesProduced: 1,
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
    craftInputItem: 'Venom-Milking Vial (snake) or Preserved Stinger Venom (scorpion)', craftInputCost: '1 Copper', dosesProduced: 1,
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
    craftInputItem: 'Strangle-Weed Petals', craftInputCost: '1 Copper', dosesProduced: 1,
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
    craftInputItem: 'Black Lotus Extract', craftInputCost: '1 Copper', dosesProduced: 1,
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
    craftInputItem: 'Ground Arsenic Ore', craftInputCost: '1 Copper', dosesProduced: 1,
    color: '#7a3a3a',
  },
  {
    name: 'Mundane Powder (Blinding Dust)',
    delivery: 'Reflexes / Assassin Ranged Weapons or blowgun',
    duration: '10 minus victim Stamina rounds (minimum 1)',
    craft: 'Craft (Powders) TN 10 per dose. Free materials (dirt/refuse). +2 Raises per extra effect.',
    effects: ['Blindness', 'Choking (Stamina TN 15 per action or lose it)', 'Itching (-10 Initiative)'],
    note: 'Easier to craft and explain. Masks grant +10 TN to be hit by any powder attack.',
    craftInputItem: 'Bleached Gypsum Dust', craftInputCost: 'Free', dosesProduced: 1,
    color: '#6a5a30',
  },
];


// Maps technique names to which skills/areas they modify - used to show glow badges on skill rows
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
  // Senpet (placeholder - add as schools are built out)
  // Yodotai, Ebonites, Jackals - to be added when those school techniques are confirmed
};


export const SCHOOL_DATA = {
  'Soldier of the City Guard': { faction:'City Guard', type:'Warrior', integrity:5.5, bonus_trait:'Reflexes', skills:['Athletics','Defense','Lore: Law','Investigation','Spears','Swordsmanship','Intimidation'], techniques:{1:'Trained For War',2:'Strike With Fury',3:'Implacable Foe',4:'Instrument of the Caliph',5:'The Sublime Warrior'}, equipment:['Longsword','Shortsword','Composite Bow','Light Armor','Traveling Pack'], starting_copper:3 },
  'Dahabi Enforcer': { faction:'Dahab', type:'Warrior', integrity:2.5, bonus_trait:'Strength', skills:['Athletics','Defense','Knives','Lore: Underworld','Staves','Swordsmanship','Intimidation'], techniques:{1:'Moonless Night',2:'Dangerous Maneuvers',3:'Show of Force',4:'Bitter Shadows',5:'Final Strike'}, equipment:['Longsword','Knife','Light Armor','Traveling Pack'], starting_copper:5 },
  'Dahabi Bargainer': { faction:'Dahab', type:'Sahir', integrity:1.5, bonus_trait:'Perception', skills:['Calligraphy','Commerce','Courtier','Divination','Medicine','Spellcraft','Sincerity'], techniques:{1:'Penetrating Words'}, equipment:['Knife','Fine Clothes','Traveling Pack'], starting_copper:20 },
  'Dahabi Merchant': { faction:'Dahab', type:'Diplomat', integrity:4.5, bonus_trait:'Awareness', skills:['Commerce','Courtier','Sincerity','Etiquette','Lore: Underworld','Temptation','Storytelling'], techniques:{1:'Master of the Subtle Flow',2:'Upstanding Citizen',3:'An Eye for a Deal',4:'Silver Tongued Devil',5:'Merchant King'}, equipment:['Longsword','Knife','Fine Clothes','Traveling Pack'], starting_copper:5 },
  'Qabal Agent': { faction:'Qabal', type:'Diplomat', integrity:1.5, bonus_trait:'Perception', skills:['Sincerity','Etiquette','Forgery','Investigation','Sleight of Hand','Stealth','Commerce'], techniques:{1:'No One of Import',2:'A Good Excuse',3:'Unassailable Reputation',4:'The Ordered Bolthole',5:'Pillar of the Community'}, equipment:['Knife','Clothes','Cloak','Calligraphy Kit'], starting_copper:5 },
  'Qabal Summoner': { faction:'Qabal', type:'Sahir', integrity:2.5, bonus_trait:'Intelligence', skills:['Calligraphy','Divination','Spellcraft','Lore: Theology','Lore: History','Meditation','Etiquette'], techniques:{1:'The Crucible of Knowledge'}, equipment:['Staff','Knife','Clothes','Traveling Pack'], starting_copper:5 },
  'Assassin Slayer': { faction:'Assassins', type:'Ninja', integrity:1.5, bonus_trait:'Agility', skills:['Acting','Athletics','Sincerity','Stealth','Lore: Underworld','Knives','Assassin Ranged Weapons'], techniques:{1:'All Shadows Walk in the Light',2:'Rite of Assassination',3:'Let Him Bleed',4:'Blood Calls for Blood',5:'Swifter Than Life Itself'}, equipment:['Knife','Jambiya','Throwing Stone','Fine Robes','Traveling Pack'], starting_copper:10 },
  'Assassin Keeper': { faction:'Assassins', type:'Ninja', integrity:1.5, bonus_trait:'Reflexes', skills:['Athletics','Defense','Etiquette','Investigation','Swordsmanship','Lore: Burning Sands','Stealth'], techniques:{1:"The Keeper's Courage",2:"The Keeper's Judgment",3:"The Keeper's Justice",4:"The Keeper's Art",5:'By the Force of Will Alone'}, equipment:['Sayf-saghir','Shortsword','Composite Bow','Light Armor','Robes'], starting_copper:3 },
  'Blood-Sworn': { faction:'Ashalan', type:'Warrior', integrity:5.5, bonus_trait:'Strength', skills:['Athletics','Battle','Defense','Swordsmanship','Polearms','Lore: Theology','Knives'], techniques:{1:'Blessed by the Crystal',2:'Your Blood is My Blood',3:'Fortification in Form',4:'To Fight for the Future',5:'One is Never Truly Alone'}, equipment:['Ashalan Scimitar','Khadja','Composite Bow','Light Armor','Robe'], starting_copper:5 },
  'Children of Midnight': { faction:'Ashalan', type:'Sahir', integrity:4.5, bonus_trait:'Awareness', skills:['Divination','Lore: History','Medicine','Meditation','Spellcraft','Lore: Theology','Lore: Burning Sands'], techniques:{1:'Wisdom of the Stars'}, equipment:['Ashalan Scimitar','Khadja','Robe','Traveling Pack'], starting_copper:5 },
  'Heart-Seekers': { faction:'Ashalan', type:'Warrior', integrity:5.5, bonus_trait:'Willpower', skills:['Battle','Defense','Investigation','Lore: Khadi','Spellcraft','Stealth','Swordsmanship'], techniques:{1:'Truth is My Ally',2:'Diligence is the Best Teacher',3:'One Mind, One Action',4:'Bane of the Heartless',5:'My Will is My Fortress'}, equipment:['Ashalan Scimitar','Khadja','Composite Bow','Light Armor','Robe'], starting_copper:3 },
  "Ra'Shari Knife-Fighter": { faction:"Ra'Shari", type:'Warrior', integrity:3.5, bonus_trait:'Agility', skills:['Temptation','Defense','Divination','Knives','Perform: Dancing','Tahaddi','Athletics'], techniques:{1:'The Endless Dance',2:'Flashing Talons',3:'Through the Cracks',4:'Two Knives, Two Wounds',5:'Strike to Slay'}, equipment:['Knife','Knife','Staff','Clothes','Cloak'], starting_copper:5 },
  "Ra'Shari Trader": { faction:"Ra'Shari", type:'Diplomat', integrity:2.5, bonus_trait:'Intelligence', skills:['Temptation','Commerce','Courtier','Etiquette','Lore: Underworld','Sincerity','Storytelling'], techniques:{1:'Opening Offer',2:'Acquiring the Goods',3:'Making the Deal',4:'Expediency is Important',5:'The Perfect Supplier'}, equipment:['Staff','Clothes','Cloak','Scales'], starting_copper:10 },
  "Ra'Shari Diviner": { faction:"Ra'Shari", type:'Sahir', integrity:3.5, bonus_trait:'Perception', skills:['Temptation','Divination','Medicine','Spellcraft','Lore: Theology','Perform: Dancing','Lore: Burning Sands'], techniques:{1:'The Whispers of the Song'}, equipment:['Knife','Staff','Clothes','Cloak','Traveling Pack'], starting_copper:5 },
  'Senpet Legionnaire': { faction:'Senpet', type:'Warrior', integrity:4.5, bonus_trait:'Reflexes', skills:['Battle','Defense','Hunting','Swordsmanship','Lore: Theology','Athletics','Spears'], techniques:{1:'Divine Insight',2:'Divine Strength',3:'Divine Retribution',4:'The Gods Protect Me',5:'The Gods Guide my Hand'}, equipment:['Khopesh','Senpet Chain Shirt','Sandals','Tunic'], starting_copper:5 },
  'Senpet Charioteer': { faction:'Senpet', type:'Warrior', integrity:4.5, bonus_trait:'Agility', skills:['Archery','Battle','Horsemanship','Swordsmanship','Lore: Theology','Defense','Athletics'], techniques:{1:'Ride Into Battle',2:'Swift Volley',3:'Speed is my Armor',4:'Ruthless Advance',5:'Deadly Strike'}, equipment:['Khopesh','Composite Longbow','Senpet Chain Shirt','Sandals'], starting_copper:5 },
  'Senpet Sahir': { faction:'Senpet', type:'Sahir', integrity:3.5, bonus_trait:'Intelligence', skills:['Defense','Medicine','Meditation','Spellcraft','Lore: Theology','Battle','Lore: History'], techniques:{1:'By the Grace of the Gods'}, equipment:['Sandals','Tunic','Traveling Pack'], starting_copper:5 },
  'Yodotai Legionnaire': { faction:'Yodotai', type:'Warrior', integrity:4.5, bonus_trait:'Agility', skills:['Battle','Defense','Horsemanship','Lore: Yodotai History','Spears','Swordsmanship','Athletics'], techniques:{1:'Tortoise Formation',2:'In Close Quarters',3:'Deadly Strike (Legionnaire)',4:'Wedge Formation',5:'With My Brothers'}, equipment:['Gladius','Pilum','Lorica Segmentata','Sandals','Tunic'], starting_copper:5 },
  'Yodotai Mercenary': { faction:'Yodotai', type:'Diplomat', integrity:3.5, bonus_trait:'Reflexes', skills:['Intimidation','Defense','Etiquette','Spears','Swordsmanship','Sincerity','Battle'], techniques:{1:'Importance of Speed',2:'Stranger in a Foreign Land',3:'Unfriendly Glare',4:'Combat Diplomacy',5:'Hoplon Bash'}, equipment:['Gladius','Pilum','Yodotai Chain Shirt','Sandals','Tunic'], starting_copper:5 },
  'Ebonite Templar': { faction:'Ebonites', type:'Warrior', integrity:5.5, bonus_trait:'Reflexes', skills:['Defense','Investigation','Lore: Law','Lore: Theology','Swordsmanship','Lore: Ebonites','Athletics'], techniques:{1:'Tapping the Inner Strength',2:'By Thy Will',3:'The Ebon Hand',4:'By Word Or By Sword',5:'Will of the Stone'}, equipment:['Ebonite Longsword','Knife','Ebonite Armor','Sturdy Clothing'], starting_copper:10 },
  'Jani': { faction:'Jackals', type:'Warrior', integrity:1.5, bonus_trait:'Agility', skills:['Athletics','Brawling','Knives','Acting','Assassin Ranged Weapons','Staves','Lore: Underworld'], techniques:{1:'Quicker Than the Eye',2:'What the Eye Sees, What the Ear Hears',3:'Strike Quickly, Strike True',4:'Seen and Not Noticed',5:'Blinding Speed'}, equipment:['Knife','Light Armor','Street Clothes'], starting_copper:1 },
  'Necromancer': { faction:'Jackals', type:'Sahir', integrity:0.5, bonus_trait:'Intelligence', skills:['Medicine','Knives','Lore: Jackal','Lore: Undead','Lore: History','Spellcraft','Staves'], techniques:{1:'Initiate of Undeath',2:'Master of Undeath and Death',3:'Creator of Undeath',4:'Leader of Undead',5:'Agent of Death'}, equipment:['Knife','Staff','Robe','Sandals'], starting_copper:2 },
  'Kabir': { faction:'Jackals', type:'Diplomat', integrity:2.5, bonus_trait:'Awareness', skills:['Courtier','Sincerity','Knives','Medicine','Craft: Poison','Sleight of Hand','Lore: Underworld'], techniques:{1:'Rotting the Foundation',2:'A Honeyed Tongue',3:'Killing with Subtlety',4:'Tearing Out the Foundation',5:'Jackal Ambassador'}, equipment:['Knife','Apothecary Kit','Clothes','Shoes'], starting_copper:2 },
  'Free Sahir': { faction:'Independent', type:'Sahir', integrity:4.5, bonus_trait:'Willpower', skills:['Etiquette','Spellcraft','Lore: Theology','Lore: History','Lore: Burning Sands','Athletics','Stealth'], techniques:{1:'Self-Taught Sorcerer'}, equipment:['Staff','Knife','Clothes','Cloak','Traveling Pack'], starting_copper:5 },
  'Alley Thug': { faction:'Independent', type:'Path', integrity:2.5, bonus_trait:'Strength', skills:['Brawling','Intimidation','Knives','Stealth','Lore: Underworld','Athletics','Sincerity'], techniques:{1:'Predator of the Alleys'}, equipment:['Knife','Street Clothes'], starting_copper:2 },
  'Scholar': { faction:'Independent', type:'Path', integrity:3.5, bonus_trait:'Intelligence', skills:['Calligraphy','Etiquette','Storytelling','Lore: History','Lore: Theology','Lore: Law','Lore: Burning Sands'], techniques:{1:'A Man of Knowledge'}, equipment:['Writing Kit','Book','Traveling Clothes'], starting_copper:5 },
  'Street Rat': { faction:'Independent', type:'Path', integrity:2.0, bonus_trait:'Agility', skills:['Athletics','Stealth','Sleight of Hand','Lore: Underworld','Brawling','Knives','Sincerity'], techniques:{1:'Master of the Streets'}, equipment:['Knife','Street Clothes'], starting_copper:1 },
};

// size: 'small' (-5 off-hand), 'medium' (-10 off-hand), 'large' (-15 off-hand, two-handed)
// twoHanded: true = cannot be used with another weapon in off-hand
export const WEAPONS_LIST = [
  { name:'Longsword',    dr:'3k2', skill:'Swordsmanship', price:'15c', size:'large',  twoHanded:false, isSword:true, special:'Sword: Void spend gives +1 kept die on damage (once per roll)' },
  { name:'Scimitar',     dr:'4k2', skill:'Swordsmanship', price:'20c', size:'medium', twoHanded:false, isSword:true, special:'Sword: Void spend gives +1 kept die on damage (once per roll)' },
  { name:'Shortsword',   dr:'2k2', skill:'Swordsmanship', price:'7c',  size:'medium', twoHanded:false, isSword:true, special:'Sword: Void spend gives +1 kept die on damage (once per roll)' },
  { name:'Gladius',      dr:'2k2', skill:'Swordsmanship', price:'-',   size:'medium', twoHanded:false, isSword:true, special:'Yodotai sword: Void spend gives +1 kept die on damage (once per roll)' },
  { name:'Khopesh',      dr:'3k2', skill:'Swordsmanship', price:'-',   size:'medium', twoHanded:false, isSword:true, special:'Senpet sword: +Str to rolled dice like an axe; Void spend gives +1 kept die on damage (once per roll)' },
  { name:'Knife',        dr:'1k1', skill:'Knives',        price:'2c',  size:'small',  twoHanded:false, special:'Free draw; throwable 30ft' },
  { name:'Jambiya',      dr:'1k1', skill:'Knives',        price:'2c',  size:'small',  twoHanded:false, special:'Free draw; throwable 30ft' },
  { name:'Kindjal',      dr:'1k1', skill:'Knives',        price:'2c',  size:'small',  twoHanded:false, special:'Free draw; throwable 30ft' },
  { name:'Spear',        dr:'2k2', skill:'Spears',        price:'5c',  size:'large',  twoHanded:true,  special:'Thrown 1k2/30ft' },
  { name:'Lance',        dr:'1k2', skill:'Spears',        price:'15c', size:'large',  twoHanded:true,  special:'3k4 charging; mounted only' },
  { name:'Khadja',       dr:'1k3', skill:'Polearms',      price:'-',   size:'large',  twoHanded:true,  faction:'Ashalan', special:'Ashalan' },
  { name:'Pilum',        dr:'2k2', skill:'Spears',        price:'-',   size:'large',  twoHanded:true,  special:'Yodotai; throwable' },
  { name:'Staff',        dr:'0k2', skill:'Staves',        price:'1c',  size:'large',  twoHanded:true,  special:'Free Raise Knockdown' },
  { name:'Heavy Club',   dr:'1k3', skill:'Heavy Weapons', price:'2c',  size:'large',  twoHanded:true,  special:'Str 3 req' },
  { name:'Mace',         dr:'0k2', skill:'Heavy Weapons', price:'2c',  size:'medium', twoHanded:false, special:'Str 3 req; –10 armor TN' },
  { name:'War Axe',      dr:'0k3', skill:'Heavy Weapons', price:'1c',  size:'medium', twoHanded:false, special:'One-handed' },
  { name:'Standard Bow', dr:'2k2', skill:'Archery',       price:'10c', size:'large',  twoHanded:true,  special:'Range 300ft; two-handed ranged - cannot dual wield' },
  { name:'Shortbow',     dr:'2k2', skill:'Archery',       price:'5c',  size:'large',  twoHanded:true,  special:'Range 100ft; two-handed ranged - cannot dual wield; free-action draw' },
  { name:'Horseback Bow', dr:'4k2', skill:'Archery',      price:'20c', size:'large',  twoHanded:true,  special:'Str 3 (min 1) required; Range 400ft; −10 TN penalty used on foot' },
  { name:'Weighted Chain', dr:'2k1', skill:'Chain',       price:'5c',  size:'medium', twoHanded:false, special:'2 Free Raises to Disarm/Knockdown; a failed contest grapples the target' },
  { name:'Small Club',   dr:'0k2', skill:'Staves',        price:'-',   size:'small',  twoHanded:false, special:'Sold in pairs (50 pool); Emphasis: both clubs together deal 1k3, no penalty' },
  { name:'Blowgun',      dr:'-',  skill:'Assassin Ranged Weapons', price:'-', size:'small', twoHanded:false, special:'Range 30ft; deals a flat 1 wound rank on hit (not a dice roll - apply manually, not automated); often poisoned; armor TN doubled' },
  { name:'Throwing Stone', dr:'1k1', skill:'Assassin Ranged Weapons', price:'-', size:'small', twoHanded:false, special:'Free or 2 pool; no Strength bonus to damage; 10s do not explode' },
  // Ashalan (mostly loot/steal/persuade-only per the conversion doc - not stocked in any shop, but
  // available here so Ashalan-faction characters and NPCs can actually equip their signature gear)
  { name:'Adiva',        dr:'2k1', skill:'Knives',        price:'-',   size:'small',  twoHanded:false, faction:'Ashalan', special:'Ashalan; loot/steal only; +1k0 to attack rolls in knife fights' },
  { name:'Ashalan Scimitar', dr:'4k2', skill:'Swordsmanship', price:'-', size:'medium', twoHanded:false, isSword:true, faction:'Ashalan', special:'Ashalan; loot/steal only; most common Ashalan weapon; +1k0 to attack rolls; Void spend gives +1 kept die on damage' },
  { name:'Falchion',     dr:'3k2', skill:'Swordsmanship', price:'-',   size:'medium', twoHanded:false, isSword:true, faction:'Ashalan', special:'Ashalan; loot/steal only; 4k2 if crysteel; +1k0 to attack rolls even non-crysteel; Void spend gives +1 kept die on damage' },
  { name:'Ashalan Scythe', dr:'1k4', skill:'Unique',      price:'1c',  size:'large',  twoHanded:true,  faction:'Ashalan', special:'Ashalan; conversion doc override (core book lists 2k4/Polearms) - loot/steal only' },
  { name:'The Khadja',   dr:'4k4', skill:'Polearms',      price:'-',   size:'large',  twoHanded:true,  faction:'Ashalan', special:'Ashalan; unique legendary artifact, not for sale; crysteel, Masterwork; once per day, an extra attack for 4 rounds' },
  { name:'Najya',        dr:'3k2', skill:'Unique-Knives', price:'-',   size:'medium', twoHanded:false, faction:'Ashalan', special:'Ashalan; conversion doc override (core book lists 4k2/Swordsmanship) - cannot be purchased' },
  { name:"Blades of the Blood-Sworn", dr:'2k3', skill:'Swordsmanship', price:'-', size:'medium', twoHanded:false, isSword:true, faction:'Ashalan', special:'Ashalan; not for sale; crysteel - auto Fine quality, harms oni/the Lying Darkness; Void spend gives +1 kept die on damage' },
  // Assassin
  { name:'Sayf-saghir',  dr:'2k2', skill:'Swordsmanship', price:'-',   size:'medium', twoHanded:false, isSword:true, faction:'Assassin', special:'Assassin; Void spend gives +1 kept die on damage' },
  { name:'Choking Cord', dr:'1k1', skill:'Chain',         price:'1c',  size:'small',  twoHanded:false, faction:'Assassin', special:'Assassin; deals damage only while controlling a grapple (per turn); Free Raise to initiate a grapple vs an unaware target' },
  // Senpet
  { name:'Shamshir',     dr:'2k2', skill:'Swordsmanship', price:'10c', size:'medium', twoHanded:false, isSword:true, faction:'Senpet', special:'Senpet; light scimitar, common secondary weapon; Void spend gives +1 kept die on damage' },
  { name:'Composite Longbow', dr:'2k2', skill:'Archery', price:'30c', size:'large',  twoHanded:true,  faction:'Senpet', special:'Senpet; Str 3 required; Range 400ft; damage scales with arrows used' },
  // Yodotai
  { name:'Claymore',     dr:'3k3', skill:'Swordsmanship', price:'10c', size:'large',  twoHanded:true,  faction:'Yodotai', special:'Yodotai; Str 3 required; gets a Heavy Weapon Strength bonus; Void spend gives +1 kept die on damage' },
  { name:'Pugio',        dr:'1k1', skill:'Knives',        price:'1c',  size:'small',  twoHanded:false, faction:'Yodotai', special:'Yodotai; standard secondary weapon; free draw; throwable 30ft' },
  // Ebonite
  { name:'Ebonite Longsword', dr:'3k2', skill:'Swordsmanship', price:'-', size:'medium', twoHanded:false, isSword:true, faction:'Ebonite', special:"Ebonite; Order members only, else arrested on sight; individually hand-crafted, one per new templar; Void spend gives +1 kept die on damage" },
  { name:'Unarmed',      dr:'1k1', skill:'Brawling',      price:'-',   size:'small',  twoHanded:false, special:'Default when no weapon drawn' },
];

export const GEAR_LIST_NAMES = [
  'Partial Armor (+3 TN)','Light Armor (+5 TN)','Heavy Armor (+10 TN)','Riding Armor (+8 TN)',
  // Faction armor - TN bonuses already existed in ARMOR_TN_BONUS, just weren't selectable here
  'Lorica Segmentata','Senpet Chain Shirt','Yodotai Chain Shirt','Half-Plate','Ebonite Armor','Adaga',
  'Medicine Kit','Traveling Rations','Water Skin','Rope (50 ft)','Lantern','Lantern Oil','Torch','Oil Lamp',
  'Grapple Hook','Flint and Steel','Lockpicks','Calligraphy Kit','Apothecary Kit',
  'Backpack','Tent (small)','Traveling Cloak','Suit of Clothes','Fine Clothes',
  'Sandals','Shoes','Blanket','Coin Purse','Personal Seal','Quiver (60 arrows)',
  // Arrow types - reference/inventory items with their own DR. Not wired into the attack roller as
  // switchable ammo yet (Archery attacks always use the bow's own DR) - that's a bigger follow-up.
  'Armor Piercing Arrows (20)','Flesh Cutter Arrows (20)','Signal Arrows (10)',
  'Musical Instrument','Book / Scroll','Writing Paper','Whetstone',
  'Generic Poison (dose)','Fire Biter (dose)','Night Milk (dose)','Snake Venom (dose)',
  'Spider Venom (dose)','Wish You Dead (dose)','Stolen Breath (dose)','Hot Madness (dose)',
  'Poison Powder (dose)','Blinding Dust (dose)',
  // Mounts & stable supplies
  'Camel','Horse','Saddle','Saddlebags','Feed (1 week)','Bridle and Reins','Hitching Post Fee (1 night)',
];

// Gear descriptions for tooltips - keyed by name
export const GEAR_DESCRIPTIONS = {
  'Partial Armor (+3 TN)':  '+3 Armor TN. Protects key areas without full encumbrance. No penalty to movement.',
  'Light Armor (+5 TN)':    '+5 Armor TN. Standard leather or padded armor worn by guards and soldiers.',
  'Heavy Armor (+10 TN)':   '+10 Armor TN. Full plate or chain. Reduces Water Ring for movement purposes.',
  'Riding Armor (+8 TN)':   '+8 Armor TN. Designed for mounted combat; less effective on foot.',
  'Medicine Kit':            'Required for Medicine skill rolls. Contains bandages, poultices, herbs. Can treat Wounds in the field.',
  'Traveling Rations':       'Preserved food for 1 week of travel. Required for survival rolls in the desert.',
  'Water Skin':              'Holds enough water for 1-2 days in the desert. Essential for desert travel.',
  'Rope (50 ft)':            '50 feet of sturdy hemp rope. Used for climbing, binding, and improvised traps.',
  'Lantern':                 'Provides light in a 30-foot radius. Requires oil to operate. Casts light in a Battle Grid encounter while equipped (see Light Sources).',
  'Lantern Oil':             'Fuel for a lantern. One flask lasts approximately 6 hours.',
  'Torch':                   'A length of wood wrapped in oil-soaked cloth, lit with Flint and Steel. Cruder and dimmer than a lantern, but free of oil upkeep. Casts light in a Battle Grid encounter while equipped (see Light Sources).',
  'Oil Lamp':                'A small clay or brass lamp burning oil - common indoors, dimmer and shorter-ranged than a lantern. Casts light in a Battle Grid encounter while equipped (see Light Sources).',
  'Grapple Hook':            'Iron hook with rope. Used with Athletics for climbing walls or crossing gaps.',
  'Flint and Steel':         'Used to start fires. Required for making camp in the desert without magic.',
  'Lockpicks':               'A set of fine tools for opening locks. Required for Sleight of Hand (Lockpicking) rolls.',
  'Calligraphy Kit':         'Ink, brushes, and paper. Required for Calligraphy skill rolls and scribing documents.',
  'Apothecary Kit':          'Vials, mortars, and reagents for preparing medicines and poisons. Required for Craft: Poison.',
  'Backpack':                'Carries up to 30 lbs of gear without encumbrance penalties.',
  'Tent (small)':            'Shelter for 1-2 people. Provides protection from desert heat and sandstorms.',
  'Traveling Cloak':         'Provides modest protection from weather. +1k0 to rolls to resist environmental effects.',
  'Suit of Clothes':         'Standard everyday clothing appropriate to your station.',
  'Fine Clothes':            'Quality clothing that grants +1k0 to Social rolls in formal settings.',
  'Sandals':                 'Basic footwear. Standard for most inhabitants of Medinaat al-Salaam.',
  'Shoes':                   'Closed-toe footwear offering more protection than sandals.',
  'Blanket':                 'Warmth for desert nights. Required for comfortable rest without shelter.',
  'Coin Purse':              'A sturdy pouch for carrying copper. Holds up to 100 coins securely.',
  'Personal Seal':           'A carved seal used to authenticate documents. Grants +1k0 to Calligraphy rolls for official documents.',
  'Quiver (60 arrows)':      '60 arrows for a bow. Standard load for an archer.',
  'Armor Piercing Arrows (20)': 'Ignores the target\'s armor TN bonus. 4 pool per arrow.',
  'Flesh Cutter Arrows (20)': 'Armor TN doubled against these; range halved. 5 pool per arrow.',
  'Signal Arrows (10)':      'A loud whistle on flight - signaling or distraction only, not a combat arrow. 10 pool per arrow.',
  'Lorica Segmentata':       'Yodotai armor. +5 Armor TN; +5 TN penalty to Stealth only.',
  'Senpet Chain Shirt':      'Senpet armor. +5 Armor TN; +3 TN penalty to Agility/Reflexes rolls; no bonus vs piercing.',
  'Yodotai Chain Shirt':     'Yodotai armor. +7 Armor TN; +5 TN penalty to Agility/Reflexes rolls; no bonus vs piercing.',
  'Half-Plate':              'Yodotai armor. +10 Armor TN; +10 TN penalty to Agility/Reflexes rolls; Carapace 4 vs Swordsmanship/Knives weapons.',
  'Ebonite Armor':           'Order members only - wearing this without being Order invites arrest. +5 Armor TN; +5 TN penalty to Athletics/Stealth.',
  'Adaga':                   'Senpet body armor (not a shield despite the name). +5 Armor TN; +5 TN penalty to Agility/Reflexes rolls.',
  'Musical Instrument':      'A specific instrument (specify type). Required for Perform skill rolls.',
  'Book / Scroll':           'A written text. May grant a Free Raise on a relevant Lore roll if studied.',
  'Writing Paper':           'Paper and basic writing implements. Required for written communication.',
  'Whetstone':               'Used to sharpen blades. Spend 10 minutes: +1k0 to first Attack roll in next skirmish.',
  // Poisons
  'Generic Poison (dose)':   'TN 15 to resist (Stamina). Causes 1 Wound Level per round for 3 rounds if unresisted.',
  'Fire Biter (dose)':       'TN 20 to resist. Deals 2k2 damage ignoring armor. Burning sensation for 1 hour.',
  'Night Milk (dose)':       'TN 15 to resist. Target falls unconscious for 1 hour. No damage.',
  'Snake Venom (dose)':      'TN 20 to resist. 1k1 damage per round for a number of rounds equal to failure margin.',
  'Spider Venom (dose)':     'TN 15 to resist. Target is Fatigued for 4 hours. Muscle cramping.',
  'Wish You Dead (dose)':    'TN 25 to resist. 3k3 damage. Rare and expensive. Highly illegal.',
  'Stolen Breath (dose)':    'TN 20 to resist. Target cannot speak or cast spells for 1 hour.',
  'Hot Madness (dose)':      'TN 20 to resist. Target suffers hallucinations; all TNs +10 for 1 hour.',
  'Poison Powder (dose)':    'Inhaled contact poison, TN 15. Generic effects as Generic Poison but faster acting.',
  'Blinding Dust (dose)':    'TN 15 to resist (Reflexes). Target is blinded for 3 rounds.',
  // Mounts & stable supplies
  'Camel':                   'Riding animal and beast of burden, common throughout the Burning Sands. Can go long periods without water. Bad-tempered. Requires Horsemanship (Camel emphasis) to ride well. Stats: Earth 3, Water 3, Strength 6.',
  'Horse':                   'Not native to the Burning Sands - a status symbol for wealthy citizens. Faster than a camel but needs more water and care. Requires Horsemanship to ride well. Stats: Earth 3, Agility 3, Strength 5.',
  'Saddle':                  'Required to ride any mount in combat or for extended travel without penalty. One per mount.',
  'Saddlebags':              'Doubles the carrying capacity of a mounted character without slowing the mount.',
  'Feed (1 week)':           'One week of proper feed for a single mount. Mounts denied feed grow weak and unreliable.',
  'Bridle and Reins':        'Basic tack required for directing and controlling a mount.',
  'Hitching Post Fee (1 night)': 'Stabling fee to board and water a mount overnight at a stables or inn.',
};

// Wielded light sources - a character with one of these equipped (equipment.equipped === true) casts
// light on the Battle Grid in a radius of this many squares, same wall-blocked raycast as Player Glow
// and GM-painted 'light' tiles (see fillLightRadius in EncounterTab.jsx). Distinct from Player Glow:
// this only applies when one of these specific items is actually equipped, not a blanket per-PC glow.
// Radii are a starting design call, not derived from a real-world foot conversion - easy to retune.
export const LIGHT_SOURCES = {
  'Torch': 3,
  'Lantern': 4,
  'Oil Lamp': 2,
};

// Full rulebook entries for the magnifying-glass reference modal - richer than GEAR_DESCRIPTIONS above,
// includes flavor text and special rules paraphrased from the source material (never verbatim quotes, per
// copyright limits). Not every item has an entry yet - items without one fall back to the short
// GEAR_DESCRIPTIONS line only. Fill in more entries as items come up in play.
export const GEAR_FULL_ENTRY = {
  'Longsword': 'A full-length blade, either straight or gently curved at the tip depending on the maker\'s '
    + 'culture and taste. Built as a slashing and stabbing weapon, but equally suited to overhand cleaving and '
    + 'chopping strikes. Like all swords, the wielder may spend a single Void Point to roll and keep one extra '
    + 'die on a damage roll made with it, once per damage roll.',
  'Scimitar': 'A heavy, curved blade descended from ancient Senpet design, built for powerful slashing attacks '
    + 'rather than precision thrusts - noticeably harder-hitting than a longsword. Like all swords, the wielder '
    + 'may spend a single Void Point to roll and keep one extra die on a damage roll made with it, once per '
    + 'damage roll.',
  'Shortsword': 'Shorter than the longsword and typically straight-bladed, the shortsword is most effective '
    + 'used with an upward or overhand thrust - its narrow point can find a fatal gap in an opponent\'s armor. '
    + 'Like all swords, the wielder may spend a single Void Point to roll and keep one extra die on a damage '
    + 'roll made with it, once per damage roll.',
  'Spear': 'A six-to-eight-foot weapon used two-handed on foot or one-handed while mounted, common across many '
    + 'cultures of the Burning Sands. A basic, utilitarian weapon frequently issued to conscripts and used by '
    + 'both the Senpet and the Medinaat al-Salaam City Guard. Deals additional damage when the wielder is '
    + 'mounted, and can be thrown.',
  'Lance': 'A mounted weapon whose damage jumps significantly if the rider charges in a straight line and '
    + 'attacks in the same round. Awkward and penalized if used in close melee while mounted, and badly '
    + 'penalized if used on foot at all. Shatters if it ever inflicts more than 30 Wounds in a single attack.',
  'Staff': 'Simple to make and easy to wield, the staff is a common weapon among the lower classes, criminals, '
    + 'and wanderers alike. Sahir frequently carry one, since even a peaceful scholar finds a six-foot stick '
    + 'handy on the road.',
};




// Standard uses for each skill - shown in expandable skill rows on character sheet
export const SKILL_DESCRIPTIONS = {
  // Bugei (Combat)
  'Swordsmanship':   'Attack with swords and scimitars. Roll Agility/Swordsmanship vs target Armor TN. Damage: weapon DR.',
  'Knives':          'Attack with knives, daggers, and thrown blades. Off-hand knife at −10 TN unless you have the 3-rank mastery.',
  'Spears':          'Attack with spears, polearms with spear heads. Extra reach; +5 TN vs mounted foes at close range.',
  'Polearms':        'Attack with polearms (glaives, naginata). +1k0 damage vs mounted opponents at R5.',
  'Staves':          'Attack with staves and walking sticks. Two-handed; opponents gain no armor bonus at R3.',
  'Heavy Weapons':   'Attack with maces, mauls, hammers. Requires Strength 3+. Same Strength bonus to damage as an axe.',
  'Archery':         'Ranged attacks with bows. Cannot be used in Full Attack stance. Range = Strength × weapon range.',
  'Brawling':        'Unarmed strikes. DR = Strength k1. At R3: may grapple as Complex Action.',
  'Defense':         'Used for Full Defense action. Roll Agility/Defense (TN 5); half result replaces your Reflexes×5 for Armor TN. With Shield emphasis: doubles shield TN bonus in Full Defense.',
  'Athletics':       'Climbing, running, jumping, swimming. Roll Strength/Athletics. Also used for resisting fatigue and environmental hazards.',
  'Battle':          'Battlefield awareness, tactics, troop command. Perception/Battle to read tactical situations, direct groups, or resist Fear in mass combat.',
  'Horsemanship':    'Ride and fight from horseback. Required for Full Attack or Full Defense while mounted.',
  'Hunting':         'Tracking (Perception), Survival (Strength), or Trapping (Agility). Free Raise on Survival rolls in desert at R3.',
  'Intimidation':    'Frighten, coerce, or dominate through force of personality or physical menace. Contested vs Willpower.',
  'Stealth':         'Move silently, hide, or shadow a target. Roll vs opponent Perception. Result becomes TN to detect you.',
  'Tahaddi':         'Used in knife-duels (Tahaddi). Assessment: Awareness/Tahaddi. Strike: Reflexes/Tahaddi vs TN 5 + opponent defenses.',
  // High Skills
  'Calligraphy':     'Write beautifully; encode/decode ciphers. Intelligence/Calligraphy. Cipher emphasis required to write or read coded messages.',
  'Courtier':        'Navigate court politics, read motivations, spread rumors. Awareness/Courtier vs TN 15. Manipulation emphasis for subtle information.',
  'Divination':      'Foretell future events. Awareness/Divination vs TN 15 (once/day). Spend Void for an additional attempt.',
  'Etiquette':       'Behave correctly in social situations, avoid offense. Awareness/Etiquette. Political Maneuvering emphasis for formal positions.',
  'Games':           'Play strategy games (chess, dice, etc.). Intelligence/Games. Gambling: Perception/Games for wagering.',
  'Investigation':   'Find clues, interrogate, track. Perception/Investigation. Notice emphasis for passive observation.',
  'Lore':            'Knowledge of a specific subject. Intelligence/Lore. See sub-skills (Lore: Law, Theology, etc.).',
  'Medicine':        'Treat wounds and disease. Intelligence/Medicine vs TN 15 for field treatment. Success heals 1k1 Wounds.',
  'Meditation':      'Recover Void Points. Void/Meditation vs TN 20. Success restores 2 Void Points (4 at R5).',
  'Perform':         'Entertain an audience. Roll varies by type: Singing (Awareness), Dancing (Agility), Oratory (Awareness).',
  'Sincerity':       'Convince others you speak truly (Honesty) or deceive (Deceit). Awareness/Sincerity contested.',
  'Storytelling':    'Captivate, inspire, or boast. Awareness/Storytelling. Boasting about an ally: success raises their Reputation.',
  // Low Skills
  'Acting':          'Impersonate or disguise. Awareness/Acting vs TN to see through. Result becomes TN for others to pierce the disguise.',
  'Commerce':        'Trade, appraisal, haggling. Intelligence/Commerce. Appraisal emphasis: assess item value accurately.',
  'Sleight of Hand': 'Pick pockets, conceal items, card tricks. Agility/Sleight of Hand vs Perception.',
  'Gambling':        'Games of chance. Perception/Commerce (Gambling). Contested against other gamblers.',
  'Forgery':         'Create false documents. Intelligence/Forgery. Roll result = TN to detect the forgery.',
  'Locksmithing':    'Open locks without keys. Agility/Locksmithing vs TN set by lock quality.',
  // Spellcasting
  'Spellcraft':      'Cast Sahir spells. Intelligence/Spellcraft vs spell TN. Bonus dice for Discipline emphasis. Mastery 3: Free Raise on all spells.',
  // Other
  'Temptation':      'Seduce, bribe, or entice. Awareness/Temptation vs target Will. Seduction emphasis for romantic coercion.',
};

// Maps skill names to their primary trait and ring - used for dice pool display
export const SKILL_TRAIT_MAP = {
  // Combat / Bugei
  'Swordsmanship': { trait: 'Agility', ring: 'Fire' },
  'Knives': { trait: 'Agility', ring: 'Fire' },
  'Spears': { trait: 'Agility', ring: 'Fire' },
  'Polearms': { trait: 'Agility', ring: 'Fire' },
  'Staves': { trait: 'Agility', ring: 'Fire' },
  'Heavy Weapons': { trait: 'Agility', ring: 'Fire' },
  'Chain Weapons': { trait: 'Agility', ring: 'Fire' },
  'Archery': { trait: 'Reflexes', ring: 'Air' },
  'Tahaddi': { trait: 'Reflexes', ring: 'Air' },  // Primary = Reflexes for most rolls; Awareness for Assessment
  'Brawling': { trait: 'Strength', ring: 'Water' },
  'Defense': { trait: 'Reflexes', ring: 'Air' },
  'Athletics': { trait: 'Strength', ring: 'Water' },
  'Battle': { trait: 'Perception', ring: 'Water' },  // Primary = Perception for strategy; correct
  'Horsemanship': { trait: 'Agility', ring: 'Fire' },
  'Sailing': { trait: 'Agility', ring: 'Fire' },
  'Hunting': { trait: 'Perception', ring: 'Water' },  // Tracking=Perception, Survival=Strength - most common
  'Intimidation': { trait: 'Awareness', ring: 'Air' },  // Can also use Strength - most common is Awareness
  'Stealth': { trait: 'Agility', ring: 'Fire' },
  // High Skills
  'Calligraphy': { trait: 'Intelligence', ring: 'Fire' },
  'Courtier': { trait: 'Awareness', ring: 'Air' },
  'Etiquette': { trait: 'Awareness', ring: 'Air' },
  'Investigation': { trait: 'Perception', ring: 'Water' },
  'Medicine': { trait: 'Intelligence', ring: 'Fire' },
  'Meditation': { trait: 'Void', ring: 'Void' },
  'Sincerity': { trait: 'Awareness', ring: 'Air' },
  'Storytelling': { trait: 'Awareness', ring: 'Air' },
  'Acting': { trait: 'Awareness', ring: 'Air' },
  'Divination': { trait: 'Awareness', ring: 'Air' },
  // Merchant Skills
  'Commerce': { trait: 'Intelligence', ring: 'Fire' },
  'Temptation': { trait: 'Awareness', ring: 'Air' },
  'Forgery': { trait: 'Intelligence', ring: 'Fire' },
  'Spellcraft': { trait: 'Intelligence', ring: 'Fire' },
  // Low Skills
  'Sleight of Hand': { trait: 'Agility', ring: 'Fire' },
  'Gambling': { trait: 'Perception', ring: 'Water' },
  'Locksmithing': { trait: 'Agility', ring: 'Fire' },
  'Assassin Ranged Weapons': { trait: 'Reflexes', ring: 'Air' },
  'Appraisal': { trait: 'Perception', ring: 'Water' },
  'Games': { trait: 'Intelligence', ring: 'Fire' },
  // Open skills - default trait
  'Lore': { trait: 'Intelligence', ring: 'Fire' },
  'Craft': { trait: 'Intelligence', ring: 'Fire' },
  'Perform': { trait: 'Awareness', ring: 'Air' },
};

// Armor TN bonus lookup - matches equipment item names to their TN bonus
export const ARMOR_TN_BONUS = {
  'Partial Armor (+3 TN)': 3,
  'Light Armor (+5 TN)': 5,
  'Light Armor': 5,
  'Heavy Armor (+10 TN)': 10,
  'Heavy Armor': 10,
  'Riding Armor (+8 TN)': 8,
  'Riding Armor': 8,
  'Lorica Segmentata': 5,
  'Lorica-Segmentata': 5,
  'Chain Shirt': 5,
  'Senpet Chain Shirt': 5,
  'Yodotai Chain Shirt': 7,
  'Half-Plate': 10,
  'Ebonite Armor': 5,
  'Adaga': 5, // Senpet body armor (Medium, +5 TN, Reduction 2) - NOT a shield despite shield-like appearance
};

// ── Shields - confirmed against the L5R 4E Conversion doc directly (see BACKLOG.md for source detail) ──
// Unlike armor pieces (which use the highest-only rule), shields occupy their own slot and STACK on top
// of worn armor. Attack Roll / Athletics penalty follows L5R 4E's Wielding Two Weapons rules by size
// (Small -5, Medium -10, Large -15) per the conversion doc's general shield rule - shields do NOT grant
// the two-weapon-fighting benefits, just the penalty.
export const SHIELDS = [
  { name: 'Large Wooden Shield', size: 'large', tnBonus: 7, reduction: 3, keywords: ['Large'], price: '15c' },
  { name: 'Scutum', size: 'medium', tnBonus: 5, reduction: 3, keywords: ['Yodotai', 'Medium'], price: '12c' }, // price not listed in source, estimated to match Large Wooden Shield's tier
  { name: 'Parma', size: 'small', tnBonus: 0, reduction: 0, keywords: ['Yodotai', 'Small'],
    note: '+5 TN vs ranged attacks only (not automated - GM applies manually); +5 TN penalty to all Agility/Reflexes Skill Rolls while carried (not automated)',
    price: '5c' },
];
export const SHIELD_ATTACK_PENALTY = { small: -5, medium: -10, large: -15 };

// Compute shield TN bonus (stacks additively with armor, unlike armor's highest-only rule) and Reduction
// from a character's equipment. Parma's ranged-only +5 and Agility/Reflexes penalty are NOT included here
// - see the note on its SHIELDS entry above; those need manual GM application until Sandy tracks attack
// type (ranged vs melee) and has a general Reduction/damage-soak system for PCs.
export function getShieldBonus(equipment = []) {
  let tnBonus = 0, reduction = 0, penalty = 0;
  (equipment || []).forEach(item => {
    if (!item.equipped) return;
    const shieldData = SHIELDS.find(s => s.name === item.name);
    if (shieldData) {
      tnBonus = Math.max(tnBonus, shieldData.tnBonus);
      reduction = Math.max(reduction, shieldData.reduction);
      penalty = Math.min(penalty, SHIELD_ATTACK_PENALTY[shieldData.size] || 0); // most negative wins
      return;
    }
    // Reskinned/renamed shield items (Item Creator's base-item picker, base category "Shield") carry
    // their own explicit tn_bonus/reduction/size fields instead of matching a SHIELDS entry by name -
    // without this, a renamed shield silently lost its bonus entirely once its name no longer matched.
    if (item.is_shield && typeof item.tn_bonus === 'number') {
      tnBonus = Math.max(tnBonus, item.tn_bonus);
      if (typeof item.reduction === 'number') reduction = Math.max(reduction, item.reduction);
      if (item.size) penalty = Math.min(penalty, SHIELD_ATTACK_PENALTY[item.size] || 0);
    }
  });
  return { tnBonus, reduction, attackPenalty: penalty };
}

// Compute armor TN bonus from a character's equipment array
// Uses the highest armor bonus from equipped (equipped === true) armor items, PLUS shield TN which stacks
// additively on top (shields are a separate slot, not subject to the highest-only rule - conversion doc)
export function getArmorBonus(equipment = []) {
  let best = 0;
  (equipment || []).forEach(item => {
    if (!item.equipped) return;
    if (SHIELDS.some(s => s.name === item.name)) return; // shields handled separately by getShieldBonus, added below
    if (item.is_shield) return; // reskinned shield item - also handled by getShieldBonus, not body armor
    // Magic armor items (from MagicItemCreator) carry an explicit tn_bonus field - check that first
    if (typeof item.tn_bonus === 'number') { best = Math.max(best, item.tn_bonus); return; }
    const name = item.name || '';
    // Check direct lookup
    const direct = ARMOR_TN_BONUS[name];
    if (direct !== undefined) { best = Math.max(best, direct); return; }
    // Check for "(+N TN)" pattern in the name
    const match = name.match(/\(\+(\d+)\s*TN\)/i);
    if (match) { best = Math.max(best, parseInt(match[1], 10)); }
  });
  return best + getShieldBonus(equipment).tnBonus;
}

// Keep backward compatibility - GEAR_LIST is the name array
export const GEAR_LIST = GEAR_LIST_NAMES;

// Clothing items - equippable (one per slot), no combat effect. Quality tier above/below Standard
// adjusts Status by ±0.1 per degree (Poor = -0.1, Standard = 0, Fine = +0.1, Masterwork = +0.2).
// Slot is one of: cloak, clothes, shoes. Only one item per slot can be equipped at a time.
export const CLOTHING_SLOTS = {
  'Traveling Cloak': 'cloak',
  'Suit of Clothes': 'clothes',
  'Fine Clothes':    'clothes', // Fine quality - gives +0.1 Status built-in plus quality modifier
  'Street Clothes':  'clothes',
  'Robes':           'clothes',
  'Robe':            'clothes',
  'Tunic':           'clothes',
  'Sandals':         'shoes',
  'Shoes':           'shoes',
};
// Status bonus/penalty per quality tier for clothing
export const CLOTHING_STATUS_DELTA = {
  poor:        -0.1,
  standard:    0,
  fine:        0.1,
  masterwork:  0.2,
};

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
  // ── Mental ────────────────────────────────────────────────────────────────
  { name: "Absolute Direction", cost: 1, type: "Mental", desc: "Always know which direction is north, no matter the circumstances." },
  { name: "Balance", cost: 2, type: "Mental", desc: "When adding Integrity to resist Intimidation or Temptation, gain an additional +1k0." },
  { name: "Clear Thinker", cost: 3, type: "Mental", desc: "When making a Contested Roll against someone attempting to confuse or manipulate you, gain +1k0." },
  { name: "Crafty", cost: 3, type: "Mental", desc: "When forced to make an Unskilled Roll using a Low Skill, you are considered to have 1 rank instead." },
  { name: "Daredevil", cost: 3, type: "Mental", desc: "When spending a Void Point to enhance an Athletics roll, gain +3k1 instead of the normal +1k1." },
  { name: "Dark Paragon (Control)", cost: 5, type: "Mental", desc: "Once per session, sacrifice 5 Integrity or spend Void to re-roll any Social Skill Roll." },
  { name: "Dark Paragon (Determination)", cost: 5, type: "Mental", desc: "Once per session, sacrifice 5 Integrity or spend Void to negate all TN penalties (including Wounds) on one Skill or Spellcasting Roll." },
  { name: "Dark Paragon (Insight)", cost: 5, type: "Mental", desc: "Once per session, sacrifice 5 Integrity or spend Void to re-roll any roll that used the Awareness Trait." },
  { name: "Dark Paragon (Knowledge)", cost: 5, type: "Mental", desc: "Once per session, sacrifice 5 Integrity or spend Void to re-roll any roll that used the Intelligence Trait." },
  { name: "Dark Paragon (Perfection)", cost: 5, type: "Mental", desc: "Once per session, sacrifice 5 Integrity or spend Void to cause any one die of your choice on a Skill Roll to explode (no +5 bonus added)." },
  { name: "Dark Paragon (Strength)", cost: 5, type: "Mental", desc: "Once per session, sacrifice 5 Integrity or spend Void to re-roll any Damage Roll, keeping the higher result." },
  { name: "Dark Paragon (Will)", cost: 5, type: "Mental", desc: "Once per session, sacrifice 5 Integrity or spend Void to negate 10 Wounds at the moment they are suffered." },
  { name: "Ceremony of the Hidden Heart", cost: 10, type: "Mental/Spiritual", desc: "Sahir only. You know the ritual to create a Khadi - the process of separating a subject's heart from their body and creating a near-immortal being. Only those with a suitable teacher may purchase this. The ritual requires specific inscriptions, a living host, and precise timing; failure is catastrophic." },
  { name: "Cosmopolitan", cost: 5, type: "Mental", desc: "Yodotai only. Skilled at adapting to different cultures. Gain +1k0 bonus to all Social Skill Rolls." },
  { name: "Great Potential", cost: 5, type: "Mental", desc: "Choose one Skill. Raises on rolls using that Skill are limited by your Skill Rank rather than Void Ring (use whichever is higher)." },
  { name: "Heartless", cost: 4, type: "Mental", desc: "+1k0 to resist any Courtier, Sincerity, or Temptation roll made to persuade, seduce, or change your mind." },
  { name: "Higher Purpose", cost: 3, type: "Mental", desc: "Devoted to a grand goal. In any session where demonstrable progress is made toward it, gain 1 additional XP." },
  { name: "Precise Memory", cost: 3, type: "Mental", desc: "+1k1 to Intelligence Trait Rolls when recalling something exactly as seen or heard." },
  { name: "Sage", cost: 4, type: "Mental", desc: "When forced to make an Unskilled Roll using a Lore Skill, you are considered to have 1 rank instead." },
  { name: "Sensation", cost: 3, type: "Mental", desc: "When required to make a Skill Roll using a Perform Skill you do not possess, you are considered to have 1 rank." },
  { name: "Soul of Artistry", cost: 4, type: "Mental", desc: "Choose Artisan or Craft Skills. When forced to make an Unskilled Roll of that type, you are considered to have 1 rank." },
  { name: "Strategist", cost: 5, type: "Mental", desc: "If commanding or on the staff of an army, your side gains +2k0 on Battle rolls to determine who is Winning each Battle Turn." },
  { name: "Tactician", cost: 4, type: "Mental", desc: "When making a roll on the Mass Battle Table, you may increase or decrease the result by 5." },
  { name: "Virtuous", cost: 3, type: "Mental", desc: "Possess one additional rank of Integrity (Honor) above your normal starting value." },
  { name: "Wary", cost: 3, type: "Mental", desc: "+1k1 on Investigation (Notice)/Perception when rolling to detect an ambush against Stealth (Ambush)/Agility." },
  // Paragon (7 tenet variants)
  { name: "Paragon of Compassion", cost: 7, type: "Mental", desc: "When spending a Void Point to improve a roll made to directly help someone of lower Status or lesser means, gain +2k2 instead of +1k1. Gain +1 Integrity whenever you exhibit genuine compassion." },
  { name: "Paragon of Courage", cost: 7, type: "Mental", desc: "Gain +1k1 to any roll made to resist Intimidation or to overcome Fear effects. Gain +1 Integrity whenever you exhibit genuine courage." },
  { name: "Paragon of Courtesy", cost: 7, type: "Mental", desc: "When making an Etiquette roll to avoid embarrassment or give no offense, add +2k0 to the roll. Gain +1 Integrity whenever you exemplify courtesy." },
  { name: "Paragon of Duty", cost: 7, type: "Mental", desc: "Once per session, spend a Void Point on any Skill Roll or Spellcasting Roll to negate all TN penalties for that roll, including Wound penalties. Gain +1 Integrity for honoring your duty at personal cost." },
  { name: "Paragon of Honesty", cost: 7, type: "Mental", desc: "Gain +1k1 on Sincerity (Honesty) rolls. This bonus applies even if you do not possess the Emphasis but the situation calls for honest speech. Gain +1 Integrity for speaking truth in costly moments." },
  { name: "Paragon of Honor", cost: 7, type: "Mental", desc: "Add twice your Integrity Rank to all rolls to resist Temptation or Intimidation, instead of the normal single Integrity bonus. Gain +1 Integrity for maintaining honor when others would not." },
  { name: "Paragon of Sincerity", cost: 7, type: "Mental", desc: "Add +2k0 to all Contested Rolls using the Sincerity Skill. Gain +1 Integrity whenever your words carry genuine conviction that changes hearts or minds." },
  // ── Physical ──────────────────────────────────────────────────────────────
  { name: "Bland", cost: 2, type: "Physical", desc: "Extremely unremarkable. May voluntarily increase the TN of rolls to recognize you by 10." },
  { name: "Ambidextrous", cost: 4, type: "Physical", desc: "Equally skilled with both hands. No +5 TN penalty for off-hand weapon. When wielding two weapons, TN penalty is reduced by 5." },
  { name: "Blood of the Hanie", cost: 2, type: "Physical", desc: "Yodotai only. Descended from the original Yodotai Empire bloodline. Gain +1k1 when using Social Skills on other Yodotai." },
  { name: "Crab Hands", cost: 3, type: "Physical", desc: "When forced to make an Unskilled Roll with a Weapon Skill, you are considered to have 1 rank instead." },
  { name: "Dangerous Beauty", cost: 3, type: "Physical", desc: "+1k0 to all Temptation Skill Rolls made with members of the opposite sex." },
  { name: "Hands of Stone", cost: 6, type: "Physical", desc: "Damage Rolls for unarmed attacks increased by +0k1." },
  { name: "Khadi", cost: 6, type: "Physical/Spiritual", desc: "You are one of the heartless. You heal 1 Wound per minute in addition to normal healing, even if totally obliterated. Can only be permanently destroyed if your heart is crushed or stabbed. 6pt: your heart belongs to another and you must heed their will. 8pt: you control your own heart." },
  { name: "Large", cost: 4, type: "Physical", desc: "+1k0 to all Damage Rolls for any large melee weapon. You are notably larger than average." },
  { name: "Quick", cost: 6, type: "Physical", desc: "If you did not act first in a Round, during the Reactions Stage you may add your Reflexes to your Initiative Score for all subsequent rounds." },
  { name: "Quick Healer", cost: 3, type: "Physical", desc: "For the purposes of recovering Wounds, your Stamina is considered two ranks higher." },
  { name: "Silent", cost: 3, type: "Physical", desc: "+1k0 to all Stealth rolls." },
  { name: "Strength of the Earth", cost: 3, type: "Physical", desc: "TN penalties from Wound Ranks are reduced by 3." },
  { name: "Voice", cost: 3, type: "Physical", desc: "+1k1 on any Perform Skill Roll that uses your voice (Singing, Oratory, etc.)." },
  // ── Social ────────────────────────────────────────────────────────────────
  { name: "Allies", cost: 2, type: "Social", desc: "Variable cost (2-8 pts). A contact with defined influence (1-4 pts) and devotion (1-4 pts). Discuss specifics with GM." },
  { name: "Blackmail", cost: 2, type: "Social", desc: "Variable cost = target's Status Rank. You hold proof of a dark secret and can elicit cooperation - use carefully." },
  { name: "Blissful Betrothal", cost: 3, type: "Social", desc: "Arranged marriage you actually love. Purchase Gentry, Kharmic Tie, Social Position, and Wealth for 2 pts less each (min 1)." },
  { name: "Different School", cost: 5, type: "Social", desc: "Study at a school from a different faction. You remain a member of your own faction." },
  { name: "Fame", cost: 3, type: "Social", desc: "Gain +1 Reputation Rank." },
  { name: "Gentry", cost: 8, type: "Social", desc: "Variable cost (8-30 pts). Oversee a holding ranging from a village (8 pts) to a province (30 pts)." },
  { name: "Heart of Vengeance", cost: 5, type: "Social", desc: "Choose a faction. +1k1 to the total of any Contested Roll made against a member of that faction." },
  { name: "Hero of the People", cost: 2, type: "Social", desc: "Common folk adore you. TN for non-samurai to recognize you (by Reputation Rank) is lowered by 10." },
  { name: "Imperial Spouse", cost: 5, type: "Social", desc: "+0.5 Status Ranks. +1k1 to all Social Skill rolls with members of Imperial families." },
  { name: "Inheritance", cost: 5, type: "Social", desc: "Receive a family heirloom. +1k1 on non-combat Skill Rolls using it (attack/damage rolls excluded)." },
  { name: "Irreproachable", cost: 2, type: "Social", desc: "+1k0 when making a Contested Roll where the other party uses Temptation." },
  { name: "Leadership", cost: 6, type: "Social", desc: "Once per Round during Reactions Stage, add School Rank + 1k1 to one ally's Initiative Score until next Reactions Stage." },
  { name: "Multiple Schools", cost: 10, type: "Social", desc: "Purchased during play only. Stop progression in current school; at next Insight Rank, begin a new school at Rank 1." },
  { name: "Perceived Integrity", cost: 3, type: "Social", desc: "3 pts per rank. Your Integrity appears one full rank higher per rank of this Advantage for purposes of all attempts to discern it." },
  { name: "Read Lips", cost: 4, type: "Social", desc: "Understand what others are saying without hearing them. Perception roll vs TN 15 + 5 per 20' distance." },
  { name: "Sacrosanct", cost: 4, type: "Social", desc: "Requires Integrity 6+. No one with Integrity 5+ may attack you unless you attack first (willing duels excepted)." },
  { name: "Social Position", cost: 6, type: "Social", desc: "+1 Status Rank." },
  { name: "Spy Network", cost: 8, type: "Social", desc: "Once per session, contact your network to acquire a piece of useful covert information (GM determines specifics)." },
  { name: "Stolen Identity", cost: 6, type: "Social", desc: "Discovered a false identity in ruins. Two Free Raises on Acting rolls when using this alternate identity." },
  { name: "Well-Connected", cost: 3, type: "Social", desc: "3 pts per rank. Once per session per rank, roll Courtier/Awareness TN 20 for a minor favor from someone at court." },
  { name: "Gorilla Bodyguard", cost: 3, type: "Material", desc: "You have a trained gorilla as a bodyguard. Considered to have 5 ranks in Animal Handling (Gorilla) for commanding it, or use your actual rank if higher." },
  { name: "Inheritance, Crysteel Weapon", cost: 5, type: "Material", desc: "Ashalan only. Obtain a Crysteel weapon: +1k0 bonus to attack and damage rolls, and counts as Crystal for the purpose of Invulnerability." },
  { name: "Inheritance, Khadja of the Council", cost: 5, type: "Material", desc: "Ashalan only. A Khadja polearm with DR 1k4 (Polearms skill) that grants +1k0 to Attack Rolls." },
  { name: "Wealthy", cost: 1, type: "Material", desc: "1 pt per rank. Each rank grants 2 additional koku added to starting outfit." },
  { name: "Sacred Weapon", cost: 5, type: "Material", desc: "Variable cost (3-6 pts). A specially crafted weapon with unique properties specific to your faction." },
  // ── Spiritual ─────────────────────────────────────────────────────────────
  { name: "Fitfully Sleeping Blood", cost: 8, type: "Spiritual", desc: "An ancestor was a Jinn in disguise. You did not inherit their soul of smokeless fire, but the mixing of mortal and Jinn blood left its mark. Roll once on any Jinn Ability table and receive that ability, which you may invoke exactly as if you were a Jinn." },
  { name: "Paragon of Faith", cost: 6, type: "Spiritual", desc: "Senpet only. Devotion to the Ten Thousand Gods is unshakable. Gain one free Void Point that can only be used for Senpet Character Class Techniques." },
  { name: "Soul of Warriors", cost: 10, type: "Spiritual", desc: "Yodotai only. Considered a true Yodotai hero by peers and ancestors. Whenever in combat, a guardian spirit fights by your side." },
  { name: "Chosen by the Oracles", cost: 6, type: "Spiritual", desc: "Choose one Ring. +1k1 to the total of all Ring Rolls using that Ring." },
  { name: "Elemental Blessing", cost: 4, type: "Spiritual", desc: "Choose one Ring (not Void). Cost to increase Traits associated with that Ring is decreased by 1 XP each time." },
  { name: "Enlightened", cost: 6, type: "Spiritual", desc: "Cost to increase Void Ring decreased by 2 XP each time." },
  { name: "Friend of the Elements", cost: 4, type: "Spiritual", desc: "Choose a Ring. Gain a Free Raise whenever making a Trait Roll with either Trait associated with that Ring." },
  { name: "Friendly Kami", cost: 5, type: "Spiritual", desc: "Sahir only. +1k1 on Spell Casting Rolls for Sense, Commune, or Summon of chosen element." },
  { name: "Great Destiny", cost: 5, type: "Spiritual", desc: "Once per session, when you would die from Wounds, you are reduced to 1 Wound remaining instead." },
  { name: "Inari's Blessing", cost: 3, type: "Spiritual", desc: "When fasting or deprived of food, you do not lose the ability to regain Void Points (other penalties apply)." },
  { name: "Inner Gift", cost: 7, type: "Spiritual", desc: "Possess a mysterious gift (Animal Ken, Empathy, Foresight, Lesser Prophecy, or Spirit Touch). Discuss with GM." },
  { name: "Kharmic Tie", cost: 2, type: "Spiritual", desc: "1-5 pts. Destiny bonded to one person. Once per session per point spent, +1k1 to attack rolls when fighting to protect them." },
  { name: "Languages", cost: 1, type: "Mental", desc: "1 pt: one human language. 3 pts: one non-human language (understand only, limited speech)." },
  { name: "Luck", cost: 3, type: "Spiritual", maxRank: 3, costPerRank: 3, desc: "3/6/9 pts. A number of times per session equal to rank, immediately re-roll any one roll, keeping the higher result." },
  { name: "Magic Resistance", cost: 2, type: "Spiritual", desc: "2/4/6 pts. Per rank, all elemental spells targeting you have their Casting TN increased by +3." },
  { name: "Naga Ancestry", cost: 7, type: "Spiritual", desc: "May purchase Naga-only Advantages. +1k0 on Social rolls with Naga. May manifest physical signs (GM option)." },
  { name: "Reincarnated", cost: 6, type: "Spiritual", desc: "+1k0 to any three non-School Skills of your choice. Occasional visions/dreams from previous life." },
  { name: "Sacred Weapon", cost: 5, type: "Material", desc: "Variable cost (3-6 pts). A specially crafted weapon with unique properties specific to your faction." },
  { name: "Servant of Smokeless Fire", cost: 4, type: "Spiritual", desc: "Sahir only. Grants the ability to summon Jinn. Rules for summoning found in Appendix Two." },
  { name: "Blessed by Shilah", cost: 4, type: "Spiritual", desc: "The Bright-Eyed Mother Sun smiles upon you. Gain +0k1 to Social rolls when persuading (not coercing) others. Your presence warms those around you." },
  { name: "Blessed by Kaleel", cost: 4, type: "Spiritual", desc: "The Pale-Eyed God of night and endurance marks you as worthy. Once per session as a Free Action, gain +1k0 to all Attack rolls for one round without spending Void." },
  { name: "Blessed by the Desert", cost: 4, type: "Spiritual", desc: "The sands themselves favor your trade and enterprise. Gain +1k1 to all Commerce skill rolls." },
  { name: "Blessed by the Honest Hand", cost: 4, type: "Spiritual", desc: "Rewarded for honest labor, you carry fortune in your craft. Gain a Free Raise on all rolls with one chosen non-weapon skill (chosen at character creation)." },
  { name: "Blessed by the All-Seeing Eye", cost: 4, type: "Spiritual", desc: "Ancient wisdom attends your studies. Gain +1k1 to all rolls with one chosen Lore skill (chosen at character creation)." },
  { name: "Blessed by the Wanderer", cost: 4, type: "Spiritual", desc: "The spirit of the road and open horizon sustains you. Once per session, you may recover 1 spent Void Point as a Free Action when under open sky or in motion." },
  { name: "Blessed by the Keeper of Years", cost: 4, type: "Spiritual", desc: "Longevity and endurance are your birthright. Your Stamina is considered one rank higher for the purpose of determining Wound Ranks and natural healing." },
];

export const DISADVANTAGES = [
  // ── Mental ────────────────────────────────────────────────────────────────
  { name: "Ascetic", value: 2, type: "Mental", desc: "You have no interest in material wealth or comfort. Your starting outfit includes only necessities. Any time you would gain Reputation from conspicuous wealth or luxury, you gain half the normal amount." },
  { name: "Brash", value: 3, type: "Mental", desc: "Short temper. When threatened or insulted, must roll Willpower TN 25 (+ Integrity) or attack immediately." },
  { name: "Can't Lie", value: 2, type: "Mental", desc: "Cannot tell lies. If someone lies in your presence and you know it, must roll Willpower TN 20 or immediately correct them." },
  { name: "Compulsion", value: 2, type: "Mental", desc: "Compelled to partake in an activity. Must roll Willpower TN 15 to resist; TN +5 per additional point (max TN 25 / 4 pts)." },
  { name: "Consumed", value: 4, type: "Mental", desc: "Wholly consumed by a Shourido tenet. Penalties vary by tenet chosen (Control, Determination, Insight, Knowledge, Perfection, Strength, or Will)." },
  { name: "Contrary", value: 3, type: "Mental", desc: "Must share opinions at every opportunity. In any tense situation, must roll Willpower (TN 5-25, GM decides) to avoid taking action." },
  { name: "Disbeliever", value: 3, type: "Mental", desc: "You have no faith in the spiritual or divine. Social Skill Rolls with sahir, diviners, priests, and other spiritually devoted individuals have TN +5." },
  { name: "Doubt", value: 4, type: "Mental", desc: "Choose one School Skill. Every time you use it, must declare one Raise that confers no benefit." },
  { name: "Driven", value: 2, type: "Mental", desc: "Obsessed with a goal. Will sacrifice family, friends, possessions, even Integrity to accomplish it." },
  { name: "Failure of Compassion", value: 3, type: "Mental", desc: "The plight of others fails to move you. You must spend a Void Point to willingly place yourself at risk for a stranger's welfare unless there is a direct benefit to you." },
  { name: "Failure of Courage", value: 3, type: "Mental", desc: "Fear grips you when it should not. When facing a Fear effect or clearly superior opposition, roll Willpower TN 20 or be compelled to withdraw or freeze for one Round." },
  { name: "Failure of Courtesy", value: 3, type: "Mental", desc: "Social niceties feel hollow to you. In any formal social context, you must spend a Void Point to observe proper etiquette; otherwise, you cause unintentional offense (-5 TN to Social rolls for the scene)." },
  { name: "Failure of Duty", value: 3, type: "Mental", desc: "Personal desire wars with obligation. When your duty conflicts with something you want, roll Willpower TN 20 or choose the personal desire over the duty." },
  { name: "Failure of Honesty", value: 3, type: "Mental", desc: "Convenient untruths come easily to you. You gain +1k0 on Sincerity (Deceit) rolls, but any Integrity loss from dishonest acts is doubled." },
  { name: "Failure of Honor", value: 3, type: "Mental", desc: "Your personal code bends when it should hold. Any Integrity loss you suffer from dishonorable acts is increased by 1." },
  { name: "Failure of Sincerity", value: 3, type: "Mental", desc: "Something about you reads as insincere even when you speak truth. Opponents gain +1k0 on all Contested Sincerity rolls made against you." },
  { name: "Fascination", value: 1, type: "Mental", desc: "Completely fascinated by a subject. Will take even dishonorable actions to learn more about it." },
  { name: "Frail Mind", value: 3, type: "Mental", desc: "Difficulty concentrating. When making a Contested Roll using Willpower, your opponent gains +2k0." },
  { name: "Greedy", value: 3, type: "Mental", desc: "Opponents using Temptation (Bribery) against you gain +1k1." },
  { name: "Gullible", value: 4, type: "Mental", desc: "Opponents using Sincerity (Deceit) against you gain +1k1." },
  { name: "Lechery", value: 2, type: "Social", desc: "Physical pleasure is a weakness. When an opponent uses Temptation (Seduction) against you, they gain +1k1 to the total of the roll." },
  { name: "Idealistic", value: 2, type: "Mental", desc: "Hopelessly naive view of the world. Whenever you lose Integrity, the loss is increased by 1." },
  { name: "Insensitive", value: 2, type: "Mental", desc: "Must spend a Void Point to place yourself at risk for another's welfare unless there is direct benefit to you." },
  { name: "Jealousy", value: 3, type: "Mental", desc: "Obsessed with outperforming a specific individual. Choose one PC or major NPC. You will go to any lengths to best them." },
  { name: "Obtuse", value: 3, type: "Mental", desc: "XP cost to increase any High Skill (other than Investigation or Medicine) is doubled." },
  { name: "Overconfident", value: 3, type: "Mental", desc: "Cannot recognize when a situation is beyond you. Must roll Perception TN 20 to retreat from clearly superior opponents." },
  { name: "Phobia", value: 1, type: "Mental", maxRank: 3, costPerRank: 1, desc: "1-3 pts. When confronted with the subject of your phobia, all TNs increase by +5 per rank. Mild (1pt) = minor fear; Moderate (2pt) = significant; Severe (3pt) = debilitating." },
  { name: "Soft-Hearted", value: 2, type: "Mental", desc: "Must roll Willpower TN 20 to kill another human. If you do kill, all TNs +10 for one day." },
  { name: "True Love", value: 3, type: "Mental", desc: "When forced to choose between love and duty, must spend a Void Point before choosing duty." },
  // ── Physical ──────────────────────────────────────────────────────────────
  { name: "Bad Eyesight", value: 3, type: "Physical", desc: "–1k1 to all ranged attack rolls and Perception-based rolls." },
  { name: "Bad Health", value: 4, type: "Physical", desc: "Earth Ring considered one rank lower for determining Wound Ranks and resisting diseases." },
  { name: "Blind", value: 6, type: "Physical", desc: "–3k3 to ranged attacks, –1k1 to melee. Armor TN = Reflexes + 5. Water Ring –2 for movement. Simple Move requires Athletics/Agility TN 20 or fall Prone." },
  { name: "Epilepsy", value: 4, type: "Physical", desc: "Under high stress or flashing lights, roll Willpower TN 15 or suffer a seizure. Each minute, roll Willpower TN 10 to end it." },
  { name: "Lame", value: 4, type: "Physical", desc: "Water Ring considered 1 for Move Actions. Agility-based rolls requiring lower-limb activity suffer +10 TN." },
  { name: "Low Pain Threshold", value: 4, type: "Physical", desc: "TN penalties from Wound Ranks are increased by +5 each rank." },
  { name: "Missing Limb", value: 6, type: "Physical", desc: "+10 TN to all rolls involving the missing limb." },
  { name: "Permanent Wound", value: 4, type: "Physical", desc: "First Wound Rank is always considered full." },
  { name: "Small", value: 3, type: "Physical", desc: "Water Ring considered one rank lower for Move Actions. –1k0 on Damage Rolls of all melee attacks." },
  { name: "Weakness", value: 6, type: "Physical", desc: "Choose one Trait. That Trait is treated as one rank lower for all rolls and mechanical effects." },
  // ── Social ────────────────────────────────────────────────────────────────
  { name: "Antisocial", value: 2, type: "Social", desc: "2 pts: –1k0 to all Social rolls. 4 pts: –1k1 to all Social rolls." },
  { name: "Wanderer", value: 2, type: "Mental", desc: "You have an almost supernatural ability to get lost. Even in familiar territory you take wrong turns and lose your bearings. You suffer -15 to any Navigation roll and require a guide or explicit directions for even routine travel." },
  { name: "Bitter Betrothal", value: 2, type: "Social", desc: "Promised to someone who despises you. Mutual dislike causes difficulty with domestic and bureaucratic tasks." },
  { name: "Black Sheep", value: 3, type: "Social", desc: "Family is disgusted with you. May only maintain family relations via the Allies Advantage." },
  { name: "Blackmailed", value: 2, type: "Social", desc: "Variable cost = your Status Rank. Someone holds a dark secret and makes demands." },
  { name: "Bounty", value: 2, type: "Social", desc: "2/4/6 pts based on severity. A price is on your head. Hunters will pursue you with varying tenacity." },
  { name: "Dark Secret", value: 4, type: "Social", desc: "A secret that could ruin you and perhaps your family if exposed. Could require seppuku or execution." },
  { name: "Debt", value: 2, type: "Social", desc: "2/4/8 pts. Indebted to a wealthy commoner or samurai. Creditor may pressure you into acts on their behalf." },
  { name: "Dependent", value: 3, type: "Social", desc: "Variable cost (2-6 pts). Must look after someone largely incapable of self-defense (child, relative, naive spouse)." },
  { name: "Dishonored", value: 5, type: "Social", desc: "Name removed from family records. Status Rank 1; may not gain Status while this Disadvantage persists." },
  { name: "Disturbing Countenance", value: 3, type: "Social", desc: "Something about you unsettles others. TN of all Social Skill Rolls increased by +5." },
  { name: "Forced Retirement", value: 4, type: "Social", desc: "Forced into a monastery; may not advance further in your School." },
  { name: "Mistrusted Foreigner", value: 1, type: "Social", desc: "Your foreign origins mark you as an outsider in Medinaat al-Salaam. Individual dice may only explode once on Social Skill Rolls with locals who are suspicious of foreigners (max result 20 per die)." },
  { name: "Hostage", value: 3, type: "Social", desc: "Held as a guest in another faction's territory; cannot leave without escort. Life forfeit if your faction breaks the treaty." },
  { name: "Infamous", value: 2, type: "Social", desc: "Known for being ruthless and cruel. Starting Reputation replaced with Infamy at the same rank." },
  { name: "Obligation", value: 3, type: "Social", desc: "3/6 pts. Indebted to someone. When it comes due, nothing else matters - honor it even at cost to yourself." },
  { name: "Rumormonger", value: 4, type: "Social", desc: "Cannot resist spreading gossip. Must roll Willpower vs TN equal to 5 × highest-Glory individual's Glory Rank to resist." },
  { name: "Social Disadvantage", value: 3, type: "Social", desc: "Begin with Status Rank 0." },
  { name: "Stolen Identity Stigma", value: 3, type: "Social", desc: "Potential enemy from another faction. Functions as Sworn Enemy with 1 extra point; enemy identity changes periodically (GM decides)." },
  { name: "Nemesis", value: 4, type: "Social", desc: "You have earned a truly implacable enemy - one whose resources, connections, and burning hatred far exceed those of a Sworn Enemy. They will sacrifice considerable resources to see you destroyed. +1 pt per Insight Rank above yours they possess." },
  { name: "Sworn Enemy", value: 3, type: "Social", desc: "An enemy determined to see you defeated or dead. +1 pt per Insight Rank above yours. +2 pts to make them your kharmic nemesis (cannot spend Void opposing them)." },
  // ── LBS-Specific ──────────────────────────────────────────────────────────
  { name: "Curse of the Grey Crone", value: 3, type: "Spiritual", desc: "Assassin bloodline only. A difformity from the Grey Crone's curse on Prince Hassan - internal or external, pain or spasms, strange growths, twisted muscles, or severe communication difficulty. Choose one Trait: it is lowered to 1 and cannot be increased with XP. However, XP needed per Insight Rank is reduced by 5 (145 for 2nd, 165 for 3rd, etc.). Mandatory for male Assassins; compatible with Dark Fate." },
  { name: "Defiler of the Dead", value: 2, type: "Spiritual", desc: "Senpet only. You create ghuls for your own purposes rather than in service to the Ten Thousand Gods. Gain a Free Raise on all Spellcasting Rolls involving Ghul Creation spells. Suffer +5 TN on all Social Skills with other Senpet." },
  { name: "Despicable", value: 5, type: "Mental", desc: "Yodotai only. You do not attract the attention of Yodotai ancestors - perhaps you reject their gods or are not considered a true warrior. You gain no advantage from Magic Resistance and may not purchase that Advantage. Suffer –2k0 penalty to all Social Skill Rolls with other Yodotai." },
  { name: "Forlorn (State)", value: 2, type: "Mental", desc: "Senpet only. You once believed in the Empire but something shattered that. Whenever you attempt to use any Skill or Technique referencing the State, you suffer +10 TN to that roll." },
  { name: "Forlorn (Religion)", value: 5, type: "Mental", desc: "Senpet only. You once believed in the Faith but something destroyed that. Whenever you attempt to use any Skill or Technique referencing Religion, you suffer +10 TN. You may not use Void Points for techniques that require faith." },
  { name: "Bad Fortune", value: 3, type: "Spiritual", desc: "Something unpleasant is in store. Form varies: Secret Love, Disfigurement, Evil Eye, Allergy, Lingering Misfortune, or Unknown Enemy." },
  { name: "Marked by the Sands", value: 4, type: "Spiritual", desc: "An elemental or supernatural force of the Burning Sands has marked you as its enemy. Choose one Ring element or supernatural force (Jinn, the Khadi, the desert itself). Effects of that force are more severe for you; discuss specifics with your GM." },
  { name: "Dark Fate", value: 3, type: "Spiritual", desc: "Destined to cause great darkness. Once per session when you would die, you are reduced to 1 Wound instead." },
  { name: "Elemental Imbalance", value: 2, type: "Spiritual", desc: "Sahir only. 2 pts per rank. When casting a specific element's spells, must roll Willpower TN 15+5/rank or something disastrous occurs." },
  { name: "Enlightened Madness", value: 4, type: "Spiritual", desc: "4/6 pts. Choose Ring, Skill, or tattoo. When using it, roll Willpower (TN 20 or 30) or be consumed by madness for 8 hours." },
  { name: "Haunted", value: 3, type: "Spiritual", desc: "An ancestor constantly advises and demands. If you fail to honor them, once per session the GM may inflict –1k1 on a roll of their choice." },
  { name: "Lord Moon's Curse", value: 3, type: "Spiritual", desc: "3/5/7 pts. Gain one bonus Void at full moon - but must roll Willpower TN 15+5/rank or lose control of character until sunrise." },
  { name: "Lost Love", value: 3, type: "Spiritual", desc: "Lost true love (romantic, familial, or brotherly). When reminded, all TNs +5 until spending a Void Point. Cannot trigger more than twice/day." },
  { name: "Momoku", value: 8, type: "Spiritual", desc: "Possess Void Points but may not spend them on anything except School Techniques that specifically require Void Points." },
  { name: "Cursed by Shilah", value: 3, type: "Spiritual", desc: "The sun turns her face from you. You suffer -1k0 on all Social rolls made to persuade or charm others. In direct sunlight, Social TNs increase by +5." },
  { name: "Cursed by Kaleel", value: 3, type: "Spiritual", desc: "The pale god withholds his blessing in battle. You suffer -1k0 on all Attack rolls when in the Attack or Full Attack Stance." },
  { name: "Cursed by the Desert", value: 3, type: "Spiritual", desc: "Fortune sours your dealings. On all Commerce rolls, your kept dice maximum is reduced by 1 (minimum 1 kept die)." },
  { name: "Cursed by the Honest Hand", value: 3, type: "Spiritual", desc: "One skill eludes your mastery. The XP cost to raise one chosen non-weapon skill (chosen at creation) is doubled permanently." },
  { name: "Cursed by the All-Seeing Eye", value: 3, type: "Spiritual", desc: "Ancient knowledge is hidden from you. Once per session, the GM may force you to re-roll one Lore or Investigation roll, keeping the new result." },
  { name: "Cursed by the Wanderer", value: 3, type: "Spiritual", desc: "Solitude saps your spirit. You cannot voluntarily regain Void Points through meditation or rest when completely alone - you require at least one companion present." },
  { name: "Cursed by the Keeper of Years", value: 3, type: "Spiritual", desc: "Your wounds linger beyond reason. Your natural healing rate is halved, and the Medicine TN to treat your wounds is increased by +5." },
  { name: "Sleeper Agent", value: 5, type: "Mental", desc: "Unknown to you, a faction has programmed you with a trigger phrase. Anyone who knows it can command you with up to 5 words." },
  { name: "Touch of the Void", value: 3, type: "Spiritual", desc: "When spending a Void Point, gain +2k1 instead of +1k1 - but must roll Willpower TN 30 or be Dazed for one Round." },
  { name: "Uncentered", value: 2, type: "Spiritual", desc: "Monk only. Cannot learn Void Kiho or take the Void Versatility Advantage." },
  { name: "Unlucky", value: 2, type: "Spiritual", maxRank: 3, costPerRank: 2, desc: "2 pts per rank (max 3 ranks). A number of times per session equal to rank, the GM may force you to re-roll one roll (keeping the second result)." },
  { name: "Wrath of the Desert", value: 3, type: "Spiritual", desc: "The elemental forces of the sands have turned against you. Choose one Ring element. Spells of that element cast against you confer one Free Raise on the Casting Roll." },
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
        { level: 1, name: 'Jinn Summoning 1', tn: 10, desc: "Cast on Hakhim\'s Seal before summoning a Jinn. Gain bonus unkept dice equal to Insight Rank to Commerce/Awareness rolls to bargain with the Jinn." },
        { level: 2, name: 'Jinn Summoning 2', tn: 15, desc: 'No longer need Servant of Smokeless Fire advantage (refund 4 XP). Time to summon a Jinn is halved.' },
        { level: 3, name: 'Jinn Summoning 3', tn: 20, desc: "Sever a Jinn\'s anchor to this world, banishing it instantly. Jinn rolls Void vs TN equal to Spellcasting Roll to avoid banishment." },
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
        { level: 3, name: 'Farsight 3', tn: 20, desc: "If suspecting magical observation, cast this to end the other sahir\'s observation. Observer rendered temporarily blind for one minute and suffers Wounds equal to your Void Ring." },
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
        { level: 1, name: 'Ghul Creation 1', tn: 10, desc: "Take hold of a ghul\'s mind with a barked order. Duration: one hour. Two sahir controlling the same ghul make a Contested Willpower Roll." },
        { level: 2, name: 'Ghul Creation 2', tn: 15, desc: "Create a ghul using a 3-hour ritual and a knife to excise the corpse\'s heart. If using Ghul Creation 1 on your own ghul, duration is 1 day." },
        { level: 3, name: 'Ghul Creation 3', tn: 20, desc: "Destroy ghuls with little effort. Contested Roll: your Earth/Sahir Rank vs Ghul\'s Insight Rank/Earth. Ghul Lords and intelligent ghul possess Insight Ranks." },
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
        { level: 1, name: 'Influence 1', tn: 10, desc: "Subtly push a target\'s emotions in a desired direction. Target is unaware of the manipulation unless they succeed a Contested Willpower roll." },
        { level: 2, name: 'Influence 2', tn: 15, desc: "Plant a specific suggestion in the target\'s mind. They believe the thought is their own. Must be phrased as a simple imperative." },
        { level: 3, name: 'Influence 3', tn: 20, desc: "Dominate a target\'s will entirely for a short duration. They obey direct commands, though will not harm themselves or loved ones." },
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
    desc: 'Fate and skill manipulation - blessings and curses. May be learned in any order.',
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
      { level: 1, name: 'Propriety', tn: 10, desc: "Make an Awareness roll to alter a being\'s attitude toward you in a positive direction. +2 targets per Raise. Duration: 5 minutes." },
      { level: 2, name: 'Business as Usual', tn: 15, desc: "Functions as Propriety but affects everyone within 25\' radius, with four Free Raises. Duration: 5 minutes." },
      { level: 2, name: 'I am not Here', tn: 15, desc: "Increases TN of all Skill Rolls to spot you by twice the number of people within 25\'. Duration: 5 minutes." },
      { level: 2, name: 'Instant Expert', tn: 15, desc: 'Appear to be an expert on any topic. Bonus equal to twice Insight Rank to Social Skill Rolls involving your expertise. Duration: 5 minutes.' },
      { level: 3, name: 'Above Reproach', tn: 20, desc: 'Area becomes above reproach; not searched when things go missing. Concentration required. Up to 100 persons in one encampment or large building.' },
      { level: 3, name: 'Hiding from the Sun', tn: 20, desc: 'Once out of direct sunlight, effectively disappear. Investigation Rolls to find you suffer +40 TN Penalty. Duration: concentration.' },
      { level: 3, name: 'A Potential Ally', tn: 20, desc: 'Appear extremely trustworthy. People who collect Allies seek you out. Allies obtained this way cost 1 XP less. Duration: 5 minutes.' },
      { level: 4, name: 'I am Someone Else', tn: 25, desc: 'Appear as an entirely different humanoid person. Illusion adjusts as you move but does not hold to tactile inspection. Covers voice. Duration: one hour.' },
      { level: 4, name: 'This is Reasonable', tn: 25, desc: 'May say anything - listeners find it reasonable and correct. Cannot convince anyone into obvious danger. Duration: 5 minutes.' },
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
      { level: 3, name: 'The Third Wholeness', tn: 20, desc: "After treating with Medicine, target\'s natural Wound recovery is doubled for three days. Full rest doubles it again." },
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
  'Dangerous Maneuvers': 'You gain a +1k1 bonus to all Contested Strength Rolls and +1k0 to all Damage Rolls during a grapple. Opponents suffer a -1k0 penalty to all Skill rolls for each ally of theirs you have reduced to Down or Out. Opponents only suffer the highest dice penalty when facing multiple Dahabi Enforcers - the effect is not cumulative. Mindless enemies or those immune to Fear ignore this effect.',
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
  'Swifter Than Life Itself': 'Once per day, when ambushing an opponent, facing a lone opponent, or facing the target of your Rite of Assassination, you may switch your Initiative Score with theirs at the end of the Initiative Stage. Techniques and Advantages may not be used to switch Initiative back.',
  'Swifter Than Life Itself': "Once per day when ambushing an opponent, facing a lone opponent, or facing the target of your Rite, you may switch your Initiative Score with your opponent's at the end of the Initiative Stage.",

  // ── Assassin Keeper ────────────────────────────────────────────────────
  "The Keeper's Courage": 'You gain a +1k0 bonus to all Rolls involving the Perception Trait. When inflicting Wounds to an opponent, you may ignore half of their Reduction rating (round up).',
  "The Keeper's Judgment": 'When attacking an opponent, you may choose to disable them rather than wound them - dealing no damage, but inflicting the Dazed Conditional Effect on them instead.',
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
  'Deadly Strike (Legionnaire)': 'You may make attacks with Yodotai and Warrior weapons as a Simple Action for you.',
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
// Static bestiary - always available in the Monsters faction, no DB records needed.
// attack/damage use LBS dice notation (e.g. '6k3'). tn = TN to Be Hit. wpl = Wounds per Level.
// Bestiary categories grouped into the two GM-facing "Type" buckets (used by the encounter
// "From Library" picker and the Quick NPC Creator - single source of truth for both).
// Arrow types - nocked alongside a bow, overriding the bow's own DR with the arrow's. Effects:
// 'ignoreArmor' (Armor Piercer) zeroes the target's armor bonus for TN purposes; 'doubleArmor'
// (Flesh Cutter) doubles it instead (per the rules: "Armor TN doubled; range halved" - the range
// half isn't enforced since no range/distance system exists elsewhere in Sandy either).
export const ARROW_TYPES = {
  'Quiver (60 arrows)':          { dr: '2k2', effect: null,          label: 'Standard' },
  'Armor Piercing Arrows (20)':  { dr: '1k2', effect: 'ignoreArmor', label: 'Armor Piercer' },
  'Flesh Cutter Arrows (20)':    { dr: '2k3', effect: 'doubleArmor', label: 'Flesh Cutter' },
  'Signal Arrows (10)':          { dr: '0k1', effect: 'signal',      label: 'Signal' },
};

export const CREATURE_TYPE_CATEGORIES = { Creatures: ['Animal'], Monsters: ['Supernatural', 'Demonic', 'Undead', 'Jinn'] };

export const CREATURES_LIBRARY = [
  // ── Animals ─────────────────────────────────────────────────────────────────
  {
    id: 'creature_camel', name: 'Camel', category: 'Animal',
    air: 2, earth: 3, fire: 2, water: 3,
    traits: { Stamina: 3, Strength: 6 },
    attack: '3k2', damage: '3k2', tn: 10, wpl: 10,
    difficulty: 1, veteran: { tn: 2, wpl: 3, atk: '+1k0' },
    specials: [],
    gm_notes: 'Riding animal and beast of burden. Can go long periods without water. Attacks by biting. Bad-tempered. Horsemanship (Camel emphasis).',
  },
  {
    id: 'creature_horse', name: 'Horse', category: 'Animal',
    air: 2, earth: 3, fire: 1, water: 3,
    traits: { Agility: 3, Strength: 5 },
    attack: '3k2', damage: '6k3', tn: 10, wpl: 10,
    difficulty: 1, veteran: { tn: 2, wpl: 3, atk: '+1k0' },
    specials: ['Fleet - uses Strength instead of Water for movement. TN 15 at gallop.'],
    gm_notes: 'Not native to Burning Sands. Status symbol for wealthy citizens.',
  },
  {
    id: 'creature_gorilla', name: 'Ape (Gorilla Bodyguard)', category: 'Animal',
    air: 1, earth: 2, fire: 2, water: 1,
    traits: { Reflexes: 3, Stamina: 4, Agility: 4, Strength: 5 },
    attack: '5k4', damage: '5k2', tn: 20, wpl: 10,
    difficulty: 2, veteran: { tn: 3, wpl: 4, atk: '+1k0' },
    reduction: 4,
    specials: [
      'Smash (Simple): Attack 5k4, Damage 5k2',
      'Bite (Complex): Attack 4k4, Damage 3k3',
      'Athletics (Climbing) 3',
      'Fear 1 - all opponents must resist Fear at the start of combat',
    ],
    gm_notes: 'Ape (Ozaru) - official stat block. Initiative: 4k3. Wounds: 10/20/30/Dead. Reduction 4. Gorilla Bodyguard advantage grants one trained ape; owner counts as Animal Handling (Gorilla) 5 for commands, or uses actual rank if higher.',
  },
  {
    id: 'creature_snake', name: 'Snake (Venomous)', category: 'Animal',
    air: 1, earth: 1, fire: 1, water: 1,
    traits: { Reflexes: 3, Agility: 3, Awareness: 3 },
    attack: '3k2', damage: '1k1', tn: 20, wpl: 4,
    difficulty: 1, veteran: { tn: 1, wpl: 2, atk: '+1k0' },
    specials: ['Poison - successful attack forces target to resist snake venom.'],
    gm_notes: 'Common in the Burning Sands. Used as assassination tools by Assassins, Jackals, and Senpet.',
  },
  {
    id: 'creature_monkey', name: 'Monkey', category: 'Animal',
    air: 3, earth: 1, fire: 2, water: 2,
    traits: { Reflexes: 3, Agility: 4 },
    attack: '2k2', damage: '1k1', tn: 20, wpl: 2,
    difficulty: 0.5, veteran: { tn: 1, wpl: 2, atk: '+1k0' },
    specials: [
      'Nimble - moves through trees, walls, and structures freely as a Free Action.',
      'Theft - may attempt to steal a small item from a target as a Simple Action (opposed Agility/Sleight of Hand vs Reflexes/Defense).',
    ],
    gm_notes: 'Brought in by Ra\'Shari caravans. Kept as pets or trained by thieves. Some wealthy houses use them as messengers within large compounds.',
  },
  {
    id: 'creature_jackal', name: 'Jackal', category: 'Animal',
    air: 2, earth: 2, fire: 2, water: 2,
    traits: { Reflexes: 3, Awareness: 3 },
    attack: '3k2', damage: '2k1', tn: 15, wpl: 4,
    difficulty: 1, veteran: { tn: 1, wpl: 2, atk: '+1k0' },
    specials: [
      'Pack Hunter - gains +1k0 to attack rolls for each additional jackal attacking the same target (max +3k0).',
      'Scent - cannot be surprised and ignores penalties for fighting in darkness.',
    ],
    gm_notes: 'Desert scavengers found in packs of 3–8 near battlefields, refuse heaps, and city edges. The Jackal faction takes its name from them. Rarely attack healthy humans alone - much bolder in packs.',
  },
  {
    id: 'creature_crocodile', name: 'Crocodile', category: 'Animal',
    air: 1, earth: 4, fire: 2, water: 4,
    traits: { Stamina: 5, Strength: 6 },
    attack: '4k2', damage: '5k2', tn: 10, wpl: 12,
    difficulty: 2, veteran: { tn: 2, wpl: 4, atk: '+1k0' },
    specials: [
      'Carapace 3 - thick hide reduces damage dice rolled by 3 (minimum 1 die).',
      'Ambush Predator - gains +2k0 to attack rolls when attacking from water or when target is unaware.',
      'Death Roll - on a successful grapple, may make a free damage roll each subsequent round without needing a new attack roll.',
    ],
    gm_notes: 'Found in the river and large oases outside Medinaat al-Salaam. Considered sacred by some Senpet. Slow on land (Water Ring for movement), lethal in water. Rarely ventures into the city proper - but the deeper sewer channels occasionally have them.',
  },
  // ── Supernatural ────────────────────────────────────────────────────────────
  {
    id: 'creature_cat', name: 'Cat of Many Tongues', category: 'Supernatural',
    air: 3, earth: 1, fire: 1, water: 1,
    traits: { Perception: 2 },
    attack: '3k2', damage: '1k1', tn: 15, wpl: 3,
    difficulty: 0.5, veteran: { tn: 1, wpl: 2, atk: '+1k0' },
    specials: [
      'Magic Resistance - Jinn attacks/effects suffer +10 TN; Jinn magic within 30\' suffers +20 TN.',
      'Mimicry - Repeats anything said within 30\' in the language of every listener present.',
    ],
    gm_notes: 'Appear as ordinary strays but eyes glow golden at sunrise/sunset. Sought for translation. Jinn are loathe to harm them.',
  },
  {
    id: 'creature_ghul', name: 'Ghul', category: 'Undead',
    air: 2, earth: 3, fire: 2, water: 4,
    traits: { Reflexes: 3, Agility: 3 },
    attack: '6k3', damage: '4k2', tn: 15, wpl: 8,
    difficulty: 2, veteran: { tn: 3, wpl: 4, atk: '+1k0' },
    specials: [
      'Fear 1 - Willpower TN 10 to confront; fail by 15+ means flee.',
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
    difficulty: 4, veteran: { tn: 5, wpl: 6, atk: '+1k1' },
    specials: [
      'Fear 3 - Willpower TN 20 to confront.',
      'Flight - movement rate of twenty times Water Ring.',
      'May attack twice per round with talons.',
      'Pounce - if both talon attacks hit, gain 2 Free Raises on any subsequent grapple.',
    ],
    gm_notes: 'Bird of prey large enough to carry elephants. Adult wingspan 200 ft. Common near Medinaat al-Salaam since increase in Ivory Kingdoms caravans.',
  },
  {
    id: 'creature_wyrm', name: 'Desert Wyrm', category: 'Supernatural',
    air: 1, earth: 5, fire: 3, water: 4,
    traits: { Stamina: 6, Strength: 7 },
    attack: '6k3', damage: '6k3', tn: 15, wpl: 14,
    difficulty: 4, veteran: { tn: 5, wpl: 6, atk: '+1k1' },
    specials: [
      'Fear 2 - Willpower TN 15 to confront.',
      'Carapace 2 - thick scales reduce damage dice rolled by 2 (minimum 1).',
      'Burrow - moves through sand and loose earth as easily as open ground; attacks from below add +2k0 to the first attack roll.',
      'Constrict - on a successful grapple, deals automatic Strength+2k2 damage each round without a new attack roll; target must beat TN 25 Strength roll to break free.',
      'Invulnerable to mundane weapons of less than Damage 3k2 - hide too thick for small blades and arrows.',
    ],
    gm_notes: 'Ancient serpentine predators, longer than ten men laid end to end. Rare even in deep desert - most sightings are juveniles. A full adult can swallow a camel whole. Revered as sacred by some desert tribes; feared by everyone else. Believed to be remnants of a pre-creation age. Some scholars suggest they are degenerate Jinn who took physical form during the Day of Wrath and could not return.',
  },
  // ── Demonic ─────────────────────────────────────────────────────────────────
  {
    id: 'creature_progeny', name: 'Progeny of the Destroyer', category: 'Demonic',
    air: 3, earth: 5, fire: 3, water: 4,
    traits: { Reflexes: 4, Agility: 5 },
    attack: '8k5', damage: '7k4', tn: 25, wpl: 10,
    difficulty: 5, veteran: { tn: 5, wpl: 8, atk: '+1k1' },
    specials: [
      'Carapace 3 - reduces damage dice rolled by 3 (min 1).',
      'False Form - can assume form of a beautiful local woman; shapeshifting, not illusion - no magic can penetrate it.',
      'Natural Weapons - 6 clawed arms, fangs, horns; may make 4 melee attacks per round.',
      'Nightsight - sees in darkness with absolute clarity.',
      'Spellcasting - minimum Rank 2 sahir equivalent.',
    ],
    gm_notes: 'Blood-borne daughters of Kali-Ma. Exceptionally rare - only two known: Sarna and Anata.',
  },
  // ── Jinn Templates ──────────────────────────────────────────────────────────
  {
    id: 'creature_jinn_minor', name: 'Minor Jinn', category: 'Jinn',
    air: 2, earth: 2, fire: 2, water: 2, void: 2,
    traits: {},
    attack: '4k2', damage: '4k2', tn: 10, wpl: 4,
    difficulty: 2, veteran: { tn: 3, wpl: 4, atk: '+1k0' },
    specials: [
      'Invincible - no mortal weapon can slay a Jinn; if reduced past Out, returns to its realm.',
      'Shapeshifting - may change shape at will (self only).',
    ],
    gm_notes: 'Base template. 40 CP, max 1 Advantage. Roll on Tables A2.2–A2.10 to customize. Skills: Brawling 2, Commerce 3.',
  },
  {
    id: 'creature_jinn_medium', name: 'Medium Jinn', category: 'Jinn',
    air: 3, earth: 3, fire: 4, water: 3, void: 4,
    traits: {},
    attack: '6k4', damage: '6k4', tn: 20, wpl: 6,
    difficulty: 4, veteran: { tn: 5, wpl: 6, atk: '+1k1' },
    specials: [
      'Invincible - no mortal weapon can slay a Jinn.',
      'Shapeshifting - may change shape at will (self only).',
    ],
    gm_notes: 'Base template. 60 CP, max 3 Advantages. Skills: Brawling 4, Commerce 4.',
  },
];

// ── LBS Book Reference - Table of Contents ────────────────────────────────────
// File IDs from Google Drive share links (the string between /d/ and /view in the URL)
export const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1ItTpn0-2yRB-06sJLJm_ZZxWF1I8kgCZ';

export const BOOK_TOC = [
  {
    chapter: '★ L5R 4th Edition Conversion Rules',
    page: 1,
    fileId: '1E_nDm1aul09FeOAcMg-w2ylq1vJqRkfL',
    isPinned: true,
    sections: [
      { title: 'Schools & Techniques - 4th Ed conversion', page: 1 },
      { title: 'Combat Maneuvers - Feint, Knockdown, Disarm, Extra Attack', page: 1 },
      { title: 'Stances - Attack, Full Attack, Defense, Full Defense, Center', page: 1 },
      { title: 'Wounds & Conditions', page: 1 },
    ],
  },
  {
    chapter: 'Introduction & Table of Contents',
    page: 1,
    fileId: '1dRtdGMcXCpZbsce_x95VShAZL52fmczs',
    sections: [
      { title: 'Introduction - Journal of Iuchi Yue', page: 5 },
      { title: 'Tales of Yesterday and Today', page: 7 },
      { title: 'How to Use This Book', page: 8 },
      { title: 'The Line of the Prophet (Mekhem / Shinsei)', page: 10 },
      { title: 'Rokugan and the Gaijin', page: 11 },
    ],
  },
  {
    chapter: 'Chapter 1: Rules - Roll & Keep, Characters, Skills',
    page: 15,
    fileId: '1ntnWXNsrUESkFT-00TW_iu7_rlOAIymi',
    sections: [
      { title: 'Basic Game Mechanics - Roll and Keep', page: 13 },
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
      { title: 'Equipment - Weapons, Armor, Gear', page: 53 },
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
      { title: 'Overview - Government, Economics, Landscape, Demographics', page: 84 },
      { title: 'History of the Jewel', page: 90 },
      { title: 'The Caliphate and the Khadi', page: 95 },
      { title: 'The Immortal Caliph Hanan', page: 95 },
      { title: 'Houses of Dahab', page: 104 },
      { title: 'The Qolat (secret conspiracy)', page: 105 },
      { title: 'The Qabal - Politics of Sorcery', page: 112 },
      { title: 'The Five Sahir Disciplines (magic system)', page: 118 },
      { title: 'City Guard / Free Sahir / Heartless Khadi', page: 100 },
    ],
  },
  {
    chapter: 'Chapter 3: The Ashalan',
    page: 127,
    fileId: '1HmBetSHE-SDA6sK2XRq61CgMS4kYy-Xt',
    sections: [
      { title: 'Overview - Blue-Skinned Immortals', page: 128 },
      { title: 'History - Creation and the Day of Wrath', page: 129 },
      { title: 'Political and Social Organization', page: 134 },
      { title: 'The Ishanti Crystal', page: 136 },
      { title: 'Religious Beliefs - Souls of the Twelve', page: 136 },
      { title: 'Culture - Tattoos, Reproduction, Sandsmithing', page: 139 },
      { title: 'Blood-Sworn / Children of Midnight / Heart-Seekers / Sun-Riders', page: 144 },
    ],
  },
  {
    chapter: 'Chapter 4: The Assassins',
    page: 153,
    fileId: '1cyspJdsDUKB2AJ2mBG-NThh0h3YSPYyL',
    sections: [
      { title: 'Overview and Secret History', page: 153 },
      { title: 'History - Order of the Mountain', page: 155 },
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
      { title: 'Culture - Nomadic Life and Language', page: 184 },
      { title: "Ra'Shari Knife-Fighter / Trader / Diviner", page: 188 },
      { title: 'Cokaloi Magic - Dawn, Dusk, Night', page: 190 },
    ],
  },
  {
    chapter: 'Chapter 6: The Senpet',
    page: 199,
    fileId: '18kDmzy2duRSTSKPXxVi4FTOOB3qTvPXe',
    sections: [
      { title: 'Overview - Fallen Empire', page: 197 },
      { title: 'History', page: 199 },
      { title: 'Political and Social Organization', page: 204 },
      { title: 'Religious Beliefs - The Ten Thousand Gods', page: 206 },
      { title: 'Culture - Ritual, Sacrifice, Military Tradition', page: 208 },
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
      { title: 'History - The Unstoppable Empire', page: 223 },
      { title: 'Political and Social Organization', page: 227 },
      { title: 'Religious Beliefs - Ancestral Warrior Spirits', page: 230 },
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
      { title: 'Kali-Ma - Religion of Death and Rebirth', page: 249 },
      { title: 'Culture - Sewers, Ghuls, Necromancy', page: 252 },
      { title: 'Jani / Necromancer / Kabir', page: 255 },
    ],
  },
  {
    chapter: 'Chapter 9: The Ebonites',
    page: 263,
    fileId: '1PgA8uJzyCVAS_h0VnR-kQwDjzboteWfb',
    sections: [
      { title: 'Overview and History - The Ebon Hand', page: 263 },
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
      { title: 'Special Abilities - Carapace, Fear, Invulnerability', page: 290 },
      { title: 'The Jinn - Creation Templates and Tables', page: 291 },
      { title: 'Negotiating with Jinn', page: 295 },
      { title: 'Map of the Burning Sands', page: 296 },
    ],
  },
];

// ── Technique & Advantage Roll Bonuses ─────────────────────────────────────────
// Each entry: { skills: [...], rolled: N, kept: K, flat: N, freeRaises: N,
//              stances: [...optional - only in these stances],
//              conditional: 'description of condition',
//              voidOnly: true - only activates when spending Void,
//              note: 'shown in bonus panel' }
// skills: list of skill names OR 'ALL' OR 'ATTACK' OR 'DAMAGE' OR 'SOCIAL' OR 'SPELLCASTING' OR 'LORE' OR 'INITIATIVE'
// Multiple entries per technique for techniques with multiple effects.

export const TECHNIQUE_ROLL_BONUSES = {

  // ── City Guard ────────────────────────────────────────────────────────────────
  'Trained For War': [
    { skills: ['Athletics','Battle','Defense','INITIATIVE'], rolled: 1, kept: 0, voidOnly: true, note: '+1k0 (combines with your Void spend for +2k1 total)' },
    { skills: ['Defense','Sincerity','Etiquette','Courtier','SOCIAL'], conditional: 'Add School Rank to resist Fear/Intimidation/Temptation', note: '+Rank to contested social resistance rolls' },
    { skills: ['WOUNDPENALTY'], conditional: 'Subtract School Rank from Wound TN penalties', note: '-Rank to Wound TN penalties' },
  ],
  'Strike With Fury': [
    { skills: ['INITIATIVE'], rolled: 1, kept: 0, note: '+1k0 Initiative always' },
    { skills: ['ATTACK'], rolled: 1, kept: 0, stances: ['Full Attack'], note: '+1k0 Attack in Full Attack stance' },
  ],
  'Implacable Foe': [
    { skills: ['ATTACK'], simpleAction: true, conditional: 'With chosen weapon skill (school weapon)', note: 'Attacks with chosen weapon are Simple Actions' },
    { skills: ['ATTACK'], freeRaises: 1, conditional: 'With emphasis matching chosen weapon', note: 'Free Raise when attacking with chosen weapon emphasis' },
  ],
  'Instrument of the Caliph': [
    { skills: ['Defense','Sincerity','Etiquette','SOCIAL'], conditional: 'Twice School Rank to resist duties (replaces R1)', note: '+2×Rank to resist Fear/Intimidation/Temptation (replaces R1)' },
  ],
  'The Sublime Warrior': [
    { skills: ['INITIATIVE'], flat: 5, voidOnly: true, note: '+5 to Initiative when spending Void' },
    { skills: ['WOUNDPENALTY'], conditional: 'Void spend: ignore all wound penalties for one round', note: 'Spend Void to ignore all wound penalties for one round' },
  ],

  // ── Dahabi Enforcer ────────────────────────────────────────────────────────────
  'Moonless Night': [
    { skills: ['ATTACK'], rolled: 1, kept: 0, stances: ['Full Attack'], note: '+1k0 Attack in Full Attack stance' },
    { skills: ['DAMAGE'], rolled: 1, kept: 0, stances: ['Full Attack'], note: '+1k0 Damage in Full Attack stance' },
  ],
  'Dangerous Maneuvers': [
    { skills: ['Brawling'], rolled: 1, kept: 1, conditional: 'Grapple', note: '+1k1 Contested Strength / Brawling in grapple' },
    { skills: ['DAMAGE'], rolled: 1, kept: 0, conditional: 'Grapple', note: '+1k0 Damage in grapple' },
  ],
  'Show of Force': [
    { skills: ['ATTACK'], simpleAction: true, conditional: 'Unarmed or warrior keyword weapons', note: 'Attacks with warrior weapons are Simple Actions' },
  ],
  'Bitter Shadows': [
    { skills: ['Brawling'], rolled: 2, kept: 2, conditional: 'Grapple', note: '+2k2 Contested Strength in grapple (replaces R2)' },
    { skills: ['DAMAGE'], rolled: 2, kept: 0, conditional: 'Grapple', note: '+2k0 Damage in grapple (replaces R2)' },
  ],
  'Final Strike': [
    { skills: ['DAMAGE'], rolled: 0, kept: 2, stances: ['Center'], note: '+0k2 Damage in Center stance' },
  ],

  // ── Dahabi Bargainer ──────────────────────────────────────────────────────────
  'Penetrating Words': [
    { skills: ['Commerce'], rolled: 1, kept: 1, conditional: 'Bargaining with Jinn', note: '+1k1 Contested Commerce when bargaining with Jinn' },
  ],

  // ── Dahabi Merchant ────────────────────────────────────────────────────────────
  'Master of the Subtle Flow': [
    { skills: ['Commerce'], rolled: 2, kept: 0, note: '+2k0 Commerce always' },
    { skills: ['Sincerity','Temptation'], rolled: 1, kept: 0, note: '+1k0 Sincerity/Temptation always' },
  ],
  'Upstanding Citizen': [
    { skills: ['Commerce','Sincerity','Temptation'], rolled: 2, kept: 0, conditional: 'Opponent declared Raises', note: '+2k0 if opponent declared Raises on contested Commerce/Sincerity/Temptation' },
  ],
  'An Eye for a Deal': [], // manual - FIXED a real bug: previously had flat:null, which evaluates to 0 via
    // the (bonus.flat || 0) fallback, meaning this entry silently did NOTHING despite looking automated. The
    // actual rule adds the character's Class Rank (a dynamic value) to the Void-spend bonus - same "needs
    // dynamic skill/rank-based bonus support" gap as Senpet Charioteer's Deadly Strike. Marked manual until
    // that system enhancement exists, rather than leaving a fake zero-value "working" entry.
  'Silver Tongued Devil': [
    { skills: ['Commerce','Sincerity','Temptation','Courtier','Etiquette'], rolled: 1, kept: 0, conditional: 'Reroll Sincerity as Commerce on failure (once)', note: 'May reroll failed Sincerity as Commerce; +1k0 social rolls (cumulative)' },
  ],
  'Merchant King': [
    { skills: ['SOCIAL'], rolled: 5, kept: 0, conditional: 'Uncontested, no Raises declared', note: '+5k0 uncontested Social with no Raises' },
  ],

  // ── Qabal Agent ───────────────────────────────────────────────────────────────
  'No One of Import': [], // manual - FIXED a real bug: previously tagged skills:['Sincerity'] with flat:-1,
    // which would incorrectly apply a -1 PENALTY to the technique-holder's own Sincerity roll if toggled.
    // The actual rule debuffs an OPPONENT's separate roll to detect lying (-1k0) - a different character's
    // roll this character never makes - which the bonus system has no hook for (always modifies the current
    // roller's own roll). Also grants a Mastery 1 Control Spell, handled by the spell system. Marked manual.
  'A Good Excuse': [
    { skills: ['Sincerity'], rolled: 2, kept: 0, note: '+2k0 Sincerity (Deceit)' },
  ],
  'Unassailable Reputation': [
    { skills: ['SOCIAL'], rolled: 1, kept: 0, conditional: 'Contested roll you did not initiate', note: '+1k0 Contested Social rolls you did not initiate' },
  ],
  'The Ordered Bolthole': [
    { skills: ['Stealth'], rolled: 2, kept: 0, note: '+2k0 Stealth' },
  ],
  'Pillar of the Community': [], // manual/GM-adjudicated - spell grant + Void-spend reactive defense, no
    // automated dice hook exists for either piece. Full description already shown via TECHNIQUE_DESCRIPTIONS.

  // ── Ashalan Blood-Sworn ────────────────────────────────────────────────────────
  'Blessed by the Crystal': [
    { skills: ['Defense','SOCIAL'], conditional: 'Add School Rank to resist Fear/Intimidation/Temptation/effects against protecting your people', note: '+Rank to resist Fear/Intimidation/Temptation' },
  ],
  'Fortification in Form': [
    { skills: ['REDUCTION'], note: 'Reduction = Earth Ring (stacks with armor)' },
  ],
  'To Fight for the Future': [
    { skills: ['ATTACK'], simpleAction: true, note: 'Making an attack is a Simple Action' },
  ],
  'Your Blood is My Blood': [], // manual - reactive damage redirect to self for a guarded ally, no
    // "redirect wounds to another combatant" hook exists in the damage application system
  'One is Never Truly Alone': [], // manual - conditional Strength+5 and extra Wound Rank based on battlefield
    // positioning (surrounded 3+ sides / no allies within 300'), no positional-state tracking exists

  // ── Ashalan Heart-Seekers ──────────────────────────────────────────────────────
  'Truth is My Ally': [
    { skills: ['Investigation'], rolled: 2, kept: 0, note: '+2k0 Investigation (finding hidden things)' },
  ],
  'Diligence is the Best Teacher': [
    { skills: ['Investigation','Awareness','Perception'], freeRaises: 1, note: 'Free Raise on Perception/Awareness rolls' },
  ],
  'One Mind, One Action': [
    { skills: ['SPELLCASTING','Spellcraft'], conditional: 'Counter a spell: Intelligence/Spellcraft vs TN = Spellcasting roll', note: 'May counter spells with Intelligence/Spellcraft; +2×Rank Armor TN bonus' },
    { skills: ['ARMORNBONUS'], conditional: '+2×School Rank to Armor TN always', note: '+2×Rank Armor TN' },
  ],
  'Bane of the Heartless': [
    { skills: ['ATTACK'], simpleAction: true, conditional: 'With an Ashalan weapon (khadja, scimitar)', note: 'Attacks with Ashalan weapons are Simple Actions' },
    { skills: ['ATTACK'], conditional: 'Special attack: 3 Raises - opponent suffers +30 TN penalty and Water Ring reduced by Rank', note: '3-Raise special: opponent +30 TN, Water Ring -Rank for Rank rounds' },
  ],
  'My Will is My Fortress': [], // manual - TN increase to resist mind-affecting effects; no generic "resist
    // mental effect" roll type exists to attach a bonus to

  // ── Assassin Slayer ────────────────────────────────────────────────────────────
  'All Shadows Walk in the Light': [
    { skills: ['Acting','Sincerity','Etiquette','Stealth'], rolled: 1, kept: 0, note: '+1k0 Acting/Sincerity/Etiquette/Stealth' },
    { skills: ['DAMAGE'], rolled: 1, kept: 0, conditional: 'Target unaware of your presence', note: '+1k0 Damage vs unaware targets' },
  ],
  'Rite of Assassination': [
    { skills: ['ARMORBONUS'], conditional: 'Armor TN bonus = Stealth Skill Rank; doubled vs Rite target', note: '+Stealth rank to Armor TN; doubled vs Rite target' },
  ],
  'Let Him Bleed': [
    { skills: ['ATTACK'], simpleAction: true, conditional: 'vs lone opponent or Rite of Assassination target', note: 'Attacks vs lone/Rite target are Simple Actions' },
  ],
  'Blood Calls for Blood': [
    { skills: ['ATTACK'], conditional: 'vs lone/Rite target: add Stealth Skill rank as rolled bonus dice; Raises unlimited', note: '+Stealth rank rolled dice to Attack; unlimited Raises vs lone/Rite target' },
  ],
  'Swifter Than Life Itself': [], // manual - once-per-day Initiative swap with a chosen opponent, no automated hook

  // ── Assassin Keeper ────────────────────────────────────────────────────────────
  "The Keeper's Courage": [
    { skills: ['Investigation','Hunting','Perception'], rolled: 1, kept: 0, note: '+1k0 Perception-based rolls' },
  ],
  "The Keeper's Judgment": [], // manual - "may choose to Disable (deal no damage, inflict Dazed) instead
    // of wounding" is an attack declaration choice, not a dice modifier; no hook for attack-outcome substitution
  "The Keeper's Justice": [], // manual - "non-damaging attacks (Rank 2 / grapple initiation) are Simple
    // Actions" is a timing/action-type change; simpleAction flag was never enforced by any roll handler
  "The Keeper's Art": [], // manual - "+2×Class Rank to resistance TNs of Conditional Effects you inflict"
    // is dynamic and affects opponent's roll (not your own); "+1 Raise vs Dazed to Fatigue" is conditional
    // opponent-state gating with a special attack follow-up, not a dice pool bonus
  'By the Force of Will Alone': [], // manual - target-selection reactive ability (forces opponent Void cost in
    // Full Defense; ignores target's Armor TN bonuses in Full Attack), no opponent-targeting hook in bonus system

  // ── Ra\'Shari Knife-Fighter ─────────────────────────────────────────────────────
  'The Endless Dance': [
    { skills: ['INITIATIVE'], rolled: 1, kept: 0, note: '+1k0 Initiative' },
    { skills: ['ARMORBONUS'], conditional: 'Armor TN bonus = Perform (Dance) Skill rank while not in heavy armor', note: '+Dance Skill rank to Armor TN (light armor only)' },
  ],
  'Flashing Talons': [
    { skills: ['DAMAGE'], rolled: 1, kept: 0, conditional: 'Bladed weapon (knife, sword, khadja, etc.)', note: '+1k0 Damage with bladed weapons' },
  ],
  'Through the Cracks': [
    { skills: ['INITIATIVE'], rolled: 1, kept: 0, note: '+1k0 Initiative (total +2k0 with R1)' },
    { skills: ['ATTACK'], freeRaises: 0, conditional: 'Extra Attack costs 3 Raises (not 5) when unarmed or with knives only', note: 'Extra Attack costs 3 Raises (unarmed/knives only)' },
  ],
  'Two Knives, Two Wounds': [
    { skills: ['ATTACK'], simpleAction: true, conditional: 'Knife or unarmed attack', note: 'Knife/unarmed attacks are Simple Actions' },
  ],
  'Strike to Slay': [
    { skills: ['DAMAGE'], rolled: 1, kept: 1, voidOnly: true, conditional: 'Knife or unarmed', note: '+1k1 Damage with knife/unarmed when spending Void' },
    { skills: ['INITIATIVE'], rolled: 1, kept: 0, note: '+1k0 Initiative (total +3k0)' },
  ],

  // ── Ra\'Shari Trader ────────────────────────────────────────────────────────────
  'Opening Offer': [
    { skills: ['Sincerity','Temptation','Commerce'], rolled: 1, kept: 0, note: '+1k0 Sincerity/Temptation/Commerce' },
  ],
  'Acquiring the Goods': [
    { skills: ['Courtier','Etiquette','Lore: Underworld'], rolled: 1, kept: 0, note: '+1k0 Courtier/Etiquette/Lore: Underworld' },
  ],
  'Making the Deal': [
    { skills: ['Sincerity','Temptation','Commerce'], rolled: 2, kept: 0, note: '+2k0 Sincerity/Temptation/Commerce (total)' },
  ],
  'Expediency is Important': [
    { skills: ['Courtier','Etiquette','Lore: Underworld'], rolled: 2, kept: 0, note: '+2k0 Courtier/Etiquette/Lore: Underworld (total)' },
  ],
  'The Perfect Supplier': [
    { skills: ['Sincerity','Temptation','Commerce'], rolled: 3, kept: 0, note: '+3k0 Sincerity/Temptation/Commerce (total)' },
  ],

  // ── Ra\'Shari Diviner ───────────────────────────────────────────────────────────
  'The Whispers of the Song': [
    { skills: ['LORE'], conditional: 'Add Divination skill rank as flat bonus to Lore rolls', note: '+Divination rank to all Lore rolls' },
  ],

  // ── Senpet Legionnaire ─────────────────────────────────────────────────────────
  'Divine Insight': [
    { skills: ['Hunting'], rolled: 1, kept: 1, conditional: 'Desert survival only', note: '+1k1 Hunting (Survival) in the desert' },
    { skills: ['ARMORBONUS'], conditional: 'Add Lore: Theology rank to Armor TN in Center Stance', note: '+Theology rank to Armor TN in Center Stance' },
  ],
  'Divine Strength': [
    { skills: ['DAMAGE'], rolled: 1, kept: 1, voidOnly: true, note: '+1k1 Damage when spending Void' },
  ],
  'Divine Retribution': [], // manual - "attacks with Senpet keyword weapons are Simple Actions" is an
    // action-type change; the simpleAction flag was never read by any roll handler in the codebase
  'The Gods Protect Me': [
    { skills: ['ARMORBONUS'], flat: 20, voidOnly: true, stances: ['Center'], note: '+20 Armor TN in Center Stance (Void spend, once per round)' },
  ],
  'The Gods Guide my Hand': [
    { skills: ['ATTACK'], rolled: 4, kept: 1, voidOnly: true, conditional: 'Once per skirmish', note: '+4k1 Attack once per skirmish (Void)' },
  ],

  // ── Senpet Charioteer ─────────────────────────────────────────────────────────
  'Ride Into Battle': [
    { skills: ['INITIATIVE'], rolled: 1, kept: 0, conditional: 'While mounted on chariot', note: '+1k0 Initiative when mounted on chariot' },
    { skills: ['ARMORBONUS'], voidOnly: true, conditional: 'Add Lore: Theology rank to Armor TN bonus when spending Void (mounted/Full Attack)', note: '+Theology rank to Armor TN void-spend bonus (mounted/Full Attack)' },
  ],
  'Swift Volley': [], // manual - conditional defense from taking 2 simple-action moves (enemies in Full
    // Attack can't target you; +5 TN to spells against you) - no per-round movement-choice state is tracked
  'Ruthless Advance': [
    { skills: ['ATTACK'], rolled: 3, kept: 0, voidOnly: true, stances: ['Full Attack'], conditional: 'Mounted on chariot OR Full Attack stance', note: '+3k0 Attack until Reactions Stage (Void, mounted/Full Attack)' },
  ],
  'Speed is my Armor': [
    { skills: ['ATTACK'], simpleAction: true, conditional: 'While mounted on chariot OR in Full Attack stance', note: 'Attacks are Simple Actions while mounted or in Full Attack' },
  ],
  'Deadly Strike': [], // manual - once-per-skirmish Void spend for bonus damage dice equal to Lore: Theology
    // rank; needs dynamic skill-rank-based bonus support, which the static rolled/kept number format doesn't
    // have yet. Candidate for a future system enhancement (function-based bonus values).

  // ── Ebonite Templar ────────────────────────────────────────────────────────────
  'Tapping the Inner Strength': [
    { skills: ['ATTACK','DAMAGE','SOCIAL'], rolled: 1, kept: 0, conditional: 'Opponent has lower Integrity', note: '+1k0 Attack/Damage/Social vs lower-Integrity opponents' },
  ],
  'By Thy Will': [
    { skills: ['INITIATIVE'], voidOnly: true, conditional: 'Spend Void during Reactions Stage to boost Initiative as if start of round', note: 'Void: boost Initiative score as if re-rolling (lasts rest of skirmish)' },
  ],
  'The Ebon Hand': [
    { skills: ['ATTACK'], simpleAction: true, conditional: 'Warrior or Ebonite keyword weapons', note: 'Attacks with warrior/Ebonite weapons are Simple Actions' },
  ],
  'By Word Or By Sword': [
    { skills: ['SOCIAL'], voidOnly: true, conditional: 'Add half Integrity (round down) as rolled dice', note: '+½ Integrity as rolled dice to Social (Void spend)' },
  ],
  'Will of the Stone': [
    { skills: ['WOUNDPENALTY'], voidOnly: true, conditional: 'Spend Void to ignore all wound penalties for remainder of skirmish', note: 'Void: ignore all wound penalties for rest of skirmish' },
  ],

  // ── Jani ────────────────────────────────────────────────────────────────────
  'Quicker Than the Eye': [
    { skills: ['INITIATIVE'], rolled: 1, kept: 0, note: '+1k0 Initiative' },
    { skills: ['Stealth'], rolled: 1, kept: 0, note: '+1k0 Stealth' },
  ],
  'What the Eye Sees, What the Ear Hears': [
    { skills: ['Investigation','Hunting','Perception'], rolled: 1, kept: 0, note: '+1k0 Perception-based rolls' },
    { skills: ['ATTACK','DAMAGE'], rolled: 1, kept: 0, conditional: 'Feint maneuver with Knives/Staves/Assassin Ranged Weapons', note: '+1k0 Attack/Damage on Feint with Knives/Staves/ARW' },
  ],
  'Strike Quickly, Strike True': [
    { skills: ['INITIATIVE'], rolled: 2, kept: 0, note: '+2k0 Initiative (total)' },
    { skills: ['Stealth'], rolled: 2, kept: 0, note: '+2k0 Stealth (total)' },
    { skills: ['Investigation','Hunting','Perception'], rolled: 2, kept: 0, note: '+2k0 Perception-based (total)' },
    { skills: ['Acting'], freeRaises: 1, conditional: 'Disguise Emphasis only', note: 'Free Raise on Acting (Disguise)' },
  ],
  'Seen and Not Noticed': [], // manual - "attacks with Knives, Staves, or Assassin Ranged Weapons are a
    // Simple Action" is a timing/action-type change, not a dice modifier. The simpleAction flag in
    // the previous entry was never read by any roll handler.
  'Blinding Speed': [], // manual - "Extra Attack Maneuver costs only 3 Raises (not 5) with Knives/Staves/ARW"
    // reduces a raise cost threshold, not a dice pool bonus - no hook for raise-cost modification exists.

  // ── Necromancer ────────────────────────────────────────────────────────────────
  'Initiate of Undeath': [], // manual - spell grant (3 Mastery Levels of Ghul Creation/Death, cast per day
    // equal to Earth Ring) plus Soul Jar crafting - handled by spell system, not a dice modifier
  'Master of Undeath and Death': [
    { skills: ['CONTESTED'], rolled: 2, kept: 0, conditional: 'Contested rolls involving Willpower', note: '+2k0 on Contested Willpower rolls' },
  ],
  'Creator of Undeath': [
    { skills: ['Intimidation','Sincerity'], rolled: 1, kept: 0, note: '+1k0 Intimidation/Sincerity (Deceit)' },
  ],
  'Leader of Undead': [], // manual - "+1k0 to Attack and Damage Rolls for all Undead under your control"
    // is a bonus that applies to NPC combatants, not to the player's own roll pool. No hook exists
    // for augmenting controlled-NPC rolls from a PC technique.
  'Agent of Death': [], // manual - clarifies undead-control ownership (your undead obey until dismissed or
    // stolen by another Necromancer; non-Necromancers can't take control) - not a dice modifier

  // ── Kabir ─────────────────────────────────────────────────────────────────────
  'Rotting the Foundation': [
    { skills: ['Acting','Forgery','Gambling','Stealth','Lore: Underworld','Knives','Brawling','Sleight of Hand'], rolled: 1, kept: 1, voidOnly: true, note: '+2k2 total when spending Void on Low skills - adds +1k1 on top of base Void +1k1' },
  ],
  'A Honeyed Tongue': [
    { skills: ['Etiquette','Storytelling','Courtier','Sincerity'], rolled: 1, kept: 0, note: '+1k0 Etiquette/Storytelling/Courtier/Sincerity (Deceit)' },
  ],
  'Killing with Subtlety': [
    { skills: ['Craft: Poison','Sleight of Hand'], rolled: 2, kept: 0, note: '+2k0 Craft: Poison/Sleight of Hand' },
  ],
  'Tearing Out the Foundation': [
    { skills: ['Stealth','Forgery'], rolled: 2, kept: 0, note: '+2k0 Stealth/Forgery' },
    { skills: ['Craft: Weaponsmith','Craft: Armorsmith','Craft: Poison'], freeRaises: 1, conditional: 'Destroying/disguising/altering objects', note: 'Free Raise to destroy, disguise, or alter physical objects' },
  ],
  'Jackal Ambassador': [
    { skills: ['Etiquette','Storytelling','Courtier','Sincerity'], rolled: 2, kept: 0, note: '+2k0 Etiquette/Storytelling/Courtier/Sincerity (total)' },
  ],

  // ── Paths of the Free ────────────────────────────────────────────────────────
  'Predator of the Alleys': [
    { skills: ['Brawling','Athletics'], rolled: 1, kept: 0, conditional: 'Knockdown maneuver', note: '+1k0 Brawling Attack on Knockdown' },
  ],
  'A Man of Knowledge': [
    { skills: ['LORE'], freeRaises: 1, note: 'Free Raise on all Lore skill rolls' },
    { skills: ['Etiquette','Storytelling'], conditional: 'Add number of Lore skills possessed as flat bonus', note: '+Lore skill count to Etiquette/Storytelling' },
  ],
  'Master of the Streets': [
    { skills: ['Sleight of Hand','Athletics'], rolled: 1, kept: 0, note: '+1k0 Sleight of Hand/Athletics' },
  ],

  // ── Qabal Summoner ────────────────────────────────────────────────────────────
  'The Crucible of Knowledge': [
    { skills: ['SPELLCASTING','Spellcraft'], rolled: 1, kept: 1, conditional: 'Chosen discipline only', note: '+1k1 Spellcasting for your chosen discipline' },
  ],

  // ── Children of Midnight ──────────────────────────────────────────────────────
  'Wisdom of the Stars': [
    { skills: ['SPELLCASTING','Spellcraft'], freeRaises: 1, conditional: 'Celestial discipline spells only', note: 'Free Raise on Celestial spells' },
  ],

  // ── Free Sahir ────────────────────────────────────────────────────────────────
  'Self-Taught Sorcerer': [
    { skills: ['INITIATIVE'], conditional: 'Add School Rank as bonus rolled dice', note: '+1k0 per School Rank to Initiative' },
  ],

  // ── Senpet Sahir ────────────────────────────────────────────────────────────
  'By the Grace of the Gods': [
    { skills: ['SPELLCASTING','Spellcraft'], rolled: 1, kept: 1, conditional: 'Chosen discipline only at character creation', note: '+1k1 to chosen discipline Spellcasting' },
  ],

  // ── Assassin Duelist ────────────────────────────────────────────────────────
  'The Tiger Claw Cut': [
    { skills: ['ALL'], rolled: 2, kept: 1, stances: ['Center'], note: '+2k1 ALL rolls in Center stance' },
  ],
  'No Escape': [
    { skills: ['ATTACK'], conditional: 'Extra Attack costs 3 Raises when wielding a weapon in each hand', note: 'Extra Attack costs 3 Raises (dual-wield); second attack from off-hand' },
  ],
  'The Final Strike': [
    { skills: ['DAMAGE'], voidOnly: true, conditional: 'Tahaddi Duel only - spend any amount of Void', note: 'Add any number of Void Points to Tahaddi Duel Damage' },
  ],

  // ── Yodotai Legionnaire ──────────────────────────────────────────────────────
  'Tortoise Formation': [], // manual - three effects: (1) no attack penalty for carrying Yodotai shields
    // (not a roll bonus), (2) +Insight Rank to Armor TN in Full Defense with scutum (dynamic value, no
    // enforcement hook), (3) Void-powered aura to allies (ally-buff system doesn't exist)
  'In Close Quarters': [
    { skills: ['ATTACK'], rolled: 1, kept: 0, conditional: 'Round you switch from Full Defense → Full Attack', note: '+1k0 Attack on the round you switch stances (Full Defense → Full Attack)' },
  ],
  'Deadly Strike (Legionnaire)': [], // manual - "attacks with Yodotai and Warrior weapons are Simple Actions"
    // is an action-type change; simpleAction flag was never enforced by any roll handler
  'Wedge Formation': [
    { skills: ['REDUCTION'], conditional: 'Attack Stance: Reduction = School Rank', note: 'Gain Reduction equal to Rank in Attack Stance' },
  ],
  'With My Brothers': [], // manual - ally aura (+1k0 Damage to allies within 30' wielding Yodotai weapons),
    // no ally-radius aura system exists to apply bonuses to OTHER characters' rolls

  // ── Yodotai Mercenary ────────────────────────────────────────────────────────
  'Importance of Speed': [], // manual - shield TN penalty reduction + movement as if Water Ring were 1 higher;
    // no shield-carry-penalty tracking or movement-ring-override hook exists
  'Stranger in a Foreign Land': [
    { skills: ['Battle','Intimidation','Courtier'], rolled: 1, kept: 0, note: '+1k0 Battle/Intimidation/Courtier' },
  ],
  'Unfriendly Glare': [], // manual - "attacks with Warrior and Yodotai weapons are Simple Actions"
    // is an action-type change; simpleAction flag was never enforced by any roll handler
  'Combat Diplomacy': [], // manual - contested roll to learn an opponent's Advantage/Disadvantage, plus a
    // conditional Void-spend Free Raise on first meeting someone - both outside the standard roll-bonus shape
  'Hoplon Bash': [], // manual - a whole new shield-bash attack type (Agility/Brawling vs Armor TN, 1k2 damage
    // + forces a Knockdown), not a modifier to an existing roll

  // ── Yodotai Berserker ─────────────────────────────────────────────────────────
  'Deadly Strike (Berserker)': [
    { skills: ['DAMAGE'], rolled: 2, kept: 0, stances: ['Full Attack'], conditional: 'Yodotai weapon, Full Attack stance', note: '+2k0 Damage in Full Attack (Yodotai weapon)' },
  ],
  'Aura of Power': [
    { skills: ['REDUCTION'], conditional: 'Berserker gains Reduction = Rank in Full Attack stance', note: 'Reduction = Berserker Rank in Full Attack' },
  ],
  'Killing Blow': [
    { skills: ['DAMAGE'], flat: 5, kept: 0, rolled: 0, voidOnly: true, stances: ['Full Attack'], note: '+5k0 Damage in Full Attack (Void spend)' },
  ],
};


// ── Advantage Roll Bonuses ───────────────────────────────────────────────────────
export const ADVANTAGE_ROLL_BONUSES = {
  // ── Coded roll bonuses - applied automatically in DiceModal ───────────────
  'Balance':              [{ skills: ['SOCIAL'], rolled: 1, kept: 0, conditional: 'resisting Intimidation or Temptation via the Contested Roll tool, which now auto-suggests the Integrity flat modifier this depends on', note: '+1k0 when adding Integrity to resist Intimidation/Temptation (Balance)' }],
  'Clear Thinker':        [{ skills: ['SOCIAL'], rolled: 1, kept: 0, conditional: 'Contested Roll when being manipulated', note: '+1k0 Contested Rolls when being manipulated (Clear Thinker)' }],
  'Dangerous Beauty':     [{ skills: ['Temptation'], rolled: 1, kept: 0, conditional: 'vs members of opposite sex', note: '+1k0 Temptation vs opposite sex (Dangerous Beauty)' }],
  'Daredevil':            [{ skills: ['Athletics'], rolled: 2, kept: 0, voidOnly: true, note: '+3k1 total when spending Void on Athletics (Daredevil) - adds +2 rolled on top of base Void +1k1' }],
  'Friend of the Elements': [{ skills: ['TRAIT'], freeRaises: 1, conditional: 'chosen Ring trait rolls only', note: 'Free Raise on Trait Rolls of chosen Ring (Friend of the Elements)' }],
  'Friendly Kami':        [{ skills: ['Spellcraft'], rolled: 1, kept: 1, conditional: 'Sense, Commune, or Summon of chosen element', note: '+1k1 casting Sense/Commune/Summon of chosen element (Friendly Kami)' }],
  'Hands of Stone':       [{ skills: ['DAMAGE'], rolled: 0, kept: 1, conditional: 'unarmed attacks only', note: '+0k1 unarmed Damage (Hands of Stone)' }],
  'Heart of Vengeance':   [{ skills: ['CONTESTED'], rolled: 1, kept: 1, conditional: 'vs chosen faction', note: '+1k1 Contested Rolls vs chosen faction (Heart of Vengeance)' }],
  'Irreproachable':       [{ skills: ['Etiquette'], rolled: 1, kept: 0, conditional: 'Contested Roll vs Temptation', note: '+1k0 Contested Roll when resisting Temptation (Irreproachable)' }],
  'Large':                [{ skills: ['DAMAGE'], rolled: 1, kept: 0, conditional: 'large melee weapons only', note: '+1k0 Damage with large melee weapons (Large)' }],
  'Precise Memory':       [{ skills: ['INTELLIGENCE'], rolled: 1, kept: 1, conditional: 'recalling exact details', note: '+1k1 Intelligence rolls to recall exact details (Precise Memory)' }],
  'Quick':                [{ skills: ['INITIATIVE'], rolled: 0, kept: 0, flat: 0, conditional: 'see technique text', note: 'Add Reflexes to Initiative Score in Reactions Stage if you did not act first (Quick)' }],
  'Sacred Weapon':        [{ skills: ['ATTACK'], rolled: 0, kept: 0, flat: 0, conditional: 'see weapon description', note: 'Sacred Weapon: see individual weapon description for bonuses' }],
  'Sensation':            [{ skills: ['PERFORM'], rolled: 0, kept: 0, flat: 0, conditional: 'Unskilled Perform rolls', note: 'Treated as rank 1 in any Perform Skill when making Unskilled Roll (Sensation)' }],
  'Silent':               [{ skills: ['Stealth'], rolled: 1, kept: 0, note: '+1k0 all Stealth rolls (Silent)' }],
  'Blessed by Shilah': [{ skills: ['SOCIAL'], rolled: 0, kept: 1, conditional: 'persuasion only (not coercion)', note: '+0k1 Social when persuading (Shilah\'s Blessing)' }],
  'Blessed by the Desert': [{ skills: ['Commerce'], rolled: 1, kept: 1, note: '+1k1 Commerce (Desert\'s Blessing)' }],
  'Blessed by the All-Seeing Eye': [{ skills: ['LORE'], rolled: 1, kept: 1, conditional: 'chosen Lore Skill only', note: '+1k1 chosen Lore Skill (All-Seeing Eye Blessing)' }],
  'Blessed by the Honest Hand': [{ skills: ['ALL'], freeRaises: 1, conditional: 'chosen non-weapon skill only', note: 'Free Raise on chosen non-weapon skill (Honest Hand Blessing)' }],
  'Blessed by the Keeper of Years': [{ skills: ['WOUNDPENALTY'], conditional: 'Stamina considered one rank higher for Wounds and healing', note: 'Stamina +1 for Wound Ranks (Keeper of Years Blessing)' }],
  'Stolen Identity':      [{ skills: ['Acting'], freeRaises: 2, conditional: 'when using alternate identity', note: '2 Free Raises on Acting when using stolen identity (Stolen Identity)' }],
  'Strength of the Earth': [{ skills: ['ALL'], flat: 3, conditional: 'reduces wound TN penalty only - already coded in wound system', note: 'Wound TN penalties reduced by 3 (Strength of the Earth)' }],
  'Virtuous':             [{ skills: ['ALL'], flat: 0, conditional: 'Integrity/Honor bonus only', note: '+1 starting Integrity Rank (Virtuous)' }],
  'Voice':                [{ skills: ['PERFORM'], rolled: 1, kept: 1, conditional: 'voice-based Perform only', note: '+1k1 voice-based Perform (Singing, Oratory, etc.) (Voice)' }],
  'Wary':                 [{ skills: ['Investigation'], rolled: 1, kept: 1, conditional: 'vs Stealth (Ambush) only', note: '+1k1 Investigation (Notice) vs Stealth (Ambush) (Wary)' }],

  // ── Paragon variants ──────────────────────────────────────────────────────
  'Paragon of Compassion':  [{ skills: ['ALL'], rolled: 1, kept: 1, voidOnly: true, conditional: 'helping someone of lower Status', note: '+2k2 total when spending Void to help someone lower than you (Paragon of Compassion) - adds +1k1 on top of base Void +1k1' }],
  'Paragon of Courage':     [{ skills: ['SOCIAL','Defense'], rolled: 1, kept: 1, conditional: 'resisting Intimidation or Fear', note: '+1k1 to resist Intimidation or Fear (Paragon of Courage)' }],
  'Paragon of Courtesy':    [{ skills: ['Etiquette'], rolled: 2, kept: 0, conditional: 'avoiding embarrassment or giving offense', note: '+2k0 Etiquette to avoid embarrassment (Paragon of Courtesy)' }],
  'Paragon of Honesty':     [{ skills: ['Sincerity'], rolled: 1, kept: 1, conditional: 'Honesty - honest speech', note: '+1k1 Sincerity (Honesty) (Paragon of Honesty)' }],
  'Paragon of Honor':       [{ skills: ['SOCIAL','Defense'], conditional: 'add twice Integrity Rank to resist Temptation/Intimidation', note: '+2×Integrity Rank to resist Temptation/Intimidation (Paragon of Honor)' }],
  'Paragon of Sincerity':   [{ skills: ['Sincerity'], rolled: 2, kept: 0, conditional: 'Contested Rolls only', note: '+2k0 Contested Sincerity Rolls (Paragon of Sincerity)' }],

  // ── Dark Paragon variants (all conditional/once-per-session) ─────────────
  'Dark Paragon (Control)':      [{ skills: ['SOCIAL'], conditional: 'Once per session: sacrifice 5 Integrity or spend Void to re-roll any Social Skill Roll', note: 'Re-roll one Social roll (Dark Paragon Control)' }],
  'Dark Paragon (Determination)':[{ skills: ['ALL'], conditional: 'Once per session: sacrifice 5 Integrity or spend Void to negate all TN penalties on one roll', note: 'Negate all TN/Wound penalties on one roll (Dark Paragon Determination)' }],
  'Dark Paragon (Insight)':      [{ skills: ['AWARENESS'], conditional: 'Once per session: sacrifice 5 Integrity or spend Void to re-roll any Awareness roll', note: 'Re-roll one Awareness roll (Dark Paragon Insight)' }],
  'Dark Paragon (Knowledge)':    [{ skills: ['INTELLIGENCE'], conditional: 'Once per session: sacrifice 5 Integrity or spend Void to re-roll any Intelligence roll', note: 'Re-roll one Intelligence roll (Dark Paragon Knowledge)' }],
  'Dark Paragon (Perfection)':   [{ skills: ['ALL'], conditional: 'Once per session: sacrifice 5 Integrity or spend Void to force one die to explode', note: 'Force one die to explode on a Skill Roll (Dark Paragon Perfection)' }],
  'Dark Paragon (Strength)':     [{ skills: ['DAMAGE'], conditional: 'Once per session: sacrifice 5 Integrity or spend Void to re-roll any Damage Roll', note: 'Re-roll one Damage Roll (Dark Paragon Strength)' }],
  'Dark Paragon (Will)':         [{ skills: ['ALL'], conditional: 'Once per session: sacrifice 5 Integrity or spend Void to negate 10 Wounds', note: 'Negate 10 Wounds when suffered (Dark Paragon Will)' }],

  // ── LBS-specific advantages ───────────────────────────────────────────────
  'Ambidextrous':    [{ skills: ['ATTACK'], flat: -5, conditional: 'dual wield only - reduces off-hand penalty from -10 to -5', note: 'Dual-wield off-hand penalty -5 instead of -10 (Ambidextrous)' }],
  'Chosen by the Oracles': [{ skills: ['RING'], rolled: 1, kept: 1, conditional: 'chosen Ring only', note: '+1k1 all rolls using chosen Ring (Chosen by the Oracles)' }],

  // ── Newly reviewed - real dice bonuses ────────────────────────────────────
  'Cosmopolitan':     [{ skills: ['SOCIAL'], rolled: 1, kept: 0, note: '+1k0 all Social Skill rolls (Cosmopolitan)' }],
  'Blood of the Hanie': [{ skills: ['SOCIAL'], rolled: 1, kept: 1, conditional: 'vs other Yodotai only', note: '+1k1 Social rolls vs other Yodotai (Blood of the Hanie)' }],
  'Crab Hands':       [{ skills: ['ALL'], flat: 0, conditional: 'Unskilled Weapon Skill rolls treated as rank 1', note: 'Treated as rank 1 on Unskilled Weapon Skill rolls (Crab Hands)' }],
  'Sage':             [{ skills: ['LORE'], flat: 0, conditional: 'Unskilled Lore Skill rolls treated as rank 1', note: 'Treated as rank 1 on Unskilled Lore Skill rolls (Sage)' }],
  'Soul of Artistry':  [{ skills: ['ALL'], flat: 0, conditional: 'Unskilled Artisan/Craft rolls (chosen type) treated as rank 1', note: 'Treated as rank 1 on Unskilled Artisan/Craft rolls (Soul of Artistry)' }],
  'Crafty':           [{ skills: ['ALL'], flat: 0, conditional: 'Unskilled Low Skill rolls treated as rank 1', note: 'Treated as rank 1 on Unskilled Low Skill rolls (Crafty)' }],
  'Kharmic Tie':      [{ skills: ['ATTACK'], rolled: 1, kept: 1, conditional: 'once/session per point spent, fighting to protect the bonded person', note: '+1k1 Attack rolls protecting bonded person (Kharmic Tie)' }],
  'Blessed by Kaleel': [{ skills: ['ATTACK'], rolled: 1, kept: 0, conditional: 'once per session, Free Action, one round, no Void spent', note: '+1k0 Attack rolls for one round - once/session Free Action (Blessed by Kaleel)' }],
  'Naga Ancestry':    [{ skills: ['SOCIAL'], rolled: 1, kept: 0, conditional: 'with Naga only', note: '+1k0 Social rolls with Naga (Naga Ancestry)' }],
  'Reincarnated':     [{ skills: ['ALL'], rolled: 1, kept: 0, conditional: 'three chosen non-School Skills only', note: '+1k0 on three chosen non-School Skills (Reincarnated)' }],
  'Paragon of Duty':  [{ skills: ['ALL'], conditional: 'Once per session: spend Void to negate all TN penalties (incl. Wounds) on one roll', note: 'Negate all TN/Wound penalties on one roll (Paragon of Duty)' }],

  // ── Second pass - previously missed real dice bonuses ─────────────────────
  'Heartless':        [{ skills: ['SOCIAL'], rolled: 1, kept: 0, conditional: 'resisting Courtier/Sincerity/Temptation persuasion, seduction, or manipulation only', note: '+1k0 to resist persuasion/seduction/manipulation (Heartless)' }],
  'Imperial Spouse':  [{ skills: ['SOCIAL'], rolled: 1, kept: 1, conditional: 'with members of Imperial families only', note: '+1k1 Social rolls with Imperial family members (Imperial Spouse)' }],
  'Inheritance':      [{ skills: ['ALL'], rolled: 1, kept: 1, conditional: 'non-combat rolls using the heirloom only (attack/damage excluded)', note: '+1k1 non-combat rolls using the heirloom (Inheritance)' }],
  'Inheritance, Crysteel Weapon': [{ skills: ['ATTACK','DAMAGE'], rolled: 1, kept: 0, conditional: 'with the Crysteel weapon only', note: '+1k0 Attack/Damage with Crysteel weapon (Inheritance, Crysteel Weapon)' }],
  'Inheritance, Khadja of the Council': [{ skills: ['ATTACK'], rolled: 1, kept: 0, conditional: 'with the Khadja polearm only', note: '+1k0 Attack rolls with the Khadja (Inheritance, Khadja of the Council)' }],
  'Great Potential': [{ skills: ['ALL'], conditional: 'raise cap for chosen Skill uses Skill Rank instead of Void Ring, if higher - wired into DiceModal raise-cap display, not the bonus pipeline', note: 'Raise cap = max(Void Ring, Skill Rank) for chosen Skill (Great Potential)' }],
  'Magic Resistance': [{ skills: ['SPELLCASTING'], conditional: 'target\'s Casting TN vs elemental spells increases +3/rank - wired directly in PCTurnPanel\'s getTargetTN (opponent-facing, same pattern as Frail Mind/Greedy on the disadvantage side, but via target-selection TN rather than the Contested Roll tool since spellcasting isn\'t a Contested Roll in Sandy)', note: 'Target Casting TN +3/rank vs elemental spells (Magic Resistance)' }],
  'Absolute Direction': [{ skills: ['Sailing'], rolled: 1, kept: 0, emphasisRequired: 'Navigation', note: '+1k0 Sailing (Navigation) - always knows true north (Absolute Direction)' }],
  'Fame': [{ skills: ['ALL'], conditional: '+1 Reputation Rank, applied immediately and directly to the character record when added - wired in CharacterTab\'s add-advantage handler, not this table', note: '+1 Reputation Rank (Fame)' }],
  'Gentry': [{ skills: ['ALL'], conditional: 'Grants starting copper (cost × 3, a documented estimate - LBS gives no exact koku table for holdings) applied immediately when added - wired in CharacterTab\'s add-advantage handler, not this table', note: 'Starting copper from holding income (Gentry)' }],
  'Elemental Blessing': [{ skills: ['ALL'], conditional: 'GM picks the chosen Ring on the advantage card - -1 XP cost per rank to raise that Ring\'s Traits, wired directly into the XP Spend Panel\'s cost calculation, not this table', note: '-1 XP cost to raise chosen Ring\'s Traits (Elemental Blessing)' }],
  'Quick Healer': [{ skills: ['ALL'], conditional: 'Stamina treated 2 ranks higher for natural wound recovery - already coded via getEffectiveStamina()/getNaturalHealAmount() in lib/utils.js, used by Dawn healing and Rest Everyone', note: 'Stamina +2 for natural healing (Quick Healer)' }],
  'Wealthy': [{ skills: ['ALL'], conditional: 'Grants 2 copper × rank, applied immediately when added - wired in CharacterTab\'s add-advantage handler, not this table', note: '+2 copper × rank to starting outfit (Wealthy)' }],
  'Social Position': [{ skills: ['ALL'], conditional: '+1 Status Rank, applied immediately and directly to the character record when added - wired in CharacterTab\'s add-advantage handler, not this table', note: '+1 Status Rank (Social Position)' }],
  'Perceived Integrity': [{ skills: ['ALL'], conditional: 'Shows a derived "Perceived Integrity" stat card (Integrity + advantage rank) directly above real Integrity on the character sheet, per Charles\'s direction - simpler than per-viewer filtering, wired in CharacterTab, not this table', note: 'Perceived Integrity stat display = Integrity + rank (Perceived Integrity)' }],
  'Gorilla Bodyguard': [{ skills: ['ALL'], conditional: 'Auto-spawns a full Gorilla Bodyguard character (confirmed Ozaru stat block) when added, with claimed_by_name set to the owner - the player still needs one click to actually Claim it (claim state lives in their own browser, not settable remotely). Animal Handling override for commanding it is handled separately.', note: 'Auto-creates trained Ape character on add (Gorilla Bodyguard)' }],
  'Great Destiny': [{ skills: ['ALL'], conditional: 'Once per session, reduces a lethal (Out-rank) wound to 1 Wound point instead - wired directly in EncounterTab\'s gmWound(), shared mechanism with Dark Fate (identical text)', note: 'Once/session: survive lethal wound at 1 Wound (Great Destiny)' }],
  'Enlightened': [{ skills: ['ALL'], conditional: '-2 XP cost per rank to raise the Void Ring specifically, wired directly into the XP Spend Panel\'s cost calculation, not this table', note: '-2 XP cost to raise Void Ring (Enlightened)' }],
  'Leadership':       [{ skills: ['INITIATIVE'], conditional: 'once per round, grants +School Rank flat and +1k1 to one ally\'s Initiative roll - wired directly in the Initiative panel in EncounterTab (target-selection UI, not the bonus pipeline)', note: '+School Rank+1k1 to one ally\'s Initiative, once/round (Leadership)' }],
};

// ── Advantages with NO dice-roll hook by design (social/material/narrative effects,
// XP-cost changes, once-per-session GM-adjudicated triggers too free-form to auto-apply,
// or effects handled in a different system entirely - Void, healing, movement, etc.)
// Reviewed and confirmed manual - not an oversight. See ADVANTAGE_DISADVANTAGE_AUDIT.md.
const MANUAL_ADVANTAGES = [
  'Ceremony of the Hidden Heart','Higher Purpose',
  'Strategist','Tactician','Virtuous','Bland','Khadi','Quick','Allies','Blackmail',
  'Blissful Betrothal','Different School','Fame','Gentry','Hero of the People',
  'Multiple Schools','Read Lips','Sacrosanct',
  'Social Position','Spy Network','Well-Connected',
  'Wealthy','Sacred Weapon','Fitfully Sleeping Blood',
  'Paragon of Faith','Soul of Warriors',
  "Inari's Blessing",'Inner Gift','Languages','Luck','Servant of Smokeless Fire',
  'Blessed by the Wanderer',
  'Dark Paragon (Control)','Dark Paragon (Determination)','Dark Paragon (Insight)',
  'Dark Paragon (Knowledge)','Dark Paragon (Perfection)','Dark Paragon (Strength)','Dark Paragon (Will)',
];
MANUAL_ADVANTAGES.forEach(name => { if (!(name in ADVANTAGE_ROLL_BONUSES)) ADVANTAGE_ROLL_BONUSES[name] = []; });

// ── Disadvantage Roll Bonuses (negative modifiers, using the same shape as advantages) ──────
export const DISADVANTAGE_ROLL_BONUSES = {
  'Bad Eyesight':      [{ skills: ['Archery','Assassin Ranged Weapons','Throwing'], rolled: -1, kept: -1, note: '-1k1 ranged attacks (Bad Eyesight)' }, { skills: ['ALL'], rolled: -1, kept: -1, conditional: 'Perception-based rolls only', note: '-1k1 Perception-based rolls (Bad Eyesight)' }],
  'Small':             [{ skills: ['DAMAGE'], rolled: -1, kept: 0, conditional: 'melee attacks only', note: '-1k0 melee Damage rolls (Small)' }, { skills: ['WOUNDPENALTY'], conditional: 'Water Ring -1 for Move Actions - already coded in movement system', note: 'Water Ring -1 for movement (Small)' }],
  'Antisocial':        [{ skills: ['SOCIAL'], rolled: -1, kept: 0, note: '-1k0 all Social rolls (Antisocial, 2pt) - or -1k1 at the 4pt rank, adjust manually' }],
  'Cursed by Shilah':  [{ skills: ['SOCIAL'], rolled: -1, kept: 0, conditional: 'persuading or charming only', note: '-1k0 Social rolls to persuade/charm (Cursed by Shilah)' }],
  'Cursed by Kaleel':  [{ skills: ['ATTACK'], rolled: -1, kept: 0, stances: ['Attack','Full Attack'], note: '-1k0 Attack rolls in Attack/Full Attack stance (Cursed by Kaleel)' }],
  'Cursed by the Desert': [{ skills: ['Commerce'], rolled: 0, kept: -1, note: 'Commerce kept die -1, min 1 (Cursed by the Desert)' }],
  'Failure of Honesty': [
    { skills: ['Sincerity'], rolled: 1, kept: 0, emphasisRequired: 'Deceit', note: '+1k0 Sincerity (Deceit) - auto-applies when Deceit emphasis is selected (Failure of Honesty)' },
    { skills: ['Sincerity'], conditional: 'Integrity loss from dishonesty is doubled - not automated (Integrity system doesn\'t track loss reasons)', note: 'Doubled Integrity loss from dishonesty (Failure of Honesty)' },
  ],
  'Frail Mind':        [{ skills: ['Trait: Willpower'], conditional: 'opponent using a Trait: Willpower roll against you in the Contested Roll tool automatically gets +2k0 - wired this session', note: 'Opponent +2k0 Trait: Willpower vs you (Frail Mind)' }],
  'Doubt':             [{ skills: ['ALL'], conditional: 'GM picks the affected School Skill on the disadvantage card - +5 TN auto-applies on that skill only, wired directly in DiceModal (not this table)', note: '+5 TN mandatory wasted Raise on chosen School Skill (Doubt)' }],
  'Missing Limb':      [{ skills: ['ALL'], conditional: 'GM picks the missing limb type on the disadvantage card - +10 TN auto-applies on a curated list of affected skills (approximation, not exhaustive), wired directly in DiceModal (not this table)', note: '+10 TN on rolls involving the missing limb (Missing Limb)' }],
  'Obtuse':            [{ skills: ['ALL'], conditional: 'XP cost doubled for High Skills (except Investigation/Medicine) - wired directly into the XP Spend Panel\'s addSkillToCart, not this table', note: 'XP cost ×2 for High Skills except Investigation/Medicine (Obtuse)' }],
  'Cursed by the Honest Hand': [{ skills: ['ALL'], conditional: 'GM picks the affected skill on the disadvantage card - XP cost doubled for that skill only, wired directly into the XP Spend Panel\'s addSkillToCart, not this table', note: 'XP cost ×2 for chosen skill (Cursed by the Honest Hand)' }],
  'Infamous': [{ skills: ['ALL'], conditional: 'Reputation stat card relabeled "Infamy" instead of "Reputation" - same underlying number, wired in CharacterTab, not this table', note: 'Reputation displays as "Infamy" (Infamous)' }],
  'Dark Fate': [{ skills: ['ALL'], conditional: 'Once per session, reduces a lethal (Out-rank) wound to 1 Wound point instead - wired directly in EncounterTab\'s gmWound(), shared mechanism with Great Destiny (identical text)', note: 'Once/session: survive lethal wound at 1 Wound (Dark Fate)' }],
  'Curse of the Grey Crone': [{ skills: ['ALL'], conditional: 'GM picks the locked Trait on the disadvantage card - set to 1, +1 button hidden in XP Spend Panel, and Insight Rank XP thresholds reduced cumulatively (145/165/185/205, verified against the disadvantage\'s own stated examples) - wired directly in CharacterTab and lib/utils.js\'s insightRankFor(), not this table', note: 'Trait locked to 1 + reduced Insight XP thresholds (Curse of the Grey Crone)' }],
  'Unlucky': [{ skills: ['ALL'], conditional: 'GM-controlled pip tracker on the disadvantage card + a matching reroll button in DiceModal (mirrors Luck\'s mechanism exactly - fresh reroll, player picks kept dice from the new set). GM decides when to spend it, per Charles\'s direction', note: 'GM forces a reroll, N times/session per rank (Unlucky)' }],
  'Dishonored':        [{ skills: ['ALL'], conditional: 'Status Rank set to 1, applied immediately when added - wired in CharacterTab\'s add-disadvantage handler. The "may not gain Status while active" restriction is not enforced (would need to gate the Status-editing UI)', note: 'Status Rank set to 1 (Dishonored)' }],
  'Social Disadvantage': [{ skills: ['ALL'], conditional: 'Status Rank set to 0, applied immediately when added - wired in CharacterTab\'s add-disadvantage handler', note: 'Status Rank set to 0 (Social Disadvantage)' }],
  'Greedy':            [{ skills: ['Temptation'], conditional: 'opponent using Temptation against you in the Contested Roll tool automatically gets +1k1 - wired this session', note: 'Opponent +1k1 Temptation vs you (Greedy)' }],
  'Gullible':          [{ skills: ['Sincerity'], conditional: 'opponent using Sincerity against you in the Contested Roll tool automatically gets +1k1 - wired this session', note: 'Opponent +1k1 Sincerity vs you (Gullible)' }],
  'Lechery':           [{ skills: ['Temptation'], conditional: 'opponent using Temptation against you in the Contested Roll tool automatically gets +1k1 - wired this session', note: 'Opponent +1k1 Temptation vs you (Lechery)' }],
  'Failure of Sincerity': [{ skills: ['Sincerity'], conditional: 'opponent using Sincerity against you in the Contested Roll tool automatically gets +1k0 - wired this session', note: 'Opponent +1k0 Sincerity vs you (Failure of Sincerity)' }],
  'Phobia':            [{ skills: ['ALL'], flat: 5, conditional: 'per rank, only when confronted with the phobia subject', note: '+5 TN per rank when confronted with phobia subject (Phobia)' }],
  'Disbeliever':       [{ skills: ['SOCIAL'], flat: 5, conditional: 'with sahir, diviners, priests, or spiritually devoted individuals only', note: '+5 TN Social rolls with spiritually devoted individuals (Disbeliever)' }],
  'Low Pain Threshold': [{ skills: ['WOUNDPENALTY'], conditional: 'Wound TN penalties increased by +5 - already coded in wound system', note: 'Wound TN penalties +5 (Low Pain Threshold)' }],
  'Bad Health':        [{ skills: ['WOUNDPENALTY'], conditional: 'Earth Ring treated one rank lower for Wound Rank thresholds - already coded in wound system', note: 'Earth -1 for Wound Ranks (Bad Health)' }],

  // ── Second pass - previously mis-filed or missed on first review ──────────
  'Touch of the Void': [{ skills: ['ALL'], rolled: 1, kept: 0, voidOnly: true, conditional: 'must roll Willpower TN 30 or Dazed', note: '+2k1 total when spending Void - risk Dazed (Touch of the Void) - adds +1 rolled on top of base Void +1k1' }],
  'Disturbing Countenance': [{ skills: ['SOCIAL'], flat: 5, note: '+5 TN all Social Skill rolls (Disturbing Countenance)' }],
  'Defiler of the Dead': [{ skills: ['SOCIAL'], flat: 5, conditional: 'with other Senpet only', note: '+5 TN Social rolls with other Senpet (Defiler of the Dead) - Ghul Creation Free Raise not automated, apply manually' }],
  'Despicable':        [{ skills: ['SOCIAL'], rolled: -2, kept: 0, conditional: 'with other Yodotai only', note: '-2k0 Social rolls with other Yodotai (Despicable)' }],
  'Permanent Wound':   [{ skills: ['WOUNDPENALTY'], conditional: 'First Wound Rank always considered full - already coded in wound system', note: 'Wound Rank floor of 1 whenever wounded (Permanent Wound)' }],
  'Cursed by the Keeper of Years': [{ skills: ['WOUNDPENALTY'], conditional: 'Natural healing rate halved - already coded in healing system; Medicine TN +5 to treat not automated', note: 'Natural healing halved (Cursed by the Keeper of Years)' }],
  'Lame': [{ skills: ['WOUNDPENALTY'], conditional: 'Water Ring treated as 1 for Move Actions - already coded in movement system; +10 TN lower-limb Agility rolls not automated (too vague which rolls qualify)', note: 'Water Ring = 1 for movement (Lame)' }],
  'Blind': [
    { skills: ['Archery','Assassin Ranged Weapons','Throwing'], rolled: -3, kept: -3, note: '-3k3 ranged attacks (Blind)' },
    { skills: ['Swordsmanship','Knives','Spears','Brawling','Polearms','Staves','Heavy Weapons','Chain','Tahaddi'], rolled: -1, kept: -1, note: '-1k1 melee attacks (Blind)' },
    { skills: ['WOUNDPENALTY'], conditional: 'Water Ring -2 for Move Actions - already coded in movement system. Armor TN formula change (Reflexes+5 instead of 5+Reflexes×5) and the Simple Move TN 20 fall-prone check are NOT automated - Armor TN is computed inline in 8+ separate places across the codebase and touching all of them risks introducing an inconsistency; apply manually with the GM for now.', note: 'Armor TN = Reflexes+5; TN 20 Athletics/Agility or fall Prone on Simple Move (Blind) - apply manually' },
  ],
};

// ── Disadvantages with NO dice-roll hook by design (situational GM-triggered rolls,
// XP-cost/Integrity/social-standing effects, or narrative-only complications).
// Reviewed and confirmed manual - not an oversight. See ADVANTAGE_DISADVANTAGE_AUDIT.md.
const MANUAL_DISADVANTAGES = [
  'Ascetic','Brash','Can\'t Lie','Compulsion','Consumed','Contrary','Driven',
  'Failure of Compassion','Failure of Courage','Failure of Courtesy','Failure of Duty','Failure of Honor',
  'Fascination','Idealistic','Insensitive','Jealousy','Overconfident','Soft-Hearted','True Love',
  'Epilepsy','Weakness',
  'Bitter Betrothal','Black Sheep','Blackmailed','Bounty','Dark Secret','Debt','Dependent','Dishonored',
  'Forced Retirement','Mistrusted Foreigner','Hostage','Obligation',
  'Rumormonger','Social Disadvantage','Stolen Identity Stigma','Nemesis','Sworn Enemy',
  'Forlorn (State)','Forlorn (Religion)',
  'Bad Fortune','Marked by the Sands','Elemental Imbalance','Enlightened Madness','Haunted',
  "Lord Moon's Curse",'Lost Love','Momoku','Cursed by the All-Seeing Eye',
  'Cursed by the Wanderer','Sleeper Agent','Uncentered',
  'Wrath of the Desert','Wanderer',
];
MANUAL_DISADVANTAGES.forEach(name => { if (!(name in DISADVANTAGE_ROLL_BONUSES)) DISADVANTAGE_ROLL_BONUSES[name] = []; });

export function getAdvantageAutomationStatus(name) {
  if (!(name in ADVANTAGE_ROLL_BONUSES)) return 'missing';
  return ADVANTAGE_ROLL_BONUSES[name].length === 0 ? 'manual' : 'auto';
}
export function getDisadvantageAutomationStatus(name) {
  if (!(name in DISADVANTAGE_ROLL_BONUSES)) return 'missing';
  return DISADVANTAGE_ROLL_BONUSES[name].length === 0 ? 'manual' : 'auto';
}

// Automation status for a technique, used to show players whether a technique's effects apply
// automatically in the dice roller, or need to be handled manually with the GM:
//   'auto'    - has at least one real dice-modifying bonus entry, applies automatically when relevant
//   'manual'  - has an entry but it's deliberately empty (e.g. spell grants, reactive abilities with no
//               dice-roll hook) - by design, not an oversight. Full effect described in TECHNIQUE_DESCRIPTIONS.
//   'missing' - no entry exists yet at all - audit in progress, not yet reviewed
export function getTechniqueAutomationStatus(techName) {
  if (!(techName in TECHNIQUE_ROLL_BONUSES)) return 'missing';
  return TECHNIQUE_ROLL_BONUSES[techName].length === 0 ? 'manual' : 'auto';
}
