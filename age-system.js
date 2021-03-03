// import * as Macros from "./modules/macros.js";
import {ageSystem} from "./modules/config.js";
import ageSystemItemSheet from "./modules/sheets/ageSystemItemSheet.js";
import ageSystemCharacterSheet from "./modules/sheets/ageSystemCharacterSheet.js";
import ageSystemVehicleSheet from "./modules/sheets/ageSystemVehicleSheet.js";
import {ageSystemActor} from "./modules/ageSystemActor.js";
import {ageSystemItem} from "./modules/ageSystemItem.js";
import { createAgeMacro } from "./modules/macros.js";
import { rollOwnedItem } from "./modules/macros.js";
import { AgeRoller } from "./modules/age-roller.js";

import * as Settings from "./modules/settings.js";
import * as AgeChat from "./modules/age-chat.js";
import * as Setup from "./modules/setup.js";
import * as migrations from "./modules/migration.js";

// const ageSystemGlobal = {};
window.ageSystem = ageSystem;

async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/age-system/templates/partials/bonus-desc-sheet.hbs",
        "systems/age-system/templates/partials/dmg-block-sheet.hbs",
        "systems/age-system/templates/partials/bonuses-sheet.hbs",
        "systems/age-system/templates/partials/active-bonuses.hbs",
        "systems/age-system/templates/partials/ability-focus-select.hbs",
        "systems/age-system/templates/partials/cost-resource-block.hbs",
        "systems/age-system/templates/partials/play-aid-bar.hbs",
        "systems/age-system/templates/partials/item-image-sheet-card.hbs",
        "systems/age-system/templates/partials/conditions-block.hbs",
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

    console.log("age-system | Entering a new AGE...");
    console.log(ageSystemText);

    // Create a namespace within the game global
    game.ageSystem = {
        migrations: migrations,
        rollOwnedItem
    };

    CONFIG.ageSystem = ageSystem;
    window.ageSystem = ageSystem;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("age-system", ageSystemItemSheet, {makeDefault: true});

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("age-system", ageSystemCharacterSheet, {
        types: ["char"],
        makeDefault: true,
        // label: "DND5E.SheetClassCharacter"
    });
    Actors.registerSheet("age-system", ageSystemVehicleSheet, {
        types: ["vehicle"],
        makeDefault: true,
        // label: "DND5E.SheetClassCharacter"
    });

    ageSystem.ageRoller = new AgeRoller({
        popOut: false,
        minimizable: false,
        resizable: false,
        id: 'age-roller',
        template: 'systems/age-system/templates/rolls/age-roller.html',
        classes: []
      })

    // Define extra data for Age System Actors
    CONFIG.Actor.entityClass = ageSystemActor;

    // Define extra data for Age System Items
    CONFIG.Item.entityClass = ageSystemItem;

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
});

Hooks.once("ready", function() {
    ageSystem.ageRoller.refresh()
    // Prepare Actors dependent on other Actors
    for(let e of game.postReadyPrepare){
        e.prepareData();
    }

    // Register color scheme
    ageSystem.colorScheme = game.settings.get("age-system", "colorScheme");
    
    // Register System Settings related do Focus Compendium
    Settings.loadCompendiaSettings();
    const setCompendium = game.settings.get("age-system", "masterFocusCompendium");
    ageSystem.focus = Settings.compendiumList(setCompendium);

    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createAgeMacro(data, slot));

    // // Determine whether a system migration is required and feasible
    if ( !game.user.isGM ) return;
    const currentVersion = game.settings.get("age-system", "systemMigrationVersion");
    const NEEDS_MIGRATION_VERSION = "0.4.0";
    // const COMPATIBLE_MIGRATION_VERSION = "0.7.9";
    const needsMigration = currentVersion && isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
    if ( !needsMigration ) return;

    // Perform the migration
    // if ( currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion) ) {
    //     const warning = `Your AGE System data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`;
    //     ui.notifications.error(warning, {permanent: true});
    // }
    migrations.migrateWorld();

});

// If Compendia are updated, then compendiumList is gathered once again
Hooks.on("renderCompendium", function() {
    const setCompendium = game.settings.get("age-system", "masterFocusCompendium");
    ageSystem.focus = Settings.compendiumList(setCompendium);
});

Hooks.on("renderageSystemItemSheet", (app, html, data) => {
    // Add item type on title bar
    Setup.nameItemSheetWindow(app);
    // Hide fatigue entries if Fatigue is not in use
    Setup.hideFatigueEntry(html);
});

Hooks.on("renderageSystemCharacterSheet", (app, html, data) => {
    // Hide non used Abilities and order Ability Boxes in alphabeticaly
    Setup.charSheetSetup(app, html, data);
    // Hide primary Abilities checkbox
    Setup.hidePrimaryAblCheckbox(html);
});

Hooks.on("renderChatLog", (app, html, data) => AgeChat.addChatListeners(html));

Hooks.on("renderChatMessage", (app, html, data) => {
    // Hide chat message when rolling to GM
    AgeChat.selectBlindAgeRoll(app, html, data);
});