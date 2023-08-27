/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function() {
  ui.notifications.info(`Applying AGE System Migration for version ${game.system.version}. Please be patient and do not close your game or shut down your server.`, {permanent: true});

  // Migrate World Actors
  for ( let a of game.actors ) {
    try {
      const updateData = migrateActorData(a.toObject(), a._source);
      if ( !foundry.utils.isEmpty(updateData) ) {
        console.log(`Migrating Actor document ${a.name}`);
        await a.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed AGE System migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  for ( let i of game.items ) {
    try {
      const updateData = migrateItemData(i.toObject());
      if ( !foundry.utils.isEmpty(updateData) ) {
        console.log(`Migrating Item document ${i.name}`);
        await i.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed AGE System migration for Item ${i.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate Actor Override Tokens
  for ( let s of game.scenes ) {
    try {
      const updateData = await migrateSceneData(s);
      if ( !foundry.utils.isEmpty(updateData) ) {
        console.log(`Migrating Scene document ${s.name}`);
        await s.update(updateData, {enforceTypes: false});
        // If we do not do this, then synthetic token actors remain in cache
        // with the un-updated actorData.
        s.tokens.forEach(t => t._actor = null);
      }
    } catch(err) {
      err.message = `Failed AGE System migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Compendium Packs
  for ( let p of game.packs ) {
    if ( p.metadata.package !== "world" ) continue;
    if ( !["Actor", "Item", "Scene"].includes(p.documentName) ) continue;
    await migrateCompendium(p);
  }

  // Migrate Game Settings
  const settingsUpdates = await migrateSettings();

  // Migrate Chat Messagens
  for (let m of game.messages) {
    const updateData = await migrateMessage(m);
    if (updateData != {}) console.log(`Migrating ChatMessage document ${m._id}`);
    await m.update(updateData, {enforceTypes: false});
  }

  // Set the migration as complete
  await game.settings.set("age-system", "systemMigrationVersion", game.system.version);
  if (settingsUpdates !== []) {
    for (let s = 0; s < settingsUpdates.length; s++) {
      const setting = settingsUpdates[s];
      game.settings.set("age-system", setting.key, setting.value);
    }
  }
  ui.notifications.info(`AGE System Migration to version ${game.system.version} completed!`, {permanent: true});
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

  if (isNewerVersion("1.0.0", lastMigrationVer)) { // Do not execute if last migration version was 1.0.0 or earlier
    // Migrate Custom Token Status
    const te = game.settings.get("age-system", "customTokenEffects");
    for (let e = 0; e < te.length; e++) {
      const changes = te[e].changes;
      if (changes) {
        for (let c = 0; c < changes.length; c++) {
          const k = changes[c];
          if (k.key.includes('data.')) te[e].changes[c].key = k.key.replace("data.", "system.")
        }
      }
    }
    await game.settings.set("age-system", "customTokenEffects", te);
  }

  if (isNewerVersion("2.0.2", lastMigrationVer)) { // Do not execute if last migration version was 2.0.2 or earlier
    // Migrate field "label" from Custom Token Status to "name", to comply to FoundryVTT v11 new API.
    let te = game.settings.get("age-system", "customTokenEffects");
    for (let i = 0; i < te.length; i++) {
      if (!te[i].name) {
        te[i].name = te[i].label;
        delete te[i].label;
      }
    }
    await game.settings.set("age-system", "customTokenEffects", te);
  }
  
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
  const documentName = pack.documentName;
  if ( !["Actor", "Item", "Scene"].includes(documentName) ) return;

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
      switch (documentName) {
        case "Actor":
          updateData = migrateActorData(doc.toObject(), doc._source);
          break;0
        case "Item":
          updateData = migrateItemData(doc.toObject());
          break;
        case "Scene":
          updateData = await migrateSceneData(doc.toObject());
          break;
      }

      // Save the entry, if data was changed
      if ( foundry.utils.isEmpty(updateData) ) continue;
      await doc.update(updateData);
      console.log(`Migrated ${documentName} document ${doc.name} in Compendium ${pack.collection}`);
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
/*  Document Type Migration Helpers             */
/* -------------------------------------------- */


/**
 * Migrate data of Chat Message document to incorporate latest system changes
 * Return an Object of updateData to be applied
 * @param {ChatMessage} message   The message to Update
 * @return {Object}               The udpateData to apply
 */
export const migrateMessage = function(message) {
  const lastMigrationVer = game.settings.get("age-system", "systemMigrationVersion");
  const updateData = {};

  if (isNewerVersion("1.0.0", lastMigrationVer)) _adjustRollsArray(message, updateData); // Do not execute if last migration was 1.0.0 or earlier
  return updateData;
}

/**
 * Migrate a single Actor document to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {Actor} actor   The actor to Update
 * @return {Object}       The updateData to apply
 */
export const migrateActorData = function(actor, source={}) {
  const lastMigrationVer = game.settings.get("age-system", "systemMigrationVersion");
  const updateData = {};

  // Actor Data Updates
  if(isNewerVersion("0.12.0", lastMigrationVer)) _updateModeHealth(actor, source, updateData);
  
  // Migrate Owned Effects
  const effects = migrateEffects(actor)
  if (effects.length > 0) updateData.effects = effects;

  // Migrate Owned Items
  const items = migrateItems(actor);
  if ( items.length > 0 ) updateData.items = items;
  return updateData;
};
/* -------------------------------------------- */

/**
 * Migrate Effects
 * @param {object} parent         Data of parent being migrated
 * @returns {object[]}            Updates to apply on the embedded effects
 */
const migrateEffects = function(parent) {
  if (!parent.effects) return {}
  return parent.effects.reduce((arr, e) => {
    const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;
    let effectUpdate = migrateEffectData(effectData);
    if ( !foundry.utils.isEmpty(effectUpdate) ) {
      effectUpdate._id = effectData._id;
      arr.push(foundry.utils.expandObject(effectUpdate));
    }
    return arr;
  }, []);
}

/**
 * Migrate Item
 * @param {object} parent         Data of parent being migrated
 * @returns {object[]}            Updates to apply on the embedded Items
 */
 const migrateItems = function(parent) {
  if (!parent.items) return {}
  return parent.items.reduce((arr, i) => {
    const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
    let itemUpdate = migrateItemData(itemData);
    if ( !foundry.utils.isEmpty(itemUpdate) ) {
      itemUpdate._id = itemData._id;
      arr.push(foundry.utils.expandObject(itemUpdate));
    }
    return arr;
  }, []);
}

/**
 * Migrate a single Item document to incorporate latest data model changes
 * @param item
 */
export const migrateItemData = function(item) {
  const lastMigrationVer = game.settings.get("age-system", "systemMigrationVersion");
  const updateData = {};
  if (isNewerVersion("0.7.0", lastMigrationVer)) _adjustFocusInitialValue(item, updateData); // Do not execute if last migration was 0.7.0 or earlier
  if (isNewerVersion("0.11.0", lastMigrationVer)) {
    if (item.type === "weapon" ) _weaponRanged(item, updateData);
    if (["weapon", "power"].includes(item.type)) _itemDamage(item, updateData);
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
 * Migrate a single Scene document to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {Object} scene  The Scene data to Update
 * @return {Object}       The updateData to apply
 */
export const migrateSceneData = async function(scene) {
  const tokens = scene.tokens.map(token => {
    const t = token.toObject();
    const update = {};
    if ( Object.keys(update).length ) foundry.utils.mergeObject(t, update);
    if ( !t.actorId || t.actorLink ) {
      t.delta = {};
    }
    else if ( !game.actors.has(t.actorId) ) {
      t.actorId = null;
      t.delta = {};
    }
    else if ( !t.actorLink ) {
      const actorData = duplicate(t.delta);
      actorData.type = token.actor?.type;
      const tokenSource = game.actors.get(t.actorId)._source;
      const update = migrateActorData(actorData, tokenSource);
      ["items", "effects"].forEach(embeddedName => {
        if (!update[embeddedName]?.length) return;
        const updates = new Map(update[embeddedName].map(u => [u._id, u]));
        t.delta[embeddedName].forEach(original => {
          const update = updates.get(original._id);
          if (original.data) { // Addresses issue on migrating Item/Effects owned by synthetic tokens
            switch (embeddedName) {
              case 'items':
                original.system = original.data;
                break;
            
              case 'effects':
                mergeObject(original, original.data);
                break;
            }
            delete original.data;
          }
          if (update) mergeObject(original, update);
        });
        delete update[embeddedName];
      });

      mergeObject(t.delta, update);
    }
    return t;    
  });
  return {tokens};
};

/* -------------------------------------------- */
/*  Low level migration utilities
/* -------------------------------------------- */

/**
 * Remove invalid terms from Rolls array
 * @private
 */
 function _adjustRollsArray(message, updateData) {
  let roll = foundry.utils.deepClone(message._source.rolls);
  
  for (let i = 0; i < roll.length; i++) {
    if (!(roll[i] === false)) roll.splice(i)
  }
  updateData["rolls"] = roll;

  return updateData
}
/* -------------------------------------------- */

/**
 * Update Game Mode table with in use Health / Defense / Toughness 
 * @private
 */
function _updateModeHealth(actor, source, updateData) {
  if (actor.type !== "char") return updateData;
  const mode = CONFIG.ageSystem.healthSys.mode;
  const path = `system.gameMode.specs.${mode}`;
  updateData[`${path}.health`] = source.system.health.set;
  updateData[`${path}.defense`] = source.system.defense.gameModeBonus;
  updateData[`${path}.toughness`] = source.system.armor.toughness.gameModeBonus;
  
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
  const itemData = item.system ?? item.data;
  if (itemData.improved) updateData["system.initialValue"] = itemData.initialValue - 1;
  return updateData
}
/* -------------------------------------------- */

/**
 * Set ranged to TRUE (as standard is FALSE) for old items
 * @private
 */
 function _weaponRanged(item, updateData) {
  if (item.type !== 'weapon') return updateData;
  const itemData = item.system ?? item.data;
  const meleeDist = {
    min: false,
    max: false
  }
  if (!itemData.range || itemData.range <= 2) meleeDist.min = true
  if (!itemData.rangeMax || itemData.rangeMax === itemData.range) meleeDist.max = true;
  const isRanged = meleeDist.min && meleeDist.max ? false : true;
  updateData["system.ranged"] = isRanged;
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
  const itemData = item.system ?? item.data;
  if (itemData.nrDice && itemData.diceType) {
    formula += `${itemData.nrDice}d${itemData.diceType}`;
    first = false
  }
  if (itemData.extraValue) {
    if (!first && itemData.extraValue > 0) formula += `+`;
    formula += `${itemData.extraValue}`
  }
  updateData["system.damageFormula"] = formula;

  // Resisted Damage
  if (itemData.damageResisted) {
    formula = ""
    first = true;
    if (itemData.damageResisted.nrDice && itemData.damageResisted.diceType) {
      formula += `${itemData.damageResisted.nrDice}d${itemData.damageResisted.diceType}`;
      first = false
    }
    if (itemData.damageResisted.extraValue) {
      if (!first && itemData.damageResisted.extraValue > 0) formula += `+`;
      formula += `${itemData.damageResisted.extraValue}`
    }
    updateData["system.damageResisted.damageFormula"] = formula;
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
  const itemMods = item.system ? item.system.itemMods : item.data.itemMods;
  const mods = {};
  const keys = []

  for (const k in itemMods) {
    if (Object.hasOwnProperty.call(itemMods, k)) {
      const m = itemMods[k];
      if (m.value) {
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
  
  updateData['system.modifiers'] = mods;
  return updateData
}
/* -------------------------------------------- */

/**
 * Try to identify Talent Degree and save old data on "Requirements" field
 * @private
 */
 function _talentDegree(item, updateData) {
  const itemData = item.system ?? item.data;
  if (item.type !== 'talent') return updateData;
  if (itemData.degree !== "") return updateData
  const prevDegree = itemData.shortDesc;
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
    updateData['system.degree'] = newDegree;
  } else {
    updateData['system.degree'] = 0;
  }
  let req = itemData.requirement;
  req = req === "" ? `${game.i18n.localize('age-system.talentDegree')}: ${itemData.shortDesc}` : ref += ` | ${game.i18n.localize('age-system.talentDegree')}: ${itemData.shortDesc}`
  updateData['system.requirement'] = req;

  return updateData
}
/* -------------------------------------------- */