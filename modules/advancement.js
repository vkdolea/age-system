import { sortObjArrayByName } from "./setup.js";
import { enrichTinyMCE } from "/systems/age-system/modules/setup.js";
import { ageSystem } from "./config.js";

/**
 * Interface to select type of application to be included into a Class Item type.
 * @param {String} classUuid  Unique identifier of Class Item.
 */
export class AdvancementAdd extends Application {
  constructor(classUuid, options = {}) {
    super(options)
    this._classUuid = classUuid;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['age-system-dialog', 'age-system', 'advancement-config'],
      template: 'systems/age-system/templates/advancement-add.hbs',
      resizable: false,
      minimizable: false,
      width: 400,
      height: 'auto',
    })
  }

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize("TYPES.Item.class")}: ${fromUuidSync(this._classUuid).name}`;
  }

  getData() {
    const data = super.getData();
    // const ageSystem = CONFIG.ageSystem
    data.config = ageSystem;
    data.class = fromUuidSync(this._classUuid);
    data.system = data.class.system;
    
    return data
  }

  activateListeners(html) {
    super.activateListeners(html)
    html.find(".options").click(this._onSelectAdv.bind(this));
  }

  _onSelectAdv(e) {
    const advType = e.target.dataset?.adv;
    if (!advType) return false;
    new AdvancementSetup(this._classUuid, advType).render(true);
    return this.close();
  }

  _refresh() {
    this.render(false)
  }
}

/**
 * Data containing information about Improvement (item or progressive). The same object is used when editing existing Improvement.
 */
class AdvData {
  constructor(advType, options = {}) {
    this.advType = advType;
    const data = options.data;

    if (data) {
      this.isEdit = true;
      this.index = {
        level: options.index.level,
        id: options.index.id
      };
      for (const k in data) {
        if (Object.hasOwnProperty.call(data, k)) {
          this[k] = data[k];
        }
      };
    } else {
      // Common data
      this.trait = advType === "item" ? "spec" : "health";
      this.alias = "";
      this.img = "";
  
      // Specific for item progressions
      if (advType === "item") {
        this.level = 1;
        this.itemOption = "all";
        this.itemArr = [];
        this.itemQtd = 0;
      }
    }
    if (!this.adv) this.adv = new Array(20).fill(0);
    if (this.itemArr) this.itemArrSize = this.itemArr.length;
    
    // Localize Trait names
    // const ageSystem = CONFIG.ageSystem;
    const arr = ageSystem.advData.stances.type[advType];
    const traitArr = [];
    const traitArrTypes = []
    for (let i = 0; i < arr.length; i++) {
      const e = arr[i];
      const obj = {key: e, name: ""};
      traitArrTypes.push(e)
      switch (e) {
        case 'health':
          obj.name = ageSystem.healthSys.healthName
          break;
        case 'powerPoints':
          obj.name = ageSystem.POWER_FLAVOR.points;
          break;
        case 'spec':
          obj.name = game.i18n.localize("age-system.item.spec")
          break;
        default:
          obj.name = game.i18n.localize(`age-system.${e}`)
          break;
      }
      traitArr.push(obj)
    };
    this.traitArr = sortObjArrayByName(traitArr, 'name');
    this.traitArrTypes = traitArrTypes;

    // Initialize data to select Progression Type for Item
    this.tType = this.traitArr[0].key;
  }
}

/**
 * Application used to configure details of Improvement.
 */
export class AdvancementSetup extends FormApplication {
  constructor(classUuid, advType, options = {}) {
    super(options);
    this.advData = new AdvData(advType, options);
    this.class = fromUuidSync(classUuid);
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      dragDrop: [{ dropSelector: ".item-drop-area" }],
      classes: ['age-system-dialog', 'age-system', 'advancement-config'],
      template: 'systems/age-system/templates/advancement-setup.hbs',
      resizable: false,
      minimizable: false,
      width: 420,
      height: 'auto'
    })
  }

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize("TYPES.Item.class")}: ${this.class.name}`;
  }

  getData() {
    const data = super.getData();
    // const ageSystem = CONFIG.ageSystem
    data.config = ageSystem;
    data.class = this.class;
    data.itemOptionObj = {
      multiple: game.i18n.localize("age-system.itemOptionMultiple"),
      all: game.i18n.localize("age-system.itemOptionAll"),
    };
    
    // Display data for Item Quantity in case of Multiple Item selection
    this.advData.itemArrSize = this.advData.itemArr?.length - 1 ?? undefined;


    return {
      ...data,
      ...this.advData,
    }
  }

  /**
   * Sorts Items selected for the Advancement
   * @returns {Object} Object with arrays containing Item types
   */
  _sortedTraits() {
    const arr = this.advData.traitArr;
    const obj = {};
    for (let a = 0; a < arr.length; a++) {
      const t = arr[a];
      const itemArr = this.advData.itemArr.filter(i => i.trait == t.key);
      obj[t.key] = {
        name: t.name,
        arr: itemArr
      };
    }
    return obj
  }

  activateListeners(html) {
    super.activateListeners(html)
    enrichTinyMCE(`.enrich-text`);
    html.find(`.item-delete`).click(this._removeItem.bind(this));
    html.find("button.cancel").click(e => this.close());
    html.find(".options-column input, select").change(this._valueChange.bind(this));
    html.find(`button.addItemProg`).click(this._addItemProg.bind(this));
  };

  /** @inheritdoc */
  async _onDrop(e) {
    // Confirm if drop action is valid
    if (!this.isEditable && this.advData.advType !== "item") return false;

    // Try to extract the data
    const data = TextEditor.getDragEventData(e);
    const item = fromUuidSync(data.uuid);
    const validTraits = this.advData.traitArrTypes;
    const type = item.type === "talent" ? (item.system.type === "spec" ? "spec" : 'talent') : item.type;
    if (!validTraits.includes(type)) return false;
    this._addItemData({
      type: item.type,
      trait: type,
      uuid: data.uuid,
      name: item.name
    })
  };

  _addItemProg() {
    const trait = this.advData.tType;
    const type = trait == 'spec' ? 'talent' : trait;
    this._addItemData({
      trait: trait,
      type: type,
      uuid: null,
      name: game.i18n.localize("age-system.itemProgression"),
      isItemProg: true
    })
  }

  _valueChange(event) {
    const e = event.currentTarget;
    const name = e.name;
    const isCheckbox = e.type === "checkbox";
    const value = isCheckbox ? e.checked : e.value;
    this.advData[name] = value;
    this._refresh();
  }

  _removeItem(e) {
    const id = e.currentTarget.dataset.index;
    const itemArr = this.advData.itemArr;
    itemArr.splice(id, 1);
    this._refresh();
  }

  _addItemData(data) {
    const arr = this.advData.itemArr;
    const size = arr.length;
    if (this.advData.itemOption == "singleP" && size) {
      arr.splice(0, 1, data);
    } else {
      arr.push(data)
    }
    this._refresh();
  }

  _updateObject(event, formData) {
    const c = this.class;
    const advData = this.advData;
    const type = advData.advType;

    // Fill in Alias and IMG if left in blank
    if (!formData.alias) {
      if (type === 'item') formData.alias = game.i18n.localize("age-system.advNewItem");
      else {
        const arr = advData.traitArr
        for (let i = 0; i < arr.length; i++) {
          const e = arr[i];
          if (e.key === formData.trait) {
            formData.alias = e.name;
            continue
          }
        }
      }
    };
    if (!formData.img) formData.img = ageSystem.advData.icon[type];

    switch (type) {
      case 'progressive': this._updateClassProgressive(c, formData); break;
      case 'item': this._updateClassItem(c, formData); break;
      default: break;
    }

    this._refresh();
  }

  _updateClassItem (c, d) {
    const itemArr = this.advData.itemArr;
    const isEdit = this.advData.isEdit;
    const index = this.advData.index;
    if (!itemArr.length) return game.i18n.localize("age-system.WARNING.emptyItemArr");

    const prog = {
      itemArr: itemArr,
      alias: d.alias,
      img: d.img,
      allowProgression: d.allowProgression,
      level: Number(d.level),
      itemOption: d.itemOption,
      itemQtd: Number(d.itemQtd),
    };

    const itemAdvs = foundry.utils.deepClone(c.system.advancements.item);

    if (isEdit) itemAdvs[index.id] = prog; else itemAdvs.push(prog);
    return c.update({"system.advancements.item": itemAdvs});
  }

  /**
   * Routine to add progressive advancement on Class item type
   * @param {Object} c Class item
   * @param {Object} d Data to identify Item to progress
   * @returns Updated class item
   */
  _updateClassProgressive(c, d) {
    const isEdit = this.advData.isEdit;
    const index = this.advData.index;
    const adv = d.adv;
    let isEmpty = true
    for (let i = 0; i < adv.length; i++) {
      const e = adv[i];
      if (!["0", 0, ""].includes(e)) isEmpty = false;
    }
    if (isEmpty) {
      const warning = game.i18n.localize("age-system.WARNING.emptyAdv");
      return ui.notifications.warn(warning);
    }
    const progAdvs = foundry.utils.deepClone(c.system.advancements.progressive);
    if (isEdit) progAdvs[index.id] = d;
    else progAdvs.push(d);
    return c.update({"system.advancements.progressive": progAdvs})
  }

  _refresh() {
    this.render(false)
  }
}

