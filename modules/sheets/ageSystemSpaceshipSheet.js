import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";

export default class ageSpaceshipSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            height: 646,
            resizable: false,
            classes: ["age-system", "sheet", "spaceship"]
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

        html.on("dragenter", ".passenger.container", ev => {
            ev.target.classList.add("dragover")
        })
        html.on("dragleave", ".passenger.container", ev => {
            ev.target.classList.remove("dragover")
        })
        html.on("drop", ".passenger.container", ev => {
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

            html.find(".roll-maneuver").click(this._onRollManeuver.bind(this));
            html.find(".remove-passenger").click(this._onRemovePassenger.bind(this));

            // let handler = ev => this._onDragStart(ev);
            // // Find all rollable items on the character sheet.
            // let items = html.find(".item-box");
            // for (let i = 0; i < items.length; i++) {
            //     const el = items[i];
            //     if (el.draggable) {
            //         el.addEventListener("dragstart", handler, false);
            //     }   
            // }
        };

        super.activateListeners(html);
    };

    _onRollManeuver(event) {
        const vehicleData = this.actor.data.data;
        const datum = {}
        const isSystemBox = event.currentTarget.dataset.sysBox;
        if (isSystemBox) {
            datum.sysName = event.currentTarget.closest(".feature-controls").dataset.sysName;
            datum.passengerId = vehicleData.systems[datum.sysName].operator;
            // datum.passengerName = event.currentTarget.dataset.passengerName;
        } else {
            datum.passengerId = event.currentTarget.closest(".feature-controls").dataset.passengerId;
            datum.passengerName = event.currentTarget.closest(".feature-controls").dataset.passengerName;
            datum.sysName = event.currentTarget.dataset.sysName;
        }
        const useFocus = vehicleData.systems[datum.sysName].useFocus;

        if (datum.passengerId === "crew") {
            const crewAction = [{
                value: vehicleData.crew.competence,
                description: game.i18n.localize("age-system.spaceship.crew")
            }];
            const rollData = {
                moreParts: crewAction,
                event,
                flavor: game.i18n.format("age-system.chatCard.rollGeneral", {actor: crewAction[0].description, item: useFocus})
            }
            return Dice.ageRollCheck(rollData);
        }

        let passenger;
        passenger = game.actors.tokens[datum.passengerId];
        if (!passenger) passenger = game.actors.get(datum.passengerId);
        if (!passenger) {
            const parts = {name: datum.passengerName, id: datum.passengerId};
            let warning = game.i18n.format("age-system.WARNING.userNotAvailable", parts);
            return ui.notifications.warn(warning);
        };
        const pFocusCheck = passenger.checkFocus(useFocus);

        const rollData = {
            event: event,
            actor: passenger,
            abl: vehicleData.systems[datum.sysName].useAbl,
            flavor: game.i18n.format("age-system.chatCard.maneuversVehicle", {name: passenger.name, vehicle: this.actor.name}),
            itemRolled: pFocusCheck.focusItem ? pFocusCheck.focusItem : pFocusCheck.focusName
        }
        Dice.ageRollCheck(rollData)
    }

    _onRemovePassenger(event) {
        let update = {};
        let passengerKey = event.currentTarget.closest(".feature-controls").dataset.passengerKey;
        passengerKey = Number(passengerKey);
        const crew = this.object.data.data.passengers;
        if (crew[passengerKey].isConductor) update = {"data.conductor": ""}
        crew.splice(passengerKey, 1);
        this.actor.update({...update, "data.passengers": crew});
    };
};