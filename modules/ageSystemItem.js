import * as Dice from "./dice.js";

export class ageSystemItem extends Item {

    // Check if Item can cause damage
    get hasDamage() {
        const type = this.data.type;
        if (type === "weapon") {return true};
        if (type === "power" && this.data.data.causeDamage === true) {return true};
        return false;
    };

    // Check if Item heals
    get hasHealing() {
        const type = this.data.type;
        if (type === "power" && this.data.data.causeHealing === true) {return true};
        return false;
    }

    // Check if Item requires Fatigue roll to be used
    get hasFatigue() {
        if (this.data.type === "power" && this.data.data.useFatigue) {return game.settings.get("age-system", "useFatigue")};
        return false;
    };

    // Check attack formula
    get attackBonus() {
        if (!this.hasDamage || !this.actor?.data) return null;
        const actor = this.actor.data.data;
        const item = this.data.data;
        const useFocus = this.actor.checkFocus(this.data.data.useFocus);
        let bonus = useFocus.focusAbl + useFocus.value;
        const actorMods = [
            {mod: "testMod", value: 0},
            {mode: "attackMod", value: 0}
        ];
        const itemMods = [
            {mod: "itemActivation", value: 0}
        ]
        if (actor.ownedBonus) {
            for (let am = 0; am < m.length; am++) {
                const m = actorMods[am];
                if (actor.ownedBonus[m.mod]) bonus += m.value;
            };
        };
        for (let am = 0; am < m.length; am++) {
            const m = itemMods[am];
            if (item.itemMods[m.mod].selected && item.itemMods[m.mod].isActive) bonus += m.value;
        };

        return bonus;
    }

    // Damage formula
    get damageFormula() {
        if (!this.hasDamage || !this.actor?.data) return null;
        const actor = this.actor.data.data;
        const item = this.data.data;
        let bonus = actor.abilities[item.dmgAbl].total + item.extraValue;
        const actorMods = [
            {mod: "actorDamage", value: 0},
            {mode: "attackMod", value: 0}
        ];
        const itemMods = [
            {mod: "itemDamage", value: 0}
        ]
        if (actor.ownedBonus) {
            for (let am = 0; am < m.length; am++) {
                const m = actorMods[am];
                if (actor.ownedBonus[m.mod]) bonus += m.value;
            };
        };
        for (let am = 0; am < m.length; am++) {
            const m = itemMods[am];
            if (item.itemMods[m.mod].selected && item.itemMods[m.mod].isActive) bonus += m.value;
        };
        const bonusString = bonus < 0 ? `${bonus}` : `+${bonus}`;
        const formula = item.nrDice > 0 ? `${item.nrDrice}d${item.diceType} ${bonusString}` : `${bonusString}`;

        return formula;
    }
    
