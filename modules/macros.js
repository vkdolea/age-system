// import {ageRollCheck} from "./dice.js";

export function rollOwnedItem(itemName, rollOptions = false) {

  // Identify if token is selected, otherwise select user's actor
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  if (!actor) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.selectTokenMacro"));

  const itemRolled = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!itemRolled) {return ui.notifications.warn(game.i18n.localize("age-system.WARNING.actorDontHaveValidItem"));}
  // const ablCode = itemRolled.data.data.useAbl;

  let event;
  if (rollOptions) {
    event = new MouseEvent('click', {altKey: true});
  } else {
    event = new MouseEvent('click', {});
  };

  itemRolled.roll(event);
  // ageRollCheck(event, actor, ablCode, itemRolled);
};

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createAgeMacro(data, slot) {
  // if (data.type !== "weapon") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.ageSystem.rollOwnedItem("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "ageSystem.itemMacro": true }
    });
  }
  if (game.user.getHotbarMacros()[slot-1].macro) {
    const oldMacroId = game.user.getHotbarMacros()[slot-1].macro._id;
    game.macros.remove(oldMacroId);
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}
  
// /**
//  * Create a Macro from an Item drop.
//  * Get an existing item macro if one exists, otherwise create a new one.
//  * @param {string} itemName
//  * @return {Promise}
//  */
// export function rollItemMacro(itemName) {
//     const speaker = ChatMessage.getSpeaker();
//     let actor;
//     if (speaker.token) actor = game.actors.tokens[speaker.token];
//     if (!actor) actor = game.actors.get(speaker.actor);
//     const item = actor ? actor.items.find(i => i.name === itemName) : null;
//     if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

//     // Trigger the item roll
//     return item.roll();
// }