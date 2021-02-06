# Unofficial AGE System for FVTT
Unofficial implementation of AGE System (Green Ronin) for Foundry VTT

<img src="https://imgur.com/3rJNe40.png"/>

## Intro
Character sheet designed to serve most of AGE System versions. Not all AGE installments are fully implemented. New features are expected to be added over time.

## Features
- Different color schemes
- Possibility to use a few optional rules (Fatigue, Conviction)
- Checkboxes to identify primary and secondary abilities
- Checkbox to select last ability leveled up
- Option to use the Dragon AGE specific ability set
- Support to Toughness, Impact/Ballistic Armor, and Stun/Wound damage
- Dice so Nice compatible
- Support to Income, Resources, Currency and GP/SP/CP wealth systems
- Shift, Alt, Ctrl keys support to change check and damage rolls
- Drag and drop owned weapons and power to macro bar to create attack shortcuts
- Possibility to add Conditions on characters (effects must be set manually)
- Add Stunt Die or Focus (or both) to damage roll when rolling damage from chat

## Credits
### Icons
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
### Localization
- **French**: by Discord user *Imposator#8090*.

### Shortcuts
1. *Shift + Click* on Attack or Damage rolls trigger GM roll (only GM can see).
2. *CTRL + Click* on Damage rolls adds +1D6 to the total.
3. *CTRL + ALT + Click* on Damage rolls adds +2D6 to the total.
4. *ALT + Click* on Attack, Focus, Ability or Damage rolls to add Roll Options.
5. *Right Click* on Focus in the character sheet opens a context menu with options to roll it with another Ability, show on Chat, edit and delete.
6. *Drag and drop* a owned Weapon or owned Power to macrobar to create a macro.

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
16. **Speed:** adds to Speed Mod field.

## Change log

### 0.4.0 [2021-02-05]
#### Added
- Options to Add Focus to damage and an arbitraty number for Stunt Die now shows up When ALT + Click to roll damage.
- Powers now have option to roll as Damage or Healing.
- Added option to indicate a Power as resistable, and add which Ability (Focus) is used to resist.
- Damage/Healing Powers have a "Resisted Effect" to indicate the damage/healing roll when target resists.
- Added buttons on chat message to roll "resisted damage/healing" from applicable Powers.
- Ronin Green color scheme included.
- Player can select which Ability will be used to check Power's Fatigue - previously all Fatigue checks were based on Willpower.
#### Fixed
- Bug causing chat message causing damage/fatigue rolls from unliked tokens to roll from Actor.
- Bug preventing Talent degree to display on character sheet.
- Restyled chat message buttons.

### v0.3.1 [2021-01-26]
#### Fixed
- Incorrect link on system.json preventing system to update automatically using FoundryVTT software.

### v0.3.0 [2021-01-25]
#### Added
- Press Alt key when rolling a roll check to bring menu with options to set TN, add modifier and Attack to Damage trade off (this one only when rolling weapon attacks).
- When targeting a token and rolling an weapon attack, roll will be check versus target's Defense (attack selecting multiple tokens warns user to select only one token to attack).
- When attacking a token or when rolling versus a TN, chat card will show "Success" or "Miss" - if the check is a "Miss", stunt points will not be generated.
- Default macro (when dragging Power or Weapon to macro bar) behaviour is rolling the Item without prompting for a dialog box. Setting second argument to "true" after in the macro script it will prompt user for roll options (i.e., it will simulate the Click + Alt on character sheet roll).
- When rolling damage, use Alt + Click to open menu to input extra damage options (extra dice and flat bonus/penality).
- Added 4 and 12 hours option for casting time.
#### Fixed
- Rolling Focus with another Ability from Focus' context menu now functional.
- Fixed labeling on Cost field of equipment should "Purchase TN" instead of "Cost".
- Styling on Power sheet causing PP cost field to disapear.
- Data migration issues when preventing Speed mod to be include to some items.

### v0.2.4 [2021-01-21]
#### Added
- French localization by Discord user *Imposator#8090*.
#### Fixed
- Version issue on 0.2.3 causing it to behave as 0.2.2.

### v0.2.3 [2021-01-20]
#### Added
- When selecting a input field, the text will be focused for quick edit.
#### Fixed
- Issue causing worlds created on versions 0.2.1 and earlier not compatible to version 0.2.2.

### v0.2.2 [2021-01-17]
#### Added
- Added Speed Modificator.
- Added Settings option to include Conditions (actual rolls and characteristics modificators not included).
- When rolling damage from chat, added options to add Focus, Stunt Die or both to damage.
#### Fixed
- Arcana/Power Fatigue rolls were previously based on Power's key Ability, no reverted to Willpower.
- Fixed "yards" abbreviation to "yd" on grid map.
### v0.2.1 [2021-01-10]
#### Fixed
- Focus context menu (to edit, remove, show and roll with another Ability) is working again.

### v0.2.0 [2021-01-09]
#### Added
- Header from chat cards when rolling items shows different text.
- Option to use GP / SP / CP as a wealth type.
- Support to drag Weapons and Powers to marcobar.
- Cost and Minimum STR fields now accepts text input.
- Extra field on weapon chards to input max/long range.
#### Fixed
- Removed unnecessary arguments from ageRollCheck.
- When equip/activate icon is clicked on character sheet, only this element is updated on Item object and not the whole entity.

### v0.1.1 [2021-01-05]
#### Fixed
- Minimum and compatible versions updated on system.json.

### v0.1.0
#### Added
- Checkbox to indicate primary Abilities.
- Option to hide primary Abilities checkbox if not used.
- Option to use Impact and Ballistic armor or generic Armor.
- Added field in character sheet to track Threshold during Advanced Tests.
- Shield icon working to equip/activate items. Unequiped/unactive items do not add bonuses to character.
- Added custom icons for each item type and character, and users are allowed to change them as they please.
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
- Create stat block view for characters (based on NPC stats on AGE books).
- Add The Expanse setup.
- Add The Expanse conditions.
- Add The Expanse Churn.
- Add The Expanse spaceship sheet (set as Actor).
- When attacking a token, indicate Hit or Miss by comparing the roll against token's/enemy's Defense score.
- Add Alt + Click on test/damage rolls to add modifiers (constants or extra die).
- Add Dynamic Effects support to Actors.
- Add support to Organizations (as Actors).

### Known bugs
- When adding `<button></button>` on Chat Message, clicking it causes Foundry client to refresh (currently, buttons a made out of div/span).
- When selecting and Focus on the list instead of typing, 2 error messages appear on console - it seems FoundryVTT expects `<input type="text"/>` to be filled in by typing only. No code breaking outcomes, tho.
- Shift + Click on Focus context menu to roll with another Ability won't trigger GM roll.
