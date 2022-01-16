import {ageSystem} from "./config.js";
import * as Dice from "./dice.js";
// import { actorRollData } from "./dice.js";

export class ageSystemItem extends Item {

    // Check if Item can cause damage
    get hasDamage() {
        const type = this.data.type;
        if (type === "weapon") {return true};
        if (type === "power" && this.data.data.causeDamage === true) {return true};
        return false;
    };

    // Check if Item heals
    get hasHealing() {
        const type = this.data.type;
        if (type === "power" && this.data.data.causeHealing === true) {return true};
        return false;
    }

    // Check if Item requires Fatigue roll to be used
    get hasFatigue() {
        if (this.data.type === "power" && this.data.data.useFatigue) {return game.settings.get("age-system", "useFatigue")};
        return false;
    };
    
    /** @override */
    prepareBaseData() {
        if (this.data.img === "icons/svg/item-bag.svg") {
            if (!ageSystem.itemIcons[this.data.type]) this.data.img = "icons/svg/item-bag.svg";
            this.data.img = ageSystem.itemIcons[this.data.type];
        };
        if (!this.data.name) this.data.name = "New " + game.i18n.localize(this.data.type);
        
        const itemData = this.data;
        const data = itemData.data;
        const itemType = itemData.type;

        data.colorScheme = `colorset-${game.settings.get("age-system", "colorScheme")}`;
        data.nameLowerCase = itemData.name.toLowerCase();

        // Validate each Modifier formula based on ftype and create Arrays by type
        const rawMods = data.modifiers;
        data.modifiersByType = {}
        for (const k in rawMods) {
            if (Object.hasOwnProperty.call(rawMods, k)) {
                rawMods[k] = this.evalMod(rawMods[k]);
                if (rawMods[k].type !== "") {
                    if (data.modifiersByType[rawMods[k].type]) {
                        data.modifiersByType[rawMods[k].type].push(rawMods[k]);
                    } else {
                        data.modifiersByType[rawMods[k].type] = [rawMods[k]];
                    }
                }
            }
        }
        
        // Adding common data for Power and Weapon
        if (["power", "weapon"].includes(itemType)) {
            data.useFocusActorId = data.useFocus && this.actor?.data ? this.actor.checkFocus(data.useFocus).id : null;
            data.useFocusActor = this.actor?.data ? this.actor.checkFocus(data.useFocus) : null;
            data.hasDamage = this.hasDamage;
            data.hasHealing = this.hasHealing;
            data.hasFatigue = this.hasFatigue;

            // Adds value to represent portion added to dice on damage roll
            if (this.isOwned && this.actor?.data) {
                if (data.dmgAbl) {
                    if (data.dmgAbl !== "no-abl") {
                        data.ablDamageValue = this.actor.data.data.abilities[data.dmgAbl].total;
                    }
                }
                if (data.damageResisted) {
                    if (data.damageResisted.dmgAbl !== "no-abl") {
                        data.damageResisted.ablDamageValue = this.actor.data.data.abilities[data.damageResisted.dmgAbl].total;
                    }                
                }

            };

            // Evaluate Attack and Damage modifier
            if (data.hasDamage || data.hasHealing) this._postPrepareData(data)
        }

        switch (itemType) {
            case "focus": this._prepareFocus(data);
                break;
            case "power": this._preparePower(data);
                break;
            case "shipfeatures": this._prepareShipFeatures(data);
                break;
        }
        this.prepareEmbeddedDocuments();
    };

