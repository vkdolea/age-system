import { ageSystem } from "./config.js";

// Not in use, but maybe in the future...
export function localizeConfig(toLocalize, noSort) {

    // Localize and sort CONFIG objects
    for ( let o of toLocalize ) {
        const localized = Object.entries(ageSystem[o]).map(e => {
            return [e[0], game.i18n.localize(e[1])];
        });
        if ( !noSort.includes(o) ) localized.sort((a, b) => a[1].localeCompare(b[1]));
        ageSystem[o] = localized.reduce((obj, e) => {
            obj[e[0]] = e[1];
            return obj;
        }, {});
    }
}

export function localizeAgeEffects() {
    const toLocalize = ["ageEffectsKeys"];

    // Localize and sort CONFIG objects
    for ( let o of toLocalize ) {
        const localized = Object.entries(ageSystem[o]).map(e => {
            const label = game.i18n.localize(e[1].label);
            const mask = e[1].mask;
            return [e[0], {label, mask}];
        });
        ageSystem[o] = localized.reduce((obj, e) => {
            obj[e[0]] = e[1];
            return obj;
        }, {});
    }

    const originalEffects = ageSystem[toLocalize];
    let options = [];
    for (const e in originalEffects) {
        if (Object.hasOwnProperty.call(originalEffects, e)) {
            const effect = originalEffects[e];
            options.push([
                effect.label,
                effect.mask,
                e
            ]);          
        }
    }
    options = sortObjArrayByName(options, 0);
    ageSystem.ageEffectsOptions = options;
}

// Select which Ability setting is used
export function abilitiesName() {
    // Capture what is the ability set to be used
    const settingAblOption = game.settings.get("age-system", "abilitySelection");
    const ablOptions = ageSystem.abilitiesSettings;
    const orgAbl = ageSystem.abilitiesOrg;
    const ablType = [ablOptions["main"], ablOptions["dage"], orgAbl];

    ageSystem.abilities = localizeObj(ablOptions[settingAblOption], true);
    ageSystem.abilitiesOrg = localizeObj(orgAbl, false);
}

// Hide checkboxes to select Primary Abilities
export function hidePrimaryAblCheckbox(html) {
    const primaryAblShow = game.settings.get("age-system", "primaryAbl");
    const boxes = html.find(".ability-box .primary-secondary");
    if (!primaryAblShow) {
        for (let k = 0; k < boxes.length; k++) {
            const e = boxes[k];
            e.remove();
            // e.style.display = "none";
        };
    }

    // Hide Total Ability box if it equal to Original
    const abilityBox = html.find(".ability-box")
    for (let t = 0; t < abilityBox.length; t++) {
        const e = abilityBox[t];
        const original = e.children[0].querySelector(".abl-value.original");
        const total = e.children[0].querySelector(".abl-value.total");
        if (original.value === total.value) total.remove();
        // if (original.value === total.value) total.style.display = "none";
    }
};

// Add item type in the title bar within brackets
export function nameItemSheetWindow(itemWindow) {
    const i = itemWindow.object.type.toLowerCase();
    const itemType = i[0].toUpperCase() + i.slice(1);
    const appId = itemWindow.appId;
    const window = document.querySelector(`div[data-appid='${appId}']`);
    const windowHeader = window.children[0].firstElementChild;
    windowHeader.textContent += ` [${game.i18n.localize("ITEM.Type" + itemType)}]`;
};

export function sortObjArrayByName(nameArray, nameKey) {
    return nameArray.sort(function(a, b) {
        const nameA = a[nameKey].toLowerCase();
        const nameB = b[nameKey].toLowerCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
    });
}

/**
 * Add customization to Actor Sheet
 * @param {object} sheet Sheet configuration data
 * @param {jQuery Object} html jQuery object whithin sheet
 * @param {object} data data used to render sheet
 */
export async function prepSheet (sheet, html, data) {
    // Add color customization
    html.addClass(`colorset-${ageSystem.colorScheme}`);
    
    // Enrich HMTL text
    enrichTinyMCE(html);
}

/**
 * Enrich TinyMCE editor text and add class on Content Links and inline rolls
 * @param {jQuery Object} html jQuery object with fields to be enriched
 */
export async function enrichTinyMCE(html) {
    // Enrich HMTL text
    const els = $(`div.editor-content`);
    for (let i = 0; i < els.length; i++) {
        els[i].innerHTML = await TextEditor.enrichHTML(els[i].innerHTML, {async: true});
    }
}

/**
 * Creates a list with modifiers and labels in alphabetic order
 * @reuturn Object with list
 */
export function modifiersList() {
    const possible = foundry.utils.deepClone(ageSystem.modifiers);
    
    const armorMods = possible.armorMods[ageSystem.healthSys.type];
    const ablMods = possible.ablMods[game.settings.get("age-system", "abilitySelection")];
    const mods = possible.generalMods.concat(armorMods, ablMods);
    if (!ageSystem.healthSys.useInjury) mods.push(possible.others[0]);
    if (game.settings.get("age-system", "useConviction")) mods.push(possible.others[1]);

    const modsObj = {};
    for (let m = 0; m < mods.length; m++) {
        const k = mods[m];
        if (!possible.modeToLocalize.includes(k)) {
            modsObj[k] = `age-system.bonus.${k}`
        } else {
            switch (k) {
                case 'impactArmor':
                    modsObj[k] = ['mage', 'mageInjury'].includes(ageSystem.healthSys.type) ? `age-system.bonus.impactArmor` : `age-system.armor`
                    break;
                case 'powerForce':
                    modsObj[k] = `age-system.bonus.${k}` // Add logics afterwards
                    break;
                case 'maxPowerPoints':
                    modsObj[k] = `age-system.bonus.${k}` // Add logics afterwards
                    break;
                case 'maxHealth':
                    modsObj[k] = game.settings.get("age-system", "healthMode") === 'health' ? `age-system.bonus.maxHealth` : `age-system.bonus.maxFortune`  // Add logics afterwards
                    // modsObj[k] = ageSystem.healthSys.useHealth ? `age-system.bonus.maxHealth` : `age-system.bonus.maxFortune`
                    break;            
                default:
                    break;
            }
        }
        
    }

    return localizeObj(modsObj, true)
}

/**
 * Localize object of strings and sort alphabetically if requested
 * @param {object} toLocalize Object with strings to localize
 * @param {boolean} sorted Indicate if object must be sorted by alphabetic order
 * @returns Localized object
 */
export function localizeObj(toLocalize, sorted = true) {
    const localized = Object.entries(toLocalize).map(e => {
        return [e[0], game.i18n.localize(e[1])];
    });
    if (sorted) localized.sort((a, b) => a[1].localeCompare(b[1]));
    return localized.reduce((obj, e) => {
        obj[e[0]] = e[1];
        return obj;
    }, {});
}