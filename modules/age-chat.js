import ApplyDamageDialog from "./apply-damage.js";
import {ageSystem} from "./config.js";
import ConditionsWorkshop from "./conditions-workshop.js";
import { applyBreather } from "./breather.js";

export function addChatListeners(html) {
    html.on('click', '.roll-damage', chatDamageRoll);
    html.on('contextmenu', '.roll-damage', chatDamageRoll);
    html.on('click', '.roll-fatigue', chatFatigueRoll);
    html.on('contextmenu', '.roll-fatigue', chatFatigueRoll);
    html.on('click', '.roll-item', rollItemFromChat);
    html.on('contextmenu', '.roll-item', rollItemFromChat);
    html.on('click', '.apply-damage', applyDamageChat);
    html.on('click', '.roll-toughness-test', resistInjury);
    html.on('click', '.apply-injury', inflictInjury);
};

/**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {object[]} options    The Array of Context Menu options
 * @returns {object[]}          The extended options Array including new context choices
 */
 export const addChatMessageContextOptions = function(html, options) {
    let canApply = li => {
        const message = game.messages.get(li.data("messageId"));
        return message?.isRoll && message?.isContentVisible && (ageSystem.useTargeted ? game.user.targets.size : canvas.tokens?.controlled.length);
    };
    options.push(
    {
        name: game.i18n.localize("age-system.item.healing"),
        icon: '<i class="fa fa-heartbeat" aria-hidden="true"></i>',
        condition: canApply,
        callback: li => applyChatCardDamage(li, {isHealing: true, isNewHP: false})
    },
    {
        name: game.i18n.localize("age-system.applyDamage"),
        icon: '<i class="fa fa-crosshairs" aria-hidden="true"></i>',
        condition: canApply,
        callback: li => applyChatCardDamage(li, {isDamage: true})
    });
    return options;
};

/**
 * Apply rolled dice damage to the token or tokens which are currently controlled.
 * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
 * @param {HTMLElement} li      The chat entry which contains the roll data
 * @param {object} options      Options containing card's damage or healing definitions
 */
function applyChatCardDamage(li, options) {
    const message = game.messages.get(li.data("messageId"));
    const roll = message.rolls[0];
    const cardDamageData = message.flags?.["age-system"]?.damageData;
    const total = cardDamageData?.totalDamage ?? roll.total;
    if (options.isHealing) {
        return Promise.all(controlledTokenByType(['char']).map(t => {
          const a = t.actor;
          return ageSystem.healthSys.useInjury ? a.healMarks(total) : a.applyHPchange(total, options);
        }));
    }
    if (options.isDamage) {
        const cardHealthSys = cardDamageData?.healthSys?.type;
        let damageData;
        if (cardHealthSys === ageSystem.healthSys.type) {
            damageData = cardDamageData
        } else {
            damageData = {
                healthSys: ageSystem.healthSys,
                totalDamage: cardDamageData?.totalDamage ?? total,
                dmgType: cardDamageData?.dmgType ?? 'wound',
                dmgSrc: cardDamageData?.dmgSrc ?? 'impact',
                isHealing: false,
                wGroupPenalty: false
            }
        }
        callApplyDamage(damageData);
    }
}

/**
 * Chat card listener to apply Injury to selected Actor when pressing specific button.
 * @param {Mouse Event} event   Chat card Mouse Click event
 * @returns {Promisse}          Promisse applying Injury to Actor
 */
export async function inflictInjury(event){
    event.preventDefault();
    const b = event.currentTarget;
    let degree;
    if (b.classList.contains('light')) degree = 'light'
    if (b.classList.contains('serious')) degree = 'serious'
    if (b.classList.contains('severe')) degree = 'severe'
    if (!degree) return
    const card = event.target.closest(".chat-message");
    const cardId = card.dataset.messageId;
    const cardData = await game.messages.get(cardId).flags["age-system"].ageroll.rollData;
    let actor = await fromUuid(cardData.actorId);
    if (actor.documentName === "Token") actor = actor.actor;
    return actor.applyInjury(degree);
}

