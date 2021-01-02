# Unofficial AGE System for FVTT
Unofficial implementation of AGE System (Green Ronin) for Foundry VTT

<img src="https://imgur.com/3rJNe40.png"/>

## Intro
Character sheet designed to serve all AGE System versions. Not all AGE installments are fully implemented. New features are expected to be added over time.

## Features
- Different color schemes
- Possibility to use a few optional rules (Fatigue, Conviction)
- Checkboxes to identify primary and secondary abilities
- Checkbox to select last ability leveled up
- Option to use the Dragon AGE specific ability set
- Support to Toughness, Impact/Ballistic Armor, and Stun/Wound damage
- Dice so Nice compatible
- Support to Income, Resources and Currency wealth systems
- Shift, Alt, Ctrl keys support to change certain types of roll

## Credits
Icons were used from [game-icons.net](https://game-icons.net). This icons were published under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/) license. Here is a list of all icons used:
- [Sensuousness](https://game-icons.net/1x1/lorc/sensuousness.html) (Character icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Split Cross](https://game-icons.net/1x1/lorc/split-cross.html) (Stunt icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Embrace Energy](https://game-icons.net/1x1/lorc/embrassed-energy.html) (Power & Arcana icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Gift of Knowledge](https://game-icons.net/1x1/lorc/gift-of-knowledge.html) (Focus icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Backup](https://game-icons.net/1x1/lorc/backup.html) (Membership icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Skills](https://game-icons.net/1x1/delapouite/skills.html) (Talent icon), by [Delapouite](https://delapouite.com/).
- [Player Next](https://game-icons.net/1x1/delapouite/player-next.html) (Relationship icon), by [Delapouite](https://delapouite.com/).
- [Briefcase](https://game-icons.net/1x1/delapouite/briefcase.html) (General Equipment icon), by [Delapouite](https://delapouite.com/).
- [Rank 3](https://game-icons.net/1x1/skoll/rank-3.html) (Honorifics icon), by [Skoll](https://game-icons.net) (his link reference is game-icons.net itself).
- [Fist](https://game-icons.net/1x1/skoll/fist.html) (Weapon icon), by [Skoll](https://game-icons.net) (his link reference is game-icons.net itself).

### Shortcuts
1. Shift + Click on Attack or Damage rolls trigger GM roll (only GM can see).
2. CTRL + Click on Damage rolls adds +1D6 to the total.
3. CTRL + ALT + Click on Damage rolls adds +2D6 to the total.
4. Right Click on Focus in the character sheet opens a context menu with options to roll it with another Ability, show on Chat, edit and delete.

### Modificators
A few items have a "Modificators" section. Modificatores will only apply when the item is equiped/activated (i.e., shield icon in character sheet without opacity).
The checkbox must be checked to have the mod active in the item.
Bonuses for maneuvers are on topo of the normal bonuses granted by the maneuver.
Here the description of each one of the Modificators:
1. **This Item Damage:** adds damage when using damage roll for tha particular item (useful only for Weapon and Power & Arcana).
2. **All Damage:** adds the damage to all types of damage rolls.
3. **This Item Activation:** add a bonus to all use rolls for that item (using the dice icon to roll).
3. **Defense:** value added to owners' Defense stats.
4. **Impact Armor:** adds to Impact Armor. *When Ballistic armor is not used, Impact Armor is the mod to use to add into Armor.*
5. **Ballistic Armor:** mod ading to Ballistic armor.
6. **Toughness:** value added to Toughness stats.
7. **Defend Maneuver:** the value here adds to the bonus granted by the Defend maneuver.
8. **Guard Up Maneuver:** this mod adds up to the Guard Up bonus.
9. **All-Out Attack:** bonus to damage caused by All-Out Attack.
10. **Max Health:** added to character's maximum Health.
11. **Max Conviction:** added to character's maximum Conviction.
12. **Max PP:** added to character's maximum Power Points.
13. **Power Force:** added to item's Power Force. Only useful for Power & Arcana.
14. **Aim:** extra bonus added to attack rolls when Aim maneuver is used, besides the standard value.
15. **Ability Names:** these are play bonuses to the specific Ability.

## Change log

### v0.1.0
#### Added
- Checkbox to indicate primary Abilities.
- Option to hide primary Abilities checkbox if not used.
- Option to use Impact and Ballistic armor or generic Armor.
- Added field in character sheet to track Threshold during Advanced Tests.
- Shield icon working to equip/activate items. Unequiped/unactive items do not add bonuses do character.
- Added custom icons for each item type and character, and users are allowed to change them as they please

#### Fixed
- Fixed an error causing Currency input to be disabled.
- Added missing Membership sheet template.
- Fixed styling issue causing all item name container to be slightly shorter than other sheet rows.

### 2020.12.31
- Included Ancestry/Race/Origin field with selection on Settings
- Added option to change label between Profession/Class
- Damage formula for items know support no Ability selected
- Added a horizontal line to

### 2020.12.29
- Added functional color schemes for Modern AGE, Fantasy AGE, Threefold and Dragon AGE books.
- Fixed bug causing Talent item to be reset when dragging it to character sheet.
- Fixed bug causing Ability values disappearing from character sheet.

### 2020.12.28
- Added damage type (stun, wound, impact, ballistic, penetrating) on damage roll char card.

### 2020.12.27
- Added Settings menu to swap setting specific data (Fatigue, Power Points, Fatigue, Conviction, Currency, Income, Resources, Toughness).
- Dragon AGE and Core AGE abilities are now supported, only select the desired at Settings.
- Added settings to change game mode (Gritty, Pulp, Cinematic), but no practical changes on the system.
- Added setrings to change color schemes, but not functional (current system scheme is the "Modern Blue").

### Features to be implemented
1. Create stat block view for characters (based on NPC stats on AGE books).
2. ~~Add Dragon AGE setup.~~
3. ~~Add Blue Rose setup.~~
4. ~~Add Fantasy AGE setup.~~
5. Add The Expanse setup.
6. Add The Expanse conditions.
7. Add The Expanse Churn.
8. Add The Expanse spaceship sheet (set as Actor).
9. ~~Automatically add Focus value to Power Force - currently Power Force is only affected by key Ability. To allow Focus modificator, use the Modificator "This Item Force".~~
10. When attacking a token, indicate Hit or Miss by comparing the roll against token's/enemy's Defense score.
11. ~~Add code on Roll Fatigue button when a Power activation is rolled.~~
12. ~~Hide Roll Damage and Roll Fatigue buttons for players without permission to control the Actor originating the roll.~~
13. ~~Add setup to select any Compendium to create the `datalist` with Focus options. Currently the system only looks at the Focus Compendium created with the world.~~
14. Add Alt + Click on test/damage rolls to add modifiers (constants or extra die).
15. Add Dynamic Effects support to Actors.
16. ~~Initiative roll implemented as `3d6 + Dexterity - Armor Penalty + Initiative Mod` (the later accessed by character sheet).~~
17. Add support to Organizations (as Actors).
18. ~~Add option for weapons and powers to cause damage without taking Ability into consideration~~

### Known bugs
1. ~~Fix Item rolls on Chat (fix the Description/Modificators visualization).~~
2. When adding `<button></button>` on Chat Message, clicking it causes Foundry client to refresh (currently, buttons a made out of div/span).
3. ~~Dice so Nice is causing error when other player roll the dice - Dice so Nice can not find the `user.color`. It seems `user` data is incomplete.~~
4. When selecting and Focus on the list instead of typing, 2 error messages appear on console - it seems FoundryVTT expects `<input type="text"/>` to be filled in by typing only. No code breaking outcomes, tho.
5. Shift + Click on Focus context menu to roll with another Ability won't trigger GM roll.
