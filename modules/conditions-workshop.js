export default class ConditionsWorkshop extends Application {
  constructor(options = {}) {
    super(options)
    this._inUseConditions = game.settings.get("age-system", "inUseConditions");
    this._customEffects = game.settings.get("age-system", "customTokenEffects");
    this._inUseEffects = CONFIG.statusEffects;

    let hasDead = false;
    for (const k in this._customEffects) {
      if (Object.hasOwnProperty.call(this._customEffects, k)) {
        if (this._customEffects[k].id === `dead`) hasDead = true;
      }
    }
    if (!hasDead) this._customEffects.splice(0, 0, {
      icon: `${CONFIG.ageSystem.statusEffectsPath}pirate-grave.svg`,
      id: `dead`,
      name: game.i18n.localize(`EFFECT.StatusDead`),
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
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
      html.find('.delete-effect.active').click(this._onDeleteEffect.bind(this));
      html.find('.add-effect').click(this._onAddEffect.bind(this));
      html.find('.change-order').click(this._onOrderEffect.bind(this));
      html.find('.copy-effects').click(this._onCopyToCustom.bind(this));
      html.find('.export').click(this._onSaveToFile.bind(this));
      html.find('.import').click(this._onReadFromFile.bind(this));
    }
    html.find('.in-use-condition input').change(this._onInUseConditionsSwap.bind(this));
    html.find('.save-close').click(this._onCloseWorkshop.bind(this));
  }

  _onSaveToFile(ev) {
    const fileName = `fvtt-${game.system.id}-custom-effects-${game.world.id}.json`;
    const effects = game.settings.get("age-system", "customTokenEffects");
    saveDataToFile(JSON.stringify(effects), 'text/json', fileName);
  }

  /**
   * Render an import dialog for updating the data related to this Document through an exported JSON file
   * @returns {Promise<void>}
   */
  async _onReadFromFile() {
    new Dialog({
      title: `Import Custom Effects`,
      content: await foundry.applications.handlebars.renderTemplate("templates/apps/import-data.html", {
        hint1: game.i18n.format("DOCUMENT.ImportDataHint1", {document: game.i18n.localize("age-system.customEffectsSet")})
      }),
      buttons: {
        import: {
          icon: '<i class="fas fa-file-import"></i>',
          label: game.i18n.format("age-system.import"),
          callback: html => {
            const form = html.find("form")[0];
            if ( !form.data.files.length ) return ui.notifications.error("You did not upload a data file!");
            readTextFromFile(form.data.files[0]).then(json => this.importFromJSON(json));
          }
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.format("age-system.cancel"),
        }
      },
      default: "import"
    }, {
      width: 400
    }).render(true);
  }

  /**
   * Read a JSON from a file with Custom Token Effects data, validate and save it.
   * @param {string} json Stringfied JSON object
   */
  importFromJSON(json){
    let effects
    try {
      effects = JSON.parse(json);
      // this._customEffects = effects;
    }
    catch(err) {
      console.log(err.message)
      return ui.notifications.warn(game.i18n.localize("age-system.invalidFileContent"));
    }
    this._customEffects = effects;
    this._refresh();
  }

  _onCopyToCustom(ev) {
    const origin = ev.currentTarget.dataset.origin;
    const newEffects = foundry.utils.deepClone(CONFIG.ageSystem.statusEffects[origin]);
    for (let ef = 0; ef < newEffects.length; ef++) {
      newEffects[ef].name = game.i18n.localize(newEffects[ef].name);
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
      name: "",
      id: 'AGEcustom.' + foundry.utils.randomID(20),
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
    let path = event.currentTarget.src.toLowerCase();
    let current
    if (path.includes("https://")) current = path.replace(/https:\/\/.*?\//i, '');
    if (path.includes("http://")) current = path.replace(/http:\/\/.*?\//i, '');
    const conditionId = event.currentTarget.closest('.individual-effects').dataset.conditionI;
    const condition = this._customEffects[conditionId];
    const fp = new FilePicker({
      current,
      type: "image",
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
        condition.name = newValue;
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