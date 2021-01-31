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
    atkDmgTradeOff = null}={}) {

    // Prompt user for extra Roll Options if Alt + Click is used to initialize roll
    let extraOptions = null;
    if (!event.ctrlKey && event.altKey) {
        extraOptions = await getAgeRollOptions(itemRolled, {targetNumber: rollTN});
        if (extraOptions.cancelled) return;
        if (extraOptions.rollTN) rollTN = extraOptions.rollTN;
        rollUserMod = extraOptions.ageRollMod;
        atkDmgTradeOff = -Math.abs(Number(extraOptions.atkDmgTradeOff));
    };

    // Set roll mode
    const rMode = setBlind(event);
    let rollData = {};
    let partials = [];
    rollData.abilityName = "...";

    // Check if actor rolling is unlinked token and log its Token ID
    if (actor.isToken) {
        rollData.tokenId = actor.token.data._id;
        rollData.actorIsToken = true;
    } else {
        rollData.tokenId = null;
        rollData.actorIstoken = false;
    };
    
    // Basic formula created spliting Stunt Die from the others
    let rollFormula = "2d6 + 1d6";

    // Check if it is a Resource/Income roll
    if (resourceRoll === true) {
        rollFormula += " + @resources"
        rollData.resources = actor.data.data.resources.total;
        rollData.resourcesRoll = resourceRoll;
        const resSelected = game.settings.get("age-system", "wealthType");
        partials.push({
            label: game.i18n.localize(`age-system.${resSelected}`),
            value: rollData.resources
        });
        rollData.resourcesName = game.i18n.localize(`age-system.${resSelected}`);
    };

    // Check if Ability is used
    if (abl !== null && abl !== "no-abl") {
        const ablValue = actor.data.data.abilities[abl].total;
        rollFormula += " + @ability";
        rollData = {
            ability: ablValue,
            ablCode: abl,
            focusId: null,
            abilityName: game.i18n.localize(`age-system.${abl}`)
        };
        partials.push({
            label: rollData.abilityName,
            value: ablValue
        });
    };

    // Check if item rolled is Focus and prepare its data
    const focusRolled = getFocus(itemRolled);

    if (focusRolled) {
        rollFormula += " + @focus";
        rollData.focusName = focusRolled[0];
        rollData.focus = focusRolled[1];
        partials.push({
            label: focusRolled[0],
            value: focusRolled[1]
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

    // Transfer rolled item (if any) to chat message
    // Also checks if Item has Activation Mod
    if (itemRolled !== null) {
        rollData.itemId = itemRolled._id;
        rollData.itemEntity = itemRolled;
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
        rollFormula += " + @guardUp";
        partials.push({
            label: game.i18n.localize("age-system.guardUp"),
            value: rollData.guardUp
        })
    };

    // Informs roll card the current color scheme in use by the user
    rollData.colorScheme = `colorset-${game.settings.get("age-system", "colorScheme")}`;
    const ageRoll = new Roll(rollFormula, rollData).roll();


    // If rollTN is used, check if roll fails or succeed
    if (rollTN) {
        const rollMargin = ageRoll.total - rollTN;
        if (rollMargin > -1) {
            rollData.success = true;
        } else {
            rollData.success = false;
        };
    };

    // Generate Stunt Points if doubles are rolled and: total rolled is higher than TN or there is no TN set
    const generateSP = (rollTN && rollData.success) || !rollTN;
    const rollSummary = ageRollChecker(ageRoll, generateSP)
    let chatTemplate = "/systems/age-system/templates/rolls/base-age-roll.hbs";

    let cardData = {
        rollInput: rollData,
        partials,
        roll: ageRoll,
        ageRollSummary: rollSummary,
        owner: actor,
        guardUpActive: guardUp.active,
    };
    cardData.rollInput.rollTN = rollTN;

    let chatData = {
        user: game.user._id,
        speaker: ChatMessage.getSpeaker(),
        // whisper: isGMroll(event),
        blind: event.shiftKey,
        roll: ageRoll,
        content: await renderTemplate(chatTemplate, cardData)
    };

    // Compatibility with Dice So Nice
    if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
        return diceSoNiceRoller(ageRoll, chatData);
    };

    // TODO when blind roll, set message to GM and select another template to all other members

    chatData.sound = CONFIG.sounds.dice;
    return ChatMessage.create(chatData, {rollMode: rMode});
};

async function getAgeRollOptions(itemRolled, data = {}) {
    // Ve se item rolado e arma, poder ou null/outro, 

    const template = "/systems/age-system/templates/rolls/age-roll-settings.hbs"
    const type = itemRolled ? itemRolled.type : null;

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

    const modifiers = ["ageRollMod", "atkDmgTradeOff", "rollTN"];
    let rollOptions = {}

    for (let o = 0; o < modifiers.length; o++) {
        const mod = modifiers[o];
        if (form[mod]) {
            rollOptions[mod] = parseInt(form[mod].value)
            if (!Number.isInteger(rollOptions[mod])) rollOptions[mod] = null;
        }
    }

    // console.log(rollOptions)
    return rollOptions
}

export function getFocus(item) {
    if (item === null) {return false}
    if (item.type === "focus") return [item.name, item.data.data.initialValue];
    if (item.data.data.useFocus === "") return false;
    if (item.data.data.useFocusActorId) {
        const inUseFocus = item.actor.getOwnedItem(item.data.data.useFocusActorId);
        if (inUseFocus.name == "") return false;
        return [inUseFocus.name, inUseFocus.data.data.initialValue];
    } else {
        return [item.data.data.useFocus, 0]
    }
    
}

// Capture GM ID to whisper
export function isGMroll(event) {
    if (!event.shiftKey) {return false};
    return game.users.filter(u => u.isGM);
};

// Code to decide if roll is PUBLIC or BLIND TO GM
export function setBlind(event) {
    if (event.shiftKey) {
        return "blindroll";
    } else {
        return "roll";
    };
};

export function diceSoNiceRoller(roll, chatData) {
    roll.dice[1].options.colorset = "bronze";
    game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
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


// Creates dialog box to pick alternative Ability to roll a Focus - option within Focus' context menu
export function dialogBoxAbilityFocus(focus, actor) {

    let focusDialog = {
        title: focus.data.name,
        content: `<p>${game.i18n.localize("age-system.abilitySelect")}</p>`,
    };
    
    const abilitiesPool = CONFIG.ageSystem.abilitiesSettings[game.settings.get("age-system", "abilitySelection")];
    let abilitiesArray = []
    for (const abl in abilitiesPool) {
        if (Object.hasOwnProperty.call(abilitiesPool, abl)) {
            const ablLocal = game.i18n.localize(abilitiesPool[abl]);
            abilitiesArray.push({ability: abl, name: ablLocal});
        };
    };
    abilitiesArray = sortObjArrayByName(abilitiesArray, "name");
    
    let buttons = {};
    for (let a = 0; a < abilitiesArray.length; a++) {
        const obj = abilitiesArray[a];
        buttons[obj.ability] = {
            label: obj.name,
            callback: ev => {
                ageRollCheck(ev, actor, obj.ability, focus)
            }
        }
    }
    
    // In future versions of FoundryVTT (after 0.7.9), Dialog will pass HMTL data and not jQuery
    // Check this if/when code breaks
    return new Dialog(focusDialog = {
        ...focusDialog,
        buttons
    });
};

async function getDamageRollOptions() {
    // Ve se item rolado e arma, poder ou null/outro, 

    const template = "/systems/age-system/templates/rolls/dmg-roll-settings.hbs"
    // const type = itemRolled ? itemRolled.type : null;

    const html = await renderTemplate(template, {
        // ...data,
        // itemType: type
    });

    return new Promise(resolve => {
        const data = {
            title: game.i18n.localize("age-system.damageOptions"),
            content: html,
            buttons: {
                normal: {
                    label: game.i18n.localize("age-system.roll"),
                    callback: html => resolve(_processDamageRollOptions(html[0].querySelector("form")))
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

function _processDamageRollOptions(form) {

    const modifiers = ["setDmgExtraDice", "setDmgGeneralMod", "setStuntDamage"];
    let rollOptions = {}

    for (let o = 0; o < modifiers.length; o++) {
        const mod = modifiers[o];
        if (form[mod]) {
            rollOptions[mod] = parseInt(form[mod].value)
            if (!Number.isInteger(rollOptions[mod])) rollOptions[mod] = null;
        }
    }

    return rollOptions
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
    dmgGeneralMod = null}={}) {

    // Prompt user for Damage Options if Alt + Click is used to initialize damage roll
    let damageOptions = null;
    if (!event.ctrlKey && event.altKey) {
        damageOptions = await getDamageRollOptions();
        if (damageOptions.cancelled) return;
        dmgExtraDice = damageOptions.setDmgExtraDice;
        dmgGeneralMod = damageOptions.setDmgGeneralMod;
        stuntDamage = damageOptions.setStuntDamage;
    };
    
    const nrDice = item.data.data.nrDice;
    const diceSize = item.data.data.diceType;
    const constDmg = item.data.data.extraValue;

    const isBlind = setBlind(event);
    const audience = isGMroll(event);

    let damageFormula = nrDice > 0 ? "(@diceQtd)d(@diceSize)" : "";
    let messageData = {
        flavor: `${item.name}`,
        speaker: ChatMessage.getSpeaker()
    };

    // Check if damage source has a non 0 portion on its parameters
    if (constDmg !== 0) {damageFormula = `${damageFormula} + @damageMod`}

    const dmgAbl = item.data.data.dmgAbl;
    let rollData = {
        diceQtd: nrDice,
        diceSize: diceSize,
        damageMod: constDmg
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
        if (addFocus === true) {
            const focusData = getFocus(item);
            damageFormula = `${damageFormula} + @focus`;
            rollData.focus = focusData[1];
            messageData.flavor += ` | ${damageToString(focusData[1])} ${focusData[0]}`;
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

    };

    let dmgRoll = new Roll(damageFormula, rollData).roll();

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