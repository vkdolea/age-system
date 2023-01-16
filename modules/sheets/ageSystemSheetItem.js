import {ageSystem} from "../config.js";
import { modifiersList, sortObjArrayByName } from "../setup.js";
import { focusList } from "../settings.js";

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
                this.options.width = this.position.width = "900";
                this.options.height = this.position.height = "545";
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
            default:
                break;
        };
    };
   
    static get defaultOptions() {        
        return mergeObject(super.defaultOptions, {
            height: 460,
            width: 700,
            classes: ["age-system", "sheet", "item", "colorset-second-tier"],
            tabs: [{
                navSelector: ".add-sheet-tabs",
                contentSelector: ".sheet-tab-section",
                initial: "main"
            }]
        });
    };

    get template() {
        return `systems/dragon-age-system/templates/sheets/${this.item.type}-sheet.hbs`;
    };

    getData(options) {
        const data = super.getData(options);
        data.item = data.document;
        ageSystem.focus = focusList(game.settings.get("age-system", "masterFocusCompendium"));
        data.config = ageSystem;
        
        // Fetch localized name for Item Type
        const i = this.item.type.toLowerCase();
        const itemType = i[0].toUpperCase() + i.slice(1);
        data.localType = game.i18n.localize(`ITEM.Type${itemType}`)
        
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
        return data
    };    
    
    activateListeners(html) {
        if (this.isEditable) {
            html.find("a.add-bonus").click(this._onAddModifier.bind(this));
            html.find(".add-modifier").click(this._onAddModifier.bind(this));
            html.find(".mod-controls a.remove").click(this._onRemoveModifier.bind(this));
            html.find(".mod-controls a.toggle").click(this._onToggleModifier.bind(this));
            html.find(".toggle-feature").click(this._onToggleFeature.bind(this));
            if (this.item.type === "focus") {
                if (this.item.isOwned) {
                    html.find(".item-card-title").keyup(this._onOwnedFocusNameChange.bind(this));
                };
            };

            // Enable field to be focused when selecting it
            const inputs = html.find("input");
            inputs.focus(ev => ev.currentTarget.select());

        };
        html.find(".find-reference").click(this._onOpenPDF.bind(this));

        // Actions by sheet owner only
        if (this.item.isOwner) {
            html.find(".wgroup-item").click(this._onWeaponGroupToggle.bind(this));
        };

        // Add class to TinyMCE
        const editor = html.find(".editor");
        for (let i = 0; i < editor.length; i++) editor[i].classList.add('values');

        super.activateListeners(html);
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

    async _onWeaponGroupToggle(event) {
        event.preventDefault();
        const item = this.item;
        const itemData = item.system;
        const wgroupId = event.currentTarget.closest(".feature-controls").dataset.wgroupId.trim();
        const wgroups = await itemData.wgroups;
        const hasGroup = wgroups.includes(wgroupId);
        if (hasGroup) {
            const pos = wgroups.indexOf(wgroupId);
            wgroups.splice(pos, 1);
        } else {
            wgroups.push(wgroupId);
        }
        return item.update({"system.wgroups": wgroups});
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
};
