export default class AdvancementConfig extends Application {
  constructor(classUuid, options = {}) {
    super(options)
    this._classUuid = classUuid;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['age-system-dialog', 'age-system'],
      template: 'systems/age-system/templates/advancement-config.hbs',
      resizable: true,
      minimizable: false,
      width: 400,
      height: 'auto',
    })
  }

  getData() {
    const data = super.getData();
    data.class = fromUuidSync(this._classUuid);
    data.system = data.class.system;
    data.config = CONFIG.ageSystem;

    return data
  }

  activateListeners(html) {
    super.activateListeners(html)

    if (this._inUseConditions == 'custom') {
      html.find(".adv-options li").click(this._onSelectAdv.bind(this));
      // Update changes on fields
      html.find('.user-entry').change(this._onFieldUpdate.bind(this));
      html.find('img.user-entry').click(ev => this._onEditImage(ev));
      html.find('.copy-effects').click(this._onCopyToCustom.bind(this));
    }
    html.find('.in-use-condition input').change(this._onInUseConditionsSwap.bind(this));
    html.find('.save-close').click(this._onCloseWorkshop.bind(this));
  }

  _onSelectAdv(e) {
    const advType = e.dataset?.adv;
    switch (advType) {
      case "health":
        
        break;
      
      case "ability":
        
        break;

      case "item":
        
        break;
    
      case "def-tough":
        
        break;

      default:
        break;
    }
  }

  _onCopyToCustom(ev) {
    const origin = ev.currentTarget.dataset.origin;
    const newEffects = foundry.utils.deepClone(CONFIG.ageSystem.statusEffects[origin]);
    for (let ef = 0; ef < newEffects.length; ef++) {
      newEffects[ef].label = game.i18n.localize(newEffects[ef].label);
      newEffects[ef].id = newEffects[ef].id === `dead` ? `dead` : ('AGEcustom.' + foundry.utils.randomID(20));
      const newDesc = newEffects[ef].flags?.["age-system"]?.desc;
      const newFlags = {
        "age-system": {
          conditionType: 'custom',
          desc: newDesc ? game.i18n.localize(newDesc) : ""
        }
      };
      if (!newEffects[ef].flags) {
        newEffects[ef].flags = newFlags
      } else {
        foundry.utils.mergeObject(newEffects[ef].flags, newFlags)
      }
    }
    this._customEffects = newEffects;
    this._refresh()
  }

  _onInUseConditionsSwap(ev) {
    this._inUseConditions = ev.currentTarget.value;
    this._refresh();
  }

  async _onCloseWorkshop(ev) {
    const type = this._inUseConditions;
    const effects = this._customEffects;
    // Check if icons are repeated
    const icons = []
    if (type === 'custom') {
      for (let e = 0; e < effects.length; e++) {
        const icon = effects[e].icon;
        if (icons.includes(icon)) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.repetedIconCondition"));
        icons.push(icon);
      }
    }
    await game.settings.set("age-system", "inUseConditions", type);
    await game.settings.set("age-system", "customTokenEffects", effects);
    if (type === 'custom') CONFIG.ageSystem.statusEffects[type] = effects;
    CONFIG.statusEffects = foundry.utils.deepClone(CONFIG.ageSystem.statusEffects[type]);
    this.close();
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

  _onManageChange(ev) {
    const conditionIndex = ev.currentTarget.closest('.individual-effects').dataset.conditionI;
    const changeIndex = ev.currentTarget.closest('.effect-change').dataset.index;
    const condition = this._customEffects[conditionIndex];
    const operation = ev.currentTarget.dataset.action;
    switch (operation) {
      case 'add':
        const newEffect = {
          key: "",
          mode: "",
          value: ""
        };
        if (condition.changes) {
          condition.changes.push(newEffect)
        } else {
          condition.changes = [newEffect]
        }
        break;
    
      case 'delete':
        condition.changes.splice(changeIndex, 1);

      default:
        break;
    }
    this._refresh();
  };

  _refresh() {
    this.render(false)
  }
}