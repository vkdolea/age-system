# Release Notes

## 1.0.3 [2022-09-xx]
### Fixed
- Deprecation warning when using Dice so Nice module.

## 1.0.2 [2022-09-03]
### Fixed
- Focus Modifiers are now calculated correctly.

## 1.0.1 [2022-09-03]
### Fixed
- Bug preventing creating new modifiers on Items.

## 1.0.0 [2022-08-31]
### Added
- Experimental "AGE Importer", accessable by AGE Roller menu. Currently works only for Modern AGE stat blocks in English. A new Actor is created using the text pasted, including detected items. Fine tuning expected in the next versions.
- Support to core function to create macros to display item sheet if the particular Item doesn't have a roll feature.

### Changed
- Power item have now an option to indicate if it is "rollable" or not to cover for NPC characteristics without a dice requirement ("Special Features" or "Special Qualities" depending on the AGE setting used).
- New item chat cards for all items.
- Spaceship Features item sheet redesigned.
- System updated to run on Foundry VTT v10.
- *Removed compatibility to FoundryVTT 0.8.x and FoundryVTT v9.*
- *Removed support to Legacy character sheet.*

### Fixed
- Power description on Stat Block sheet now will show buttons for inline rolls and content links.
- Using a power with 0 base damage when using *Modern AGE (alternate damage: Injury)* won't output wrong calculation.
- *Quick AGE Settings* window restyled to fully show buttons; localized name on title; clicking *Save Settings* without selecting an option will close the window and won't return an error.
- Modifiers Test (All), Attack (All) and Damage (all) now have consistent evaluation when an Active Effect is also adding to these numbers.

## 0.12.5 [2022-06-11]
### Fixed
- Added a cleaner background on character/item sheets.
- Reduced border radius on boxes inside character sheet.
- Updated Dice so Nice compatibility.

## 0.12.4 [2022-04-16]
### Fixed
- Hull and Damage rolls from Spaceships now work as expected.
- Removed an extra "+" when rolling Vehicle damage with RAM.
- Error thrown when trying to roll Vehicle maneuver without a driver or Token selected.

## 0.12.3 [2022-03-29]
### Changed
- Buttons restyled to follow Foundry standard.

### Fixed
- Ability test mods now apply to Ability tests as expected.
- Error preventing to add Focus on character/organization sheet if another item type has the same name.

## 0.12.2 [2022-02-12]
### Added
- New mods added: Force Power (all), Force Power (Focus) and one for each Ability (test only).

### Changed
- A few mods now have a new name, so its behaviour is more clear tho users.

### Fixed
- Saving changes on Quick AGE Settings or Adavance AGE Settings window will no close them accordingly or reset the world, depending on settings changed.
- Stunt Points setting and check boxes now show up properly.
- Fixed localizations missing strings.
- Max Power Points bonuses were not correct added on character stats.

## 0.12.1 [2022-02-12]
### Added
- Quick AGE Settings menu created to set all Advanced AGE Settings to fit a specific game system.
- Created an Advanced AGE Settings for advanced users to customize how the system works.
- Added optional setting to apply damaged/healing on Targeted tokens instead of Controlled tokens.

### Changed
- System license is now Apache 2.0 instead of MIT.

### Fixed
- Defense MODE and Toughness MODE values on sidebar can now be changed correctly.
- When damage or to hit bonus of weapon/power was equal to Zero, nothing appeared on block sheet. Now *+0* will appear instead.
- Clicking an Item name on Block Sheet will now open item sheet.
- Injury bar has consistent proportion when using stat block sheet.

## 0.12.0 [2022-02-05]
### Added
- Support to store Max Health, Defense and Toughness for different game modes (Gritty, Pulp, Cinematic) when using Modern AGE rules.

### Changed
- Only players with Owner of a given token will be able to see floating numbers when receiving damage/healing. Other users will see floating question marks.
- Focuses are aligned to left margin on character sheet Main tab.

### Fixed
- French and Spanish translation issue on Focus sheet.

## 0.11.10 [2022-01-25]
### Fixed
- Modifier with Focus bonus wasn't applying correctly on Actor owned focus.
- Focus bonus wasn't added to Powerforce/Spellpower value.

## 0.11.9 [2022-01-23]
### Added
- Updated Character template to add future support to multiple Health values for different game modes and a Modifier to add penality for test using an Ability, but without reducing Ability total.

