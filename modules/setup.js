// Not in use, but maybe in the future...
export function localizeConfig(toLocalize, noSort) {

    // Localize and sort CONFIG objects
    for ( let o of toLocalize ) {
        const localized = Object.entries(CONFIG.ageSystem[o]).map(e => {
            return [e[0], game.i18n.localize(e[1])];
        });
        if ( !noSort.includes(o) ) localized.sort((a, b) => a[1].localeCompare(b[1]));
        CONFIG.ageSystem[o] = localized.reduce((obj, e) => {
            obj[e[0]] = e[1];
            return obj;
        }, {});
    }
}

export function localizeAgeEffects() {
    const toLocalize = ["ageEffectsKeys"];

    // Localize and sort CONFIG objects
    for ( let o of toLocalize ) {
        const localized = Object.entries(CONFIG.ageSystem[o]).map(e => {
            const label = game.i18n.localize(e[1].label);
            const mask = e[1].mask;
            return [e[0], {label, mask}];
        });
        CONFIG.ageSystem[o] = localized.reduce((obj, e) => {
            obj[e[0]] = e[1];
            return obj;
        }, {});
    }

    const originalEffects = CONFIG.ageSystem[toLocalize];
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
    CONFIG.ageSystem.ageEffectsOptions = options;
}

export function abilitiesName() {
    // Capture what is the ability set to be used
    const settingAblOption = game.settings.get("age-system", "abilitySelection");
    const ablOptions = CONFIG.ageSystem.abilitiesSettings;
    const orgAbl = CONFIG.ageSystem.abilitiesOrg;
    const ablType = [ablOptions["main"], ablOptions["dage"], orgAbl];

    CONFIG.ageSystem.abilities = localizeObj(ablOptions[settingAblOption], true);
    CONFIG.ageSystem.abilitiesOrg = localizeObj(orgAbl, false);
}

function localizeObj(source, sort = false) {
    const localized = Object.entries(source).map(e => {
        return [e[0], game.i18n.localize(e[1])];
    });
    if ( sort ) localized.sort((a, b) => a[1].localeCompare(b[1])); // All entries are sorted
    source = localized.reduce((obj, e) => {
        obj[e[0]] = e[1];
        return obj;
    }, {});
    return source
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

export function nameItemSheetWindow(ageSystemItemSheet) {
    // Add item type in the title bar within brackets
    const i = ageSystemItemSheet.item.type.toLowerCase();
    const itemType = i[0].toUpperCase() + i.slice(1);
    const itemWindowId = ageSystemItemSheet.actor ? `actor-${ageSystemItemSheet.actor.id}-item-${ageSystemItemSheet.item.id}` : `item-${ageSystemItemSheet.item.id}`;
    let itemWindow = document.getElementById(itemWindowId);
    let windowHeader = itemWindow.children[0].firstElementChild;
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