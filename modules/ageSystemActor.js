import { ageSystem } from "./config.js";
import * as Dice from "./dice.js";


export class ageSystemActor extends Actor {

    /** @override */
    prepareData() {
        super.prepareData();
        // Sorting Items for final data preparation
        const items = this.items;
        // First prepare Focus
        if (this.data.type === 'char') {
            items.forEach(i => {
                if (i.data.type === "focus") i.prepareData()
            })
            // Then prepare other item types which require further prep
            items.forEach(i => {
                if (["weapon", "power"].includes(i.data.type)) i.prepareData()
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
        
        if (this.data.img == CONST.DEFAULT_TOKEN) this.data.img = CONFIG.ageSystem.actorIcons[actorData.type];

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
    prepareEmbeddedEntities() {
        const embeddedTypes = this.constructor.metadata.embedded || {};
        for ( let cls of Object.values(embeddedTypes) ) {
            const collection = cls.metadata.collection;
            for ( let e of this[collection] ) {
            e.prepareData();
            }
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

    // Attempt to register Compact shee to GM Screen, but not successful... :-(
        
    // _onCreate(data, options, userId) {
    //     super._onCreate(data, options, userId);
    //     if (data.type === "char" && game.user.id === userId) {
    //         const gmScreenFlag = {gmScreenSheetClass: `age-system.ageSystemSheetCharStatBlock`};
    //         this.data.flags = {
    //             ...this.data.flgas,
    //             "gm-screen": gmScreenFlag
    //         };
    //         this._sheet.object.data.flags = {
    //             ...this._sheet.object.data.flags,
    //             "gm-screen": gmScreenFlag
    //         }
    //     }
    // }

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
        data.fatigue.status = "";
        data.fatigue.value = Math.abs(data.fatigue.entered);
        if (data.fatigue.value > data.fatigue.max) {data.fatigue.value = data.fatigue.max};
        if (data.fatigue.value < 0) {data.fatigue.value = 0};
        switch (data.fatigue.value) {
            case 0:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.noFatigue);
            break;
            case 1:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.winded);
            break;
            case 2:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.fatigued);
            break;
            case 3:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.exhausted);
            break;
            case 4:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.dying);
            break;            
                                            
            default:
                break;
        };
        
    };

    applyItemModifiers() {
        const type = this.data.type;

        switch (type) {
            case "char": return this._charItemModifiers();
            case "spaceship": return this._spaceshipItemModifiers();
            case "vehicle": return;
        }
    }

    _charItemModifiers() {
        const mods = {};
        this.items.forEach(i => {
            if (i.data.data.itemMods && (i.data.data.equiped || i.data.data.activate)) {
                const itemMod = i.data.data.itemMods;
                for (const modKey in itemMod) {
                    if (Object.hasOwnProperty.call(itemMod, modKey)) {
                        const modObj = itemMod[modKey];
                        const focusElement = modKey === "focus" ? {name: modObj.name, value: modObj.value} : null;
                        if (modObj.selected && modObj.isActive) {
                            if (mods.hasOwnProperty(modKey)) {
                                if (focusElement) {
                                    mods[modKey].push(focusElement);
                                } else {
                                    mods[modKey] += modObj.value;
                                }
                            } else {
                                mods[modKey] = focusElement ? [focusElement] : modObj.value;
                            }
                        }
                    }
                }
            }
        });
        this.data.data["ownedMods"] = mods;

        // Applying modifiers to Actor data
        const actorData = this.data;
        const data = actorData.data

        // Armor Penalty & Strain
        data.armor.penalty = Math.max(mods.armorPenalty ?? 0, 0);
        data.armor.strain = Math.max(mods.armorStrain ?? 0, 0)

        // Actor Damage
        data.dmgMod = mods.actorDamage ?? 0;

        // Actor All Tests
        data.testMod = mods.testMod ?? 0;

        // Actor All Attacks Mod
        data.attackMod = mods.attackMod ?? 0;

        // Defense
        data.defense.mod = mods.defense ?? 0;

        // Impact Armor
        data.armor.impact = mods.impactArmor ?? 0;

        // Ballistic Armor
        data.armor.ballistic = mods.ballisticArmor ?? 0;

        // Toughness
        data.armor.toughness.mod = mods.toughness ?? 0;

        // Speed
        data.speed.mod = mods.speed ?? 0;

        // Defend Maneuver (bonus to Defense)
        data.defend.mod = mods.defendMnv ?? 0;

        // Guard Up Maneuver
        data.guardUp.mod = mods.guardupMnv ?? 0;

        // All Out Attack
        data.allOutAttack.mod = mods.allOutAtkMnv ?? 0;

        // Max Health
        data.health.mod = mods.maxHealth ?? 0;

        // Max Conviction
        data.conviction.mod = mods.maxConviction ?? 0;

        // Max Power Points
        data.powerPoints.mod = mods.maxPowerPoints ?? 0;

        // Power Force
        // This bonus must be treated on each Item

        // Aim Maneuver
        data.aim.mod = mods.aimMnv ?? 0;

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
        if (data.useCurrency) {
            data.resources.mod = 0;
        };
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
        const   newWpnObj = {};
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

    handleConditions(condId, isChecked = null) {
        if (["spaceship", "vehicle"].includes(this.type)) return null;
        if (isChecked === null) isChecked = !this.data.data.conditions[condId];
        const condEffects = this.effects.filter(c => c.data.flags?.["age-system"]?.type === "conditions" && c.data.flags?.["age-system"]?.name === condId);
        // Condition not checked, and no related Effect is on - do nothing
        if (!isChecked && condEffects.length < 1) return;
        // Condition is checked and there is related Effect - do nothing
        if (isChecked && condEffects.length === 1) return;
        // Condition is not checked and there 1+ related Effects - delete everyting
        if (!isChecked && condEffects.length > 0) {
            for (let c = 0; c < condEffects.length; c++) {
                const effect = condEffects[c];
                const id = effect.data._id;
                this.effects.get(id).delete();
            }
            return
        }
        // Condition is checked and there is no related Effect - create new Active Effect
        if (isChecked && condEffects.length < 1) {
            const newEffect = CONFIG.statusEffects.filter(e => e.flags?.["age-system"]?.name === condId)[0];
            newEffect["flags.core.statusId"] = newEffect.id;
            return this.createEmbeddedDocuments("ActiveEffect", [newEffect]);
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
};