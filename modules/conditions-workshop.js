export default class ConditionsWorkshop extends Application {
  constructor(options = {}) {
    super(options)
    this._inUseConditions = game.settings.get("age-system", "inUseConditions");
    this._customEffects = game.settings.get("age-system", "customTokenEffects");
    this._inUseEffects = CONFIG.statusEffects;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['age-system-dialog', 'age-system'],
      id: 'age-conditions-workshop',
      template: 'systems/age-system/templates/conditions-workshop.hbs',
      resizable: true,
      minimizable: false,
      width: 900,
      height: 'auto',
      title: game.i18n.localize('age-system.conditionsWorkshop'),
    })
  }

  getData() {
    const data = super.getData();
    data.conditions = this._inUseConditions === 'custom' ? this._customEffects : CONFIG.ageSystem.statusEffects[this._inUseConditions];
    data.inUseConditions = this._inUseConditions;
    data.modes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
      obj[e[1]] = game.i18n.localize("EFFECT.MODE_"+e[0]);
      return obj;
    }, {})

    data.radioB = {
      name: "inUseConditions",
      choices: {
        expanse: "The Expanse",
        custom: game.i18n.localize('age-system.custom')
      },
      options: {
        hash: {
          checked: data.inUseConditions
        }
      }
    }
    return data
  }

  activateListeners(html) {
    super.activateListeners(html)

    if (this._inUseConditions == 'custom') {
      html.find(".effect-control").click(this._onManageChange.bind(this));
      // Update changes on fields
      html.find('.user-entry').change(this._onFieldUpdate.bind(this));
      html.find('img.user-entry').click(ev => this._onEditImage(ev));
      html.find('.delete-effect').click(this._onDeleteEffect.bind(this));
      html.find('.add-effect').click(this._onAddEffect.bind(this));
      html.find('.change-order').click(this._onOrderEffect.bind(this));
      html.find('.copy-effects').click(this._onCopyToCustom.bind(this));
    }
    html.find('.in-use-condition input').change(this._onInUseConditionsSwap.bind(this));
    html.find('.save-close').click(this._onCloseWorkshop.bind(this));
  }

  _onCopyToCustom(ev) {
    const origin = ev.currentTarget.dataset.origin;
    const newEffects = foundry.utils.deepClone(CONFIG.ageSystem.statusEffects[origin]);
    for (let ef = 0; ef < newEffects.length; ef++) {
      newEffects[ef].label = game.i18n.localize(newEffects[ef].label);
      newEffects[ef].flags["age-system"].desc = game.i18n.localize(newEffects[ef].flags["age-system"]?.desc);
      newEffects[ef].flags["age-system"].conditionType = 'custom';
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

  _onOrderEffect(ev) {
    const i = Number(ev.currentTarget.closest('.feature-controls').dataset.conditionI);
    const direction = ev.currentTarget.dataset.direction;
    const size = this._customEffects.length;
    const effect = foundry.utils.deepClone(this._customEffects[i]);
    switch (direction) {
      case "up":
        if (i == 0) break;
        this._customEffects.splice(i, 1);
        this._customEffects.splice(i - 1, 0, effect);
        break;
    
      case 'down':
        if (i == size-1) break;
        this._customEffects.splice(i, 1);
        this._customEffects.splice(i + 1, 0, effect);
      default:
        break;
    }
    this._refresh();
  }

  _onAddEffect(ev) {
    const pos = ev.currentTarget.dataset.position;
    const newEffect = {
      icon: "icons/svg/aura.svg",
      label: "",
      id: 'AGEcustom.' + this._makeId(20),
      changes: [],
      flags: {
        "age-system": {
          desc: "",
          isCondition: false,
          conditionType: 'custom'
        }
      }
    }
    switch (pos) {
      case 'top':
        this._customEffects.splice(0, 0, newEffect);
        break;
    
      case 'bottom':
        this._customEffects.push(newEffect);
        break;

      default:
        break;
    }
    this._refresh();
  }

  _onDeleteEffect(ev) {
    const index = ev.currentTarget.closest('.feature-controls').dataset.conditionI;
    this._customEffects.splice(index, 1);
    this._refresh();
  }

  _onEditImage(event) {
    const current = event.currentTarget.src.replace(/http:\/\/.*?\//, '');
    const conditionId = event.currentTarget.closest('.individual-effects').dataset.conditionI;
    const condition = this._customEffects[conditionId];
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: path => {
        event.currentTarget.src = path;
        condition.icon = path;
        // this._saveCustomEffects();
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
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

  _makeId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
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