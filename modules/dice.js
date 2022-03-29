import { ageSystem } from "./config.js";
import { sortObjArrayByName } from "./setup.js";

/**
 * Helper function to reduce a Formula
 * @param {String} formula Formula String to be reduced to dice components and a single constant value
 * @param {Object} data Object containing definition for all /@attr/ declared on Formula String
 * @returns {Object} Object with parts.shortFormula, parts.nonDet, parts.det, parts.detValue
 */
export function resumeFormula(formula, data = {}) {
    if (!formula) return null
    const simRoll = new Roll(formula, data);
    const terms = simRoll.terms;
    const parts = {
        det: "",
        nonDet: ""
    };
    for (let t = 0; t < terms.length; t++) {
        const e = terms[t];
        let f = e.formula;
        if (e.flavor) f = f.replace(`[${e.flavor}]`, '');
        // Compatibility with 0.8.x
        if (!isNewerVersion(ageSystem.coreVersion, "0.8.9")) {
            e.isDeterministic = e instanceof Die || e instanceof ParentheticalTerm ? false : true
        }
        if (!e.isDeterministic) {
            if (t != 0) parts.nonDet += `${terms[t-1].formula}`;
            parts.nonDet += `${f}`;
            parts.det += "0";
        }
        if (e.isDeterministic) parts.det += `${f}`;
    }
    parts.detValue = quickEval(parts.det);
    parts.shortFormula = `${parts.nonDet}`;
    if (parts.detValue) {
        if (parts.detValue > 0) parts.shortFormula += `+`;
        parts.shortFormula += `${parts.detValue}`;
    };
    if (!parts.shortFormula) parts.shortFormula = "+0";
    return parts;
}

export function quickEval(expression) {
    let result;
    try {
      const src = 'with (sandbox) { return ' + expression + '}';
      const evl = new Function('sandbox', src);
      result = evl(Roll.MATH_PROXY);
    } catch {
      result = undefined;
    }
    if ( !Number.isNumeric(result) ) result = undefined;
    return result;
};

