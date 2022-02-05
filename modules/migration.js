/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function() {
  ui.notifications.info(`Applying AGE System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`, {permanent: true});

  // Migrate World Actors
  for ( let a of game.actors.contents ) {
    try {
      const updateData = migrateActorData(a.data);
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Actor document ${a.name}`);
        await a.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed AGE System migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  for ( let i of game.items.contents ) {
    try {
      const updateData = migrateItemData(i.data);
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Item document ${i.name}`);
        await i.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed AGE System migration for Item ${i.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate Actor Override Tokens
  for ( let s of game.scenes.contents ) {
    try {
      const updateData = await migrateSceneData(s.data);
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Scene document ${s.name}`);
        // await s.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed AGE System migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Compendium Packs
  for ( let p of game.packs ) {
    if ( p.metadata.package !== "world" ) continue;
    if ( !["Actor", "Item", "Scene"].includes(p.metadata.type) ) continue;
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
 * Apply migration rules to all Documents within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function(pack) {
  const type = pack.metadata.type;
  if ( !["Actor", "Item", "Scene"].includes(type) ) return;

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
      switch (type) {
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
      console.log(`Migrated ${type} document ${doc.name} in Compendium ${pack.collection}`);
    }

    // Handle migration failures
    catch(err) {
      err.message = `Failed age-system system migration for document ${doc.name} in pack ${pack.collection}: ${err.message}`;
      console.error(err);
    }
  }

  // Apply the original locked status for the pack
  await pack.configure({locked: wasLocked});
  console.log(`Migrated all ${type} documents from Compendium ${pack.collection}`);
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
  const lastMigrationVer = game.settings.get("age-system", "systemMigrationVersion");
  const updateData = {};

  // Actor Data Updates
  if(isNewerVersion("0.12.0", lastMigrationVer)) _updateModeHealth(actor, updateData);
  
  // Migrate Owned Effects
  if (actor.effects) { // Rever essa função!!!!
    const effects = actor.effects.reduce((arr, e) => {
      // Migrate the Owned Effect
      let effectUpdate = migrateEffectData(e.data ?? e);
  
      // Update the Owned Effect
      if ( !isObjectEmpty(effectUpdate) ) {
        effectUpdate._id = e.id;
        // effectUpdate._id = e._id;
        arr.push(effectUpdate);
      }
  
      return arr;
    }, []);
    if (effects.length > 0) updateData.effects = effects;
  }

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
  if (isNewerVersion("0.7.0", lastMigrationVer)) _adjustFocusInitialValue(item, updateData); // Do not execute if last migration was 0.7.0 or earlier
  if (isNewerVersion("0.11.0", lastMigrationVer)) {
    _weaponRanged(item, updateData);
    _itemDamage(item, updateData);
    _populateItemModifiers(item, updateData);
  }
  if (isNewerVersion("0.11.2", lastMigrationVer)) _talentDegree(item, updateData);
  return updateData;
};
/* -------------------------------------------- */

/**
 * Migrate a single Effect Document to incorporate latest data model changes
 * @param effect
 */
export const migrateEffectData = function(effect) {
  const lastMigrationVer = game.settings.get("age-system", "systemMigrationVersion");
  const updateData = {};
  if (isNewerVersion("0.8.8", lastMigrationVer)) _addEffectFlags(effect, updateData); // Do not execute if last migration was 0.8.8 or earlier
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

    if (!t.actorLink && game.actors.has(t.actorId) && (t.actorData.data || t.actorData.effects || t.actorData.items)) {
      // Migrate Actor Data
      t.actorData = foundry.utils.mergeObject(t.actorData, migrateActorData(t.actorData));

      // Migrate Items
      if (t.actorData.items) {
        token.actor.items.forEach(async (i) => {
          const updates = migrateItemData(i.data)
          await i.update(updates);
          console.log(`Migrated ${i.data.type} document ${i.name} from token ${token.data.name}`);
        });
      };
  
      // // Migrate Effects, version 0.8.8
      if (t.actorData.effects) {
        token.actor.effects.forEach(async (e) => {
          const updates = migrateEffectData(e.data ?? e)
          await e.update(updates);
          console.log(`Migrated Active Effect named ${e.id} from token ${token.data.name}`);
        });
      };
    }

    if (!t.actorId || t.actorLink || !t.actorData.data || !t.actorData.effects || !t.actorData.items) {
      t.actorData = {};
    } else if ( !game.actors.has(t.actorId) ){
      t.actorId = null;
      t.actorData = {};
    } else if ( !t.actorLink ) {

      // Migrate Actor Data
      t.actorData = foundry.utils.mergeObject(t.actorData, migrateActorData(t.actorData));
    }
    return t;
  });
  return {tokens};
};

/* -------------------------------------------- */
/*  Low level migration utilities
/* -------------------------------------------- */

/**
 * Update Game Mode table with in use Health / Defense / Toughness 
 * @private
 */
function _updateModeHealth(actor, updateData) {
  if (actor.type !== "char") return updateData;
  const mode = CONFIG.ageSystem.healthSys.mode;
  const path = `data.gameMode.specs.${mode}`;
  updateData[`${path}.health`] = actor._source.data.health.set;
  updateData[`${path}.defense`] = actor._source.data.defense.gameModeBonus;
  updateData[`${path}.toughness`] = actor._source.data.armor.toughness.gameModeBonus;
  
  return updateData
}
/* -------------------------------------------- */

/**
 * Add Effects flags for version 0.8.8
 * @private
 */
 function _addEffectFlags(effect, updateData) {
  if (effect.flags?.["age-system"]?.type === 'conditions' && effect.flags?.core?.statusId) {
    updateData.flags = {
      "age-system": {
        isCondition: true,
        conditionType: 'expanse',
        desc: `age-system.conditions.${effect.flags["age-system"].name}.desc`
      }
    };
  }
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
 * Set ranged to TRUE (as standard is FALSE) for old items
 * @private
 */
 function _weaponRanged(item, updateData) {
  if (item.type !== 'weapon') return updateData;
  const meleeDist = {
    min: false,
    max: false
  }
  if (!item.data.range || item.data.range <= 2) meleeDist.min = true
  if (!item.data.rangeMax || item.data.rangeMax === item.data.range) meleeDist.max = true;
  const isRanged = meleeDist.min && meleeDist.max ? false : true;
  updateData["data.ranged"] = isRanged;
  return updateData
}
/* -------------------------------------------- */

/**
 * Calculated Damage formula based on previous data template
 * @private
 */
 function _itemDamage(item, updateData) {
  if (!['weapon', 'power'].includes(item.type)) return updateData;
  let formula = ""
  let first = true;
  if (item.data.nrDice && item.data.diceType) {
    formula += `${item.data.nrDice}d${item.data.diceType}`;
    first = false
  }
  if (item.data.extraValue) {
    if (!first && item.data.extraValue > 0) formula += `+`;
    formula += `${item.data.extraValue}`
  }
  updateData["data.damageFormula"] = formula;

  // Resisted Damage
  if (item.data.damageResisted) {
    formula = ""
    first = true;
    if (item.data.damageResisted.nrDice && item.data.damageResisted.diceType) {
      formula += `${item.data.damageResisted.nrDice}d${item.data.damageResisted.diceType}`;
      first = false
    }
    if (item.data.damageResisted.extraValue) {
      if (!first && item.data.damageResisted.extraValue > 0) formula += `+`;
      formula += `${item.data.damageResisted.extraValue}`
    }
    updateData["data.damageResisted.damageFormula"] = formula;
  }
  return updateData
}
/* -------------------------------------------- */

/**
 * Populate Migration object on Item based on former itemMods
 * @private
 */
 function _populateItemModifiers(item, updateData) {
  if (!['equipment', 'weapon', 'power', 'talent'].includes(item.type)) return updateData;
  const itemMods = item.data.itemMods;
  const mods = {};
  const keys = []

  for (const k in itemMods) {
    if (Object.hasOwnProperty.call(itemMods, k)) {
      const m = itemMods[k];
      if (m.selected ?? m.value) {
        let modKey
        do {
          modKey = foundry.utils.randomID(20);
        } while (keys.includes(modKey));
        
        mods[modKey] = {
          type: k,
          formula: `${m.value}`,
          flavor: "",
          isActive: m.isActive,
          conditions: {focus: m.name ? m.name : ""},
          key: modKey,
          // The following data will be recalculated, anyway...
          ftype: CONFIG.ageSystem.modkeys[k].dtype,
          valid: true,
          itemId: item._id,
          itemName: item.name
        }
      }
    }
  }
  
  updateData['data.modifiers'] = mods;
  return updateData
}
/* -------------------------------------------- */

/**
 * Try to identify Talent Degree and save old data on "Requirements" field
 * @private
 */
 function _talentDegree(item, updateData) {
  if (item.type !== 'talent') return updateData;
  if (item.data.degree !== "") return updateData
  const prevDegree = item.data.shortDesc;
  if (!prevDegree) return updateData
  if (prevDegree.trim() === "") return updateData
  const prevDegreeLC = prevDegree.toLowerCase();

  let tdMA = foundry.utils.deepClone(CONFIG.ageSystem.mageDegrees);
  let tdFA = foundry.utils.deepClone(CONFIG.ageSystem.fageDegrees);
  let matches = false;
  let newDegree = "";
  for (let i = 0; i < tdMA.length; i++) {
    tdMA[i] = game.i18n.localize(tdMA[i].toLowerCase());
    tdFA[i] = game.i18n.localize(tdFA[i].toLowerCase());
  }
  for (let i = 0; i < tdMA.length; i++) {
    if (!matches && prevDegreeLC == tdMA[i].toLowerCase()) {
      matches = true;
      newDegree = i
    }
    if (!matches && prevDegreeLC == tdFA[i].toLowerCase()) {
      matches = true;
      newDegree = i
    }
  }

  if (newDegree !== "") { 
    updateData['data.degree'] = newDegree;
  } else {
    updateData['data.degree'] = 0;
  }
  let req = item.data.requirement;
  req = req === "" ? `${game.i18n.localize('age-system.talentDegree')}: ${item.data.shortDesc}` : ref += ` | ${game.i18n.localize('age-system.talentDegree')}: ${item.data.shortDesc}`
  updateData['data.requirement'] = req;

  return updateData
}
/* -------------------------------------------- */