import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";

export default class ageActiveEffectConfig extends ActiveEffectConfig {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "active-effect-sheet"],
      template: "systems/age-system/templates/sheets/age-active-effect-config.hbs",
      width: 560,
      height: "auto",
      tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "details"}]
    });
  }

//   /* ----------------------------------------- */

//   /** @override */
//   get title() {
//     return `${game.i18n.localize("EFFECT.ConfigTitle")}: ${this.object.data.label}`;
//   }

//   /* ----------------------------------------- */

  /** @override */
  getData(options) {
    const effect = foundry.utils.deepClone(this.object.data);
    return {
      ageEffects: CONFIG.ageSystem.ageEffectsOptions, // Adding labels and Masks
      effect: effect, // Backwards compatibility
      data: foundry.utils.deepClone(this.object.data),
      isActorEffect: this.object.parent.entity === "Actor",
      isItemEffect: this.object.parent.entity === "Item",
      submitText: "EFFECT.Submit",
      modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize("EFFECT.MODE_"+e[0]);
        return obj;
      }, {})
    };
  }

//   /* ----------------------------------------- */

//   /** @override */
//   activateListeners(html) {
//     super.activateListeners(html);
//     html.find(".effect-control").click(this._onEffectControl.bind(this));
//   }

//   /* ----------------------------------------- */

//   /**
//    * Provide centralized handling of mouse clicks on control buttons.
//    * Delegate responsibility out to action-specific handlers depending on the button action.
//    * @param {MouseEvent} event      The originating click event
//    * @private
//    */
//   _onEffectControl(event) {
//     event.preventDefault();
//     const button = event.currentTarget;
//     switch ( button.dataset.action ) {
//       case "add":
//         return this._addEffectChange();
//       case "delete":
//         button.closest(".effect-change").remove();
//         return this.submit({preventClose: true}).then(() => this.render());
//     }
//   }

//   /* ----------------------------------------- */

//   /**
//    * Handle adding a new change to the changes array.
//    * @private
//    */
//   async _addEffectChange() {
//     const idx = this.document.data.changes.length;
//     return this.submit({preventClose: true, updateData: {
//       [`changes.${idx}`]: {key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: ""}
//     }});
//   }

//   /* ----------------------------------------- */

//   /** @inheritdoc */
//   _getSubmitData(updateData={}) {
//     const fd = new FormDataExtended(this.form, {editors: this.editors});
//     let data = foundry.utils.expandObject(fd.toObject());
//     if ( updateData ) foundry.utils.mergeObject(data, updateData);
//     data.changes = Array.from(Object.values(data.changes || {}));
//     return data;
//   }
}