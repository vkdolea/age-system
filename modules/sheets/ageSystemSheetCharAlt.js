import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";
import ageSystemSheetCharacter from "./ageSystemSheetCharacter.js";

export default class ageSystemSheetCharAlt extends ageSystemSheetCharacter {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            // width: 800,
            // height: 650,
            classes: ["age-system", "sheet", "char-sheet-alt"],
            tabs: [{
                navSelector: ".add-sheet-tabs",
                contentSelector: ".sheet-tab-section",
                initial: "main"
            }]
        });
    }

    get template() {
        return `systems/age-system/templates/sheets/${this.actor.data.type}-sheet-alt.hbs`;
    }

    /* -------------------------------------------- */
    /** @inheritdoc */
    getData(options) {
        return {
            ...super.getData(options)
        }
    };
    
    activateListeners(html) {
        if (this.isEditable) {
            new ContextMenu(html, ".item-show", this.itemContextMenu);
            html.find("span.effect-add").click(this._onAddEffect.bind(this));
        }
        const editor = html.find(".persona .resource .editor");
        for (let i = 0; i < editor.length; i++) {editor[i].classList += ' values'}
        const entityLink = html.find("a.entity-link");
        for (let i = 0; i < entityLink.length; i++) {entityLink[i].classList += ` colorset-second-tier`}

        super.activateListeners(html);
    };
}