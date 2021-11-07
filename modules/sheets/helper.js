/**Prevent Items to be created on non campatible Actor types
 * @param actor actor document
 * @param itemType string containing Item type
 * @param itemName string with Item name
 */
export function isDropedItemValid(actor, itemData) {
    const actorType = actor.type;
    const itemType = itemData.type;
    const itemName = itemData.name;
    let warning;
    let isValid = true;

    switch (actorType) {
        case "vehicle":
            warning = game.i18n.localize("age-system.WARNING.vehicleItem");
            isValid = false;
            break;
        case "spaceship":
            if (itemType !== 'shipfeatures') {
                warning = game.i18n.localize("age-system.WARNING.nonShipPartsOnShip");
                isValid = false;
            }
            break;
        case "char":
            if (itemType === 'shipfeatures') {
                warning = game.i18n.localize("age-system.WARNING.shipPartsOnChar");
                isValid = false;
            }
            if (itemType === 'focus') {
                const hasFocus = actor.items.filter(f => f.name.toLowerCase() === itemName.toLowerCase());
                if (itemData.data.isOrg) {
                    warning = game.i18n.localize("age-system.WARNING.orgFocusToChar");
                    isValid = false;
                } else if (hasFocus.length > 0) {
                    warning = game.i18n.localize("age-system.WARNING.duplicatedFocus");
                    warning += `"${itemName.toUpperCase()}"`;
                    isValid = false;
                }
            }
            break;
        case "organization":
            if (itemType !== 'focus') {
                warning = game.i18n.localize("age-system.WARNING.orgItem");
                isValid = false;
            } else if (!itemData.data.isOrg) {
                warning = game.i18n.localize("age-system.WARNING.charFocusToOrg");
                isValid = false;
            } else {
                const hasFocus = actor.items.filter(f => f.name.toLowerCase() === itemName.toLowerCase());
                if (hasFocus.length > 0) {
                    warning = game.i18n.localize("age-system.WARNING.duplicatedFocus");
                    warning += `"${itemName.toUpperCase()}"`;
                    isValid = false;
                }
            }
            break;
        default:
            break;
    };
  if (!isValid) ui.notifications.warn(warning)
  return isValid;
}