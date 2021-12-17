import { ageSystem } from "./config.js";
import BreatherSettings from "./breather.js";

const debouncedReload = debounce(() => window.location.reload(), 100)
export const registerSystemSettings = async function() {

  /**
   * Register Breather Parameters
   */
  game.settings.register("age-system", "breatherParam", {
    scope: "world",
    config: false,
    default: {k: 5, kk: 10, addLevel: true, abl: 'cons'},
    type: Object,
    onChange: () => ageSystem.breather = game.settings.get("age-system", "breatherParam")
  });

  /**
   * Breather Configuration
   */
  game.settings.registerMenu("age-system", "breather", {
    name: "SETTINGS.breatherSettings",
    hint: "SETTINGS.breatherSettingsHint",
    icon: 'fas fa-medkit',
    label: "SETTINGS.breatherSettings",
    scope: "world",
    config: true,
    type: BreatherSettings,
    restricted: true
  });
  
  /**
   * Select color scheme
   */
  game.settings.register("age-system", "colorScheme", {
    name: "SETTINGS.colorScheme",
    hint: "SETTINGS.colorSchemeHint",
    scope: "client",
    config: true,
    default: "fantasy-blue",
    type: String,
    choices: {
      "modern-blue": "SETTINGS.colorModernBlue",
      "fantasy-blue": "SETTINGS.colorFantasyBlue",
      "dragon-red": "SETTINGS.colorDragonRed",
      "ronin-green": "SETTINGS.colorRoninGreen",
      // "expanded-blue": "SETTINGS.colorExpandedBlue",
      "folded-purple": "SETTINGS.colorFoldedPurple",
      "select-one": "SETTINGS.colorSelectOne",
      "the-grey": "SETTINGS.colorTheGrey",
      "red-warrior": "SETTINGS.colorRedWarrior",
      "never-dead": "SETTINGS.colorNeverDead"
    },
    onChange: ()=>{
      const newColor = game.settings.get("age-system", "colorScheme")
      ageSystem.colorScheme = newColor;
      game.user.setFlag("age-system", "colorScheme", newColor);
      game.ageSystem.ageRoller.refresh();
      if (game.settings.get("age-system", "serendipity") || game.settings.get("age-system", "complication")) game.ageSystem.ageTracker.refresh();
      [...game.actors.contents, ...Object.values(game.actors.tokens), ...game.items.contents].forEach((o) => {
        if (o) {
          // o.update({});
          // if (o.sheet != null && o.sheet._state > 0) o.sheet.render();
          if (o.sheet != null && o.sheet._state > 0) o.sheet.close();
        };
      });
    },
  });

  /**
   * Register Health System in use (Basic, The Expanse, MAGE, MAGE + Injury, MAGE + Injury + Vitality)
   */
    game.settings.register("age-system", "healthSys", {
    name: "SETTINGS.healthSys",
    hint: "SETTINGS.healthSysHint",
    scope: "world",
    config: true,
    default: "basic",
    type: String,
    choices: {
      "basic": "SETTINGS.healthSysbasic",
      "expanse": "SETTINGS.healthSysexpanse",
      "mage": "SETTINGS.healthSysmage",
      "mageInjury": "SETTINGS.healthSysmageInjury",
      // "mageVitality": "SETTINGS.healthSysmageVitality",
    },
    onChange: debouncedReload
  });
  
  /**
   * Register Ability selection
   */
    game.settings.register("age-system", "stuntAttack", {
    name: "SETTINGS.stuntAttack",
    hint: "SETTINGS.stuntAttackHint",
    scope: "world",
    config: true,
    default: 1,
    type: Number,
    onChange: () => ageSystem.stuntAttackPoints = game.settings.get("age-system", "stuntAttack")
  });

  /**
   * Register Ability selection
   */
   game.settings.register("age-system", "abilitySelection", {
    name: "SETTINGS.abilitySelection",
    hint: "SETTINGS.abilitySelectionHint",
    scope: "world",
    config: true,
    default: "main",
    type: String,
    choices: {
      "main": "SETTINGS.abilitySelectionMain",
      "dage": "SETTINGS.abilitySelectionDage",
    },
    onChange: debouncedReload
  });

  /**
  * Option to use Primary and Secondary Abilities
  */
  game.settings.register("age-system", "primaryAbl", {
    name: "SETTINGS.primaryAbl",
    hint: "SETTINGS.primaryAblHint",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: debouncedReload
  });

  /**
   * Register if world will use Game Mode and which one
   */
   game.settings.register("age-system", "healthMode", {
    name: "SETTINGS.healthMode",
    hint: "SETTINGS.healthModeHint",
    scope: "world",
    config: true,
    default: "health",
    type: String,
    choices: {
      "health": "SETTINGS.healthModehealth",
      "fortune": "SETTINGS.healthModefortune",
    },
    // onChange: debouncedReload
    onChange: () => {
      ageSystem.healthSys.healthName = game.i18n.localize(`SETTINGS.healthMode${game.settings.get("age-system", "healthMode")}`),
      [...game.actors.contents, ...Object.values(game.actors.tokens)]
        .filter((o) => {
          return o.data.type === "char";
        })
        .forEach((o) => {
          o.update({});
          if (o.sheet != null && o.sheet._state > 0) o.sheet.render();
        });
    },
  }); 

  /**
   * Register if world will use Game Mode and which one
   */
  game.settings.register("age-system", "gameMode", {
    name: "SETTINGS.gameMode",
    hint: "SETTINGS.gameModeHint",
    scope: "world",
    config: true,
    default: "pulp",
    type: String,
    choices: {
      "none": "SETTINGS.gameModeNone",
      "gritty": "SETTINGS.gameModeGritty",
      "pulp": "SETTINGS.gameModePulp",
      "cinematic": "SETTINGS.gameModeCinematic",
    },
    onChange: () => {
      ageSystem.healthSys.mode = game.settings.get("age-system", "healthMode"),
      [...game.actors.contents, ...Object.values(game.actors.tokens)]
        .filter((o) => {
          return o.data.type === "char";
        })
        .forEach((o) => {
          o.update({});
          if (o.sheet != null && o.sheet._state > 0) o.sheet.render();
        });
    },
  });

  /**
   * Register World's Initiative Focus
   */
   game.settings.register("age-system", "initiativeFocus", {
    name: "SETTINGS.initiativeFocus",
    hint: "SETTINGS.initiativeFocusHint",
    scope: "world",
    config: true,
    default: "",
    type: String,
    onChange: debouncedReload
  });

  /**
   * Configure Weapon Groups
   */
   game.settings.register("age-system", "weaponGroups", {
    name: "SETTINGS.weaponGroups",
    hint: "SETTINGS.weaponGroupsHint",
    scope: "world",
    config: true,
    default: "",
    type: String,
    onChange: debouncedReload
  });

 /**
   * Register currency type
   */
  game.settings.register("age-system", "wealthType", {
    name: "SETTINGS.wealthType",
    hint: "SETTINGS.wealthTypeHint",
    scope: "world",
    config: true,
    default: "resources",
    type: String,
    choices: {
      "resources": "SETTINGS.wealthTypeResources",
      "income": "SETTINGS.wealthTypeIncome",
      "currency": "SETTINGS.wealthTypeCurrency",
      "coins": "SETTINGS.wealthTypeCoins",
    },
    onChange: debouncedReload
  });

  /**
   * Select occupation label to best fit world's setting
   */
  game.settings.register("age-system", "occupation", {
    name: "SETTINGS.occupation",
    hint: "SETTINGS.occupationHint",
    scope: "world",
    config: true,
    default: "profession",
    type: String,
    choices: {
      "profession": "SETTINGS.occprofession",
      "class": "SETTINGS.occclass",
    },
    onChange: debouncedReload
  });

  /**
   * Select ancestry flavor
   */
  game.settings.register("age-system", "ancestryOpt", {
    name: "SETTINGS.ancestryOpt",
    hint: "SETTINGS.ancestryOptHint",
    scope: "world",
    config: true,
    default: "ancestry",
    type: String,
    choices: {
      "ancestry": "SETTINGS.ancestryOptancestry",
      "origin": "SETTINGS.ancestryOptorigin",
      "species": "SETTINGS.ancestryOptspecies",
      "race": "SETTINGS.ancestryOptrace",
    },
    onChange: debouncedReload
  });

  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register("age-system", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: 0
  });

  /**
   * Register if world will use Conviction
   */
  game.settings.register("age-system", "useConviction", {
    name: "SETTINGS.useConviction",
    hint: "SETTINGS.useConvictionHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: debouncedReload
  });

  /**
   * Register if world will use Fatigue
   */
  game.settings.register("age-system", "useFatigue", {
    name: "SETTINGS.useFatigue",
    hint: "SETTINGS.useFatigueHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: debouncedReload
  });

  /**
   * Register if world will use Power Points
   */
  game.settings.register("age-system", "usePowerPoints", {
    name: "SETTINGS.usePowerPoints",
    hint: "SETTINGS.usePowerPointsHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: debouncedReload
  });

  /**
  * Consume Power Points on roll
  */
  game.settings.register("age-system", "consumePP", {
    name: "SETTINGS.consumePP",
    hint: "SETTINGS.consumePPHint",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: () => ageSystem.autoConsumePP = game.settings.get("age-system", "consumePP")
  });

  /**
   * Register if world will use Complication/Chrun
   */
  game.settings.register("age-system", "complication", {
    name: "SETTINGS.complication",
    hint: "SETTINGS.complicationHint",
    scope: "world",
    config: true,
    default: "none",
    type: String,
    choices: {
      "none": "SETTINGS.complicationNone",
      "complication": "SETTINGS.compcomplication",
      "churn": "SETTINGS.compchurn"
    },
    onChange: () => game.ageSystem.ageTracker.refresh()
  });

  /**
   * World's Complication/Churn value
   */
   game.settings.register("age-system", "complicationValue", {
    name: "SETTINGS.complicationValue",
    // hint: "SETTINGS.complicationValueHint",
    scope: "world",
    config: false,
    default: {max: 30, actual: 0},
    type: Object,
    onChange: async () => {if (await game.settings.get("age-system", "complication")) game.ageSystem.ageTracker.refresh()}
  });  

  /**
   * Register if world will use Serendipity
   */
   game.settings.register("age-system", "serendipity", {
    name: "SETTINGS.serendipity",
    hint: "SETTINGS.serendipityHint",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: () => game.ageSystem.ageTracker.refresh()
  });

  /**
   * World's Serendipity value
   */
  game.settings.register("age-system", "serendipityValue", {
    name: "SETTINGS.serendipityValue",
    // hint: "SETTINGS.serendipityValueHint",
    scope: "world",
    config: false,
    default: {max: 18, actual: 0},
    type: Object, 
    onChange: async () => {if (await game.settings.get("age-system", "serendipity")) game.ageSystem.ageTracker.refresh()}
  });

  /**
   * Let Observers roll (chat and sheet)
   */
   game.settings.register("age-system", "observerRoll", {
    name: "SETTINGS.observerRoll",
    hint: "SETTINGS.observerRollHint",
    scope: "world",
    config: true,
    default: "true",
    type: Boolean,
    onChange: debouncedReload
  });

  /**
  * Register option made for Setting Migration over time
  */
  game.settings.register("age-system", "settingsMigrationData", {
    scope: "world",
    config: false,
    default: [],
    type: Array
  });

  
  /**
   * Register which Conditios set is used
   */
  game.settings.register("age-system", "inUseConditions", {
    scope: "world",
    config: false,
    default: 'expanse', // Currently, the only valid values are 'custom' and 'expanse'
    type: String,
    onChange: async () => ageSystem.inUseStatusEffects = await game.settings.get("age-system", "inUseConditions"),
  })
  
  /**
   * Register custom token Effects array
   */
  game.settings.register("age-system", "customTokenEffects", {
    scope: "world",
    config: false,
    default: [],
    type: Array
  })

  /**
   * Register if world will use Toughness
   * TODO - NOT IN USE ANYMORE - WATCH AND DELETE
   */
  game.settings.register("age-system", "useToughness", {
    name: "SETTINGS.useToughness",
    hint: "SETTINGS.useToughnessHint",
    scope: "world",
    config: false,
    default: true,
    type: Boolean,
    onChange: debouncedReload
  }); 

  /**
   * Option to use split armor
   * TODO - NOT IN USE ANYMORE - WATCH AND DELETE
   */
  game.settings.register("age-system", "useBallisticArmor", {
    name: "SETTINGS.useBallisticArmor",
    hint: "SETTINGS.useBallisticArmorHint",
    scope: "world",
    config: false,
    default: true,
    type: Boolean,
    onChange: debouncedReload
  });
};

