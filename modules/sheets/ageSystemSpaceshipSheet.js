import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";

export default class ageSpaceshipSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            height: 750,
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
        data.passengers = sortObjArrayByName(this.actor.data.data.passengers, "name");

        const itemSorted = sortObjArrayByName(data.items, "name");
        data.sensorMod = itemSorted.filter(i => i.data.type === "sensorMod");
        data.maneuverSizeMod = itemSorted.filter(i => i.data.type === "maneuverSizeMod");
        data.juiceMod = itemSorted.filter(i => i.data.type === "juiceMod");
        data.hullPlating = itemSorted.filter(i => i.data.type === "hullPlating");
        data.hullMod = itemSorted.filter(i => i.data.type === "hullMod");
        data.rollable = itemSorted.filter(i => i.data.type === "rollable");
        data.weapon = itemSorted.filter(i => i.data.type === "weapon");

        // Setting which ability settings will be used
        const ablSelect = game.settings.get("age-system", "abilitySelection");
        data.config.abilities = data.config.abilitiesSettings[ablSelect];

        // Check Wealth Mode in use
        data.config.wealthMode = game.settings.get("age-system", "wealthType");

        // Sheet color
        data.colorScheme = game.settings.get("age-system", "colorScheme");

        return data;
    };

    // Modification on standard _onDropItem() to prevent user from dropping Items other than Spaceship Features on Spaceships
    async _onDropItem(event, data) {
        if ( !this.actor.owner ) return false;
        const item = await Item.fromDropData(data);
        /*-----------Beginning of added code--------------*/
        if (item.data.type !== "shipfeatures") {
            let warning = game.i18n.localize("age-system.WARNING.nonShipPartsOnShip");
            ui.notifications.warn(warning);
            return false;
        }
        /*-------------End of added code------------------*/
        const itemData = duplicate(item.data);
        
        const actor = this.actor;
        // Handle item sorting within the same Actor
        let sameActor = (data.actorId === actor._id) || (actor.isToken && (data.tokenId === actor.token.id));
        if (sameActor) return this._onSortItem(event, itemData);

        // Create the owned item
        return this._onDropItemCreate(itemData);
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
            if (!passenger) return;
            // const actor = this.actor;
            let actor
            if (this.actor.isToken) actor = game.actors.tokens[this.actor.token.data._id].actor;
            if (!actor) actor = this.actor;
            if (passenger.data.type === "char") {

                const passengerData = {
                    id : passenger.id,
                    isToken : passenger.isToken
                };
                const passengerList = actor.data.data.passengers;
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
                    actor.update({"data.passengers" : passengerList});
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
            html.find(".change-loss").click(this._onChangeLoss.bind(this));
            // html.find(".weapon-ctrl.add").click(this._onClickAddWeapon.bind(this));
            // html.find(".weapon-ctrl.remove").click(this._onClickRemoveWeapon.bind(this));

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

    _onChangeLoss(event) {
        const lossSev = event.currentTarget.closest(".feature-controls").dataset.lossSev;
        const lossType = event.currentTarget.closest(".feature-controls").dataset.lossType;
        let lossValue = event.currentTarget.dataset.boxNumber;
        lossValue = Number(lossValue) + 1;
        const currentLoss = this.actor.data.data.losses[lossSev][lossType].actual;
        let newLoss
        if (lossValue > currentLoss) {
            newLoss = lossValue;
        } else {
            newLoss = lossValue - 1;
        }

        const updatePath = `data.losses.${lossSev}.${lossType}.actual`; 
        this.actor.update({[updatePath]: newLoss});
    }

    _onRollManeuver(event) {
        const vehicleData = this.actor.data.data;
        const datum = {}
        const isSystemBox = event.currentTarget.dataset.sysBox;
        if (isSystemBox) {
            datum.sysName = event.currentTarget.closest(".feature-controls").dataset.sysName;
            datum.passengerId = vehicleData.systems[datum.sysName].operator;
        } else {
            datum.passengerId = event.currentTarget.closest(".feature-controls").dataset.passengerId;
            datum.passengerName = event.currentTarget.closest(".feature-controls").dataset.passengerName;
            datum.sysName = event.currentTarget.dataset.sysName;
        }
        const useFocus = vehicleData.systems[datum.sysName].useFocus;
        let rollData = {moreParts: []};
        let passenger = {};

        if (datum.passengerId === "crew") {
            passenger.name = game.i18n.localize("age-system.spaceship.crew");
            const crewAction = {
                value: vehicleData.crew.competence,
                description: passenger.name
            };
            rollData.moreParts.push(crewAction);
            rollData.event = event;
        } else {
            passenger = game.actors.tokens[datum.passengerId];
            if (!passenger) passenger = game.actors.get(datum.passengerId);
            if (!passenger) {
                const parts = {name: datum.passengerName ? datum.passengerName : "", id: datum.passengerId};
                let warning = game.i18n.format("age-system.WARNING.userNotAvailable", parts);
                return ui.notifications.warn(warning);
            };
            const pFocusCheck = passenger.checkFocus(useFocus);
    
            rollData = {
                ...rollData,
                event: event,
                actor: passenger,
                abl: vehicleData.systems[datum.sysName].useAbl,
                itemRolled: pFocusCheck.focusItem ? pFocusCheck.focusItem : pFocusCheck.focusName
            };
        }

        const parts = {name: passenger.name, vehicle: this.actor.name};
        let flavorText = "age-system.chatCard.maneuversVehicle";
        switch (datum.sysName) {
            case "command":
                flavorText = "age-system.chatCard.commandsVehicle";
                break;
            case "sensors":
                flavorText = "age-system.chatCard.operatesVehicle";
                break;
            case "damageControl":
                flavorText = "age-system.chatCard.backupVehicle";
                break;
            default:
                break;
        }

        const system = this.actor.data.data.systems[datum.sysName]
        if (system) {
            rollData.moreParts.push({
                value: system.total,
                description: game.i18n.localize(`age-system.spaceship.systemName.${datum.sysName}`)
            })
        }
        rollData.flavor = game.i18n.format(flavorText, parts);

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