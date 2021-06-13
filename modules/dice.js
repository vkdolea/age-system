import { sortObjArrayByName } from "./setup.js";

// TO DO - add flavor identifying the item and button to roll damage/healing/whatever
export async function ageRollCheck({
    event = null,
    actor = null,
    abl = null,
    itemRolled = null,
    resourceRoll = false,
    rollTN = null,
    rollUserMod = null,
    atkDmgTradeOff = null,
    hasTest = false,
    rollType = null,
    vehicleHandling = false,
    selectAbl = false,
    rollVisibility = false,
    flavor = false,
    moreParts = false}={}) {
    
    // Prompt user for extra Roll Options if Alt + Click is used to initialize roll
    let extraOptions = null;
    if (!event.ctrlKey && event.altKey || selectAbl || event.type === "contextmenu") {
        extraOptions = await getAgeRollOptions(itemRolled, {targetNumber: rollTN, selectAbl, rollVisibility});
        if (extraOptions.cancelled) return;
        if (extraOptions.rollTN) rollTN = extraOptions.rollTN;
        if (extraOptions.selectedAbl) abl = extraOptions.selectedAbl;
        rollUserMod = extraOptions.ageRollMod;
        atkDmgTradeOff = -Math.abs(Number(extraOptions.atkDmgTradeOff));
    };

    // Set roll mode
    // const rMode = setBlind(event);
    const rollMode = event.shiftKey ? "blindroll" : "roll";
    let rollData = {};
    let partials = [];
    rollData.abilityName = "...";
    
    // Basic formula created spliting Stunt Die from the others
    let rollFormula = "2d6 + 1d6";

    // Check if it is a Resource/Income roll
    let resName;
    if (resourceRoll === true) {
        rollFormula += " + @resources"
        rollData.resources = actor.data.data.resources.total;
        rollData.resourcesRoll = resourceRoll;
        const resSelected = game.settings.get("age-system", "wealthType");
        resName = game.i18n.localize(`age-system.${resSelected}`)
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
        rollFormula += " + @ability";
        ablName = game.i18n.localize(`age-system.${abl}`);
        rollData = {
            ability: ablValue,
            ablCode: abl,
            focusId: null,
            abilityName: ablName
        };
        partials.push({
            label: rollData.abilityName,
            value: ablValue
        });
    };

    // Check if item rolled is Focus and prepare its data
    let focusId = null
    if (itemRolled?.type === "focus" || typeof(itemRolled) === "string" || itemRolled?.data?.data.useFocus) {
        const focusObj = actor.checkFocus(itemRolled.data?.data.useFocus || itemRolled.name || itemRolled);
        // const focusObj = itemRolled.actor.checkFocus(itemRolled.data?.data.useFocus || itemRolled.name || itemRolled);
        rollFormula += " + @focus";
        rollData.focusName = focusObj.focusName;
        rollData.focus = focusObj.value;
        partials.push({
            label: rollData.focusName,
            value: rollData.focus,
        });
        focusId = focusObj.id;
    }

    // Adds Actor general Attack Bonus if rolltype = "attack"
    if (rollType === "attack" && actor.data.data.attackMod !== 0) {
        rollFormula += " + @attackMod";
        rollData.attackMod = actor.data.data.attackMod;
        partials.push({
            label: game.i18n.localize("age-system.bonus.attackMod"),
            value: rollData.attackMod,
        });
    }

    // Adds general roll bonus from Actor
    if (actor?.data.data.testMod && actor?.data.data.testMod !== 0) {
        rollFormula += " + @testMod";
        rollData.testMod = actor.data.data.testMod;
        partials.push({
            label: game.i18n.localize("age-system.bonus.testMod"),
            value: rollData.testMod,
        });
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

    // Adds Handling bonus for Vehicles, if applicable
    if (vehicleHandling) {
        rollData.handling = vehicleHandling;
        rollFormula += " + @handling";
        partials.push({
            label: game.i18n.localize("age-system.handling"),
            value: vehicleHandling
        });
    }

    // Transfer rolled item (if any) to chat message
    // Also checks if Item has Activation Mod
    const teste = typeof(itemRolled);
    if (itemRolled !== null && typeof(itemRolled) !== "string") {
        rollData.itemId = itemRolled.id;
        rollData.hasDamage = itemRolled.data.data.hasDamage;
        rollData.hasHealing = itemRolled.data.data.hasHealing;
        rollData.hasFatigue = itemRolled.data.data.hasFatigue;
        rollData.hasTest = itemRolled.data.data.hasTest;
        if (itemRolled.data.data.itemMods) {
            if (itemRolled.data.data.itemMods.itemActivation.isActive) {
                rollData.activationMod = itemRolled.data.data.itemMods.itemActivation.value
                rollFormula += " + @activationMod"
                partials.push({
                    label: game.i18n.localize("age-system.activationMod"),
                    value: rollData.activationMod
                });
            }
        }
    } else {
        rollData.itemId = null;
    };

    let isToken = null;
    let actorId = null;
    // If no actor is selected, the checks inside this loop are not relevant
    if (actor) {

        // Check if actor rolling is unlinked token and log its Token ID
        isToken = actor.isToken ? 1 : 0;
        actorId = isToken ? actor.token.data.id : actor.id;

        // Check if AIM is active - this bonus will apply to all rolls when it is active
        const aim = actor.data.data.aim;
        if (aim.active && !resourceRoll) {
            rollData.aim = aim.value;
            rollFormula += " + @aim";
            partials.push({
                label: game.i18n.localize("age-system.aim"),
                value: aim.value
            });
        };
        
        // Adds penalty for Attack which is converted to damage Bonus and pass info to chat Message
        if (atkDmgTradeOff && !resourceRoll) {
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
        if (guardUp.active && !resourceRoll) {
            rollData.guardUp = -guardUp.testPenalty;
            rollData.guardUpActive = true;
            rollFormula += " + @guardUp";
            partials.push({
                label: game.i18n.localize("age-system.guardUp"),
                value: rollData.guardUp
            })
        };

        // Roll header flavor text
        let headerTerms = {actor: actor.name};
        // let headerFlavor = flavor;
        if (!flavor) {
            if (rollType === "fatigue") {
                headerTerms.item = game.i18n.localize("age-system.fatigue");
                flavor = game.i18n.format("age-system.chatCard.rollGeneral", headerTerms);
            } else {
                if (itemRolled) {
                    headerTerms.item = itemRolled.name;
                    switch (itemRolled.type) {
                        case "weapon":
                            flavor = game.i18n.format("age-system.chatCard.rollAttack", headerTerms);
                            break;
                        case "power":
                            flavor = game.i18n.format("age-system.chatCard.rollPower", headerTerms);
                            break;
                        default:
                            flavor = game.i18n.format("age-system.chatCard.rollGeneral", headerTerms);
                            break;
                    }
                } else {
                    if (resourceRoll) {
                        headerTerms.item = resName;
                        flavor = game.i18n.format("age-system.chatCard.rollGeneral", headerTerms);
                    }
                    if (abl !== null && abl !== "no-abl") {
                        headerTerms.item = ablName;
                        flavor = game.i18n.format("age-system.chatCard.rollGeneral", headerTerms);
                    }
                };
            }
        }
    }

    // Check for moreParts
    if (moreParts) {
        if (moreParts.length > 0) {
            for (let p = 0; p < moreParts.length; p++) {
                const part = moreParts[p];
                const partName = `moreParts${p}`;
                rollData[partName] = part.value;
                rollFormula += ` + @${partName}`;
                partials.push({
                    label: part.description,
                    value: part.value
                })
            }
        }
    }

    // Finally, the Age Roll!
    const ageRoll = await new Roll(rollFormula, rollData).evaluate({async: true});

    // If rollTN is used, check if roll fails or succeed
    let isSuccess = null
    if (rollTN) {
        const rollMargin = ageRoll.total - rollTN;
        if (rollMargin >= 0) {
            isSuccess = true;
        } else {
            isSuccess = false;
        };
    };

    // Generate Stunt Points if doubles are rolled and total rolled is higher than TN or there is no TN set
    const generateSP = (rollTN && isSuccess) || !rollTN;
    const rollSummary = ageRollChecker(ageRoll, generateSP)
    let chatTemplate = "/systems/age-system/templates/rolls/base-age-roll.hbs";

    rollData = {
        ...rollData,
        // Informs card's color scheme
        colorScheme: `colorset-${game.settings.get("age-system", "colorScheme")}`,
        flavor,
        partials,
        actorId,
        isToken,
        isSuccess,
        roll: ageRoll,
        ageRollSummary: rollSummary,
        rollTN,
        focusId,
        rollType,
        user: game.user
    };

    let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker(),
        content: await renderTemplate(chatTemplate, rollData),
        roll: ageRoll,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL
    };

    // Configuration of Stunt Die if using Dice so Nice
    if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
        const stuntDieColorset = game.settings.get("age-system", "stuntSoNice");
        chatData.roll.terms[2].options.colorset = stuntDieColorset ? stuntDieColorset : "bronze";
    };

    if (!chatData.sound) chatData.sound = CONFIG.sounds.dice;
    if (rollMode === "blindroll") {
        ChatMessage.create(ChatMessage.applyRollMode(chatData, rollMode));
    } else {
        ChatMessage.create(chatData);
    }
};

