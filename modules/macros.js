/**
 * Macro to roll a Named item from selected token
 * @param {string} itemName String with name item (case sensitive)
 * @param {boolean} rollOptions False to directly, True to prompt user for roll settings
 * @returns Item.roll() method
 */
export function rollOwnedItem(itemName, rollOptions = false) {
  // Identify if token is selected, otherwise select user's actor
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  if (!actor) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.selectTokenMacro"));

  const itemRolled = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!itemRolled) {return ui.notifications.warn(game.i18n.localize("age-system.WARNING.actorDontHaveValidItem"));}

  let event;
  if (rollOptions) {
    event = new MouseEvent('click', {altKey: true});
  } else {
    event = new MouseEvent('click', {});
  };

  return itemRolled.roll(event);
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
  if (!['weapon', 'focus', 'power'].includes(data?.data?.type)) return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.ageSystem.rollOwnedItem("${item.name}", true);\n\n/*Change second argument to false to skip Roll Options*/`;
  let macro = game.macros.contents.find(m => (m.name === item.name) && (m.command === command));
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