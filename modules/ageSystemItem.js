import { AdvancementSetup } from "./advancement.js";
import {ageSystem} from "./config.js";
import * as Dice from "./dice.js";

export class ageSystemItem extends Item {

    // Check if Item can cause damage
    get hasDamage() {
        const type = this.type;
        if (type === "weapon") {return true};
        if (type === "power" && this.system.causeDamage === true) {return true};
        return false;
    };

    // Check if Item heals
    get hasHealing() {
        const type = this.type;
        if (type === "power" && this.system.causeHealing === true) {return true};
        return false;
    }

    // Check if Item requires Fatigue roll to be used
    get hasFatigue() {
        if (this.type === "power" && this.system.useFatigue) {return game.settings.get("age-system", "useFatigue")};
        return false;
    };

    /** @override */
    async _preCreate(data, options, userId) {
        await super._preCreate(data, options, userId);
        const updates = {};
        if (!data.img || data.img === `icons/svg/item-bag.svg`) updates.img = ageSystem.itemIcons[this.type];
        switch (data.type) {
            case "class":
                this._preCreateClass(data, options, userId, updates);
                break;
        
            default:
                break;
        }
        this.updateSource(updates);
    }

    // Ensure all new Class items created are reset to Level 0
    _preCreateClass(data, options, userId, updates) {
        updates["system.level"] = 0;
    }
    
    /** @override */
    prepareBaseData() {
        const itemData = this;
        const data = itemData.system;
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
            data.useFocusActorId = data.useFocus && this.actor?.system ? this.actor.checkFocus(data.useFocus).id : null;
            data.useFocusActor = this.actor ? this.actor.checkFocus(data.useFocus) : null;
            data.hasDamage = this.hasDamage;
            data.hasHealing = this.hasHealing;
            data.hasFatigue = this.hasFatigue;

            // Adds value to represent portion added to dice on damage roll
            if (this.isOwned && this.actor) {
                const actorData = this.actor.system;
                if (data.dmgAbl) {
                    if (data.dmgAbl !== "no-abl") {
                        data.ablDamageValue = actorData.abilities[data.dmgAbl].total;
                    }
                }
                if (data.damageResisted) {
                    if (data.damageResisted.dmgAbl !== "no-abl") {
                        data.damageResisted.ablDamageValue = actorData.abilities[data.damageResisted.dmgAbl].total;
                    }                
                }
            };

            // Evaluate Attack and Damage modifier
            if (data.hasDamage || data.hasHealing) this.prepareDamageData(data)
        }

