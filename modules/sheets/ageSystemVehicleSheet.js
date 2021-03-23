import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";

export default class ageSystemVehicleSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            height: 646,
            resizable: false,
            classes: ["age-system", "sheet", "vehicle"/*, `colorset-${ageSystem.colorScheme}`*/]
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
        this.actor.prepareData(); // Forcing updating sheet after opening, in case an Actor's operator is updated
        // TODO - method on Actor entity to for prepareData() running on Vehicle data em database is updated.
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

        // Sheet color
        data.colorScheme = game.settings.get("age-system", "colorScheme");       

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
                const warning = game.i18n.localize("age-system.WARNING.vehicleIsNotPassenger");
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
            html.find(".roll-collision").click(this._onCollisionDamage.bind(this));
            html.find(".roll-sideswipe").click(this._onSideswipeDamage.bind(this));
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
        let update = {};
        let passengerKey = event.currentTarget.closest(".feature-controls").dataset.passengerKey;
        passengerKey = Number(passengerKey);
        const crew = this.object.data.data.passengers;
        if (crew[passengerKey].isConductor) update = {"data.conductor": ""}
        crew.splice(passengerKey, 1);
        this.actor.update({...update, "data.passengers": crew});
    };

    _onRollManeuver(event) {
        const vehicleData = this.actor.data.data;
        const conductorId = vehicleData.conductor;
        if (conductorId === "") return false
        const conductorData = vehicleData.passengers.filter(p => p.isConductor === true)[0];

        let user;
        if (conductorData.isToken) user = game.actors.tokens[conductorData.id];
        if (!conductorData.isToken) user = game.actors.get(conductorData.id);
        if (!conductorData) {
            const parts = {name: conductorData.name, id: conductorData.id};
            let warning = game.i18n.format("age-system.WARNING.userNotAvailable", parts);
            return ui.notifications.warn(warning);
        };
        
        const handlingUseFocus = vehicleData.handling.useFocus;
        const handlingUseAbl = vehicleData.handling.useAbl;
        const rollData = {
            event: event,
            actor: user,
            abl: handlingUseAbl,
            flavor: game.i18n.format("age-system.chatCard.maneuversVehicle", {name: user.name, vehicle: this.actor.name}),
            vehicleHandling: this.actor.data.data.handling.mod,
            itemRolled: this.actor._userFocusEntity(handlingUseFocus, conductorData)
        }
        Dice.ageRollCheck(rollData);
    };

    _onCollisionDamage(event) {
        event.preventDefault();
        const e = event.currentTarget;
        const addRam = e.classList.contains('add-ram') ? true : false;
        const qtdDice = Number(e.closest(".feature-controls").dataset.qtdDice);
        const dieSize = e.closest(".feature-controls").dataset.dieSize ? Number(e.closest(".feature-controls").dataset.dieSize) : 6;
        const operatorId = this.actor.data.data.conductor;
        const operatorData = operatorId ? this.actor.data.data.passengers.filter(p => p.id === operatorId)[0] : null;
        const damageData = {event: event, qtdDice, dieSize, addRam, operatorData, damageSource: "collision"};

        return this.actor.rollVehicleDamage(damageData);
    };

    _onSideswipeDamage(event) {
        event.preventDefault();
        const e = event.currentTarget;
        const addRam = e.classList.contains('add-ram') ? true : false;
        const qtdDice = Number(e.closest(".feature-controls").dataset.qtdDice);
        const dieSize = e.closest(".feature-controls").dataset.dieSize ? Number(e.closest(".feature-controls").dataset.dieSize) : 6;
        const operatorId = this.actor.data.data.conductor;
        const operatorData = operatorId ? this.actor.data.data.passengers.filter(p => p.id === operatorId)[0] : null;
        const damageData = {event: event, qtdDice, dieSize, addRam, operatorData, damageSource: "sideswipe"};

        return this.actor.rollVehicleDamage(damageData);
    };

    

    // TODO - Method to check if passenger has Actor Data 
    // _checkPassenger() {

    // }

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
};