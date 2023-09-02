import { ageSystem } from "./config.js";
import * as Dice from "./dice.js";

export class ageSystemActor extends Actor {

    /** @override */
    prepareData() {
        // this.reset();
        this.prepareBaseData();
        this.prepareEmbeddedDocuments();
        this.prepareDerivedData();
        // Sorting Items for final data preparation
        const items = this.items;
        if (this.type === 'char') {
            // First prepare Focus
            items.forEach(i => {
                if (i.type === "focus") {
                    i.prepareData();
                    if(i.sheet?.rendered) i.sheet.render(false);
                }
            })
            // Then prepare other item types which require further prep
            items.forEach(i => {
                if (["weapon", "power"].includes(i.type)) {
                    i.prepareData()
                    if(i.sheet?.rendered) i.sheet.render(false);
                }
            })
            
            // Calculate Initiative based on Focus (if set on System Settings)
            const initiativeFocus = game.settings.get("age-system", "initiativeFocus");
            if (initiativeFocus) {
                const init = this.checkFocus(initiativeFocus);
                this.system.initiative += init.value;
            }
        }
    }

    /** @override */
    async _preCreate(data, options, userId) {
        await super._preCreate(data, options, userId);
        const updates = {};
        if (!data.img || data.img === CONST.DEFAULT_TOKEN) updates.img = ageSystem.actorIcons[this.type];
        this.updateSource(updates);        
    }

    prepareBaseData() {
        const actorData = this;
        const data = actorData.system;

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
        super.prepareEmbeddedDocuments();
        
        // Apply Item Modifiers to Actor before applying Active Effects!
        this.applyItemModifiers();
    }

