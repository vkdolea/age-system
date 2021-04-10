import * as Dice from "./dice.js";

export class ageSystemItem extends Item {
    
    /** @override */
    prepareData() {
        
        if (!this.data.img) {
            if (!CONFIG.ageSystem.itemIcons[this.type]) this.data.img = CONST.DEFAULT_TOKEN;
            this.data.img = CONFIG.ageSystem.itemIcons[this.type];
        };
        if (!this.data.name) this.data.name = "New " + this.entity;       
        this.data = duplicate(this._data);
        if (this.data.type === "shipfeatures") return this._prepareShipFeatures();
        
        const itemData = this.data;
        const data = itemData.data;
        const itemType = itemData.type;

        data.nameLowerCase = itemData.name.toLowerCase();
        data.useFocusActorId = this._idFocusToUse(itemType, data.useFocus);
        data.hasDamage = this._hasDamage(itemType);
        data.hasHealing = this._hasHealing(itemType);
        data.hasFatigue = this._hasFatigue(itemType);
        data.hasModificators = this._hasModificators();
    
        // Adds reference to in-use color scheme
        data.colorScheme = `colorset-${game.settings.get("age-system", "colorScheme")}`;

        // Adds value to represent portion added to dice on damage roll
        if (this.isOwned) {
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

        // Data preparation for Power item type
        if (itemType === "power") {

            const useFatigue = game.settings.get("age-system", "useFatigue");
            if (!useFatigue) {data.useFatigue = false};

            // Calculate Item Force
            data.itemForce = 10;
            if (data.itemMods.powerForce.isActive) {data.itemForce += data.itemMods.powerForce.value};
            // Adds ability to itemForce
            if (this.actor) {
                if ((data.itemForceAbl !== "") && (data.itemForceAbl !== "no-abl")) {
                    data.itemForce += this.actor.data.data.abilities[data.itemForceAbl].total;
                };
                data.itemForce += this._ownerFocusValue();
            };

            // Calculate Fatigue TN if it is not a manual input
            if (data.inputFatigueTN === false) {data.fatigueTN = 9 + Math.floor(Number(data.powerPointCost)/2)};
            
        }

        this.prepareEmbeddedEntities();        
    };

    _prepareShipFeatures() {
        const itemData = this.data;
        const data = itemData.data;
        const featType = data.type;

        switch (featType) {
            case "sensorMod":
                data.quality = data[featType] < 0 ? "flaw" : "quality";
                break;
            
            case "maneuverSizeStep":
                data.quality = data[featType] >= 0 ? "flaw" : "quality";
                break;
            
            case "juiceMod":
                data.quality = data[featType] <= 0 ? "flaw" : "quality";
                break;

            case "hullPlating":
                data.quality = data[featType] <= 0 ? "flaw" : "quality";
                break;

            case "hullMod":
                data.quality = data[featType] < 0 ? "flaw" : "quality";
                break;
                
            default:
                break;
        }
        
        this.prepareEmbeddedEntities();
    };

    _idFocusToUse(itemType, useFocus) {
        if (this.isOwned && (itemType === "weapon" || itemType === "power")) {
            const owner = this.actor;
            const focusOwned = owner.data.items.filter(i => i.type === "focus");
            const focusArr = focusOwned.filter(i => i.name.toLowerCase() === useFocus.toLowerCase());
            // Originalmente:
            // const focusArr = focusOwned.filter(i => i.data.nameLowerCase === data.useFocus.toLowerCase());

            if (focusArr.length === 1) {
                return focusArr[0]._id;
            } else return null;

        } else return null;
    }

    _hasModificators() {
        const inCheckMods = this.data.data.itemMods;
        for (const key in inCheckMods) {
            if (inCheckMods.hasOwnProperty(key) && inCheckMods[key].isActive) {
                return true;
            };
        };
        return false;
    };    

    // Check if Item can cause damage
    _hasDamage(type) {
        if (type === "weapon") {return true};
        // if (!this.data.data.causeDamage) {return false};
        if (type === "power" && this.data.data.causeDamage === true) {return true};
        return false;
    };

    // Check if Item heals
    _hasHealing(type) {
        // if (!this.data.data.causeHealing) return false
        if (type === "power" && this.data.data.causeHealing === true) {return true};
        return false;
    }

    // Check if Item requires Fatigue roll to be used
    _hasFatigue(type) {
        if (type === "power") {return this.data.data.useFatigue};
        return false;
    };

    // Rolls damage for the item
    rollDamage({
        event = null,
        stuntDie = null,
        addFocus = false,
        atkDmgTradeOff = 0,
        resistedDmg = false}={}) {

        if (!this.data.data.hasDamage && !this.data.data.hasHealing) {return false};
        const damageData = {
            event: event,
            item: this,
            stuntDie: stuntDie,
            addFocus: addFocus,
            atkDmgTradeOff: atkDmgTradeOff,
            resistedDmg: resistedDmg
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
        if (!owner) {return false;}
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

    /** Returns owner's Focus value, base on Item's useFocus property
     * TODO = figure out how/if derived data can be input to another Item
     */
    _ownerFocusValue() {
        const itemData = this.data;
        const data = itemData.data;
        const owner = this.actor;

        if (data.useFocus === null || data.useFocus === "" || this.isOwned === false || owner === null) {
            return null;
        };

        const ownerFoci = owner.data.items.filter(a => a.type === "focus");
        const expectedFocus = data.useFocus.toLowerCase();
        const validFocus = ownerFoci.filter(c => c.name.toLowerCase() === expectedFocus);

        if (validFocus.length < 1) {
            return 0;
        } else {
            const value = validFocus[0].data.initialValue;
            return value;
        };    
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

    // Returns owned Focus Item entity used to activate this item - false otherwise
    _ownerFocusEntity() {
        const itemData = this.data;
        const data = itemData.data;
        const owner = this.actor;

        if (data.useFocus === null || data.useFocus === "" || this.isOwned === false || owner === null) {
            return null;
        };

        const ownerFoci = owner.data.items.filter(a => a.type === "focus");
        const expectedFocus = data.useFocus.toLowerCase();
        const validFocus = ownerFoci.filter(c => c.name.toLowerCase() === expectedFocus);

        if (validFocus.length < 1) {
            return data.useFocus;
        } else {
            const id = validFocus[0]._id;
            return this.actor.getOwnedItem(id);
        };    
    };

    async showItem() {
        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker()
        };

        let cardData = {
            inChat: true,
            name: this.data.name,
            data: this.data.data,
            item: this,
            owner: this.actor,
            colorScheme: game.settings.get("age-system", "colorScheme"),
            config: {}
        };
        cardData.config.wealthMode = game.settings.get("age-system", "wealthType");

        
        chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);
        chatData.roll = false;

        return ChatMessage.create(chatData);
    };

    _hasBonus() {
        if (this.data.data.bonuses.length < 1) {return false};
        return true;
    };
};