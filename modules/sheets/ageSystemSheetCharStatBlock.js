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
        return `systems/age-system/templates/sheets/char-block/char-stat-block.hbs`;
    }

    /* -------------------------------------------- */
    /** @inheritdoc */
    getData(options) {
        return {
            ...super.getData(options),
            isBlock: true
        }
    };
    
    activateListeners(html) {
        $(`a.editor-edit`).hide(); // Used this code to remove the possibility to edit Powers on Stat Block view
        super.activateListeners(html);
        if (this.isEditable) {
            new ContextMenu(html, ".item-edit", this.itemContextMenu);
        }
    };
}