import {ageSystem} from "../config.js";
import { modifiersList, sortObjArrayByName } from "../setup.js";
import { focusList } from "../settings.js";
import {AdvancementAdd} from "../advancement.js";

export default class ageSystemItemSheet extends ItemSheet {
    constructor(...args) {
        super(...args);
    
        // Expand the default size of different item sheet
        const itemType = this.object.type;
        switch (itemType) {
            case "focus":
                this.options.height = this.position.height = "352";
                this.options.resizable = false;
                break;
            // case "weapon":
            //     this.options.width = this.position.width = "700";
            //     this.options.height = this.position.height = "460";
            //     break;
            case "talent":
                this.options.width = this.position.width = "1000";
                this.options.height = this.position.height = "790";
                break;          
            case "stunts":
                // this.options.width = this.position.width = "300";
                this.options.height = this.position.height = "352";
                this.options.resizable = false;
                break;        
            case "shipfeatures":
                this.options.height = this.position.height = "352";
                this.options.resizable = false;
                break;             
            case "relationship":
                // this.options.width = this.position.width = "600";
                this.options.height = this.position.height = "352";
                this.options.resizable = false;
                break;
            case "membership":
                // this.options.width = this.position.width = "600";
                this.options.height = this.position.height = "352";
                this.options.resizable = false;
                break;
            case "honorifics":
                // this.options.width = this.position.width = "600";
                this.options.height = this.position.height = "352";
                this.options.resizable = false;
                break;
            case "power":
                // this.options.width = this.position.width = "700";
                this.options.height = this.position.height = "480";
                break; 
            case "class":
                // this.options.width = this.position.width = "770";
                this.options.height = this.position.height = "700";
                break; 
            default:
                break;
        };
    };
   
    static get defaultOptions() {        
        return foundry.utils.mergeObject(super.defaultOptions, {
            height: 500,
            width: 805,
            classes: ["age-system", "sheet", "item", "colorset-second-tier"],
            tabs: [{
                navSelector: ".add-sheet-tabs",
                contentSelector: ".sheet-tab-section",
                initial: "main"
            }]
        });
    };

    get template() {
        return `systems/age-system/templates/sheets/${this.item.type}-sheet.hbs`;
    };

    getData(options) {
        const data = super.getData(options);
        data.item = data.document;
        ageSystem.focus = focusList(game.settings.get("age-system", "masterFocusCompendium"));
        data.config = ageSystem;
        
        // Fetch localized name for Item Type
        const i = this.item.type;
        data.localType = game.i18n.localize(`TYPES.Item.${i}`)
        
        // Setting which ability settings will be used
        data.config.wealthMode = game.settings.get("age-system", "wealthType");

        // Spaceship Features
        if (this.item.type === "shipfeatures") {
            data.config.featuresTypeLocal = [];
            for (let f = 0; f < data.config.featuresType.length; f++) {
                const feat = data.config.featuresType[f];
                data.config.featuresTypeLocal.push({
                    key: feat,
                    name: game.i18n.localize(`age-system.spaceship.${feat}`)
                });
            }
            data.config.featuresTypeLocal = sortObjArrayByName(data.config.featuresTypeLocal, "name");
        };

        // Options Tab Preparation
        // Weapon Groups
        data.weaponGroups = ageSystem.weaponGroups;

        // Primary Abilities (if applicable)
        data.usePrimaryAbl = game.settings.get("age-system", "primaryAbl");
        if (this.object.type === 'class' && data.usePrimaryAbl) {
            const selectedAbl = foundry.utils.deepClone(ageSystem.abilities);
            const allAbl = foundry.utils.deepClone(ageSystem.abilitiesTotal);
            const extraAbl = {}
            for (const k in allAbl) {
                if (Object.hasOwnProperty.call(allAbl, k)) {
                    if (!selectedAbl[k]) extraAbl[k] = game.i18n.localize(`age-system.${k}`);
                }
            };
            data.ablOptions = {
                ...selectedAbl,
                ...extraAbl
            };
        }

        // Does it have Options tab?
        data.hasOptionsTab = (['weapon'].includes(this.item.type) && data.weaponGroups);

        // Active Effects if item owner is a Character
        if (this.item.actor?.type === "char") data.actorEffects = this.item.actor.effects;
        
        data.displayIsOrg = !this.item.isOwned;

        // Modifiers Dropdown List
        data.modifiersList = modifiersList()

        // Check if Use Fatigue setting is TRUE
        data.fatigueSet = game.settings.get("age-system", "useFatigue");
        data.system = data.data.system;

        // If it is a Talent, check if it uses expanded talent degrees
        if(this.item.type === "talent") {
            data.expandedDegrees = ageSystem.talentDegrees.inUse.length > 3;
        }
        return data
    };    
    
