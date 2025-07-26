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
 * @param {Object} item     The dropped Item
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createAgeMacro(item, slot) {
  if (!item) return true;
  if (!item.isOwned) {
    ui.notifications.warn("You can only create macro buttons for owned Items");
    return true
  }

  // Create the macro command
  const command = `game.ageSystem.rollOwnedItem("${item.name}", true);\n\n/*Change second argument to false to skip Roll Options*/`;
  let macro = game.macros.contents.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "age-system.itemMacro": true }
    });
  }
  if (game.user.getHotbarMacros()[slot-1].macro) {
    const oldMacroId = game.user.getHotbarMacros()[slot-1].macro._id;
    game.macros.remove(oldMacroId);
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

// /* -------------------------------------------- */
// /*  Removal of Doubled Modifiers after          */
// /*  migration to 0.11.x                         */
// /* -------------------------------------------- */

// /**
//  * Search Actor Document for items to scavenged for doubled modifiers
//  * @param {object} actor 
//  * @returns 
//  */
// const checkActorItems = function(actor) {
//   const updateData = {};
  
//   // Migrate Owned Items
//   if ( !actor.items ) return updateData;
//   const items = actor.items.reduce((arr, i) => {
//     // Migrate the Owned Item
//     let itemUpdate = itemCheckForDoubleMods(i.data.data ? i.data : i);

//     // Update the Owned Item
//     if ( !isObjectEmpty(itemUpdate) ) {
//       itemUpdate._id = i.data.data ? i.id : i._id;
//       arr.push(itemUpdate);
//     }

//     return arr;
//   }, []);
//   if ( items.length > 0 ) updateData.items = items;
//   return updateData;
// };

// /**
//  * Look for double mods on Items
//  * @param {object} item 
//  * @returns 
//  */
// const itemCheckForDoubleMods = function(item) {
//   const updateData = {};
//   const itemMods = item.data.itemMods;
//   const curModifiers = item.data.modifiers;
//   if (!itemMods && curModifiers !== {}) return updateData;
//   const modsToBe = {};

//   // Cycle through existing mods
//   for (const k in curModifiers) {
//     if (Object.hasOwnProperty.call(curModifiers, k)) {
//       const m = curModifiers[k];
//       const type = m.type
      
//       // If the existing mod matches with a previously active Mod, register the entry
//       if (itemMods[type].selected && itemMods[type].value == m.formula) {
//         if (modsToBe[type]) modsToBe[m.type].push(m.key)
//         else modsToBe[type] = [m.key]
//       }
//     }
//   }

//   // Iterate through all Modifiers and, for the ones with more than 1 entry, delete the last one
//   for (const k in modsToBe) {
//     if (Object.hasOwnProperty.call(modsToBe, k)) {
//       const modArr = modsToBe[k];
//       if (modArr.length > 1) {
//         const removed = modArr.pop();
//         const updatePath = `data.modifiers.-=${removed}`;
//         updateData[updatePath] = null;
//       }
//     }
//   }
  
//   return updateData;
// };

// const checkDocsOnCompendia = async function(pack) {
//   const type = pack.metadata.type;
//   if ( !["Actor", "Item", "Scene"].includes(type) ) return;

//   // Unlock the pack for editing
//   const wasLocked = pack.locked;
//   await pack.configure({locked: false});

//   // Begin by requesting server-side data model migration and get the migrated content
//   await pack.migrate();
//   const documents = await pack.getDocuments();

//   // Iterate over compendium entries - applying fine-tuned migration functions
//   for ( let doc of documents ) {
//     let updateData = {};
//     try {
//       switch (type) {
//         case "Actor":
//           updateData = checkActorItems(doc.data);
//           break;
//         case "Item":
//           updateData = itemCheckForDoubleMods(doc.data);
//           break;
//         case "Scene":
//           updateData = await removeModsSceneElements(doc.data);
//           break;
//       }

//       // Save the entry, if data was changed
//       if ( foundry.utils.isObjectEmpty(updateData) ) continue;
//       await doc.update(updateData);
//       console.log(`Analyzed ${type} document ${doc.name} in Compendium ${pack.collection}`);
//     }

//     // Handle migration failures
//     catch(err) {
//       err.message = ` document ${doc.name} in pack ${pack.collection}: ${err.message}`;
//       console.error(err);
//     }
//   }

//   // Apply the original locked status for the pack
//   await pack.configure({locked: wasLocked});
//   console.log(`Migrated all ${type} documents from Compendium ${pack.collection}`);
// };

// const removeModsSceneElements = async function(scene) {
//   const tokens = scene.tokens.map(async (token) => {
//     const t = token.toJSON();

//     if (!t.actorLink && game.actors.has(t.actorId) && (t.actorData.data || t.actorData.effects || t.actorData.items)) {
//       // Migrate Items
//       if (t.actorData.items) {
//         token.actor.items.forEach(async (i) => {
//           const updates = itemCheckForDoubleMods(i.data)
//           await i.update(updates);
//           // console.log(`Removed Mods from ${i.data.type} document ${i.name} from token ${token.data.name}`);
//         });
//       };
//     }

//     return t;
//   });
//   return {tokens};
// };

// /**
//  * Function to start the removing process
//  */
// export const removeDoubledMods  = async function() {
//   ui.notifications.info(`Removing douplicated Modifiers from Items...`, {permanent: true});

//   // Migrate World Actors
//   for ( let a of game.actors.contents ) {
//     try {
//       const updateData = checkActorItems(a.data);
//       if ( !foundry.utils.isObjectEmpty(updateData) ) {
//         console.log(`Analyzing Actor document: ${a.name}`);
//         await a.update(updateData);
//       }
//     } catch(err) {
//       err.message = `Failed analyzis of Actor ${a.name}: ${err.message}`;
//       console.error(err);
//     }
//   }

//   // Migrate World Items
//   for ( let i of game.items.contents ) {
//     try {
//       const updateData = itemCheckForDoubleMods(i.data);
//       if ( !foundry.utils.isObjectEmpty(updateData) ) {
//         console.log(`Checking mods on Item document ${i.name}`);
//         await i.update(updateData);
//       }
//     } catch(err) {
//       err.message = `Failed modifiers check on Item ${i.name}: ${err.message}`;
//       console.error(err);
//     }
//   }

//   // Migrate Actor Override Tokens
//   for ( let s of game.scenes.contents ) {
//     try {
//       const updateData = await removeModsSceneElements(s.data);
//       if ( !foundry.utils.isObjectEmpty(updateData) ) {
//         console.log(`Checking Scene document ${s.name}`);
//         // await s.update(updateData, {enforceTypes: false});
//       }
//     } catch(err) {
//       err.message = `Failed AGE System doubled mods on elements for Scene ${s.name}: ${err.message}`;
//       console.error(err);
//     }
//   }

//   // Migrate World Compendium Packs
//   for ( let p of game.packs ) {
//     if ( p.metadata.package !== "world" ) continue;
//     if ( !["Actor", "Item", "Scene"].includes(p.metadata.type) ) continue;
//     await checkDocsOnCompendia(p);
//   }

//   ui.notifications.info(`Removal of doubled Modifiers after 0.11.x migration is completed!`, {permanent: true});
// };