### Fixed
- Modifiers not showing up correctly on Item sheet when using Injury mode.
- Weapon/Power damage not showing correctly on Item/Block sheet when using Injury mode.

## 0.11.8 [2022-01-20]
### Fixed
- Hotfix on item preparation routines, FVTT v9.

## 0.11.7 [2022-01-20]
### Fixed
- Compatibility issue solved on Item preparation with FoundryVTT version 0.8.x. which prevented items from displaying correct data/rolls.
- Compatibility issue solved on formula preview evalulation with FoundryVTT version 0.8.x.

## 0.11.6 [2022-01-19]
### Fixed
- Remove damage component from weapon/arcana from previous damage setup.

## 0.11.5 [2022-01-19]
### Fixed
- Talent on Legacy sheet now show correctly Degree and changes color when it is flaged as Specialization.
- Modifiers fixed: item activation, actor damage, item damage.

## 0.11.4 [2022-01-18]
### Fixed
- Ability box (main tab) size deteriotes the bigger the "Quick Access" box get.
- When hovering "Reference" field with PDFoundry installed, cursor will change for a pointer.
- Fixed styling issue on Spaceship Features sheet.

## 0.11.3 [2022-01-17]
### Fixed
- If PDFoundry wasn't installed, Item sheets wouldn't open.
- Focus and Talent data was loged on console whenever sheet was rendered.

## 0.11.2 [2022-01-16]
### Added
- Talent Degrees were "lost" during migration. Added a second migration to try to identify Talent Degree and set it automatically. Also, old Degrees will be added on new "Requirements" field of each Talent.

## 0.11.1 [2022-01-16]
### Fixed
- Bug preventing PDFoundry to open PDFs on "Reference" field from Item sheets.

## 0.11.0 [2022-01-16]
### Added
- All items have a "Reference" field on sidebar. Here it is expected to add a page number configures on PDFoundry. Clicking on field's title will open your PDF on corresponding page, as long as [PDFoundry](https://foundryvtt.com/packages/pdfoundry) modules is installed.
- Talents: added option to flag it as Specialization, added different text fields for different levels.
- Stunts: added option to mark cost as fixed or variable.
- Weapons: damage is now a free form formula, option to indicate if weapon is ranged or not, reloadable or not.
- Powers and Arcana: damage is now a free form formula.
- Right click Age Roller d666 and d66 to make private rolls.

