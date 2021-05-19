import { ageSystem } from "./config.js";
import * as Dice from "./dice.js";


export class ageSystemActor extends Actor {

    /** @override */
    prepareData() {
        super.prepareData();

        /*Add post data preparation mods here*/
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

        this.applyActiveEffects();
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
     
        data.ownedBonus = this.ownedItemsBonus();
        const bonuses = data.ownedBonus;

        /*--- Conditions in Use ------------------------------*/
        data.useConditions =  game.settings.get("age-system", "useConditions");
        /*----------------------------------------------------*/

        /*--- Add bonuses to Abilities -----------------------*/
        // Also create abl.total parameters
        this.setAbilitiesWithMod(data, actorData);
        /*----------------------------------------------------*/

        /*--- Calculate Armor Penalty ------------------------*/
        if (bonuses != null && bonuses.armorPenalty) {
            data.armor.penalty = Math.abs(Number(bonuses.armorPenalty.totalMod));
        } else {
            data.armor.penalty = 0;
        };
        /*----------------------------------------------------*/

        /*--- Calculate Impact Armor -------------------------*/
        if (bonuses != null && bonuses.impactArmor) {
            data.armor.impact = Number(bonuses.impactArmor.totalMod);
        } else {
            data.armor.impact = 0;
        };
        /*----------------------------------------------------*/

        /*--- Calculate Ballistic Armor -------------------------*/
        if (bonuses != null && bonuses.ballisticArmor) {
            data.armor.ballistic = Number(bonuses.ballisticArmor.totalMod);
        } else {
            data.armor.ballistic = 0;
        };
        /*----------------------------------------------------*/

        /*--- Calculate total Defense ------------------------*/
        data.defense.total = 0;
        if (data.defend.active) {data.defense.total += Number(data.defend.defenseBonus)};
        if (data.guardUp.active) {data.defense.total += Number(data.guardUp.defenseBonus)};
        
        // Add Defense Bonus if any
        if (bonuses != null && bonuses.defense) {data.defense.mod = bonuses.defense.totalMod}
        
        data.defense.total += (Number(data.abilities.dex.total) - Math.abs(Number(data.armor.penalty)) + Number(data.defense.base) + Number(data.defense.mod) + Number(data.defense.gameModeBonus));
        if (data.allOutAttack.active) {
            data.defense.total -= Math.abs(Number(data.allOutAttack.defensePenalty));
        };
        if (data.defense.total < 0) {data.defense.total = 0};
        /*----------------------------------------------------*/

        /*--- Calculate toughness ----------------------------*/
        // Identify Tougness bonus if any
        if (bonuses != null && bonuses.toughness) {
            data.armor.toughness.mod = bonuses.toughness.totalMod;
        } else {
            data.armor.toughness.mod = 0;
        };
        data.armor.toughness.total = Number(data.abilities.cons.total) + Number(data.armor.toughness.gameModeBonus) + Number(data.armor.toughness.mod);
        /*----------------------------------------------------*/

        /*--- Calculate Speed --------------------------------*/
        if (bonuses != null && bonuses.speed) {
            data.speed.mod = Number(bonuses.speed.totalMod);
        } else {
            data.speed.mod = 0;
        };
        data.speed.total =  Number(data.abilities.dex.total) - Math.abs(data.armor.penalty) + Number(data.speed.base) + Number(data.speed.mod)
        
        /*--- Calculate Max Health ---------------------------*/
        if (bonuses != null && bonuses.maxHealth) {
            data.health.mod = Number(bonuses.maxHealth.totalMod);
        } else {
            data.health.mod = 0;
        };
        data.health.max = Number(data.health.mod) + Number(data.health.set);
        /*----------------------------------------------------*/

        /*--- Calculate Max Power Points ---------------------*/
        if (bonuses != null && bonuses.maxPowerPoints) {
            data.powerPoints.mod = Number(bonuses.maxPowerPoints.totalMod);
        } else {
            data.powerPoints.mod = 0;
        };
        data.powerPoints.max = Number(data.powerPoints.mod) + Number(data.powerPoints.set);
        /*---------------------------------------------------*/

        /*--- Calculate Max Conviction ----------------------*/
        if (bonuses != null && bonuses.maxConviction) {
            data.conviction.mod = Number(bonuses.maxConviction.totalMod);
        } else {
            data.conviction.mod = 0;
        };
        data.conviction.max = Number(data.conviction.mod) + Number(data.conviction.set);
        /*---------------------------------------------------*/

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

    _prepareDerivedDataChar() {
        const actorData = this.data;
        const data = actorData.data;

        // Calculates total Initiative
        data.initiative = data.initiativeMod + data.abilities.dex.total - data.armor.penalty;

        // Calculate resources/currency
        if (data.useCurrency) {
            data.resources.mod = 0;
        };
        data.resources.total = data.resources.base + Number(data.resources.mod);
    };

    _prepareDerivedDataVehicle() {

    };

    _prepareDerivedDataSpaceship() {
        const actorData = this.data;
        const data = actorData.data;

        // Items With Mod
        const ownedItems = actorData.items.filter(i => i.data.type !== "special" && i.data.type !== "rollable" && i.data.type !== "weapon");
        let bonuses = {};
        for (const feature in ownedItems) {
            if (Object.hasOwnProperty.call(ownedItems, feature)) {
                const item = ownedItems[feature].data;
                const dataType = item.type;
                if (!bonuses[dataType]) {
                    bonuses = {
                        ...bonuses,
                        [dataType]: 0
                    };
                };
                bonuses[dataType] += item[dataType];                
            }
        }

        data.hull.baseMod = this._addSizeMod(data.sizeNumeric, bonuses.hullMod);
        data.hull.total = this._addHullPlatingLoss(data.hull.baseMod, bonuses.hullPlating);

        data.systems.sensors.total = this._addSensorBonus(data.systems.sensors.base, data.systems.sensors.mod, bonuses.sensorMod);

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

    setAbilitiesWithMod(data) {
        const settingAbls = this.data.data.abilities;
        for (const ablKey in settingAbls) {
            if (settingAbls.hasOwnProperty(ablKey)) {
                data.abilities[ablKey].total = Number(data.abilities[ablKey].value);
                if (data.ownedBonus !== null && data.ownedBonus[ablKey]) {
                    data.abilities[ablKey].total += Number(data.ownedBonus[ablKey].totalMod);
                };
            };
        };
    }

    ownedItemsBonus() {
        if (this.data.items.length === 0) {return null};
        const ownedItems = this.data.items;
        let ownedMods = {};

        for (let it = 0; it < ownedItems.length; it++) {
            const itemInCheck = ownedItems[it];
            const inCheckMods = itemInCheck.data.itemMods;

            if (itemInCheck.data.equiped === true || itemInCheck.data.activate === true) {
                for (const key in inCheckMods) {
                    if (inCheckMods.hasOwnProperty(key) && inCheckMods[key].isActive && inCheckMods[key].value !== 0) {
                        if (!ownedMods[key]) {
                            ownedMods[key] = {
                                modList: [],
                                totalMod: 0
                            };
                        };
                        ownedMods[key].modList.push({
                            carrierId: itemInCheck._id,
                            carrierName: itemInCheck.name,
                            mod: inCheckMods[key].value
                        });
                    };
                };
            };
        };

        // Sums up total mod for each key
        for (const key in ownedMods) {
            if (ownedMods.hasOwnProperty(key)) {
                ownedMods[key].modList.forEach(e => {
                    ownedMods[key].totalMod += e.mod;
                });
            };
        };

        return ownedMods;
    };

    // _userFocusEntity(useFocus, operatorData) {
    //     const useFocusLC = useFocus.toLowerCase();
    //     // const vehicleData = this.actor.data;
    //     // const data = vehicleData.data;
    //     // let user;
    //     // if (operatorData.isToken) user = game.actors.tokens[operatorData.id];
    //     // if (!operatorData.isToken) user = game.actors.get(operatorData.id);
    //     // if (!user) {
    //     //     const parts = {name: p.name, id: p.id};
    //     //     let warning = game.i18n.format("age-system.WARNING.userNotAvailable", parts);
    //     //     ui.notifications.warn(warning);
    //     //     return null;
    //     // }
    //     if (useFocus === null || useFocus === "") {
    //         return null;
    //     };

    //     const user = this._vehicleOperator(operatorData);
    //     if (!user) return null;

    //     const userFoci = user.data.items.filter(a => a.type === "focus");
    //     // const expectedFocus = data.useFocus.toLowerCase();
    //     const validFocus = userFoci.filter(c => c.name.toLowerCase() === useFocusLC);

    //     if (validFocus.length < 1) {
    //         return useFocus;
    //     } else {
    //         const id = validFocus[0]._id;
    //         return user.getOwnedItem(id);
    //     };    
    // };

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
        // const useFocus = this._userFocusEntity(this.data.data.handling.useFocus, damageData.operatorData);
        const vehicleUseFocus = this.data.data.handling.useFocus
        const useFocus = operator ? operator.checkFocus(vehicleUseFocus) : null;

        damageData = {
            ...damageData,
            operator,
            useFocus,
            // useFocus,
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
            return {focusName: namedFocus, focusItem: focus, id: focusId, value: focus.data.data.initialValue}
        };
    }
};