// TO DO - add flavor identifying the item and button to roll damage/healing/whatever
export async function ageRollCheck({event = null, actor = null, abl = null, itemRolled = null, rollTN = null, rollUserMod = null, atkDmgTradeOff = null,
    hasTest = false, rollType = null, vehicleHandling = false, selectAbl = false, rollVisibility = false, flavor = null, flavor2 = null, moreParts = false,
    isStuntAttack = false, extraSP = 0, stackSP = true}={}) {

    const ROLL_TYPE = ageSystem.ROLL_TYPE;
    const actorType = actor?.type;

    let isToken = null;
    let actorId = null;
    // Check if actor rolling is unlinked token and log its Token ID
    if (actor) {
        isToken = actor.isToken ? 1 : 0;
        actorId = actor.uuid;
        // actorId = isToken ? actor.uuid : actor.id;
    }
    
    // Prompt user for extra Roll Options if Alt + Click is used to initialize roll
    let extraOptions = null;
    if (!event.ctrlKey && event.altKey || selectAbl || event.type === "contextmenu") {
        extraOptions = await getAgeRollOptions(itemRolled, {targetNumber: rollTN, selectAbl, rollVisibility, actorType, rollType, ROLL_TYPE});
        if (extraOptions.cancelled) return;
        if (extraOptions.rollTN) rollTN = extraOptions.rollTN;
        if (extraOptions.selectedAbl) abl = extraOptions.selectedAbl;
        if (extraOptions.stuntAttack) isStuntAttack = true;
        if (extraOptions.extraSP) extraSP = extraOptions.extraSP;
        if (extraOptions.stackSP !== undefined) stackSP = extraOptions.stackSP;
        rollUserMod = extraOptions.ageRollMod;
        atkDmgTradeOff = extraOptions.atkDmgTradeOff;
    };

    // Set roll mode
    // const rMode = setBlind(event);
    const rollMode = event.shiftKey ? "blindroll" : "roll";
    let rollData = {...actor?.actorRollData()};
    let partials = [];
    rollData.abilityName = "...";
    
    // Basic formula created spliting Stunt Die from the others
    let rollFormula = "2d6 + 1d6";

    // Check if it is a Resource/Income roll
    let resName;
    if (rollType === ROLL_TYPE.RESOURCES) {
        rollFormula += " + @resources"
        rollData.resources = actor.data.data.resources.total;
        // rollData.resourcesRoll = resourceRoll;
        const resSelected = game.settings.get("age-system", "wealthType");
        resName = game.i18n.localize(`age-system.${resSelected}`)
        flavor2 = resName
        partials.push({
            label: resName,
            value: rollData.resources
        });
        rollData.resourcesName = game.i18n.localize(`age-system.${resSelected}`);
    };

    // Check if Ability is used
    let ablName;
    if (abl !== null && abl !== "no-abl") {
        const ablValue = actor.data.data.abilities[abl].total;
        const ablTestMod = actor.data.data.abilities?.[abl]?.testMod ?? 0;
        const ablTestModLabel = game.i18n.localize(`age-system.bonus.${abl}Test`);
        rollFormula += ` + @ability + @abilityTestOnly`;
        ablName = actorType === "char" ? game.i18n.localize(`age-system.${abl}`) : game.i18n.localize(`age-system.org.${abl}`);
        rollData = {
            ...rollData,
            ability: ablValue,
            ablCode: abl,
            focusId: null,
            abilityName: ablName,
            abilityTestOnly: ablTestMod
        };
        partials.push({
            label: rollData.abilityName,
            value: ablValue
        });
        if (ablTestMod) partials.push({
            label: ablTestModLabel,
            value: ablTestMod
        });
    };

    // Check if item rolled is Focus and prepare its data
    let focusId = null
    let focusObj = null
    if (itemRolled?.type === "focus" || typeof(itemRolled) === "string" || itemRolled?.data?.data.useFocus) {
        focusObj = actor.checkFocus(itemRolled.data?.data.useFocus || itemRolled.name || itemRolled);
        rollFormula += " + @focus";
        rollData.focusName = focusObj.focusName;
        rollData.focus = focusObj.value;
        partials.push({
            label: rollData.focusName,
            value: rollData.focus,
        });
        focusId = focusObj.id;
    }

    if (actorType === 'char') {
        // Adds Actor general Attack Bonus if rolltype = "attack"
        if ([ROLL_TYPE.ATTACK, ROLL_TYPE.RANGED_ATTACK, ROLL_TYPE.MELEE_ATTACK, ROLL_TYPE.STUNT_ATTACK].includes(rollType) && actor.data.data.attackMod != 0) {
            rollFormula += " + @attackMod";
            rollData.attackMod = actor.data.data.attackMod;
            partials.push({
                label: game.i18n.localize("age-system.bonus.attackMod"),
                value: rollData.attackMod,
            });
        }
    
        // Adds general roll bonus from Actor
        if (actor?.data.data.testMod && actor?.data.data.testMod != 0) {
            rollFormula += " + @testMod";
            rollData.testMod = actor.data.data.testMod;
            partials.push({
                label: game.i18n.localize("age-system.bonus.testMod"),
                value: rollData.testMod,
            });
        }
        
        // Adds Handling bonus for Vehicles, if applicable
        if (vehicleHandling) {
            rollData.handling = vehicleHandling;
            rollFormula += " + @handling";
            partials.push({
                label: game.i18n.localize("age-system.handling"),
                value: vehicleHandling
            });
        }
    }
    
    // Adds user input roll mod
    if (rollUserMod) {
        rollData.rollMod = rollUserMod;
        rollFormula += " + @rollMod";
        partials.push({
            label: game.i18n.localize("age-system.setAgeRollMod"),
            value: rollUserMod
        });
    }

    // Transfer rolled item (if any) to chat message
    // Also checks if Item has Activation Mod
    if (itemRolled !== null && typeof(itemRolled) !== "string") {
        rollData.itemId = itemRolled.id;
        rollData.hasDamage = itemRolled.data.data.hasDamage;
        rollData.hasHealing = itemRolled.data.data.hasHealing;
        rollData.hasFatigue = itemRolled.data.data.hasFatigue;
        rollData.hasTest = itemRolled.data.data.hasTest;
        const iUseMod = itemRolled?.data?.data?.activateMod
        if (iUseMod) {
            rollFormula += ` + ${iUseMod}`
            partials.push({
                label: game.i18n.localize("age-system.activationMod"),
                value: iUseMod
            });
        }
    } else {
        rollData.itemId = null;
    };

    // If no actor is selected, the checks inside this loop are not relevant
    if (actor && actorType === "char") {

        // Check if Item requires Weapon Group Proficiency
        if (hasWeaponGroupPenalty(itemRolled, actor?.data.data.wgroups)) {
            rollData.wgroup = -2;
            rollFormula += " + @wgroup";
            partials.push({
                label: game.i18n.localize("age-system.wgroupPenalty"),
                value: rollData.wgroup
            });
        };

        // Check if AIM is active - this bonus will apply to all rolls when it is active
        const aim = actor.data.data.aim;
        if (aim.active && !(rollType === ROLL_TYPE.RESOURCES)) {
            rollData.aim = aim.value + aim.mod;
            rollFormula += " + @aim";
            partials.push({
                label: game.i18n.localize("age-system.aim"),
                value: rollData.aim
            });
            if (itemRolled?.data?.type === "weapon") await actor.update({"data.aim.active": false});
        };
        
        // Adds penalty for Attack which is converted to damage Bonus and pass info to chat Message
        if (atkDmgTradeOff && !(rollType === ROLL_TYPE.RESOURCES)) {
            rollData.atkDmgTradeOff = atkDmgTradeOff;
            rollFormula += " + @atkDmgTradeOff";
            partials.push({
                label: game.i18n.localize("age-system.penaltyToDamage"),
                value: atkDmgTradeOff
            })
        }
        
        // Adds Armor Penalty if it is a Dexterity Check
        const armor = actor.data.data.armor;
        if (armor.penalty > 0 && abl === "dex") {
            rollData.armorPenalty = -armor.penalty;
            rollFormula += " + @armorPenalty";
            partials.push({
                label: game.i18n.localize("age-system.armorPenalty"),
                value: rollData.armorPenalty
            })
        };   
        
        // Check if Fatigue is configured
        const usingFatigue = game.settings.get("age-system", "useFatigue");
        rollData.usingFatigue = usingFatigue;
        
        // Check for Fatigue penalties
        const fatigue = actor.data.data.fatigue;
        
        // Apply Fatigue penalties, if in use
        if (usingFatigue) {
            if (fatigue.value > 0) {
                rollData.fatigue = -fatigue.value;
                rollFormula += " + @fatigue";
                partials.push({
                    label: game.i18n.localize("age-system.fatigue"),
                    value: rollData.fatigue
                })
            };
        }
        
        // Check Guard Up penalties
        // Here it checks if Guard Up and Defend are checked - when both are checked, the rule is use none
        const guardUp = actor.data.data.guardUp;
        if (guardUp.active && !(rollType === ROLL_TYPE.RESOURCES)) {
            rollData.guardUp = -guardUp.testPenalty;
            rollData.guardUpActive = true;
            rollFormula += " + @guardUp";
            partials.push({
                label: game.i18n.localize("age-system.guardUp"),
                value: rollData.guardUp
            })
        };
    }

    if (!flavor) flavor = actor?.name ?? game.user.name;
    const stuntFlavor = game.i18n.localize("age-system.stuntAttack");
    switch (rollType) {
        case ROLL_TYPE.ATTACK || ROLL_TYPE.MELEE_ATTACK || RANGED_ATTACK:
            flavor2 = `${isStuntAttack ? stuntFlavor : game.i18n.localize("age-system.settings.attack")} | ${itemRolled.name}`;
            break;
        case ROLL_TYPE.FATIGUE:
            flavor2 = game.i18n.localize("age-system.fatigue");
            break;
        case ROLL_TYPE.TOUGHNESS || ROLL_TYPE.TOUGHNESS_AUTO:
            flavor2 = game.i18n.localize("age-system.toughnessTest");
            break;
        case ROLL_TYPE.RESOURCES:
            flavor2 = resName;
            break;
        case ROLL_TYPE.POWER:
            flavor2 = `${isStuntAttack ? stuntFlavor : game.i18n.localize("age-system.power")} | ${itemRolled.name}`;
            break;
        case ROLL_TYPE.ABILITY:
            flavor2 = `${isStuntAttack ? stuntFlavor + " | " : ""}${ablName}`;
            break;
        case ROLL_TYPE.FOCUS:
            flavor2 = `${isStuntAttack ? stuntFlavor + " | " : ""}${ablName} (${focusObj.focusName})`;
            break;
        case ROLL_TYPE.PLOT_ACTION:
            flavor2 = `${game.i18n.localize("age-system.plotAction")}`;
            flavor2 += ablName === undefined ? "" : ` | ${ablName}`;
        default:
            break;
    }
    // Add Stunt Attack to Flavor2 if applicable
    if (isStuntAttack && !flavor2) flavor2 = game.i18n.localize("age-system.stuntAttack");

    // Check for moreParts
    if (moreParts) {
        if (moreParts.length > 0) {
            for (let p = 0; p < moreParts.length; p++) {
                const part = moreParts[p];
                const partName = `moreParts${p}`;
                rollData[partName] = part.value;
                rollFormula += ` + @${partName}`;
                partials.push({
                    label: part.label,
                    value: part.value
                })
            }
        }
    }

    // Finally, the Age Roll!
    const ageRoll = await new Roll(rollFormula, rollData).evaluate({async: true});

    // If rollTN is used, check if roll fails or succeed
    let isSuccess = null
    if (rollTN || rollTN === 0) {
        const rollMargin = ageRoll.total - rollTN;
        if (rollMargin >= 0) {
            isSuccess = true;
        } else {
            isSuccess = false;
        };
    }

    // Generate Stunt Points if doubles are rolled and total rolled is higher than TN or there is no TN set
    const generateSP = (rollTN && isSuccess) || !rollTN;
    const rollSummary = ageRollChecker(ageRoll, generateSP, isStuntAttack, extraSP, stackSP)
    let chatTemplate = "/systems/age-system/templates/rolls/base-age-roll.hbs";
    const injuryMarks = (rollType === ROLL_TYPE.TOUGHNESS) || (rollType === ROLL_TYPE.TOUGHNESS_AUTO) ? actor.data.data.injury.marks : null;

    rollData = {
        ...rollData,
        // Informs card's color scheme
        colorScheme: `colorset-${game.settings.get("age-system", "colorScheme")}`,
        flavor,
        flavor2,
        partials,
        actorId,
        isToken,
        isSuccess,
        roll: ageRoll,
        ageRollSummary: rollSummary,
        rollTN,
        focusId,
        rollType,
        ROLL_TYPE,
        injuryMarks,
        injuryDegree: injuryDegree(rollSummary.dice.d3, injuryMarks),
        user: game.user
    };

    let chatData = {
        user: game.user.id,
        speaker: {alias: game.user.name},
        content: await renderTemplate(chatTemplate, rollData),
        roll: ageRoll,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        flags: {
            "age-system": {
                "ageroll": {
                    rollType,
                    rollData
                }
            }
        }
    };

    // Configuration of Stunt Die if using Dice so Nice
    if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
        const stuntDieColorset = game.settings.get("age-system", "stuntSoNice");
        chatData.roll.terms[2].options = {
            colorset: stuntDieColorset ?? "bronze",
            appearance: {
                system: game.user.data.flags["dice-so-nice"]?.appearance?.global?.system ?? "standard"
            }
        }
    };

    if (!chatData.sound) chatData.sound = CONFIG.sounds.dice;
    if (rollMode === "blindroll") chatData = await ChatMessage.applyRollMode(chatData, rollMode);
    return ChatMessage.create(chatData);
};

