import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";
import {newItemData} from "./helper.js";

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
        return `systems/age-system/templates/sheets/${this.actor.type}-sheet.hbs`;
    }

    /* -------------------------------------------- */
    /** @inheritdoc */
    getData(options) {
        const isOwner = this.document.isOwner;
        const isEditable = this.isEditable;
        const actorData = this.actor.toObject(false);
        actorData.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        
        const system = actorData.system;
        const focus = actorData.items.filter(f => f.type === "focus");
        
        return {
            system,
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
            isGM: game.user.isGM,
            ROLL_TYPE: CONFIG.ageSystem.ROLL_TYPE
        };
    };
    
    activateListeners(html) {
        new ContextMenu(html, ".focus-options", this.focusContextMenu);
        super.activateListeners(html);

        if (this.actor.isOwner || this.observerRoll) {
            html.find(".roll-ability")
                .click(this._onRollAbility.bind(this))
                .contextmenu(this._onRollAbility.bind(this));
            html.find(".roll-item")
                .click(this._onRollItem.bind(this))
                .contextmenu(this._onRollItem.bind(this));
            html.find(".roll-plot")
                .click(this._onRollPlot.bind(this))
                .contextmenu(this._onRollPlot.bind(this));
        }

    };

    _onRollPlot(event) {
        event.preventDefault();
        const rollType = event.currentTarget.dataset.rollType;
        const ROLL_TYPE = CONFIG.ageSystem.ROLL_TYPE;
        switch (rollType) {
            case ROLL_TYPE.PLOT_ACTION:
                Dice.ageRollCheck({
                    event,
                    actor: this.actor,
                    selectAbl: true,
                    rollType
                })
                break;
            case ROLL_TYPE.PLOT_DAMAGE:
                Dice.plotDamage(this.actor)
            default:
                break;
        }
    }

    _onRollItem(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const rollType = event.currentTarget.closest(".feature-controls").dataset.rollType
        const itemRolled = this.actor.items.get(itemId);
        if (itemRolled.type === "focus" && event.button !== 0) return
        itemRolled.roll(event, rollType);
    };

    _onRollAbility(event) {
        const rollData = {
            event: event,
            actor: this.actor,
            abl: event.currentTarget.closest(".feature-controls").dataset.ablId,
            rollType: ageSystem.ROLL_TYPE.ABILITY
        }
        Dice.ageRollCheck(rollData);
    };

    _onDropItemCreate(itemData) {
        itemData = newItemData(this.actor, itemData);
        if (!itemData.length) return false
        super._onDropItemCreate(itemData);
    }

    focusContextMenu = [
        {
            name: game.i18n.localize("age-system.ageRollOptions"),
            icon: '<i class="fas fa-dice"></i>',
            callback: e => {
                const focus = this.actor.items.get(e.data("item-id"));
                const ev = new MouseEvent('click', {altKey: true});
                focus.roll(ev);
            }
        },
        {
            name: game.i18n.localize("age-system.chatCard.roll"),
            icon: '<i class="far fa-eye"></i>',
            callback: e => {
                const i = this.actor.items.get(e.data("item-id")).showItem(e.shiftKey);
            }
        },
        {
            name: game.i18n.localize("age-system.settings.changeRollContext"),
            icon: '<i class="fas fa-exchange-alt"></i>',
            // TODO - try to add the Shift + Click rolling to GM inside this callback
            callback: e => {
                const focus = this.actor.items.get(e.data("item-id"));
                const ev = new MouseEvent('click', {});
                Dice.ageRollCheck({event: ev, itemRolled: focus, actor: this.actor, selectAbl: true, rollType: ageSystem.ROLL_TYPE.FOCUS});
            }
        },
        {
            name: game.i18n.localize("age-system.settings.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: e => {
                const item = this.actor.items.get(e.data("item-id"));
                item.sheet.render(true);
            }
        },
        {
            name: game.i18n.localize("age-system.settings.delete"),
            icon: '<i class="fas fa-trash"></i>',
            callback: e => {
                const i = this.actor.items.get(e.data("item-id")).delete();
            }
        }
    ];
}