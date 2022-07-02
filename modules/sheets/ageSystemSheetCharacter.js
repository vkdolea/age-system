import * as Dice from "../dice.js";
import {ageSystem} from "../config.js";
import { sortObjArrayByName } from "../setup.js";
// import {isDropedItemValid} from "./helper.js";
import {newItemData} from "./helper.js";

export default class ageSystemSheetCharacter extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // resizable: false,
            width: 680,
            height: 800,
            classes: ["age-system", "sheet", "char", "standard"],
            tabs: [{
                navSelector: ".add-sheet-tabs",
                contentSelector: ".sheet-tab-section",
                initial: "main"
            }]
        });
    }

    get template() {
        return `systems/age-system/templates/sheets/${this.actor.type}-sheet.hbs`;
    }

    get observerRoll () {
        return game.settings.get("age-system", "observerRoll");
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    getData(options) {
        const isOwner = this.document.isOwner;
        const isEditable = this.isEditable;
    
        // Copy actor data to a safe copy
        const data = this.actor.toObject(false);
        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        // const data = super.getData();
        data.config = ageSystem;

        // Order itens into alphabetic order
        const itemSorted = sortObjArrayByName(data.items, "name");

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
        // Groups of Fav Item
        data.favWeapon = data.weapon.filter(i => i.system.favorite);
        data.favPower = data.power.filter(i => i.favorite);
        data.favEquip = data.equipment.filter(i => i.system.favorite);
        data.favStunt = data.stunts.filter(i => i.system.favorite);
        data.favTalent = data.talent.filter(i => i.system.favorite);
        data.favRelation = data.relationship.filter(i => i.system.favorite);
        data.favHonor = data.honorifics.filter(i => i.system.favorite);
        data.favMembership = data.membership.filter(i => i.system.favorite);

        // Sort Conditions alphabetically
        data.conditions = foundry.utils.deepClone(CONFIG.statusEffects).filter(e => e.flags?.["age-system"]?.isCondition);
        for (let i = 0; i < data.conditions.length; i++) {
            if (ageSystem.inUseStatusEffects !== 'custom') {
                data.conditions[i].label = game.i18n.localize(data.conditions[i].label);
                if (data.conditions[i].flags?.["age-system"]?.desc) data.conditions[i].flags["age-system"].desc = game.i18n.localize(data.conditions[i].flags["age-system"].desc);
            }
            const cond = data.conditions[i];
            const hasCondition = data.effects.filter(c => c?.flags?.core?.statusId === cond.id);
            if (hasCondition.length > 0) data.conditions[i].active = true;
        }
        data.conditions = sortObjArrayByName(data.conditions, "label");

        // Filtering non condition Active Effects
        data.effects = data.effects.filter(e => {
            let isListed = false;
            const isStatusEffect = e.flags?.core?.statusId ? true : false;
            const isCondition = e.flags?.["age-system"]?.isCondition;
            const isCurrent = ageSystem.inUseStatusEffects === e.flags?.["age-system"]?.conditionType ? true : false;
            
            if (isStatusEffect) {
                if (isCurrent) {
                    isListed = !isCondition;
                } else {
                    isListed = true;
                }
            } else {
                isListed = true;
            };

            return isListed;
        });

        data.effects = sortObjArrayByName(data.effects, `label`);       
    
        // Retrieve Prefession/Ancestry settings
        data.ancestry = game.settings.get("age-system", "ancestryOpt");
        data.occupation = game.settings.get("age-system", "occupation");

        // Retrieve Health Mode (Health/Fortune)
        data.healthMode = game.settings.get("age-system", "healthMode");

        // Options Tab Preparation
        // Weapon Groups
        data.weaponGroups = ageSystem.weaponGroups;

        // Return template data
        return {
            actor: this.object,
            cssClass: isEditable ? "editable" : "locked",
            data: data,
            system: data.system,
            itemMods: this.object.system.ownedMods,
            effects: data.effects,
            items: data.items,
            limited: this.object.limited,
            options: this.options,
            owner: isOwner,
            editable: isEditable,
            title: this.title,
            isGM: game.user.isGM,
            conditions: data.condEffects,
            inUseStatusEffects: ageSystem.inUseStatusEffects
        };
    };

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();

        const sheet = this.actor.getFlag('core', 'sheetClass');
        const isFull = sheet === undefined || sheet === 'age-system.ageSystemSheetCharAlt';

        buttons = [
            {
              label: isFull ? game.i18n.localize("age-system.sheetBlock") : game.i18n.localize("age-system.sheetFull"),
              class: "configure-sheet-inuse",
              icon: "far fa-id-badge",
              onclick: ev => this._onToggleSheet(ev)
            }
        ].concat(buttons);

        return buttons;
    }

    async _onToggleSheet(event) {
        event.preventDefault()
        let newSheet = 'age-system.ageSystemSheetCharStatBlock'
        const original = this.actor.getFlag('core', 'sheetClass') || Object.values(CONFIG.Actor.sheetClasses['char']).filter(s => s.default)[0].id
        if (original != 'age-system.ageSystemSheetCharAlt') newSheet = 'age-system.ageSystemSheetCharAlt'
        this.actor.openSheet(newSheet)
    }
    
    activateListeners(html) {
        html.find(".tooltip-container").hover(this._onTooltipHover.bind(this));
        // Remove unncessary white space and line breaks from Textarea fields
        const freeText = html.find("textarea.free-text");
        for (let t = 0; t < freeText.length; t++) {
            const area = freeText[t];
            const newValue = area.value.replace(/^\s+|\s+$/gm,'');
            this.actor.update({[area.name]: newValue}).then(a => {
                area.value = newValue;
            })
        }    
        if (this.isEditable) {
            html.find(".item-edit").click(this._onItemEdit.bind(this));
            html.find(".item-delete").click(this._onItemDelete.bind(this));
            html.find(".last-up").change(this._onLastUpSelect.bind(this));
            html.find(".effect-edit").click(this._onChangeEffect.bind(this));
            html.find(".effect-remove").click(this._onRemoveEffect.bind(this));   
            html.find("p.effect-add").click(this._onAddEffect.bind(this));
            html.find(".change-qtd").click(this._onChangeQuantity.bind(this));
            html.find(".degree .change-injury").click(this._onChangeInjury.bind(this));
            html.find(".mark .change-injury").click(this._onChangeMark.bind(this));
            html.find(".refresh-injury-marks").click(this._onRefreshMarks.bind(this));
            html.find(".heal-all-injuries").click(this._onFullHeal.bind(this));
            html.find(".roll-breather").click(this._onRollBreather.bind(this));
            /**
             * Code to be used to make the adjustment on Health/Defense/Toughness for different Game Modes
             */
            html.find(".game-mode-details").change(this._onAdjustHealth.bind(this));
            html.find(".game-mode .override").click(this._onLockGameMode.bind(this));

            // Enable field to be focused when selecting it
            const inputs = html.find("input");
            inputs.focus(ev => ev.currentTarget.select());
        };
        
        // Actions by sheet owner and observers (when optional settings is on)
        if (this.actor.isOwner || this.observerRoll) {
            html.find(".roll-ability")
                .click(this._onRollAbility.bind(this))
                .contextmenu(this._onRollAbility.bind(this));
            html.find(".roll-item")
                .click(this._onRollItem.bind(this))
                .contextmenu(this._onRollItem.bind(this));
            html.find(".roll-damage")
                .click(this._onRollDamage.bind(this))
                .contextmenu(this._onRollDamage.bind(this));
            html.find(".roll-resources")
                .click(this._onRollResources.bind(this))
                .contextmenu(this._onRollResources.bind(this));
            html.find(".effect-active").click(this._onActiveEffect.bind(this));
            html.find(".roll-toughness").click(this._onRollToughness.bind(this));
            
            let handler = ev => this._onDragStart(ev);
            // Set HMTL elements with class item-box as draggable elements.
            let items = html.find(".item-box");
            for (let i = 0; i < items.length; i++) {
                const el = items[i];
                el.draggable = true;
                el.addEventListener("dragstart", handler, false);
            }
        };

        if (this.actor.isOwner) {
            new ContextMenu(html, ".focus-options", this.focusContextMenu);
            new ContextMenu(html, ".item-card .main-data", this.itemContextMenu); // Elaborar
            html.find(".item-equip").click(this._onItemActivate.bind(this));
            html.find(".item-card .main-data").click(this._onItemEdit.bind(this));
            html.find(".defend-maneuver").change(this._onDefendSelect.bind(this));
            html.find(".guardup-maneuver").change(this._onGuardUpSelect.bind(this));
            html.find(".conditions .item-name").click(this._onChangeCondition.bind(this));
            html.find(".mod-active.icon").click(this._onToggleItemMod.bind(this));
            html.find(".wgroup-item").click(this._onWeaponGroupToggle.bind(this));
        }

        // // Add colorset class to entity-link inside TinyMCE editor
        // const entityLink = html.find("a.entity-link");
        // const inlineRoll = html.find("a.inline-roll");
        // const insideMCE = [...entityLink, ...inlineRoll];
        // for (let i = 0; i < insideMCE.length; i++) insideMCE[i].classList.add(`colorset-second-tier`);
       
        super.activateListeners(html);
    };

    // /**
    //  * @override
    //  * Activate a named TinyMCE text editor
    //  * @param {string} name             The named data field which the editor modifies.
    //  * @param {object} options          TinyMCE initialization options passed to TextEditor.create
    //  * @param {string} initialContent   Initial text content for the editor area.
    //  */
    // activateEditor(name, options={}, initialContent="") {
    //     const mceCss = "/systems/age-system/styles/age-system-tinymce.css";
    //     if (!options.content_css) {
    //         options.content_css = [mceCss];
    //     } else {
    //         options.content_css.push(mceCss);
    //     };
    //     super.activateEditor(name, options, initialContent);
    // }

    _onAdjustHealth(ev) {
        const actorData = this.actor.system;
        const detail = ev.currentTarget.dataset.detail;
        const actorMode = actorData.gameMode;
        const mode = actorMode.selected;
        const value = Number(ev.currentTarget.value);
        const updatePath = `system.gameMode.specs.${mode}.${detail}`;
        return this.actor.update({[updatePath]: value});
    }

    _onLockGameMode(ev) {
        const actorData = this.actor.system;
        const updateData = {};
        const override = actorData.gameMode.override;
        updateData["system.gameMode.override"] = !override;
        return this.actor.update(updateData);
    }

    _onDropItemCreate(itemData) {
        itemData = newItemData(this.actor, itemData);
        if (!itemData.length) return false
        super._onDropItemCreate(itemData);
    }

    _onRollBreather(ev) {
        this.actor.breather(false)
    }

    _onRollToughness(ev) {
        const actorData = this.actor.system;
        const event = new MouseEvent('contextmenu')
        const rollData = {
            actor: this.actor,
            event,
            moreParts: [{
                label: game.i18n.localize("age-system.toughness"),
                value: actorData.armor.toughness.total
            }],
            rollType: ageSystem.ROLL_TYPE.TOUGHNESS
        }
        Dice.ageRollCheck(rollData);
    }

    _onFullHeal() {
        const updateData = {
            "system.injury.degrees.light": 0,
            "system.injury.degrees.serious": 0,
            "system.injury.degrees.severe": 0,
            "system.injury.marks": 0,
        }
        return this.actor.update(updateData);
    }

    _onRefreshMarks(event) {
        return this.actor.refreshMarks();
    }

    _onChangeMark(event) {
        return this.actor.healMarks(1);
    }

    _onChangeInjury(event) {
        event.preventDefault();
        const data = this.actor.system;
        const e = event.currentTarget;
        const classList = e.classList;
        const supEl = event.currentTarget.closest('.arrow-control');
        const supClassList = supEl.classList;
        let parameter;
        let marks;
        if(supClassList.contains('light')) {parameter = "light"; marks = 1}
        if(supClassList.contains('serious')) {parameter = "serious"; marks = 1}
        if(supClassList.contains('severe')) {parameter = "severe"; marks = data.injury.degrees.severeMult}
        if (!parameter) return false;

        const qtd = data.injury.degrees[parameter]
        const updatePath = `system.injury.degrees.${parameter}`;

        if (classList.contains("add")) {
            return this.actor.update({
                [updatePath]: qtd+1,
                "system.injury.marks": data.injury.marks + marks
            });
        }
        if (classList.contains("remove") && qtd > 0) {
            if (parameter === 'severe') {
                if (data.injury.marksExcess = 0) marks = marks;
                if (data.injury.marksExcess > 0) marks = -data.injury.marksExcess;
                if (data.injury.marksExcess < 0) marks = data.injury.marksExcess;
            }
            return this.actor.update({
                [updatePath]: qtd-1,
                "system.injury.marks": data.injury.marks - marks
            });
        } 
    };

    async _onWeaponGroupToggle(event) {
        const actorData = this.actor.system;
        event.preventDefault();
        const wgroupId = event.currentTarget.closest(".feature-controls").dataset.wgroupId.trim();
        const wgroups = await actorData.wgroups;
        const hasGroup = wgroups.includes(wgroupId);
        if (hasGroup) {
            const pos = wgroups.indexOf(wgroupId);
            wgroups.splice(pos, 1);
        } else {
            wgroups.push(wgroupId);
        }
        return this.actor.update({"system.wgroups": wgroups});
    }

    _onChangeQuantity(event) {
        event.preventDefault();
        const e = event.currentTarget;
        const classList = e.classList;
        const itemId = e.closest(".feature-controls").dataset.itemId;
        const item = this.actor.items.get(itemId);
        const itemType = item.type
        let qtd;
        let updatePath;
        switch (itemType) {
            case 'relationship':
                qtd = item.system.intensity;
                updatePath = 'system.intensity';
                break;
            default:
                qtd = item.system.quantity;
                updatePath = 'system.quantity';
                break;
        }
        if (classList.contains("add")) return item.update({[updatePath]: qtd+1});
        if (classList.contains("remove") && qtd > 0) return item.update({[updatePath]: qtd-1});
    }

    _onToggleItemMod(event) {
        const actorData = this.actor.system;
        const data = event.currentTarget.dataset;
        const itemId = data.itemId;
        const key = data.key;
        const item = this.actor.items.get(itemId);
        const active = actorData.modifiers[key].isActive;
        const dataPath = `system.modifiers.${key}.isActive`;
        return item.update({[dataPath]: !active});
    }

    _onChangeCondition(event) {
        // const isChecked = null;
        const condId = event.currentTarget.closest(".feature-controls").dataset.conditionId;
        this.actor.handleConditions(condId);
    }

    _onTooltipHover(event){
        const tipCont = event.currentTarget.querySelector(".container-tooltip-text");
        if (!tipCont) return
        const windowSize = {
            x: event.view.innerWidth,
            y: event.view.innerHeight
        };
        let xPos = event.clientX;
        let yPos = event.clientY;
        tipCont.style.top = `${yPos - tipCont.clientHeight - 5}px`;

        const xMargin = windowSize.x - (xPos + tipCont.clientWidth);
        if (xMargin < 0) xPos += xMargin;
        tipCont.style.left = `${xPos}px`;
    };

    async _onAddEffect(event) {
        const newEffect = {
            label: game.i18n.localize("age-system.item.newItem"),
            origin: this.actor.uuid,
            icon: `icons/svg/aura.svg`,
            disabled: true,
            duration: {rounds: 1}
        };
        const e = await this.actor.createEmbeddedDocuments("ActiveEffect", [newEffect]);
        return e[0].sheet.render(true);
    }

    _onActiveEffect(event){
        const effectId = event.currentTarget.closest(".feature-controls").dataset.effectId;
        const effect = this.actor.effects.get(effectId);
        const isDisabled = effect.data.disabled;
        effect.update({"disabled": !isDisabled})
    }

    _onChangeEffect(event){
        const effectId = event.currentTarget.closest(".feature-controls").dataset.effectId;
        const effect = this.actor.effects.get(effectId);
        effect.sheet.render(true);
    }

    _onRemoveEffect(event){
        const effectId = event.currentTarget.closest(".feature-controls").dataset.effectId;
        const effect = this.actor.effects.get(effectId);
        return effect.delete();
    }

    _onItemActivate(event) {
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const itemToToggle = this.actor.getEmbeddedDocument("Item", itemId);
        const itemType = itemToToggle.type;
        const itemData = itemToToggle.system;
        if (event.currentTarget.classList.contains('favorite')) {
            const toggleFav = !itemData.favorite;
            return itemToToggle.update({"system.favorite": toggleFav});
        }
        if (itemType === "power" || itemType === "talent") {
            const toggleAct = !itemData.activate;
            itemToToggle.update({"system.activate": toggleAct});
        } else {
            const toggleEqp = !itemData.equiped;
            itemToToggle.update({"system.equiped": toggleEqp});
        };
    };

    _onRollResources(event) {
        const rollData = {
            event: event,
            actor: this.actor,
            rollType: ageSystem.ROLL_TYPE.RESOURCES
        };
        Dice.ageRollCheck(rollData);
    };

    _onLastUpSelect(ev) {
        const actorData = this.actor.system;
        const abl = ev.currentTarget.closest(".feature-controls").dataset.ablId;
        let actorAbls = {
            data: {
                abilities: {}
            }
        };
        for (const ablKey in actorData.abilities) {
            if (Object.hasOwnProperty.call(actorData.abilities, ablKey)) {
                actorAbls.data.abilities[ablKey] = {"lastUp": false};                
            };
        };
        actorAbls.data.abilities[abl].lastUp = true;
        this.actor.update(actorAbls);
    };

    _onDefendSelect(event) {
        const actorData = this.actor.system;
        const guardupStatus = event.currentTarget.closest(".feature-controls").dataset.guardupActive;
        const defendStatus = actorData.defend.active;
        if (guardupStatus && !defendStatus) {
            this.actor.update({"system.guardUp.active": false});
        };
    };

    _onGuardUpSelect(event) {
        const actorData = this.actor.system;
        const defendStatus = event.currentTarget.closest(".feature-controls").dataset.defendActive;
        const guardupStatus = actorData.guardUp.active;
        if (!guardupStatus && defendStatus) {
            this.actor.update({"system.defend.active": false});
        };
    };

    _onRollAbility(event) {
        const rollData = {
            event: event,
            actor: this.actor,
            abl: event.currentTarget.closest(".feature-controls").dataset.ablId,
            rollType: ageSystem.ROLL_TYPE.ABILITY
        }
        Dice.ageRollCheck(rollData);
    };

    _onRollItem(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const rollType = event.currentTarget.closest(".feature-controls").dataset.rollType
        const itemRolled = this.actor.items.get(itemId);
        if (itemRolled.data.type === "focus" && event.button !== 0) return
        itemRolled.roll(event, rollType);
    };

    _onItemShow(event) {
        event.preventDefault();
        if (event.detail != 1) return
        const itemId = event.currentTarget.closest(".feature-controls").dataset.itemId;
        const item = this.actor.items.get(itemId);
        item.showItem(event.shiftKey);
    };

    _onItemEdit(event) {
        event.preventDefault();
        let e = event.currentTarget;
        let itemId = e.dataset.itemId ?? e.closest(".feature-controls").dataset.itemId;
        const item = this.actor.items.get(itemId);
        return item.sheet.render(true);
    };

    _onItemDelete(event) {
        event.preventDefault();
        let e = event.currentTarget;
        let itemId = e.closest(".feature-controls").dataset.itemId;
        const item = this.actor.items.get(itemId);
        return item.delete();
    };

    _onRollDamage(event) {
        event.preventDefault();
        const e = event.currentTarget;
        const itemId = e.closest(".feature-controls").dataset.itemId;
        const item = this.actor.items.get(itemId);
        const damageData = {event: event};
        return item.rollDamage(damageData);
    };

    focusContextMenu = [
        {
            name: game.i18n.localize("age-system.ageRollOptions"),
            icon: '<i class="fas fa-dice"></i>',
            callback: e => {
                const focus = this.actor.items.get(e.data("item-id"));
                const ev = new MouseEvent('click', {altKey: true});
                focus.roll(ev);
            }
        },
        {
            name: game.i18n.localize("age-system.chatCard.roll"),
            icon: '<i class="far fa-eye"></i>',
            callback: e => {
                const i = this.actor.items.get(e.data("item-id")).showItem(e.shiftKey);
            }
        },
        {
            name: game.i18n.localize("age-system.settings.changeRollContext"),
            icon: '<i class="fas fa-exchange-alt"></i>',
            // TODO - try to add the Shift + Click rolling to GM inside this callback
            callback: e => {
                const focus = this.actor.items.get(e.data("item-id"));
                const ev = new MouseEvent('click', {});
                Dice.ageRollCheck({event: ev, itemRolled: focus, actor: this.actor, selectAbl: true, rollType: ageSystem.ROLL_TYPE.FOCUS});
            }
        },
        {
            name: game.i18n.localize("age-system.settings.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: e => {
                const item = this.actor.items.get(e.data("item-id"));
                item.sheet.render(true);
            }
        },
        {
            name: game.i18n.localize("age-system.settings.delete"),
            icon: '<i class="fas fa-trash"></i>',
            callback: e => {
                const i = this.actor.items.get(e.data("item-id")).delete();
            }
        }
    ];

    itemContextMenu = [
        {
            name: game.i18n.localize("age-system.showOnChat"),
            icon: '<i class="far fa-eye"></i>',
            callback: e => {
                const data = e[0].closest(".feature-controls").dataset;
                const item = this.actor.items.get(data.itemId);
                item.showItem(e.shiftKey)
            }
        },
        {
            name: game.i18n.localize("age-system.settings.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: e => {
                const data = e[0].closest(".feature-controls").dataset;
                const item = this.actor.items.get(data.itemId);
                item.sheet.render(true);
            }
        },
        {
            name: game.i18n.localize("age-system.settings.delete"),
            icon: '<i class="fas fa-trash"></i>',
            callback: e => {
                const data = e[0].closest(".feature-controls").dataset;
                const item = this.actor.items.get(data.itemId);
                item.delete();
            }
        }
    ];
}
