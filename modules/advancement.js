import { sortObjArrayByName } from "./setup.js";
import { enrichTinyMCE } from "/systems/age-system/modules/setup.js";

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

  getData() {
    const data = super.getData();
    const ageSystem = CONFIG.ageSystem
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
    const ageSystem = CONFIG.ageSystem;
    const arr = ageSystem.adv.type[advType];
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

export class AdvancementSetup extends FormApplication {
  constructor(classUuid, advType, options = {}) {
    super(options);
    this.advData = new AdvData(advType, options.edit);
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

  getData() {
    const data = super.getData();
    const ageSystem = CONFIG.ageSystem
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
   * @returns Object with arrays with Item types
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
    if (this.isEditable && this.advData.advType === "item") html.find(".item-drop-area")[0].addEventListener("drop", this._onDrop.bind(this));
  };

  /** @inheritdoc */
  async _onDrop(e) {
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
    if (!formData.img) formData.img = CONFIG.ageSystem.advIcon[type];

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