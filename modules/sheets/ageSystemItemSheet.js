export default class ageSystemItemSheet extends ItemSheet {
    constructor(...args) {
        super(...args);
    
        // Expand the default size of different item sheet
        const itemType = this.object.data.type;
        switch (itemType) {
            case "focus":
                this.options.width = this.position.width = "350";
                break;
            case "weapon":
                this.options.width = this.position.width = "478";
                this.options.height = this.position.height = "430";
                break;
            case "talent":
                this.options.width = this.position.width = "300";
                break;          
            case "stunts":
                this.options.width = this.position.width = "300";
                break;             
            case "relationship":
                this.options.width = this.position.width = "600";
                this.options.height = this.position.height = "300";
                break;             
            default:
                break;
        };
    };
   
    static get defaultOptions() {        
        
        return mergeObject(super.defaultOptions, {
            height: 340,
            width: 516,
            classes: ["age-system", "sheet", "item"],
            tabs: [{
                navSelector: ".add-sheet-tabs",
                contentSelector: ".sheet-tab-section",
                initial: "main"
            }]
        });
    };

    get template() {
        return `systems/age-system/templates/sheets/${this.item.data.type}-sheet.hbs`;
    };

    getData(options) {
        const data = super.getData(options);
        data.item = data.entity;
        data.data = data.entity.data;

        data.config = CONFIG.ageSystem;
        
        // Setting which ability settings will be used
        const ablSelect = game.settings.get("age-system", "abilitySelection");
        data.config.abilities = data.config.abilitiesSettings[ablSelect];

        return data;
    };
    
    
    activateListeners(html) {

        if (this.isEditable) {
            if (this.item.data.type === "focus") {
                if (this.item.isOwned) {
                    html.find(".item-card-title").keyup(this._onOwnedFocusNameChange.bind(this));
                };
            };

        };

        // Actions by sheet owner only
        if (this.item.owner) {
            
        };

        super.activateListeners(html);
    };
    
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
            const eName = e.data.data.nameLowerCase;
            const eId = e.id;
            if (eId !== itemId && eName === typedLowerCase) {
                nameField.value = "*" + typedEntry;
            };            
        };
    };
};