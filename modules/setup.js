export function charSheetSetup(app, html, data) {
    // Capture what is the ability set to be used
    const settingAblOption = game.settings.get("age-system", "abilitySelection");
    const settingAbl = CONFIG.ageSystem.abilitiesSettings[settingAblOption];
    let settingAblArr = [];

    // Creates list in alphabetic order (after localization) of Ability names
    for (const abl in settingAbl) {
        if (Object.hasOwnProperty.call(settingAbl, abl)) {
            const l = settingAbl[abl];
            settingAbl[abl] = game.i18n.localize(l);
            settingAblArr.push(settingAbl[abl]);
        }
    }
    const settingAblSort = settingAblArr.sort(function(a, b) {
        const nameA = a.toLowerCase();
        const nameB = b.toLowerCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
    });

    // Hide abilities not in use
    const abilityName = html.find(".ability-box");
    for (let k = 0; k < abilityName.length; k++) {
        const e = abilityName[k];
        const ablName = e.querySelector("label").innerText;
        if (!settingAblSort.includes(ablName)) {e.style.display = "none"}
    };

    // Set order of ability-box according to alphabetic order
    let ablColumn = html.find(".col-1");
    let ablBoxes = ablColumn.find(".ability-box");
    let ablBoxesArr = [];
    for (const i in ablBoxes) {
        if (ablBoxes[i].nodeType == 1) { // get rid of the whitespace text nodes
            ablBoxesArr.push(ablBoxes[i]);
        }
    }
    ablBoxesArr.sort(function(a, b) {
        const nameA = a.querySelector("label").innerText.toLowerCase();
        const nameB = b.querySelector("label").innerText.toLowerCase();
        return nameA == nameB ? 0 : (nameA > nameB ? 1 : -1);
    });
    ablColumn.append(ablBoxesArr);
    
};

export function addColorScheme(html) {
    const selectedScheme = game.settings.get("age-system", "colorScheme");
    const colorClass = `colorset-${selectedScheme}`;
    html.find(".colorset-selection").addClass(colorClass)
}

export function nameItemSheetWindow(ageSystemItemSheet) {

    // Add item type in the title bar within brackets
    const itemType = ageSystemItemSheet.item.type;
    let itemWindowId = `item-${ageSystemItemSheet.item._id}`;
    if (ageSystemItemSheet.actor !== null) {
        itemWindowId = `actor-${ageSystemItemSheet.actor.id}-${itemWindowId}`;
    };
    let itemWindow = document.getElementById(itemWindowId);
    let windowHeader = itemWindow.children[0].firstElementChild;
    windowHeader.textContent += ` [${game.i18n.localize("age-system." + itemType)}]`;
};