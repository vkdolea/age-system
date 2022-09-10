export class ageTokenDocument extends TokenDocument {
    async _onCreate(tokenData, options, userId) {
        await super._onCreate(tokenData, options, userId);
        // Ensure this change occurs only once
        if (game.user.id !== userId) return
        if (this.actor?.type !== "char") return;
        const updateData = {};
        const coreToken = game.settings.get("core", "defaultToken");
        if (!this.bar1?.attribute && !coreToken.bar1) updateData["bar1.attribute"] = "health";
        if (!this.bar2?.attribute && !coreToken.bar2) {
            const barData = await game.settings.get("age-system", "usePowerPoints") ? "powerPoints" : ((this.actor.hasPlayerOwner) && (await game.settings.get("age-system", "useConviction")) ? "conviction" : null);
            if (barData) updateData["bar2.attribute"] = barData;
        }
        if (this.actor.hasPlayerOwner) {
            if (!coreToken.displayBars) updateData["displayBars"] = CONST.TOKEN_DISPLAY_MODES.CONTROL;
            updateData["disposition"] = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
            updateData["actorLink"] = true;
        } else {
            if (!coreToken.displayBars) updateData["displayBars"] = CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER;
        };

        await this.object.document.update(updateData);
    }
};