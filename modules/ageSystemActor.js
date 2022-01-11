import { ageSystem } from "./config.js";
import * as Dice from "./dice.js";

export class ageSystemActor extends Actor {

    /** @override */
    prepareData() {
        // super.prepareData();
        this.data.reset(); // super.prepareData();
        this.prepareBaseData();
        this.prepareEmbeddedDocuments();
        this.prepareDerivedData();
        // Sorting Items for final data preparation
        const items = this.items;
        // this._preparePostModCharData();
        if (this.data.type === 'char') {
            // First prepare Focus
            items.forEach(i => {
                if (i.data.type === "focus") {
                    i.prepareData();
                    if(i.sheet?.rendered) i.sheet.render(false);
                }
            })
            // Then prepare other item types which require further prep
            items.forEach(i => {
                if (["weapon", "power"].includes(i.data.type)) {
                    i.prepareData()
                    if(i.sheet?.rendered) i.sheet.render(false);
                }
            })
            
            // Calculate Initiative based on Focus (if set on System Settings)
            const initiativeFocus = game.settings.get("age-system", "initiativeFocus");
            if (initiativeFocus) {
                const init = this.checkFocus(initiativeFocus);
                this.data.data.initiative += init.value;
            }
        }
    }

    prepareBaseData() {
        const actorData = this.data;
        const data = actorData.data;
        
        if (this.data.img == CONST.DEFAULT_TOKEN) this.data.img = ageSystem.actorIcons[actorData.type];

        // Check if split Armor is in use
        data.useBallisticArmor = game.settings.get("age-system", "useBallisticArmor");

        // Retrieve wealth mode
        data.useResource = data.useIncome = data.useCurrency = data.useCoins = false;
        const wealthMode = game.settings.get("age-system", "wealthType");
        switch (wealthMode) {
            case "income":
                data.useIncome = true;
                break;
            case "resources":
                data.useResources = true;
                break;
            case "currency":
                data.useCurrency = true;
                break;
            case "coins":
                data.useCoins = true;
                break;
            default:
                break;
        };

        switch (actorData.type) {
            case "char":
                this._prepareBaseDataChar();
                break;
            case "vehicle":
                this._prepareBaseDataVehicle();
                break;
            case "spaceship":
                this._prepareBaseDataSpaceship();
                break;
            default:
                break;
        }
    }

    /** @override */
    prepareEmbeddedDocuments() {
        // super.prepareEmbeddedDocuments()
        const embeddedTypes = this.constructor.metadata.embedded || {};
        for ( let cls of Object.values(embeddedTypes) ) {
            const collection = cls.metadata.collection;
            for ( let e of this[collection] ) {e.prepareData()}
        }
        
        // Apply Item Modifiers to Actor before applying Active Effects!
        this.applyItemModifiers();

        this.applyActiveEffects();
    }

    prepareDerivedData() {
        const actorData = this.data;
        // const data = actorData.data;

        switch (actorData.type) {
            case "char":
                this._prepareDerivedDataChar();
                break;
            case "vehicle":
                this._prepareDerivedDataVehicle();
                break;
            case "spaceship":
                this._prepareDerivedDataSpaceship();
                break;        
            default:
                break;
        }
    };