    _postPrepareData(data) {
        // Evaluate Attack and Damage formula to represent on Item sheet or stat block
        const actor = this.actor?.data?.data;
        if (data.hasDamage || data.hasHealing) {
            const useFocus = actor ? this.actor.checkFocus(this.data.data.useFocus) : null;
            const mode = game.settings.get("age-system", "healthSys");
            const useInjury = [`mageInjury`, `mageVitality`].includes(mode);

            // Attack Mod - Actor Scope
            const atkBonuses = [];
            if (useFocus) atkBonuses.push(useFocus.value);
            const actorAbl = actor?.abilities?.[data.useAbl]?.total;
            if (actorAbl) atkBonuses.push(actor.abilities[data.useAbl].total);
            const atkBonusActor = ["testMod", "attackMod"];
            if (actor?.ownedBonus) {
                for (let am = 0; am < atkBonusActor.length; am++) {
                    const modName = atkBonusActor[am];
                    if (actor.ownedBonus[modName]) atkBonuses.push(actor.ownedBonus[modName].totalFormula);
                };
            };

            // Attack Mod - Item Scope
            const atkBonusItem = ["itemActivation"];
            const itemRollMod = [];
            if (data.modifiersByType) {
                for (let a = 0; a < atkBonusItem.length; a++) {
                    const modName = atkBonusItem[a];
                    const mods = data.modifiersByType[modName]
                    if (mods) {
                        for (let i = 0; i < mods.length; i++) {
                            const m = mods[i];
                            if (m.valid && m.isActive) itemRollMod.push(m.formula);
                        }
                    } 
                };
            }
            let itemRollModFormula = "";
            for (let i = 0; i < itemRollMod.length; i++) {
                const p = itemRollMod[i];
                if (i > 0) itemRollModFormula += " + ";
                itemRollModFormula += p;
                atkBonuses.push(p)
            }
            // Bonus to Roll item (Ability/Focus test)
            data.itemRollMod = itemRollModFormula;
            let atkBonus = ""
            for (let i = 0; i < atkBonuses.length; i++) {
                const p = atkBonuses[i];
                if (i > 0) atkBonus += " + ";
                atkBonus += p;
            }
            const attkPartials = Dice.resumeFormula(atkBonus, this.actor?.actorRollData() ?? {});
            data.atkRollMod = attkPartials ? attkPartials.shortFormula : "0";

            // Item Base Damage
            const dmgBonusArr = []
            if (data.damageFormula) dmgBonusArr.push(data.damageFormula);
            // Damage Formula - Actor Scope
            if (data.dmgAbl !== "no-abl") {
                if (this.actor?.data?.data?.abilities?.[data.dmgAbl]?.total) dmgBonusArr.push(this.actor.data.data.abilities[data.dmgAbl].total)
            }
            const dmgBonusActor = ["actorDamage"];
            if (actor?.ownedBonus) {
                for (let am = 0; am < dmgBonusActor.length; am++) {
                    const modName = dmgBonusActor[am];
                    if (actor.ownedBonus[modName]) dmgBonusArr.push(actor.ownedBonus[modName].totalFormula);
                };
            };
            // Damage Parts - Item Scope
            const dmgBonusItemArr = []
            const dmgBonusItem = ["itemDamage"];
            if (data.modifiersByType) {
                for (let a = 0; a < dmgBonusItem.length; a++) {
                    const modName = dmgBonusItem[a];
                    const mods = data.modifiersByType[modName]
                    if (mods) {
                        for (let i = 0; i < mods.length; i++) {
                            const m = mods[i];
                            if (m.valid && m.isActive) {
                                dmgBonusItemArr.push(m.formula);
                            }
                        }
                    } 
                };
            }
            let itemDmgModFormula = "";
            for (let i = 0; i < dmgBonusItemArr.length; i++) {
                const p = dmgBonusItemArr[i];
                if (i > 0) itemDmgModFormula += " + ";
                itemDmgModFormula += p;
                dmgBonusArr.push(p)
            }
            let dmgBonus = ""
            for (let i = 0; i < dmgBonusArr.length; i++) {
                const p = dmgBonusArr[i];
                if (i > 0) dmgBonus += " + ";
                dmgBonus += p;
            }
            const dmgPartials = Dice.resumeFormula(dmgBonus, this.actor?.actorRollData() ?? {});
            data.itemDmgMod = itemDmgModFormula ? itemDmgModFormula : "0";
            data.dmgFormula = dmgPartials ? dmgPartials.shortFormula : 0;
        }

        if (actor && this.type === 'weapon') {
            const rangeParts = Dice.resumeFormula(`${data.range}`, this.actor?.actorRollData() ?? {});
            data.rangeCalc = rangeParts ? rangeParts.detValue : "";

            const rangeMaxParts = Dice.resumeFormula(`${data.rangeMax}`, this.actor?.actorRollData() ?? {});
            data.rangeMaxCalc = rangeMaxParts ? rangeMaxParts.detValue : "";
        } else {
            data.rangeCalc = data.range;
            data.rangeMaxCalc = data.rangeMax;
        }
    }

