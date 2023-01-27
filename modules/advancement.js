export class AdvancementAdd extends Application {
  constructor(classUuid, options = {}) {
    super(options)
    this._classUuid = classUuid;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['age-system-dialog', 'age-system'],
      template: 'systems/age-system/templates/advancement-add.hbs',
      resizable: true,
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
    html.find(".adv-options li").click(this._onSelectAdv.bind(this));
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

export class AdvancementSetup extends Application {
  constructor(classUuid, advType, options = {}) {
    super(options)
    this._classUuid = classUuid;
    this._advType = advType;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['age-system-dialog', 'age-system'],
      template: 'systems/age-system/templates/advancement-setup.hbs',
      resizable: true,
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
    data.advType = this._advType;
    data.traitArr = [];
    let arr = [];

    // Select possible traits to configure the advancement
    switch (data.advType) {
      case "progressive":
        arr = ['health', 'conviction', 'advAbility', 'defenseAndToughness', 'toughness', 'defense']
        break;

      case "item":
        arr = ['spec', 'stunts', 'talent', 'power', 'focus']
        break;
    
      default:
        break;
    }

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
      data.traitArr.push(obj)
    }
    console.log(data)
    return data
  }

  activateListeners(html) {
    super.activateListeners(html)
  }

  _onFieldUpdate(ev) {
    const conditionIndex = ev.currentTarget.closest('.individual-effects').dataset.conditionI;
    const part = ev.currentTarget.dataset.field;
    let changeId = ev.currentTarget.closest('.effect-change');
    if (changeId) changeId = changeId.dataset.index;
    const newValue = ev.currentTarget.value;
    const condition = this._customEffects[conditionIndex];
    if (!condition.flags) condition.flags = {};
    if (!condition.flags["age-system"]) condition.flags["age-system"] = {};

    switch (part) {
      case 'name':
        condition.label = newValue;
        break;

      case 'desc':
        condition.flags["age-system"].desc = newValue;
        break;
      
      case 'isCondition':
        condition.flags["age-system"].isCondition = ev.currentTarget.checked;
        break;

      case 'change-key':
        condition.changes[changeId].key = newValue;
        break;
      
      case 'change-mode':
        condition.changes[changeId].mode = newValue;
        break;

      case 'change-value':
        condition.changes[changeId].value = newValue;
        break;

      case 'img':
        condition.icon = newValue;
        break;
    
      default:
        break;
    }
    this._refresh();
  }

  _refresh() {
    this.render(false)
  }
}