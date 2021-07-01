import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";
import ageSystemSheetCharacter from "./ageSystemSheetCharacter.js";

export default class ageSystemSheetCharStatBlock extends ageSystemSheetCharacter {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 400,
            height: 650,
            classes: ["age-system", "sheet", "char", "stat-block"],
            tabs: [{
                navSelector: ".add-sheet-tabs",
                contentSelector: ".sheet-tab-section",
                initial: "main"
            }]
        });
    }

    get template() {
        return `systems/age-system/templates/sheets/${this.actor.data.type}-stat-block.hbs`;
    }

    /* -------------------------------------------- */
    // /** @inheritdoc */
    // getData(options) {
    //     return super.getData(options);
    // };
    
    // activateListeners(html) {
    //     super.activateListeners(html);
    //     if (this.isEditable) {
    //         new ContextMenu(html, ".item-show", this.itemContextMenu);
    //     }
    // };

    // itemContextMenu = [
    //     {
    //         name: game.i18n.localize("age-system.chatCard.roll"),
    //         icon: '<i class="far fa-eye"></i>',
    //         callback: e => this._onRollItem(e)
    //     },
    //     {
    //         name: game.i18n.localize("age-system.settings.edit"),
    //         icon: '<i class="fas fa-edit"></i>',
    //         callback: e => {
    //             const item = this.actor.items.get(e.data("item-id"));
    //             item.sheet.render(true);
    //         }
    //     },
    //     {
    //         name: game.i18n.localize("age-system.settings.delete"),
    //         icon: '<i class="fas fa-trash"></i>',
    //         callback: e => {
    //             const i = this.actor.items.get(e.data("item-id")).delete();
    //         }
    //     }
    // ];
}