/** 
 * Object to handle Character leveling routine
 */
export class AgeLevel {
  constructor(actor, classItem, targetLevel, improvements, options = {}) {
    this.actor = actor;
    this.classItem = classItem;
    
    // Separate advancements per category
    const improveData = {};
    for (let i = 0; i < improvements.length; i++) {
      const imp = improvements[i];
      switch (imp.type) {
        case 'progressive':
          if (improveData[imp.trait]) improveData[imp.trait].push(imp)
          else improveData[imp.trait] = [imp];
          break;
        case 'item':
          if (improveData.item) improveData.item.push(imp)
          else improveData.item = [imp];
          break;
        default:
          if (improveData.invalidAdvance) improveData.invalidAdvance.push(imp)
          else improveData.invalidAdvance = [imp];
          break;
      }
    }

    // Stores organized Advancement Data at convenient location
    this.advData = improveData;
    
    // Setup updates for Class, Actor and Items
    this.levelUps = {};
    this.dataUpdates = {
      class: {
        ["system.level"]: targetLevel
      },
      actor: {},
      items: [],
      toLevel: targetLevel
    };
  }

  _prepareTraits(trait) {
    switch (trait) {
      case 'advAbility': this._levelAbl(); break;
      // 'health',
      // 'conviction',
      // 'relationship',
      // 'powerPoints',
      // 'defenseAndToughness',
      // 'focus',
      // 'talent',
      // 'spec',
      // 'power',
      // 'stunts'
      default:
        break;
    }
  };
  
