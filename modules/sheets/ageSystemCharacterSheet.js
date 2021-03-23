import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";

export default class ageSystemCharacterSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            height: 800,
            classes: ["age-system", "sheet", "char", /*`colorset-${ageSystem.colorScheme}`*/]
        });
    }

    focusContextMenu = [
        {
            name: game.i18n.localize("age-system.settings.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: e => {
                const item = this.actor.getOwnedItem(e.data("item-id"));
                item.sheet.render(true);
            }
        },
        {
            name: game.i18n.localize("age-system.settings.delete"),
            icon: '<i class="fas fa-trash"></i>',
            callback: e => {
                const i = this.actor.deleteOwnedItem(e.data("item-id"));
            }
        },
        {
            name: game.i18n.localize("age-system.settings.changeRollContext"),
            icon: '<i class="fas fa-exchange-alt"></i>',
            // TODO - try to add the Shift + Click rolling to GM inside this callback
            callback: e => {
                const focus = this.actor.getOwnedItem(e.data("item-id"));
                const ev = new MouseEvent('click', {});
                Dice.ageRollCheck({event: ev, itemRolled: focus, actor: this.actor, selectAbl: true});
            }
        },
        {
            name: "Show Item",
            icon: '<i class="far fa-eye"></i>',
            callback: e => {
                const i = this.actor.getOwnedItem(e.data("item-id")).showItem();
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

        // Sort Conditions alphabetically
        data.conditions = data.config.conditions.sort(function(a, b) {
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
        for (let c = 0; c < data.conditions.length; c++) {
            const element = data.conditions[c];
            element.active = this.actor.data.data.conditions[element.id];           
        };
    
        // Retrieve Prefession/Ancestry settings
        data.ancestry = game.settings.get("age-system", "ancestryOpt");
        data.occupation = game.settings.get("age-system", "occupation");

        // Retrieve Health Mode (Health/Fortune)
        data.healthMode = game.settings.get("age-system", "healthMode");

        // Sheet color
        data.colorScheme = game.user.getFlag("age-system", "colorScheme");

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

            // Enable field to be focused when selecting it
            const inputs = html.find("input");
            inputs.focus(ev => ev.currentTarget.select());
        };
        
        // Actions by sheet owner only
        if (this.actor.owner) {
            new ContextMenu(html, ".focus-options", this.focusContextMenu);
            html.find(".item-show").click(this._onItemShow.bind(this));
            html.find(".roll-ability").click(this._onRollAbility.bind(this));
            html.find(".roll-item").click(this._onRollItem.bind(this));
            html.find(".roll-damage").click(this._onRollDamage.bind(this));
            html.find(".defend-maneuver").change(this._onDefendSelect.bind(this));
            html.find(".guardup-maneuver").change(this._onGuardUpSelect.bind(this));
            html.find(".last-up").change(this._onLastUpSelect.bind(this));
            html.find(".roll-resources").click(this._onRollResources.bind(this));
            html.find(".item-equip").click(this._onItemActivate.bind(this));

            let handler = ev => this._onDragStart(ev);
            // Find all rollable items on the character sheet.
            let items = html.find(".item-box");
            for (let i = 0; i < items.length; i++) {
                const el = items[i];
                if (el.draggable) {
                    el.addEventListener("dragstart", handler, false);
                }   
            }
        };

        super.activateListeners(html);
    };

    _onItemActivate(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const itemToToggle = this.actor.getOwnedItem(itemId);
        const itemType = itemToToggle.type;
        if (itemType === "power" || itemType === "talent") {
            const toggleAct = !itemToToggle.data.data.activate;
            itemToToggle.update({"data.activate": toggleAct});
        } else {
            const toggleEqp = !itemToToggle.data.data.equiped;
            itemToToggle.update({"data.equiped": toggleEqp});
        };
    };

    _onRollResources(event) {
        const rollData = {
            event: event,
            actor: Dice.getActor() || this.actor,
            resourceRoll: true
        };
        Dice.ageRollCheck(rollData);
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
        const rollData = {
            event: event,
            actor: this.actor,
            abl: event.currentTarget.closest(".feature-controls").dataset.ablId
        }
        Dice.ageRollCheck(rollData);
    };

    _onRollItem(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const itemRolled = this.actor.getOwnedItem(itemId);
        itemRolled.roll(event);
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
        const actor = this.actor;
        return actor.deleteOwnedItem(itemId);
    };

    _onRollDamage(event) {
        event.preventDefault();
        const e = event.currentTarget;
        const itemId = e.closest(".feature-controls").dataset.itemId;
        const actor = this._realActor();
        const item = actor.getOwnedItem(itemId);
        const damageData = {event: event};

        return item.rollDamage(damageData);
    };

    _realActor() {
        const isToken = this.actor.isToken;
        const actor = isToken ? game.actors.tokens[this.actor.token.data._id] : this.actor;
        return actor;
    }
}