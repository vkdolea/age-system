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

// Configure labels for Powers depending on System Setting options
export function localizePower() {
    const pFlavor = game.settings.get("age-system", "powerFlavor");
    CONFIG.ageSystem.POWER_FLAVOR = {
        name: game.i18n.localize(`age-system.powerFlavor.${pFlavor}.name`),
        namePlural: game.i18n.localize(`age-system.powerFlavor.${pFlavor}.namePlural`),
        force: game.i18n.localize(`age-system.powerFlavor.${pFlavor}.force`),
        points: game.i18n.localize(`age-system.powerFlavor.${pFlavor}.points`),
        index: game.i18n.localize(`age-system.powerFlavor.${pFlavor}.index`),
        key: pFlavor
    };
}

// Localize standard Token Effects for AGE System
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
        };
    }

    // Hide Total Ability box if it equal to Original
    const abilityBox = html.find(".ability-box")
    for (let t = 0; t < abilityBox.length; t++) {
        const e = abilityBox[t];
        const original = e.children[0].querySelector(".abl-value.original");
        const total = e.children[0].querySelector(".abl-value.total");
        if (original.value === total.value) total.remove();
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

/**
 * Sorts Objects inside and array alphabetically according to passed object key
 * @param {Array} nameArray Array of objects
 * @param {String} nameKey Object key containing name to order in Alphabetic order
 * @returns Sorted array of objects
 */
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
 * DOM Manipulation on Advancement Config sheet
 * @param {jQuery Object} html jQuery object within sheet
 */
export function prepAdvSetup (html) {
    const traitList = html.find(`.trait-listing`);
    for (let l = 0; l < traitList.length; l++) {
        const e = traitList[l];
        if (e.children.length == 0) e.style.display = "none"
    }
}

/**
 * Add customization to Actor Sheet
 * @param {object} sheet Sheet configuration data
 * @param {jQuery Object} html jQuery object whithin sheet
 * @param {object} data data used to render sheet
 */
export async function prepSheet (sheet, html, doc) {
    // Add color customization
    const base = html.closest(`.age-system.sheet`);
    const classes = [];
    const colors = [];
    for (let i = 0; i < base[0].classList.length; i++) {
        classes.push(base[0].classList[i]);
    };
    for (let k = 0; k < classes.length; k++) {
        const c = classes[k];
        if (c.indexOf(`colorset-`) > -1) colors.push(c)
    }
    if (colors.length > 0) colors.map(c => base[0].classList.remove(c))
    base[0].classList.add(`colorset-${ageSystem.colorScheme}`);
    
    // Add minimum width for Vehicle and Spaceship sheets
    if(['vehicle', 'spaceship'].includes(doc.data.type)) base.css("min-width", "665px");

    // Enrich HMTL text
    enrichTinyMCE(`div.editor-content`);
}

/**
 * Enrich TinyMCE editor text and add class on Content Links and inline rolls
 * @param {jQuery Object} html jQuery object with fields to be enriched
 */
export async function enrichTinyMCE(selector) {
    // Enrich HMTL text
    const els = $(selector);
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