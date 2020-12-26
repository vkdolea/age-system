import {ageSystem} from "./modules/config.js"
import ageSystemItemSheet from "./modules/sheets/ageSystemItemSheet.js"
import ageSystemCharacterSheet from "./modules/sheets/ageSystemCharacterSheet.js"
import {ageSystemActor} from "./modules/ageSystemActor.js"
import {ageSystemItem} from "./modules/ageSystemItem.js"
import * as AgeChat from "./modules/age-chat.js"

async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/age-system/templates/partials/bonus-desc-sheet.hbs",
        "systems/age-system/templates/partials/dmg-block-sheet.hbs",
        "systems/age-system/templates/partials/bonuses-sheet.hbs",
        "systems/age-system/templates/partials/active-bonuses.hbs",
    ];

    return loadTemplates(templatePaths);
};

Hooks.once("init", async function() {
    console.log("age-system | Entering a new AGE...");

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

Hooks.on("renderageSystemItemSheet", function(ageSystemItemSheet) {
    
    // Add item type in the title bar within brackets
    const itemType = ageSystemItemSheet.item.type;
    let itemWindowId = `item-${ageSystemItemSheet.item._id}`;
    if (ageSystemItemSheet.actor !== null) {
        itemWindowId = `actor-${ageSystemItemSheet.actor.id}-${itemWindowId}`;
    };
    let itemWindow = document.getElementById(itemWindowId);
    let windowHeader = itemWindow.children[0].firstElementChild;
    windowHeader.textContent += ` [${game.i18n.localize("age-system." + itemType)}]`;
});

Hooks.on("renderChatLog", (app, html, data) => AgeChat.addChatListeners(html));
Hooks.on("renderChatMessage", (app, html, data) => {
    AgeChat.selectBlindAgeRoll(app, html, data);
});