    _prepareFocus(data) {
        const focusParts = [];
        if (data.initialValue) focusParts.push(data.initialValue);
        if (data.improved) focusParts.push("1");
        // data.finalValue = data.improved ? data.initialValue + 1 : data.initialValue;
        if (this.isOwned && this.actor?.data) {
            const focusBonus = this.actor.data.data.modifiersByType?.focus?.parts;
            if (focusBonus?.length) {
                for (let f = 0; f < focusBonus.length; f++) {
                    const m = focusBonus[f];
                    if (data.nameLowerCase === m.conditions.focus.toLowerCase()) focusParts.push(m.formula);
                }
            }
        }
        let focusFormula = "";
        for (let i = 0; i < focusParts.length; i++) {
            const p = focusParts[i];
            if (i > 0) focusFormula += " + "
            focusFormula += `${p}`
        }
        const partial = Dice.resumeFormula(focusFormula, this.actor?.actorRollData() ?? {});
        data.finalValue = partial ? partial.detValue : 0;

        const abilitiesOrg = Object.keys(ageSystem.abilitiesOrg);
        const abilitiesChar = Object.keys(ageSystem.abilities);
        const hasOrgAbl = abilitiesOrg.includes(data.useAbl);
        if (data.isOrg === !hasOrgAbl) data.useAbl = data.isOrg ? abilitiesOrg[0] : abilitiesChar[0]; 
    }

    _preparePower(data) {
        const useFatigue = game.settings.get("age-system", "useFatigue");
        if (!useFatigue) data.useFatigue = false;

        // Calculate Item Force
        // data.itemForce = 10;
        const itemForceBonus = []

        // Item Force bonus - Actor Scope
        if (this.actor?.data) {
            const abl = this.actor?.data?.data?.abilities?.[data?.itemForceAbl]?.total;
            if (data.itemForceAbl !== "no-abl" && abl) itemForceBonus.push(this.actor.data.data.abilities[data.itemForceAbl].total)
        }
        
        // Identify Bonus to Increase only this Power Item Force
        const thisPFmods = data.modifiersByType?.['powerForce'];
        if (thisPFmods) {
            const validMods = thisPFmods.filter(i => i.valid && i.isActive);
            if (validMods.length) {
                for (let i = 0; i < validMods.length; i++) {
                    const m = validMods[i];
                    itemForceBonus.push(m.formula)
                }
            }
        }

        let itemForceBonusFormula = "10";
        for (let i = 0; i < itemForceBonus.length; i++) {
            const b = itemForceBonus[i];
            itemForceBonusFormula += ` + ${b}`            
        }
        const itemForcePartials = Dice.resumeFormula(itemForceBonusFormula, this.actor?.actorRollData() ?? {});
        data.itemForceBonus = itemForcePartials ? itemForcePartials.detValue : 0;
        data.itemForce = data.itemForceBonus;
        
        // Calculate Power Points and Strain
        data.powerPointCostTotal = data.powerPointCost;
        const strain = this?.actor?.data?.data?.armor?.strain
        data.powerPointCostTotal += strain ? strain : 0;

        // Calculate Fatigue TN if it is not a manual input
        if (data.inputFatigueTN === false) data.fatigueTN = 9 + Math.floor(Number(data.powerPointCost)/2);
    }