// Adds game setting to select focus compendium after loading world's compendia!
export const loadCompendiaSettings = function() {
  /**
   * Select compendium to list focus
   */
  game.settings.register("age-system", "masterFocusCompendium", {
    name: "SETTINGS.masterFocusCompendium",
    hint: "SETTINGS.masterFocusCompendiumHint",
    scope: "world",
    config: true,
    default: "age-system.focus",
    type: String,
    choices: ageSystem.itemCompendia,
    onChange: async ()=>{ageSystem.focus = compendiumList(await game.settings.get("age-system", "masterFocusCompendium"))}
  });
};

export function stuntSoNice(colorChoices, systems) {
  /**
   * Select Dice so Nice effect for Stunt Die
   */
  game.settings.register("age-system", "stuntSoNice", {
    name: "SETTINGS.stuntSoNice",
    hint: "SETTINGS.stuntSoNiceHint",
    scope: "client",
    config: true,
    default: "bronze",
    type: String,
    choices: colorChoices,
    onChange:()=>{game.user.setFlag("age-system", "stuntSoNice", game.settings.get("age-system", "stuntSoNice"))}
  });

  // systems.splice(0, 0, 'none');
  // game.settings.register("age-system", "stuntDieSystem", {
  //   name: "SETTINGS.stuntSoNice",
  //   hint: "SETTINGS.stuntSoNiceHint",
  //   scope: "client",
  //   config: false,
  //   default: "none",
  //   type: String,
  //   choices: systems,
  //   onChange:()=>{game.user.setFlag("age-system", "stuntDieSystem", game.settings.get("age-system", "stuntDieSystem"))}
  // });
};

// Creates the Options object with all compendia in alphabetic order
export function allCompendia(docType) {
  let list = {};
  game.packs.map(e => {
    if (e.metadata.entity === docType) { // Remove to prepare for 0.9.x
    // if (e.metadata.type === docType) {
      const newItem = {[`${e.metadata.package}.${e.metadata.name}`]: e.metadata.label};
      list = {
        ...list,
        ...newItem
      }
    }
  });
  return list
};

// Creates a list of entries in the Compendium (name and _id)
export function compendiumList(compendiumName) {
  let dataList = [];
  if ([null, undefined, false, ""].includes(compendiumName)) return dataList;
  let dataPack = game.packs.get(compendiumName);
  if (!dataPack?.index) return dataList;
  dataPack.index.map(i => {
    if(i.type === "focus") dataList.push({
    _id: i._id,
    name: i.name
  })})
  return dataList;
};