// Actor indicated by card will roll to resist Injury
export async function resistInjury(event) {
    event.preventDefault();
    const card = event.target.closest(".chat-message");
    const cardId = card.dataset.messageId;
    const cardData = await game.messages.get(cardId).flags["age-system"].toughnessTestCard;
    const actor = await fromUuid(cardData.actorUuid);
    return actor.toughnessTest(foundry.utils.deepClone(cardData.injuryParts), cardData.rollTN, cardData.autoApply);
}

// Apply Damage button will send all selected Actors [Character type only] to Apply Damage dialog window
export async function applyDamageChat(event) {
    event.preventDefault();
    const card = event.target.closest(".chat-message");
    const cardId = card.dataset.messageId;
    const cardData = game.messages.get(cardId).flags["age-system"].damageData ?? game.messages.get(cardId).flags["age-system"].ageroll.rollData; // Compatibility to Damage Chat Card before 1.1.6
    let damageData = await foundry.utils.deepClone(cardData);
    const cardHealthSys = damageData.healthSys;
    if (!checkHealth(cardHealthSys, ageSystem.healthSys)) {
        damageData = {
            healthSys: ageSystem.healthSys,
            totalDamage: damageData.totalDamage,
            dmgType: damageData.dmgType ?? 'wound',
            dmgSrc: damageData.dmgSrc ?? 'impact',
            isHealing: false,
            wGroupPenalty: false
        }
        ui.notifications.warn(game.i18n.localize("age-system.WARNING.healthSysNotMatching"));
    };
    callApplyDamage(damageData);
}

/**
 * Call Apply Damage data containing all applicable Actors selected
 * @param {object} damageData   All details from the damage to be applied to selected Actors
 * @returns {Application}       Apply Damage application is started to select damage details
 */
export async function callApplyDamage (damageData) {
    const targets = controlledTokenByType('char');
    if (targets.length === 0) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.noValidTokensSelected"));
    return new ApplyDamageDialog(targets, damageData, ageSystem.healthSys.useInjury).render(true);
}

/**
 * Filter the controlled actor types to match passed Type
 * @param {string|array} type Valid actor type to be selected
 * @returns {array}     Array with only the correct type of Actor
 */
export function controlledTokenByType(type) {
    if (!Array.isArray(type)) type = [type];
    let targets = []
    if (ageSystem.useTargeted) {
        const t = game.user.targets;
        for (let i of t.values()) targets.push(i)
    } else {
        targets = canvas.tokens.controlled;
    }
    const nonChar = []
    for (let t = 0; t < targets.length; t++) {
        const el = targets[t];
        const actorType = el.actor?.type;
        if (!type.includes(actorType)) nonChar.push(t);
    }
    for (let t = nonChar.length-1; t >= 0; t--) {
        targets.splice(nonChar[t],1)
    }
    return targets
}

/**
 * Check if actual Game Settings and clicked Card with Apply Damage button has compatible parameters
 * @param {string} card         Chat card damage parameters
 * @param {string} game         Current in-use Game Settings health parameters * 
 * @returns {boolean}           TRUE if compatible, FALSE if not compatible
 */
export function checkHealth(card, game) {
    const attributes = ["useToughness", "useInjury", "useBallistic"];
    for (let a = 0; a < attributes.length; a++) {
        const att = attributes[a];
        if (card[att] !== game[att]) return false;
    }
    return true;
}

/**
 * Roll damage from a chat card, taking into consideration card's Actor, Item and button selected
 */ 
export async function chatDamageRoll(event) {
    event.preventDefault();
    const message = event.type === "contextmenu" ? event.target.closest(".chat-message") : event.currentTarget.closest(".chat-message");
    const cardId = message.dataset.messageId;
    const cardData = game.messages.get(cardId).flags["age-system"].ageroll.rollData;
    const classList = event.currentTarget.classList;
    const actorId = cardData.actorId
    let owner = null;
    if (actorId) owner = await fromUuid(actorId);
    owner = owner?.actor ?? owner;
    if (!owner) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.originTokenMissing"));
    const itemSource = owner.items.get(cardData.itemId);

    let stuntDie = null;
    let addFocus = false;
    let resistedDamage = false;
    if (classList.contains('add-stunt-damage')) stuntDie = cardData.ageRollSummary.stuntDie;
    if (classList.contains('add-focus-damage')) addFocus = true;
    if (classList.contains('resisted')) resistedDamage = true;

    const damageData = {
        event: event,
        stuntDie: stuntDie,
        addFocus: addFocus,
        atkDmgTradeOff: cardData.atkDmgTradeOff,
        resistedDmg: resistedDamage,
    };
    itemSource.rollDamage(damageData);
};