    _prepareShipFeatures(data) {};

    /**
     * Adds a new object inside Modifiers object
     * @returns Promise to update Item with new Modifier slot
     */
    _newModifier() {
        const modifiers = foundry.utils.deepClone(this.data.data.modifiers);
        const keys = [];
        for (const k in modifiers) {
            if (Object.hasOwnProperty.call(modifiers, k)) {
                keys.push(k)
            }
        }

        let modName
        do {
            modName = foundry.utils.randomID(20);
        } while (keys.includes(modName));
        const path = `data.modifiers.${modName}`

        const newMod = {
            type: "",
            formula: "0",
            flavor: "",
            isActive: true,
            valid: true,
            conditions: {},
            ftype: "",
            key: modName,
        }
        return this.update({[path]: newMod});
    }

    evalMod(m) {
        if (m.type === "") return m
        m.ftype = ageSystem.modkeys[m.type].dtype;
        switch (m.ftype) {
            case "nodice":
                // Remove all dice pools
                // TODO - also remove modifiers from dice pools
                let reg = /[0-9]+d[0-9]+/g;
                m.formula = m.formula.replaceAll(reg, "");
                reg = /d[0-9]+/g;
                m.formula = m.formula.replaceAll(reg, "");
                break;

            case "number":
                if(Number.isNaN(Number(m.formula))) m.formula = "0";
                break;
        
            case "formula":
                break;

            default:
                break;
        }
        m.itemId = this.id;
        m.itemName = this.name;
        m.valid = Roll.validate(m.formula);
        if (!m.valid) m.isActive = false;
        return m
    }

    // Rolls damage for the item
    rollDamage({
        event = null,
        stuntDie = null,
        addFocus = false,
        atkDmgTradeOff = 0,
        resistedDmg = false}={}) {

        if (!this.data.data.hasDamage && !this.data.data.hasHealing) return false;

        const damageData = {
            // event: event,
            // atkDmgTradeOff: atkDmgTradeOff,
            // stuntDie: stuntDie,
            // addFocus: addFocus,
            // resistedDmg: resistedDmg,
            ...arguments[0],
            item: this,
            actorDmgMod: this.actor ? this.actor.data.data.dmgMod : 0,
            actorWgroups: this.actor.data.data.wgroups
        };
        return Dice.itemDamage(damageData);
    };