    /** @override */
    prepareBaseData() {
        // super.prepareData();
        
        if (this.data.img === "icons/svg/item-bag.svg") {
            if (!CONFIG.ageSystem.itemIcons[this.data.type]) this.data.img = "icons/svg/item-bag.svg";
            this.data.img = CONFIG.ageSystem.itemIcons[this.data.type];
        };
        if (!this.data.name) this.data.name = "New " + game.i18n.localize(this.data.type);
        
        const itemData = this.data;
        const data = itemData.data;
        const itemType = itemData.type;

        data.colorScheme = `colorset-${game.settings.get("age-system", "colorScheme")}`;
        data.nameLowerCase = itemData.name.toLowerCase();
        // data.useFocusActorId = this._idFocusToUse(itemType, data.useFocus);

        // Adding common data for Power and Weapon
        if (["power", "weapon"].includes(itemType)) {
            data.useFocusActorId = data.useFocus && this.actor?.data ? this.actor.checkFocus(data.useFocus).id : null;
            data.useFocusActor = this.actor?.data ? this.actor.checkFocus(data.useFocus) : null;
            data.hasDamage = this.hasDamage;
            data.hasHealing = this.hasHealing;
            data.hasFatigue = this.hasFatigue;

            // Adds value to represent portion added to dice on damage roll
            if (this.isOwned && this.actor?.data) {
                if (data.dmgAbl) {
                    if (data.dmgAbl !== "no-abl") {
                        data.ablDamageValue = this.actor.data.data.abilities[data.dmgAbl].total;
                    }
                }
                if (data.damageResisted) {
                    if (data.damageResisted.dmgAbl !== "no-abl") {
                        data.damageResisted.ablDamageValue = this.actor.data.data.abilities[data.damageResisted.dmgAbl].total;
                    }                
                }
            };

            // Evaluate Attack and Damage modifier
            if (data.hasDamage || data.hasHealing) {
                const actor = this.actor?.data?.data;
                const useFocus = actor ? this.actor.checkFocus(this.data.data.useFocus) : null;

                // Attack Mod
                let atkBonus = useFocus ? useFocus.value : 0;
                atkBonus += actor ? actor.abilities[data.useAbl].total ?? 0 : 0;
                const atkBonusActor = ["testMod", "attackMod"];
                if (actor?.ownedBonus) {
                    for (let am = 0; am < atkBonusActor.length; am++) {
                        const modName = atkBonusActor[am];
                        if (actor.ownedBonus[modName]) atkBonus += actor.ownedBonus[modName].value;
                    };
                };
                const atkBonusItem = ["itemActivation"];
                for (let am = 0; am < atkBonusItem.length; am++) {
                    const modName = atkBonusItem[am];
                    if (data.itemMods[modName].selected && data.itemMods[modName].isActive) atkBonus += data.itemMods[modName].value;
                };
                data.atkRollMod = atkBonus;

                // Damage Formula
                let dmgBonus = 0;
                const dmgBonusActor = ["actorDamage"];
                if (actor?.ownedBonus) {
                    for (let am = 0; am < dmgBonusActor.length; am++) {
                        const modName = dmgBonusActor[am];
                        if (actor.ownedBonus[modName]) dmgBonus += actor.ownedBonus[modName].value;
                    };
                };
                const dmgBonusItem = ["itemDamage"];
                for (let am = 0; am < dmgBonusItem.length; am++) {
                    const modName = dmgBonusItem[am];
                    if (data.itemMods[modName].selected && data.itemMods[modName].isActive) dmgBonus += data.itemMods[modName].value;
                };
                const abl = data.dmgAbl === "no-abl" ? null : data.dmgAbl;
                let actorAblDmg = 0;
                actorAblDmg += this.actor?.data?.data?.abilities?.[abl]?.total ?? 0;
                data.dmgFormula = `${data.nrDice}d${data.diceType}+` + Roll.safeEval(`${dmgBonus} + ${data.extraValue} + ${actorAblDmg}`);
            }

        }

        switch (itemType) {
            case "focus": return this._prepareFocus(data);
            case "power": return this._preparePower(data);
            case "shipfeatures": return this._prepareShipFeatures(data);
        }

        this.prepareEmbeddedEntities();        
    };

    _prepareFocus(data) {
        data.finalValue = data.improved ? data.initialValue + 1 : data.initialValue;
        if (this.isOwned && this.actor?.data) {
            const focusBonus = this.actor.data.data.ownedMods?.focus;
            if (focusBonus) {
                for (let f = 0; f < focusBonus.length; f++) {
                    const bonus = focusBonus[f];
                    if (data.nameLowerCase === bonus.name.toLowerCase()) data.finalValue += bonus.value;
                }
            }
        }
    }

    _preparePower(data) {
        const useFatigue = game.settings.get("age-system", "useFatigue");
        if (!useFatigue) data.useFatigue = false;

        // Calculate Item Force
        data.itemForce = 10;
        if (data.itemMods.powerForce.isActive && data.itemMods.powerForce.selected) data.itemForce += data.itemMods.powerForce.value;
        
        // Calculate derived data
        data.powerPointCostTotal = data.powerPointCost;
        if (this.actor?.data) {
            if ((data.itemForceAbl !== "") && (data.itemForceAbl !== "no-abl")) data.itemForce += this.actor.data.data.abilities[data.itemForceAbl].total;
            data.itemForce += data.useFocusActor.value;
            data.powerPointCostTotal += this.actor.data.data.armor.strain;
        };

        // Calculate Fatigue TN if it is not a manual input
        if (data.inputFatigueTN === false) data.fatigueTN = 9 + Math.floor(Number(data.powerPointCost)/2);
    }

