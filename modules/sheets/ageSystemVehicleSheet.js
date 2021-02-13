import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";

export default class ageSystemVehicleSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            height: 600,
            classes: ["age-system", "sheet", "vehicle", `colorset-${ageSystem.colorScheme}`, "colorset-second-tier"]
        });
    }
    
    get template() {
        return `systems/age-system/templates/sheets/${this.actor.data.type}-sheet.hbs`;
    }

    getData() {
        const data = super.getData();
        data.config = CONFIG.ageSystem;

        return data;
    };

    //  Modification on standard _onDropItem() to prevent user from dropping items on Vehicle Actor
    async _onDropItem(event, data) {
        return false;
    };

    activateListeners(html) {
        if (this.isEditable) {
            html.find(".item-edit").click(this._onItemEdit.bind(this));
            html.find(".item-delete").click(this._onItemDelete.bind(this));

            // Enable field to be focused when selecting it
            const inputs = html.find("input");
            inputs.focus(ev => ev.currentTarget.select());
        };
        
        // Actions by sheet owner only
        if (this.actor.owner) {
            new ContextMenu(html, ".focus-options", this.focusContextMenu);
            html.find(".item-show").click(this._onItemShow.bind(this));
            html.find(".roll-ability").click(this._onRollAbility.bind(this));
            html.find(".roll-item").click(this._onRollItem.bind(this));
            html.find(".roll-damage").click(this._onRollDamage.bind(this));
            html.find(".defend-maneuver").change(this._onDefendSelect.bind(this));
            html.find(".guardup-maneuver").change(this._onGuardUpSelect.bind(this));
            html.find(".last-up").change(this._onLastUpSelect.bind(this));
            html.find(".roll-resources").click(this._onRollResources.bind(this));
            html.find(".item-equip").click(this._onItemActivate.bind(this));

            let handler = ev => this._onDragStart(ev);
            // Find all rollable items on the character sheet.
            let items = html.find(".item-box");
            for (let i = 0; i < items.length; i++) {
                const el = items[i];
                if (el.draggable) {
                    el.addEventListener("dragstart", handler, false);
                }   
            }
        };

        super.activateListeners(html);
    };

    _onItemActivate(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const itemToToggle = this.actor.getOwnedItem(itemId);
        const itemType = itemToToggle.type;
        if (itemType === "power" || itemType === "talent") {
            const toggleAct = !itemToToggle.data.data.activate;
            itemToToggle.update({"data.activate": toggleAct});
        } else {
            const toggleEqp = !itemToToggle.data.data.equiped;
            itemToToggle.update({"data.equiped": toggleEqp});
        };
    };

    _onRollResources(event) {
        const rollData = {
            event: event,
            actor: Dice.getActor() || this.actor,
            resourceRoll: true
        };
        Dice.ageRollCheck(rollData);
    };

    _onLastUpSelect(ev) {
        const abl = ev.currentTarget.closest(".feature-controls").dataset.ablId;
        let actorAbls = {
            data: {
                abilities: {}
            }
        };
        for (const ablKey in this.actor.data.data.abilities) {
            if (Object.hasOwnProperty.call(this.actor.data.data.abilities, ablKey)) {
                actorAbls.data.abilities[ablKey] = {"lastUp": false};                
            };
        };
        actorAbls.data.abilities[abl].lastUp = true;
        this.actor.update(actorAbls);
    };

    _onDefendSelect(event) {
        const guardupStatus = event.currentTarget.closest(".feature-controls").dataset.guardupActive;
        const defendStatus = this.actor.data.data.defend.active;
        if (guardupStatus && !defendStatus) {
            this.actor.update({"data.guardUp.active": false});
        };
    };

    _onGuardUpSelect(event) {
        const defendStatus = event.currentTarget.closest(".feature-controls").dataset.defendActive;
        const guardupStatus = this.actor.data.data.guardUp.active;
        if (!guardupStatus && defendStatus) {
            this.actor.update({"data.defend.active": false});
        };
    };

    _onRollAbility(event) {
        const rollData = {
            event: event,
            actor: this.actor,
            abl: event.currentTarget.closest(".feature-controls").dataset.ablId
        }
        Dice.ageRollCheck(rollData);
    };

    _onRollItem(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const itemRolled = this.actor.getOwnedItem(itemId);
        itemRolled.roll(event);
    };

    _onItemShow(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);
        item.showItem();
    };

    _onItemEdit(event) {
        event.preventDefault();
        let e = event.currentTarget;
        let itemId = e.closest(".feature-controls").dataset.itemId;
        let item = this.actor.getOwnedItem(itemId);

        item.sheet.render(true);
    };

    _onItemDelete(event) {
        event.preventDefault();
        let e = event.currentTarget;
        let itemId = e.closest(".feature-controls").dataset.itemId;
        const actor = this.actor;
        return actor.deleteOwnedItem(itemId);
    };

    _onRollDamage(event) {
        event.preventDefault();
        const e = event.currentTarget;
        const itemId = e.closest(".feature-controls").dataset.itemId;
        const actor = this._realActor();
        const item = actor.getOwnedItem(itemId);
        const damageData = {event: event};

        return item.rollDamage(damageData);
    };
};