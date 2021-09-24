// import * as Macros from "./modules/macros.js";
import {ageSystem} from "./modules/config.js";
import ageSystemSheetItem from "./modules/sheets/ageSystemSheetItem.js";
import ageSystemSheetCharacter from "./modules/sheets/ageSystemSheetCharacter.js";
import ageSystemSheetCharStatBlock from "./modules/sheets/ageSystemSheetCharStatBlock.js";
import ageSystemSheetVehicle from "./modules/sheets/ageSystemSheetVehicle.js";
import ageSystemSheetSpaceship from "./modules/sheets/ageSystemSheetSpaceship.js";
import ageActiveEffectConfig from "./modules/sheets/ageActiveEffectConfig.js";
import {ageSystemActor} from "./modules/ageSystemActor.js";
import {ageEffect} from "./modules/ageEffect.js";
import {ageToken} from "./modules/ageToken.js";
import {ageSystemItem} from "./modules/ageSystemItem.js";
import { createAgeMacro } from "./modules/macros.js";
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
        `${path}ability-focus-select.hbs`,
        `${path}active-bonuses.hbs`,
        `${path}bonus-desc-sheet.hbs`,
        `${path}bonuses-sheet.hbs`,
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
            ageSystemSheetCharStatBlock,
            ageSystemSheetVehicle,
            ageSystemSheetSpaceship,
            // ageActiveEffectConfig,
            ageSystemSheetItem,
            AgeRoller,
            AgeTracker
        },
        dice: Dice,
        migrations: migrations,
        rollOwnedItem,
        entities: {
            ageSystemActor,
            ageToken,
            ageSystemItem,
            ageEffect
        }
    };

    CONFIG.ageSystem = ageSystem;

    // Define Token Icons
    CONFIG.statusEffects = ageSystem.AGEstatusEffects;
    // Changing a few control icons
    CONFIG.controlIcons.defeated = "systems/age-system/resources/imgs/effects/hasty-grave.svg"

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("age-system", ageSystemSheetCharacter, {
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
    CONFIG.Token.objectClass = ageToken;
    CONFIG.Item.documentClass = ageSystemItem;
    CONFIG.ActiveEffect.documentClass = ageEffect;
    // Saving this customization for a later implementation
    // CONFIG.ActiveEffect.sheetClass = ageActiveEffectConfig;

    // Load partials for Handlebars
    preloadHandlebarsTemplates();

    // Register System Settings
    Settings.registerSystemSettings();

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

    // Handlebar to identify type of Effect
    Handlebars.registerHelper('ageffect', function(mask, options) {
        for (let o = 0; o < options.length; o++) {
            const e = options[o];
            if (e[1] === mask) return e[0]
        }
        return `${mask} (${game.i18n.localize("age-system.custom")})`;
    });

    // Handlebar returning array with Focus for a given Ability
    Handlebars.registerHelper('focusbyabl', function(focus, abl) {
        return focus.filter(f => f.data.useAbl === abl)
    });

    // Handlebar returning array with equiped weapon
    Handlebars.registerHelper('equippedwpn', function(weapons) {
        return weapons.filter(f => f.data.equiped === true)
    });

    // Handlebar returning array with active Power dealing damage
    Handlebars.registerHelper('dmgpower', function(powers) {
        return powers.filter(p => p.data.activate === true && (p.data.hasDamage || p.data.hasHealing))
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

    // Handlebar to build damage summary on chat card
    Handlebars.registerHelper('termOperator', function(diceTerms, k) {
        if (k === 0) return ``;
        const op = diceTerms[k-1].operator;
        return op === `+` ? `` : op;
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

});

Hooks.once("setup", function() {
    // Localize conditions
    for (let c = 0; c < ageSystem.conditions.length; c++) {
        const cond = ageSystem.conditions[c];
        ageSystem.conditions[c].name = game.i18n.localize(ageSystem.conditions[c].name);
        ageSystem.conditions[c].desc = game.i18n.localize(ageSystem.conditions[c].desc);
    }

    // Localize Abilities' name
    Setup.abilitiesName();

    // Localize Effects Name and build object
    Setup.localizeAgeEffects();

    // Localize Item modifier label
    // Setup.localizeModifiers();

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
    game.ageSystem.ageRoller.refresh()

    // Check if Dice so Nice is active to register Stunt Die option
    if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
        import("/modules/dice-so-nice/DiceColors.js").then((diceColors) => {
            
            const colorset = diceColors.COLORSETS;
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
            if (colorChoices !== {} && colorChoices) {
                // After loading all modules, check if Dice so Nice is installed and add option to select Stunt Die colorset                
                Settings.stuntSoNice(colorChoices);
                // Identify if user has registered Dice so Nice Stunt Die option
                const stuntSoNiceFlag = game.user.getFlag("age-system", "stuntSoNice");
                if (stuntSoNiceFlag) game.settings.set("age-system", "stuntSoNice", stuntSoNiceFlag);
                if (!stuntSoNiceFlag) game.user.setFlag("age-system", "stuntSoNice", game.settings.get("age-system", "stuntSoNice"));
            };
        });
    };

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
    if (!userGroups) {
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

    // Select weapon damage type based on Ballistic armor
    const useBallisticArmor = await game.settings.get("age-system", "useBallisticArmor");
    CONFIG.ageSystem.settings = {
        useBallistic: useBallisticArmor
    };
    CONFIG.ageSystem.damageSource = useBallisticArmor ? CONFIG.ageSystem.damageSourceOpts.useBallistic : CONFIG.ageSystem.damageSourceOpts.noBallistic;

    // Set Health System configuration
    const hstype = await game.settings.get("age-system", "healthSys");
    const HEALTH_SYS = {
        type: hstype,
        mode: await game.settings.get("age-system", "gameMode"),
        useToughness: ![`basic`].includes(hstype),
        useFortune: [`expanse`].includes(hstype),
        useHealth: [`basic`, `mage`].includes(hstype),
        useInjury: [`mageInjury`, `mageVitality`].includes(hstype),
        useBallistic: [`mage`, `mageInjury`, `mageVitality`].includes(hstype),
        baseDamageTN: 13
    };
    CONFIG.ageSystem.damageSource = HEALTH_SYS.useBallistic ? CONFIG.ageSystem.damageSourceOpts.useBallistic : CONFIG.ageSystem.damageSourceOpts.noBallistic;
    CONFIG.ageSystem.healthSys = HEALTH_SYS;

    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createAgeMacro(data, slot));

    // Determine whether a system migration is required and feasible
    if ( !game.user.isGM ) return;
    const currentVersion = game.settings.get("age-system", "systemMigrationVersion");
    const NEEDS_MIGRATION_VERSION = "0.8.0";
    // const COMPATIBLE_MIGRATION_VERSION = "0.8.7";
    const needsMigration = !currentVersion || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
    if ( !needsMigration ) return;

    // Perform the migration
    // if ( currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion) ) {
    //     const warning = `Your AGE System data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`;
    //     ui.notifications.error(warning, {permanent: true});
    // }
    migrations.migrateWorld();

});

Hooks.on("createCompendium", () => {
    ageSystem.itemCompendia = Settings.allCompendia("Item");
})

// If Compendia are updated, then compendiumList is gathered once again
Hooks.on("renderCompendium", () => {
    const setCompendium = game.settings.get("age-system", "masterFocusCompendium");
    ageSystem.focus = Settings.compendiumList(setCompendium);
});

Hooks.on("renderageSystemItemSheet", (app, html, data) => {
    // Add item type on title bar
    Setup.nameItemSheetWindow(app);
});

Hooks.on("renderageSystemSheetCharacter", (app, html, data) => {
    // Hide primary Abilities checkbox
    Setup.hidePrimaryAblCheckbox(html);
});

Hooks.on("renderChatLog", (app, html, data) => AgeChat.addChatListeners(html));

Hooks.on("renderChatMessage", (app, html, data) => {
    // Hide chat message when rolling to GM
    AgeChat.sortCustomAgeChatCards(app, html, data);
});

// Prevent Items to be created on non campatible Actor types
Hooks.on("preCreateItem", (itemCreated, itemCreatedData, options, userId) => {
    // Ensure this change occurs once
    if (game.user.id !== userId) return;

    const actor = itemCreated.actor;
    const itemName = itemCreatedData.name
    const itemType = itemCreatedData.type

    if (!actor) return;

    // Avoid dropping Item on Vehicle
    if (actor.type === "vehicle") {
        ui.notifications.warn(`Items can not be droped on Vehicle Actor type.`);
        return options.temporary = true;
    };

    // Ensure only Spaceship Features are droped on Spaceships
    if (actor.type === "spaceship" && itemType !== "shipfeatures") {
        let warning = game.i18n.localize("age-system.WARNING.nonShipPartsOnShip");
        ui.notifications.warn(warning);
        return options.temporary = true;
    }
    
    // Prevent adding spaceship features to Actors
    if (actor.type === "char" && itemType === "shipfeatures") {
        let warning = game.i18n.localize("age-system.WARNING.shipPartsOnChar");
        ui.notifications.warn(warning);
        return options.temporary = true;
    }
    
    // Avoid Focus with repeated name on Actors
    if (actor.type === "char" && itemType === "focus") {
        const hasFocus = actor.items.filter(f => f.name === itemCreatedData.name && f.type === "focus");
        if (hasFocus.length > 0) {
            let warning = game.i18n.localize("age-system.WARNING.duplicatedFocus");
            warning += `"${itemName.toUpperCase()}"`;
            ui.notifications.warn(warning);
            return options.temporary = true;
        }
    }
});