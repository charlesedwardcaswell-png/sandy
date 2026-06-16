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
  'City Guard': 'ti-shield',
  'Dahab': 'ti-coin',
  'Qabal': 'ti-wand',
  'Assassins': 'ti-eye-off',
  'Ashalan': 'ti-moon-stars',
  "Ra'Shari": 'ti-compass',
  'Senpet': 'ti-sun',
  'Yodotai': 'ti-sword',
  'Ebonites': 'ti-diamond',
  'Jackals': 'ti-skull',
  'Merchants': 'ti-building-store',
  'Rogues / Foreigners': 'ti-masks',
  'Monsters': 'ti-ghost',
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
  'City Guard','Dahab','Qabal','Assassins','Ashalan',"Ra'Shari",'Senpet','Yodotai','Ebonites','Jackals'
];

export const FACTION_SCHOOLS = {
  'City Guard':  ['Soldier of the City Guard'],
  'Dahab':       ['Dahabi Enforcer','Dahabi Bargainer','Dahabi Merchant'],
  'Qabal':       ['Qabal Agent','Qabal Summoner'],
  'Assassins':   ['Assassin Slayer','Assassin Keeper'],
  'Ashalan':     ['Blood-Sworn','Children of Midnight','Heart-Seekers'],
  "Ra'Shari":    ["Ra'Shari Knife-Fighter","Ra'Shari Trader","Ra'Shari Diviner"],
  'Senpet':      ['Senpet Legionnaire','Senpet Charioteer','Senpet Sahir'],
  'Yodotai':     ['Yodotai Legionnaire','Yodotai Mercenary'],
  'Ebonites':    ['Ebonite Templar'],
  'Jackals':     ['Jani','Necromancer','Kabir'],
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
