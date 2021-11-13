import ApplyDamageDialog from "./apply-damage.js";
import {ageSystem} from "./config.js";

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
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {object[]} options    The Array of Context Menu options
 *
 * @returns {object[]}          The extended options Array including new context choices
 */
 export const addChatMessageContextOptions = function(html, options) {
    let canApply = li => {
        const message = game.messages.get(li.data("messageId"));
        const hasHealth = !ageSystem.healthSys.useInjury;
        return message?.isRoll && message?.isContentVisible && canvas.tokens?.controlled.length && hasHealth;
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
 *
 * @param {HTMLElement} li      The chat entry which contains the roll data
 * @param {number} multiplier   A damage multiplier to apply to the rolled damage.
 * @returns {Promise}
 */
function applyChatCardDamage(li, options) {
    const message = game.messages.get(li.data("messageId"));
    const roll = message.roll;
    const cardDamageData = message.data.flags?.["age-system"]?.damageData;
    const total = cardDamageData?.totalDamage ?? roll.total;
    if (options.isHealing) {
        return Promise.all(canvas.tokens.controlled.map(t => {
          const a = t.actor;
          return a.applyHPloss(total, options);
        }));
    }
    if (options.isDamage) {
        const cardHealthSys = cardDamageData?.healthSys.type;
        let damageData;
        if (cardHealthSys === ageSystem.healthSys.type) {
            damageData = cardDamageData
        } else {
            damageData = {
                healthSys: ageSystem.healthSys,
                totalDamage: total,
                dmgType: 'wound',
                dmgSrc: 'impact',
                isHealing: false,
                wGroupPenalty: false
            }
        }
        callApplyDamage(damageData);
    }
}

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
    const cardData = await game.messages.get(cardId).data.flags["age-system"].ageroll.rollData;
    const actor = await fromUuid(cardData.actorId);
    return actor.applyInjury(degree);
}

export async function resistInjury(event) {
    event.preventDefault();
    const card = event.target.closest(".chat-message");
    const cardId = card.dataset.messageId;
    const cardData = await game.messages.get(cardId).data.flags["age-system"].toughnessTestCard;
    const actor = await fromUuid(cardData.actorUuid);
    return actor.toughnessTest(foundry.utils.deepClone(cardData.injuryParts), cardData.rollTN, cardData.autoApply);
}

export async function applyDamageChat(event) {
    event.preventDefault();
    const card = event.target.closest(".chat-message");
    const cardId = card.dataset.messageId;
    const damageData = await game.messages.get(cardId).data.flags["age-system"].damageData;
    const cardHealthSys = damageData.healthSys;
    if (!checkHealth(cardHealthSys, CONFIG.ageSystem.healthSys)) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.healthSysNotMatching"));
    callApplyDamage(damageData);
}

export async function callApplyDamage (damageData) {
    let targets = canvas.tokens.controlled;
    let nonChar = []
    if (nonChar !== []) {
        for (let t = 0; t < targets.length; t++) {
            const el = targets[t];
            const actorType = el.actor?.type;
            if (actorType !== 'char') nonChar.push(t);
        }
        for (let t = nonChar.length-1; t >= 0; t--) {
            targets.splice(nonChar[t],1)
        }
    }
    if (targets.length === 0) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.noValidTokensSelected"));
    return new ApplyDamageDialog(targets, damageData, CONFIG.ageSystem.healthSys.useInjury).render(true);
}

export function checkHealth(card, game) {
    const attributes = ["useToughness", "useInjury", "useBallistic"];
    for (let a = 0; a < attributes.length; a++) {
        const att = attributes[a];
        if (card[att] !== game[att]) return false;
    }
    return true;
}

export async function chatDamageRoll(event) {
    event.preventDefault();
    let owner = null;
    const classList = event.currentTarget.classList;
    const card = event.type === "contextmenu" ? event.target.closest(".feature-controls") : event.currentTarget.closest(".feature-controls");
    const actorId = card.dataset.actorId;
    if (actorId) owner = game.actors.get(actorId) ?? await fromUuid(actorId); // this section is to keep chat compatibilities with version 0.7.4 and ealier
    owner = owner?.actor ?? owner;
    if (!owner) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.originTokenMissing"));
    const itemSource = owner.items.get(card.dataset.itemId);

    let stuntDie = null;
    let addFocus = false;
    let resistedDamage = false;
    if (classList.contains('add-stunt-damage')) {
        stuntDie = card.dataset.stuntDie;
    };
    if (classList.contains('add-focus-damage')) {
        addFocus = true;
    };
    if (classList.contains('resisted')) {
        resistedDamage = true;
    };

    const damageData = {
        event: event,
        stuntDie: stuntDie,
        addFocus: addFocus,
        atkDmgTradeOff: card.dataset.atkdmgTrade,
        resistedDmg: resistedDamage,
    };
    itemSource.rollDamage(damageData);
};

export async function chatFatigueRoll(event) {
    let owner = null;
    const card = event.currentTarget.closest(".feature-controls");
    const actorId = card.dataset.actorId;
    owner = await fromUuid(actorId) ?? game.actors.get(actorId); // this section is to keep chat compatibilities with version 0.7.4 and ealier
    owner = owner?.actor ?? owner;
    if (!owner) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.originTokenMissing"));
    const itemSource = owner.items.get(card.dataset.itemId);
    itemSource.roll(event, "fatigue");
};

export async function rollItemFromChat(event) {
    const classList = event.currentTarget.classList;
    const actorUuid = event.currentTarget.closest(".feature-controls").dataset.ownerUuid;
    const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
    let owner = await fromUuid(actorUuid);
    owner = owner?.actor ?? owner;
    const item = owner.items.get(itemId);
    if (classList.contains("damage")) item.rollDamage({event});
    if (classList.contains("attack")) item.roll(event);
}

export async function sortCustomAgeChatCards(chatCard, html, data) {
    // Add attribute type="button" to AGE buttons
    _buttonType(html.find(".age-system.item-chat-controls button"));
    _buttonType(html.find("button.age-button"));

    // Toggle chat card visibility of AGE Roll Cards
    if (html.find(".base-age-roll").length > 0) _handleAgeRollVisibility(html, chatCard, data);

    // Check permission level to show and roll chat buttons when rolling item card
    if (html.find(".item-chat-controls").length > 0) _handleItemCardButton(html);
};

function _buttonType(buttons) {
    for (let b = 0; b < buttons.length; b++) {
        const button = buttons[b];
        button.type = "button";
    }
}

async function _handleAgeRollVisibility(html, chatCard, chatData){
    const element = html.find(".age-system.base-age-roll .feature-controls");
    for (let e = 0; e < element.length; e++) {
        const el = element[e];
        const data = el.dataset;
        const actorId = data.actorId;
        let actor;
        if (actorId) actor = game.actors.get(actorId) ?? await fromUuid(actorId); // this section is to keep chat compatibilities with version 0.7.4 and ealier
        actor = actor?.actor ?? actor;
        const isBlind = chatCard.data.blind;
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
        if (!game.user.isGM) el.querySelector(".gm-only").remove();
    }
}

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

function _permCheck(actorPerm, element) {
    if (!element) return
    const validPerm = [CONST.ENTITY_PERMISSIONS.OWNER];
    if (game.settings.get("age-system", "observerRoll")) validPerm.push(CONST.ENTITY_PERMISSIONS.OBSERVER);
    if (!validPerm.includes(actorPerm)) element.remove();
}