    _prepareBaseDataChar() {

        const actorData = this.data;
        const data = actorData.data;
        
        // Check if Conviction is in use
        data.useConviction = game.settings.get("age-system", "useConviction");

        // Check if Toughness is in use
        data.useToughness = game.settings.get("age-system", "useToughness");

        // Check if Fatigue is in use
        data.useFatigue = game.settings.get("age-system", "useFatigue");

        // Check if Power Points is in use
        data.usePowerPoints = game.settings.get("age-system", "usePowerPoints");

        // Ensure Fatigue has valid Values and creates Status text
        if (data.fatigue.entered > data.fatigue.max) data.fatigue.entered = data.fatigue.max;
        if (data.fatigue.entered < 0) data.fatigue.entered = 0;
        data.fatigue.value = data.fatigue.entered;
        switch (data.fatigue.value) {
            case 0:
                data.fatigue.status = game.i18n.localize(ageSystem.fatigueConditions.noFatigue);
            break;
            case 1:
                data.fatigue.status = game.i18n.localize(ageSystem.fatigueConditions.winded);
            break;
            case 2:
                data.fatigue.status = game.i18n.localize(ageSystem.fatigueConditions.fatigued);
            break;
            case 3:
                data.fatigue.status = game.i18n.localize(ageSystem.fatigueConditions.exhausted);
            break;
            case 4:
                data.fatigue.status = game.i18n.localize(ageSystem.fatigueConditions.dying);
            break;            
                                            
            default:
                break;
        };

        // Injury Degrees and Injury Marks
        const gameMode = game.settings.get("age-system", "gameMode");
        if (gameMode === 'none') data.injury.degrees.severeMult = 2;
        if (gameMode === 'gritty') data.injury.degrees.severeMult = 3;
        if (gameMode === 'pulp') data.injury.degrees.severeMult = 2;
        if (gameMode === 'cinematic') data.injury.degrees.severeMult = 1;
        data.injury.totalDegrees = data.injury.degrees.light + data.injury.degrees.serious + data.injury.degrees.severe;
        const expectedMarks = data.injury.degrees.light + data.injury.degrees.serious + data.injury.degrees.severe * data.injury.degrees.severeMult;
        const diffMarks = expectedMarks - data.injury.marks
        let marksArray = Array.apply(null, Array(data.injury.degrees.severeMult))
        if (data.injury.degrees.severe) {
            for (let m = 0; m < marksArray.length; m++) {
                marksArray[m] = diffMarks <= m ? true : false
            }
        }
        data.injury.marksArray = marksArray;

    };

    applyItemModifiers() {
        const type = this.data.type;

        switch (type) {
            case "char":
                this._charItemModifiers();
                break;
            case "spaceship":
                this._spaceshipItemModifiers();
                break;
            case "vehicle": 
                break;
            default:
                break;
        }
    }

    _charItemModifiers() {
        const mods = {};
        this.items.forEach(i => {
            if (i.data.data.modifiers.length && (i.data.data.equiped || i.data.data.activate)) {
                const modifiers = i.data.data.modifiers;
                for (let m = 0; m < modifiers.length; m++) {
                    const modObj = modifiers[m];
                    const modKey = modObj.type;
                    let namedElement = null
                    if (['focus'].includes(modObj.type)) {
                        namedElement = {
                            // type: modObj.type,
                            name: modObj.conditions.focus,
                            formula: modObj.formula
                        };
                    }
                    if (modObj.isActive) {
                        if (mods.hasOwnProperty(modKey)) {
                            if (namedElement) {
                                mods[modKey].push(namedElement);
                            } else {
                                mods[modKey] += ` + ${modObj.formula}`;
                            }
                        } else {
                            mods[modKey] = namedElement ? [namedElement] : `${modObj.formula}`;
                        }
                    }   
                }
            }
        });
        const actorData = this.data;
        const data = actorData.data;
        data["ownedMods"] = mods;

        // Applying Abilities mods
        const settingAbls = ageSystem.abilities;
        for (const ablKey in settingAbls) {
            if (settingAbls.hasOwnProperty(ablKey)) {
                data.abilities[ablKey].mod = mods[ablKey] ?? 0;
                data.abilities[ablKey].total = data.abilities[ablKey].mod + data.abilities[ablKey].value
            };
        };

        this._preparePostModCharData();

    }

