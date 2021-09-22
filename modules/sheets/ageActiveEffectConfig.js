import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";

export default class ageActiveEffectConfig extends ActiveEffectConfig {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "active-effect-sheet", "age-system"],
      template: "systems/age-system/templates/sheets/age-active-effect-config.hbs",
      width: 560,
      height: "auto",
      tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "details"}]
    });
  }

  /** @override */
  getData(options) {
    const effect = foundry.utils.deepClone(this.object.data);
    return {
      ageEffects: CONFIG.ageSystem.ageEffectsOptions, // Adding labels and Masks
      effect: effect, // Backwards compatibility
      data: foundry.utils.deepClone(this.object.data),
      isActorEffect: this.object.parent.documentName === "Actor",
      isItemEffect: this.object.parent.dcoumentName === "Item",
      submitText: "EFFECT.Submit",
      modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize("EFFECT.MODE_"+e[0]);
        return obj;
      }, {})
    };
  }
}