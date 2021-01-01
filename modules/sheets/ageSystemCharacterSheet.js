import * as Dice from "../dice.js";

export default class ageSystemCharacterSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            height: 800,
            classes: ["age-system", "sheet", "char", `colorset-${game.settings.get("age-system", "colorScheme")}`]
        });
    }

    focusContextMenu = [
        {
            name: game.i18n.localize("age-system.settings.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: e => {
                const item = this.actor.getOwnedItem(e.data("focus-id"));
                item.sheet.render(true);
            }
        },
        {
            name: game.i18n.localize("age-system.settings.delete"),
            icon: '<i class="fas fa-trash"></i>',
            callback: e => {
                const i = this.actor.deleteOwnedItem(e.data("focus-id"));
            }
        },
        {
            name: game.i18n.localize("age-system.settings.changeRollContext"),
            icon: '<i class="fas fa-exchange-alt"></i>',
            // TODO - try to add the Shift + Click rolling to GM inside this callback
            callback: e => {
                const focus = this.actor.getOwnedItem(e.data("focus-id"));
                let d = Dice.dialogBoxAbilityFocus(focus, this.actor)
                d.render(true);
            }
        },
        {
            name: "Show Item",
            icon: '<i class="far fa-eye"></i>',
            callback: e => {
                const i = this.actor.getOwnedItem(e.data("focus-id")).showItem();
            }
        }
    ];

    get template() {
        return `systems/age-system/templates/sheets/${this.actor.data.type}-sheet.hbs`;
    }

    getData() {
        const data = super.getData();
        data.config = CONFIG.ageSystem;

        // Order itens into alphabetic order
        const itemSorted = data.items.sort(function(a, b) {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
        });

        data.weapon = itemSorted.filter(i => i.type === "weapon");
        data.talent = itemSorted.filter(i => i.type === "talent");
        data.power = itemSorted.filter(i => i.type === "power");
        data.focus = itemSorted.filter(i => i.type === "focus");
        data.stunts = itemSorted.filter(i => i.type === "stunts");
        // Order Stunts by stunt points, lowest to highest
        data.stunts = data.stunts.sort((a, b) => a.data.stuntPoints - b.data.stuntPoints);
        data.equipment = itemSorted.filter(i => i.type === "equipment");
        data.honorifics = itemSorted.filter(i => i.type === "honorifics");
        data.relationship = itemSorted.filter(i => i.type === "relationship");
        data.membership = itemSorted.filter(i => i.type === "membership");
    
        // Retrieve Prefession/Ancestry settings
        data.ancestry = game.settings.get("age-system", "ancestryOpt");
        data.occupation = game.settings.get("age-system", "occupation");

        // Return data to the sheet
        return data;
    };

    //  Modification on standard _onDropItem() to prevent user from dropping Focus with existing name
    async _onDropItem(event, data) {
        if ( !this.actor.owner ) return false;
        const item = await Item.fromDropData(data);
        /*-----------Beginning of added code--------------*/
        // Check if droped item is a Focus and then confirm if Actor already has a Focus with the same name
        // If positive, then returns FALSE
        if (item.data.type === "focus") {
            const itemNameLowerCase = item.name.toLowerCase();
            const ownedFoci = this.actor.itemTypes.focus;
            for (let i = 0; i < ownedFoci.length; i++) {
                const e = ownedFoci[i];
                const eName = e.data.data.nameLowerCase;
                if (eName === itemNameLowerCase) {
                    let warning = game.i18n.localize("age-system.WARNING.duplicatedFocus");
                    warning += `"${eName.toUpperCase()}"`;
                    ui.notifications.warn(warning);
                    return false;
                };            
            };
        };
        /*-------------End of added code------------------*/
        const itemData = duplicate(item.data);
        
        const actor = this.actor;
        // Handle item sorting within the same Actor
        let sameActor = (data.actorId === actor._id) || (actor.isToken && (data.tokenId === actor.token.id));
        if (sameActor) return this._onSortItem(event, itemData);

        // Create the owned item
        return this._onDropItemCreate(itemData);
    };

    activateListeners(html) {
        if (this.isEditable) {
            html.find(".item-edit").click(this._onItemEdit.bind(this));
            html.find(".item-delete").click(this._onItemDelete.bind(this));
            html.find(".item-show").click(this._onItemShow.bind(this));

        };
        
        // Actions by sheet owner only
        if (this.actor.owner) {
            new ContextMenu(html, ".focus-options", this.focusContextMenu);
            html.find(".roll-ability").click(this._onRollAbility.bind(this));
            html.find(".roll-focus").click(this._onRollFocus.bind(this));
            html.find(".roll-item").click(this._onRollItem.bind(this));
            html.find(".roll-damage").click(this._onRollDamage.bind(this));
            html.find(".defend-maneuver").change(this._onDefendSelect.bind(this));
            html.find(".guardup-maneuver").change(this._onGuardUpSelect.bind(this));
            html.find(".last-up").change(this._onLastUpSelect.bind(this));
            html.find(".roll-resources").click(this._onRollResources.bind(this));
            html.find(".item-equip").click(this._onItemActivate.bind(this));
        };

        super.activateListeners(html);
    };

    _onItemActivate(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const itemToToggle = this.actor.getOwnedItem(itemId);
        const itemType = itemToToggle.type;
        if (itemType === "power") {
            itemToToggle.data.data.activate = !itemToToggle.data.data.activate;
        } else {
            itemToToggle.data.data.equiped = !itemToToggle.data.data.equiped;
        };
        itemToToggle.update(itemToToggle.data);
    };

    _onRollResources(event) {
        Dice.ageRollCheck(event, null, null, null, this.actor, true);
    };

    _onLastUpSelect(ev) {
        const abl = ev.currentTarget.closest(".feature-controls").dataset.ablId;
        let actorAbls = {
            data: {
                abilities: {}
            }
        };
        for (const ablKey in this.actor.data.data.abilities) {
            if (Object.hasOwnProperty.call(this.actor.data.data.abilities, ablKey)) {
                actorAbls.data.abilities[ablKey] = {"lastUp": false};                
            };
        };
        actorAbls.data.abilities[abl].lastUp = true;
        this.actor.update(actorAbls);
    };

    _onDefendSelect(event) {
        const guardupStatus = event.currentTarget.closest(".feature-controls").dataset.guardupActive;
        const defendStatus = this.actor.data.data.defend.active;
        if (guardupStatus && !defendStatus) {
            this.actor.update({"data.guardUp.active": false});
        };
    };

    _onGuardUpSelect(event) {
        const defendStatus = event.currentTarget.closest(".feature-controls").dataset.defendActive;
        const guardupStatus = this.actor.data.data.guardUp.active;
        if (!guardupStatus && defendStatus) {
            this.actor.update({"data.defend.active": false});
        };
    };

    _onRollAbility(event) {
        const ablCode = event.currentTarget.closest(".feature-controls").dataset.ablId;
        Dice.ageRollCheck(event, ablCode, null, null, this.actor);
    };

    _onRollFocus(event) {
        const focusId = event.currentTarget.closest(".feature-controls").dataset.focusId;
        const focusRolled = this.actor.getOwnedItem(focusId);
        const ablCode = focusRolled.data.data.useAbl;
        Dice.ageRollCheck(event, ablCode, focusRolled, null, this.actor);
    };

    _onRollItem(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const itemRolled = this.actor.getOwnedItem(itemId);
        const ablCode = itemRolled.data.data.useAbl;
        const focusName = itemRolled.data.data.useFocus;

        let focusRolled = this.actor.getOwnedItem(itemRolled.data.data.useFocusActorId);
        if (!focusRolled) {
            focusRolled = focusName;
        };

        Dice.ageRollCheck(event, ablCode, focusRolled, itemRolled, this.actor);
    };

    _onItemShow(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);
        item.showItem();
    };

    _onItemEdit(event) {
        event.preventDefault();
        let e = event.currentTarget;
        let itemId = e.closest(".feature-controls").dataset.itemId;
        let item = this.actor.getOwnedItem(itemId);

        item.sheet.render(true);
    };

    _onItemDelete(event) {
        event.preventDefault();
        let e = event.currentTarget;
        let itemId = e.closest(".feature-controls").dataset.itemId;
        return this.actor.deleteOwnedItem(itemId);
    };

    _onRollDamage(event) {
        event.preventDefault();
        let e = event.currentTarget;
        let itemId = e.closest(".feature-controls").dataset.itemId;
        let item = this.actor.getOwnedItem(itemId);

        return item.rollDamage(event);
    };
}