    _preparePostModCharData() {
        const actorData = this.data;
        const data = actorData.data;

        const mods = this.data.data.ownedMods;
        const variables = foundry.utils.deepClone(this.actorRollData());

        // Armor Penalty & Strain
        data.armor.penalty = Math.max(mods?.armorPenalty ?? 0, 0);
        data.armor.strain = Math.max(mods?.armorStrain ?? 0, 0)

        // Actor Damage
        // data.dmgMod = mods?.actorDamage ?? 0;
        data.dmgMod = Dice.prepareFormula(mods?.actorDamage ?? "0", this, null, true);

        // Actor All Tests
        data.testMod = mods?.testMod ?? 0;

        // Actor All Attacks Mod
        data.attackMod = mods?.attackMod ?? 0;

        // Defense
        data.defense.mod = Roll.safeEval(mods?.defense ?? "0", variables);

        // Impact Armor
        data.armor.impact = Roll.safeEval(mods?.impactArmor ?? "0", variables);

        // Ballistic Armor
        // data.armor.ballistic = Roll.safeEval(mods?.ballisticArmor ?? "0", variables);
        data.armor.ballistic = Dice.prepareFormula(mods?.ballisticArmor ?? "0", this, null, true);

        // Toughness
        data.armor.toughness.mod = Roll.safeEval(mods?.toughness ?? "0", variables);

        // Speed
        data.speed.mod = Roll.safeEval(mods?.speed ?? "0", variables);

        // Defend Maneuver (bonus to Defense)
        data.defend.mod = Roll.safeEval(mods?.defendMnv ?? "0", variables);

        // Guard Up Maneuver
        data.guardUp.mod = Roll.safeEval(mods?.guardupMnv ?? "0", variables);

        // All Out Attack
        data.allOutAttack.mod = mods?.allOutAtkMnv ?? 0;

        // Max Health
        data.health.mod = Roll.safeEval(mods?.maxHealth ?? "0", variables);

        // Max Conviction
        data.conviction.mod = Roll.safeEval(mods?.maxConviction ?? "0", variables);

        // Max Power Points
        data.powerPoints.mod = Roll.safeEval(mods?.powerPoints ?? "0", variables);

        // Power Force
        // This bonus must be treated on each Item

        // Aim Maneuver
        data.aim.mod = Roll.safeEval(mods?.aimMnv ?? "0", variables);

       // Calculate total Defense
        data.defense.total = 0;
        if (data.defend.active) {data.defense.total += Number(data.defend.defenseBonus)};
        if (data.guardUp.active) {data.defense.total += Number(data.guardUp.defenseBonus)};
        data.defense.total += (Number(data.abilities.dex.total) + Number(data.defense.base) + Number(data.defense.mod) + Number(data.defense.gameModeBonus));
        if (data.allOutAttack.active) {
            data.defense.total -= Math.abs(Number(data.allOutAttack.defensePenalty));
        };
        if (data.defense.total < 0) {data.defense.total = 0};

        // Calculate toughness
        data.armor.toughness.total = Number(data.abilities.cons.total) + Number(data.armor.toughness.gameModeBonus) + Number(data.armor.toughness.mod);

        // Calculate Speed
        data.speed.total = Number(data.abilities.dex.total) - Math.abs(data.armor.penalty) + Number(data.speed.base) + Number(data.speed.mod)
        
        // Calculate Max Health
        data.health.max = Number(data.health.mod) + Number(data.health.set);

        // Calculate Max Power Points
        data.powerPoints.max = Number(data.powerPoints.mod) + Number(data.powerPoints.set);

        // Calculate Max Conviction
        data.conviction.max = Number(data.conviction.mod) + Number(data.conviction.set);

        // Calculates total Initiative
        data.initiative = data.initiativeMod + data.abilities.dex.total - data.armor.penalty;

        // Calculate resources/currency
        if (data.useCurrency) data.resources.mod = 0;
        data.resources.total = data.resources.base + Number(data.resources.mod);
    };

    _prepareDerivedDataChar() {
    }

    _spaceshipItemModifiers() {
        const actorData = this.data;
        const data = actorData.data;

        // Items With Mod
        const ownedItems = actorData.items.filter(i => i.data.type !== "special" && i.data.type !== "rollable" && i.data.type !== "weapon");
        let bonuses = {};
        ownedItems.map(f => {
            const item = f.data.data;
            const dataType = item.type;
            if (!bonuses[dataType]) {
                bonuses = {
                    ...bonuses,
                    [dataType]: 0
                };
            };
            bonuses[dataType] += item[dataType];
        })

        data.itemMods = bonuses;
    }

