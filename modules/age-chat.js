export function addChatListeners(html) {
    html.on('click', '.roll-damage', chatDamageRoll);
    html.on('click', '.roll-fatigue', chatFatigueRoll);
};

export function chatDamageRoll(event) {
    const card = event.currentTarget.closest(".feature-controls");
    let stuntDie = null;
    let addFocus = false;
    if (event.currentTarget.classList.contains('add-stunt-damage')) {
        stuntDie = card.dataset.stuntDie;
    };
    if (event.currentTarget.classList.contains('add-focus-damage')) {
        addFocus = true;
    };
    const owner = game.actors.get(card.dataset.actorId); // TODO - tokens can act as owner - How to capture it from chat roll card?
    const damageSource = owner.getOwnedItem(card.dataset.itemId);

    const damageData = {
        event: event,
        stuntDie: stuntDie,
        addFocus: addFocus,
        atkDmgTradeOff: card.dataset.atkdmgTrade
    };
    damageSource.rollDamage(damageData);
    // damageSource.rollDamage(event, stuntDie, addFocus, atkDmgTradeOff);
};

export function chatFatigueRoll(event) {
    const card = event.currentTarget.closest(".feature-controls");
    const owner = game.actors.get(card.dataset.actorId);
    const itemSource = owner.getOwnedItem(card.dataset.itemId);
    itemSource.roll(event, "fatigue");
};

export function selectBlindAgeRoll(chatCard, html, data) {
    // let message = game.messages.object.collection.get(data._id);
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