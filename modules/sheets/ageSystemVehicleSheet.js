import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";

export default class ageSystemVehicleSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            height: 646,
            resizable: false,
            classes: ["age-system", "sheet", "vehicle", `colorset-${ageSystem.colorScheme}`]
        });
    }
    
    get template() {
        return `systems/age-system/templates/sheets/${this.actor.data.type}-sheet.hbs`;
    }

    // From MooMan
    async _onDrop(event) {
        let dragData = JSON.parse(event.dataTransfer.getData("text/plain"));
        if (dragData.type == "char") {
            let passengers = duplicate(this.actor.data.data.passengers);
            passengers.push({id: dragData.id, isToken: dragData.isToken});
            this.actor.update({"data.passengers" : passengers})
        }
        else return super._onDrop(event);
        // else return false;
    }

    getData() {
        const data = super.getData();
        data.config = CONFIG.ageSystem;
        data.passengers = this.actor.data.data.passengers.sort(function(a, b) {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
        });

        // Setting which ability settings will be used
        const ablSelect = game.settings.get("age-system", "abilitySelection");
        data.config.abilities = data.config.abilitiesSettings[ablSelect];

        // Check Wealth Mode in use
        data.config.wealthMode = game.settings.get("age-system", "wealthType");

        return data;
    };

    //  Modification on standard _onDropItem() to prevent user from dropping items on Vehicle Actor
    async _onDropItem(event, data) {
        return false;
    };

    activateListeners(html) {
        if (this.isEditable) {
            // html.find(".item-edit").click(this._onItemEdit.bind(this));
            // html.find(".item-delete").click(this._onItemDelete.bind(this));

            // Enable field to be focused when selecting it
            const inputs = html.find("input");
            inputs.focus(ev => ev.currentTarget.select());
        };

        html.on("dragenter", ".passenger-container", ev => {
            ev.target.classList.add("dragover")
        })
        html.on("dragleave", ".passenger-container", ev => {
            ev.target.classList.remove("dragover")
        })
        html.on("drop", ".passenger-container", ev => {
            ev.target.classList.remove("dragover")
            const dragData = JSON.parse(ev.originalEvent.dataTransfer.getData("text/plain"))
            const passenger = game.actors.get(dragData.id);
            if (passenger.data.type === "char") {

                const passengerData = {
                    id : passenger.id,
                    isToken : passenger.isToken
                };
                const passengerList = this.actor.data.data.passengers;
                let alreadyOnboard = false;
                passengerList.map( p => {
                    if (p.id === passengerData.id) {
                        alreadyOnboard = true;
                        const parts = {name: p.name, id: p.id};
                        let warning = game.i18n.format("age-system.WARNING.alreadyOnboard", parts);
                        ui.notifications.warn(warning);
                    }
                });

                if (!alreadyOnboard) {
                    passengerList.push(passengerData);
                    this.actor.update({"data.passengers" : passengerList})
                }
            } else {
                const warning = game.i18n.localize("age-system.WARNING.vehiclesIsNotPassenger");
                ui.notifications.warn(warning);
            }
        })
        
        // Actions by sheet owner only
        if (this.actor.owner) {
            // new ContextMenu(html, ".focus-options", this.focusContextMenu);
            // html.find(".item-show").click(this._onItemShow.bind(this));
            // html.find(".roll-ability").click(this._onRollAbility.bind(this));
            // html.find(".roll-item").click(this._onRollItem.bind(this));
            // html.find(".roll-damage").click(this._onRollDamage.bind(this));
            // html.find(".defend-maneuver").change(this._onDefendSelect.bind(this));
            // html.find(".guardup-maneuver").change(this._onGuardUpSelect.bind(this));
            // html.find(".last-up").change(this._onLastUpSelect.bind(this));
            html.find(".roll-maneuver").click(this._onRollManeuver.bind(this));
            html.find(".remove-passenger").click(this._onRemovePassenger.bind(this));

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

    _onRemovePassenger(event) {
        let passengerKey = event.currentTarget.closest(".feature-controls").dataset.passengerKey;
        passengerKey = Number(passengerKey);
        const newCrew = this.object.data.data.passengers;
        newCrew.splice(passengerKey, 1);
        this.actor.update({"data.passengers": newCrew});
    };

    _onRollManeuver(event) {
        if (this.actor.data.data.conductor === "") return
        const useFocus = this.actor.data.data.focus;
        const rollData = {
            event: event,
            actor: this.actor,
            abl: event.currentTarget.closest(".feature-controls").dataset.ablId
        }
        // const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        // const itemRolled = this.actor.getOwnedItem(itemId);
        // itemRolled.roll(event);
        Dice.ageRollCheck(rollData);
    };

    // _onItemActivate(event) {
    //     const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
    //     const itemToToggle = this.actor.getOwnedItem(itemId);
    //     const itemType = itemToToggle.type;
    //     if (itemType === "power" || itemType === "talent") {
    //         const toggleAct = !itemToToggle.data.data.activate;
    //         itemToToggle.update({"data.activate": toggleAct});
    //     } else {
    //         const toggleEqp = !itemToToggle.data.data.equiped;
    //         itemToToggle.update({"data.equiped": toggleEqp});
    //     };
    // };

    // _onRollResources(event) {
    //     const rollData = {
    //         event: event,
    //         actor: Dice.getActor() || this.actor,
    //         resourceRoll: true
    //     };
    //     Dice.ageRollCheck(rollData);
    // };

    // _onRollItem(event) {
    //     const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
    //     const itemRolled = this.actor.getOwnedItem(itemId);
    //     itemRolled.roll(event);
    // };

    // _onItemShow(event) {
    //     event.preventDefault();
    //     const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
    //     const item = this.actor.getOwnedItem(itemId);
    //     item.showItem();
    // };

    // _onItemEdit(event) {
    //     event.preventDefault();
    //     let e = event.currentTarget;
    //     let itemId = e.closest(".feature-controls").dataset.itemId;
    //     let item = this.actor.getOwnedItem(itemId);

    //     item.sheet.render(true);
    // };

    // _onItemDelete(event) {
    //     event.preventDefault();
    //     let e = event.currentTarget;
    //     let itemId = e.closest(".feature-controls").dataset.itemId;
    //     const actor = this.actor;
    //     return actor.deleteOwnedItem(itemId);
    // };

    // _onRollDamage(event) {
    //     event.preventDefault();
    //     const e = event.currentTarget;
    //     const itemId = e.closest(".feature-controls").dataset.itemId;
    //     const actor = this._realActor();
    //     const item = actor.getOwnedItem(itemId);
    //     const damageData = {event: event};

    //     return item.rollDamage(damageData);
    // };
};