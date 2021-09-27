/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function() {
  ui.notifications.info(`Applying AGE System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`, {permanent: true});

  // Migrate World Actors
  for ( let a of game.actors.entities ) {
    try {
      const updateData = migrateActorData(a.data);
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Actor entity ${a.name}`);
        await a.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed AGE System migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  for ( let i of game.items.entities ) {
    try {
      const updateData = migrateItemData(i.data);
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Item entity ${i.name}`);
        await i.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed AGE System migration for Item ${i.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate Actor Override Tokens
  for ( let s of game.scenes.entities ) {
    try {
      const updateData = await migrateSceneData(s.data);
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Scene entity ${s.name}`);
        await s.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed AGE System migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Compendium Packs
  for ( let p of game.packs ) {
    if ( p.metadata.package !== "world" ) continue;
    if ( !["Actor", "Item", "Scene"].includes(p.metadata.entity) ) continue;
    await migrateCompendium(p);
  }

  // Migrate Game Settings
  const settingsUpdates = await migrateSettings();

  // Set the migration as complete
  await game.settings.set("age-system", "systemMigrationVersion", game.system.data.version);
  if (settingsUpdates !== []) {
    for (let s = 0; s < settingsUpdates.length; s++) {
      const setting = settingsUpdates[s];
      game.settings.set("age-system", setting.key, setting.value);
    }
  }
  ui.notifications.info(`AGE System Migration to version ${game.system.data.version} completed!`, {permanent: true});
};

/* -------------------------------------------- */

/**
 * Migrate Game Settings
 */
export async function migrateSettings() {
  const lastMigrationVer = await game.settings.get("age-system", "systemMigrationVersion");
  const healthSys = await game.settings.get("age-system", "healthSys");
  let updateSettings = [];
  let migData = await game.settings.get("age-system", "settingsMigrationData");
  
  if (isNewerVersion("0.8.0", lastMigrationVer)) { // Do not execute if last migration version was 0.8.0 or earlier
    const newHealthSys = await removeToughHealthBallistic();
    const newData = {key: "healthSys", value: newHealthSys, version: "0.8.0"}
    let diff = false
    for (let s = 0; s < migData.length; s++) {
      if (migData[s] === newData) diff = true;
    }
    if (!diff) migData.push(newData)
    if (newHealthSys !== healthSys) updateSettings.push(newData)
  };
  
  await game.settings.set("age-system", "settingsMigrationData", migData);
  return updateSettings;
};

export async function removeToughHealthBallistic() {
  const useToughness = await game.settings.get("age-system", "useToughness");
  const useBallisticArmor = await game.settings.get("age-system", "useBallisticArmor");
  let healthSys = useBallisticArmor ? "mage" : useToughness ? "expanse" : "basic";
  return healthSys;
}

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function(pack) {
  const entity = pack.metadata.entity;
  if ( !["Actor", "Item", "Scene"].includes(entity) ) return;

  // Unlock the pack for editing
  const wasLocked = pack.locked;
  await pack.configure({locked: false});

  // Begin by requesting server-side data model migration and get the migrated content
  await pack.migrate();
  const documents = await pack.getDocuments();

  // Iterate over compendium entries - applying fine-tuned migration functions
  for ( let doc of documents ) {
    let updateData = {};
    try {
      switch (entity) {
        case "Actor":
          updateData = migrateActorData(doc.data);
          break;
        case "Item":
          updateData = migrateItemData(doc.data);
          break;
        case "Scene":
          updateData = await migrateSceneData(doc.data);
          break;
      }

      // Save the entry, if data was changed
      if ( foundry.utils.isObjectEmpty(updateData) ) continue;
      await doc.update(updateData);
      console.log(`Migrated ${entity} entity ${doc.name} in Compendium ${pack.collection}`);
    }

    // Handle migration failures
    catch(err) {
      err.message = `Failed age-system system migration for entity ${doc.name} in pack ${pack.collection}: ${err.message}`;
      console.error(err);
    }
  }

  // Apply the original locked status for the pack
  await pack.configure({locked: wasLocked});
  console.log(`Migrated all ${entity} entities from Compendium ${pack.collection}`);
};

/* -------------------------------------------- */
/*  Entity Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {Actor} actor   The actor to Update
 * @return {Object}       The updateData to apply
 */
export const migrateActorData = function(actor) {
  const updateData = {};

  // Actor Data Updates
  // _addActorConditions(actor, updateData);
  // _addVehicleCustomDmg(actor, updateData);
  // _addActorMods(actor, updateData);
  // _addActorPersonaFields(actor, updateData);
  

  // Migrate Owned Items
  if ( !actor.items ) return updateData;
  const items = actor.items.reduce((arr, i) => {
    // Migrate the Owned Item
    let itemUpdate = migrateItemData(i.data.data ? i.data : i);

    // Update the Owned Item
    if ( !isObjectEmpty(itemUpdate) ) {
      itemUpdate._id = i.data.data ? i.id : i._id;
      arr.push(itemUpdate);
    }

    return arr;
  }, []);
  if ( items.length > 0 ) updateData.items = items;
  return updateData;
};
/* -------------------------------------------- */

/**
 * Migrate a single Item entity to incorporate latest data model changes
 * @param item
 */
export const migrateItemData = function(item) {
  const lastMigrationVer = game.settings.get("age-system", "systemMigrationVersion");
  const updateData = {};
  // _addItemModSpeed(item, updateData);
  // _addItemValidResistedDmgAbl(item, updateData);
  // _addExtraPowerData(item, updateData);
  // _addItemForceAbl(item, updateData);
  // _addItemModTest(item, updateData);
  // _addItemAttackMod(item, updateData);
  if (isNewerVersion("0.7.0", lastMigrationVer)) _adjustFocusInitialValue(item, updateData); // Do not execute if last migration was 0.7.0 or earlier
  if (isNewerVersion("0.7.5", lastMigrationVer)) _addSelectedFieldForMods(item, updateData);
  return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate a single Scene entity to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {Object} scene  The Scene data to Update
 * @return {Object}       The updateData to apply
 */
 export const migrateSceneData = async function(scene) {
  const tokens = scene.tokens.map(async (token) => {
    const t = token.toJSON();
    if (t.actorData.items) {
      token.actor.items.forEach(async (i) => {
        const updates = migrateItemData(i.data)
        await i.update(updates);
        console.log(`Migrated ${i.data.type} entity ${i.name} from token ${token.data.name}`);
      });
    }
    if (!t.actorId || t.actorLink || !t.actorData.data) {
      t.actorData = {};
    }
    else if ( !game.actors.has(t.actorId) ){
      t.actorId = null;
      t.actorData = {};
    }
    else if ( !t.actorLink ) {
      t.actorData = foundry.utils.mergeObject(t.actorData, migrateActorData(t.actorData));
      console.log(t.actorData);
    }
    return t;
  });
  return {tokens};
};

/* -------------------------------------------- */
/*  Low level migration utilities
/* -------------------------------------------- */

/**
 * Add actor conditions
 * @private
 */
function _addActorConditions(actor, updateData) {
  if (actor.type !== "char") return updateData;
  
  const conditions = ["blinded", "deafened", "exhausted", "fatigued", "freefalling", "helpless", "hindered",
  "prone", "restrained", "injured", "wounded", "unconscious", "dying"];

  // Add Conditions - added a fix for previous migration, when 'data.conditions' was created as an Array
  if (actor.data.conditions) {
    let checked = 0;
    if (typeof actor.data.conditions === "object") {
      let complete = true;
      for (let c = 0; c < conditions.length; c++) {
        const condition = conditions[c];
        checked = condition ? checked+1 : checked;
        if (!actor.data.conditions.hasOwnProperty(condition) && !["hindred", "hindered"].includes(condition)) complete = false;
      }
      if (complete && (checked > 6)) {
        conditions.forEach(c => {
          const updatePath = `data.conditions.${c}`;
          updateData[updatePath] = false;
        })
      }
      if (complete) return updateData;
    } else {
      delete actor.data.conditions;
    };
  }
  
  if (!actor.data.conditions) {
    updateData["data.conditions"] = {};
    for (let c = 0; c < conditions.length; c++) {
      const cond = conditions[c];
      const condString = `data.conditions.${cond}`;
      udpateData[condString] = false;    
    }
  };

  if (actor.data.conditions.hasOwnProperty("hindred")) {
    updateData["data.conditions.hindered"] = actor.data.conditions.hindred;
    updateData["data.conditions.-=hindred"] = null;
  }

  return updateData
}
/* -------------------------------------------- */

/**
 * Add vehicle custom damage
 * @private
 */
function _addVehicleCustomDmg(actor, updateData) {
  if (actor.type !== "vehicle") return updateData;

  if (!actor.data.hasOwnProperty('customSideswipeDmg')) updateData["data.customSideswipeDmg"] = 1;
  if (!actor.data.hasOwnProperty('customCollisionDmg')) updateData["data.customCollisionDmg"] = 1;

  return updateData
}
/* -------------------------------------------- */

/**
 * Add Actor attack, test and damage modifier field
 * @private
 */
 function _addActorMods(actor, updateData) {
  if (actor.type !== "char") return updateData;

  if (!actor.data.hasOwnProperty('dmgMod')) updateData["data.dmgMod"] = 0;
  if (!actor.data.hasOwnProperty('testMod')) updateData["data.testMod"] = 0;
  if (!actor.data.hasOwnProperty('attackMod')) updateData["data.attackMod"] = 0;

  return updateData;
}
/* -------------------------------------------- */

/**
 * Add extra Persona data fields for Player Character (bio and secretNote)
 * @private
 */
 function _addActorPersonaFields(actor, updateData) {
  if (!actor.data.hasOwnProperty('gmNotes')) updateData['data.gmNotes'] = "";
  
  if (actor.type !== "char") return updateData;
  if (!actor.data.hasOwnProperty('traits')) updateData['data.traits'] = "";
  if (!actor.data.hasOwnProperty('secretNote')) updateData['data.secretNote'] = "";
  if (!actor.data.hasOwnProperty('language')) updateData['data.language'] = "";

  return updateData;
}

/**
 * Add Speed Modificator option to item
 * @private
 */
function _addItemModSpeed(item, updateData) {
  if (!item.data.itemMods) return updateData;
  if (item.data.itemMods.hasOwnProperty("speed")) return updateData;

  updateData["data.itemMods.speed"] = {};
  updateData["data.itemMods.speed.isActive"] = false;
  updateData["data.itemMods.speed.selected"] = false;
  updateData["data.itemMods.speed.value"] = 0;

  return updateData
}
/* -------------------------------------------- */

/**
 * Add Test Modificator option to item
 * @private
 */
 function _addItemModTest(item, updateData) {
  if (!item.data.itemMods) return updateData;
  if (item.data.itemMods.hasOwnProperty("testMod")) return updateData;

  // updateData["data.itemMods.testMod"] = {};
  updateData["data.itemMods.testMod.isActive"] = false;
  updateData["data.itemMods.testMod.selected"] = false;
  updateData["data.itemMods.testMod.value"] = 0;

  return updateData
}
/* -------------------------------------------- */

/**
 * Add Attack Modificator option to item
 * @private
 */
 function _addItemAttackMod(item, updateData) {
  if (!item.data.itemMods) return updateData;
  if (item.data.itemMods.hasOwnProperty("attackMod")) return updateData;

  // updateData["data.itemMods.attackMod"] = {};
  updateData["data.itemMods.attackMod.isActive"] = false;
  updateData["data.itemMods.attackMod.selected"] = false;
  updateData["data.itemMods.attackMod.value"] = 0;

  return updateData
}
/* -------------------------------------------- */

/**
 * Add extra Power elements to address resist Test
 * and half damage when spell is resisted
 * @private
 */
function _addExtraPowerData(item, updateData) {
  if (item.type !== "power") return updateData;
  if (item.data.hasOwnProperty("ablFatigue")) return updateData;

  updateData["data.causeHealing"] = false;
  updateData["data.ablFatigue"] = "will";
  updateData["data.hasTest"] = false;
  updateData["data.testAbl"] = "will";
  updateData["data.testFocus"] = "";
  updateData["data.damageResisted"] = {};
  updateData["data.damageResisted.nrDice"] = 1;
  updateData["data.damageResisted.diceType"] = 6;
  updateData["data.damageResisted.extraValue"] = 0;
  updateData["data.damageResisted.dmgAbl"] = "will";

  return updateData;
}

/**
 * Fix imported values for Ability to Resist Power
 * @private
 */
function _addItemValidResistedDmgAbl(item, updateData) {
  if (item.type !== "power") return updateData;
  if (item.data.hasOwnProperty("damageResisted")) {
    if (!item.data.damageResisted.hasOwnProperty("dmgAbl")) {
      updateData["data.damageResisted.dmgAbl"] = "will";  
    }
  }
  return updateData;
}
/* -------------------------------------------- */

/**
 * Add itemForceAbl field for powers
 * @private
 */
function _addItemForceAbl(item, updateData) {
  if (item.type !== "power") return updateData;
  if (item.data.hasOwnProperty("itemForceAbl")) return updateData;

  updateData["data.itemForceAbl"] = "will";

  return updateData
}
/* -------------------------------------------- */

/**
 * Adjust Focus value to make for the Improved field
 * @private
 */
 function _adjustFocusInitialValue(item, updateData) {
  if (item.type !== "focus") return updateData;
  if (item.data.improved) updateData["data.initialValue"] = item.data.initialValue - 1;
  return updateData
}
/* -------------------------------------------- */

/**
 * Add the @selected field for Item Mods and set to true if Mod is active
 * @private
 */
function _addSelectedFieldForMods(item, updateData) {
  if (!item.data.hasOwnProperty("itemMods")) return updateData;
  const itemMods = item.data.itemMods;
  for (const m in itemMods) {
    if (Object.hasOwnProperty.call(itemMods, m)) {
      const mod = itemMods[m];
      const updatePath = `data.itemMods.${m}.selected`;
      if (mod.isActive || mod.value != 0 || mod.name) updateData[updatePath] = true;
    }
  }
  return updateData
}

// Codes to active Mods - some users reported mods disappeard from their items after version 0.7.0
/** 
* Search Actor Directory and selects all Item Mods which are active or have non falsy value
*/
export async function actorDirectoryOwnedItemsModsOn() {
  game.actors.map(async (a) => {
    const items = a.items;
    items.map(async (i) => {
      await itemModsOn(i);
    });
  });
};

/** 
* Turns all item Mods with value !=
*/
export async function itemDirectoryModsOn() {
  game.items.map(async (i) => {
    await itemModsOn(i);
  });
};

/** 
* Turns all item Mods with value !=
*/
export async function itemModsOn(item) {
  const mods = item.data.data.itemMods;
  if (!mods) return
  const updates = {};
  if (mods) {
    for (const key in mods) {
      if (Object.hasOwnProperty.call(key, mods)) {
        if (mods[key].isActive || mods[key].value != 0) {
          const path = `data.itemMods.${key}.selected`;
          updates[path] = true;
        };
      }
    }
    await i.update(updates);
  };
};
/* -------------------------------------------- */