// Check if the roll has Weapon Group penalty
function hasWeaponGroupPenalty(item, ownedGroups) {
    const hasWgroups = ageSystem.weaponGroups;

    // CASE 1 - Weapon Groups not in use or item rolled is not a weapon
    if (!hasWgroups || !["weapon"].includes(item?.type)) return false;

    // CASE 2 - No item rolled, Actor is not expected to have Weapon Groups, Weapon Groups is not an Array
    if (!item || !ownedGroups || !Array.isArray(ownedGroups) ) return false;

    const itemWgroups = item?.data.data.wgroups;
    
    // CASE 3 - Item's Weapon Groups is not an Array
    if (!Array.isArray(itemWgroups)) return false;

    // CASE 4 - Item's Weapon Group is currently not configured on Game Settings or Array is empty
    let applicableWgroup = [];
    for (let i = 0; i < itemWgroups.length; i++) {
        const w = itemWgroups[i];
        if (hasWgroups.includes(w)) applicableWgroup.push(w);        
    }
    if (applicableWgroup.length === 0) return false;

    // CASE 5 - Item has applicable Weapon Groups and Actor is also applicable - time to check compatibility
    let hasPenalty = true;
    for (let i = 0; i < applicableWgroup.length; i++) {
        const wg = applicableWgroup[i];
        if (ownedGroups.includes(wg)) hasPenalty = false;
    }
    return hasPenalty
};

