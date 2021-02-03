export function addChatListeners(html) {
    html.on('click', '.roll-damage', chatDamageRoll);
    html.on('click', '.roll-fatigue', chatFatigueRoll);
};

export function chatDamageRoll(event) {
    let owner = null;
    const card = event.currentTarget.closest(".feature-controls");
    // const isToken = card.dataset.actorToken;
    const actorId = card.dataset.actorId;
    owner = game.actors.tokens[actorId];
    if (!owner) owner = game.actors.get(actorId);
    if (!owner) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.originTokenMissing"));
    const itemSource = owner.getOwnedItem(card.dataset.itemId);

    let stuntDie = null;
    let addFocus = false;
    if (event.currentTarget.classList.contains('add-stunt-damage')) {
        stuntDie = card.dataset.stuntDie;
    };
    if (event.currentTarget.classList.contains('add-focus-damage')) {
        addFocus = true;
    };

    const damageData = {
        event: event,
        stuntDie: stuntDie,
        addFocus: addFocus,
        atkDmgTradeOff: card.dataset.atkdmgTrade
    };
    itemSource.rollDamage(damageData);
};

export function chatFatigueRoll(event) {
    let owner = null;
    const card = event.currentTarget.closest(".feature-controls");
    // const isToken = card.dataset.actorToken;
    const actorId = card.dataset.actorId;
    owner = game.actors.tokens[actorId];
    if (!owner) owner = game.actors.get(actorId);
    if (!owner) return ui.notifications.warn(game.i18n.localize("age-system.WARNING.originTokenMissing"));
    const itemSource = owner.getOwnedItem(card.dataset.itemId);
    itemSource.roll(event, "fatigue");
};

export function selectBlindAgeRoll(chatCard, html, data) {
    const isBlind = data.message.blind;
    const isGM = game.user.isGM;
    let ageCard = html.find(".base-age-roll");
    if (ageCard.length > 0) {
        if (isBlind) {
            if (isGM) {
                html.find(".blind-roll-card").css("display", "none");
            } else {
                html.find(".regular-roll-card").css("display", "none");
            };
        } else {
            html.find(".blind-roll-card").css("display", "none");
        };
    };
};