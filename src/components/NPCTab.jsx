import React, { useState } from 'react';
import { FacIcon, Silhouette, Empty, ScrollLore } from './UI';
import PoisonReferenceModal from './PoisonReferenceModal';
import { SCHOOL_DATA, FACTIONS_DATA, NPC_BY_FACTION, FACTION_SCHOOLS, CREATURES_LIBRARY } from '../data/constants';
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
      {
        key: 'wrath', label: 'The Day of Wrath',
        text: `Before the Burning Sands were sand at all, this region was a land of lush forests, rolling hills of grain, and great inland seas — home to a thriving civilization of humans, Ashalan, Naga, Nezumi, and Jinn alike. The ancient city of Qaharaba stood at the northern end of what is now Medinaat al-Salaam, so protected by magic that no being within its walls could lift a finger in violence, making it the greatest trading city in the world.

Then the Jinn rebelled. A group of rebellious Jinn, led by their lord Kaleel, trapped the exhausted Lady Sun (Shilah) and put Lord Moon into an eternal slumber, believing they could contain the gods who had created them. The rebellious Jinn unleashed a reign of terror — and neither humans nor Ashalan could stop them.

Twelve Ashalan worked in secret. They discovered sandsmithing and forged the first crysteel — a substance capable of harming Jinn. They also discovered Hakhim's Seal, a mystical diagram that could contact Shilah directly. The Seal allowed Lady Sun to see what had been done to her. She lashed out with mystical fire that consumed all it touched. In a single day, the entire region was scoured down to rock and sand. Most of the rebellious Jinn perished. The surviving Ashalan moved underground, their tattoos forever changed — glowing blue, granting greater magic, but at the cost of weakness to sunlight forever after.

The surviving human tribes scattered. The Ra'Shari's golden city of Pahatan melted. The Naga had three-fourths of their race destroyed. The world that had existed simply ceased to be. This event is called the Day of Wrath.`
      },
      {
        key: 'wandering', label: 'The Time of Wandering',
        text: `Following the Day of Wrath, the surviving peoples of the Burning Sands were afraid, and many left their ancestral homes to find a place farther from the eyes of Shilah. For a time, the Burning Sands truly was a forsaken wasteland.

But as is the nature of mortals, the children failed to value the counsel of their elders, and began to trickle back across the infinite sands. When no second Day of Wrath came to punish the interlopers, more people began to cross the sands, seeking new beginnings or the treasures of the lost age. The nomads who would one day be the Senpet returned from their diaspora to the west, bringing with them their Ten Thousand Gods. The people of the Ivory Kingdoms emerged from the southernmost remnant of the great forests, wondering if others still toiled under the merciless sun.

From these first explorers the Jewel of the Desert arose in a fertile crook of the Nahr'umar River — one of the longest rivers in the world, running over four thousand miles from mountain spring to sea. The area seemed a perfect place to build a city. Evidence of the ancient city of Qaharaba still stood not far from one of the plains. While the first few centuries saw only slow growth for the new city, a significant change came: the Prophet.`
      },
      {
        key: 'prophet', label: 'The Line of the Prophet',
        text: `The man who claimed to be a mouthpiece for the gods drew little attention when he first arrived in the community that would soon be the Jewel. Soon, however, the citizens began to take notice of the small man who walked with an entourage of fire-eyed believers, hanging on his every word. He was called Mekhem, and he was known as the Little Prophet. He accepted pupils of all stripes and creeds without exception. His wisdom was eventually compiled into a text called The Forty-Seven Sayings of Mekhem — the most widely read book in the Burning Sands.

Before he departed, Mekhem left the people of the Jewel with a new method of governance: the Caliphate, ruled by the Caliph (Arbiter of All Disputes), and the Sultanate, ruled by the Sultan (Maker of All Laws).

Centuries later, his descendant Duqaq appeared — cut from the same cloth, aiding in preventing disaster during the Awakening, founding a School of Astronomy that bears his name. Scholars who know both the history of Rokugan and the Burning Sands recognize something remarkable: Mekhem appears to be the same individual Rokugan calls Shinsei, the Little Teacher. And Duqaq appears to be the Hooded Ronin. The implication — that this prophetic line has been guiding both civilizations simultaneously — is deeply unsettling. The line is believed to have ended with Duqaq's son Rosoku, who was killed by an assassin. Rumors persist of his infant son being taken into seclusion.`
      },
      {
        key: 'hanan', label: 'The Immortal Caliph',
        text: `The modern history of Medinaat al-Salaam begins with Hanan Talibah — a former slave girl who acquired the Senpet Book of the Dead and used its knowledge to perform the Ceremony of the Hidden Heart, removing her own heart from her chest to achieve immortality. She became a sahir of immense power and was elected Caliph by popular acclaim.

Once in office, however, Hanan revealed her true nature. She replaced the Qadi with undead lackeys — creatures called Khadi — and burned every library in the city, ensuring no one could ever accumulate enough knowledge to challenge her. Her rule became a reign of terror that lasted two centuries.

The Khadi are heartless sorcerers created by black magic. They cannot be killed by ordinary means — only destroying their hidden heart can end them. Most Khadi kept their hearts in ivory boxes. They healed from any wound, even total obliteration, so long as their hearts survived. During Hanan's reign, the Qabal launched the first full civil revolt in the Jewel's history. It was crushed in less than a month. Hanan then had all libraries burned and the practice of magic outside the Khadi declared illegal.

The Khadi still exist today, hidden in the sewers beneath the city, squabbling over leadership. They no longer control the government, but they have not been destroyed. Most have recovered their own hearts and guard them closely.`
      },
      {
        key: 'awakening', label: 'The Awakening',
        text: `Forty years ago, the reign of the tyrant Hanan came to a close with the cataclysmic events known as the Awakening — also called "the Shattering of the Jewel."

The Jewel attracted the attention of many empires: the waning Senpet Empire, slowly dying of thirst, allied with Hanan and flooded money and people into the city. With the Senpet came Scorpion Clan exiles from the Emerald Empire, enslaved during their banishment. The Yodotai also arrived, launching an unprecedented assault on the city itself.

The Immortal Caliph was finally slain at the hands of a young Senpet sahir named Keseth, who discovered the hidden box containing her heart and destroyed it. At almost the same moment, an army of Moto, Ra'Shari, and Yodotai — the Erba'a Alliance — attacked the city walls. A bolt of fire from the heavens, quite possibly from Shilah herself, shattered the Erba'a army at the critical moment.

But the fall of Hanan triggered a greater catastrophe: the shattering of an ancient object called the Ebon Stone released powerful Jinn, led by the ancient Jinn Lord Kaleel himself — returned and intent on the destruction of the world. The Twenty-Seven Days of Darkness fell on both the Emerald Empire and the Burning Sands.

Only the Celestial Alliance — sahir, Ashalan, Ra'Shari mystics, and loyal Jinn — could oppose them. The Ashalan made the ultimate sacrifice, ascending bodily into the Heavens to fight the entity known as the Khayel (the Lying Darkness) directly. The Alliance prevailed, but the cost was staggering. The Scorpion Clan, freed from their shackles, returned to Rokugan.`
      },
      {
        key: 'city', label: 'Medinaat al-Salaam Today',
        text: `Medinaat al-Salaam — Kala Jahir, the Jewel of the Desert, the City of a Thousand Stories — sits in the bend of the Nahr'umar River, one of only two settlements of any size in the Burning Sands with greater than a million inhabitants. It is the crossroads of trade between Rokugan, the Senpet Empire, the Yodotai, and the Ivory Kingdoms.

The city is governed by two linked offices: the Sultan (who decrees the laws) and the Caliph (who administers them). The current Caliph is Puja, son of the former Caliph Adira al-Rassouli of the Assassins' Order — who herself succeeded Hanan thirty years ago and ruled for twenty-one years. A third, secret branch of the Caliphate has no official name; when the Caliph discusses them, they are called "my mountain friends." In truth, they are descended from the Assassins, serving as the Caliph's silent expeditors.

The city's districts: the Palace (north-center), the Merchant House estates (west), the Yodotai Garrison (south of estates), the Thoroughfare (bazaars, west of river), the River Quarter (east), the East and West Merchant Quarters (flanking the river), the Residential Quarter (north of merchants), the Maze (forsaken, criminal, northeast of Palace), the Last Stop (truly deserted, widely believed cursed), and at the northernmost tip just outside the walls — the ruins of Qaharaba, the pre-Wrath city.

The population: 67% Pre-Prophetic Tribes (original settlers), 19% Senpet, 7% Ivory Kingdoms, 5% Ra'Shari and Moto, 4% Others (including a small number of Scorpion Clan descendants and a very few hidden Ashalan).`
      },
    ],
  },
  {
    key: 'factions', label: 'Factions of the Jewel',
    entries: [
      {
        key: 'caliphate', label: 'The Caliphate & City Guard',
        text: `The city is governed by two linked offices: the Sultan (Maker of All Laws) and the Caliph (Arbiter of All Disputes). The current Caliph is Puja al-Rahbi, son of Adira — and the current Sultan is benevolent but mysterious, his reign drawing to a close with no clear heir.

The Qadi are the judges of the Caliphate, historically feared during Hanan's reign when they were her undead Khadi enforcers. Today, under Adira and Puja, the Qadi have been reorganized — drawn from common people, volunteer rather than drafted, and genuinely committed to justice. Many are former members of the Order of the Mountain.

The City Guard is the only legal armed force in Medinaat al-Salaam — a volunteer organization that serves as both police and standing army. All it takes to join is two days per week of service, so many factions (Dahabi, Ebonites) enroll their fighters in the Guard simply to be allowed to carry weapons legally. Standard issue: longsword (3k2), shortsword (2k2), composite bow (Str 2, range 200'), light armor (+5 TN).

The Councils under the Sultan: the Council for Trade (puppet of the Houses of Dahab), the Council for Grain (landowners, given to exaggerating hardship), and the Council for Shelter (overworked from Awakening reconstruction, barely functional).`
      },
      {
        key: 'dahab', label: 'Houses of Dahab & the Qolat',
        text: `There is no life in the city of Medinaat al-Salaam that is not touched in some way by the power of the Merchant Houses of Dahab. Virtually all commerce of note in the Jewel is overseen by one House or another. Both the Caliph and Sultan must consider what the Dahabi will think before they act.

The eight Houses: Asmari (foreign trade approval, +1 Strength), Basiri (luxury goods, +1 Intelligence), Enour (mining, +1 Willpower, struggling), Haffit (controls the Nahr'umar river water supply — earning Haffit's wrath may mean dying of thirst, +1 Agility), Hazaad (magic and sahir businesses, +1 Awareness), Mendadi (blacksmiths and weapons, +1 Reflexes), Menjari (banks and moneylenders, the oldest and richest, +1 Perception), Rashid (construction, bilks the rich rather than the poor, +1 Stamina).

Beneath the Houses lurks the Qolat — the most powerful secret society in the Burning Sands (called the Kolat in the Emerald Empire). The Qolat's goal: eliminate the influence of the gods over mortal affairs entirely. They would see every temple cast down. Founded by survivors of the Day of Wrath who concluded the gods were capricious and could not be trusted, led originally by the man Qolat, the woman Tala, and a nameless Jinn called the Jinn Retainer (who discovered how to permanently destroy Jinn, and was stripped of his name by other Jinn as punishment).

The five Qolat sects in Medinaat al-Salaam: Tiger (defense and enforcement, led by Haroun al-Daqiq), Owl (intelligence gathering, most numerous), Roc (logistics and foreign operations, led by Ruqayah al-Hazaad), Auroch (funding, led by Eda Ishan), Snake (magic wielded against the gods, smallest). The three Qolat Masters currently in a bitter power struggle.`
      },
      {
        key: 'qabal', label: 'The Qabal',
        text: `The Qabal is the organization of sahir (magic-users) in Medinaat al-Salaam. They maintain and guard Hakhim's Seal — the mystical diagram used to summon and bind Jinn, and the foundation of all magic in the Burning Sands.

The Qabal's origins trace back to Hakhim, the first human sahir, who received knowledge of the Seal from the Ashalan after the Day of Wrath. Hakhim's first serious apprentice Harik is considered the true founder of the Qabal tradition. The name "Qabal" was coined by Harik's successor Qadir, meaning "the brotherhood of all magicians."

For three centuries under Hanan's rule, the Qabal were forced underground — hiding as servants, soldiers, belly dancers, shopkeepers, fighting a quiet war against the Caliph's power one grain of sand at a time. When the Awakening came, their sahir Tabari discovered how to destroy Jinn permanently — the discovery that allowed the Celestial Alliance to win.

Today, under leader Amru al-Zaqra (adopted daughter of Hekau, the Qabal's leader during the Awakening), the Qabal enjoy a golden age. The Qabal Stronghold is open to all who wish to learn. A generational divide is growing: older sahir remember persecution and hoard knowledge; younger ones take their freedoms for granted and want everything made public.

The Qabal is internally factionalized: the Traditionalists (senior magi, believe knowledge is a privilege) vs. the Progressivists (younger generation, want everything open). The Qabal also trains mundane Agents — spies disguised as servants and groundskeepers who protected the organization during Hanan's reign.`
      },
      {
        key: 'assassins', label: 'Order of the Mountain (Assassins)',
        text: `For over three centuries, the Order of the Mountain — the Assassins — was one of the most feared organizations in the Burning Sands. Their founder Hassan al-Alamut, "the Old Man of the Mountain" or "the Swift Dagger of Night," waged a covert war of revenge against the Immortal Caliph for generations.

The Old Man's primary weapon was not poison or blade — it was fear and beauty. His instrument was his daughters: the Daughters of the Mountain, fanatically loyal assassins trained to be unshakably devoted, deceptively seductive, and lethally precise. The Order funded itself through mercenary assassination contracts, but its true purpose was the destabilization of Hanan's illegitimate power.

The Assassins favor knives — "why use a long blade when a short blade is enough to pierce the heart?" They prefer to strike at the most audacious moments: in crowded bazaars, in holy temples, in a target's own bed. The goal is never just elimination, but demonstration: we have power over life and death.

Since the Awakening, the Order's situation is complicated. The Old Man was found dead — Fatima's blade in his back. Fatima, the designated heir, had been betrayed by her own sisters. The sect was left without leadership. The resolution was unexpected: Adira al-Rassouli, an adopted daughter of the Assassins' line, ascended to the position of Caliph. She brought fellow Assassins into her government. Now the organization that spent centuries trying to bring down the Caliphate essentially is the Caliphate.

A low-level civil war continues within the sect. Those who support the new order of things, and those who believe the Assassins should return to independence. A faction called the Qadaam (aligned with the Qolat's Tiger Sect master Haroun al-Daqiq, who claims to be the new Old Man of the Mountain) is in bitter conflict with traditionalist Assassins.`
      },
      {
        key: 'ebonites', label: 'Order of the Ebon Hand (Ebonites)',
        text: `The Ebonites — formally the Order of the Ebon Hand — draw from many nations and cultures, bound by a single shared purpose: protecting the shards of the Ebon Stone.

The order's origins are ancient and obscure. Warriors from distant, unnamed countries traveled to the Ivory Kingdoms and there inadvertently released a terrible evil into the world. The prophet Mekhem appeared and helped them imprison the entity within a large stone, which turned black from its influence. He charged them to protect it forever.

The Test of the Stone: placing one's hand upon the Ebon Stone. Those strong enough to resist its sinister temptations find that their palm has turned black, marking them as Ebonites. Those who fail must take their own lives rather than risk betraying the order's secrets — though early on, some failed applicants who escaped became the Jackals.

The Ebonites are led by elders called Principles — each one has undergone a ritual giving them a fraction of the Ebon Stone's power at the cost of a portion of their personal identity. Each Principle takes a new name reflecting an abstract concept (Will, Truth, Resolve, etc.).

Since the Awakening (during which the Ebon Stone was shattered) the Ebonites have entered the Caliph's service as the closest thing the city has to professional law enforcement and justice. The common people trust them genuinely. Both the Cult of Ruhmal and the Jackals — their two primary enemies — have been largely crushed.`
      },
      {
        key: 'jackals', label: 'The Jackals',
        text: `Until the Awakening, the Jackals were the terror of Medinaat al-Salaam. Formed entirely from failed applicants to the Ebonite order who survived rather than taking their lives, they called the city's sewers home and emerged to strike at the world above.

The Jackals did not see themselves as criminals. True believers held that they alone understood the true nature of the Ebon Stone — that a terrible god resided within it, and that the Awakening prophesied in the stone's presence would be catastrophic. They believed preventing the Awakening was a righteous cause justifying any act of sabotage, theft, bribery, or murder.

What the Jackals did not understand: they had been co-opted by the Lying Darkness (the Khayel, a shadow entity). Their mythology had been formed from corrupted contact with the Stone, and those who failed the Test were precisely those who could not resist the entity's seduction.

Their most powerful weapon was the Soul of the Slayer — an artifact capable of ripping the life force from a living person, transforming the victim into a Ghul. They developed a dark priesthood of Necromancers who wielded it with precision, storing captured souls in Soul Jars.

Since the Awakening, the Jackals have been crushed. Their best leaders are dead. Most people in the city no longer fear the name. A remnant still operates under the legendary Monkey Man. They have also been reaching out to the Spider Clan (of the Emerald Empire) and to Daigotsu, offering intelligence in exchange for support as they attempt to rebuild.`
      },
    ],
  },
  {
    key: 'peoples', label: 'Ancient Peoples',
    entries: [
      {
        key: 'ashalan', label: 'The Ashalan',
        text: `The Ashalan are an ancient, immortal race — the first children of the great Jinn spawned by Sun and Moon, created as a gift and curiosity. The Jinn who made them quickly realized their mistake in creating another immortal race, and made humans shortly after — mortal, but capable of greater heights of achievement than any other species.

The Ashalan are recognizable by the elaborate tattoos covering their bodies. These tattoos were originally simple family-lineage markings. On the Day of Wrath, they were infused with Shilah's fire — granting powerful magic, but cursing them with weakness to sunlight. They can die from prolonged exposure to bright sun. They live primarily underground or at night, in the City of the Seventh Star beneath Medinaat al-Salaam.

The Ashalan share twelve souls among their entire race. Those who possess one of the twelve souls are called "ensouled" and lead through the Council of Twelve. Only ensouled Ashalan can reproduce — so rare that only three Ashalan have been born in the last thousand years. They also grow their numbers through a mystical tattooing process that enthralls another being completely while granting them all Ashalan traits.

After the Awakening, most Ashalan ascended bodily into the Heavens to fight the Khayel. Only three members of the original Council of Twelve are believed to still exist. Many Ashalan have since scattered beyond the Burning Sands — to the Emerald Empire, the Ivory Kingdoms, the Yodotai heartland, and elsewhere.

Mechanically: Ashalan cannot spend Void Points. This is a core feature of their immortal nature and the price of their magical power.`
      },
      {
        key: 'rashari', label: "The Ra'Shari",
        text: `The Ra'Shari are the nomads of the Burning Sands — a people of wandering caravans, carnival entertainers, traders, diviners, and keepers of deep secrets. They are widely distrusted, often cheated, sometimes beloved, and rarely understood.

Before the Day of Wrath, the Ra'Shari were the priests and guardians of Pahatan, the Golden City, a temple-city in the southern jungles dedicated to the god Vishnu-the-Provider. When the Sun's wrath came, Pahatan melted. The survivors fled. The Ashalan found them in their grief and performed an immense and ancient spell — taking the entire accumulated knowledge of the pre-Wrath world from the burned libraries and pouring it into the surviving Ra'Shari. The Ra'Shari became living libraries. They carry within them knowledge that no longer exists anywhere else.

This is their great secret and their great burden. They must keep moving, never staying in one place too long, so that no enemy can find them and extract or destroy what they carry. They tell stories every night to keep the knowledge alive in active memory.

The four Caravans: the Great Caravan of Mysticism (sahir and diviners — the Cokaloi magic-users), the Great Caravan of Entertainment (performers, storytellers, cultural ambassadors), the Great Caravan of Commerce (traders and merchants, the face most see), and the Great Caravan of Memory (the keepers of deep lore — considered the least glamorous but most sacred).

Common perception: "Never trust a Ra'Shari." Also: "But if you need something exotic, twice as fast, the Ra'Shari caravan is where you start." Their diviners are considered the best in the Burning Sands. They also provide healing, blessings, and curse-removals.`
      },
    ],
  },
  {
    key: 'foreign', label: 'Foreign Powers',
    entries: [
      {
        key: 'senpet', label: 'The Senpet',
        text: `The Senpet Empire — also "the Empire of the Scarab" — is an ancient civilization located on the western edge of the Burning Sands. Half their territory is desert; the rest is arable land sustained by two large rivers and occasional rainfall.

The Senpet worship the Ten Thousand Gods, who they believe control all aspects of the world. Their culture involves elaborate ritual and ceremony, including human sacrifice and ritualistic necromancy. Most notably, the Senpet sahir originated the technique of removing one's own heart from one's chest to achieve immortality — the same technique Hanan used to become the Immortal Caliph, and which creates the Khadi.

The Senpet are highly militaristic. Their signature weapon is the war chariot. For centuries the largest military force in the region, they were nevertheless peaceful neighbors — until a severe drought forced Pharaoh Hensatti to ally with Hanan and invest heavily in Medinaat al-Salaam. With the Senpet came enslaved Scorpion Clan samurai from the Emerald Empire.

The Yodotai then invaded, exploiting internal betrayals. After two decades of war, the Senpet were conquered. Hensatti's ally the Immortal Caliph then died in the Awakening. A resistance exists, led by a figure named Keseth — the same young sahir who discovered and destroyed Hanan's hidden heart. The Senpet compose 19% of Medinaat al-Salaam's population, usually living in their own neighborhoods marked by the scarab symbol.`
      },
      {
        key: 'yodotai', label: 'The Yodotai',
        text: `The Yodotai are the most expansive conquering empire in the known world. They have crushed every nation that stood before them. They currently control the Senpet Empire and maintain an embassy and garrison in Medinaat al-Salaam — the largest embassy in the city, south of the Merchant House estates.

The Yodotai origin is divine in their own telling: they descended from the Hanif, primitive villagers who received a visitation from the spirit of Conquest — a god cast down from heaven — who told them to build an empire that would span the entire continent. Their first warlord Octavius led the first Great Crusade and never looked back.

Yodotai society is organized entirely around military service and merit. Anyone, regardless of birth, can rise to positions of great power through demonstrated skill and loyalty. This makes them flexible, adaptive, and terrifyingly effective. Their legions use combined arms tactics, strict discipline, and an almost fanatical belief that conquest is a religious duty.

They previously launched a direct assault on Medinaat al-Salaam and were repelled — one of the very few times they have failed. They have not forgotten. They observe constantly from their embassy, waiting.

Yodotai mythology: the earth goddess Gaia and sky god Caelus created ten children who were eventually cast down from heaven by Caelus after rebellion. These fallen divine children became the ancestors of various peoples. The Yodotai's god of war, Conquest, is one such cast-down son.`
      },
      {
        key: 'rokugan', label: 'Rokugan',
        text: `Rokugan — the Emerald Empire — lies far to the east, beyond the Ivory Kingdoms and the great forests. It is a feudal empire of samurai clans, ruled by an Emperor believed to be descended from the sun goddess Amaterasu. Its culture is ancient, formal, and deeply hierarchical.\n\nRokugan's relationship to the Burning Sands is distant but real. Scorpion Clan samurai were enslaved and brought to Medinaat al-Salaam during the reign of the Immortal Caliph — their descendants still live in the city's older neighborhoods. After the Awakening, the freed Scorpion returned east. The Spider Clan, exiled from Rokugan, has made quiet contact with remnant Jackal factions. The Twenty-Seven Days of Darkness was felt in the Emerald Empire as well as the Burning Sands.\n\nThe prophetic line of Mekhem and Duqaq has a peculiar resonance with Rokugani history. Scholars believe Mekhem to be the same individual Rokugan calls Shinsei, the Little Teacher — a wandering prophet of immense spiritual power. Duqaq is believed to be the figure Rokugan calls the Hooded Ronin. The implication — that a single prophetic line has guided both civilizations across centuries — is deeply unsettling to those who know both histories.\n\nRokugan uses koku as currency (rice-based). The rough conversion is 1 koku ≈ 1 copper, though regional variation is considerable. Rokugani characters operating in the Burning Sands treat their Honor as Integrity at half value (rounded down, minimum 1.0).\n\nThe Great Clans of Rokugan rarely venture into the Burning Sands. Those who do are usually Unicorn Clan (whose ancestral wanderings took them through the region centuries ago), Scorpion Clan operatives, or exiles. In Medinaat al-Salaam they are curiosities — foreign warriors whose code of Honor is admired by some and mocked by others.`
      },
    ],
  },
  {
    key: 'magic', label: 'Magic & The Supernatural',
    entries: [
      {
        key: 'sahirmagic', label: 'Sahir Magic — The Five Disciplines',
        text: `A sahir is a magic-user. The sahir tradition is based on working with Hakhim's Seal — a map of all known magic, given to the human Hakhim by the Ashalan after the Day of Wrath.

The Seal is not merely a collection of symbols. It is a function of the universe, which is why it can be worked with internal visualization and hand motions. This is why spellcasting in the Burning Sands appears to include an incantation and a waving of hands — the sahir is reciting the symbols necessary for the spell and changing their position in his mind, as though working with a puzzle only he can see.

The Five Disciplines:

1. Summoning (Air) — Jinn spells (calling and binding Jinn), Primal Elements (moving earth/air/fire/water), Implements (manipulating physical objects).

2. Celestials (Void) — Farsight (telescopic vision, remote viewing), Astrology (foretelling the next 24 hours for individuals or organizations), Divination.

3. Black Magic (Earth) — Ghul Creation (animating and controlling undead), Life magic (healing, curing disease), Death magic (inflicting wounds and disease directly).

4. Control (Water) — Influence (altering thoughts and perceptions), Illusions (creating sensory illusions, Dream Magic), Transformation (borrowing animal body parts, becoming animals, emulating any creature including Jinn).

5. Blessings & Curses (Fire) — Blessings (+2k0 or +2k1 bonuses to chosen skills), Curses (penalties to chosen skills), Fortune Magic.

There is no spell slot system — sahir can cast indefinitely, though powerful magic requires significant preparation, skill, and sometimes costly components. Each discipline has three spell types, each type has three mastery levels.`
      },
      {
        key: 'cokaloi', label: "Cokaloi (Ra'Shari Divination)",
        text: `The Cokaloi is the unique magic of the Ra'Shari Diviner school. Unlike standard Qabal divination, the Cokaloi draws on three different aspects of time and vision. It cannot be taught — only Ra'Shari Diviners possess it, and it derives from carrying the pre-Wrath knowledge of the world within their people's collective memory.

Cokaloi of Dawn — Magic of beginnings, hope, and what is coming. Blessings and foresight, casting light on potential futures. The most optimistic and openly used school.

Cokaloi of Dusk — Magic of endings, transitions, and what has passed. Illusion and misdirection. A melancholy but powerful practice that sees what others choose not to see.

Cokaloi of Night — Magic of hidden things, secrets, and what lies beneath the surface. Healing and spirit-binding. Considered the most dangerous and powerful form — Ra'Shari Diviners who specialize in Night magic are treated with cautious respect even by Qabal Summoners.

The Ra'Shari diviners' reputation for accuracy far exceeds that of Qabal-trained astrologers. They attribute this to carrying the entire knowledge of the pre-Wrath world within their bloodline — they can sometimes recognize the shape of events because they've seen similar patterns before, even if they don't consciously know where the knowledge comes from.`
      },
      {
        key: 'jinn', label: 'The Jinn',
        text: `The Jinn claim to be the first children of Shilah (Lady Sun) and Kaleel (Lord Moon). Their immense power — near-invincibility and divine strength — suggests the claim may be true. Before the Day of Wrath, Jinn were a constant presence in the mortal world, the link between the divine and the mortal.

The Day of Wrath destroyed most of them. Survivors hid in another layer of reality (most Jinn) or inside mortal flesh (the Qanon — Jinn who chose to inhabit human hosts). Most Jinn currently cannot enter the physical world by conventional means and must wait to be summoned.

Summoning requires the Advantage "Servant of the Smokeless Fire" and use of Hakhim's Seal. The ritual typically takes six hours. A summoned Jinn is contained within the Seal's boundary for one hour — after which it is free. Jinn are not obligated to obey the sahir who summons them. But a thousand years of summoning has created an informal culture of negotiation and deal-making. Jinn honor their bargains — integrity is their most valued trait.

What Jinn most commonly want: water (there is none where they exist), or other mortal experiences unavailable to them. Some will barter their services for a beautifully rendered song.

Types of Jinn: Minor (Insight Ranks 1-2), Medium (Ranks 3-4), Major (Rank 5). Types: Mighty, Sly, Hardy, Mystical, Labor — each with different table rolls for traits, protections, abilities, and combat bonuses.

Jinn populations: 999 free Jinn, 1,001 Qanonic Jinn (in mortal flesh), 312 remaining members of Kaleel's Legion, and an unknown number of Quest Jinn.

The Qanon: during the original Jinn rebellion, the Ashalan hid some Jinn inside mortal flesh to protect them from Shilah's wrath. In only three generations these hidden Jinn forgot their nature entirely. During the Awakening, when Kaleel returned, the Ashalan ended the spell — and dozens of Qabal sahir all over the Jewel doubled over in crippling pain as the smokeless fire beneath their flesh burned through their skin.`
      },
      {
        key: 'seal', label: "Hakhim's Seal",
        text: `Hakhim's Seal is a mystical diagram — a series of sigils and circles over three feet in diameter, a map of all known magic — that was shared with the human sahir Hakhim by the Ashalan after the Day of Wrath.

It serves two primary purposes. First: it functions as a portal directly to Shilah. Minor changes to the Seal allow this function — these changes are a specific combination in a sea of variables, unlikely to be stumbled upon by an experimenting sahir. This is the function the Ashalan originally intended, used to trigger the Day of Wrath that destroyed the Jinn rebellion.

Second and most commonly: it serves as a framework with which sahir can wield magic. Sorcerers beginning their education are taught the basic form of the Seal, and how invoking different iterations of it can bring about magical effects. Manipulating the Seal is not easy, but it is possible if a student knows what to change. Most sahir eventually learn to inscribe the Seal in their mind rather than on the ground — working it with internal visualization and hand motions.

The Seal is maintained and regulated by the Qabal. Using it carelessly is dangerous — a jinn summoned outside a properly drawn Seal has no constraint. And the specific configuration that contacts Shilah directly is precisely the kind of discovery that could end the world a second time.`
      },
      {
        key: 'crysteel', label: 'Crysteel & Crystal',
        text: `Crysteel is a metal alloy discovered by the Ashalan sandsmith tradition — one of the very few materials capable of harming Jinn, which are otherwise nearly invulnerable to mortal weapons. The discovery of crysteel gave the Ashalan and their allies their first real weapon against Kaleel's rebellion, and its use contributed directly to the conditions that led to the Day of Wrath.

Crysteel weapons are rare and expensive. The knowledge of sandsmithing is closely held by the Ashalan. Only Ashalan schools — Blood-Sworn and Heart-Seekers — regularly carry crysteel.

Ishanti Crystal is a different material — used in Ashalan government and ceremony. A crystal that fell from the sky in Ashalan prehistory, it provided a key turning point in the early development of their civilization. The Ceremony of Souls, which allows the Council of Twelve to share their souls among the Ashalan people, requires Ishanti Crystal.

For players: crysteel weapons deal damage to spiritual beings, including Jinn and Ghuls, that would otherwise be immune to physical weapons. Encountering a weapon made of crysteel in the hands of an Ashalan is a strong signal of how seriously they are treating a threat.`
      },
    ],
  },
  {
    key: 'concepts', label: 'Key Concepts',
    entries: [
      {
        key: 'integrity', label: 'Integrity (not Honor)',
        text: `Integrity in the Burning Sands is about personal truth — whether you do what you say, whether your word can be trusted, whether you hold to your agreements even when it costs you. It matters across all classes and cultures. Even Jinn value it supremely — "integrity is the one imperishable commodity in their culture."

Note: Values in 4th Edition are doubled from the original LBS book. When a Rokugani character operates in the Burning Sands (or vice versa), treat their foreign equivalent at half value, rounded down to a minimum of 1.0.`
      },
      {
        key: 'tahaddi', label: 'Tahaddi Dueling',
        text: `The Tahaddi is the formal single combat tradition of the Burning Sands, recognized across the cultures of Medinaat al-Salaam. It is fought with a knife in each hand.

The three formal phases:
1. Assessment (Void/Tahaddi roll) — Reading your opponent; the foundation of the duel.
2. Focus (secret raises + void commitment) — Committing your approach; both parties secretly declare their focus.
3. Strike (Reflexes/Tahaddi roll) — The resolution.

Critical rule: Raises in Tahaddi do NOT add dice to the roll. Instead, they modify the Target Number and the damage outcome. A duel won with many raises can be lethal even to a skilled defender.

The Tahaddi is used both as actual deadly combat and as a formal dispute resolution mechanism. In the latter case, both parties agree beforehand to accept the outcome. Ra'Shari Knife-Fighters are specifically trained for Tahaddi and receive school techniques for it.`
      },
      {
        key: 'khadi', label: 'The Khadi (Heartless Sorcerers)',
        text: `The Khadi are the undead sorcerers created by the Ceremony of the Hidden Heart — the black magic which Hanan Talibah developed from the Senpet Book of the Dead. A sahir who undergoes the ritual has their heart removed from their chest, transplanted briefly into a live host body, then removed again. The ritual space must be inscribed with Hakhim's Seal in the correct configuration.

A completed Khadi:
— Is virtually immortal, healing 1 Wound per minute even from total obliteration
— Slowly comes back together even if crushed, shredded, or burnt to ash
— Can only be permanently destroyed by crushing or stabbing their heart
— Most keep their hearts in ivory boxes from the Ivory Kingdoms
— The host body used in the ritual becomes a Ghul within an hour
— A Khadi whose heart is controlled by another must heed that person's will

Today, the Khadi lurk in the sewers beneath Medinaat al-Salaam, squabbling over leadership. They no longer walk the streets as the Caliph's enforcers, but they have not been destroyed and they have not been captured. Most have recovered their own hearts and guard them jealously. They are a sleeping danger.`
      },
      {
        key: 'ghul', label: 'Ghuls',
        text: `Ghuls are the undead creatures that haunt the sewers and darker corners of Medinaat al-Salaam. They are created through several means:

— The Ceremony of the Hidden Heart (the host body used in Khadi creation becomes a Ghul within an hour)
— The Soul of the Slayer artifact (wielded by the Jackals — rips life force directly from a living person)
— Sahir magic: Black Magic discipline, Ghul Creation spells (Mastery Levels 1-3 — control an existing Ghul, create a Ghul, or destroy one)

Ghuls are shambling, hungry, and driven by instinct. However, a Khadi who has spent considerable time in undeath can develop into a more powerful Ghul Lord — retaining intelligence from life and the ability to use Skills and even cast spells. Ghul Lords sometimes struggle for dominance over lesser Ghuls.

Crysteel weapons are effective against Ghuls. Fire also works. Standard mortal weapons do wound them, but Ghuls are difficult to permanently destroy without the correct magical approach.`
      },
      {
        key: 'money', label: 'Money & Economics',
        text: `The currency of Medinaat al-Salaam is the copper piece and the pool (1/100th of a copper). This self-contained economy is built on trade taxation — the city's cut on each transaction is small, but the sheer volume of business makes the coffers always full.

Common prices: knife (2 copper), light armor (30 copper), longsword (15 copper), scimitar (20 copper), shortsword (7 copper), composite bow (20 copper). For daily goods: candle (20 pool), traveling rations (5 pool per meal), water skin (15 pool), silk bolt (2 copper).

All warehouses in the Jewel are technically Caliphate property — a law from Sultan Achim II that ended the era of inventory fraud. This gives the government significant leverage over trade. The Council for Trade (a puppet of the Houses of Dahab) monitors market fluctuations and adjusts taxes on items as necessary.`
      },
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
function NPCDetailModal({ npc, isGM, onSave, onDelete, onClose }) {
  const [name, setName] = useState(npc.name || '');
  const [gmNotes, setGmNotes] = useState(npc.gm_notes || '');
  const [playerNotes, setPlayerNotes] = useState(npc.player_notes || '');
  const [disposition, setDisposition] = useState(npc.disposition || 'neutral');
  const sd = SCHOOL_DATA[npc.school] || null;

  const DISPOSITIONS = [
    { key: 'friendly', label: 'Friendly', color: '#4a8a40', icon: '◆' },
    { key: 'neutral',  label: 'Neutral',  color: '#8a7a30', icon: '◇' },
    { key: 'hostile',  label: 'Hostile',  color: '#8a2a2a', icon: '✦' },
  ];

  const save = () => {
    onSave({ name: name.trim() || npc.name, gm_notes: gmNotes, player_notes: playerNotes, disposition });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
          <Silhouette type={getArchetype(npc.school)} size={24} />
          <div style={{ flex: 1 }}>
            {isGM ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ fontSize: 16, fontWeight: 600, width: '100%', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', padding: '2px 0' }}
                placeholder="NPC name"
              />
            ) : (
              <div className="modal-title" style={{ marginBottom: 0 }}>{npc.name}</div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{npc.school}{npc.rank ? ` — Rank ${npc.rank}` : ''}</div>
          </div>
        </div>

        {/* Stat block — GM only */}
        {isGM && sd && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>
              Stat Block <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(GM only)</span>
            </div>
            <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 4, padding: '.6rem', fontSize: 13, lineHeight: 1.6 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.type}</span> <span style={{ color: 'var(--text-muted)', marginLeft: '.75rem' }}>Integrity:</span> <span style={{ color: 'var(--gold)' }}>{sd.integrity}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Bonus Trait:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.bonus_trait}</span></div>
              <div style={{ marginTop: '.3rem' }}><span style={{ color: 'var(--text-muted)' }}>School Skills:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.skills?.join(', ')}</span></div>
              <div style={{ marginTop: '.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Techniques (Rank {npc.rank || 1}):</span>
                <div style={{ marginTop: 2 }}>
                  {Object.entries(sd.techniques || {})
                    .filter(([r]) => +r <= (npc.rank || 1))
                    .map(([r, t]) => (
                    <div key={r} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--gold-dim)', minWidth: 20, display: 'inline-block' }}>R{r}:</span> {t}
                    </div>
                  ))}
                  {Object.entries(sd.techniques || {}).some(([r]) => +r > (npc.rank || 1)) && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                      +{Object.entries(sd.techniques).filter(([r]) => +r > (npc.rank || 1)).length} more at higher ranks
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '.3rem' }}><span style={{ color: 'var(--text-muted)' }}>Equipment:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.equipment?.join(', ')}</span></div>
            </div>
          </div>
        )}

        {/* GM Notes */}
        {isGM && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>
              GM Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(private)</span>
            </div>
            <textarea
              rows={3} value={gmNotes} onChange={e => setGmNotes(e.target.value)}
              placeholder="Secrets, motivations, relationships, plot hooks..."
              style={{ width: '100%', resize: 'vertical', background: 'rgba(200,150,42,.04)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 4, color: 'var(--text-secondary)', fontSize: 13, padding: '.4rem', fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
        )}

        {/* Player Notes */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>
            Party Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(shared)</span>
          </div>
          <textarea
            rows={3} value={playerNotes} onChange={e => setPlayerNotes(e.target.value)}
            placeholder="What the party has learned about this person..."
            style={{ width: '100%', resize: 'vertical', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, padding: '.4rem', fontFamily: 'inherit', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <button className="btn btn-p" onClick={save}>Save</button>
          <button className="btn" onClick={onClose}>Close</button>
          {isGM && onDelete && (
            <button className="btn btn-d btn-sm" style={{ marginLeft: 'auto', fontSize: 12 }}
              onClick={() => { if (window.confirm('Delete this NPC permanently?')) onDelete(); }}>
              <i className="ti ti-trash" style={{ fontSize: 11, marginRight: 3 }} />Delete
            </button>
          )}
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
  const [showPoisonRef, setShowPoisonRef] = useState(false);

  if (!open) {
    return (
      <div style={{ marginTop: '1.5rem', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem .75rem', background: 'var(--bg-panel)', cursor: 'pointer' }} onClick={() => setOpen(true)}>
          <i className="ti ti-book-2" style={{ fontSize: 16, color: 'var(--gold-dim)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Lore Reference</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>Setting background — read-only</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>▼ Expand</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
      {showPoisonRef && <PoisonReferenceModal onClose={() => setShowPoisonRef(false)} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem .75rem', background: 'var(--bg-panel)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flex: 1, cursor: 'pointer' }} onClick={() => setOpen(false)}>
          <i className="ti ti-book-2" style={{ fontSize: 16, color: 'var(--gold-dim)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Lore Reference</span>
        </div>
        <button className="btn btn-sm" style={{ fontSize: 11, borderColor: '#6a3a3a', color: '#c08040' }}
          onClick={e => { e.stopPropagation(); setShowPoisonRef(true); }}>
          ⚗ Poisons
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setOpen(false)}>▲ Collapse</span>
      </div>
      <div style={{ padding: '.75rem', background: 'var(--bg-dark)' }}>
        {LORE_SECTIONS.map(section => (
          <div key={section.key} style={{ marginBottom: '.6rem' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '.2rem 0', borderBottom: '1px solid rgba(107,78,40,.3)', marginBottom: '.3rem' }}
              onClick={() => setSectionOpen(o => ({ ...o, [section.key]: !o[section.key] }))}
            >
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sectionOpen[section.key] ? '▼' : '▶'}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold-dim)' }}>{section.label}</span>
            </div>
            {sectionOpen[section.key] && section.entries.map(e => (
              <div key={e.key} style={{ marginLeft: '.75rem', marginBottom: '.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setEntryOpen(o => ({ ...o, [e.key]: !o[e.key] }))}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entryOpen[e.key] ? '▼' : '▶'}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{e.label}</span>
                </div>
                {entryOpen[e.key] && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, padding: '.5rem .6rem', background: 'rgba(107,78,40,.08)', borderRadius: 4, marginTop: '.25rem', marginLeft: '.75rem', borderLeft: '2px solid rgba(200,150,42,.2)' }}>
                    {e.text.split('\n\n').map((para, pi) => (
                      <p key={pi} style={{ margin: pi === 0 ? 0 : '.6rem 0 0 0' }}>
                        {para.split('\n').map((line, li) => (
                          <React.Fragment key={li}>
                            {li > 0 && <br />}
                            {line}
                          </React.Fragment>
                        ))}
                      </p>
                    ))}
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
export default function NPCTab({ isGM, isPCView, npcs, fullNpcs = [], onUpdateNPC, onUpdateFullNpc, onDeleteNPC, onCreateNPC, onUpdateRep, reps, encounter, setEncounter, onViewCharacter, onRefetch }) {
  const [openFactions, setOpenFactions] = useState({});
  const [detailNPC, setDetailNPC] = useState(null);
  const [editingNPCId, setEditingNPCId] = useState(null);
  const [editingNPCName, setEditingNPCName] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [hideEmpty, setHideEmpty] = useState(true);
  const [npcSearch, setNpcSearch] = useState('');
  const encActive = encounter?.state === 'active';
  const gmView = isGM && !isPCView;
  const safeNPCs = (npcs || []).filter(Boolean);
  // Filter by search
  const searchedNPCs = npcSearch.trim()
    ? safeNPCs.filter(n => n.name?.toLowerCase().includes(npcSearch.toLowerCase()) || n.school?.toLowerCase().includes(npcSearch.toLowerCase()) || n.faction?.toLowerCase().includes(npcSearch.toLowerCase()))
    : safeNPCs;

  const toggleFaction = name => setOpenFactions(o => ({ ...o, [name]: !o[name] }));

  const handleAddToEncounter = npc => {
    if (!encActive || !setEncounter) return;
    const rank = npc.rank || 1;
    const air   = npc.rings?.Air   || rank;
    const earth = npc.rings?.Earth || rank;
    const fire  = npc.rings?.Fire  || rank;
    const water = npc.rings?.Water || rank;
    const ref = npc.traits?.Reflexes || air + 1;
    const agi = npc.traits?.Agility  || fire + 1;
    const combatant = {
      id: 'npc_log_' + Date.now(),
      name: npc.name,
      school: npc.school, rank, faction: npc.faction,
      type: 'npc',
      wound: 0,
      stance: 'Attack',
      init: Math.floor(Math.random() * 6) + (ref || 3),
      dr: npc.weapon_dr || '3k2',
      drawnWeapon: npc.weapon ? `${npc.weapon} (${npc.weapon_dr || '3k2'})` : (npc.weapon_dr ? `Weapon (${npc.weapon_dr})` : 'Weapon (3k2)'),
      reflexes: ref, agility: agi,
      air, earth, fire, water,
      statusEffects: [],
      archetype: getArchetype(npc.school) || 'warrior',
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
          onDelete={onDeleteNPC ? () => { onDeleteNPC(detailNPC.id); setDetailNPC(null); } : null}
          onClose={() => setDetailNPC(null)}
        />
      )}

      <div style={{ marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>NPC Log</span>
        {gmView && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add NPCs from the Character tab</span>}
        {/* Refresh button — fallback if realtime isn't enabled */}
        {onRefetch && (
          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={onRefetch} title="Refresh NPC list from server">
            <i className="ti ti-refresh" style={{ fontSize: 12 }} />
          </button>
        )}
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 140, maxWidth: 240 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={npcSearch} onChange={e => setNpcSearch(e.target.value)}
            placeholder="Search by name, school, faction…"
            style={{ width: '100%', fontSize: 12, padding: '3px 6px 3px 24px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          {npcSearch && <button onClick={() => setNpcSearch('')} style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>×</button>}
        </div>
        <label className="chk-row" style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 0, cursor: 'pointer' }}>
          <input type="checkbox" checked={hideEmpty} onChange={e => setHideEmpty(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
          Hide empty factions
        </label>
        <div style={{ marginLeft: 'auto', display: 'flex' }} className="layer-tog">
          <button className={`layer-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <i className="ti ti-list" style={{ fontSize: 13 }} />
          </button>
          <button className={`layer-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <i className="ti ti-layout-grid" style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {/* ── Grid view — player-friendly cards, name/icon/faction/school/notes ── */}
      {viewMode === 'grid' && (() => {
        const visibleNPCs = searchedNPCs.filter(n => gmView || n.is_visible_to_players);
        if (visibleNPCs.length === 0) return <Empty icon="ti-users" message="No NPCs visible yet." />;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
            {visibleNPCs.map(n => (
              <div key={n.id} style={{ width: 170, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.3rem', cursor: gmView ? 'pointer' : 'default' }}
                onClick={() => gmView && setDetailNPC(n)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.15rem' }}>
                  <Silhouette type={getArchetype(n.school)} size={28} color="var(--gold)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: n.disposition === 'friendly' ? '#4a8a40' : n.disposition === 'hostile' ? '#c84030' : 'var(--text-primary)' }}>{n.name}</span>
                    {n.disposition === 'friendly' && <span style={{ fontSize: 9, color: '#4a8a40' }} title="Friendly">◆</span>}
                    {n.disposition === 'hostile' && <span style={{ fontSize: 9, color: '#c84030' }} title="Hostile">✦</span>}
                  </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.faction}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gold-dim)' }}>{n.school}{n.rank ? ` R${n.rank}` : ''}</div>
                {/* Player notes — editable by everyone, saves to Supabase */}
                <textarea
                  value={n.player_notes || ''}
                  onClick={e => e.stopPropagation()}
                  onChange={e => onUpdateNPC(n.id, { player_notes: e.target.value })}
                  placeholder="Party notes…"
                  style={{ fontSize: 11, resize: 'none', minHeight: 48, background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 4, padding: '.25rem .3rem', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
                  rows={3}
                />
              </div>
            ))}
          </div>
        );
      })()}

      {viewMode === 'list' && FACTIONS_DATA.map(fDef => {
        const facNPCs = searchedNPCs.filter(n => n.faction === fDef.name && !n.character_id);
        // Full-sheet NPCs (from characters table) in this faction
        const facFullNpcs = fullNpcs.filter(n => n.faction === fDef.name).map(n => ({ ...n, _isFull: true, is_visible_to_players: true }));
        const allFacNPCs = [...facNPCs, ...facFullNpcs];
        const visibleNPCs = gmView ? allFacNPCs : allFacNPCs.filter(n => n.is_visible_to_players);
        if (hideEmpty && visibleNPCs.length === 0) return null;
        const rep = reps[fDef.name]?.reputation ?? 0;
        const isOpen = openFactions[fDef.name];

        return (
          <div key={fDef.name} className="fac-sec">
            {/* Header — clean, matches prototype */}
            <div className="fac-hdr" onClick={() => toggleFaction(fDef.name)}>
              <span className={`fac-chev ${isOpen ? 'open' : ''}`}>▶</span>
              <div style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(200,150,42,.12)', border: '1px solid var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FacIcon name={fDef.name} size={13} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', minWidth: 80 }}>{fDef.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fDef.tagline}</span>
              {FACTION_LORE[fDef.name] && (
                <span onClick={e => e.stopPropagation()}>
                  <ScrollLore title={fDef.name} text={FACTION_LORE[fDef.name]} />
                </span>
              )}
              {visibleNPCs.length > 0 && (
                <span style={{ fontSize: 11, background: 'rgba(200,150,42,.15)', color: 'var(--gold-dim)', border: '1px solid var(--gold-dim)', borderRadius: 10, padding: '1px 6px', flexShrink: 0 }}>
                  {visibleNPCs.length}
                </span>
              )}
            </div>

            {isOpen && (
              <div className="fac-body">
                {/* Rep controls — GM only, inside expanded body */}
                {gmView && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '.3rem 0 .5rem', borderBottom: '1px solid rgba(107,78,40,.2)', marginBottom: '.4rem' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reputation:</span>
                    <button className="rep-btn" onClick={() => onUpdateRep(fDef.name, -1)}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 600, color: repColor(rep), minWidth: 24, textAlign: 'center' }}>{rep > 0 ? '+' : ''}{rep}</span>
                    <button className="rep-btn" onClick={() => onUpdateRep(fDef.name, 1)}>+</button>
                    <span style={{ fontSize: 12, color: repColor(rep) }}>{repLabel(rep)}</span>
                  </div>
                )}

                {/* Faction lore */}
                {FACTION_LORE[fDef.name] && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, paddingBottom: '.5rem', borderBottom: '1px solid rgba(107,78,40,.15)', marginBottom: '.4rem' }}>
                    {FACTION_LORE[fDef.name]}
                  </div>
                )}

                {/* NPC list */}
                {visibleNPCs.length === 0
                  ? <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.2rem 0' }}>No NPCs logged.</div>
                  : visibleNPCs.map(n => (
                    <div key={n.id} className="npc-row" style={{ cursor: n._isFull ? 'default' : 'pointer' }}
                      onClick={() => !n._isFull && setDetailNPC(n)}>
                      {gmView && !n._isFull && (
                        <input type="checkbox" checked={!!n.is_visible_to_players}
                          onClick={e => e.stopPropagation()}
                          onChange={e => onUpdateNPC(n.id, { is_visible_to_players: e.target.checked })}
                          style={{ accentColor: 'var(--gold)', flexShrink: 0 }} title="Show to players"
                        />
                      )}
                      {n._isFull && gmView && <span style={{ fontSize: 9, color: 'var(--gold-dim)', border: '1px solid var(--gold-dim)', borderRadius: 2, padding: '0 2px', flexShrink: 0 }}>FULL</span>}
                      <Silhouette type={getArchetype(n.school)} size={16} />
                      {gmView && editingNPCId === n.id ? (
                        <input
                          autoFocus
                          value={editingNPCName}
                          onChange={e => setEditingNPCName(e.target.value)}
                          onBlur={() => { (n._isFull ? onUpdateFullNpc : onUpdateNPC)(n.id, { name: editingNPCName.trim() || n.name }); setEditingNPCId(null); }}
                          onKeyDown={e => { if (e.key === 'Enter') { (n._isFull ? onUpdateFullNpc : onUpdateNPC)(n.id, { name: editingNPCName.trim() || n.name }); setEditingNPCId(null); } if (e.key === 'Escape') setEditingNPCId(null); }}
                          onClick={e => e.stopPropagation()}
                          style={{ flex: 1, fontSize: 13, background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--gold)', color: 'var(--text-primary)', outline: 'none', padding: '1px 0' }}
                        />
                      ) : (
                        <span
                          style={{ flex: 1, color: n.disposition === 'friendly' ? '#4a8a40' : n.disposition === 'hostile' ? '#c84030' : 'var(--text-primary)' }}
                          onDoubleClick={e => { if (gmView) { e.stopPropagation(); setEditingNPCId(n.id); setEditingNPCName(n.name); } }}
                          title={gmView ? 'Double-click to rename' : ''}
                        >
                          {n.disposition === 'friendly' && <span style={{ fontSize: 9, marginRight: 3 }}>◆</span>}
                          {n.disposition === 'hostile' && <span style={{ fontSize: 9, marginRight: 3 }}>✦</span>}
                          {n.name}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.school}{n.rank || n.school_rank ? ` R${n.rank || n.school_rank}` : ''}</span>
                      {n.player_notes && <span style={{ fontSize: 11, color: 'var(--gold-dim)' }} title="Has party notes">📝</span>}
                      {gmView && !n._isFull && <span style={{ fontSize: 11, color: n.is_visible_to_players ? 'var(--green)' : 'var(--text-muted)' }}>{n.is_visible_to_players ? '●' : '○'}</span>}
                      {n._isFull && onViewCharacter && (
                        <button className="btn btn-sm" style={{ fontSize: 11, padding: '1px 5px' }}
                          onClick={e => { e.stopPropagation(); onViewCharacter(n.id); }}
                          title="View full character sheet">
                          <i className="ti ti-user" style={{ fontSize: 11 }} />
                        </button>
                      )}
                      {!n._isFull && n.character_id && onViewCharacter && (
                        <button className="btn btn-sm" style={{ fontSize: 11, padding: '1px 5px' }}
                          onClick={e => { e.stopPropagation(); onViewCharacter(n.character_id); }}
                          title="View full character sheet">
                          <i className="ti ti-user" style={{ fontSize: 11 }} />
                        </button>
                      )}
                      {encActive && gmView && (
                        <button className="btn btn-sm" style={{ fontSize: 11, padding: '1px 5px' }}
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

      {/* ── Bestiary — always-available creature reference ── */}
      {viewMode === 'list' && (() => {
        const categories = [...new Set(CREATURES_LIBRARY.map(c => c.category))];
        return (
          <div style={{ marginTop: '.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .6rem', background: 'rgba(107,78,40,.08)', borderRadius: '5px 5px 0 0', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderBottom: 'none', cursor: 'pointer' }}
              onClick={() => setOpenFactions(o => ({ ...o, _bestiary: !o._bestiary }))}>
              <FacIcon name="Monsters" size={14} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Bestiary</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{CREATURES_LIBRARY.length} creatures</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{openFactions._bestiary ? '▲' : '▼'}</span>
            </div>
            {openFactions._bestiary && (
              <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 5px 5px', padding: '.5rem .6rem' }}>
                {categories.map(cat => (
                  <div key={cat} style={{ marginBottom: '.75rem' }}>
                    <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem', fontWeight: 600 }}>{cat}</div>
                    {CREATURES_LIBRARY.filter(c => c.category === cat).map(creature => (
                      <div key={creature.id} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 5, padding: '.5rem .65rem', marginBottom: '.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.2rem' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{creature.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>ATK {creature.attack} | DMG {creature.damage} | TN {creature.tn} | {creature.wpl} W/lvl</span>
                          {gmView && onCreateNPC && (
                            <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', flexShrink: 0, borderColor: 'var(--gold-dim)', color: 'var(--gold)' }}
                              title="Save to NPC Log — creates a reusable NPC entry from this bestiary creature"
                              onClick={async () => {
                                await onCreateNPC({
                                  name: creature.name,
                                  faction: creature.category,
                                  school: creature.category,
                                  rank: 1,
                                  weapon: `${creature.name} (${creature.attack})`,
                                  weapon_dr: creature.damage,
                                  rings: { Air: creature.air, Earth: creature.earth, Fire: creature.fire, Water: creature.water },
                                  traits: creature.traits || {},
                                  notes: creature.specials?.join('; ') || '',
                                  is_visible_to_players: false,
                                });
                              }}>+ Log</button>
                          )}
                          {encActive && gmView && (
                            <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', flexShrink: 0 }}
                              onClick={() => {
                                const nc = {
                                  id: 'npc_' + creature.id + '_' + Date.now(),
                                  name: creature.name,
                                  school: creature.category, rank: 1, faction: 'Monsters',
                                  dr: creature.damage, drawnWeapon: `${creature.name} (${creature.attack})`,
                                  reflexes: creature.traits?.Reflexes || creature.air || 2,
                                  agility: creature.traits?.Agility || creature.fire || 2,
                                  air: creature.air || 2, fire: creature.fire || 2,
                                  wound: 0, stance: 'Attack', statusEffects: [], type: 'npc',
                                };
                                setEncounter && setEncounter(prev => ({ ...prev, combatants: [...(prev.combatants || []), nc] }));
                              }}>+Enc</button>
                          )}
                        </div>
                        {/* Rings */}
                        <div style={{ display: 'flex', gap: '.75rem', fontSize: 11, color: 'var(--text-muted)', marginBottom: creature.specials.length ? '.3rem' : 0 }}>
                          <span>Air {creature.air}</span><span>Earth {creature.earth}</span><span>Fire {creature.fire}</span><span>Water {creature.water}</span>
                          {creature.void && <span>Void {creature.void}</span>}
                          {Object.entries(creature.traits || {}).map(([t, v]) => (
                            <span key={t} style={{ color: 'var(--gold-dim)' }}>{t} {v}</span>
                          ))}
                        </div>
                        {/* Specials */}
                        {creature.specials.length > 0 && (
                          <div style={{ marginTop: '.2rem' }}>
                            {creature.specials.map((s, i) => (
                              <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 6, borderLeft: '2px solid var(--gold-dim)', marginBottom: 2 }}>
                                <strong>Special:</strong> {s}
                              </div>
                            ))}
                          </div>
                        )}
                        {creature.gm_notes && gmView && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '.2rem' }}>{creature.gm_notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <LorePanel />
    </div>
  );
}