async function getAgeRollOptions(itemRolled, data = {}) {
    const template = "/systems/age-system/templates/rolls/age-roll-settings.hbs"
    const type = itemRolled ? itemRolled.type : null;
    if (data.selectAbl) data.abilities = data.actorType === "char" ? ageSystem.abilities : ageSystem.abilitiesOrg;

    const html = await renderTemplate(template, {
        ...data,
        stackSP: ageSystem.stuntAttackPoints > 1 ? false : true,
        itemType: type
    });

    return new Promise(resolve => {
        const data = {
            title: game.i18n.localize("age-system.ageRollOptions"),
            content: html,
            buttons: {
                normal: {
                    label: game.i18n.localize("age-system.roll"),
                    callback: html => {
                        const fd = new FormDataExtended(html[0].querySelector("form"));
                        resolve(fd.toObject())
                    }
                },
                cancel: {
                    label: game.i18n.localize("age-system.cancel"),
                    callback: html => resolve({cancelled: true}),
                }
            },
            default: "normal",
            close: () => resolve({cancelled: true}),
        }
        new Dialog(data, null).render(true);
    });
};

async function getDamageRollOptions(addFocus, stuntDmg, data = {}) {
    const template = "/systems/age-system/templates/rolls/dmg-roll-settings.hbs";
    const html = await renderTemplate(template, {
        addFocus,
        stuntDmg,
        selectAbl: data.selectAbl,
        abilities: data.actorType === "char" ? ageSystem.abilities : ageSystem.abilitiesOrg,
        useFocus: data.actorType === "organization"
    });

    return new Promise(resolve => {
        const data = {
            title: game.i18n.localize("age-system.damageOptions"),
            content: html,
            buttons: {
                normal: {
                    label: game.i18n.localize("age-system.roll"),
                    callback: html => {
                        const fd = new FormDataExtended(html[0].querySelector("form"));
                        resolve(fd.toObject());
                    }
                },
                cancel: {
                    label: game.i18n.localize("age-system.cancel"),
                    callback: html => resolve({cancelled: true}),
                }
            },
            default: "normal",
            close: () => resolve({cancelled: true}),
        }
        new Dialog(data, null).render(true);
    });
};