    _prepareBaseDataVehicle() {
        const actorData = this.data;
        const data = actorData.data;

        data.defenseTotal = 10;
        let invalidPassengers = [];
        for (let pi = 0; pi < data.passengers.length; pi++) {
            const p = data.passengers[pi];
            if (!game.actors) {
                game.postReadyPrepare.push(this);
            } else {
                const pData = p.isToken ? game.actors.tokens[p.id] : game.actors.get(p.id);
                if (!pData) {
                    invalidPassengers.push(pi);
                } else {
                    p.name = pData.data.name;
                    p.picture = pData.data.token.img;
                };
                if (p.id === data.conductor && pData) {
                    p.isConductor = true;
                    const defenseAbl = pData.data.data.abilities[data.handling.useAbl].total;
                    const defenseFocus = this.checkFocus(data.handling.useFocus);
                    const defenseValue = !defenseFocus?.focusItem ? 0 : defenseFocus.focusItem.data.data.initialValue;
                    data.defenseTotal += defenseAbl + defenseValue;
                } else {
                    p.isConductor = false;
                }
            }
        }
        // Remove passengers whose sheets/tokens are not valid anymore
        for (let ip = 0; ip < invalidPassengers.length; ip++) {
            const i = invalidPassengers[ip];
            data.passengers.splice(i, 1);
        };

        //this.sortPassengers();
        data.pob = data.passengers.length;

    };

    _prepareDerivedDataVehicle() {

    };

    _prepareBaseDataSpaceship() {
        const actorData = this.data;
        const data = actorData.data;
        this.sortPassengers();

        data.pob = data.passengers.length;
        
        for (const loss in data.losses) {
            if (Object.hasOwnProperty.call(data.losses, loss)) {
                const severity = data.losses[loss];
                for (const type in severity) {
                    if (Object.hasOwnProperty.call(severity, type)) {
                        severity[type].maxArray = new Array(severity[type].max);
                        for (let b = 0; b < severity[type].maxArray.length; b++) {
                            severity[type].maxArray[b] = ((severity[type].actual-1) >= b) ? true : false;                    
                        }                        
                    }
                }
                
            }
        };

        // Calculated Total value for various aspects
        const systems = data.systems;
        const nloss = data.losses.normal;

        systems.sensors.loss = -Number(nloss.sensors.actual);
        systems.sensors.total = Number(systems.sensors.base) + Number(systems.sensors.mod) + systems.sensors.loss;

        systems.maneuver.loss = -Number(nloss.maneuverability.actual);
        systems.maneuver.total = Number(systems.maneuver.base) + Number(systems.maneuver.mod) + systems.maneuver.loss;

        systems.command.total = Number(systems.command.base) + Number(systems.command.mod);
        systems.damageControl.total = Number(systems.damageControl.base) + Number(systems.damageControl.mod);

        data.sizeNumeric = Number(data.size);
        data.hull.base = ageSystem.spaceshipHull[data.sizeNumeric - 1];

        data.crew.min = ageSystem.spaceshipCrew[data.sizeNumeric - 1].min
        data.crew.typical = ageSystem.spaceshipCrew[data.sizeNumeric - 1].typ

        data.crewPenalty = this._addCrewPenalty(data.sizeNumeric, data.crew.current, data.crew.min);

        return data
    }

    _addCrewPenalty(size, current, min) {
        if (current >= min) return 0;
        const sizeArray = ageSystem.spaceshipCrew;
        const sizePos = size - 1;
        let steps;
        for (let s = 0; s < sizeArray.length; s++) {
            const minC = sizeArray[s].min; 
            const diff = current - minC;
            if (diff < 0) {
                steps = s;
                break;
            }
        }
        const diff = sizePos - steps + 1;
        const penalty = 2 * diff;
        return -penalty;
    };

    _prepareDerivedDataSpaceship() {
        const actorData = this.data;
        const data = actorData.data;

        data.hull.baseMod = this._addSizeMod(data.sizeNumeric, data.itemMods.hullMod);
        data.hull.total = this._addHullPlatingLoss(data.hull.baseMod, data.itemMods.hullPlating);

        data.systems.sensors.total = this._addSensorBonus(data.systems.sensors.base, data.systems.sensors.mod, data.itemMods.sensorMod);

        // data.juiceMod

    };

    _addSensorBonus(base, mod, bonus) {
        const sensorLoss = -this.data.data.losses.normal.sensors.actual;
        if (!bonus) bonus = 0;
        return base + mod + bonus + sensorLoss;
    }

