export function addChatListeners(html) {
    html.on('click', '.roll-damage', chatDamageRoll);
    html.on('click', '.roll-fatigue', chatFatigueRoll);
};

export function chatDamageRoll(event) {
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
        openOptions: true
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
    const isBlind = chatCard.data.blind;
    const isWhisper = data.isWhisper;
    const isGM = game.user.isGM;
    let ageCard = html.find(".base-age-roll");
    if (ageCard.length > 0) {
        if (isGM) {
            html.find(".blind-roll-card").css("display", "none");
        } else {
            if (isBlind || isWhisper) {
                html.find(".regular-roll-card").css("display", "none");
                const hideField = game.user.id === chatCard.data.user ? ".other-user-roll" : ".user-roll";
                html.find(`.blind-roll-card ${hideField}`).css("display", "none");
            } else {
                html.find(".blind-roll-card").css("display", "none");
            };
        };
    };
};