// Capture GM ID to whisper
export function isGMroll(event) {
    let idGM = [];
    if (!event.shiftKey) return idGM;
    game.users.map(u => {
        if (u.isGM) idGM.push(u.id)
    })
    return idGM;
};

// Code to decide if roll is PUBLIC or BLIND TO GM
export function setBlind(event) {
    if (event.shiftKey) {
        return "blind";
    } else {
        return "roll";
    };
};

/**
 * Function to setup Age Roll and indicate amount of Stunt Points generated
 * @param {object} ageRoll          Roll object
 * @param {boolean} generateSP      Flag to indicate if it possible to generate SP (meaning it is a successful roll)
 * @param {boolean} isStuntAttack   Flag to indicate if the roll is a Stunt Attack
 * @param {number} extraSP          Amount of Stunt Points generated if the roll generates Stunt Points
 * @param {boolean} stackSP         Indicate if Stunt Points generated by Doubles stacks with the ones from Stunt Attack
 * @returns Objects with data for each dice and stunt Points generated
 */
export function ageRollChecker(ageRoll, generateSP, isStuntAttack, extraSP = 0, stackSP = true) {
    const die1 = ageRoll.dice[0].results[0].result;
    const die2 = ageRoll.dice[0].results[1].result;
    const die3 = ageRoll.dice[1].results[0].result;
    const diffFaces = new Set([die1, die2, die3]).size;
    const hasDoubles = diffFaces < 3;
    const rollSummary = {
        dice: {
            d1: die1,
            d2: die2,
            d3: die3
        },
        stunt: (hasDoubles || isStuntAttack) && generateSP,
        stuntDie: die3
        // stuntPoints: (isStuntAttack ? ageSystem.stuntAttackPoints : 0) + (hasDoubles ? die3 : 0) + (isStuntAttack || hasDoubles ? extraSP : 0)
    };

    // Define total of Stunt Points Generated
    let stuntPts = 0;
    if (rollSummary.stunt) {
        stuntPts = isStuntAttack ? ageSystem.stuntAttackPoints : 0;
        if (hasDoubles) stuntPts = stackSP ? stuntPts + die3 : Math.max(stuntPts, die3);
        if (stuntPts) stuntPts += extraSP
    }
    rollSummary.stuntPoints = stuntPts;

    return rollSummary
};

export function damageToString(damageMod) {
    return damageMod > 0 ? `+${damageMod}` : `${damageMod}`;
};

// Vehicle Damage
export async function vehicleDamage ({
    event = null,
    vehicle = null,
    operator = null,
    stuntDie = null,
    addFocus = false,
    qtdDice = null,
    dieSize = null,
    collisionDmg = null,
    sideswipeDmg = null,
    damageSource = "",
    addRam = false,
    useFocus = null,
    dmgGeneralMod = null,
    dmgExtraDice = 0,
    stuntDamage = 0}={}) {

    // Prompt user for Damage Options if Alt + Click is used to initialize damage roll
    let damageOptions = null;
    if (!event.ctrlKey && event.altKey || event.type === "contextmenu") {
        damageOptions = await getDamageRollOptions(addFocus, stuntDie);
        if (damageOptions.cancelled) return;
        dmgExtraDice = damageOptions.setDmgExtraDice;
        dmgGeneralMod = damageOptions.setDmgGeneralMod;
        stuntDamage = damageOptions.setStuntDamage;
        addFocus = damageOptions.addFocus;
        stuntDie = damageOptions.stuntDieDmg;
    };

    const isBlind = setBlind(event);
    const audience = isGMroll(event);

    // Initialize Damage Formula, Data and Flavor
    let damageFormula = qtdDice;
    let rollData = {};
    // let damageFormula = `(@qtdDice)d(@dieSize)`;
    // let rollData = {
    //     qtdDice: qtdDice,
    //     dieSize: dieSize
    // };
    let messageData = {
        flavor: `${vehicle.data.name} | ${game.i18n.localize(`age-system.${damageSource}`)}`,
        speaker: ChatMessage.getSpeaker()
    };

    // Adds Ram Damage
    if (addRam) {
        damageFormula += ` + @ramDamage`;
        rollData.ramDamage = ` + ${vehicle.data.data.ramDmg}d6`;
        messageData.flavor += ` | ${game.i18n.localize("age-system.ram")}`;
    };

    // Check if extra Stunt Die is to be added (normally rolling damage after chat card roll)
    if (stuntDie !== null) {
        damageFormula = `${damageFormula} + @stuntDieDmg`;
        rollData.stuntDieDmg = stuntDie;
        messageData.flavor += ` | ${damageToString(stuntDie)} ${game.i18n.localize("age-system.stuntDie")}`; 
    }

    // Check if Focus adds to damage and adds it
    if (addFocus === true && useFocus) {
        damageFormula = `${damageFormula} + @focus`;
        rollData.focus = useFocus.value;
        messageData.flavor += ` | ${damageToString(rollData.focus)} ${useFocus.focusName}`;
    }

    // Adds user Damage input
    if (dmgGeneralMod && dmgGeneralMod !== 0) {
        damageFormula += " + @optMod";
        rollData.optMod = dmgGeneralMod;
        messageData.flavor += ` | ${damageToString(dmgGeneralMod)}`;             
    };

    // Adds extra damage for CTRL + click (+1D6) or CTRL + ALT + click (+2D6)
    if (event.ctrlKey) {
        if (event.altKey) {
            damageFormula = `${damageFormula} + 2d6`
            messageData.flavor += ` | +2D6`;
        } else {
            damageFormula = `${damageFormula} + 1d6`
            messageData.flavor += ` | +1D6`;
        };
    };

    // Adds specific Stunt Damage dice
    if (stuntDamage && stuntDamage !== 0) {
        const stuntDmgDice = `${stuntDamage}D6`;
        damageFormula += " + @stuntDmg";
        rollData.stuntDmg = stuntDmgDice;
        messageData.flavor += ` | +${stuntDmgDice} ${game.i18n.localize("age-system.stunts")}`;             
    };

    // Adds Extra Damage dice
    if (dmgExtraDice && dmgExtraDice !== 0) {
        const extraDice = `${dmgExtraDice}D6`;
        damageFormula += " + @extraDice";
        rollData.extraDice = extraDice;
        messageData.flavor += ` | +${extraDice}`;             
    };

    let dmgRoll = await new Roll(damageFormula, rollData).evaluate({async: true});

    return dmgRoll.toMessage(messageData, {whisper: audience, rollMode: isBlind});

}

