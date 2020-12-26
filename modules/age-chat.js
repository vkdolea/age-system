export function addChatListeners(html) {
    html.on('click', '.roll-damage', chatDamageRoll);
};

export function chatDamageRoll(event) {
    const card = event.currentTarget.closest(".feature-controls");
    const owner = game.actors.get(card.dataset.actorId);
    const damageSource = owner.getOwnedItem(card.dataset.itemId);
    damageSource.rollDamage(event);
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