    activateListeners(html) {
        if (this.isEditable) {
            html.find("a.add-bonus").click(this._onAddModifier.bind(this));
            html.find(".add-modifier").click(this._onAddModifier.bind(this));
            html.find(".mod-controls a.remove").click(this._onRemoveModifier.bind(this));
            html.find(".mod-controls a.toggle").click(this._onToggleModifier.bind(this));
            html.find(".toggle-feature").click(this._onToggleFeature.bind(this));
            html.find(".trait-item").click(this._onTraitGroupToggle.bind(this));
            if (this.item.type === "focus") {
                if (this.item.isOwned) {
                    html.find(".item-card-title").keyup(this._onOwnedFocusNameChange.bind(this));
                };
            };

            // Enable field to be focused when selecting it
            const inputs = html.find("input");
            inputs.focus(ev => ev.currentTarget.select());

            // Class Item Type commands only
            html.find(".add-adv").click(this._onAddAdvance.bind(this));

        };
        html.find(".find-reference").click(this._onOpenPDF.bind(this));

        // Actions by sheet owner only
        if (this.item.isOwner) {
            if (this.item.type === "class") new ContextMenu(html, ".advance", this.advContextMenu);
        };

        // Add class to TinyMCE
        const editor = html.find(".editor");
        for (let i = 0; i < editor.length; i++) {
            const el = editor[i].parentElement;
            // Add specific class unless Editor's parent node states otherwise
            if (!el.classList.contains("no-value-class")) editor[i].classList.add('values')
        };

        super.activateListeners(html);
    };

    _onAddAdvance(e) {
        return new AdvancementAdd(this.document.uuid).render(true);
    };

    _onOpenPDF(e) {
        const ref = e.currentTarget.closest('.feature-controls').dataset.reference;
        if (ref == "") return false;
        const regex = new RegExp('([0-9]+)|([a-zA-Z]+)','g');
        const splittedArray = ref.match(regex);

        const code = splittedArray[0];
        const page = Number(splittedArray[1]);
        
        if (ui.PDFoundry) {
            ui.PDFoundry.openPDFByCode(code, { page });
        } else {
            ui.notifications.warn('PDFoundry must be installed to use source links.');
        }
    }

    _onToggleFeature(e) {
        const item = this.item;
        const itemData = item.system;
        const feature = e.currentTarget.dataset.feature;
        const value = !itemData[feature];
        const updatePath = "system." + feature;
        const update = {[updatePath]: value};
        if (value && feature === "causeHealing") update["system.causeDamage"] = false
        if (value && feature === "causeDamage") update["system.causeHealing"] = false
        return item.update(update);
    }

    _onAddModifier(e) {
        return this.item._newModifier();
    }

    _onRemoveModifier(e) {
        const i = e.currentTarget.closest(".feature-controls").dataset.modIndex;
        const path = `system.modifiers.-=${i}`;
        return this.item.update({[path]: null})
    }

    _onToggleModifier(event) {
        const item = this.item;
        const itemData = item.system;
        const i = event.currentTarget.closest(".feature-controls").dataset.modIndex;
        const modifiers = foundry.utils.deepClone(itemData.modifiers);
        modifiers[i].isActive = !modifiers[i].isActive;
        return item.update({"system.modifiers": modifiers});
    }

    _onTraitGroupToggle(event) {
        event.preventDefault();
        const item = this.item;
        const itemData = item.system;
        const dataset = event.currentTarget.closest(".feature-controls").dataset
        const traitId = dataset.traitId.trim();
        const traitType = dataset.traitType;
        const tGroups = itemData[traitType];
        const hasGroup = tGroups.includes(traitId);
        if (hasGroup) {
            const pos = tGroups.indexOf(traitId);
            tGroups.splice(pos, 1);
        } else {
            tGroups.push(traitId);
        }
        const path = `system.${traitType}`;
        return item.update({[path]: tGroups});
    }
    
    // Adds an * in front of the owned Focus name whenever the user types a name of another owned Focus
    // => Actors are not allowed to have more than 1 Focus with the same name
    // TODO replace this solution with warning message informing about the name exclusivity and prevent item.name to be changed
    _onOwnedFocusNameChange(event) {
        const itemId = this.item.id;
        const owner = this.item.actor;
        const ownedFoci = owner.itemTypes.focus;

        let nameField = event.target;
        const typedEntry = nameField.value;
        const typedLowerCase = typedEntry.toLowerCase();

        for (let i = 0; i < ownedFoci.length; i++) {
            const e = ownedFoci[i];
            const eName = e.system.nameLowerCase;
            const eId = e.id;
            if (eId !== itemId && eName === typedLowerCase) {
                nameField.value = "*" + typedEntry;
            };            
        };
    };

    advContextMenu = [
        {
            name: game.i18n.localize("age-system.settings.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: e => {
                const data = e[0].dataset;
                this.object._onChangeAdvancement(data, 'edit');
            }
        },
        {
            name: game.i18n.localize("age-system.settings.delete"),
            icon: '<i class="fas fa-trash"></i>',
            callback: e => {
                const data = e[0].dataset;
                this.object._onChangeAdvancement(data, 'remove');
            }
        }
    ];
};
