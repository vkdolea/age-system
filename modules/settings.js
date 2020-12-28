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
    default: "modernBlue",
    type: String,
    choices: {
      "modernBlue": "SETTINGS.colorModernBlue",
      "fantasyGreen": "SETTINGS.colorFantasyGreen",
      "dragonRed": "SETTINGS.colorDragonRed",
      "roninGreen": "SETTINGS.colorRoninGreen",
      "expandedBlue": "SETTINGS.colorExpandedBlue",
      "foldedPurple": "SETTINGS.colorFoldedPurple",
    },
    onChange:()=>{
      window.location.reload(!1)}
  });
};  