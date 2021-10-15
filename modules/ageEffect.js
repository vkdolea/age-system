export class ageEffect extends ActiveEffect {

    async _onDelete(options, userId) {
        super._onDelete(options, userId);
        // Ensure this change occurs only once
        if (game.user.id !== userId) return
        const isCondition = this.data.flags?.["age-system"]?.type === "conditions" ? true : false;
        if (isCondition) {
            const condId = this.data.flags.core.statusId;
            const actor = this.parent;
            const isChecked = actor.data.data.conditions[condId];
            if (isChecked) {
                const path = `data.conditions.${condId}`;
                const updateData = {[path]: false};
                await actor.update(updateData);
            }
        }
    }

    async _onCreate(effectData, options, userId) {
        super._onCreate(effectData, options, userId);
        // Ensure this change occurs only once
        if (game.user.id !== userId) return

        const isCondition = effectData.flags?.["age-system"]?.type === "conditions" ? true : false;
        if(isCondition) {
            const condId = effectData.flags.core.statusId;
            const actor = this.parent;
            const isChecked = actor.data.data.conditions[condId];
            if (!isChecked) {
                const path = `data.conditions.${condId}`;
                const updateData = {[path]: true};
                await actor.update(updateData);
            }
        }
    }
};