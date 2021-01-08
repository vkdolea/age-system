export function rollOwnedItem(event, actorId, itemId) {
    const actor = game.actors.get(actorId);
    const itemRolled = actor.getOwnedItem(itemId);
    const ablCode = itemRolled.data.data.useAbl;
    const focusName = itemRolled.data.data.useFocus;
    
    let focusRolled = actor.getOwnedItem(itemRolled.data.data.useFocusActorId);
    if (!focusRolled) {
        focusRolled = focusName;
    };

    Dice.ageRollCheck(event, ablCode, focusRolled, itemRolled, actor);
}