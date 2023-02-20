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
  constructor(advType) {
    this.advType = advType;

    // Common data
    this.trait = advType === "item" ? "spec" : "health";
    this.alias = "";
    this.img = "";
    this.adv = new Array(20).fill(0);

    
    // Specific for item progressions
    if (advType === "item") {
      this.level = 1;
      this.itemOption = "single";
      this.itemArr = [];
      this.traitArrObj = {};
    }
    
    // Localize Trait names
    const ageSystem = CONFIG.ageSystem;
    const arr = ageSystem.adv.type[advType];
    const traitArr = [];
    for (let i = 0; i < arr.length; i++) {
      const e = arr[i];
      const obj = {key: e, name: ""};
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
    this.traitArr = traitArr;
  }
}

export class AdvancementSetup extends FormApplication {
  constructor(classUuid, advType, options = {}) {
    super(options);
    this.advData = new AdvData(advType);
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
      height: 'auto',
    })
  }

  getData() {
    const data = super.getData();
    const ageSystem = CONFIG.ageSystem
    data.config = ageSystem;
    data.class = this.class;
    data.itemOptionObj = {
      single: game.i18n.localize("age-system.itemOptionSingle"),
      singleP: game.i18n.localize("age-system.itemOptionSingleProgress"),
      multiple: game.i18n.localize("age-system.itemOptionMultiple"),
      all: game.i18n.localize("age-system.itemOptionAll"),
    }
    return {
      ...data,
      ...this.advData
    }
  }

  activateListeners(html) {
    enrichTinyMCE(`.enrich-text`);
    html.find(`.item-delete`).click(this._removeItem.bind(this));
    html.find("button.cancel").click(e => this.close());
    html.find("[name=itemOption]").change(this._changeItemOption.bind(this));
    html.find("[name=trait]").change(this._changeTrait.bind(this));
    if (this.isEditable && this.advData.advType === "item") html.find(".item-drop-area")[0].addEventListener("drop", this._onDrop.bind(this));
    super.activateListeners(html)
  };

  /** @inheritdoc */
  async _onDrop(e) {
    // Try to extract the data
    const data = TextEditor.getDragEventData(e);
    const item = fromUuidSync(data.uuid);
    const type = item.type === "talent" ? (item.system.type === "spec" ? "spec" : 'talent') : item.type;
    if (type != this.advData.trait) return false;
    this._addItemData({
      type: item.type,
      trait: type,
      uuid: data.uuid,
      name: item.name
    })
  };

  _changeItemOption(e) {
    this.advData.itemOption = e.currentTarget.value
    this._refresh()
  }

  _changeTrait(e) {
    const newTrait = e.currentTarget.value;
    const newArr = this.advData.traitArrObj[newTrait];
    this.advData.trait = newTrait;
    this.advData.itemArr = newArr ?? [];
    this._refresh();
  }

  _removeItem(e) {
    const id = e.currentTarget.dataset.index;
    const itemArr = this.advData.itemArr;
    itemArr.splice(id, 1);
    this._refresh();
  }

  _addItemData(data) {
    this.advData.itemArr.push(data)
    this._refresh();
  }

  _updateObject(event, formData) {
    const c = this.class;
    switch (this.advData.advType) {
      case 'progressive': this._updateClassProgressive(c, formData); break;
      case 'item': this._updateClassItem(c, formData); break;
      default: break;
    }
    this._refresh();
  }

  _updateClassItem (c, d) {
    this._data = d;
    this._refresh();
  }

  _updateClassProgressive(c, d) {
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
    if (!d.alias) {
      const arr = this.advData.traitArr
      for (let i = 0; i < arr.length; i++) {
        const e = arr[i];
        if (e.key === d.trait) {
          d.alias = e.name;
          continue
        }
      }
    };
    if (!d.img) d.img = CONFIG.ageSystem.advIcon.progressive;
    progAdvs.push(d);
    return c.update({"system.advancements.progressive": progAdvs})
  }

  _refresh() {
    this.render(false)
  }
}