import {ageSystem} from "./modules/config.js"
import ageSystemItemSheet from "./modules/sheets/ageSystemItemSheet.js";
import ageSystemCharacterSheet from "./modules/sheets/ageSystemCharacterSheet.js"
import {ageSystemActor} from "./modules/ageSystemActor.js"
import {ageSystemItem} from "./modules/ageSystemItem.js"

// async function preloadHandlebarsTemplates() {
//     const templatePath = [
//         "systems/age-system/templates/partials/character-blocks.hbs",
//     ];

//     return loadTemplates(templatePaths);
// };

Hooks.once("init", function() {
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

    // preloadHandlebarsTemplates();

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

});