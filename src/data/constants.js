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

export const SCHOOL_DATA = {
  'Soldier of the City Guard': { faction:'City Guard', type:'Warrior', integrity:5.5, bonus_trait:'Reflexes', skills:['Athletics','Defense','Lore: Law','Investigation','Spears','Swordsmanship','Intimidation'], techniques:{1:'Trained For War',2:'Strike With Fury',3:'Armored Advance',4:"City's Shield",5:'Guardian of the Jewel'}, equipment:['Longsword','Shortsword','Composite Bow','Light Armor','Traveling Pack'], starting_copper:3 },
  'Dahabi Enforcer': { faction:'Dahab', type:'Warrior', integrity:2.5, bonus_trait:'Strength', skills:['Athletics','Defense','Lore: Law','Investigation','Spears','Swordsmanship','Intimidation'], techniques:{1:'Moonless Night',2:'Dangerous Maneuvers',3:'Simple Violence',4:"The Enforcer's Way",5:"House's Fist"}, equipment:['Longsword','Knife','Light Armor','Traveling Pack'], starting_copper:5 },
  'Dahabi Bargainer': { faction:'Dahab', type:'Sahir', integrity:1.5, bonus_trait:'Perception', skills:['Calligraphy','Commerce','Courtier','Divination','Medicine','Spellcraft','Sincerity'], techniques:{1:'Penetrating Words'}, equipment:['Knife','Fine Clothes','Traveling Pack'], starting_copper:20 },
  'Dahabi Merchant': { faction:'Dahab', type:'Diplomat', integrity:4.5, bonus_trait:'Awareness', skills:['Commerce','Courtier','Sincerity','Etiquette','Lore: Underworld','Temptation','Storytelling'], techniques:{1:'Master of the Subtle Flow',2:'Reading the Market',3:'Silver Tongue',4:'Master Negotiator',5:'Voice of Dahab'}, equipment:['Longsword','Knife','Fine Clothes','Traveling Pack'], starting_copper:5 },
  'Qabal Agent': { faction:'Qabal', type:'Diplomat', integrity:1.5, bonus_trait:'Perception', skills:['Sincerity','Etiquette','Forgery','Investigation','Sleight of Hand','Stealth','Commerce'], techniques:{1:'No One of Import',2:'The Shadow Network',3:'False Face',4:'Ghost in the Crowd',5:'Master of Masks'}, equipment:['Knife','Clothes','Cloak','Calligraphy Kit'], starting_copper:5 },
  'Qabal Summoner': { faction:'Qabal', type:'Sahir', integrity:2.5, bonus_trait:'Intelligence', skills:['Calligraphy','Divination','Spellcraft','Lore: Theology','Lore: History','Meditation','Etiquette'], techniques:{1:'The Crucible of Knowledge'}, equipment:['Staff','Knife','Clothes','Traveling Pack'], starting_copper:5 },
  'Assassin Slayer': { faction:'Assassins', type:'Ninja', integrity:1.5, bonus_trait:'Agility', skills:['Acting','Athletics','Sincerity','Stealth','Lore: Underworld','Knives','Sleight of Hand'], techniques:{1:'All Shadows Walk in the Light',2:'The Knife Between Moments',3:'Simple Action',4:'Death from Nowhere',5:"The Old Man's Gift"}, equipment:['Knife','Jambiya','Fine Robes','Traveling Pack'], starting_copper:10 },
  'Assassin Keeper': { faction:'Assassins', type:'Ninja', integrity:1.5, bonus_trait:'Reflexes', skills:['Athletics','Defense','Etiquette','Investigation','Swordsmanship','Lore: Burning Sands','Stealth'], techniques:{1:"The Keeper's Courage",2:"Sentinel's Eye",3:'Guard the Gate',4:"Keeper's Advance",5:'Final Guardian'}, equipment:['Longsword','Shortsword','Composite Bow','Light Armor','Robes'], starting_copper:3 },
  'Blood-Sworn': { faction:'Ashalan', type:'Warrior', integrity:5.5, bonus_trait:'Strength', skills:['Athletics','Battle','Defense','Swordsmanship','Polearms','Lore: Theology','Knives'], techniques:{1:'Blessed by the Crystal',2:'Crystal Strike',3:"Ashalan's Fury",4:'Ancient Warrior',5:'Oath Unbroken'}, equipment:['Scimitar','Khadja','Composite Bow','Light Armor','Robe'], starting_copper:5 },
  'Children of Midnight': { faction:'Ashalan', type:'Sahir', integrity:4.5, bonus_trait:'Awareness', skills:['Divination','Lore: History','Medicine','Meditation','Spellcraft','Lore: Theology','Lore: Stars'], techniques:{1:'Wisdom of the Stars'}, equipment:['Scimitar','Khadja','Robe','Traveling Pack'], starting_copper:5 },
  'Heart-Seekers': { faction:'Ashalan', type:'Warrior', integrity:5.5, bonus_trait:'Willpower', skills:['Battle','Defense','Investigation','Lore: Khadi','Spellcraft','Stealth','Swordsmanship'], techniques:{1:'Truth is My Ally',2:'Sense the Corruption',3:'Purifying Strike',4:'Hunter of Darkness',5:"Heart's Justice"}, equipment:['Scimitar','Khadja','Composite Bow','Light Armor','Robe'], starting_copper:3 },
  "Ra'Shari Knife-Fighter": { faction:"Ra'Shari", type:'Warrior', integrity:3.5, bonus_trait:'Agility', skills:['Temptation','Defense','Divination','Knives','Perform: Dancing','Tahaddi','Athletics'], techniques:{1:'The Endless Dance',2:'Blade and Step',3:'Three Knives',4:'Dance of Death',5:'The Final Curtain'}, equipment:['Knife','Knife','Staff','Clothes','Cloak'], starting_copper:5 },
  "Ra'Shari Trader": { faction:"Ra'Shari", type:'Diplomat', integrity:2.5, bonus_trait:'Intelligence', skills:['Temptation','Commerce','Courtier','Etiquette','Lore: Underworld','Sincerity','Storytelling'], techniques:{1:'Opening Offer',2:'Fair Exchange',3:'The Long Con',4:'Master Trader',5:'Voice of the Caravan'}, equipment:['Staff','Clothes','Cloak','Scales'], starting_copper:10 },
  "Ra'Shari Diviner": { faction:"Ra'Shari", type:'Sahir', integrity:3.5, bonus_trait:'Perception', skills:['Temptation','Divination','Medicine','Spellcraft','Lore: Theology','Perform: Dance','Lore: Burning Sands'], techniques:{1:'The Whispers of the Song'}, equipment:['Knife','Staff','Clothes','Cloak','Traveling Pack'], starting_copper:5 },
  'Senpet Legionnaire': { faction:'Senpet', type:'Warrior', integrity:4.5, bonus_trait:'Reflexes', skills:['Battle','Defense','Hunting','Swordsmanship','Lore: Theology','Athletics','Spears'], techniques:{1:'Divine Insight',2:"Legionnaire's March",3:'Ten Thousand Shields',4:"Avatar's Advance",5:'Will of the Gods'}, equipment:['Khopesh','Chain Shirt','Sandals','Tunic'], starting_copper:5 },
  'Senpet Charioteer': { faction:'Senpet', type:'Warrior', integrity:4.5, bonus_trait:'Agility', skills:['Archery','Battle','Horsemanship','Swordsmanship','Lore: Theology','Defense','Athletics'], techniques:{1:'Ride Into Battle',2:'Arrow of the Gods',3:'Mounted Strike',4:'Chariot Charge',5:'Thundering Hooves'}, equipment:['Khopesh','Composite Bow','Chain Shirt','Sandals'], starting_copper:5 },
  'Senpet Sahir': { faction:'Senpet', type:'Sahir', integrity:3.5, bonus_trait:'Intelligence', skills:['Defense','Medicine','Meditation','Spellcraft','Lore: Theology','Battle','Lore: History'], techniques:{1:'By the Grace of the Gods'}, equipment:['Sandals','Tunic','Traveling Pack'], starting_copper:5 },
  'Yodotai Legionnaire': { faction:'Yodotai', type:'Warrior', integrity:4.5, bonus_trait:'Agility', skills:['Battle','Defense','Horsemanship','Lore: Yodotai History','Spears','Swordsmanship','Athletics'], techniques:{1:'Tortoise Formation',2:'Gladius Thrust',3:'Legion Advance',4:'Iron Wall',5:"Empire's Fist"}, equipment:['Gladius','Pilum','Lorica Segmentata','Sandals','Tunic'], starting_copper:5 },
  'Yodotai Mercenary': { faction:'Yodotai', type:'Diplomat', integrity:3.5, bonus_trait:'Reflexes', skills:['Intimidation','Defense','Etiquette','Spears','Swordsmanship','Sincerity','Battle'], techniques:{1:'Importance of Speed',2:'Contract Terms',3:"Mercenary's Edge",4:'Price of Steel',5:"Victor's Spoils"}, equipment:['Gladius','Pilum','Chain Shirt','Sandals','Tunic'], starting_copper:5 },
  'Ebonite Templar': { faction:'Ebonites', type:'Warrior', integrity:5.5, bonus_trait:'Reflexes', skills:['Defense','Investigation','Lore: Law','Lore: Theology','Swordsmanship','Lore: Ebonites','Athletics'], techniques:{1:'Tapping the Inner Strength',2:"Stone's Resolve",3:"Templar's Advance",4:'Ebon Shield',5:"Order's Champion"}, equipment:['Longsword','Knife','Light Armor','Sturdy Clothing'], starting_copper:10 },
  'Jani': { faction:'Jackals', type:'Warrior', integrity:1.5, bonus_trait:'Agility', skills:['Athletics','Brawling','Knives','Acting','Lore: Jackal','Assassin Ranged Weapons','Lore: Underworld'], techniques:{1:'Quicker Than the Eye',2:'Sewer Speed',3:"Jackal's Bite",4:'Ghost of the Sewers',5:"Soul Slayer's Gift"}, equipment:['Knife','Light Armor','Street Clothes'], starting_copper:1 },
  'Necromancer': { faction:'Jackals', type:'Sahir', integrity:0.5, bonus_trait:'Intelligence', skills:['Lore: Anatomy','Knives','Lore: Jackal','Lore: Undead','Medicine','Craft: Poison','Staves'], techniques:{1:'Initiate of Undeath'}, equipment:['Knife','Staff','Robe','Sandals'], starting_copper:2 },
  'Kabir': { faction:'Jackals', type:'Diplomat', integrity:2.5, bonus_trait:'Awareness', skills:['Courtier','Sincerity','Knives','Medicine','Craft: Poison','Sleight of Hand','Lore: Underworld'], techniques:{1:'Rotting the Foundation',2:'Poison Smile',3:'The Long Corruption',4:'Master Poisoner',5:'Kingdom Ender'}, equipment:['Knife','Apothecary Kit','Clothes','Shoes'], starting_copper:2 },
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
  { name:'City Guard',        tagline:'The only legal armed force in the Jewel.',              rep:0 },
  { name:'Dahab',             tagline:'The merchant houses and their shadowy conspiracy.',       rep:0 },
  { name:'Qabal',             tagline:"Masters of summoning magic, keepers of Hakhim's Seal.", rep:0 },
  { name:'Assassins',         tagline:'The Order of the Mountain, blades for hire.',            rep:-1 },
  { name:'Ashalan',           tagline:'Ancient immortals who remember the Day of Wrath.',       rep:0 },
  { name:"Ra'Shari",          tagline:'Nomadic traders and diviners of the Great Caravan.',     rep:1 },
  { name:'Senpet',            tagline:'Priests and warriors of the Ten Thousand Gods.',         rep:0 },
  { name:'Yodotai',           tagline:'Legionnaires of the ever-expanding Empire.',             rep:0 },
  { name:'Ebonites',          tagline:'Templars of the Order of the Ebon Hand.',               rep:0 },
  { name:'Jackals',           tagline:'A criminal cult of necromancers and diplomats.',         rep:-2 },
  { name:'Merchants',         tagline:'Independent traders not affiliated with Dahab.',         rep:0 },
  { name:'Rogues / Foreigners', tagline:'Criminals, wanderers, visitors from distant lands.',  rep:0 },
  { name:'Monsters',          tagline:'Creatures of the desert, sewers, and darker places.',   rep:0 },
];

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