    // Roll item and check targetNumbers
    async roll(event, rollType = null, targetNumber = null) {
        const ROLL_TYPE = ageSystem.ROLL_TYPE;
        const owner = this.actor;
        if (!owner) return false;
        let ablCode = (rollType === ROLL_TYPE.FATIGUE) ? this.data.data.ablFatigue : this.data.data.useAbl;

        if (rollType === null) {
            switch (this.type) {
                case "weapon":
                    rollType = ROLL_TYPE.ATTACK
                    break;
                case "power":
                    rollType = ROLL_TYPE.POWER
                    break
                case "focus":
                    rollType = ROLL_TYPE.FOCUS
                    break
                default:
                    break;
            }
        }
        
        if (targetNumber === null) {
            switch (rollType) {
                case ROLL_TYPE.FATIGUE:
                    ablCode = this.data.data.ablFatigue;
                    targetNumber = this.data.data.fatigueTN ? this.data.data.fatigueTN : null;
                    break;
                
                case ROLL_TYPE.POWER:
                    targetNumber = this.data.data.targetNumber ? this.data.data.targetNumber : null;
                    break;
    
                case ROLL_TYPE.ATTACK || ROLL_TYPE.RANGED_ATTACK || ROLL_TYPE.MELEE_ATTACK || ROLL_TYPE.STUNT_ATTACK:
                    const targets = game.user.targets;
                    if (targets.size === 0) break;
                    if (targets.size > 1) {
                        // TODO - add case for multiple targets attacked
                        let warning = game.i18n.localize("age-system.WARNING.selectOnlyOneTarget");
                        ui.notifications.warn(warning);
                        return;
                    } else {
                        const targetId = targets.ids[0];
                        const targetToken = canvas.tokens.placeables.find(t => t.data._id === targetId);
                        targetNumber = targetToken.actor.data.data.defense.total;
                    }
                    break;
        
                default:
                    break;
            }
        }

        const rollData = {
            event: event,
            actor: owner,
            abl: ablCode,
            itemRolled: this,
            rollTN: targetNumber,
            rollType
        }
        
        // Check if power is used and look for Power Points
        if (rollType !== ROLL_TYPE.FATIGUE && this.type === 'power' && ageSystem.autoConsumePP) {
            const owner = this.actor
            if (!this.hasFatigue && owner) {
                const cost = this.data.data.powerPointCostTotal;
                const remainingPP = this.actor.data.data.powerPoints.value;
                if (cost > remainingPP) {
                    const castAnyway = await new Promise(resolve => {
                        const data = {
                            content: `<p>${game.i18n.format("age-system.rollWithoutPP", {name: owner.name, item: this.name})}</p>`,
                            buttons: {
                                normal: {
                                    label: game.i18n.localize("age-system.roll"),
                                    callback: html => resolve({roll: true})
                                },
                                cancel: {
                                    label: game.i18n.localize("age-system.cancel"),
                                    callback: html => resolve({roll: false}),
                                }
                            },
                            default: "normal",
                            close: () => resolve({cancelled: true}),
                        }
                        new Dialog(data, null).render(true);
                    });
                    if (!castAnyway.roll) return false;
                } else {
                    this.actor.update({"data.powerPoints.value": remainingPP - cost}, {value: -cost, type: 'power'})
                }
            }
        }

        Dice.ageRollCheck(rollData);
    };

    chatTemplate = {
        "weapon": "systems/age-system/templates/sheets/chat/weapon-sheet.hbs",
        "focus": "systems/age-system/templates/sheets/chat/focus-sheet.hbs",
        "stunts": "systems/age-system/templates/sheets/chat/stunts-sheet.hbs",
        "talent": "systems/age-system/templates/sheets/chat/talent-sheet.hbs",
        "equipment": "systems/age-system/templates/sheets/chat/equipment-sheet.hbs",
        "power": "systems/age-system/templates/sheets/chat/power-sheet.hbs",
        "relationship": "systems/age-system/templates/sheets/chat/relationship-sheet.hbs",
        "honorifics": "systems/age-system/templates/sheets/chat/honorifics-sheet.hbs",
        "membership": "systems/age-system/templates/sheets/chat/membership-sheet.hbs",
        "shipfeatures": "systems/age-system/templates/sheets/chat/shipfeatures-sheet.hbs"
    };

    async showItem(forceSelfRoll = false) {
        return ui.notifications.warn("Show item cards on chat is currently unavailable. Await until next version"); // Remove when chat cards are working again
        const rollMode = game.settings.get("core", "rollMode");       
        const cardData = {
            inChat: true,
            name: this.data.name,
            data: this.data,
            item: this,
            itemId: this.id,
            owner: this.actor,
            ownerUuid: this.actor.uuid,
            config: {
                colorScheme: ageSystem.colorScheme,
                wealthMode: game.settings.get("age-system", "wealthType")
            },
            cssClass: `colorset-${ageSystem.colorScheme}`
        };
        const chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            roll: false,
            content: await renderTemplate(this.chatTemplate[this.type], cardData),
            flags: {
                "age-system": {messageData: cardData}
            }
        };
        if (forceSelfRoll) {
            chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
            chatData.whisper = [game.user.id];
        } else {
            ChatMessage.applyRollMode(chatData, rollMode);
        }
        return ChatMessage.create(chatData);
    };
};