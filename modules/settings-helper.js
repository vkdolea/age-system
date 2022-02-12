import { ageSystem } from "./config.js";

export class QuickSettings extends FormApplication {
  constructor(object = {}, options = {}) {
    super(object, options);
    this.config = {};
  }
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'quick-settings',
      template: 'systems/age-system/templates/quick-settings.hbs',
      resizable: false,
      minimizable: false,
      width: '700',
      height: 'auto',
      title: game.i18n.localize('SETTINGS.quickSettings'),
      classes: ["age-system", "dialog", `colorset-${ageSystem.colorScheme}`],
      resizable: false,
      closeOnSubmit: false,
      submitOnClose: true,
      submitOnChange: true,
    })
  }

  getData() {
    const data = {
      ...super.getData(),
      presets: ageSystem.gameSettings,
      currentPreset: ageSystem.gameSettings[this.config.preset],
      colors: ageSystem.colorScheme,
      config: this.config,
      settings: {}
    }
    
    const canConfigure =  game.user.can("SETTINGS_MODIFY");
    const gs = game.settings;
    // Classify all settings
    for ( let setting of gs.settings.values() ) {

      // Exclude settings the user cannot change
      if (!canConfigure && (setting.scope !== "client")) continue;

      // Update setting data
      const s = foundry.utils.deepClone(setting);
      s.id = `${s.namespace}.${s.key}`;
      s.name = game.i18n.localize(s.name);
      s.hint = game.i18n.localize(s.hint);
      s.value = game.settings.get(s.namespace, s.key);
      s.type = setting.type instanceof Function ? setting.type.name : "String";
      s.isCheckbox = setting.type === Boolean;
      s.isSelect = s.choices !== undefined;
      s.isRange = (setting.type === Number) && s.range;
      s.filePickerType = s.filePicker === true ? "any" : s.filePicker;

      // Classify setting
      const name = s.namespace;
      if ( name === game.system.id ) data.settings[s.key] = s;
    }

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.game-preset').click(this.onSelectPreset.bind(this));
    html.find('button.accept-settings').click(this.onLoadSettings.bind(this));
    html.find('button.close').click(e => this.close());
  }

  onLoadSettings(ev) {
    if (!this.config.preset) this.close();
    const fd = new FormDataExtended(this.form).toObject();
    const sets = {
      ...ageSystem.gameSettings[this.config.preset].settings.defined,
      ...fd
    };
    for (const setting in sets) {
      if (Object.hasOwnProperty.call(sets, setting)) {
        const value = sets[setting];
        game.settings.set("age-system", setting, value)
      }
    }
  }

  onSelectPreset(ev) {
    const preset = ev.currentTarget.dataset.preset;
    this.config.preset = preset;
    this.render(false)
  }

  _updateObject(event, data) {
    console.log('t')
  }
}

export class AdvancedSettings extends FormApplication {
  constructor(object = {}, options = {}) {
    super(object, options);
    this.config = {};
  }
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'adv-settings',
      template: 'systems/age-system/templates/adv-settings.hbs',
      resizable: false,
      minimizable: false,
      width: '500',
      height: 'auto',
      title: game.i18n.localize('SETTINGS.advSettings'),
      classes: ["age-system", "dialog", `colorset-${ageSystem.colorScheme}`],
      resizable: false,
      closeOnSubmit: false,
      submitOnClose: true,
      submitOnChange: true,
    })
  }

  getData() {
    const data = {
      ...super.getData(),
      colors: ageSystem.colorScheme,
      advSettings: ageSystem.advSettings,
      settings: {}
    }
    
    const canConfigure =  game.user.can("SETTINGS_MODIFY");
    const gs = game.settings;
    // Classify all settings
    for ( let setting of gs.settings.values() ) {

      // Exclude settings the user cannot change
      if (!canConfigure && (setting.scope !== "client")) continue;

      // Update setting data
      const s = foundry.utils.deepClone(setting);
      s.id = `${s.namespace}.${s.key}`;
      s.name = game.i18n.localize(s.name);
      s.hint = game.i18n.localize(s.hint);
      s.value = game.settings.get(s.namespace, s.key);
      s.type = setting.type instanceof Function ? setting.type.name : "String";
      s.isCheckbox = setting.type === Boolean;
      s.isSelect = s.choices !== undefined;
      s.isRange = (setting.type === Number) && s.range;
      s.filePickerType = s.filePicker === true ? "any" : s.filePicker;

      // Classify setting
      const name = s.namespace;
      if ( name === game.system.id ) data.settings[s.key] = s;
    }

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('button.accept-settings').click(this.onLoadSettings.bind(this));
    html.find('button.close').click(e => this.close());
  }

  onLoadSettings(ev) {
    const sets = new FormDataExtended(this.form).toObject();
    for (const setting in sets) {
      if (Object.hasOwnProperty.call(sets, setting)) {
        const value = sets[setting];
        game.settings.set("age-system", setting, value)
      }
    }
  }

  _updateObject(event, data) {}
}