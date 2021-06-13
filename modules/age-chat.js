export function addChatListeners(html) {
    html.on('click', '.roll-damage', chatDamageRoll);
    html.on('contextmenu', '.roll-damage', chatDamageRoll);
    html.on('click', '.roll-fatigue', chatFatigueRoll);
    html.on('contextmenu', '.roll-fatigue', chatFatigueRoll);
};

export function chatDamageRoll(event) {
    event.preventDefault();
    let owner = null;
    const card = event.currentTarget.closest(".feature-controls");
    const isToken = card.dataset.actorToken;
    const actorId = card.dataset.actorId;
    if (isToken === "1") {
        owner = game.actors.tokens[actorId];
    } else {
        owner = game.actors.get(actorId);
    };
    // owner = game.actors.tokens[actorId];
    // if (!owner) owner = game.actors.get(actorId);
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

export function chatFatigueRoll(event) {
    let owner = null;
    const card = event.currentTarget.closest(".feature-controls");
    const isToken = card.dataset.actorToken;
    const actorId = card.dataset.actorId;
    if (isToken === "1") {
        owner = game.actors.tokens[actorId];
    } else {
        owner = game.actors.get(actorId);
    };
    // owner = game.actors.tokens[actorId];
    // if (!owner) owner = game.actors.get(actorId);
    if (!owner) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.originTokenMissing"));
    const itemSource = owner.getOwnedItem(card.dataset.itemId);
    itemSource.roll(event, "fatigue");
};

export function selectBlindAgeRoll(chatCard, html, data) {
    const htmlData = html.find(".age-system.base-age-roll .feature-controls");
    if (htmlData === html || !htmlData[0]?.dataset) return
    const actorId = htmlData[0].dataset.actorId;
    const actor = game.actors.get(actorId);
    const isBlind = chatCard.data.blind;
    const isWhisper = data.isWhisper;
    const whisperTo = data.message.whisper;
    const author = data.author.id;
    const isGM = game.user.isGM;
    const userId = game.user.id;
    // const actorId = html.closest(".feature-controls").dataset.actorId;
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