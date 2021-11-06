import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";
import {isDropedItemValid} from "../setup.js";

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
    
    get observerRoll () {
        return game.settings.get("age-system", "observerRoll");
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
        const isOwner = this.document.isOwner;
        const isEditable = this.isEditable;
    
        // Copy actor data to a safe copy
        const data = this.actor.data.toObject(false);
        // const data = super.getData();
        data.config = CONFIG.ageSystem;
        data.passengers = sortObjArrayByName(this.actor.data.data.passengers, "name");

        const itemSorted = sortObjArrayByName(data.items, "name");
        data.qualities = itemSorted.filter(i => i.data.quality === "quality" && i.data.type !== "weapon");
        data.flaws = itemSorted.filter(i => i.data.quality === "flaw" && i.data.type !== "weapon");
        data.weapon = itemSorted.filter(i => i.data.type === "weapon");

        // Sheet color
        data.colorScheme = game.settings.get("age-system", "colorScheme");

        // Check if sheet is from synthetic token - Passenger setup will not work for Synth
        data.notSynth = !(this.token && !this.token.data.actorLink);
        data.isSynth = !data.notSynth;

        // return data;
        return {
            actor: this.object,
            cssClass: isEditable ? "editable" : "locked",
            data: data,
            effects: data.effects,
            items: data.items,
            limited: this.object.limited,
            options: this.options,
            owner: isOwner,
            title: this.title,
            isGM: game.user.isGM
        };
    };

    activateListeners(html) {
        if (this.isEditable) {
            html.find(".change-loss").click(this._onChangeLoss.bind(this));
            html.find(".toggle").click(this._onEquipChange.bind(this));
            html.find(".remove").click(this._onRemoveFeature.bind(this));
            html.find(".edit").click(this._onEditFeature.bind(this));
            html.find(".roll-hull").click(this._onRollDice.bind(this));
            const freeText = html.find("textarea.free-text");
            for (let t = 0; t < freeText.length; t++) {
                const area = freeText[t];
                const newValue = area.value.replace(/^\s+|\s+$/gm,'');
                this.actor.update({[area.name]: newValue}).then(a => {
                    area.value = newValue;
                })
            }
            const inputs = html.find("input");
            inputs.focus(ev => ev.currentTarget.select());
        };

        html.on("dragenter", ".passenger.stats-block", ev => {
            ev.target.classList.add("dragover")
        })
        html.on("dragleave", ".passenger.stats-block", ev => {
            ev.target.classList.remove("dragover")
        })

        // Actions by sheet owner and observers (if setting is TRUE)
        if (this.actor.isOwner || this.observerRoll) {
            html.find(".roll-maneuver")
                .click(this._onRollManeuver.bind(this))
                .contextmenu(this._onRollManeuver.bind(this));
            html.find(".roll-damage.roll")
                .click(this._onRollDice.bind(this))
                .contextmenu(this._onRollDice.bind(this));
        };
        
        // Actions by sheet owner only
        if (this.actor.isOwner) {
            html.find(".remove-passenger").click(this._onRemovePassenger.bind(this));
            html.on("drop", ".passenger.stats-block", ev => {
                ev.target.classList.remove("dragover")
                const dragData = JSON.parse(ev.originalEvent.dataTransfer.getData("text/plain"))
                const passenger = game.actors.get(dragData.id);
                if (!passenger) return;
                // const actor = this.actor;
                let actor
                // if (this.actor.isToken) actor = game.actors.tokens[this.actor.token.data.id].actor;
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
        };

        super.activateListeners(html);
    };

    _onDropItemCreate(itemData) {
        if (!isDropedItemValid(this.actor, itemData.type, itemData.name)) return false;
        super._onDropItemCreate(itemData);
    }

    _onRollDice(event){
        const messageData = {
            rollMode: event.shiftKey ? "blindroll" : "roll",
            flavor: `${this.actor.name}`,
        }
        let rollFormula;
        if (event.currentTarget.classList.contains("roll-damage")) {
            const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
            const item = this.actor.items.get(itemId);
            rollFormula = item.data.data.damage;
            messageData.flavor += ` | ${item.name}`;
        }
        if (event.currentTarget.classList.contains("roll-hull")) {
            rollFormula = this.actor.data.data.hull.total;
            messageData.flavor += ` | ${game.i18n.localize("age-system.spaceship.hull")}`;
        }

        if (event.ctrlKey && !event.altKey) {
            rollFormula += " + 1D6";
            messageData.flavor += ` | +1D6`;
        }
        if (event.ctrlKey && event.altKey) {
            rollFormula += " + 2D6";
            messageData.flavor += ` | +2D6`;
        }
        const roll = new Roll(rollFormula).roll();
        return roll.toMessage(messageData);
    }

    _onRemoveFeature(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        return this.actor.items.get(itemId).delete();
    }

    _onEditFeature(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const item = this.actor.items.get(itemId);
        item.sheet.render(true);
    }

    _onEquipChange(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const itemToToggle = this.actor.items.get(itemId);
        const toggleEqp = !itemToToggle.data.data.isActive;
        itemToToggle.update({"data.isActive": toggleEqp});
    }

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
        if (event.currentTarget.classList.contains("is-synth")) datum.passengerId = "crew";
        const useFocus = vehicleData.systems[datum.sysName].useFocus;
        let rollData = {moreParts: []};
        let passenger = {};

        if (datum.passengerId === "crew") {
            passenger.name = game.i18n.localize("age-system.spaceship.crew");
            const crewAction = {
                value: vehicleData.crew.competence,
                label: passenger.name
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
        rollData.flavor = passenger.name;
        rollData.flavor2 = game.i18n.format(flavorText, parts);
        rollData.rollType = ageSystem.ROLL_TYPE.VEHICLE_ACTION;

        const system = this.actor.data.data.systems[datum.sysName]
        if (system) {
            rollData.moreParts.push({
                value: system.total,
                label: game.i18n.localize(`age-system.spaceship.systemName.${datum.sysName}`)
            })
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