    /**
    * Apply any transformations to the Actor data which are caused by ActiveEffects.
    */
    applyActiveEffects() {
        const overrides = {};

        // Organize non-disabled effects by their application priority
        const changes = this.effects.reduce((changes, e) => {
        if ( e.disabled || e.isSuppressed ) return changes;
        return changes.concat(e.changes.map(c => {
            c = foundry.utils.duplicate(c);
            c.effect = e;
            c.priority = c.priority ?? (c.mode * 10);
            return c;
        }));
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Identify Active Effects to be applied after DerivedData
        const delayedOverrides = [];
        for (let i = changes.length-1; i >= 0; i--) {
            const c = changes[i];
            if ([...ageSystem.actorDerivedDataKey, ...ageSystem.charAblKey].includes(c.key)) {
                delayedOverrides.push(c);
                changes.splice(i);
            }
        }
        this.delayedOverrides = delayedOverrides;

        // Apply all changes
        for ( let change of changes ) {
            if ( !change.key ) continue;
            const changes = change.effect.apply(this, change);
            Object.assign(overrides, changes);
        }

        // Expand the set of final overrides
        this.overrides = foundry.utils.expandObject(overrides);
        // if (this.delayedOverrides) this.overrides = foundry.utils.mergeObject(this.overrides.dOverrides);
    }

    _applyDelayedActiveEffects(paths) {
        const dOverrides = {}
        const changes = foundry.utils.deepClone(this.delayedOverrides)
        // Apply all changes
        for ( let change of changes ) {
            if ( !change.key || !paths.includes(change.key)) continue;
            const changes = change.effect.apply(this, change);
            Object.assign(dOverrides, changes);
        }
    
        // Expand the set of final overrides
        const over = foundry.utils.expandObject(dOverrides);
        if (this.overrides) this.overrides = foundry.utils.mergeObject(this.overrides, over)
        else this.overrides = over;
    }

    prepareDerivedData() {
        const actorData = this;
        const data = actorData.system;

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
        const actorData = this;
        const data = actorData.system;
        
        // Check if Conviction is in use
        data.useConviction = game.settings.get("age-system", "useConviction");

        // Check if Toughness is in use
        data.useToughness = game.settings.get("age-system", "useToughness");

        // Check if Fatigue is in use
        data.useFatigue = game.settings.get("age-system", "useFatigue");

        // Check if Power Points is in use
        data.usePowerPoints = game.settings.get("age-system", "usePowerPoints");

        /**************************/
        /**    Configure MODE    **/
        /**************************/
        if (this.type === 'char') this._configureCharGameMode();

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

    _configureCharGameMode() {
        const actorData = this;
        const data = actorData.system;
        const gmode = data.gameMode;
        
        // Check Game Mode and select correct Health / Defense / Toughness to use
        if (!gmode.override) gmode.selected = ageSystem.healthSys.mode;
        const m = gmode.selected
        
        data.health.set = data.health.set ?? gmode.specs[m].health;
        data.defense.gameModeBonus = gmode.specs[m].defense;
        data.armor.toughness.gameModeBonus = gmode.specs[m].toughness;
    }

    applyItemModifiers() {
        const type = this.type;

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
        // Create Actor data with Modifiers from all Active/Equiped Items
        const mods = {};
        this.items.forEach(i => {
            const iMods = i.system.modifiersByType;
            const active = i.system.activate || i.system.equiped;
            if (iMods !== {} && active) {
                for (const k in iMods) {
                    if (Object.hasOwnProperty.call(iMods, k)) {
                        if (mods[k]) {
                            mods[k].parts = [...mods[k].parts, ...iMods[k]];
                        } else {
                            mods[k] = {parts: iMods[k]};
                        }
                    }
                }
            }
        });

        // Calculate total Formula for Each Modifier
        for (const mtype in mods) {
            if (Object.hasOwnProperty.call(mods, mtype)) {
                const mPack = mods[mtype];
                mPack.totalFormula = "";
                mPack.badMods = [];
                for (let i = 0; i < mPack.parts.length; i++) {
                    const p = mPack.parts[i];
                    if (p.valid && p.isActive) {
                        if (mPack.totalFormula !== "") mPack.totalFormula += " + ";
                        mPack.totalFormula += `${p.formula}`;
                    } else {
                        mPack.badMods.push(i)
                    };
                    if (i === mPack.parts.length - 1) {
                        mPack.formParts = Dice.resumeFormula(mPack.totalFormula, foundry.utils.deepClone(this.actorRollData()));
                    }
                }
            }
        }

        const actorData = this;
        const data = actorData.system;
        data["ownedMods"] = mods;

     
    }

    _prepareDerivedDataChar() {
        // Calculate Abilities
        const actorData = this;
        const data = actorData.system;
        const mods = data.ownedMods;
        
        // Applying Abilities mods
        const settingAbls = ageSystem.abilities;
        for (const ablKey in settingAbls) {
            if (settingAbls.hasOwnProperty(ablKey)) {
                data.abilities[ablKey].mod = (mods[ablKey]?.formParts?.detValue ?? 0) + (data.abilities[ablKey].mod ?? 0);
                data.abilities[ablKey].total = data.abilities[ablKey].mod + data.abilities[ablKey].value;
                data.abilities[ablKey].testMod = (mods[`${ablKey}Test`]?.formParts?.detValue ?? 0) + (data.abilities[ablKey].testMod ?? 0);
            };
        };

        // Apply Abilities Active Effects
        this._applyDelayedActiveEffects(ageSystem.charAblKey)
        
        // Calculate derived data
        this._preparePostModCharData();
        
        // Apply delayed Active Effects on other derived data
        this._applyDelayedActiveEffects(ageSystem.actorDerivedDataKey);
    }

    _preparePostModCharData() {
        const actorData = this;
        const data = actorData.system;
        const mods = data.ownedMods;

        // Recalculate all Mods to ensure contribution from Abilities are updated
        const recalcMod = data.ownedMods;
        for (const k in recalcMod) {
            if (Object.hasOwnProperty.call(recalcMod, k)) {
                const mGroup = recalcMod[k];
                mGroup.formParts = Dice.resumeFormula(mGroup.totalFormula, foundry.utils.deepClone(this.actorRollData()));
            }
        }        

        // Armor Penalty & Strain
        data.armor.penalty = Math.max(mods?.armorPenalty?.formParts?.detValue ?? 0, 0);
        data.armor.strain = Math.max(mods?.armorStrain?.formParts?.detValue ?? 0, 0);

        // All damage delt by Actor
        data.dmgMod = mods?.actorDamage?.totalFormula ?? (data.dmgMod ?? "0");

        // Actor All Tests
        const testModFormula = mods?.testMod?.totalFormula;
        data.testMod = testModFormula ? Dice.resumeFormula(mods?.testMod?.totalFormula, this.actorRollData()).detValue : 0;

        // Actor All Attacks Mod
        const attkModFormula = mods?.attackMod?.totalFormula;
        data.attackMod = attkModFormula ? Dice.resumeFormula(mods?.attackMod?.totalFormula, this.actorRollData()).detValue : 0;

        // Defense
        data.defense.mod = mods?.defense?.formParts?.detValue ?? 0;

        // Impact Armor
        data.armor.impact = (mods?.impactArmor?.formParts?.detValue ?? 0) + (data.armor.impact ?? 0);

        // Ballistic Armor
        data.armor.ballistic = (mods?.ballisticArmor?.formParts?.detValue ?? 0) + (data.armor.ballistic ?? 0);

        // Toughness
        data.armor.toughness.mod = mods?.toughness?.formParts?.detValue ?? 0;

        // Speed
        data.speed.mod = mods?.speed?.formParts?.detValue ?? 0;

        // Defend Maneuver (bonus to Defense)
        data.defend.mod = mods?.defendMnv?.formParts?.detValue ?? 0;

        // Guard Up Maneuver
        data.guardUp.mod = mods?.guardupMnv?.formParts?.detValue ?? 0;

        // All Out Attack
        // data.allOutAttack.mod = mods?.allOutAtkMnv?.formParts?.detValue ?? 0;
        // data.allOutAttack.dmgBonus = mods?.allOutAtkMnv?.formParts?.detValue ?? 0;

        // Max Health
        data.health.mod = mods?.maxHealth?.formParts?.detValue ?? 0;

        // Max Conviction
        data.conviction.mod = mods?.maxConviction?.formParts?.detValue ?? 0;

        // Max Power Points
        data.powerPoints.mod = mods?.maxPowerPoints?.formParts?.detValue ?? 0;

        // Aim Maneuver
        data.aim.mod = mods?.aimMnv?.formParts?.detValue ?? 0;

        // Power Force
        // This bonus must be treated on each Item

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

    _spaceshipItemModifiers() {
        const actorData = this;
        const data = actorData.system;

        // Items With Mod
        const ownedItems = actorData.items.filter(i => !['special', 'rollable', 'weapon'].includes(i.system.type));
        let bonuses = {};
        ownedItems.map(f => {
            const item = f.system;
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
        const actorData = this;
        const data = actorData.system;

        data.defenseTotal = 10;
        this.sortPassengers();
        data.pob = data.passengers.length;

    };

    _prepareDerivedDataVehicle() {

    };

    _prepareBaseDataSpaceship() {
        const actorData = this;
        const data = actorData.system;
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
        const actorData = this;
        const data = actorData.system;

        data.hull.baseMod = this._addSizeMod(data.sizeNumeric, data.itemMods.hullMod);
        data.hull.total = this._addHullPlatingLoss(data.hull.baseMod, data.itemMods.hullPlating);
        data.systems.sensors.total = this._addSensorBonus(data.systems.sensors.base, data.systems.sensors.mod, data.itemMods?.sensorMod);
    };

    _addSensorBonus(base, mod, bonus) {
        const sensorLoss = -this.system.losses.normal.sensors.actual;
        if (!bonus) bonus = 0;
        return base + mod + bonus + sensorLoss;
    }

    _addSizeMod(size, mod) {
        if (!mod) return this.system.hull.base;
        let newSize = size + mod;
        if (newSize < 1) newSize = 1;
        if (newSize > ageSystem.spaceshipHull.length) newSize = ageSystem.spaceshipHull.length;
        const newHull = ageSystem.spaceshipHull[newSize - 1];
        return newHull;
    }

    _addHullPlatingLoss(hull, plating) {
        const hullLoss = -this.system.losses.normal.hull.actual;
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

    // Função em uso para Spaceship
    sortPassengers() {
        const data = this.system;
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
                } else {
                    p.name = pData.name;
                    p.picture = pData.prototypeToken.texture.src;
                };
                // Prepare Vehicle derived data
                if (this.type === 'vehicle') {
                    if (p.id === data.conductor && pData) {
                        p.isConductor = true;
                        const defenseAbl = pData.system.abilities[data.handling.useAbl].total;
                        const defenseFocus = pData.checkFocus(data.handling.useFocus);
                        const defenseValue = !defenseFocus?.focusItem ? 0 : defenseFocus.focusItem.system.initialValue;
                        data.defenseTotal += defenseAbl + defenseValue;
                    } else {
                        p.isConductor = false;
                    }
                };
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
        const vehicleUseFocus = this.system.handling.useFocus
        const useFocus = operator ? operator.checkFocus(vehicleUseFocus) : null;

        damageData = {
            ...damageData,
            operator,
            useFocus,
            vehicle: this
        };

        Dice.vehicleDamage(damageData);
    };

    /**
     * Retrieve object with Focus details if Actor owns focus matching the name informed
     * @param {string} namedFocus String with Focus name to be checked in actor inventory
     * @returns Object with focusName {string}, focusItem {ageSystemItem}, id {string} and value {number}.
     */
    checkFocus(namedFocus) {
        if (!namedFocus || namedFocus == "") return {focusName: null, focusItem: null, id: null, value: 0}

        const ownedFoci = this.items?.filter(a => a.type === "focus");
        const expectedFocus = namedFocus.toLowerCase();
        const validFocus = ownedFoci?.filter(c => c.name.toLowerCase() === expectedFocus);
        if (validFocus?.length > 0) {
            const focusId = validFocus[0].id;
            const focus = this.items.get(focusId);
            return {focusName: namedFocus, focusItem: focus, id: focusId, focusAbl: focus.system.useAbl, value: focus.system.finalValue}
        } else {
            return {focusName: namedFocus, focusItem: false, id: null, value: 0}
        }
    }

    async toughnessTest (parts, rollTN, applyInjury = false) {
        parts.push({
            label: game.i18n.localize("age-system.injuryMarks"),
            value: -this.system.injury.marks
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
     * @param {string} injuryDegree     The chat entry which contains the roll data
     * @returns {object}                Object with relevant data to identify Actor and new Injury values
     * @returns {false}                 If Injury Alternate Damage is not in use or if Actor is not of applicable type
     */
    async applyInjury (injuryDegree) {
        if (!ageSystem.healthSys.useInjury) return false;
        if (this.type !== 'char') return false;
        if (!['light', 'serious', 'severe'].includes(injuryDegree)) return false;
        // Identify correct path and new amount for that degree
        const updateDegree = `system.injury.degrees.${injuryDegree}`;
        const newDegree = this.system.injury.degrees[injuryDegree] + 1;
        // Carries totalInjuries to summary
        const totalInjuries = foundry.utils.deepClone(this.system.injury.degrees);
        totalInjuries[injuryDegree] = newDegree;
        // Calculate new marks
        let newMarks = (injuryDegree === 'severe') ? this.system.injury.degrees.severeMult : 1;
        newMarks += this.system.injury.marks;
        // Update Actor's injuries and marks
        await this.update(
            {
                [updateDegree]: newDegree,
                'system.injury.marks': newMarks
            },
            {
                diffHP: {
                    value: game.i18n.localize(`age-system.${injuryDegree}InjuryInflicted`),
                    type: 'injury'
                }
            }
        );
        // Returns a summary object
        return {
            name: this.name,
            img: this.token.img,
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
        const injuries = foundry.utils.deepClone(this.system.injury);
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
            "system.injury.marks": injuries.marks,
            "system.injury.degrees.light": injuries.degrees.light,
            "system.injury.degrees.serious": injuries.degrees.serious,
            "system.injury.degrees.severe": injuries.degrees.severe,
        }
        this.update(updateData, {diffHP: {
            value: totalHealed,
            type: 'numeric'
        }});
        return true
    }

    // Recalculate Injury Marks based on each Injury Degree and Game Mode (Gritty, Pulp or Cinematic)
    refreshMarks() {
        const data = this.system.injury.degrees;
        const marks = data.light + data.serious + data.severe * data.severeMult
        return this.update({"system.injury.marks": marks});
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
        const charData = this.system;
        let previousHP = null;
        let updatePath = '';
        let maxHP = Infinity;
        newValue = Math.abs(newValue)
        if (!isNewHP) newValue = isHealing ? newValue : -newValue;
        switch (actorType) {
            case 'char':
                previousHP = charData.health.value;
                maxHP = charData.health.max
                updatePath = 'system.health.value';
                break;
            case 'organization':
                previousHP = charData.combat.stability.value;
                updatePath = 'system.combat.stability.value';
                break;
            default: return false;
        }
        const summary = {
            name: this.name,
            img: this.isToken ? this.parent.texture.src : this.prototypeToken.texture.src,
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
        this.update({[updatePath]: summary.newHP}, {diffHP: {
            value: deltaHP,
            type: 'numeric'
        }});
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
        const charData = this.system;
        if (options.abl !== 'no-abl') formula += ` + ${Math.max(charData.abilities[options.abl].total, 0)}`;
        if (options.addLevel) formula += ageSystem.healthSys.useInjury ? ` + ${Math.floor(charData.level/4)}` : ` + ${charData.level}`;
        let roll = await new Roll(formula, this.actorRollData()).evaluate({async: true});
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
                    cancel: {
                        icon: `<i class="fa fa-times" aria-hidden="true"></i>`,
                        label: game.i18n.localize("age-system.cancel"),
                        callback: html => resolve({cancelled: true}),
                    },
                    normal: {
                        icon: `<i class="fa fa-check" aria-hidden="true"></i>`,
                        label: game.i18n.localize("age-system.confirm"),
                        callback: html => {
                            const fd = new FormDataExtended(html[0].querySelector("form"));
                            resolve(fd.object)
                        }
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
        if (options.diffHP) this._displayScrollingText(options.diffHP);
    }

    _displayScrollingText(diffHP) {
        let value = diffHP.value;
        const type = diffHP.type;
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
            if (t.visible || t.renderable) {
                if (!t.isOwner) value = "???"; // If player isn't token Onwer, display question marks instead of value
                canvas.interface.createScrollingText(t.center, value, {
                    anchor: CONST.TEXT_ANCHOR_POINTS.TOP,
                    distance: 2*t.h,
                    fontSize: 30,
                    fill: ageSystem.tokenTextColors[color],
                    stroke: 0x000000,
                    strokeThickness: 4,
                    jitter: 0.25
                });
            }
        }
    }

    /**
     * Check if there is an Active Effect for this Condition and take action: create if none, delete all if detected.
     * @param {string} condId Condition unique Core ID
     * @returns 
     */
    async handleConditions(condId) {
        if (["spaceship", "vehicle"].includes(this.type)) return null;
        const effectsOn = this.effects.filter(e => e.flags?.["age-system"]?.isCondition && e.statuses.has(condId));
        
        if (effectsOn.length < 1) {
            // If there is no Effect on, create one
            const newEffect = foundry.utils.deepClone(CONFIG.statusEffects.filter(e => e.id === condId)[0]);
            newEffect.statuses = [newEffect.id];
            if (newEffect?.flags?.["age-system"].conditionType !== 'custom') newEffect.name = game.i18n.localize(newEffect.name);
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
        if (!this) return null;
        if (this.type !== 'char') return null;
        const data = this.system;
        const charData = {
            acc: data.abilities.acc.total ?? 0,
            comm: data.abilities.comm.total ?? 0,
            cons: data.abilities.cons.total ?? 0,
            dex: data.abilities.dex.total ?? 0,
            fight: data.abilities.fight.total ?? 0,
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