/**
 * Roll Fatigue from chat card according to card's Actor and Item
 */ 
export async function chatFatigueRoll(event) {
    const message = event.type === "contextmenu" ? event.target.closest(".chat-message") : event.currentTarget.closest(".chat-message");
    const cardId = message.dataset.messageId;
    const cardData = game.messages.get(cardId).flags["age-system"].ageroll.rollData;
    const actorId = cardData.actorId;
    let owner = null;
    owner = await fromUuid(actorId)
    owner = owner?.actor ?? owner;
    if (!owner) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.originTokenMissing"));
    const itemSource = owner.items.get(cardData.itemId);
    itemSource.roll(event, "fatigue");
};

// From and chat card, select to roll item's Attack or Damage
export async function rollItemFromChat(event) {
    const classList = event.currentTarget.classList;
    const message = event.type === "contextmenu" ? event.target.closest(".chat-message") : event.currentTarget.closest(".chat-message");
    const cardId = message.dataset.messageId;
    const cardData = game.messages.get(cardId).flags["age-system"].messageData;

    const itemId = cardData.itemId;
    let owner = await fromUuid(cardData.ownerUuid);
    owner = owner?.actor ?? owner;
    const item = owner.items.get(itemId);
    if (classList.contains("damage")) item.rollDamage({event});
    if (classList.contains("attack")) item.roll(event);
}

/**
 * Set properties of elements inside cards rendered on chat
 * @param {object} chatCard         Chat card object containing the Message Data
 * @param {jQueryObject} html       jObject of the chat card being processed
 * @param {object} data             Data containing Message data
 */
export async function sortCustomAgeChatCards(chatCard, html, data) {
    // Add attribute type="button" to AGE buttons
    _buttonType(html.find(".age-system.item-chat-controls button"));
    _buttonType(html.find("button.age-button"));

    // Toggle chat card visibility of AGE Roll Cards 
    if (html.find(".base-age-roll").length > 0) _handleAgeRollVisibility(html, chatCard, data);

    // Check permission level to show and roll chat buttons when rolling item card
    if (html.find(".item-chat-controls").length > 0) _handleItemCardButton(html);
};

/**
 * Add attribute [type]="button" to chat buttons
 *
 * @param {HTMLelement} buttons     Array if all button elements inside the card
 */
function _buttonType(buttons) {
    for (let b = 0; b < buttons.length; b++) {
        const button = buttons[b];
        button.type = "button";
    }
}

/**
 * Set visibility properties for buttons and blind-roll segments (blind-roll segments currently not used)
 *
 * @param {jQueryObject} html       jObject of the chat card being processed
 * @param {object} chatCard         Chat card object containing the Message Data
 * @param {object} chatData         Data containing Message data
 */
function _handleAgeRollVisibility(html, chatCard, chatData){
    const element = html.find(".age-system.base-age-roll .feature-controls");
    const flags = chatCard.flags?.["age-system"]?.ageroll;
    for (let e = 0; e < element.length; e++) {
        const el = element[e];
        let actorId = flags?.rollData?.actorId;
        if (!actorId && flags?.type === "damage") actorId = flags.damageData.attackerId; // Compatibility to Damage Chat Card before 1.1.6
        let actor = actorId ? fromUuidSync(actorId) : null;
        actor = actor?.actor ?? actor;
        const isBlind = chatCard.blind;
        const whisperTo = chatData.message.whisper;
        const author = chatData.author.id;
        const userId = game.user.id;
    
        if ((whisperTo.includes(userId) || whisperTo.length < 1 || author === userId) && !isBlind) {
            el.querySelector(".blind-roll-card").remove();
        } else {
            if (isBlind && whisperTo.includes(userId)) {
                el.querySelector(".blind-roll-card").remove();
            } else {
                el.querySelector(".regular-roll-card").remove();
                const hideField = userId === author ? ".other-user-roll" : ".user-roll";
                el.querySelector(`.blind-roll-card ${hideField}`).remove();
            }
        }
        _permCheck(actor?.permission, el.querySelector(`.age-chat-buttons-grid`)); // to be removed in the future
        _permCheck(actor?.permission, el.querySelector(`.age-chat-buttons.grid`));
        if (!game.user.isGM) el.querySelector(".gm-only")?.remove();
    }
}

