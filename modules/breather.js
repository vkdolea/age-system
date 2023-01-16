import {ageSystem} from "./config.js";
import { controlledTokenByType } from "./age-chat.js";

export default class BreatherSettings extends FormApplication {
  constructor(object ={}, options = {}) {
    super(object, options);
    this.config = ageSystem.breather;
  }
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'breather-settings',
      template: 'systems/dragon-age-system/templates/rolls/breather-settings.hbs',
      resizable: false,
      minimizable: false,
      width: 'auto',
      height: 'auto',
      title: game.i18n.localize('SETTINGS.breatherSettings'),
      resizable: false,
      closeOnSubmit: false,
      submitOnClose: true,
      submitOnChange: true,
    })
  }

  getData() {
    const data = {
      ...super.getData(),
      ...ageSystem.breather,
      abilities: ageSystem.abilities,
      settingMode: true
    }
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('input').change(this.onChangeInput.bind(this));
  }

  onChangeInput(ev) {
    const el = ev.currentTarget
    const type = el.type;
    const name = el.name
    const obj = foundry.utils.deepClone(ageSystem.breather);
    obj[name] = type === 'checkbox' ? el.checked : el.value;
    this.config = obj
  }

  _updateObject(event, data) {
    game.settings.set('age-system', 'breatherParam', data);
  }
}

/**
 * Apply Breather function to all select Character tokens
 * @param {string} rollMode String indicating breather card privacy
 */
 export async function applyBreather(rollMode=null) {
  const tk = controlledTokenByType('char');
  tk.map(t => t.actor.breather(true, {rollMode}));
  if (tk.length > 0) ui.notifications.info(game.i18n.localize("age-system.WARNING.breatherAppliedAll"));
}