// Plot Damage (Organization)
export async function plotDamage (actor) {
    let formula = "2d6[2D6]";
    let abl;
    let rollData = {};

    const dmgOpt = await getDamageRollOptions(null, null, {selectAbl: true, actorType: actor.type});
    if (dmgOpt.cancelled) return;
    abl = dmgOpt.selectedAbl;
    const rollUserMod = dmgOpt.setDmgGeneralMod;
    const stuntDamage = dmgOpt.setStuntDamage;
    const dmgExtraDice = dmgOpt.setDmgExtraDice;
    const atkDmgTradeOff = Number(dmgOpt.atkDmgTradeOff);

    if (abl && abl !== 'no-abl') {
        rollData.ability = actor.data.data.abilities[abl].value;
        formula += ` + @ability[${game.i18n.localize(`age-system.org.${abl}`)}]`;
    }

    if (rollUserMod) {
        rollData.rollmod = rollUserMod
        formula += ` + @rollmod[${game.i18n.localize("age-system.setRollGeneralMod")}]`;
    }

    // Adds specific Stunt Damage dice
    if (stuntDamage && stuntDamage != 0) {
        const stuntDmgDice = `${stuntDamage}D6`;
        formula += ` + @stuntDmg[${game.i18n.localize("age-system.stunts")}, ${stuntDmgDice}]`;
        rollData.stuntDmg = stuntDmgDice;
    };

    // Adds Extra Damage dice
    if (dmgExtraDice && dmgExtraDice != 0) {
        const extraDice = `${dmgExtraDice}D6`;
        formula += ` + @extraDice[+${extraDice}]`;
        rollData.extraDice = extraDice;
    };

    let dmgRoll = await new Roll(formula, rollData).evaluate({async: true});
    
    // Preparing custom damage chat card
    let chatTemplate = "/systems/age-system/templates/rolls/damage-roll.hbs";
    
    const wGroupPenalty = hasWeaponGroupPenalty(null, null); //modificado
    // dmgDesc.wGroupPenalty = wGroupPenalty;

    rollData = {
        ...rollData,
        rawRollData: dmgRoll,
        wGroupPenalty: wGroupPenalty,
        finalValue: wGroupPenalty ? Math.floor(dmgRoll.total/2) : dmgRoll.total,
        finalValue: dmgRoll.total,
        diceTerms: dmgRoll.terms,
        colorScheme: `colorset-${game.settings.get("age-system", "colorScheme")}`,
        flavor: actor.name,
        flavor2: "structure damage",
        user: game.user,
        useInjury: undefined, //modificado
        buttonVisibility: "hidden" //incluido
    };

    let chatData = {
        user: game.user.id,
        speaker: {alias: game.user.name},
        content: await renderTemplate(chatTemplate, rollData),
        roll: dmgRoll,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        flags: {
            "age-system": {
                type: "orgDamage",
                damageData: {
                    // ...dmgDesc,
                    totalDamage: rollData.finalValue,
                    attacker: actor.name,
                    attackerId: actor.uuid,
                    healthSys: undefined //modificado
                }
            }
        }
    };

    chatData.sound = CONFIG.sounds.dice;
    ChatMessage.create(chatData);
}