  /**
   * Define total of advances and valid Abilities to be progressed or NULL if no Ability data is progressing this level
   * @returns Object with 'advances' and 'validKeys' or null if no Ability Advance is available for this level
   */
  _levelAbl() {
    const ablAdv = this.advData.advAbility;
    if (!ablAdv) return null;
    const classItem = this.classItem;
    const actor = this.actor;
    const dataUpdates = this.dataUpdates;

    let advances = 0;
    for (let q = 0; q < ablAdv.length; q++) {
      const e = Number(ablAdv[q].value);
      advances = advances + e;
    }
    this.advData.advances = advances;

    // Identify relevant Game Setting;
    const primaryAbl = game.settings.get("age-system", "primaryAbl");

    // Array to identify keys of Abilities available to be progressed in this level up
    let validKeys = []
    const ABILITY_KEYS = ageSystem.ABILITY_KEYS

    // Select valid keys to progress
    if (primaryAbl) {
      // CASE 1 - Game set to use Primary/Secondary Abilities: Improvements from Odd levels sums to Secondary Abilities while Primary Abilities benefits from Advancements on even levels
      const isOdd = dataUpdates.toLevel % 2 == 1 ? true : false;
      const primaryKeys = classItem.system.primaryAbl.filter(x => ABILITY_KEYS.includes(x));
      const secondaryKeys = ABILITY_KEYS.filter(x => !primaryKeys.includes(x));
      validKeys = isOdd ? secondaryKeys : primaryKeys;
    } else {
      // CASE 2 - No Primary/Secondary abilities: user can not progress Abilities progressed in the last time
      validKeys = foundry.utils.deepClone(ABILITY_KEYS);
      const lastAblAdv = actor?.system.advancements?.[actor.level]?.ablAdvance;
      if (lastAblAdv?.length) {
        for (let a = 0; a < lastAblAdv.length; a++) {
          const e = lastAblAdv[a].key;
          const index = validKeys.indexOf(e);
          if (index > -1) validKeys.splice(index, 1);
        }
      }
    }

    const abilities = [];
    const actorAbl = foundry.utils.deepClone(actor.system.abilities);
    for (let i = 0; i < validKeys.length; i++) {
      const e = validKeys[i];
      abilities.push({
        name: game.i18n.localize(`age-system.${e}`),
        key: e,
        curScore: actorAbl[e].value,
        curAdvance: actorAbl[e].advances,
        newAdvance: 0,
        sumAdvance: actorAbl[e].advances,
        newScore: actorAbl[e].value
      })
    }
    this.newAbilities = abilities;
  };

  _levelHealth(t = `health`) {
    const trait = this.advData[t];
    if (!trait) return null;
    const classItem = this.classItem;
    const actor = this.actor;
    const dataUpdates = this.dataUpdates;

    const traitParts = [];
    for (let q = 0; q < trait.length; q++) {
      const e = trait[q].value;
      traitParts.push(e);
    }
    let traitFormula = null;
    for (const p of traitParts) {
      traitFormula = null ? p : `${traitFormula} + ${p}`;
    }
    // Criar pontos de avaliar com Quick Eval: se passar, ótimo. Se não passar é pq tem que rolar dados => segue para rolagem de dados
    this.advData.advances = advances;
  };
  _levelConviction() {};
  _levelRelationship() {};
  _levelPowerPoints() {};
  _levelDefenseTough() {};
  _levelFocus() {};
  _levelTalents() {};
  _levelSpec() {};
  _levelPowers() {};
  _levelStunts() {};
  _updateDocuments() {};

}

