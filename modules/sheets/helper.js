/**Prevent Items to be created on non campatible Actor types
 * @param actor actor document
 * @param itemType string containing Item type
 * @param itemName string with Item name
 */
export function newItemData(actor, itemData) {
    const actorType = actor.type;
    if (!Array.isArray(itemData)) itemData = [itemData];
    const warning = [];

    for (let i = 0; i < itemData.length; i++) {
        const item = itemData[i];
        
        const itemType = item.type;
        const itemName = item.name;
    
        switch (actorType) {
            case "vehicle":
                warning.push({index: i, warn: game.i18n.localize("age-system.WARNING.vehicleItem")});
                break;
            case "spaceship":
                if (itemType !== 'shipfeatures') {
                    warning.push({index: i, warn: game.i18n.localize("age-system.WARNING.nonShipPartsOnShip")});
                }
                break;
            case "char":
                if (itemType === 'shipfeatures') {
                    warning.push({index: i, warn: game.i18n.localize("age-system.WARNING.shipPartsOnChar")});
                }
                if (itemType === 'focus') {
                    const focusItems = actor.items.filter(f => f.type === "focus");
                    const hasFocus = focusItems.filter(f => f.name.toLowerCase() === itemName.toLowerCase());
                    if (item.isOrg) {
                        warning.push({index: i, warn: game.i18n.localize("age-system.WARNING.orgFocusToChar")});
                    } else if (hasFocus.length > 0) {
                        warning.push({index: i, warn: game.i18n.localize("age-system.WARNING.duplicatedFocus") + `"${itemName.toUpperCase()}"`});
                    }
                }
                break;
            case "organization":
                if (itemType !== 'focus') {
                    warning.push({index: i, warn: game.i18n.localize("age-system.WARNING.orgItem")});
                } else if (!item.isOrg) {
                    warning.push({index: i, warn: game.i18n.localize("age-system.WARNING.charFocusToOrg")});
                } else {
                    const hasFocus = actor.items.filter(f => f.name.toLowerCase() === itemName.toLowerCase());
                    if (hasFocus.length > 0) {
                        warning.push({index: i, warn: game.i18n.localize("age-system.WARNING.duplicatedFocus") + `"${itemName.toUpperCase()}"`});
                    }
                }
                break;
            default:
                break;
        };
    }

    if (warning.length) {
        for (let s = warning.length-1; s >= 0; s--) {
            const w = warning[s]
            ui.notifications.warn(w.warn)
            itemData.splice(w.index, 1);
        }
    }
    return itemData;
}