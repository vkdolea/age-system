import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";
import {isDropedItemValid} from "../setup.js";

export default class ageSystemSheetOrg extends ActorSheet {
    
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
        return `systems/age-system/templates/sheets/${this.actor.data.type}-sheet.hbs`;
    }

    /* -------------------------------------------- */
    /** @inheritdoc */
    getData(options) {
        const isOwner = this.document.isOwner;
        const isEditable = this.isEditable;
        const actorData = this.actor.data.toObject(false);
        actorData.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        
        const data = actorData.data;
        const focus = actorData.items.filter(f => f.type === "focus");

        return {
            data,
            focus,
            config: CONFIG.ageSystem,
            actor: this.object,
            cssClass: isEditable ? "editable" : "locked",
            effects: actorData.effects,
            items: actorData.items,
            limited: this.object.limited,
            options: this.options,
            owner: isOwner,
            editable: isEditable,
            title: this.title,
            isGM: game.user.isGM
        };
    };
    
    activateListeners(html) {
        super.activateListeners(html);

    };

    _onDropItemCreate(itemData) {
        if (!isDropedItemValid(this.actor, itemData.type, itemData.name)) return false;
        super._onDropItemCreate(itemData);
    }

    itemContextMenu = [
        {
            name: game.i18n.localize("age-system.chatCard.roll"),
            icon: '<i class="far fa-eye"></i>',
            callback: e => {
                const data = e[0].closest(".feature-controls").dataset;
                const item = this.actor.items.get(data.itemId);
                item.showItem(e.shiftKey)
            }
        },
        {
            name: game.i18n.localize("age-system.settings.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: e => {
                const data = e[0].closest(".feature-controls").dataset;
                const item = this.actor.items.get(data.itemId);
                item.sheet.render(true);
            }
        },
        {
            name: game.i18n.localize("age-system.settings.delete"),
            icon: '<i class="fas fa-trash"></i>',
            callback: e => {
                const data = e[0].closest(".feature-controls").dataset;
                const item = this.actor.items.get(data.itemId);
                item.delete();
            }
        }
    ];
}