    _addSizeMod(size, mod) {
        if (!mod) return this.data.data.hull.base;
        let newSize = size + mod;
        if (newSize < 1) newSize = 1;
        if (newSize > ageSystem.spaceshipHull.length) newSize = ageSystem.spaceshipHull.length;
        const newHull = ageSystem.spaceshipHull[newSize - 1];
        return newHull;
    }

    _addHullPlatingLoss(hull, plating) {
        const hullLoss = -this.data.data.losses.normal.hull.actual;
        if (Math.abs(hullLoss) === 0 && !plating) return hull;
        if (!plating) plating = 0;
        const platLoss = hullLoss + Number(plating);
        if (platLoss === 0) return hull;
        if (hull == 1) return platLoss + Number(hull); 
        const modulus = Math.abs(Number(platLoss));
        const newPart = platLoss >= 0 ? `+${modulus}` : `-${modulus}`;
        const newHull = `${hull}${newPart}`;
        return newHull;
    }

    sortWeapon(weapon) {
        if (!weapon) return {};
        let wArray = [];
        for (const w in weapon) {
            if (Object.hasOwnProperty.call(weapon, w)) {
                wArray.push(weapon[w]);
            }
        }
        wArray = wArray.sort(function(a, b) {
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
        const newWpnObj = {};
        for (let w = 0; w < wArray.length; w++) {
            // const element = wArray[w];
            let wKey = String(w);
            while (wKey.length < 4) {
                wKey = "0" + wKey;
            }
            newWpnObj[wKey] = wArray[w];
        }
        return newWpnObj;
    }

    // TODO - testar essa função, que ainda está em desuso
    sortPassengers() {
        const data = this.data.data;
        const passengers = data.passengers;
        let invalidPassengers = [];
        for (let pi = 0; pi < passengers.length; pi++) {
            const p = passengers[pi];
            if (!game.actors) {
                game.postReadyPrepare.push(this);
            } else {
                const pData = p.isToken ? game.actors.tokens[p.id] : game.actors.get(p.id);
                if (!pData) {
                    invalidPassengers.push(pi);
                    // TODO - a partir daqui deve ser feita a avaliação (veículo/espaçonave) para avaliar as funções especiais de cada veículo
                } else {
                    p.name = pData.data.name;
                    p.picture = pData.data.token.img;
                };
                if (p.id === data.conductor && pData) {
                    p.isConductor = true;
                    const defenseAbl = pData.data.data.abilities[data.handling.useAbl].total;
                    const defenseFocus = this.checkFocus(data.handling.useFocus);
                    const defenseValue = !defenseFocus?.focusItem ? 0 : defenseFocus.focusItem.data.data.initialValue;
                    data.defenseTotal += defenseAbl + defenseValue;
                } else {
                    p.isConductor = false;
                }
            }
        }
        // Remove passengers whose sheets/tokens are not valid anymore
        for (let ip = 0; ip < invalidPassengers.length; ip++) {
            const i = invalidPassengers[ip];
            passengers.splice(i, 1);
        };

    };

    _vehicleOperator(operatorData) {
        if (!operatorData) return null;
        let operator;
        if (operatorData.isToken) operator = game.actors.tokens[operatorData.id];
        if (!operatorData.isToken) operator = game.actors.get(operatorData.id);
        if (!operator) {
            const parts = {name: p.name, id: p.id};
            let warning = game.i18n.format("age-system.WARNING.userNotAvailable", parts);
            ui.notifications.warn(warning);
            return null;
        }
        return operator;
    }

    rollVehicleDamage(damageData) {
        const operator = this._vehicleOperator(damageData.operatorData);
        const vehicleUseFocus = this.data.data.handling.useFocus
        const useFocus = operator ? operator.checkFocus(vehicleUseFocus) : null;

        damageData = {
            ...damageData,
            operator,
            useFocus,
            vehicle: this
        };

        Dice.vehicleDamage(damageData);
    };

    checkFocus(namedFocus) {
        if (!namedFocus || namedFocus == "") return {focusName: null, focusItem: null, id: null, value: 0}

        const ownedFoci = this.data.items.filter(a => a.type === "focus");
        const expectedFocus = namedFocus.toLowerCase();
        const validFocus = ownedFoci.filter(c => c.name.toLowerCase() === expectedFocus);
        if (validFocus.length < 1) {
            return {focusName: namedFocus, focusItem: false, id: null, value: 0}
        } else {
            const focusId = validFocus[0].id;
            const focus = this.items.get(focusId);
            return {focusName: namedFocus, focusItem: focus, id: focusId, focusAbl: focus.data.data.useAbl, value: focus.data.data.finalValue}
        };
    }

    async toughnessTest (parts, rollTN, applyInjury = false) {
        parts.push({
            label: game.i18n.localize("age-system.injuryMarks"),
            value: -this.data.data.injury.marks
        });
        const rollData = {
          actor: this,
          event: new MouseEvent('click'),
          rollTN,
          rollType: applyInjury ? ageSystem.ROLL_TYPE.TOUGHNESS_AUTO : ageSystem.ROLL_TYPE.TOUGHNESS,
          moreParts: parts,
          flavor: this.name,
          flavor2: `${game.i18n.localize("age-system.toughnessTest")}`
        };
        const toughTest = await Dice.ageRollCheck(rollData);
        const data = toughTest.data.flags["age-system"].ageroll.rollData
        if (applyInjury && data.isSuccess !== null && !data.isSuccess) await this.applyInjury(data.injuryDegree);
        return toughTest;
    }

    /**
     * Apply a Injury Degree and applicable Injury Marks to the Actor.
     * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
     *
     * @param {string} injuryDegree     The chat entry which contains the roll data
     *
     * @returns {object}                Object with relevant data to identify Actor and new Injury values
     * @returns {false}                 If Injury Alternate Damage is not in use or if Actor is not of applicable type
     */
    async applyInjury (injuryDegree) {
        if (!ageSystem.healthSys.useInjury) return false;
        if (this.type !== 'char') return false;
        if (!['light', 'serious', 'severe'].includes(injuryDegree)) return false;
        // Identify correct path and new amount for that degree
        const updateDegree = `data.injury.degrees.${injuryDegree}`;
        const newDegree = this.data.data.injury.degrees[injuryDegree] + 1;
        // Carries totalInjuries to summary
        const totalInjuries = foundry.utils.deepClone(this.data.data.injury.degrees);
        totalInjuries[injuryDegree] = newDegree;
        // Calculate new marks
        let newMarks = (injuryDegree === 'severe') ? this.data.data.injury.degrees.severeMult : 1;
        newMarks += this.data.data.injury.marks;
        // Update Actor's injuries and marks
        await this.update(
            {
                [updateDegree]: newDegree,
                'data.injury.marks': newMarks
            },
            {
                value: game.i18n.localize(`age-system.${injuryDegree}InjuryInflicted`),
                type: 'injury'
            }
        );
        // Returns a summary object
        return {
            name: this.name,
            img: this.data.token.img,
            degree: injuryDegree,
            totalInjuries,
            newMarks
        }
    }

    /**
     * Heals a number of Injury Marks Character 
     * @param {number} qtd  Quantity of Injury Marks to be healed
     * @returns {boolean}   False if Character type or qtd is invalid, True otherwise
     */
    healMarks (qtd) {
        if (this.type !== 'char') return false
        if (Number.isNaN(Number(qtd))) return false
        qtd = Math.abs(Number(qtd));
        let totalHealed = 0
        const injuries = foundry.utils.deepClone(this.data.data.injury);
        const marks = injuries.marks;
        if (marks === 0) return true

        for (let m = 0; m < qtd; m++) {
            injuries.marks -= 1;
            if (injuries.degrees.severe > 0) {
                totalHealed += 1;
                const expectedMarks = injuries.degrees.light + injuries.degrees.serious + injuries.degrees.severe * injuries.degrees.severeMult;
                if (expectedMarks - (injuries.marks) === injuries.degrees.severeMult) {
                    injuries.degrees.severe -= 1
                }
            } else {
                if (injuries.degrees.serious > 0) {
                    totalHealed += 1;
                    injuries.degrees.serious -= 1;
                } else {
                    if (injuries.degrees.light > 0) {
                        totalHealed += 1;
                        injuries.degrees.light -= 1;
                    }
                }
            }
            if (injuries.marks === 0) break;
        }
        const updateData = {
            "data.injury.marks": injuries.marks,
            "data.injury.degrees.light": injuries.degrees.light,
            "data.injury.degrees.serious": injuries.degrees.serious,
            "data.injury.degrees.severe": injuries.degrees.severe,
        }
        this.update(updateData, {value: totalHealed, type: 'numeric'});
        return true
    }

    // Recalculate Injury Marks based on each Injury Degree and Game Mode (Gritty, Pulp or Cinematic)
    refreshMarks() {
        const data = this.data.data.injury.degrees;
        const marks = data.light + data.serious + data.severe * data.severeMult
        return this.update({"data.injury.marks": marks});
    }

    /**
     * This function applies damage or healing to an Actor (Character or Organization only) and returns a summary with new values
     * @param {number} newValue     Numeric value passed
     * @param {boolean} isHealing   Identify if newValue's modulus will Sum or Subtract from current HP
     * @param {boolean} isNewHP     Check new total Health will replace by newValue's modulus
     * @returns 
     */
    applyHPchange (newValue, {isHealing = false, isNewHP = true} = {}) {
        const actorType = this.type;
        let previousHP = null;
        let updatePath = '';
        let maxHP = Infinity;
        newValue = Math.abs(newValue)
        if (!isNewHP) newValue = isHealing ? newValue : -newValue;
        switch (actorType) {
            case 'char':
                previousHP = this.data.data.health.value;
                maxHP = this.data.data.health.set
                updatePath = 'data.health.value';
                break;
            case 'organization':
                previousHP = this.data.data.combat.stability.value;
                updatePath = 'data.combat.stability.value';
                break;
            default: return false;
        }
        const summary = {
            name: this.name,
            img: this.data.token.img,
            previousHP,
            isHealing
        };

        if (isNewHP) {
            summary.newHP = newValue
        } else {
            if (newValue > 0) {
                const arr = [previousHP + newValue, maxHP];
                summary.newHP = Math.min(...arr);
            }
            if (newValue < 0) {
                const arr = [previousHP - newValue, 0];
                summary.newHP = Math.max(...arr);
            }
        }
        const deltaHP = summary.newHP - summary.previousHP
        this.update({[updatePath]: summary.newHP}, {value: deltaHP, type: 'numeric'});
        return summary
    }

    /**
     * Roll Breather on demand
     * 
     * @param {boolean} direct Ask user to review inputs
     * @param {number} k Constant amount of Health recovered
     * @param {boolean} addLevel Indicate if level is added to the Breather
     * @param {string} abl String containing code for the Ability applicable to Breather
     * @param {number} dice Quantity of D6 rolled for the Breather
     * @param {boolean} autoApply Auto apply recovery after rolling Breather
     * @param {string} rollMode Visivility instruction to chat card with breather
     * @returns 
     */
    async breather(direct = true, {k=ageSystem.breather.k, addLevel=ageSystem.breather.addLevel, abl=ageSystem.breather.abl, autoApply=true, abilities=ageSystem.abilities, rollMode=null}={}) {
        if (this.type !== 'char') return false;
        const data = {
            k,
            addLevel,
            abl,
            autoApply,
            abilities,
        };

        const options = direct ? data : await this.breatherSettings(data);
        if (options.cancelled) return false;

        let formula = `${options.k}`;
        if (options.abl !== 'no-abl') formula += ` + ${Math.max(this.data.data.abilities[options.abl].total, 0)}`;
        if (options.addLevel) formula += ageSystem.healthSys.useInjury ? ` + ${Math.floor(this.data.data.level/4)}` : ` + ${this.data.data.level}`;
        let roll = await new Roll(formula).evaluate({async: true});
		roll.toMessage({flavor: `${this.name} | ${game.i18n.localize("age-system.breather")}`}, {rollMode});
        if (options.autoApply) return ageSystem.healthSys.useInjury ? this.healMarks(roll.total) : this.applyHPchange(roll.total, {isHealing: true, isNewHP: false});
    }

    async breatherSettings(data) {
        const template = "/systems/age-system/templates/rolls/breather-settings.hbs";
        const html = await renderTemplate(template, data);
        return new Promise(resolve => {
            const data = {
                title: game.i18n.localize("age-system.breather"),
                content: html,
                buttons: {
                    normal: {
                        icon: `<i class="fa fa-check" aria-hidden="true"></i>`,
                        callback: html => {
                            const fd = new FormDataExtended(html[0].querySelector("form"));
                            resolve(fd.toObject())
                        }
                    },
                    cancel: {
                        icon: `<i class="fa fa-times" aria-hidden="true"></i>`,
                        callback: html => resolve({cancelled: true}),
                    }
                },
                default: "normal",
                close: () => resolve({cancelled: true}),
            }
            new Dialog(data, null).render(true);
        });
    }

    /** @inheritdoc */
    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);
        this._displayScrollingText(options.value, options.type);
    }

