# Unofficial AGE System for FVTT
Unofficial implementation of AGE System (Green Ronin) for Foundry VTT

## Intro
This is a work in progress, not meant to be actualy used during normal play. Revision stuck at 0.0.1 until first publi

### Shortcuts
1. Shift + Click on Attack or Damage rolls trigger GM roll (only GM can see).
2. CTRL + Click on Damage rolls adds +1D6 to the total.
3. CTRL + ALT + Click on Damage rolls adds +2D6 to the total.
4. Right Click on Focus in the character sheet opens a context menu with options to roll it with another Ability, show on Chat, edit and delete.

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

## Change log

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