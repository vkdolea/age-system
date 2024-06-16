import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";
import {dropChar, newItemData} from "./helper.js";

export default class ageSpaceshipSheet extends ActorSheet {
    
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            height: 750,
            resizable: true,
            classes: ["age-system", "sheet", "spaceship"]
        });
    }
    
    get template() {
        return `systems/age-system/templates/sheets/${this.actor.type}-sheet.hbs`;
    }
    
    get observerRoll () {
        return game.settings.get("age-system", "observerRoll");
    }

    async _onDrop(event) {
        return dropChar(event, this.actor) ? null : super._onDrop(event);
    }

    getData() {
        this.actor.prepareData(); // Forcing updating sheet after opening, in case an Actor's operator is updated
        const isOwner = this.document.isOwner;
        const isEditable = this.isEditable;
    
        // Copy actor data to a safe copy
        const data = this.actor.toObject(false);
        // const data = super.getData();
        data.config = CONFIG.ageSystem;
        data.passengers = sortObjArrayByName(this.actor.system.passengers, "name");

        const itemSorted = sortObjArrayByName(data.items, "name");
        data.qualities = itemSorted.filter(i => i.system.quality === "quality" && i.system.type !== "weapon");
        data.flaws = itemSorted.filter(i => i.system.quality === "flaw" && i.system.type !== "weapon");
        data.weapon = itemSorted.filter(i => i.system.type === "weapon");

        // Check if sheet is from synthetic token - Passenger setup will not work for Synth
        data.notSynth = !(this.token && !this.token.actorLink);
        data.isSynth = !data.notSynth;

        // return data;
        return {
            actor: this.object,
            cssClass: isEditable ? "editable" : "locked",
            data: data,
            system: data.system,
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
        };

        super.activateListeners(html);
    };

    _onDropItemCreate(itemData) {
        itemData = newItemData(this.actor, itemData);
        if (!itemData.length) return false
        super._onDropItemCreate(itemData);
    }

    _onRollDice(event){
        const actorData = this.actor?.system;
        const messageData = {
            rollMode: event.shiftKey ? "blindroll" : "roll",
            flavor: `${this.actor.name}`,
        }
        let rollFormula;
        if (event.currentTarget.classList.contains("roll-damage")) {
            const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
            const item = this.actor.items.get(itemId);
            rollFormula = item.system.damage;
            messageData.flavor += ` | ${item.name}`;
        }
        if (event.currentTarget.classList.contains("roll-hull")) {
            rollFormula = actorData.hull.total;
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
        return new Roll(rollFormula).toMessage(messageData);
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
        const toggleEqp = !itemToToggle.system.isActive;
        itemToToggle.update({"system.isActive": toggleEqp});
    }

    _onChangeLoss(event) {
        const actorData = this.actor.system;
        const lossSev = event.currentTarget.closest(".feature-controls").dataset.lossSev;
        const lossType = event.currentTarget.closest(".feature-controls").dataset.lossType;
        let lossValue = event.currentTarget.dataset.boxNumber;
        lossValue = Number(lossValue) + 1;
        const currentLoss = actorData.losses[lossSev][lossType].actual;
        let newLoss
        if (lossValue > currentLoss) {
            newLoss = lossValue;
        } else {
            newLoss = lossValue - 1;
        }

        const updatePath = `system.losses.${lossSev}.${lossType}.actual`; 
        this.actor.update({[updatePath]: newLoss});
    }

    _onRollManeuver(event) {
        const vehicleData = this.actor.system;
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

        const system = vehicleData.systems[datum.sysName]
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
        const crew = this.object.system.passengers;
        if (crew[passengerKey].isConductor) update = {"system.conductor": ""}
        crew.splice(passengerKey, 1);
        this.actor.update({...update, "system.passengers": crew});
    };
};