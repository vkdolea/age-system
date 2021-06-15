export function addChatListeners(html) {
    html.on('click', '.roll-damage', chatDamageRoll);
    html.on('contextmenu', '.roll-damage', chatDamageRoll);
    html.on('click', '.roll-fatigue', chatFatigueRoll);
    html.on('contextmenu', '.roll-fatigue', chatFatigueRoll);
    html.on('click', '.roll-item', rollItemFromChat);
    html.on('contextmenu', '.roll-item', rollItemFromChat);
};

export async function chatDamageRoll(event) {
    event.preventDefault();
    let owner = null;
    const card = event.currentTarget.closest(".feature-controls");
    const actorId = card.dataset.actorId;
    if (actorId) owner = game.actors.get(actorId) ?? await fromUuid(actorId); // this section is to keep chat compatibilities with version 0.7.4 and ealier
    owner = owner?.actor ?? owner;
    if (!owner) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.originTokenMissing"));
    const itemSource = owner.items.get(card.dataset.itemId);

    let stuntDie = null;
    let addFocus = false;
    let resistedDamage = false;
    if (event.currentTarget.classList.contains('add-stunt-damage')) {
        stuntDie = card.dataset.stuntDie;
    };
    if (event.currentTarget.classList.contains('add-focus-damage')) {
        addFocus = true;
    };
    if (event.currentTarget.classList.contains('resisted')) {
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
    const itemSource = owner.getOwnedItem(card.dataset.itemId);
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
    const buttons = html.find(".age-system.item-chat-controls button");
    for (let b = 0; b < buttons.length; b++) {
        const button = buttons[b];
        button.type = "button";
    }

    // Check permission level to roll chat buttons
    // ==> Add a Condition and source

    // Toggle chat card visibility of AGE Roll Cards
    const htmlData = html.find(".age-system.base-age-roll .feature-controls");
    if (htmlData === html || !htmlData[0]?.dataset) return
    const actorId = htmlData[0].dataset.actorId;
    let actor;
    if (actorId) actor = game.actors.get(actorId) ?? await fromUuid(actorId); // this section is to keep chat compatibilities with version 0.7.4 and ealier
    actor = actor?.actor ?? actor;
    const isBlind = chatCard.data.blind;
    const isWhisper = data.isWhisper;
    const whisperTo = data.message.whisper;
    const author = data.author.id;
    const isGM = game.user.isGM;
    const userId = game.user.id;
    let ageCard = html.find(".base-age-roll");
    
    if (ageCard.length > 0) {
        if ((whisperTo.includes(userId) || whisperTo.length < 1 || author === userId) && !isBlind) {
            html.find(".blind-roll-card").css("display", "none");
        } else {
            if (isBlind && whisperTo.includes(userId)) {
                html.find(".blind-roll-card").css("display", "none");
            } else {
                html.find(".regular-roll-card").css("display", "none");
                const hideField = userId === author ? ".other-user-roll" : ".user-roll";
                html.find(`.blind-roll-card ${hideField}`).css("display", "none");
            }
        }
        const validPerm = [CONST.ENTITY_PERMISSIONS.OWNER];
        if (game.settings.get("age-system", "observerRoll")) validPerm.push(CONST.ENTITY_PERMISSIONS.OBSERVER);
        if (!validPerm.includes(actor?.permission)) html.find(`.age-chat-buttons-grid`).css("display", "none");
    };
};