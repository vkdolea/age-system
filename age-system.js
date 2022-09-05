// import * as Macros from "./modules/macros.js";
import {ageSystem} from "./modules/config.js";
import ageSystemSheetItem from "./modules/sheets/ageSystemSheetItem.js";
import ageSystemSheetCharacter from "./modules/sheets/ageSystemSheetCharacter.js";
import ageSystemSheetCharAlt from "./modules/sheets/ageSystemSheetCharAlt.js";
import ageSystemSheetCharStatBlock from "./modules/sheets/ageSystemSheetCharStatBlock.js";
import ageSystemSheetVehicle from "./modules/sheets/ageSystemSheetVehicle.js";
import ageSystemSheetSpaceship from "./modules/sheets/ageSystemSheetSpaceship.js";
import ageSystemSheetOrg from "./modules/sheets/ageSystemSheetOrg.js";
import ageActiveEffectConfig from "./modules/sheets/ageActiveEffectConfig.js";
import {ageSystemActor} from "./modules/ageSystemActor.js";
import {ageTokenDocument} from "./modules/ageToken.js";
import {ageSystemItem} from "./modules/ageSystemItem.js";
import { createAgeMacro, removeDoubledMods } from "./modules/macros.js";
import { rollOwnedItem } from "./modules/macros.js";
import { AgeRoller } from "./modules/age-roller.js";
import { AgeTracker } from "./modules/age-tracker.js";

import * as Dice from "./modules/dice.js";
import * as Settings from "./modules/settings.js";
import * as AgeChat from "./modules/age-chat.js";
import * as Setup from "./modules/setup.js";
import * as migrations from "./modules/migration.js";

async function preloadHandlebarsTemplates() {
    const path = `systems/age-system/templates/partials/`;
    const templatePaths = [
        `${path}itemcontrols/equipment.hbs`,
        `${path}itemcontrols/honorifics.hbs`,
        `${path}itemcontrols/membership.hbs`,
        `${path}itemcontrols/power.hbs`,
        `${path}itemcontrols/relationship.hbs`,
        `${path}itemcontrols/stunts.hbs`,
        `${path}itemcontrols/talent.hbs`,
        `${path}itemcontrols/weapon.hbs`,
        `${path}ability-focus-select.hbs`,
        `${path}active-bonuses.hbs`,
        `${path}bonus-desc-sheet.hbs`,
        `${path}bonuses-sheet.hbs`,
        `${path}char-sheet-alt-main.hbs`,
        `${path}char-sheet-alt-persona.hbs`,
        `${path}char-sheet-alt-stunts.hbs`,
        `${path}char-sheet-alt-social.hbs`,
        `${path}char-sheet-alt-equip.hbs`,
        `${path}char-sheet-alt-talents.hbs`,
        `${path}char-sheet-alt-powers.hbs`,
        `${path}char-sheet-alt-effects.hbs`,
        `${path}char-sheet-alt-options.hbs`,
        `${path}char-sheet-nav-bar.hbs`,
        `${path}char-sheet-tab-main.hbs`,
        `${path}char-sheet-injury-bar.hbs`,
        `${path}char-sheet-tab-persona.hbs`,
        `${path}char-sheet-tab-effects.hbs`,
        `${path}char-sheet-tab-options.hbs`,
        `${path}char-stat-block-column1.hbs`,
        `${path}conditions-block.hbs`,
        `${path}cost-resource-block.hbs`,
        `${path}dmg-block-sheet.hbs`,
        `${path}item-card-buttons.hbs`,
        `${path}item-image-sheet-card.hbs`,
        `${path}item-options-sheet.hbs`,
        `${path}play-aid-bar.hbs`,
    ];

    return loadTemplates(templatePaths);
};

