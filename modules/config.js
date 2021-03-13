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
    oneMinute: "age-system.oneMinute",
    fiveMinutes: "age-system.fiveMinutes",
    tenMinutes: "age-system.tenMinutes",
    twentyMinutes: "age-system.twentyMinutes",
    oneHour: "age-system.oneHour",
    fourHours: "age-system.fourHours",
    twelveHours: "age-system.twelveHours"
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

// Conditions
ageSystem.conditions = [
    {
        name: "age-system.conditions.blinded",
        desc: "age-system.conditions.blindedDesc",
        id: "blinded"
    },
    {
        name: "age-system.conditions.deafened",
        desc: "age-system.conditions.deafenedDesc",
        id: "deafened"
    },
    {
        name: "age-system.conditions.exhausted",
        desc: "age-system.conditions.exhaustedDesc",
        id: "exhausted"
    },
    {
        name: "age-system.conditions.fatigued",
        desc: "age-system.conditions.fatiguedDesc",
        id: "fatigued"
    },
    {
        name: "age-system.conditions.freefalling",
        desc: "age-system.conditions.freefallingDesc",
        id: "freefalling"
    },
    {
        name: "age-system.conditions.helpless",
        desc: "age-system.conditions.helplessDesc",
        id: "helpless"
    },
    {
        name: "age-system.conditions.hindred",
        desc: "age-system.conditions.hindredDesc",
        id: "hindred"
    },
    {
        name: "age-system.conditions.prone",
        desc: "age-system.conditions.proneDesc",
        id: "prone"
    },
    {
        name: "age-system.conditions.restrained",
        desc: "age-system.conditions.restrainedDesc",
        id: "restrained"
    },
    {
        name: "age-system.conditions.injured",
        desc: "age-system.conditions.injuredDesc",
        id: "injured",
    },
    {
        name: "age-system.conditions.wounded",
        desc: "age-system.conditions.woundedDesc",
        id: "wounded"
    },
    {
        name: "age-system.conditions.unconscious",
        desc: "age-system.conditions.unconsciousDesc",
        id: "unconscious"
    },
    {
        name: "age-system.conditions.dying",
        desc: "age-system.conditions.dyingDesc",
        id: "dying"
    }
];

ageSystem.damageType = {
    stun: "age-system.stun",
    wound: "age-system.wound"
};
ageSystem.damageSource = {
    impact: "age-system.impact",
    ballistic: "age-system.ballistic",
    penetrating: "age-system.penetrating"
    // piercing: "age-system.piercing"
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

// Vehicle parameters
ageSystem.velocityCategory = {
    velStandard: "age-system.velStandard",
    velFast: "age-system.velFast",
    velVeryFast: "age-system.velVeryFast",
    velExtreme: "age-system.velExtreme"
};

const itemIconPath = "systems/age-system/resources/imgs/item-icon/";
ageSystem.itemIcons = {
    "equipment": `${itemIconPath}briefcase.svg`,
    "stunts": `${itemIconPath}split-cross.svg`,
    "talent": `${itemIconPath}skills.svg`,
    "power": `${itemIconPath}embrassed-energy.svg`,
    "honorifics": `${itemIconPath}rank-3.svg`,
    "relationship": `${itemIconPath}player-next.svg`,
    "membership": `${itemIconPath}backup.svg`,
    "weapon": `${itemIconPath}fist.svg`,
    "focus": `${itemIconPath}gift-of-knowledge.svg`
};

const actorIconPath = "systems/age-system/resources/imgs/actor-icon/";
ageSystem.actorIcons = {
    "vehicle": `${actorIconPath}chariot.svg`,
    "char": `${actorIconPath}sensousness.svg`,
    "spaceship": `${actorIconPath}rocket.svg`,
}

const uiElementsPath = "systems/age-system/resources/imgs/ui-elements/";
ageSystem.uiElements = {
    ageRoller: `${uiElementsPath}cube.svg`
}

// Initializing variable to load focus Compendiaum
ageSystem.focus = [];