    _displayScrollingText(value, type) {
        if ( !value ) return;
        if (type !== 'injury') value = value.signedString();

        let color;
        switch (type) {
            case 'injury':
                color = 'damage'
                break;
            case 'numeric':
                color = value < 0 ? "damage" : "healing";
                break;
            case 'power':
                color = "power"
            default:
                color = 'power'
                break;
        }

        const tokens = this.isToken ? [this.token?.object] : this.getActiveTokens(true);
        for ( let t of tokens ) {
            if (!t?.hud?.createScrollingText) continue;
            t.hud.createScrollingText(value, {
                anchor: CONST.TEXT_ANCHOR_POINTS.TOP,
                fontSize: 30,
                fill: ageSystem.tokenTextColors[color],
                stroke: 0x000000,
                strokeThickness: 4,
                jitter: 0.25
            });   
        }
    }

    /**
     * Check if there is an Active Effect for this Condition and take action: create if none, delete all if detected.
     * @param {string} condId Condition unique Core ID
     * @returns 
     */
    async handleConditions(condId) {
        if (["spaceship", "vehicle"].includes(this.type)) return null;
        const effectsOn = this.effects.filter(e => e.data.flags?.["age-system"]?.isCondition && e.data.flags?.core?.statusId === condId);
        
        if (effectsOn.length < 1) {
            // If there is no Effect on, create one
            const newEffect = foundry.utils.deepClone(CONFIG.statusEffects.filter(e => e.id === condId)[0]);
            newEffect["flags.core.statusId"] = newEffect.id;
            if (newEffect?.flags?.["age-system"].conditionType !== 'custom') newEffect.label = game.i18n.localize(newEffect.label);
            delete newEffect.id;
            await this.createEmbeddedDocuments("ActiveEffect", [newEffect]);
        } else {
            // If there are Effects, delete everything
            const toDelete = [];
            for (let c = 0; c < effectsOn.length; c++) {
                const effect = effectsOn[c];
                toDelete.push(effect.id);
            }
            this.deleteEmbeddedDocuments("ActiveEffect", toDelete);
        }
    }

    async openSheet(newSheet) {
        const sheet = this.sheet
        await sheet.close()
        this._sheet = null
        delete this.apps[sheet.appId]
        await this.setFlag('core', 'sheetClass', newSheet)
        this.sheet.render(true)
    }

    // Data to add Character ref. into rolls
    actorRollData() {
        if (!this.data) return null;
        if (this.type !== 'char') return null;
        const data = this.data.data;
        const charData = {
            acc: data.abilities.acc.total ?? 0,
            comm: data.abilities.comm.total ?? 0,
            dex: data.abilities.dex.total ?? 0,
            fight: data.abilities.fight.total  ?? 0,
            int: data.abilities.int.total ?? 0,
            per: data.abilities.per.total ?? 0,
            str: data.abilities.str.total ?? 0,
            will: data.abilities.will.total ?? 0,
            magic: data.abilities.magic.total ?? 0,
            cunn: data.abilities.cunn.total ?? 0,
            level: data.level ?? 0
        }
        return charData;
    };
};