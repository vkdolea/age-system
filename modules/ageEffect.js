export class ageEffect extends ActiveEffect {

    _onDelete(options, userId) {
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
                return actor.update(updateData);
            }
        }
    }

    _onCreate(options, userId) {
        super._onCreate(options, userId);
        // Ensure this change occurs only once
        if (game.user.id !== userId) return

        const isCondition = activeEffectData.flags?.["age-system"]?.type === "conditions" ? true : false;
        if(isCondition) {
            const condId = activeEffectData.flags.core.statusId;
            const actor = activeEffect.parent;
            const isChecked = actor.data.data.conditions[condId];
            if (!isChecked) {
                const path = `data.conditions.${condId}`;
                const updateData = {[path]: true};
                return actor.update(updateData);
            }
        }
    }
};