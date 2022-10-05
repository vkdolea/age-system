# Unofficial AGE System for FVTT
Unofficial implementation of AGE System (Green Ronin) for Foundry VTT. Character sheet designed to serve most of AGE System versions. Not all AGE installments are fully implemented. New features are expected to be added over time.

<figure><img src="https://i.imgur.com/BQNFklx.png" alt="AGE System sheets preview" />
<figcaption>Preview of sheets from AGE System (unofficial)</figcaption>

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/vkdolea)

## Wiki
Take a look at [AGE System (unofficial) wiki](https://github.com/vkdolea/age-system/wiki) to understand how to use the game system

## Features
- [PDFoundry](https://foundryvtt.com/packages/pdfoundry) integration
- [Dice so Nice](https://foundryvtt.com/packages/dice-so-nice) compatible
- Two possible Character sheet - one Complete and another condensed, ideal for NPCs and quick character overview
- Different color schemes
- Checkboxes to identify primary and secondary abilities
- Checkbox to select last ability leveled up
- Option to use the Dragon AGE specific ability set
- Support to Toughness, Impact/Ballistic Armor, and Stun/Wound damage
- Support to Income, Resources, Currency and GP/SP/CP wealth systems
- Possibility to use a few optional rules (Fatigue, Conviction, Complication/Churn, Serendipity)
- Possibility to add Conditions on characters (effects must be set manually)
- Support to track Serendipity (MAGE Companion), Complication (MAGE Companion)
- Shift, Alt, Ctrl keys support to change check and damage rolls
- Drag and drop owned weapons and power to macro bar to create attack shortcuts
- Add Stunt Die or Focus (or both) to damage roll when rolling damage from chat
- Point mouse slightly above Tracker or Roller and a Drag Bar will appear. Click and drag to reposition. Right click Drag Bar to return to  original position!
- Supports Vehicles and Spaceships.
- Active Effects enabled.
- Item Damage roll and a few Modifiers accept e few [variables](https://github.com/vkdolea/age-system/wiki/Variables):
    - @acc (Accuracy ability value)
    - @comm (Communication ability value)
    - @cons (Constitution ability value)
    - @cunn (Cunning ability value)
    - @dex (Dexterity ability value)
    - @fight (Fighting ability value)
    - @int (Intelligence ability value)
    - @magic (Magic ability value)
    - @per (Perception ability value)
    - @str (Strength ability value)
    - @will (Willpower ability value)
    - @level (character level)

## Spaceship and Vehicle Controls
You can drag and drop Characters to Veihcles and Spaceships, so these passengers will be able to be selected for roles inside the vehicle/spaceship.

## Shortcuts
1. *Shift + Click* on Attack or Damage rolls trigger GM roll (only GM can see).
2. *CTRL + Click* on Damage rolls adds +1D6 to the total.
3. *CTRL + ALT + Click* on Damage rolls adds +2D6 to the total.
4. *ALT + Click* on Attack, Focus, Ability or Damage rolls to add Roll Options.
5. *Right Click* on Focus in the character sheet opens a context menu with options to roll it with another Ability, show on Chat, edit and delete.
6. *Drag and drop* a owned Weapon or owned Power to macrobar to create a macro.

## [Modifiers](https://github.com/vkdolea/age-system/wiki/Modifiers)
A few items have a "Modifiers" section. Modifiers will only apply when the item is equiped/activated (i.e., **shield icon** in character sheet without opacity).
The checkbox must be checked to have the mod active in the item.
Bonuses for maneuvers are on top of the normal bonuses granted by the maneuver.
Here the description of each one of the Modifiers:
1. **Damage (this item):** adds damage when using damage roll for tha particular item (useful only for Weapon and Power & Arcana).
2. **Damage (all):** adds the damage to all types of damage rolls.
3. **Tests (this item):** add a bonus to all use rolls for that item (using the dice icon to roll).
3. **Test (all):** general bonus adding to all tests, except for attack/damage rolls.
4. **Impact Armor:** adds to Impact Armor. *When Ballistic armor is not used, Impact Armor is the mod to use to add into Armor.*
5. **Ballistic Armor:** mod ading to Ballistic armor.
6. **Toughness:** value added to Toughness stats.
7. **Defend Maneuver:** the value here adds to the bonus granted by the Defend maneuver.
8. **Guard Up Maneuver:** this mod adds up to the Guard Up bonus.
9. **All-Out Attack:** bonus to damage caused by All-Out Attack.
10. **Max Health or Max Fortune:** added to character's maximum Health/Fortune.
11. **Max Conviction:** added to character's maximum Conviction.
12. **Max Power Points:** added to character's maximum Power Points.
13. **Power Force (this item):** added to item's Power Force. Only useful for Power & Arcana.
14. **Power Force (all):** added to Power Force from every single Power & Arcana.
15. **Power Force (Focus):** added to Power Force from every single Power & Arcana using the informed Focus.
16. **Aim:** extra bonus added to attack rolls when Aim maneuver is used, besides the standard value.
17. **Ability Names:** these bonuses apply to specific Ability.
17. **Ability Names (test only):** these are applied only to Ability tests (no impact on damage/derived calculation).
19. **Speed:** adds to Speed Mod field.
20. **Focus:** adds bonus to Focus maching the name, as long as the character has the given Focus on its character sheet.
21. **Attack Bonus:** adds to attack rolls.
22. **Defense:** value added to owners' Defense stats.
23. **Armor Strain:** this is the extra Power/Spell/Magic Points necessary to cast a spell when wearing the item bearing this mod.

## Credits
### Icons
Icons were used from [game-icons.net](https://game-icons.net). These icons were published under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/) license. Here is a list of all icons used:
- [Sensuousness](https://game-icons.net/1x1/lorc/sensuousness.html) (Character icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Chariot](https://game-icons.net/1x1/cathelineau/chariot.html) (Vehicle icon), by [Cathelineau](his link reference is game-icons.net itself).
- [Rocket](https://game-icons.net/1x1/lorc/rocket.html) (Spaceship icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Barracks Tent](https://game-icons.net/1x1/delapouite/barracks-tent.html) (Organization icon), by [Delapouite](https://delapouite.com/).
- [Split Cross](https://game-icons.net/1x1/lorc/split-cross.html) (Stunt icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Embrace Energy](https://game-icons.net/1x1/lorc/embrassed-energy.html) (Power & Arcana icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Gift of Knowledge](https://game-icons.net/1x1/lorc/gift-of-knowledge.html) (Focus icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Backup](https://game-icons.net/1x1/lorc/backup.html) (Membership icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Skills](https://game-icons.net/1x1/delapouite/skills.html) (Talent icon), by [Delapouite](https://delapouite.com/).
- [Player Next](https://game-icons.net/1x1/delapouite/player-next.html) (Relationship icon), by [Delapouite](https://delapouite.com/).
- [Briefcase](https://game-icons.net/1x1/delapouite/briefcase.html) (General Equipment icon), by [Delapouite](https://delapouite.com/).
- [Rank 3](https://game-icons.net/1x1/skoll/rank-3.html) (Honorifics icon), by [Skoll](https://game-icons.net) (his link reference is game-icons.net itself).
- [Fist](https://game-icons.net/1x1/skoll/fist.html) (Weapon icon), by [Skoll](https://game-icons.net) (his link reference is game-icons.net itself).
- [Processor](https://game-icons.net/1x1/lorc/processor.html) (Spaceship Features icon), by [Lorc](https://lorcblog.blogspot.com/).
- [Cubes](https://game-icons.net/1x1/lorc/cubes.html) (Age Roller icon), by [Lorc](https://lorcblog.blogspot.com/).

### Token Stats Icons
Icons made by:
- [Delapouite](https://delapouite.com/), [DarkZaitev](http://darkzaitzev.deviantart.com/), [Lorc](https://lorcblog.blogspot.com/), [Skoll](https://game-icons.net),   from [game-icons.net](https://game-icons.net/).

### Localization
Do you want to help with localization? Take a look at [this wiki entry!](https://github.com/vkdolea/age-system/wiki/Localization)
- **French**: by Discord users *Imposator#8090* & *Abdanck#2003*.
- **Brazilian Portuguese**: by Discord user *Leandro_Soares#9067* and me.
- **Spanish**: by Discord user *ForjaSalvaje#2419*.

## [Change log](https://github.com/vkdolea/age-system/blob/prep-release/RELEASENOTES.md)