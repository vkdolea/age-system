export class ageToken extends Token {
    async _onCreate(tokenData, options, userId) {
        await super._onCreate(tokenData, options, userId);
        // Ensure this change occurs only once
        if (game.user.id !== userId) return
        if (this.actor?.data?.type !== "char") return;
        const updateData = {};
        // if (!this.data.bar1?.attribute) updateData["bar1.attribute"] = "health";
        // if (!this.data.bar2?.attribute) {
        //     const barData = await game.settings.get("age-system", "usePowerPoints") ? "powerPoints" : ((this.actor.hasPlayerOwner) && (await game.settings.get("age-system", "useConviction")) ? "conviction" : null);
        //     updateData["bar2.attribute"] = barData;
        // }
        if (this.actor.hasPlayerOwner) {
            updateData["displayBars"] = 10;
            updateData["disposition"] = 1;
            updateData["actorLink"] = true;
        } else {
            updateData["displayBars"] = 20;
        };

        await this.document.update(updateData);
    }
};