Hooks.once("init", async function() {
    const ageSystemText = `
     ___   ____________   _____            __               
    /   | / ____/ ____/  / ___/__  _______/ /____  ____ ___ 
   / /| |/ / __/ __/     \\__ \\/ / / / ___/ __/ _ \\/ __ \`__ \\
  / ___ / /_/ / /___    ___/ / /_/ (__  ) /_/  __/ / / / / /
 /_/  |_\\____/_____/   /____/\\__, /____/\\__/\\___/_/ /_/ /_/ 
                            /____/                          `;

    console.log("AGE System | Entering a new AGE...");
    console.log(ageSystemText);

    // Create a namespace within the game global
    game.ageSystem = {
        applications: {
            ageSystemSheetCharacter,
            ageSystemSheetCharAlt,
            ageSystemSheetCharStatBlock,
            ageSystemSheetVehicle,
            ageSystemSheetSpaceship,
            ageSystemSheetOrg,
            ageSystemSheetItem,
            AgeRoller,
            AgeTracker
        },
        dice: Dice,
        migrations: migrations,
        rollOwnedItem,
        // removeDoubledMods, // to be used in cases users has migration problems
        documents: {
            ageSystemActor,
            // ageToken,
            ageSystemItem
        }
    };

    Actors.unregisterSheet("core", ActorSheet);
    // Actors.registerSheet("age-system", ageSystemSheetCharacter, {
    //     types: ["char"],
    //     label: "Legacy"
    // });
    Actors.registerSheet("age-system", ageSystemSheetCharAlt, {
        types: ["char"],
        makeDefault: true,
        label: "age-system.SHEETS.charStandard"
    });
    Actors.registerSheet("age-system", ageSystemSheetCharStatBlock, {
        types: ["char"],
        label: "age-system.SHEETS.charStatBlock"
    });
    Actors.registerSheet("age-system", ageSystemSheetVehicle, {
        types: ["vehicle"],
        makeDefault: true,
        label: "age-system.SHEETS.vehicleStandard"
    });
    Actors.registerSheet("age-system", ageSystemSheetSpaceship, {
        types: ["spaceship"],
        makeDefault: true,
        label: "age-system.SHEETS.spaceshipStandard"
    });
    Actors.registerSheet("age-system", ageSystemSheetOrg, {
        types: ["organization"],
        makeDefault: true,
        label: "age-system.SHEETS.orgStandard"
    });
    
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("age-system", ageSystemSheetItem, {
        makeDefault: true,
        label: "age-system.SHEETS.itemStandard"
    });

    game.ageSystem.ageRoller = new AgeRoller({
        popOut: false,
        minimizable: false,
        resizable: false,
    });

    game.ageSystem.ageTracker = new AgeTracker({
        popOut: false,
        minimizable: false,
        resizable: false
    });

    // Define extra data for Age System (Actors, Items, ActiveEffectConfig)
    CONFIG.Actor.documentClass = ageSystemActor;
    CONFIG.Item.documentClass = ageSystemItem;
    CONFIG.Token.documentClass = ageTokenDocument;
    CONFIG.ageSystem = ageSystem;
    // Saving this customization for a later implementation
    // CONFIG.Token.objectClass = ageToken;
    // CONFIG.ActiveEffect.sheetClass = ageActiveEffectConfig;

    // Load partials for Handlebars
    preloadHandlebarsTemplates();

    // Register System Settings
    await Settings.registerSystemSettings();

    // Register Settings
    ageSystem.stuntAttackPoints = game.settings.get("age-system", "stuntAttack");
    ageSystem.breather = game.settings.get('age-system', 'breatherParam');
    ageSystem.autoConsumePP = game.settings.get('age-system', 'consumePP');

    // Useful concat Helper from Boilerplate system!
    Handlebars.registerHelper('concat', function() {
        let outStr = '';
        for (let arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('effectModeName', function(modeNumber) {
        const modeNames = [
            "EFFECT.MODE_CUSTOM",
            "EFFECT.MODE_MULTIPLY",
            "EFFECT.MODE_ADD",
            "EFFECT.MODE_DOWNGRADE",
            "EFFECT.MODE_UPGRADE",
            "EFFECT.MODE_OVERRIDE"
        ];
        return game.i18n.localize(modeNames[modeNumber]);
    })

    // Handlebar to identify type of Effect
    Handlebars.registerHelper('ageffect', function(mask, options) {
        for (let o = 0; o < options.length; o++) {
            const e = options[o];
            if (e[1] == mask) return e[0];
        }
        return `${mask} (${game.i18n.localize("age-system.custom")})`;
    });

    // Handlebar returning array with Focus for a given Ability
    Handlebars.registerHelper('focusbyabl', function(focus, abl) {
        return focus.filter(f => f.system.useAbl === abl)
    });

    // Handlebar returning array with equiped weapon
    Handlebars.registerHelper('equippedwpn', function(weapons) {
        return weapons.filter(f => f.system.equiped === true)
    });

    // Handlebar returning array with active Power dealing damage
    Handlebars.registerHelper('dmgpower', function(powers) {
        return powers.filter(p => p.system.activate === true && (p.system.hasDamage || p.system.hasHealing))
    });

    // Handlebar returning all carried itens
    Handlebars.registerHelper('carriedequip', function(items) {
        return items.filter(p => p.type === "equipment" || p.type === "weapon")
    });

    // Handlebar to itentify if Weapon Group is know
    Handlebars.registerHelper('haswgroup', function(wGroup, groupArray) {
        if (!groupArray === []) return false;
        return groupArray.includes(wGroup) ? true : false;
    });

    // Handlebar to itentify if array is empty
    Handlebars.registerHelper('isempty', function(array, abl) {
        if (!Array.isArray(array)) return false;
        array = array.filter(f => f.system.useAbl === abl)
        return array.length === 0 ? true : false;
    });

    // Handlebar to build damage summary on chat card
    Handlebars.registerHelper('termOperator', function(diceTerms, k) {
        if (k === 0) return ``;
        const op = diceTerms[k-1].operator;
        return op === `+` ? `` : op;
    });

    // Handlebar to select Talent Degree
    Handlebars.registerHelper('tdegree', function(value) {
        value = Number(value);
        if (isNaN(value)) return ""
        return ageSystem.talentDegrees[value];
    });

    // Handlebar helper to compare 2 data
    Handlebars.registerHelper("when",function(operand_1, operator, operand_2, options) {
        let operators = {
            'eq': function(l,r) { return l == r; },
            'noteq': function(l,r) { return l != r; },
            'gt': function(l,r) { return Number(l) > Number(r); },
            'or': function(l,r) { return l || r; },
            'and': function(l,r) { return l && r; },
            '%': function(l,r) { return (l % r) === 0; }
        },
        result = operators[operator](operand_1,operand_2);
      
        if (result) return options.fn(this);
        else return options.inverse(this);
    });

    // Keep a list of actors that need to prepareData after 'ready' (generally those that rely on other actor data - passengers/mounts)
    game.postReadyPrepare = [];

    // Log core version
    ageSystem.coreVersion = game.world.coreVersion;
    ageSystem.systemVersion = game.world.systemVersion

});

Hooks.once("setup", function() {
    const talentDegrees = foundry.utils.deepClone(ageSystem.mageDegrees);
    for (let i = 0; i < talentDegrees.length; i++) {
        talentDegrees[i] = game.i18n.localize(talentDegrees[i]);
    }
    ageSystem.talentDegrees = talentDegrees;
    
    // Set Health System configuration
    const hstype = game.settings.get("age-system", "healthSys");
    const HEALTH_SYS = {
        type: hstype,
        mode: game.settings.get("age-system", "gameMode"),
        healthName: game.i18n.localize(`SETTINGS.healthMode${game.settings.get("age-system", "healthMode")}`),
        useToughness: ![`basic`].includes(hstype),
        useFortune: [`expanse`].includes(hstype),
        useHealth: [`basic`, `mage`].includes(hstype),
        useInjury: [`mageInjury`, `mageVitality`].includes(hstype),
        useVitality: [`mageVitality`].includes(hstype),
        useBallistic: [`mage`, `mageInjury`, `mageVitality`].includes(hstype),
        baseDamageTN: 13
    };
    CONFIG.ageSystem.damageSource = HEALTH_SYS.useBallistic ? CONFIG.ageSystem.damageSourceOpts.useBallistic : CONFIG.ageSystem.damageSourceOpts.noBallistic;
    CONFIG.ageSystem.healthSys = HEALTH_SYS;
    
    // Specific Localization
    Setup.abilitiesName();
    Setup.localizeAgeEffects();

    // Target/Controlled option to damage/heal
    CONFIG.ageSystem.useTargeted = game.settings.get("age-system", "useTargeted");
    
    // Indicates Migration Version
    CONFIG.ageSystem.lastMigrationVer = game.settings.get("age-system", "systemMigrationVersion")
});

Hooks.once("ready", async function() {
    // Identify Colorset
    const color = await game.user.getFlag("age-system", "colorScheme");
    if (color) await game.settings.set("age-system", "colorScheme", color);
    if (!color) game.user.setFlag("age-system", "colorScheme", game.settings.get("age-system", "colorScheme"));
    // Register color scheme on global name space
    ageSystem.colorScheme = await game.settings.get("age-system", "colorScheme");

    // Tracker Handling
    // Identify if User already has ageTrackerPos flag set
    const userTrackerFlag = await game.user.getFlag("age-system", "ageTrackerPos");
    const useTracker = (game.settings.get("age-system", "serendipity") || game.settings.get("age-system", "complication") !== "none") ? true : false;
    if (!userTrackerFlag) await game.user.setFlag("age-system", "ageTrackerPos", ageSystem.ageTrackerPos);
    if (useTracker) game.ageSystem.ageTracker.refresh();

    // Age Roller
    // Handle flag
    const rollerFlag = await game.user.getFlag("age-system", "ageRollerPos");
    if (!rollerFlag) await game.user.setFlag("age-system", "ageRollerPos", ageSystem.ageRollerPos);
    game.ageSystem.ageRoller.refresh();

    // Safe copy of original Status Effects
    ageSystem.statusEffects.original = foundry.utils.deepClone(CONFIG.statusEffects);

    // Define Token Icons and In Use Token Effects
    ageSystem.statusEffects.custom = await game.settings.get("age-system", "customTokenEffects");
    let inUseConditions = await game.settings.get("age-system", "inUseConditions");
    if (!['expanse', 'custom'].includes(inUseConditions)) inUseConditions = 'custom';
    ageSystem.inUseStatusEffects = inUseConditions;
    CONFIG.statusEffects = foundry.utils.deepClone(ageSystem.statusEffects[inUseConditions]);
    
    // Changing a few control icons
    CONFIG.controlIcons.defeated = "systems/age-system/resources/imgs/effects/pirate-grave.svg"

    // Prepare Actors dependent on other Actors
    for(let e of game.postReadyPrepare){
        e.prepareData();
    }
    
    // Register System Settings related to Focus Compendium
    ageSystem.itemCompendia = Settings.allCompendia("Item");
    Settings.loadCompendiaSettings();
    const setCompendium = game.settings.get("age-system", "masterFocusCompendium");
    ageSystem.focus = Settings.compendiumList(setCompendium);

    // Register Weapon Groups (if any)
    const userGroups = game.settings.get("age-system", "weaponGroups");
    if (userGroups.length === 0) {
        ageSystem.weaponGroups = null;
    } else {
        ageSystem.weaponGroups = userGroups.split(`;`);
        for (let index = 0; index < ageSystem.weaponGroups.length; index++) {
            ageSystem.weaponGroups[index] = ageSystem.weaponGroups[index].trim();
        };
        // Sort Weapon Group names alphabetically
        ageSystem.weaponGroups.sort(function(a, b) {
            let nameA = a.toUpperCase(); // ignore upper and lowercase
            let nameB = b.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            // names must be equal
            return 0;
        });

    }
    // Check if PDFoundry is active
    if (game.modules.get("pdfoundry")?.active) ageSystem.pdfoundryOn = true;

    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => {
        if (data === {}) return false;
        const item = fromUuidSync(data.uuid);
        const itemType = item.type;
        const rollTypes = ['weapon', 'focus'];
        let hasRoll = rollTypes.includes(itemType)
        if (!hasRoll && itemType === 'power') hasRoll = item.system.hasRoll;
        if (hasRoll) createAgeMacro(item, slot);
        return !hasRoll;
    });

    // Determine whether a system migration is required and feasible
    if ( !game.user.isGM ) return;
    const currentVersion = game.settings.get("age-system", "systemMigrationVersion");
    const NEEDS_MIGRATION_VERSION = "1.0.0";
    const needsMigration = !currentVersion || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
    if ( !needsMigration ) return;
    migrations.migrateWorld();
});

// If Compendia are updated, then compendiumList is gathered once again
Hooks.on("renderCompendium", () => {
    const setCompendium = game.settings.get("age-system", "masterFocusCompendium");
    ageSystem.focus = Settings.compendiumList(setCompendium);
});

Hooks.on('chatMessage', (chatLog, content, userData) => AgeChat.ageCommand(chatLog, content, userData))
Hooks.on("createCompendium", () => {ageSystem.itemCompendia = Settings.allCompendia("Item")})
Hooks.on("renderageSystemItemSheet", (app, html, data) => {Setup.nameItemSheetWindow(app)});
Hooks.on("renderageSystemSheetCharacter", (app, html, data) => {Setup.hidePrimaryAblCheckbox(html)});
Hooks.on("renderChatLog", (app, html, data) => {    AgeChat.addChatListeners(html)});
Hooks.on("renderChatMessage", (app, html, data) => {AgeChat.sortCustomAgeChatCards(app, html, data)});
Hooks.on("getChatLogEntryContext", AgeChat.addChatMessageContextOptions);
Hooks.on('renderActorSheet', (sheet, html, data) => Setup.prepSheet(sheet, html, data));
Hooks.on('renderItemSheet', (sheet, html, data) => Setup.prepSheet(sheet, html, data));
Hooks.once('diceSoNiceReady', () => {
    const colorset = game.dice3d.exports.COLORSETS;
    let colorChoices = {};
    for (const type in colorset) {
        if (colorset.hasOwnProperty(type)) {
            const colorCode = colorset[type].name;
            const colorName = colorset[type].description;
            const newChoice = {[colorCode]: colorName}
            colorChoices = {
            ...colorChoices,
            ...newChoice
            };
        };
    };
    // Register Stunt So Nice setting
    Settings.stuntSoNice(colorChoices, Object.keys(game.dice3d.box.dicefactory.systems));
    // Identify if user has registered Dice so Nice Stunt Die option
    const stuntSoNiceFlag = game.user.getFlag("age-system", "stuntSoNice");
    if (stuntSoNiceFlag) game.settings.set("age-system", "stuntSoNice", stuntSoNiceFlag);
    if (!stuntSoNiceFlag) game.user.setFlag("age-system", "stuntSoNice", game.settings.get("age-system", "stuntSoNice"));
});