/**
 * Interface used to level up character
 */
export class AgeProgUI extends FormApplication { // Realizar adequação para ler no Formulário e tratar cada parte do objeto
  constructor(data={}, options = {}) {
    super(options);
    this.data = data;
    this.newLevel = new AgeLevel(data.actor, data.classItem, data.targetLevel, data.improvements);
    this.workingTrait = 'none';
    
    // Initialize array with possible traits to level up
    this.traits = [
      'advAbility',
      'health',
      'conviction',
      'relationship',
      'powerPoints',
      'defenseAndToughness',
      'focus',
      'talent',
      'spec',
      'power',
      'stunts'
    ];

    this._evalNextTrait();
  }

  // get advData () {
  //   const trait = this.traits[0];
  //   const data = this.ageLevel.advData[trait];
  //   return data ?? null;
  // }

  get title() {
    const advType = game.i18n.localize(`age-system.${this.workingTrait}`);
    return advType;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['age-system-dialog', 'age-system', 'advancement-config'],
      template: 'systems/age-system/templates/advancement-level-pick-choice.hbs',
      resizable: false,
      minimizable: false,
      width: 600,
      height: 'auto'
    })
  }

  _prepData(trait) {
    switch (trait) {
      case 'advAbility': this._calcAbility(); break;
      // 'health',
      // 'conviction',
      // 'relationship',
      // 'powerPoints',
      // 'defenseAndToughness',
      // 'focus',
      // 'talent',
      // 'spec',
      // 'power',
      // 'stunts'
      default:
        break;
    }
  };

  getData() {
    const data = super.getData();
    const wt = this.workingTrait;
    // const ageSystem = CONFIG.ageSystem
    data.config = ageSystem;
    data.step = "next"; // Incluir lógica para finalizar progressão.
    this._prepData(wt)
    
    return {
      ...data,
      ...this.data,
      ...this.newLevel,
      trait: this.workingTrait
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    // React to - and + resource buttons
    html.find(".controls .change").click(ev => {
      const data = ev.currentTarget.dataset;
      const id = Number(data.index);
      const action = data.action;
      // Define change
      let delta = 0;
      if (action == "increase") delta = 1
      if (action == "decrease") delta = -1
      switch (this.workingTrait) {
        case "advAbility": this._changeAblAdv(id, delta)          
          break;
      
        default:
          break;
      }
    })

    // On pressing "Next"
    html.find("footer button.next").click(this._evalNextTrait.bind(this))
  }

  _evalNextTrait() {
    let wt = this.workingTrait;
    const ts = this.traits;
    const al = this.newLevel;
    if (wt == 'none') {
      wt = ts[0];
    } else {
      do {
        ts.shift()
      } while (ts.lenght > 0 && !al[ts[0]]);
      wt = ts[0];
    }
    if (wt) {
      al._prepareTraits(wt);
      this.advData = al[wt];
    }
    this.workingTrait = wt ?? null;
  }

  _changeAblAdv(i, d) {
    const abl = this.newLevel.newAbilities[i];
    let advances = this.newLevel.advData.advances;
    
    // CASE 1 - Ignore command if user is adding advances but none is available to be spent
    if (advances == 0 && d > 0) return null;
    // CASE 2 - Ignore command if user is trying to remove advance from a "New Advancement" with value ZERO
    if (abl.newAdvance == 0 && d < 0) return null;

    abl.newAdvance = Math.max(0, abl.newAdvance + d);
    this.newLevel.advData.advances = advances - d;
    this._calcAbility();
    this.render(false);
  }

  _ablAdvCost(s) {
    const scoreCost = ageSystem.advData.abilityScoreCost;
    const i = s < 1 ? 0 : Math.min(s - 1, scoreCost.length);
    return scoreCost[i];
  }

  _calcAbility() {
    const abilities = this.newLevel.newAbilities;
    for (let i = 0; i < abilities.length; i++) {
      const a = abilities[i];
      a.sumAdvance = a.curAdvance + a.newAdvance;
      a.newScore = a.curScore;

      while (a.sumAdvance >= this._ablAdvCost(a.newScore + 1)) {
        a.newScore = a.newScore + 1;
        a.sumAdvance = a.sumAdvance - this._ablAdvCost(a.newScore);
      };
    }
    this.newLevel.newAbilities = abilities;
  }

  _updateObject() {
    const data = this.data;
    switch (data.trait) {
      case "advAbility": if (data.advances > 0) return null
        
        break;
    
      default:
        break;
    }
    return this.data;
  }

  // Option to roll for Health and Power Points

  // Add data to advance Defense and Toughness

  // Add screen to Advance Owned Itens (watch out for order of priority)

  // Add screen to add new Items

}