// TODO - criar classe para construir o dano para Item, Organization, Spaceship e Vehicle e integrar as diferentes funções
// Damage Builder
export class DamageBuilder {

    // Damage Options Dialog handler

    // Damage

}

// Item damage
export async function itemDamage({
    event = null,
    item = null,
    stuntDie = null,
    addFocus = false,
    atkDmgTradeOff = 0,
    stuntDamage = null,
    dmgExtraDice = null,
    dmgGeneralMod = null,
    resistedDmg = false,
    actorDmgMod = 0,
    openOptions = false,
    actorWgroups = []}={}) {

    // Prompt user for Damage Options if Alt + Click is used to initialize damage roll
    let damageOptions = null;
    if ((!event.ctrlKey && event.altKey) || event.type === "contextmenu") {
        damageOptions = await getDamageRollOptions(addFocus, stuntDie);
        if (damageOptions.cancelled) return;
        dmgExtraDice = damageOptions.setDmgExtraDice;
        dmgGeneralMod = damageOptions.setDmgGeneralMod;
        stuntDamage = damageOptions.setStuntDamage;
        addFocus = damageOptions.addFocus;
        stuntDie = damageOptions.stuntDieDmg;
    };
    
    const healthSys = ageSystem.healthSys;
    const dmgDetails = resistedDmg ? item.data.data.damageResisted : item.data.data;
    let dmgAbl = dmgDetails.dmgAbl

    let damageFormula
    let rollData = {...item.actor.actorRollData()};
    if (healthSys.useInjury) {
        let baseDmg = item?.data?.data?.hasHealing ? "" : `${healthSys.baseDamageTN}`;
        if (item?.data?.data?.damageInjury != 0) {
            baseDmg = baseDmg ? `${baseDmg} + ${item.data.data.damageInjury}` : `${item.data.data.damageInjury}`;
        } else {
            baseDmg = baseDmg ? `${item.data.data.damageInjury}` : `0`;
        }
        damageFormula = `(${baseDmg})[${baseDmg}, ${game.i18n.localize("age-system.base")}]`;
    } else damageFormula = `${dmgDetails.damageFormula}`;
    
    let damageDesc = "";
    const dmgDesc = {
        dmgType: null,
        dmgSrc: null,
    };

    // Adds up Flavor text for item damage type
    if (item?.data.data.hasDamage) {
        damageDesc += `${game.i18n.localize(`age-system.chatCard.rollDamage`)}`;
        const dmgType = game.i18n.localize(`age-system.${item.data.data.dmgType}`);
        const dmgSrc = game.i18n.localize(`age-system.${item.data.data.dmgSource}`);
        dmgDesc.dmgType = item.data.data.dmgType;
        dmgDesc.dmgSrc = item.data.data.dmgSource;
        if (healthSys.useBallistic) damageDesc += ` | ${dmgType} | ${dmgSrc}`;
    };

    // Add Healing Flavor text if applicable
    if (item?.data.data.hasHealing) {
        damageDesc = `${game.i18n.localize(`age-system.item.healing`)}`;
        dmgDesc.isHealing = true;
    };

    if (item?.isOwned) {
        // Adds owner's Ability to damage
        // Fully added even on Injury Mode
        if (dmgAbl !== null && dmgAbl !== "no-abl") damageFormula = `${damageFormula} + @${dmgAbl}[${game.i18n.localize("age-system." + dmgAbl)}]`;
        
        // Check if item onwer has items which adds up to general damage
        const aDmg = item?.actor?.data?.data?.dmgMod;
        if (aDmg != 0) damageFormula = `${damageFormula} + ${aDmg}`;

        // Check if Item has Mod to add to its own Damage
        const iDmg = item?.data?.data?.itemDmgMod;
        if (iDmg != 0) damageFormula = `${damageFormula} + ${iDmg}`;

        // Check if Attack to Damage Trade Off is applied
        if (atkDmgTradeOff) {
            damageFormula = `${damageFormula} + @atkDmgTradeOff[${game.i18n.localize("age-system.penaltyToDamage")}]`;
            rollData.atkDmgTradeOff = healthSys.useInjury ? Math.ceil(-atkDmgTradeOff/3) : (-atkDmgTradeOff);
        }

        // Check if Focus adds to damage and adds it
        if (addFocus === true && item.data.data.useFocus) {
            const actor = item.actor;
            const focusData = actor.checkFocus(item.data.data.useFocus);
            damageFormula = `${damageFormula} + @focus[${focusData.focusName}]`;
            rollData.focus = healthSys.useInjury ? Math.ceil(focusData.value/3) : focusData.value;
        }

        // Check if extra Stunt Die is to be added (normally rolling damage after chat card roll)
        if (stuntDie !== null) {
            damageFormula = `${damageFormula} + @stuntDieDmg[${game.i18n.localize("age-system.stuntDie")}]`;
            // When Stunt Die is added to damage using Injury, it counts as 1d6, hence +1
            rollData.stuntDieDmg = healthSys.useInjury ? 1 : stuntDie;
        }

        // Adds user Damage input
        if (dmgGeneralMod && dmgGeneralMod !== 0) {
            damageFormula += ` + @optMod[${game.i18n.localize("age-system.setRollGeneralMod")}]`;
            rollData.optMod = dmgGeneralMod;
        };

        // Adds extra damage for All-Out Attack maneuver
        if (item.actor.data.data.allOutAttack.active) {
            let allOutAttackMod = item.actor.data.data.allOutAttack.dmgBonus;
            if (healthSys.useInjury) allOutAttackMod = Math.ceil(allOutAttackMod/3);
            damageFormula = `${damageFormula} + @allOutAttack[${game.i18n.localize("age-system.allOutAttack")}]`;
            rollData.allOutAttack = allOutAttackMod;
        };

        // Adds extra damage for CTRL + click (+1D6) or CTRL + ALT + click (+2D6)
        if (event.ctrlKey) {
            let extraD
            if (event.altKey) {
                extraD = 2
            } else {
                extraD = 1
            };
            damageFormula += healthSys.useInjury ? ` + ${extraD}[+${extraD}]` : ` + ${extraD}D6[+${extraD}D6]`;
        };

        // Adds specific Stunt Damage dice
        if (stuntDamage && stuntDamage != 0) {
            const stuntDmgDice = healthSys.useInjury ? stuntDamage : `${stuntDamage}D6`;
            damageFormula += ` + @stuntDmg[${game.i18n.localize("age-system.stunts")}, ${stuntDmgDice}]`;
            rollData.stuntDmg = stuntDmgDice;
        };

        // Adds Extra Damage dice
        if (dmgExtraDice && dmgExtraDice != 0) {
            const extraDice = healthSys.useInjury ? dmgExtraDice : `${dmgExtraDice}D6`;
            damageFormula += ` + @extraDice[+${extraDice}]`;
            rollData.extraDice = extraDice;
        };

    };

    // Adds +2 damage if Health System is Modern AGE and game Setting is 'pulp' or 'cinematic'
    if (['mage', 'mageInjury', 'mageVitality'].includes(healthSys.type) && ['pulp', 'cinematic'].includes(healthSys.mode)) {
        const modeDamage = healthSys.useInjury ? 1 : 2;
        damageFormula += ` + @modeDamage[${game.i18n.localize(`SETTINGS.gameMode${healthSys.mode}`)}]`;
        rollData.modeDamage = modeDamage;
    };

    let dmgRoll = await new Roll(damageFormula, rollData).evaluate({async: true});

    for (let t = 0; t < dmgRoll.terms.length; t++) {
        const term = dmgRoll.terms[t];
        if (!term.options.flavor) term.options.flavor = term.formula
    }
    
    // Preparing custom damage chat card
    let chatTemplate = "/systems/age-system/templates/rolls/damage-roll.hbs";
    
    const wGroupPenalty = hasWeaponGroupPenalty(item, actorWgroups);
    dmgDesc.wGroupPenalty = wGroupPenalty;

    rollData = {
        ...rollData,
        // rawRollData: dmgRoll,
        wGroupPenalty: wGroupPenalty,
        finalValue: wGroupPenalty? Math.floor(dmgRoll.total/2) : dmgRoll.total,
        diceTerms: dmgRoll.terms,
        colorScheme: `colorset-${game.settings.get("age-system", "colorScheme")}`,
        flavor: item ? `${item.name} | ${item.actor.name}` : damageDesc,
        flavor2: item ? damageDesc : null,
        user: game.user,
        useInjury: healthSys.useInjury
    };

    let chatData = {
        user: game.user.id,
        speaker: {alias: game.user.name},
        content: await renderTemplate(chatTemplate, rollData),
        roll: dmgRoll,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        flags: {
            "age-system": {
                type: "damage",
                damageData: {
                    ...dmgDesc,
                    totalDamage: rollData.finalValue,
                    attacker: item.actor.name,
                    attackerId: item.actor.uuid,
                    healthSys
                }
            }
        }
    };

    if (!chatData.sound) {
        if (healthSys.type === 'mageInjury' || healthSys.type === 'mageVitality') {
            chatData.sound = CONFIG.sounds.notification;
        } else {
            chatData.sound = CONFIG.sounds.dice;
        }
    }
    ChatMessage.create(chatData);
};

export function injuryDegree(sd, marks) {
    if (sd === null | marks === null) return null;
    const mode = ageSystem.healthSys.type;
    const penalty = Math.floor(marks/3);
    let result = sd - penalty;
    if (mode === 'mageInjury') {
        if (result <= 1) return 'severe';
        if (result >= 2 && result <= 4) return 'serious';
        if (result > 4) return 'serious';
    }
    if (mode === 'mageVitality') {
        if (result <= 2) return 'severe';
        if (result >= 3 && result <= 5) return 'serious';
        if (result > 5) return 'serious';
    }
    return null
}