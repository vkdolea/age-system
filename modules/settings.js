export const registerSystemSettings = function() {

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
      onChange:()=>{
        window.location.reload(!1)}
  });

  /**
   * Register if world will use Toughness
   */
  game.settings.register("age-system", "useToughness", {
    name: "SETTINGS.useToughness",
    hint: "SETTINGS.useToughnessHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange:()=>{
      window.location.reload(!1)}
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
    onChange:()=>{
      window.location.reload(!1)}
  });

  /**
   * Register if world will use Power Points
   */
  game.settings.register("age-system", "usePowerPoints", {
      name: "SETTINGS.usePowerPoints",
      hint: "SETTINGS.usePowerPointsHint",
      scope: "client",
      config: true,
      default: true,
      type: Boolean,
      onChange:()=>{
        window.location.reload(!1)}
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
      },
      onChange:()=>{
        window.location.reload(!1)}
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
    onChange: () => {
      [...game.actors.entities, ...Object.values(game.actors.tokens)]
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
   * Select color scheme
   */
  game.settings.register("age-system", "colorScheme", {
    name: "SETTINGS.colorScheme",
    hint: "SETTINGS.colorSchemeHint",
    scope: "client",
    config: true,
    default: "modern-blue",
    type: String,
    choices: {
      "modern-blue": "SETTINGS.colorModernBlue",
      "fantasy-blue": "SETTINGS.colorFantasyBlue",
      "dragon-red": "SETTINGS.colorDragonRed",
      // "ronin-green": "SETTINGS.colorRoninGreen",
      // "expanded-blue": "SETTINGS.colorExpandedBlue",
      "folded-purple": "SETTINGS.colorFoldedPurple",
    },
    onChange:()=>{window.location.reload(!1)}
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
  onChange:()=>{window.location.reload(!1)}
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
  onChange:()=>{window.location.reload(!1)}
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
    scope: "global",
    config: true,
    default: "age-system.focus",
    type: String,
    choices: allCompendia(),
    onChange:()=>{
      window.location.reload(!1)}
  });
};

// Creates the Options object with all compendia in alphabetic order
function allCompendia() {
  let list = {};
  let compendia = game.packs.map(e => e);
  compendia = compendia.sort(function(a, b) {
    const nameA = a.title.toLowerCase();
    const nameB = b.title.toLowerCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
  for (let c = 0; c < compendia.length; c++) {
    const comp = compendia[c];
    list[comp.collection] = comp.title;
  };
  return list
};

// Creates a list of entries in the Compendium (name and _id)
export function compendiumList(compendiumName) {
  let dataPack = game.packs.get(compendiumName);
  let dataList = [];
  let i = 0;
  dataPack.getIndex().then(function(){
  for (let i = 0; i < dataPack.index.length; i++) {
    const entry = dataPack.index[i];
    if(entry)
      dataList[i] = {
        _id: entry._id,
        name: entry.name
      };   
    }
  });
  return dataList;
};