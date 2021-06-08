import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";

export default class ageSystemVehicleSheet extends ActorSheet {
    constructor(...args) {
        super(...args);
    
        // Adapt sheet size for synth tokens - Passengers feature wont work for Synths
        // if (this.isSynth) {
        //     this.options.height = this.position.height = "560";
        // };
    };

    get isSynth() {
        return (this.token && !this.token.data.actorLink);
    }    

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            // height: 560,
            height: 755,
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
        // const data = super.getData();
        const isOwner = this.document.isOwner;
        const isEditable = this.isEditable;
    
        // Copy actor data to a safe copy
        const data = this.actor.data.toObject(false);

        this.actor.prepareData(); // Forcing updating sheet after opening, in case an Actor's operator is updated
        data.config = CONFIG.ageSystem;
        data.passengers = sortObjArrayByName(this.actor.data.data.passengers, "name");

        // Sheet color
        data.colorScheme = game.settings.get("age-system", "colorScheme");

        // Check if sheet is from synthetic token - Passenger setup will not work for Synth
        // data.notSynth = !(this.token && !this.token.data.actorLink);
        // data.isSynth = !data.notSynth;        

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
            const freeText = html.find("textarea.free-text");
            for (let t = 0; t < freeText.length; t++) {
                const area = freeText[t];
                const newValue = area.value.replace(/^\s+|\s+$/gm,'');
                this.actor.update({[area.name]: newValue}).then(a => {
                    area.value = newValue;
                })
            }
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
        if (this.actor.isOwner) {

            html.find(".roll-vehicle-dmg").click(this._onVehicleDamage.bind(this));
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
        let conductorId;
        if (event.currentTarget.classList.contains("is-synth")) {
            conductorId = "synth-vehicle";
        } else {
            conductorId = vehicleData.conductor;
        }
        if (conductorId === "") return false;

        let conductorData; 
        let user;
        if (conductorId === "synth-vehicle") {
            const speaker = ChatMessage.getSpeaker();
            if (speaker.token) user = game.actors.tokens[speaker.token];
            if (!user) user = game.actors.get(speaker.actor);
            conductorData = user;
            if (user.data.type != "char") return false;
        } else {
            conductorData = vehicleData.passengers.filter(p => p.isConductor === true)[0];
            if (conductorData.isToken) user = game.actors.tokens[conductorData.id];
            if (!conductorData.isToken) user = game.actors.get(conductorData.id);
            if (!conductorData) {
                const parts = {name: conductorData.name, id: conductorData.id};
                let warning = game.i18n.format("age-system.WARNING.userNotAvailable", parts);
                return ui.notifications.warn(warning);
            };
        }
        
        const handlingUseFocus = vehicleData.handling.useFocus;
        const handlingFocusItem = user.checkFocus(handlingUseFocus);
        const handlingUseAbl = vehicleData.handling.useAbl;
        const rollData = {
            event: event,
            actor: user,
            abl: handlingUseAbl,
            flavor: game.i18n.format("age-system.chatCard.maneuversVehicle", {name: user.name, vehicle: this.actor.name}),
            vehicleHandling: this.actor.data.data.handling.mod,
            itemRolled: handlingFocusItem.id === null ? handlingFocusItem.focusName : handlingFocusItem.focusItem
        }
        Dice.ageRollCheck(rollData);
    };

    _onVehicleDamage(event) {
        event.preventDefault();
        const e = event.currentTarget;
        const addRam = e.classList.contains('add-ram') ? true : false;
        const isCollision = e.closest(".feature-controls").classList.contains('collision');
        const damageSource = isCollision ? 'collision' : 'sideswipe';
        const qtdDice = e.closest(".feature-controls").dataset.qtdDice;
        const operatorId = this.actor.data.data.conductor;
        const operatorData = operatorId ? this.actor.data.data.passengers.filter(p => p.id === operatorId)[0] : null;
        const damageData = {event: event, qtdDice, addRam, operatorData, damageSource};
        return this.actor.rollVehicleDamage(damageData);
    };
};