async function getAgeRollOptions(itemRolled, data = {}) {
    // Ve se item rolado e arma, poder ou null/outro, 

    const template = "/systems/age-system/templates/rolls/age-roll-settings.hbs"
    const type = itemRolled ? itemRolled.type : null;

    if (data.selectAbl) {
        const abilitiesPool = CONFIG.ageSystem.abilitiesSettings[game.settings.get("age-system", "abilitySelection")];
        let abilitiesArray = []
        for (const abl in abilitiesPool) {
            if (Object.hasOwnProperty.call(abilitiesPool, abl)) {
                const ablLocal = game.i18n.localize(abilitiesPool[abl]);
                abilitiesArray.push({ability: abl, name: ablLocal});
            };
        };
        data.abilitiesArray = sortObjArrayByName(abilitiesArray, "name");
    };

    const html = await renderTemplate(template, {
        ...data,
        itemType: type
    });

    return new Promise(resolve => {
        const data = {
            title: game.i18n.localize("age-system.ageRollOptions"),
            content: html,
            buttons: {
                normal: {
                    label: game.i18n.localize("age-system.roll"),
                    callback: html => resolve(_processAgeRollOptions(html[0].querySelector("form")))
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

function _processAgeRollOptions(form) {

    const modifiers = ["ageRollMod", "atkDmgTradeOff", "rollTN", "selectedAbl"];
    let rollOptions = {}

    for (let o = 0; o < modifiers.length; o++) {
        const mod = modifiers[o];
        if (form[mod]) {
            if (mod === "selectedAbl") {
                rollOptions[mod] = form[mod].value;
            } else {
                rollOptions[mod] = parseInt(form[mod].value)
                if (!Number.isInteger(rollOptions[mod])) rollOptions[mod] = null;
            }
        }
    }

    return rollOptions
}

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

// Code to identify Doubles and pass on dice summary     
export function ageRollChecker(ageRoll, generateSP) {
    const die1 = ageRoll.dice[0].results[0].result;
    const die2 = ageRoll.dice[0].results[1].result;
    const die3 = ageRoll.dice[1].results[0].result;
    const diffFaces = new Set([die1, die2, die3]).size;
    const rollSummary = {
        dice: {
            d1: die1,
            d2: die2,
            d3: die3
        },
        stunt: false
    };
    if (diffFaces < 3 && generateSP) rollSummary.stunt = true;   
    return rollSummary
};

export function damageToString(damageMod) {
    return damageMod > 0 ? `+${damageMod}` : `${damageMod}`;
};

async function getDamageRollOptions(addFocus, stuntDmg) {
    // Ve se item rolado e arma, poder ou null/outro, 

    const template = "/systems/age-system/templates/rolls/dmg-roll-settings.hbs"
    // const type = itemRolled ? itemRolled.type : null;

    const html = await renderTemplate(template, {
        addFocus,
        stuntDmg
        // ...data,
        // itemType: type
    });

    const modifiers = ["setDmgExtraDice", "setDmgGeneralMod", "setStuntDamage", "addFocus", "stuntDieDmg"];
    return new Promise(resolve => {
        const data = {
            title: game.i18n.localize("age-system.damageOptions"),
            content: html,
            buttons: {
                normal: {
                    label: game.i18n.localize("age-system.roll"),
                    callback: html => resolve(_processDamageOptions(html[0].querySelector("form"), modifiers))
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

function _processDamageOptions(form, modifiers) {

    // const modifiers = ["setDmgExtraDice", "setDmgGeneralMod", "setStuntDamage", "addFocus", "stuntDieDmg"];
    let rollOptions = {}

    for (let o = 0; o < modifiers.length; o++) {
        const mod = modifiers[o];
        const option = form[mod];
        if (option) {
            if (option.type === "checkbox") {
                rollOptions[mod] = option.checked;
            } else {
                rollOptions[mod] = parseInt(option.value);
                if (!Number.isInteger(rollOptions[mod])) rollOptions[mod] = null;
            }
        }
    }

    return rollOptions
}

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
    openOptions = false}={}) {

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
    
    const dmgDetails = resistedDmg ? item.data.data.damageResisted : item.data.data;
    let nrDice = dmgDetails.nrDice;
    let diceSize = dmgDetails.diceType;
    let constDmg = dmgDetails.extraValue;
    let dmgAbl = dmgDetails.dmgAbl

    const isBlind = setBlind(event);
    const audience = isGMroll(event);

    let damageFormula = nrDice > 0 ? `${nrDice}d${diceSize}` : "";
    let rollData = {
        // diceQtd: nrDice,
        // diceSize: diceSize,
        damageMod: constDmg
    };
    // Check if damage source has a non 0 portion on its parameters
    if (constDmg) {damageFormula = `${damageFormula} + @damageMod`}
    let messageData = {
        flavor: `${item.name}`,
        speaker: ChatMessage.getSpeaker()
    };

    if (item.isOwned) {

        // Adds up Flavor text for item damage type
        if (item.data.data.hasDamage) {
            messageData.flavor += ` | ${game.i18n.localize(`age-system.${item.data.data.dmgType}`)} | ${game.i18n.localize(`age-system.${item.data.data.dmgSource}`)}`;
        };
        // Add Healing Flavor text if applicable
        if (item.data.data.hasHealing) {
            messageData.flavor += ` | ${game.i18n.localize(`age-system.item.healing`)}`;
        };

        // Adds owner's Ability to damage
        if (dmgAbl !== null && dmgAbl !== "no-abl") {
            const ablMod = item.actor.data.data.abilities[dmgAbl].total;
            damageFormula = `${damageFormula} + @abilityMod`;
            rollData.abilityMod = ablMod;
            messageData.flavor += ` | ${damageToString(ablMod)} ${game.i18n.localize("age-system." + dmgAbl)}`
        }

        // Check if Attack to Damage Trade Off is applied
        if (atkDmgTradeOff) {
            damageFormula = `${damageFormula} + @atkDmgTradeOff`;
            rollData.atkDmgTradeOff = Math.abs(atkDmgTradeOff);
            messageData.flavor += ` | ${damageToString(Math.abs(atkDmgTradeOff))} ${game.i18n.localize("age-system.penaltyToDamage")}`;
        }

        // Check if Focus adds to damage and adds it
        if (addFocus === true && item.data.data.useFocus) {
            const actor = item.actor;
            const focusData = actor.checkFocus(item.data.data.useFocus);
            damageFormula = `${damageFormula} + @focus`;
            rollData.focus = focusData.value;
            messageData.flavor += ` | ${damageToString(focusData.value)} ${focusData.focusName}`;
        }

        // Check if extra Stunt Die is to be added (normally rolling damage after chat card roll)
        if (stuntDie !== null) {
            damageFormula = `${damageFormula} + @stuntDieDmg`;
            rollData.stuntDieDmg = stuntDie;
            messageData.flavor += ` | ${damageToString(stuntDie)} ${game.i18n.localize("age-system.stuntDie")}`; 
        }

        // Check if Item has Mod to add to its own Damage
        if (item.data.data.itemMods.itemDamage.isActive) {
            const itemDmg = item.data.data.itemMods.itemDamage.value;
            damageFormula = `${damageFormula} + @itemBonus`;
            rollData.itemBonus = itemDmg;
            messageData.flavor += ` | ${damageToString(itemDmg)} ${game.i18n.localize("age-system.itemDmgMod")}`;
        };

        // Adds user Damage input
        if (dmgGeneralMod && dmgGeneralMod !== 0) {
            damageFormula += " + @optMod";
            rollData.optMod = dmgGeneralMod;
            messageData.flavor += ` | ${damageToString(dmgGeneralMod)}`;             
        };
        
        // Check if item onwer has items which adds up to general damage
        if (item.actor.data.data.ownedBonus != null && item.actor.data.data.ownedBonus.actorDamage) {
            const actorDmgMod = item.actor.data.data.ownedBonus.actorDamage.totalMod;
            damageFormula = `${damageFormula} + @generalDmgMod`;
            rollData.generalDmgMod = actorDmgMod;
            messageData.flavor += ` | ${damageToString(actorDmgMod)} ${game.i18n.localize("age-system.itemDmgMod")}`;
        };

        // Adds extra damage for All-Out Attack maneuver
        if (item.actor.data.data.allOutAttack.active) {
            const allOutAttackMod = item.actor.data.data.allOutAttack.dmgBonus;
            damageFormula = `${damageFormula} + @allOutAttack`;
            rollData.allOutAttack = allOutAttackMod;
            messageData.flavor += ` | ${damageToString(allOutAttackMod)} ${game.i18n.localize("age-system.allOutAttack")}`;                
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

        // Adds Actor Damage Bonus
        if (actorDmgMod !== 0) {
            damageFormula += " + @actorDmgMod";
            rollData.actorDmgMod = actorDmgMod;
            messageData.flavor += ` | ${damageToString(actorDmgMod)} ${game.i18n.localize("age-system.bonus.actorDamage")}`;             
        };

    };

    let dmgRoll = await new Roll(damageFormula, rollData).evaluate({async: true});

    return dmgRoll.toMessage(messageData, {whisper: audience, rollMode: isBlind});
};

export function getActor() {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    if (!actor) return false;
    return actor;
}