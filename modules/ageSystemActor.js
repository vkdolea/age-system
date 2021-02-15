export class ageSystemActor extends Actor {

    /** @override */
    prepareBaseData() {
        const actorData = this.data;
        const data = actorData.data;

        // Check if split Armor is in use
        data.useBallisticArmor = game.settings.get("age-system", "useBallisticArmor");

        // Retrieve wealth mode
        data.useResource = data.useIncome = data.useCurrency = data.useCoins = false;
        const wealthMode = game.settings.get("age-system", "wealthType");
        switch (wealthMode) {
            case "income":
                data.useIncome = true;
                break;
            case "resources":
                data.useResources = true;
                break;
            case "currency":
                data.useCurrency = true;
                break;
            case "coins":
                data.useCoins = true;
                break;
            default:
                break;
        };

        switch (actorData.type) {
            case "char":
                this._prepareCharBaseData();
                break;
            case "vehicle":
                this._prepareVehicleBaseData();
                break;
        
            default:
                break;
        }
    }
    _prepareCharBaseData() {

        const actorData = this.data;
        const data = actorData.data;
        
        // Check if Conviction is in use
        data.useConviction = game.settings.get("age-system", "useConviction");

        // Check if Toughness is in use
        data.useToughness = game.settings.get("age-system", "useToughness");

        // Check if Fatigue is in use
        data.useFatigue = game.settings.get("age-system", "useFatigue");

        // Check if Power Points is in use
        data.usePowerPoints = game.settings.get("age-system", "usePowerPoints");

        // CAN BE REMOVED AFTER SUCCESFULLY ADDING VEHICLES AS ACTORS!
        //
        /*-----------------------------------------------------------------------------------*/
        // // Check if split Armor is in use
        // data.useBallisticArmor = game.settings.get("age-system", "useBallisticArmor");

        // // Retrieve wealth mode
        // data.useResource = data.useIncome = data.useCurrency = data.useCoins = false;
        // const wealthMode = game.settings.get("age-system", "wealthType");
        // switch (wealthMode) {
        //     case "income":
        //         data.useIncome = true;
        //         break;
        //     case "resources":
        //         data.useResources = true;
        //         break;
        //     case "currency":
        //         data.useCurrency = true;
        //         break;
        //     case "coins":
        //         data.useCoins = true;
        //         break;
        //     default:
        //         break;
        // };
        // CAN BE REMOVED AFTER SUCCESFULLY ADDING VEHICLES AS ACTORS!
        //
        /*-----------------------------------------------------------------------------------*/
     
        data.ownedBonus = this.ownedItemsBonus();
        const bonuses = data.ownedBonus;

        /*--- Conditions in Use ------------------------------*/
        data.useConditions =  game.settings.get("age-system", "useConditions");
        /*----------------------------------------------------*/

        /*--- Add bonuses to Abilities -----------------------*/
        // Also create abl.total parameters
        this.setAbilitiesWithMod(data, actorData);
        /*----------------------------------------------------*/

        /*--- Calculate Armor Penalty ------------------------*/
        if (bonuses != null && bonuses.armorPenalty) {
            data.armor.penalty = Math.abs(Number(bonuses.armorPenalty.totalMod));
        } else {
            data.armor.penalty = 0;
        };
        /*----------------------------------------------------*/

        /*--- Calculate Impact Armor -------------------------*/
        if (bonuses != null && bonuses.impactArmor) {
            data.armor.impact = Number(bonuses.impactArmor.totalMod);
        } else {
            data.armor.impact = 0;
        };
        /*----------------------------------------------------*/

        /*--- Calculate Ballistic Armor -------------------------*/
        if (bonuses != null && bonuses.ballisticArmor) {
            data.armor.ballistic = Number(bonuses.ballisticArmor.totalMod);
        } else {
            data.armor.ballistic = 0;
        };
        /*----------------------------------------------------*/

        /*--- Calculate total Defense ------------------------*/
        data.defense.total = 0;
        if (data.defend.active) {data.defense.total += Number(data.defend.defenseBonus)};
        if (data.guardUp.active) {data.defense.total += Number(data.guardUp.defenseBonus)};
        
        // Add Defense Bonus if any
        if (bonuses != null && bonuses.defense) {data.defense.mod = bonuses.defense.totalMod}
        
        data.defense.total += (Number(data.abilities.dex.total) - Math.abs(Number(data.armor.penalty)) + Number(data.defense.base) + Number(data.defense.mod) + Number(data.defense.gameModeBonus));
        if (data.allOutAttack.active) {
            data.defense.total -= Math.abs(Number(data.allOutAttack.defensePenalty));
        };
        if (data.defense.total < 0) {data.defense.total = 0};
        /*----------------------------------------------------*/

        /*--- Calculate toughness ----------------------------*/
        // Identify Tougness bonus if any
        if (bonuses != null && bonuses.toughness) {
            data.armor.toughness.mod = bonuses.toughness.totalMod;
        } else {
            data.armor.toughness.mod = 0;
        };
        data.armor.toughness.total = Number(data.abilities.cons.total) + Number(data.armor.toughness.gameModeBonus) + Number(data.armor.toughness.mod);
        /*----------------------------------------------------*/

        /*--- Calculate Speed --------------------------------*/
        if (bonuses != null && bonuses.speed) {
            data.speed.mod = Number(bonuses.speed.totalMod);
        } else {
            data.speed.mod = 0;
        };
        data.speed.total =  Number(data.abilities.dex.total) - Math.abs(data.armor.penalty) + Number(data.speed.base) + Number(data.speed.mod)
        /*----------------------------------------------------*/
        
        /*--- Calculate Max Health ---------------------------*/
        if (bonuses != null && bonuses.maxHealth) {
            data.health.mod = Number(bonuses.maxHealth.totalMod);
        } else {
            data.health.mod = 0;
        };
        data.health.max = Number(data.health.mod) + Number(data.health.set);
        /*----------------------------------------------------*/

        /*--- Calculate Max Power Points ---------------------*/
        if (bonuses != null && bonuses.maxPowerPoints) {
            data.powerPoints.mod = Number(bonuses.maxPowerPoints.totalMod);
        } else {
            data.powerPoints.mod = 0;
        };
        data.powerPoints.max = Number(data.powerPoints.mod) + Number(data.powerPoints.set);
        /*---------------------------------------------------*/

        /*--- Calculate Max Conviction ----------------------*/
        if (bonuses != null && bonuses.maxConviction) {
            data.conviction.mod = Number(bonuses.maxConviction.totalMod);
        } else {
            data.conviction.mod = 0;
        };
        data.conviction.max = Number(data.conviction.mod) + Number(data.conviction.set);
        /*---------------------------------------------------*/

        // Ensure Fatigue has valid Values and creates Status text
        data.fatigue.status = "";
        data.fatigue.value = Math.abs(data.fatigue.entered);
        if (data.fatigue.value > data.fatigue.max) {data.fatigue.value = data.fatigue.max};
        if (data.fatigue.value < 0) {data.fatigue.value = 0};
        switch (data.fatigue.value) {
            case 0:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.noFatigue);
            break;
            case 1:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.winded);
            break;
            case 2:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.fatigued);
            break;
            case 3:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.exhausted);
            break;
            case 4:
                data.fatigue.status = game.i18n.localize(CONFIG.ageSystem.fatigueConditions.dying);
            break;            
                                            
            default:
                break;
        };        
    };

    _prepareVehicleBaseData() {
        const actorData = this.data;
        const data = actorData.data;

        // Types of damage from a Vehicle
        // data.sideswipeDmg = 0;
        // data.collisionDmg = 0;
        // data.velocityClassDmg = 0;
        // data.crashDmg = 0;

    };

    prepareDerivedData() {
        const actorData = this.data;
        // const data = actorData.data;

        switch (actorData.type) {
            case "char":
                this._prepareCharDerivedData();
                break;
            case "vehicle":
                this._prepareVehicleVehicleData();
                break;
        
            default:
                break;
        }

        // CAN BE REMOVED AFTER SUCCESFULLY ADDING VEHICLES AS ACTORS!
        //
        /*-----------------------------------------------------------------------------------*/
        // /*--- Add bonuses to Abilities -----------------------*/
        // // Also create abl.total parameters
        // // this.setAbilitiesWithMod(data, actorData);
        // /*----------------------------------------------------*/

        // // Calcualtes total Initiative
        // data.initiative = data.initiativeMod + data.abilities.dex.total - data.armor.penalty;

        // // Calculate resources/currency
        // if (data.useCurrency) {
        //     data.resources.mod = 0;
        // };
        // data.resources.total = data.resources.base + Number(data.resources.mod);
        // CAN BE REMOVED AFTER SUCCESFULLY ADDING VEHICLES AS ACTORS!
        //
        /*-----------------------------------------------------------------------------------*/
    };

    _prepareCharDerivedData() {
        const actorData = this.data;
        const data = actorData.data;

        // Calcualtes total Initiative
        data.initiative = data.initiativeMod + data.abilities.dex.total - data.armor.penalty;

        // Calculate resources/currency
        if (data.useCurrency) {
            data.resources.mod = 0;
        };
        data.resources.total = data.resources.base + Number(data.resources.mod);
    };

    _prepareVehicleVehicleData() {

    };

    setAbilitiesWithMod(data) {
        const settingAbls = this.data.data.abilities;
        for (const ablKey in settingAbls) {
            if (settingAbls.hasOwnProperty(ablKey)) {
                data.abilities[ablKey].total = Number(data.abilities[ablKey].value);
                if (data.ownedBonus !== null && data.ownedBonus[ablKey]) {
                    data.abilities[ablKey].total += Number(data.ownedBonus[ablKey].totalMod);
                };
            };
        };
    }

    ownedItemsBonus() {
        if (this.data.items.length === 0) {return null};
        const ownedItems = this.data.items;
        let ownedMods = {};

        for (let it = 0; it < ownedItems.length; it++) {
            const itemInCheck = ownedItems[it];
            const inCheckMods = itemInCheck.data.itemMods;

            if (itemInCheck.data.equiped === true || itemInCheck.data.activate === true) {
                for (const key in inCheckMods) {
                    if (inCheckMods.hasOwnProperty(key) && inCheckMods[key].isActive && inCheckMods[key].value !== 0) {
                        if (!ownedMods[key]) {
                            ownedMods[key] = {
                                modList: [],
                                totalMod: 0
                            };
                        };
                        ownedMods[key].modList.push({
                            carrierId: itemInCheck._id,
                            carrierName: itemInCheck.name,
                            mod: inCheckMods[key].value
                        });
                    };
                };
            };
        };

        // Sums up total mod for each key
        for (const key in ownedMods) {
            if (ownedMods.hasOwnProperty(key)) {
                ownedMods[key].modList.forEach(e => {
                    ownedMods[key].totalMod += e.mod;
                });
            };
        };

        return ownedMods;
    };

};