    _prepareShipFeatures(data) {};

    // Rolls damage for the item
    rollDamage({
        event = null,
        stuntDie = null,
        addFocus = false,
        atkDmgTradeOff = 0,
        resistedDmg = false}={}) {

        if (!this.data.data.hasDamage && !this.data.data.hasHealing) return false;

        const damageData = {
            // event: event,
            // atkDmgTradeOff: atkDmgTradeOff,
            // stuntDie: stuntDie,
            // addFocus: addFocus,
            // resistedDmg: resistedDmg,
            ...arguments[0],
            item: this,
            actorDmgMod: this.actor ? this.actor.data.data.dmgMod : 0,
            actorWgroups: this.actor.data.data.wgroups
        };
        return Dice.itemDamage(damageData);
    };

    // Roll item and check targetNumbers
    roll(event, rollType = null, targetNumber = null) {
        /**Roll Type Possibilities
         * - fatigue
         * - attack
         * - powerActivation
         */
        const owner = this.actor;
        if (!owner) return false;
        let ablCode = (rollType === "fatigue") ? this.data.data.ablFatigue : this.data.data.useAbl;

        if (rollType === null) {
            switch (this.type) {
                case "weapon":
                    rollType = "attack"
                    break;
                case "power":
                    rollType = "powerActivation"
                default:
                    break;
            }
        }
        
        if (targetNumber === null) {
            switch (rollType) {
                case "fatigue":
                    ablCode = this.data.data.ablFatigue;
                    targetNumber = this.data.data.fatigueTN ? this.data.data.fatigueTN : null;
                    break;
                
                case "powerActivation":
                    targetNumber = this.data.data.targetNumber ? this.data.data.targetNumber : null;
                    break;
    
                case "attack":
                    const targets = game.user.targets;
                    if (targets.size === 0) break;
                    if (targets.size > 1) {
                        // TODO - add case for multiple targets attacked
                        let warning = game.i18n.localize("age-system.WARNING.selectOnlyOneTarget");
                        ui.notifications.warn(warning);
                        return;
                    } else {
                        const targetId = targets.ids[0];
                        const targetToken = canvas.tokens.placeables.find(t => t.data._id === targetId);
                        targetNumber = targetToken.actor.data.data.defense.total;
                    }
                    break;
        
                default:
                    break;
            }
        }

        const rollData = {
            event: event,
            actor: owner,
            abl: ablCode,
            itemRolled: this,
            rollTN: targetNumber,
            rollType
        }
        Dice.ageRollCheck(rollData);
    };

    chatTemplate = {
        "weapon": "systems/age-system/templates/sheets/weapon-sheet.hbs",
        "focus": "systems/age-system/templates/sheets/focus-sheet.hbs",
        "stunts": "systems/age-system/templates/sheets/stunts-sheet.hbs",
        "talent": "systems/age-system/templates/sheets/talent-sheet.hbs",
        "equipment": "systems/age-system/templates/sheets/equipment-sheet.hbs",
        "power": "systems/age-system/templates/sheets/power-sheet.hbs",
        "relationship": "systems/age-system/templates/sheets/relationship-sheet.hbs",
        "honorifics": "systems/age-system/templates/sheets/honorifics-sheet.hbs",
        "membership": "systems/age-system/templates/sheets/membership-sheet.hbs",
        "shipfeatures": "systems/age-system/templates/sheets/shipfeatures-sheet.hbs"
    };

    async showItem(forceSelfRoll = false) {
        const rollMode = game.settings.get("core", "rollMode");       
        const cardData = {
            inChat: true,
            name: this.data.name,
            data: this.data,
            item: this,
            itemId: this.id,
            owner: this.actor,
            ownerUuid: this.actor.uuid,
            colorScheme: game.settings.get("age-system", "colorScheme"),
            config: {wealthMode: game.settings.get("age-system", "wealthType")}
        };
        const chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            roll: false,
            content: await renderTemplate(this.chatTemplate[this.type], cardData)
        };
        if (forceSelfRoll) {
            chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
            chatData.whisper = [game.user.id];
        } else {
            ChatMessage.applyRollMode(chatData, rollMode);
        }
        return ChatMessage.create(chatData);
    };
};