// Check if user has permission to use card button
async function _handleItemCardButton(html){
    const sectionClass = `.item-chat-controls`
    const data = html.find(sectionClass);
    for (let d = 0; d < data.length; d++) {
        const el = data[d];
        const actorId = el.dataset.ownerUuid;
        let actor;
        if (actorId) actor = await fromUuid(actorId);
        _permCheck(actor?.permission, el, sectionClass);
    }
}

/**
 * Set visibility properties for buttons and blind-roll segments (blind-roll segments currently not used)
 * @param {string} actorPerm        Permission the current user has for the Actor contained on a chat card
 * @param {HTMLelement} element     Chat card HTML element to be be removed if User is not Actor owner or Observer
 */
function _permCheck(actorPerm, element) {
    if (!element) return
    const validPerm = [CONST.DOCUMENT_PERMISSION_LEVELS.OWNER];
    if (game.settings.get("age-system", "observerRoll")) validPerm.push(CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER);
    if (!validPerm.includes(actorPerm)) element.remove();
}

/**
 * Listens to Chat Log commands and process all /a and /age commands
 * @param {object} chatLog                      Chat Log content
 * @param {string} content                      Text entry on chat textarea
 * @param {object|userId, speaker} userData     Identify message sender
 * @returns 
 */
export function ageCommand(chatLog, content, userData) {
    const message = content.split(" ").map(i => i.trim());
    
    if (['/age', '/a'].includes(message[0])) {
        const isGM = game.user.isGM;
        const gmFeats = ['conditions', 'workshop', 'cw'];
        const routine = message[1]
        if (!isGM && gmFeats.includes(routine)) {
            ui.notifications.error(`Only GMs can use the feature "${routine}"`);
            return false
        }
        if (ageSystem.healthSys.useInjury && [].includes(routine)) {
            ui.notifications.error(game.i18n.localize(`Health system not in use`));
            return false
        }
        if (!ageSystem.healthSys.useInjury && ['injure'].includes(routine)) {
            ui.notifications.error(game.i18n.localize(`Injury system not in use`));
            return false
        }

        switch (routine) {
            case 'help':
            case 'wiki':
                window.open(ageSystem.wiki, '_blank');
                break;
            case 'conditions':
            case 'workshop':
            case 'cw':
                new ConditionsWorkshop().render(true);
                break;
            case 'damage':
            case 'dmg':
                callApplyDamage({
                    healthSys: ageSystem.healthSys,
                    totalDamage: Number.isNaN(Number(message[2])) ? 0 : message[2],
                    dmgType: 'wound',
                    dmgSrc: 'impact',
                    isHealing: false,
                    wGroupPenalty: false
                });
                break;
            case 'heal':
                const newValue = Number(message[2]);
                if (!Number.isNaN(newValue)) controlledTokenByType(['char', 'organization']).map(t => {
                    const a = t.actor;
                    return ageSystem.healthSys.useInjury ? a.healMarks(newValue) : a.applyHPchange(newValue, {isHealing: true, isNewHP: false});
                });
                break;
            case 'injure':
            case 'inj':
                const degree = message[2];
                controlledTokenByType('char').map(t => t.actor.applyInjury(degree));
                break;
            case 'breather':
            case 'b':
                applyBreather('selfroll');
                break;
            default:
                ui.notifications.error(game.i18n.format("CHAT.InvalidCommand", {command: routine}));
                break;
        }
        return false
    }
}