        switch (itemType) {
            case "focus": this._prepareFocus(data); break;
            case "power": this._preparePower(data); break;
            case "shipfeatures": this._prepareShipFeatures(data); break;
            case "class": this._prepareClass(data); break;
        }
    };

    _prepareClass(system) {
        const advPerLvl = new Array(20).fill(null);
        
        // Add all Progressive Advancements
        const progAdv = system.advancements.progressive;
        for (let p = 0; p < progAdv.length; p++) {
            const a = progAdv[p]
            const adv = a.adv;
            for (let i = 0; i < adv.length; i++) {
                const e = adv[i];
                if (!["", 0, "0"].includes(e)) {
                    if (!advPerLvl[i]) advPerLvl[i] = [];
                    advPerLvl[i].push({
                        type: 'progressive',
                        id: p,
                        level: p,
                        trait: a.trait,
                        value: e,
                        img: a.img,
                        alias: a.alias
                    })
                }
            }
        }

        // Add all Item Advancements
        const progItem = system.advancements.item;
        for (let id = 0; id < progItem.length; id++) {
            const it = progItem[id];
            const l = it.level -1
            if (!advPerLvl[l]) advPerLvl[l] = [];
            advPerLvl[l].push({
                type: "item",
                id: id,
                alias: it.alias,
                img: it.img
            })
        }

        system.advPerLvl = advPerLvl;
    }

    prepareDamageData(data) {
        // Evaluate Attack and Damage formula to represent on Item sheet or stat block
        const actor = this.actor?.system;
        if (data.hasDamage || data.hasHealing) {
            const useFocus = actor ? this.actor.checkFocus(data.useFocus) : null;
            const mode = game.settings.get("age-system", "healthSys");
            const useInjury = [`mageInjury`, `mageVitality`].includes(mode);

            // ATTACK BUILDER
            // Attack Mod - Actor Scope
            const atkBonuses = [];
            if (useFocus) atkBonuses.push(useFocus.value);
            const actorAbl = actor?.abilities?.[data.useAbl]?.total;
            if (actorAbl) atkBonuses.push(actor.abilities[data.useAbl].total);
            const atkBonusActor = ["testMod", "attackMod"];
            if (actor) {
                for (let am = 0; am < atkBonusActor.length; am++) {
                    const modName = atkBonusActor[am];
                    if (actor[modName]) atkBonuses.push(actor[modName]);
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
            data.activateMod = itemRollModFormula;
            // Bonus to Roll item (Ability/Focus test)
            data.itemRollMod = itemRollModFormula;
            let atkBonus = ""
            for (let i = 0; i < atkBonuses.length; i++) {
                const p = atkBonuses[i];
                if (i > 0) atkBonus += " + ";
                atkBonus += p;
            }
            const attkPartials = Dice.resumeFormula(atkBonus, this.actor?.actorRollData() ?? {});
            data.atkRollMod = attkPartials ? attkPartials.shortFormula : "+0";

            // DAMAGE BUILDER
            // Item Base Damage
            const dmgBonusArr = []
            let baseDamage = 0;
            if (useInjury) baseDamage = data.damageInjury;
            else if (data.damageFormula) baseDamage = data.damageFormula;
            dmgBonusArr.push(baseDamage);
            // Damage Formula - Actor Scope
            if (data.dmgAbl !== "no-abl") {
                if (actor?.abilities?.[data.dmgAbl]?.total) dmgBonusArr.push(actor.abilities[data.dmgAbl].total)
            }
            const dmgBonusActor = ["dmgMod"];
            if (actor) {
                for (let am = 0; am < dmgBonusActor.length; am++) {
                    const modName = dmgBonusActor[am];
                    if (actor[modName]) dmgBonusArr.push(actor[modName]);
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
                itemDmgModFormula += `${p}`;    
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
        const actor = this.actor;
        const actorData = actor?.system;
        if (data.initialValue) focusParts.push(data.initialValue);
        if (data.improved) focusParts.push("1");
        if (this.isOwned && actorData) {
            const focusBonus = actorData.ownedMods?.focus?.parts;
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
        const partial = Dice.resumeFormula(focusFormula, actor?.actorRollData() ?? {});
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

        // Actor Scope
        const actor = this.actor;
        const actorData = actor?.system;
        if (actor) {

            // Ability bonus
            const abl = actorData?.abilities?.[data?.itemForceAbl]?.total;
            if (data.itemForceAbl !== "no-abl" && abl) itemForceBonus.push(actorData.abilities[data.itemForceAbl].total)

            // Focus Bonus
            if (data.useFocus) itemForceBonus.push(actor.checkFocus(data.useFocus).value)

            // General 'allPowerForce' bonus
            const actorForceBonus = ["allPowerForce"];
            if (actorData?.ownedMods) {
                for (let am = 0; am < actorForceBonus.length; am++) {
                    const modName = actorForceBonus[am];
                    if (actorData.ownedMods[modName]) itemForceBonus.push(actorData.ownedMods[modName].totalFormula);
                };
            };

            // Instances of 'focusPowerForce' mods
            const focusPowerForce = actorData?.ownedMods?.['focusPowerForce']?.parts;
            if (focusPowerForce?.length) {
                for (let f = 0; f < focusPowerForce.length; f++) {
                    const m = focusPowerForce[f];
                    if (m.conditions.focus.toLowerCase() === data.useFocus.toLowerCase() || m.isValid) itemForceBonus.push(m.formula);
                }
            }
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
        const itemForcePartials = Dice.resumeFormula(itemForceBonusFormula, actor?.actorRollData() ?? {});
        data.itemForceBonus = itemForcePartials ? itemForcePartials.detValue : 0;
        data.itemForce = data.itemForceBonus;
        
        // Calculate Power Points and Strain
        data.powerPointCostTotal = data.powerPointCost;
        const strain = actorData?.armor?.strain
        data.powerPointCostTotal += strain ? strain : 0;

        // Calculate Fatigue TN if it is not a manual input
        if (data.inputFatigueTN === false) data.fatigueTN = 9 + Math.floor(Number(data.powerPointCost)/2);
    }

    _prepareShipFeatures(data) {};

    /**
     * Adds a new object inside Modifiers object
     * @param {Object} object.type Modifier type
     * @param {Object} object.formula Modifier value to be used
     * @returns Promise to update Item with new Modifier slot
     */
    _newModifier({type = "", formula = "0", flavor = ""}={}) {
        const itemData = this.system
        const modifiers = foundry.utils.deepClone(itemData.modifiers);
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
        const path = `system.modifiers.${modName}`

        const newMod = {
            type: type,
            formula: formula,
            flavor: flavor,
            isActive: true,
            valid: true,
            conditions: {},
            ftype: "",
            key: modName,
        }
        return this.update({[path]: newMod});
    }

    _onChangeAdvancement(data, action) {
        const type = data.type;
        const id = data.id;
        const level = data.level;
        if (!['item', 'progressive'].includes(type)) return false
        const prog = foundry.utils.deepClone(this.system.advancements[type]);

        // Code to remove Advancement
        if (action === "remove") {
            switch (type) {
                case "item": prog.splice(id, 1);
                    break;
                case "progressive": prog.splice(id, 1);
                    break;
                default:
                    break;
            }
            const path = `system.advancements.${type}`;
            this.update({[path]: prog});
        };

        // Code to edit Advancement
        if (action === "edit") {
            const advData = prog[id];
            const options = {
                data: advData,
                index: {
                    level: level,
                    id: id
                }
            }
            new AdvancementSetup(this.uuid, type, options).render(true);
        }
    }

    _levelChange(action) {
        if (!['class'].includes(this.type)) return null;
        if (!this.isOwned) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.ownedClassLevElOnly"));
        const curLevel = this.system.level;
        const maxLevel = ageSystem.maxLevel;
        const minLevel = ageSystem.minLevel;
        switch (action) {
            case 'add':
                if (curLevel == maxLevel) return ui.notifications.warn("Already at maximum level")
                this._levelUp();
                // this.update({"system.level": curLevel+1})
                break;
            case 'remove':
                if (curLevel == minLevel) return ui.notifications.warn("Already at minimum level")
                // this.update({"system.level": curLevel-1})
                this._levelDown();
                break;
            default:
                break;
        }
    }

    _levelUp() {
        if (this.type != "class" || !this.isOwned) return null;
        /**
         * Indicar ganho de Melhorias na seguinte ordem:
         * - Habilidades
         * - Saúde/Destino
         * - Power Points
         * - Defesa/Resistência
         * - Foco
         * - Talento
         * - Especialização
         * - Poder
         * - Façanhas
         */
        const actor = this.actor;
        const updates = {};
        const nextLevel = this.system.level+1;
        const improvements = foundry.utils.deepClone(this.system.advPerLvl[nextLevel]);
        const improveData = {
            itemUpdates: {
                ["system.level"]: nextLevel
            },
            toLevel: nextLevel
        };

        // Segregate Advancements per type
        for (let i = 0; i < improvements.length; i++) {
            const imp = improvements[i];
            switch (imp.type) {
                case 'progressive':
                    if (improveData[imp.trait]) improveData[imp.trait].push(imp)
                    else improveData[imp.trait] = imp;
                    break;
                case 'item':
                    if (improveData.item) improveData.item.push(imp)
                    else improveData.item = [imp];
                    break;
                default:
                    if (improveData.invalidAdvance) improveData.invalidAdvance.push(imp)
                    else improveData.invalidAdvance = [imp];
                    break;
            }
        }

        this._levelAblAdv(improveData);
        this._levelHealth(improveData);
        this._levelPowerPoints(improveData);
        this._levelDefenseTough(improveData);
        this._levelFocus(improveData);
        this._levelTalents(improveData);
        this._levelSpec(improveData);
        this._levelPowers(improveData);
        this._levelStunts(improveData);

        this.update(improveData.itemUpdates);
    }

    _levelAblAdv(imp) {
        if (!imp.ablAdvance.length ?? imp.ablAdvance) return null;
        let advances = 0;
        for (let q = 0; q < imp.ablAdvance.length; q++) {
            const e = imp.ablAdvance[q].value;
            advances = advances + e;
        }

        // Identify relevant Game Setting;
        const primaryAbl = game.settings.get("age-system", "primaryAbl");

        // Array to identify keys of Abilities available to be progressed in this level up
        let validKeys = []
        const ABILITY_KEYS = CONFIG.ageSystem.ABILITY_KEYS

        // Select valid keys for progressing
        if (primaryAbl) {
            // CASE 1 - Game set to use Primary/Secondary Abilities: Improvements from Odd levels sums to Secondary Abilities while Primeary Abilities benefits from Advancements on even levels
            const isOdd = imp.toLevel % 2 == 1 ? true : false;
            const primaryKeys = this.system.primaryAbl;
            const secondaryKeys = ABILITY_KEYS.filter(x => !primaryKeys.includes(x));
            validKeys = isOdd ? secondaryKeys : primaryAbl;
        } else {
            // CASE 2 - No Primary/Secondary abilities: user can not progress Abilities progressed in the last time
            validKeys = foundry.utils.deepClone(ABILITY_KEYS);
            const lastAblAdv = this.actor.system.advancements?.[this.actor.level].ablAdvance;
            if (lastAblAdv?.length) {
                for (let a = 0; a < lastAblAdv.length; a++) {
                    const e = lastAblAdv[a].key;
                    const index = validKeys.indexOf(e);
                    if (index > -1) validKeys.splice(index, 1);
                }
            }
        }

        // Create App to allow user to progress. This app shall be created on advancement.js
    }

    _levelDown() {
        this.update({"system.level": this.system.level--})
    }

    // Assists to identify if the value of a Modifier has valid data according to Modifier's Formula Type (ftype)
    evalMod(m) {
        if (m.type === "") return m
        m.ftype = ageSystem.modkeys[m.type].dtype;
        let validFormula = true;
        switch (m.ftype) {
            case "nodice":
                // Check formula for Dice Terms
                const tempRoll = new Roll(m.formula);
                tempRoll.terms.map(term => {
                    if (term instanceof DiceTerm) validFormula = false
                });
                break;

            case "number":
                if (Number.isNaN(Number(m.formula))) validFormula = false;
                break;
        
            case "formula":
                break;

            default:
                break;
        }
        m.itemId = this.id;
        m.itemName = this.name;
        m.valid = Roll.validate(m.formula) && validFormula;
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

        const itemData = this.system;
        const actor = this.actor;
        const actorData = actor?.system;

        if (!itemData.hasDamage && !itemData.hasHealing) return false;

        const damageData = {
            // event: event,
            // atkDmgTradeOff: atkDmgTradeOff,
            // stuntDie: stuntDie,
            // addFocus: addFocus,
            // resistedDmg: resistedDmg,
            ...arguments[0],
            item: this,
            actorDmgMod: actor ? actorData.dmgMod : 0,
            actorWgroups: actorData.wgroups
        };
        return Dice.itemDamage(damageData);
    };

    // Roll item and check targetNumbers
    async roll(event, rollType = null, targetNumber = null) {
        const ROLL_TYPE = ageSystem.ROLL_TYPE;
        const actor = this.actor;
        const actorData = actor?.system;
        const itemData = this.system;
        if (itemData.type === "power" && !itemData.system.hasRoll) return false
        if (!actor) return false;
        let ablCode = (rollType === ROLL_TYPE.FATIGUE) ? itemData.ablFatigue : itemData.useAbl;

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
                    ablCode = itemData.ablFatigue;
                    targetNumber = itemData.fatigueTN ? itemData.fatigueTN : null;
                    break;
                
                case ROLL_TYPE.POWER:
                    targetNumber = itemData.targetNumber ? itemData.targetNumber : null;
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
                        targetNumber = targetToken.actor.system.defense.total;
                    }
                    break;
        
                default:
                    break;
            }
        }

        const rollData = {
            event: event,
            actor: actor,
            abl: ablCode,
            itemRolled: this,
            rollTN: targetNumber,
            rollType
        }
        
        // Check if power is used and look for Power Points
        if (rollType !== ROLL_TYPE.FATIGUE && this.type === 'power' && ageSystem.autoConsumePP) {
            if (!this.hasFatigue && actor) {
                const cost = itemData.powerPointCostTotal;
                const remainingPP = actorData?.powerPoints.value;
                if (cost > remainingPP) {
                    const castAnyway = await new Promise(resolve => {
                        const data = {
                            content: `<p>${game.i18n.format("age-system.rollWithoutPP", {name: actor.name, item: this.name})}</p>`,
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
                    actor.update({"system.powerPoints.value": remainingPP - cost}, {value: -cost, type: 'power'})
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
        "shipfeatures": "systems/age-system/templates/sheets/chat/shipfeatures-sheet.hbs",

        "item-to-chat": "systems/age-system/templates/sheets/chat/item-to-chat.hbs"
    };

    async showItem(forceSelfRoll = false) {
        const item = this;
        const itemData = this.system;
        const rollMode = game.settings.get("core", "rollMode");       
        const cardData = {
            inChat: true,
            name: item.name,
            system: item.system,
            item: item,
            itemId: item.id,
            owner: this.actor,
            ownerUuid: this.actor.uuid,
            config: ageSystem,
            // config: {
            //     colorScheme: ageSystem.colorScheme,
            //     wealthMode: game.settings.get("age-system", "wealthType")
            // },
            cssClass: `age-system colorset-${ageSystem.colorScheme} item-to-chat`
        };
        const chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            content: await renderTemplate(item.chatTemplate["item-to-chat"], cardData),
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