### Changed
- User interface on new character sheet: editable fields are are now highlighted when hovering, colors and contrast.
- All item sheets have new layout.
- Items can now have multiple instances of the same Modifier.
- Damage fields now accept formulas.
- Some Modifiers accept formulas (if formula is invalid, error message will be displayed).
- Formulas accept the following [variables](https://github.com/vkdolea/age-system/wiki/Variables):
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

### Fixed
- Error message on console log on players' client when rendering chat rolls.

## 0.10.2 [2021-12-21]
### Changed
- Buttons to select character sheet tabs have different colors to tell from active / inactive.

### Fixed
- Targeting a token to attack using weapon is working again as expected.

## 0.10.2 [2021-12-21]
### Fixed
- Issue preventing world from loading data on start up.

## 0.10.1 [2021-12-20]
### Added
- Final fix to update for v9.

## 0.10.0 [2021-12-19]
### Added
- FoundryVTT v9 and 0.8.5+ compatible.
- Added floating numbers over token to reflect damage and healing.
- "Expanded Blue" colorset included.

### Fixed
- Correct armor text displays when rolling Toughness Test from chat card.

## 0.9.2 [2021-12-17]
### Fixed
- Removed test code from character sheet

## 0.9.1 [2021-12-17]
### Added
- "Favourite Equipment" renamed as "Quick Access". Items are now sorted by item type. A header will indicate which item type is listed.

### Changed
- Attack to Damage Trade Off: the value informed is added to Attack roll (if negative, it is subtracted). The oposite operation goes to damage total.
- When changing tabs from character sheet, the selected tab will have bigger font size.
- Added silver shadows around tabs' names, to improve contrast.
- Updated Spanish and French translation.

### Fixed
- Health/Fortune labels were not display correctly on character sheet.

## 0.9.0 [2021-12-12]
### Added
- New Character sheet, totally overhauled. Old sheet can be acessed by accessing "Sheet" -> "This Sheet" -> "Legacy".
- Added option on Age Roller to roll d66 and d666.

### Changed
- When Item Modifier is added to an Item, the Modifier will be actived by default.
- Opacity from button to turn Modifiers on/off is increased to improve its visibility.
- Breather can now accept formulas

## 0.8.18 [2021-11-28]
### Added
- Styling changes on Apply Damage window to highlight applicable damage or toughness test
- On Roll Settings, an Option to indicate if Stunt Points from Stunt Attack maneuver stacks with Stunt Points generated by Doubles.
- Option to GMs to enable automatic deduction of Power Points when rolling a Power - and a warning message when using a Power without the necessary points.

### Fixed
- A few rolls from chat to working as expected
- Texts not showing properly on Roll Settings menu
- Extra Stunt Points from Roll Settings are now only summed to total SP from roll if the roll actually generates SPs

## 0.8.17 [2021-11-26]
### Added
- You have a Breahter button on character sheet, close to Health/Fortune/Marks.
- Hover AGE Roller to find the "Breather" option, so you can click it to send a Breather command to all of your selected tokens.
- GMs can access System Settings to configure how effect is a Breather.

### Fixed
- Bug preventing damage output from chat cards.

## 0.8.16 [2021-11-20]
### Added
- Stunt Attacks! When opening the Roll Dialog, and Option will appear to set the roll as a Stunt Attack and add bonus to generated Stunt Points if the test is successful.
- Game setting to indicate the amount of Stunt Points generated by Stunt Attack.
- Added an extra field for Relationship item type, to be the "maximum" Intensity, so it will be easier to track expenditure.
- Added buttons to increase/decrease Intensity directly from character sheet.

### Fixed
- Bug preventing edition of Membership item types after adding it to Actors.

## 0.8.15 [2021-11-19]
### Fixed
- Rules to apply damage reviewed for the different Modern AGE game modes.
- Better compatiblity with Dice so Nice (stunt die now has pins or number depending on user choice).

## 0.8.14 [2021-11-14]
### Fixed
- Copying Effects from "The Expanse" resulted in no effect being copied.

## 0.8.13 [2021-11-14]
### Fixed
- Damage Inputs on Apply Damage window were note responding correctly to all buttons or manual inputs.

## 0.8.12 [2021-11-13]
### Changed
- When applying damage using context menu from roll chat card, the system will identify if damage type is valid before calling the Apply Damage application.

## 0.8.11 [2021-11-13]
### Added
- Added context menu options on chats when right-clicking roll cards. Options added to Heal character and to Apply Damage to all selected tokens. This implementation will not be available if you are using Modern AGE (alternate damage: Injury). Note: you can also "heal" Organizations using this method, but damaging it is still not possible.

## 0.8.10 [2021-11-10]
### Fixed
- Organization image will fit sheet space and it will keep proportion.
- Organization abilities now show up properly in character sheet.
- Combat Ratings now fit evenly in the sheet.

## 0.8.9 [2021-11-10]
### Added
- Organization as Actor
- Context menu (right-click) to access all Item types on both Character sheets (delete and edit options are only accessible that way)

### Fixed
- Some unauthorized items were able to be created on different Actor types (more than 1 focus with the same name, Spaceship Features could be created on Characters).
- Fine tuning French translation.
- Issue preventing from rolling Focus correctly when using context menu to add roll modifiers.

## 0.8.8 [2021-10-30]
### Added
- Conditions Workshop, to create custom Conditions and Token Effect. Only GMs can access. To access Conditions Workshop, hover Age Roller icon and select the option in the right-hand side menu.

### Fixed
- Flavor incorrect on chat card when rolling Focus from stat block sheet.
- Correct damage deduction when applying damage using Ballistic damage.
- When performing migration, invalid tokens were created on scenes on to top left corner.

## 0.8.7 [2021-10-13]
### Added
- Link to system's wiki when hovering AGE Roller icon.

### Fixed
- Bug preventing rolling Toughness Test by clicking on whipered chat card.
- Sending damage card to chat when using Injury damage system, dice sound effect won't be played.

## 0.8.6 [2021-10-05]
### Fixed
- Issue causing tokens created from player-owner characters to be created without health bar.
- Income/Resources roll working again
- Tests without declared Target Number will no longer return MISS for every roll.
- French localization correction.

## 0.8.5 [2021-10-04]
### Fixed
- Wrong text on Apply Damage window.
- If armor was higher then damage taken, tokens were "healed" instead of just not taking damage.

## 0.8.4 [2021-10-04]
### Fixed
- Button on Apply Damage dialog displaying wrong text.

## 0.8.3 [2021-10-03]
### Added
- After using chat button to apply damage to tokens, a chat message with summary of all damage dealt will be sent privatelly to game master, for a quick review.
- Included automation to apply damage when using Injury system. The following options are available: (1) force selected tokens to roll for Toughness and evaluate their chat outputs and them apply Injuries using buttons inside each chat card; (2) Let all tokens roll for Toughness and then automatically apply Injuries on target (a message will be sent privately to GMs with summary); (3) Allow players to roll the Toughness Test for their owned tokens - each player will receive a whispered message from GM with a button to roll for the Toughness Test with all necessary modifiers already set; with GM opted for the "Inflict Injury" option, the message with the roll will inform the Injury taken. If the option was no selected, the user will be prompted to select with Injury to take in a failed roll.

### Fixed
- When applying more damage then the current total of Health or Fortune, final value for token will be zero (and not a negative number as before).

## 0.8.2 [2021-09-29]
### Added
- Modern AGE Companion alternate damage Injury is now a selectable option. Basic Toughness roll implemented, no automation (yet). Check [Injury Bar wiki](https://github.com/vkdolea/age-system/wiki/Injury-bar) for details on how it works.

### Fixed
- When applying damage, armor division (due to Piercing) is now rounded down.
- Half damage from attacks with untrained weapon (from Weapon Groups) is now rounded down.
- Armor values not showing up properly on block sheet when ballistic armore is used.

## 0.8.1 [2021-09-28]
### Fixed
- Item sheets not opening when Weapon Groups setting is in use.

## 0.8.0 [2021-09-27]
### Added
- Damage chat card now have "Apply Damage" button to automate damage to all selected tokens.
- When "Health Tracking" is selected as Modern AGE (or its variants) and "Game Mode" is set to "Pulp" or "Cinematic", all damages will be have 2 added.
### Changed
- "Use Toughness" and "Use Impact and Ballistic Armor" deprecated in favor of "Health System" setting. This simplication was necessary to enable damage automation.
### Fixed
- Focus bonus disappears if 2 or more items had a Focus bonus.
- CSS styling issue preventing some icons from different modules from being displayed.
- Changed styling of damage chat cards.

## 0.7.16 [2021-08-29]
### Fixed
- Bug preventing Mod to Aim to be taken into accound when rolling.

## 0.7.15 [2021-08-28]
### Added
- New chat card for weapon damage (in preparation for damage automation).
### Fixed
- Yet another bug causing some damages to be only half the value expected when using Weapon Groups.

## 0.7.14 [2021-08-27]
### Fixed
- Bug causing Weapon Groups to apply to Focus, Ability rolls, etc.

## 0.7.13 [2021-08-26]
### Fixed
- Bug causing games without Weapon Group settings to always penalize damage and attack rolls.

## 0.7.12 [2021-08-26]
### Fixed
- Bug prevent some item sheets from opening.

## 0.7.11 [2021-08-25]
### Added
- Weapon Group support for Fantasy AGE, Blue Rose and Dragon AGE.
### Fixed
- Bug causing errors when deploying tokens.

## 0.7.10 [2021-07-17]
### Added
- Added context menu for items on block sheets.
- Added aid bar to stat block sheet.

## 0.7.9 [2021-06-30]
### Added
- Stat block sheet implemented.
### Fixed
- Item template correction (Talent *activate* field added).

## 0.7.8 [2021-06-25]
### Fixed
- French translation correction.
- Talent degree is now showing up again in front of Talent name.
- Bug preventing Condition selection from character sheet.

## 0.7.7 [2021-06-24]
### Added
- Picture on Honorifics and Membership item sheets.
- System Setting option to indicate the Initiative focus (world specific).
- Added arrows up and down in front of Weapon and Item name (Main Tab) as a quantity counter for these item types.
- Quantities will always show up inside brackets.
- After rolling a weapon check with Aim box checked, it will be unchecked automatically.
### Fixed
- Styling issue causing bold characters to be blurred.
- Styling issue causing item names on Persona Tab to be convoluted if it is 3+ lines long.

## 0.7.6 [2021-06-20]
### Added
- Rolling items to chat will honor chat option selection. Shift+Click will override this option and submit a self roll.
- Armor Strain as Item Modifier.
### Fixed
- Chat card buttons restyled, so they will have coherent look based on other buttons in the system. Chat cards rolled previously will lose their buttons' styling, but clicking the name will still roll the test.
- Bug preventing damage options dialog box from being pre-filled in with options from a chat button when using Right Click.

## 0.7.5 [2021-06-17]
### Changed
- Left click on attack/damage buttons will roll directly.
- Right click on attack/damage buttons will open roll options.
- Only player owners (and GMs) will be able to see buttons from chat cards to roll damage, healing and fatigue.
### Added
- Game setting added to allow Observers to roll Abilities, attacks and Damage from Observed character sheet or chat cards.
- When rolling to chat weapon and arcana cards, buttons will show up to roll attack and damage. Only players with permission to control the actor/token will see and be able to interact with the buttons.
- When rolling an Item to Chat using Shift + Right click, the roll will be a Self Roll (i.e., whispered to self).

### Fixed
- Non breaking error when loading a world without Item compendia.
- Shift + RightClick on AGE Roller will know correctly blind roll 1d6 to GM.
- Rolls from chat were not using data form unlinked token, only from Actor.
- Bug preventing Power Force to be taken into account when calculating total.
- Fixed a bug which was preventing data migration from happening on newer releases.
- Fixed a bug preventing Item mods from older version from showing up automatically on item sheets.

## 0.7.4 [2021-06-08]
### Fixed
- Chat message hardcoded when other players roll blind.

## 0.7.3 [2021-06-08]
### Fixed
- Bug causing Dice so Nice animation to be played twice.

## 0.7.2 [2021-06-07]
### Added
- By default, clicking on "Roll Damage" button on chat card will bring the damage options menu.

### Fixed
- Issued preventing Spaceship Features deletion.
- Text fields on characters' Persona tab was adding extra white spaces when selecting another field.
- Text fields on GM Secret Notes on Spaceship and Vehicle sheets were unreadable when certain color schemes were used.
- Targeted attacks on token are working again.
- Dice rolls shall be consistent with method selected on chat command (Public Roll, Private GM Roll, Blind GM Roll, Self Roll).
- Changing multiple System Settings at once no longer cause some not being updated.
- Corrected Spanish and Portuguese (Brazilian) localization.

## 0.7.1 [2021-06-01]
### Fixed 
- Updated French localization.
- Corrected a few typos on Brazilian Portuguese localiztion.
- Addressed styling issue causing a text fileds to have the same color as background.

## 0.7.0 [2021-05-30]
### Added
- New fancy layout for Vehicle sheet.
- Added notes visible only by GM on each actor sheet (Character, Vehicle, Spaceship).
- New tabs for Character sheet: Main (game stats), Persona (character notes), Effects (effects applied to character).
- Main Tab: the usual rollable game stats.
- Persona Tab: Biography (AKA the old nameless field in the header), Distinctive Features, Languages, Goals and Player & GM Secret Notes (only GM and actor owner can see this field), GM Notes (notes visible only by GM).
- Effects Tab: a hub for all Conditions, Active Effects and bonuses granted from Items. Conditions, Active Effects and Item Modifiers are managed here. There is a link to open the item sheet granting a particular modifier.
- Vehicles: "Custom" is now an option for Velocity parameter, which will highlight the appropriate Damage table row.
- When creating a new token, Bar1 will be set to Health/Fortune and Bar2 will be set as Power (Magic) Points (if using this rule is on) or it will be set to Conditions (if this option is in use). If none is used, Bar2 will not be filled.
- When a token is created out of a Player Owned character/vehicle/spaceship, token's Disposition will be set to Friendly.
- Player Owned actors tokens will always be created with the Link Actor Data option checked. It can be changed afterwards.
- Conditions (The Expanse) are not optional anymore - they are always available.
- Conditions tooltip now pops up close to mouse pointer.
- Added new Item Modifiers: Focus, Attack Bonus, All Test. Look at [AGE System (unofficial) wiki](https://github.com/vkdolea/age-system/wiki) for more details.
### Fix
- Expanded "Range" field for weapons to accomodate bigger numbers.
- Issue causing modified Ability value to be hidden even when a Modifier was applied to it.
- Bug freezing Maximum Conviction to 3.
- Code cleanup.

## 0.6.5 [2021-05-01]
### Fix
- Bug causing spaceship description to disappear when sending to compendium.

## 0.6.4 [2021-04-26]
### Fix
- Breaking bug on French localization.

## 0.6.3 [2021-04-25]
### Added
- Brazilian Portuguese localization.

## 0.6.3 [2021-04-25]
### Added
- Brazilian Portugues localization.

## 0.6.2 [2021-04-24]
### Added
- Updated French localization
### Fix
- Tooltip fixed on "Test" button Power & Arcana sheet.
- Styling on Modifiers and Description tabs on Item sheets.

## 0.6.1 [2021-04-22]
### Added
- Tracker (Complication, Churn, Serendepity) and Roller can now be dragged, and new position will be memorized. Point mouse slightly above Tracker or Roller and a Drag Bar will appear. Click and drag to reposition. Right click Drag Bar to return to original position!
### Fix
- Serendipity tracker now set default value as Deactivated when new world is created.
- Characters can now be draged to Spaceships.
- Description field for spaceships now have correct line spaces between paragraphs.
- Fixed issued preventing Speed to assume values other than 10.

## 0.6.0 [2021-04-19]
### Added
- Serendipity tracker (Modern AGE Companion).
- Complication tracker (Modern AGE Companion).
- Churn tracker (The Expanse RPG).
- Right Clicking the Age Roller icon will roll 1d6 (use Left Click + Alt to modify the standard 3d6 roll).
- Added new color sets for character sheet.
- Added Spaceship as Actor.
- Added Spaceship Features item, to add Qualities, Flaws and Weapons to spaceships.
- Hindered/Exausted and Helpless/Restrained conditions now affect Speed parameter accordingly. Contributor: Discord user *schlosrat (he/him) #1091*.
### Fix
- Fixed bug preventing MCE editor to enter editing mode in some Item sheets.

## 0.5.1 [2021-03-25]
### Fix
- Fixed a bug causing Spanish localization to display French text.

## 0.5.0 [2021-03-25]
### Added
- Added an Age Roller close to hotbar. Click to roll 3d6 and check stunts. Right click to be prompet to add modifier and TN.
- Added to vehicle sheets: Armor Rating, Cover, Total Passengers Capacity and Custom Damage for Collision/Sideswipe.
- On vehicles damage table, line representing vehicle's Velocity Class will have **bold** characters.
- On Configure Settings it is now possible to configure the flavor text as Health and Fortune.
- Dice so Nice users can now can select their Stunt Die colorset option on System Settings.
### Fix
- Migration issue could cause Conditions not to be created properly on migrated Actors.
- Bug preventing rolling a Focus using a different Ability (or none).
- When an Actor is deleted from game/directory, it will also be removed from vehicles' passenger list the next time the sheet is updated.
- Fixed a bug causing the text field on character sheet header to be innacessible in some browsers.
- Application will not reload after changing colorsets on "Configure Settings".
- Color Scheme won't reset when Player changes browser or delete browser historic.
- "Use Power Points" and "Focus Compendium" settings are now accessible only for GMs.
- Empty fields in the constant part of damage builder will no longer return "null" on damage formula.

## 0.4.1 [2021-02-22]
### Added
- Vehicles as Actors - GM and trusted players may drag and drop Actors from directory to add as passengers. All players with Owner privilege of a Vehicle will be able to roll for Maneuvers and Damage.

## 0.4.0 [2021-02-05]
### Added
- Options to Add Focus to damage and an arbitraty number for Stunt Die now shows up When ALT + Click to roll damage.
- Powers now have option to roll as Damage or Healing.
- Added option to indicate a Power as resistable, and add which Ability (Focus) is used to resist.
- Damage/Healing Powers have a "Resisted Effect" to indicate the damage/healing roll when target resists.
- Added buttons on chat message to roll "resisted damage/healing" from applicable Powers.
- Ronin Green color scheme included.
- Player can select which Ability will be used to check Power's Fatigue - previously all Fatigue checks were based on Willpower.
- Fatigue chat message now will not show Damage/Fatigue buttons.
### Fixed
- Bug causing chat message causing damage/fatigue rolls from unliked tokens to roll from Actor.
- Bug preventing Talent degree to display on character sheet.
- Restyled chat message buttons.

## v0.3.1 [2021-01-26]
### Fixed
- Incorrect link on system.json preventing system to update automatically using FoundryVTT software.

## v0.3.0 [2021-01-25]
### Added
- Press Alt key when rolling a roll check to bring menu with options to set TN, add modifier and Attack to Damage trade off (this one only when rolling weapon attacks).
- When targeting a token and rolling an weapon attack, roll will be check versus target's Defense (attack selecting multiple tokens warns user to select only one token to attack).
- When attacking a token or when rolling versus a TN, chat card will show "Success" or "Miss" - if the check is a "Miss", stunt points will not be generated.
- Default macro (when dragging Power or Weapon to macro bar) behaviour is rolling the Item without prompting for a dialog box. Setting second argument to "true" after in the macro script it will prompt user for roll options (i.e., it will simulate the Click + Alt on character sheet roll).
- When rolling damage, use Alt + Click to open menu to input extra damage options (extra dice and flat bonus/penality).
- Added 4 and 12 hours option for casting time.
### Fixed
- Rolling Focus with another Ability from Focus' context menu now functional.
- Fixed labeling on Cost field of equipment should "Purchase TN" instead of "Cost".
- Styling on Power sheet causing PP cost field to disapear.
- Data migration issues when preventing Speed mod to be include to some items.

## v0.2.4 [2021-01-21]
### Added
- French localization by Discord user *Imposator#8090*.
### Fixed
- Version issue on 0.2.3 causing it to behave as 0.2.2.

## v0.2.3 [2021-01-20]
### Added
- When selecting a input field, the text will be focused for quick edit.
### Fixed
- Issue causing worlds created on versions 0.2.1 and earlier not compatible to version 0.2.2.

## v0.2.2 [2021-01-17]
### Added
- Added Speed Modificator.
- Added Settings option to include Conditions (actual rolls and characteristics modificators not included).
- When rolling damage from chat, added options to add Focus, Stunt Die or both to damage.
### Fixed
- Arcana/Power Fatigue rolls were previously based on Power's key Ability, no reverted to Willpower.
- Fixed "yards" abbreviation to "yd" on grid map.

## v0.2.1 [2021-01-10]
### Fixed
- Focus context menu (to edit, remove, show and roll with another Ability) is working again.

## v0.2.0 [2021-01-09]
### Added
- Header from chat cards when rolling items shows different text.
- Option to use GP / SP / CP as a wealth type.
- Support to drag Weapons and Powers to marcobar.
- Cost and Minimum STR fields now accepts text input.
- Extra field on weapon chards to input max/long range.
### Fixed
- Removed unnecessary arguments from ageRollCheck.
- When equip/activate icon is clicked on character sheet, only this element is updated on Item object and not the whole entity.

## v0.1.1 [2021-01-05]
### Fixed
- Minimum and compatible versions updated on system.json.

## v0.1.0
### Added
- Checkbox to indicate primary Abilities.
- Option to hide primary Abilities checkbox if not used.
- Option to use Impact and Ballistic armor or generic Armor.
- Added field in character sheet to track Threshold during Advanced Tests.
- Shield icon working to equip/activate items. Unequiped/unactive items do not add bonuses to character.
- Added custom icons for each item type and character, and users are allowed to change them as they please.
### Fixed
- Fixed an error causing Currency input to be disabled.
- Added missing Membership sheet template.
- Fixed styling issue causing all item name container to be slightly shorter than other sheet rows.

## 2020.12.31
- Included Ancestry/Race/Origin field with selection on Settings
- Added option to change label between Profession/Class
- Damage formula for items know support no Ability selected
- Added a horizontal line to

## 2020.12.29
- Added functional color schemes for Modern AGE, Fantasy AGE, Threefold and Dragon AGE books.
- Fixed bug causing Talent item to be reset when dragging it to character sheet.
- Fixed bug causing Ability values disappearing from character sheet.

## 2020.12.28
- Added damage type (stun, wound, impact, ballistic, penetrating) on damage roll char card.

## 2020.12.27
- Added Settings menu to swap setting specific data (Fatigue, Power Points, Fatigue, Conviction, Currency, Income, Resources, Toughness).
- Dragon AGE and Core AGE abilities are now supported, only select the desired at Settings.
- Added settings to change game mode (Gritty, Pulp, Cinematic), but no practical changes on the system.
- Added setrings to change color schemes, but not functional (current system scheme is the "Modern Blue").