export const ageSystem = {
    abilitiesSettings: {}
};

// Ability set for "main" - core AGE System games
ageSystem.abilitiesSettings.main = {
    acc: "age-system.acc",
    comm: "age-system.comm",
    cons: "age-system.cons",
    dex: "age-system.dex",
    fight: "age-system.fight",
    int: "age-system.int",
    per: "age-system.per",
    str: "age-system.str",
    will: "age-system.will",
};

// Ability set for "dage" - Dragon Age games
ageSystem.abilitiesSettings.dage = {
    comm: "age-system.comm",
    cons: "age-system.cons",
    cunn: "age-system.cunn",
    dex: "age-system.dex",
    magic: "age-system.magic",
    per: "age-system.per",
    str: "age-system.str",
    will: "age-system.will",
};



ageSystem.actionsToCast = {
    noAction: "age-system.noAction",
    minorAction: "age-system.minorAction",
    majorAction: "age-system.majorAction",
    oneMinute: "age-system.oneMinute"
};

ageSystem.reloadDuration = {
    noAction: "age-system.noAction",
    minorAction: "age-system.minorAction",
    majorAction: "age-system.majorAction",
    d6minor: "age-system.d6minor"
};

ageSystem.fatigueConditions = {
    noFatigue: "age-system.noFatigue",
    winded: "age-system.winded",
    fatigued: "age-system.fatigued",
    exhausted: "age-system.exhausted",
    dying: "age-system.dying"
};

ageSystem.damageType = {
    stun: "age-system.stun",
    wound: "age-system.wound"
};
ageSystem.damageSource = {
    impact: "age-system.impact",
    ballistic: "age-system.ballistic",
    penetrating: "age-system.penetrating"
};
ageSystem.rof = {
    none: "age-system.rof.none",
    singleShot: "age-system.rof.singleShot",
    semiAuto: "age-system.rof.semiAuto",
    fullAuto: "age-system.rof.fullAuto"
};

ageSystem.bonusTypes = {
    itemDamage: "age-system.bonus.itemAtkBns",
    actorDamage: "age-system.bonus.itemDmgBns",
    itemActivation: "age-system.bonus.generalDmgBns",
    acc: "age-system.bonus.charAblBns",
    comm: "age-system.bonus.charAblBns",
    cons: "age-system.bonus.charAblBns",
    cun: "age-system.bonus.charAblBns",
    dex: "age-system.bonus.charAblBns",
    fight: "age-system.bonus.charAblBns",
    int: "age-system.bonus.charAblBns",
    magic: "age-system.bonus.charAblBns",
    per: "age-system.bonus.charAblBns",
    str: "age-system.bonus.charAblBns",
    will: "age-system.bonus.charAblBns",
    focus: "age-system.bonus.focusValueBns",
    defense: "age-system.bonus.totalDefenseBns",
    impactArmor: "age-system.bonus.impactArmorBns",
    ballisticArmor: "age-system.bonus.ballisticArmorBns",
    defendMnv: "age-system.bonus.defendMnvBns",
    guardupMnv: "age-system.bonus.guardupMnvBns",
    allOutAtk: "age-system.bonus.allOutAtkBns",
    maxHealth: "age-system.bonus.maxHealthBns",
    maxConviction: "age-system.bonus.maxConvictionBns",
    maxPowerPoints: "age-system.bonus.maxPowerPointsBns",
    powerForce: "age-system.bonus.powerForceBns",
    aimMnv: "age-system.bonus.aimMnvBns",
    armorPenalty: "age-system.bonus.armorPenaltyBns"
};

// Initializing variable to load focus Compendiaum
ageSystem.focus = [];

// // Hook to update compendium list when Foundry VTT is 'ready'
// Hooks.once("ready", function() {
//     let setCompendium = game.settings.get("age-system", "masterFocusCompendium");
//     ageSystem.focus = compendiumList(setCompendium);
//     // ageSystem.focus = compendiumList("age-system.focus");
// });

// If Compendia are updated, then compendiumList is gathered once again
Hooks.on("renderCompendium", function() {
    let setCompendium = game.settings.get("age-system", "masterFocusCompendium");
    ageSystem.focus = compendiumList(setCompendium);
    // ageSystem.focus = compendiumList("age-system.focus");
});

// This function looks at given Compendium and returns an array with object containing id and name for all entries
// export function compendiumList(compendiumName) {
//     let dataPack = game.packs.get(compendiumName);
//     let dataList = [];
//     let i = 0;
//     dataPack.getIndex().then(function(){
//         for (let i = 0; i < dataPack.index.length; i++) {
//             const entry = dataPack.index[i]; // It is necessary to store entry's name and id, to avoid messing up with existing Focus when Compendium is updated! Create array of objectes array = [{id: "xxx", name: "yyy"} {...}] - check if my implementation is correct
//             if(entry)
//                 dataList[i] = {
//                     _id: entry._id,
//                     name: entry.name
//                 };   
//         }
//     });
//     return dataList;
// }