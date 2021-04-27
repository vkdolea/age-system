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

export function abilitiesName() {
    // Capture what is the ability set to be used
    const settingAblOption = game.settings.get("age-system", "abilitySelection");
    const ablOptions = CONFIG.ageSystem.abilitiesSettings;
    const ablType = ["main", "dage"];

    for ( let o of ablType ) {
        const localized = Object.entries(ablOptions[o]).map(e => {
            return [e[0], game.i18n.localize(e[1])];
        });
        // if ( !noSort.includes(o) ) localized.sort((a, b) => a[1].localeCompare(b[1])); // All entries are sorted
        localized.sort((a, b) => a[1].localeCompare(b[1]));
        ablOptions[o] = localized.reduce((obj, e) => {
            obj[e[0]] = e[1];
            return obj;
        }, {});
    }

    CONFIG.ageSystem.abilities = ablOptions[settingAblOption];
}

// Hide checkboxes to select Primary Abilities
export function hidePrimaryAblCheckbox(html) {
    const primaryAblShow = game.settings.get("age-system", "primaryAbl");
    const boxes = html.find(".ability-box .primary-secondary");
    if (!primaryAblShow) {
        for (let k = 0; k < boxes.length; k++) {
            const e = boxes[k];
            e.style.display = "none";
        };
    }
};

export function hideFatigueEntry(html) {
    // Capture what is the ability set to be used
    const useFatigue = game.settings.get("age-system", "useFatigue");

    // Hide HTML elements with use-fatigue-true class
    if (!useFatigue) {
        const fatigueUsers = html.find(".use-fatigue-true");
        for (let k = 0; k < fatigueUsers.length; k++) {
            const e = fatigueUsers[k];
            e.style.display = "none";
        };
    };
};

export function addColorScheme(html) {
    const selectedScheme = game.settings.get("age-system", "colorScheme");
    const colorClass = `colorset-${selectedScheme}`;
    html.find(".colorset-selection").addClass(colorClass)
}

export function nameItemSheetWindow(ageSystemItemSheet) {

    // Add item type in the title bar within brackets
    const i = ageSystemItemSheet.item.type.toLowerCase();
    const itemType = i[0].toUpperCase() + i.slice(1);
    let itemWindowId = `item-sheet-${ageSystemItemSheet.item.id}`;
    if (ageSystemItemSheet.actor !== null) {
        itemWindowId = `actor-${ageSystemItemSheet.actor.id}-${itemWindowId}`;
    };
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