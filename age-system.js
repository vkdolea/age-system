import * as Settings from "./modules/settings.js";
import {ageSystem} from "./modules/config.js"
import ageSystemItemSheet from "./modules/sheets/ageSystemItemSheet.js"
import ageSystemCharacterSheet from "./modules/sheets/ageSystemCharacterSheet.js"
import {ageSystemActor} from "./modules/ageSystemActor.js"
import {ageSystemItem} from "./modules/ageSystemItem.js"
import * as AgeChat from "./modules/age-chat.js"
import * as Setup from "./modules/setup.js"

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

    CONFIG.ageSystem = ageSystem;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("age-system", ageSystemItemSheet, {makeDefault: true});

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("age-system", ageSystemCharacterSheet, {makeDefault: true});

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

});

Hooks.once("ready", function() {
    // Register System Settings related do Focus Compendium
    Settings.loadCompendiaSettings();
    const setCompendium = game.settings.get("age-system", "masterFocusCompendium");
    ageSystem.focus = Settings.compendiumList(setCompendium);
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

    // Add color scheme to chat message // Not in use anymore - chat rolls keep the color from the scheme used originally
    // Setup.addColorScheme(html);
});