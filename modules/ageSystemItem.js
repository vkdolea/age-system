import * as Dice from "./dice.js";

export class ageSystemItem extends Item {

    /** @override */
    prepareData() {
        
        if (!this.data.img) this.data.img = CONST.DEFAULT_TOKEN;
        if (!this.data.name) this.data.name = "New " + this.entity;       
        this.data = duplicate(this._data);

        if (!this.data.img) this.data.img = CONST.DEFAULT_TOKEN;

        const itemData = this.data;
        const data = itemData.data;
        const itemType = itemData.type;
        data.nameLowerCase = itemData.name.toLowerCase();
        data.useFocusActorId = null;

        /*
        * Focus value set as manual input - Improved checkbox used to indicate improved focus on Character Sheet
        */

        // Data initialization for Focus
        // if (itemType === "focus") {
        //     if (data.improved) {
        //         data.focusValue = data.initialValue + 1;
        //     } else {
        //         data.focusValue = data.initialValue;
        //     }
        // }

        // Adds value to represent portion added to dice on damage roll
        if (this.isOwned && this.hasDamage()) {
            data.ablDamageValue = this.actor.data.data.abilities[data.useAbl].total;
        };

        // Identify related Weapon/Power Focus ID owned by Actor
        if (this.isOwned && (itemType === "weapon" || itemType === "power")) {
            const owner = this.actor;
            const focusOwned = owner.data.items.filter(i => i.type === "focus");
            const focusArr = focusOwned.filter(i => i.name.toLowerCase() === data.useFocus.toLowerCase());
            // Originalmente:
            // const focusArr = focusOwned.filter(i => i.data.nameLowerCase === data.useFocus.toLowerCase());

            if (focusArr.length === 1) {
                data.useFocusActorId = focusArr[0]._id;
            };

        };

        // Identify specific flags for the Power item type
        if (itemType === "power") {
            data.itemForce = 10;
            if (data.itemMods.powerForce.isActive) {
                data.itemForce += data.itemMods.powerForce.value;
            };

            // Adds ability to itemForce
            if (this.actor) {
                data.itemForce += this.actor.data.data.abilities[data.useAbl].total;
                data.itemForce += this.ownerFocusValue();
            };
            
        }

        data.hasDamage = this.hasDamage();
        data.hasFatigue = this.hasFatigue();

        /** Damage Type table:
         *  damageType
         *  0: Impact
         *  1: Balistic
         *  2: Penetrating
         */

        /** Weapon Reload table:
         *  reload
         *  0: -
         *  1: Minor Action
         *  2: Major Action
         *  3: 1d6 Minor
         */

        /** Casting Time table:
         *  castingTime
         *  0: -
         *  1: Minor Action
         *  2: Major Action
         *  3: 1 Minute
         */
        this.prepareEmbeddedEntities();        
    };

    // Check if Item can cause damage
    hasDamage() {
        const type = this.type;
        if (type === "weapon") {return true};
        if (type === "power" && this.data.data.causeDamage === true) {return true};
        return false;
    };

    // Check if Item requires Fatigue roll to be used
    hasFatigue() {
        const type = this.type;
        if (type === "power") {return this.data.data.useFatigue};
        return false;
    };

    rollDamage(event) {
        if (!this.hasDamage()) {return false};
        return Dice.itemDamage(event, this);
    };

    rollFatigue(event) {
        if (!this.hasFatigue()) {return false};
        const data = this.data.data;
        return Dice.ageRollCheck(event, data.useAbl, this.ownerFocusEntity(), this, this.actor);
    };

    /** Returns owner's Focus value, base on Item's useFocus property
     * TODO = figure out how to add FocusValue on Power's Force
     */
    ownerFocusValue() {
        const itemData = this.data;
        const data = itemData.data;
        const owner = this.actor;

        if (data.useFocus === null || data.useFocus === "" || this.isOwned === false || owner === null) {
            return null;
        };

        const ownerFoci = owner.data.items.filter(a => a.type === "focus");
        const expectedFocus = data.useFocus.toLowerCase();
        const validFocus = ownerFoci.filter(c => c.name.toLowerCase() === expectedFocus);
        // Orignalmente:
        // const validFocus = ownerFoci.filter(c => c.data.nameLowerCase === expectedFocus);

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
        "membership": "systems/age-system/templates/sheets/membership-sheet.hbs"
    };

    // Returns owned Focus Item entity used to activate this item - false otherwise
    ownerFocusEntity() {
        const itemData = this.data;
        const data = itemData.data;
        const owner = this.actor;

        if (data.useFocus === null || data.useFocus === "" || this.isOwned === false || owner === null) {
            return null;
        };

        const ownerFoci = owner.data.items.filter(a => a.type === "focus");
        const expectedFocus = data.useFocus.toLowerCase();
        const validFocus = ownerFoci.filter(c => c.name.toLowerCase() === expectedFocus);
        // Orignalmente:
        // const validFocus = ownerFoci.filter(c => c.data.nameLowerCase === expectedFocus);

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
            owner: this.actor
        };
        
        chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);
        chatData.roll = false;

        return ChatMessage.create(chatData);
    };

    hasBonus() {
        if (this.data.data.bonuses.length < 1) {return false};
        return true;
    };
};