export const ageSystem = {
    abilitiesSettings: {}
};

// Ability set for "main" - core AGE System games
ageSystem.abilitiesSettings.main = {
    "acc": "age-system.acc",
    "comm": "age-system.comm",
    "cons": "age-system.cons",
    "dex": "age-system.dex",
    "fight": "age-system.fight",
    "int": "age-system.int",
    "per": "age-system.per",
    "str": "age-system.str",
    "will": "age-system.will",
};

// Ability set for "dage" - Dragon Age games
ageSystem.abilitiesSettings.dage = {
    "comm": "age-system.comm",
    "cons": "age-system.cons",
    "cunn": "age-system.cunn",
    "dex": "age-system.dex",
    "magic": "age-system.magic",
    "per": "age-system.per",
    "str": "age-system.str",
    "will": "age-system.will",
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
        name: "age-system.conditions.hindered",
        desc: "age-system.conditions.hinderedDesc",
        id: "hindered"
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
// ageSystem.damageSource = {
//     impact: "age-system.impact",
//     ballistic: "age-system.ballistic",
//     penetrating: "age-system.penetrating",
// };
ageSystem.damageSourceOpts = {
    useBallistic: {
        impact: "age-system.impact",
        ballistic: "age-system.ballistic",
        penetrating: "age-system.penetrating"
    },
    noBallistic : {
        normalDamage: "age-system.normalDamage",
        penetrating: "age-system.penetrating"
    }
}
ageSystem.rof = {
    none: "age-system.rof.none",
    singleShot: "age-system.rof.singleShot",
    semiAuto: "age-system.rof.semiAuto",
    fullAuto: "age-system.rof.fullAuto"
};
    
// Vehicle parameters
ageSystem.velocityCategory = {
    velStandard: {colDmg: "1d6", sideDmg: "1d3"},
    velFast:  {colDmg: "2d6", sideDmg: "1d6"},
    velVeryFast:  {colDmg: "4d6", sideDmg: "2d6"},
    velExtreme:  {colDmg: "6d6", sideDmg: "3d6"}
};

// Spacehip sizes
ageSystem.spaceshipSize = {
    tiny: 1,
    small: 2,
    medium: 3,
    large: 4,
    huge: 5,
    gigantic: 6,
    colossal: 7,
    titanic: 8
};

// Spaceship hull by size
ageSystem.spaceshipHull = [
    "1",
    "1d3",
    "1d6",
    "2d6",
    "3d6",
    "4d6",
    "5d6",
    "6d6"
];

// Spaceship crew by size
ageSystem.spaceshipCrew = [
    {min: 1, typ: 2},
    {min: 1, typ: 2},
    {min: 2, typ: 4},
    {min: 4, typ: 16},
    {min: 16, typ: 64},
    {min: 64, typ: 512},
    {min: 256, typ: 2048},
    {min: 1024, typ: 8192}
];

// Spaceship crew competece
ageSystem.spaceshipCrewCompetence = {
    incompetent: 0,
    poor: 1,
    average: 2,
    capable: 3,
    skilled: 4,
    elite: 5
};

// Spaceship Features
ageSystem.featuresType = [
    "sensorMod", "maneuverSizeStep", "juiceMod", "special",
    "hullPlating", "hullMod",/* "rollable", */"weapon" // Maybe in the future I can add the rollable feature...
];

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
    "focus": `${itemIconPath}gift-of-knowledge.svg`,
    "shipfeatures": `${itemIconPath}processor.svg`
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

const AGEstatusEffectsPath = "systems/age-system/resources/imgs/effects/";
ageSystem.statusEffects = {
    expanse: [
    {
        icon: `${AGEstatusEffectsPath}number.png`,
        id: `num0`,
        label: `0`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-1.png`,
        id: `num1`,
        label: `1`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-2.png`,
        id: `num2`,
        label: `2`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-3.png`,
        id: `num3`,
        label: `3`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-4.png`,
        id: `num4`,
        label: `4`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-5.png`,
        id: `num5`,
        label: `5`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-6.png`,
        id: `num6`,
        label: `6`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-7.png`,
        id: `num7`,
        label: `7`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-8.png`,
        id: `num8`,
        label: `8`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-9.png`,
        id: `num9`,
        label: `9`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}number-10.png`,
        id: `num10`,
        label: `10`,
        flags: {
            "age-system": {
                type: "counter"
            }
        }
    },
    {
        icon: `${AGEstatusEffectsPath}pirate-grave.svg`,
        id: `dead`,
        label: `EFFECT.StatusDead`,
        flags: {
            "age-system": {
                type: "core"
            }
        }
    },
    {
        label: "age-system.conditions.blinded",
        id: "blinded",
        icon: "icons/svg/blind.svg",
        flags: {
            "age-system": {
                type: "conditions",
                name: "blinded",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.blindedDesc"
            }
        }
    },
    {
        label: "age-system.conditions.deafened",
        id: "deafened",
        icon: "icons/svg/deaf.svg",
        flags: {
            "age-system": {
                type: "conditions",
                name: "deafened",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.deafenedDesc"
            }
        }
    },
    {
        label: "age-system.conditions.dying",
        id: "dying",
        icon: `${AGEstatusEffectsPath}half-dead.svg`,
        flags: {
            "age-system": {
                type: "conditions",
                name: "dying",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.dyingDesc"
            }
        }
    },
    {
        label: "age-system.conditions.fatigued",
        id: "fatigued",
        icon: `${AGEstatusEffectsPath}despair.svg`,
        flags: {
            "age-system": {
                type: "conditions",
                name: "fatigued",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.fatiguedDesc",
            }
        }
    },
    {
        label: "age-system.conditions.exhausted",
        id: "exhausted",
        icon: `${AGEstatusEffectsPath}oppression.svg`,
        flags: {
            "age-system": {
                type: "conditions",
                name: "exhausted",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.exhaustedDesc"
            }
        },
        changes: [{
            key: "data.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: "0.5"
        }]
    },
    {
        label: "age-system.conditions.freefalling",
        id: "freefalling",
        icon: `${AGEstatusEffectsPath}acrobatic.svg`,
        flags: {
            "age-system": {
                type: "conditions",
                name: "freefalling",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.freefallingDesc"
            }
        }
    },
    {
        label: "age-system.conditions.helpless",
        id: "helpless",
        icon: `${AGEstatusEffectsPath}knockout.svg`,
        flags: {
            "age-system": {
                type: "conditions",
                name: "helpless",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.helplessDesc"
            }
        }
    },
    {
        label: "age-system.conditions.hindered",
        id: "hindered",
        icon: `${AGEstatusEffectsPath}knee-bandage.svg`,
        flags: {
            "age-system": {
                type: "conditions",
                name: "hindered",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.hinderedDesc"
            }
        },
        changes: [{
            key: "data.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: "0.5"
        }]
    },
    {
        label: "age-system.conditions.injured",
        id: "injured",
        icon: `${AGEstatusEffectsPath}backstab.svg`,
        flags: {
            "age-system": {
                type: "conditions",
                name: "injured",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.injuredDesc"
            }
        },
        changes: [{
            key: "data.testMod",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: "-1"
        }]
    },
    {
        label: "age-system.conditions.wounded",
        id: "wounded",
        icon: `${AGEstatusEffectsPath}arrowed.svg`,
        flags: {
            "age-system": {
                type: "conditions",
                name: "wounded",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.woundedDesc"
            }
        },
        changes: [{
            key: "data.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: "0.5"
        },
        {
            key: "data.testMod",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: "-2"
        }]
    },
    {
        label: "age-system.conditions.prone",
        id: "prone",
        icon: "icons/svg/falling.svg",
        flags: {
            "age-system": {
                type: "conditions",
                name: "prone",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.proneDesc"
            }
        }
    },
    {
        label: "age-system.conditions.restrained",
        id: "restrained",
        icon: `${AGEstatusEffectsPath}imprisoned.svg`,
        flags: {
            "age-system": {
                type: "conditions",
                name: "restrained",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.restrainedDesc",
            }
        },
        changes: [{
            key: "data.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: "0"
        }]
    },
    {
        label: "age-system.conditions.unconscious",
        id: "unconscious",
        icon: "icons/svg/unconscious.svg",
        flags: {
            "age-system": {
                type: "conditions",
                name: "unconscious",
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.unconsciousDesc"
            }
        },
        changes: [{
            key: "data.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: "0"
        }]
    },
    // Below this line are Foundry Core token conditions
    {
        id: "sleep",
        label: "EFFECT.StatusAsleep",
        icon: "icons/svg/sleep.svg",
    },
    {
        id: "fly",
        label: "EFFECT.StatusFlying",
        icon: "icons/svg/wing.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "stun",
        label: "EFFECT.StatusStunned",
        icon: "icons/svg/daze.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "paralysis",
        label: "EFFECT.StatusParalysis",
        icon: "icons/svg/paralysis.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "silence",
        label: "EFFECT.StatusSilenced",
        icon: "icons/svg/silenced.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "fear",
        label: "EFFECT.StatusFear",
        icon: "icons/svg/terror.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "burning",
        label: "EFFECT.StatusBurning",
        icon: "icons/svg/fire.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "frozen",
        label: "EFFECT.StatusFrozen",
        icon: "icons/svg/frozen.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "shock",
        label: "EFFECT.StatusShocked",
        icon: "icons/svg/lightning.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "corrode",
        label: "EFFECT.StatusCorrode",
        icon: "icons/svg/acid.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
        {
        id: "bleeding",
        label: "EFFECT.StatusBleeding",
        icon: "icons/svg/blood.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "disease",
        label: "EFFECT.StatusDisease",
        icon: "icons/svg/biohazard.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "poison",
        label: "EFFECT.StatusPoison",
        icon: "icons/svg/poison.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "radiation",
        label: "EFFECT.StatusRadiation",
        icon: "icons/svg/radiation.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "regen",
        label: "EFFECT.StatusRegen",
        icon: "icons/svg/regen.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "degen",
        label: "EFFECT.StatusDegen",
        icon: "icons/svg/degen.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "upgrade",
        label: "EFFECT.StatusUpgrade",
        icon: "icons/svg/upgrade.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "downgrade",
        label: "EFFECT.StatusDowngrade",
        icon: "icons/svg/downgrade.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "target",
        label: "EFFECT.StatusTarget",
        icon: "icons/svg/target.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "eye",
        label: "EFFECT.StatusMarked",
        icon: "icons/svg/eye.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "curse",
        label: "EFFECT.StatusCursed",
        icon: "icons/svg/sun.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "bless",
        label: "EFFECT.StatusBlessed",
        icon: "icons/svg/angel.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "fireShield",
        label: "EFFECT.StatusFireShield",
        icon: "icons/svg/fire-shield.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "coldShield",
        label: "EFFECT.StatusIceShield",
        icon: "icons/svg/ice-shield.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "magicShield",
        label: "EFFECT.StatusMagicShield",
        icon: "icons/svg/mage-shield.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
    {
        id: "holyShield",
        label: "EFFECT.StatusHolyShield",
        icon: "icons/svg/holy-shield.svg",
        flags: {
            "age-system": {
                type: "general"
            }
        }
    },
]};

ageSystem.ageEffectsKeys = {
    "testMod": {label: "age-system.bonus.testMod", mask: "data.testMod"},
    "attackMod": {label: "age-system.bonus.attackMod", mask: "data.attackMod"},
    "actorDamage": {label: "age-system.bonus.actorDamage", mask: "data.dmgMod"},
    "acc": {label: "age-system.bonus.acc", mask: "data.abilities.acc.total"},
    "comm": {label: "age-system.bonus.comm", mask: "data.abilities.comm.total"},
    "cons": {label: "age-system.bonus.cons", mask:"data.abilities.cons.total"},
    "cunn": {label: "age-system.bonus.cunn", mask: "data.abilities.cunn.total"},
    "dex": {label: "age-system.bonus.dex", mask: "data.abilities.dex.total"},
    "fight": {label: "age-system.bonus.fight", mask: "data.abilities.fight.total"},
    "int": {label: "age-system.bonus.int", mask: "data.abilities.int.total"},
    "magic": {label: "age-system.bonus.magic", mask: "data.abilities.magic.total"},
    "per": {label: "age-system.bonus.per", mask: "data.abilities.per.total"},
    "str": {label: "age-system.bonus.str", mask: "data.abilities.str.total"},
    "will": {label: "age-system.bonus.will", mask: "data.abilities.total"},
    "defense": {label: "age-system.bonus.defense", mask: "data.defense.total"},
    "impactArmor": {label: "age-system.bonus.impactArmor", mask: "data.armor.impact"},
    "ballisticArmor": {label: "age-system.bonus.ballisticArmor", mask: "data.armor.ballistic"},
    "defendMnv": {label: "age-system.bonus.defendMnv", mask: "data.defend.total"},
    "guardupMnv": {label: "age-system.bonus.guardupMnv", mask: "data.guardUp.total"},
    "allOutAtk": {label: "age-system.bonus.allOutAtkMnv", mask: "data.allOutAttack.total"},
    "maxHealth": {label: "age-system.bonus.maxHealth", mask: "data.health.max"},
    "maxConviction": {label: "age-system.bonus.maxConviction", mask: "data.conviction.max"},
    "maxPowerPoints": {label: "age-system.bonus.maxPowerPoints", mask: "data.powerPoints.max"},
    "aimMnv": {label: "age-system.bonus.aimMnv", mask: "data.aim.total"},
    "armorPenalty": {label: "age-system.bonus.armorPenalty", mask: "data.armor.penalty"},
    "armorStrain": {label: "age-system.bonus.armorStrain", mask: "data.armor.strain"},
    "speed": {label: "age-system.bonus.speed", mask: "data.speed.total"},
    "toughness": {label: "age-system.bonus.toughness", mask: "data.armor.toughness.total"},
}

ageSystem.itemEffectsKeys = {
    "powerForce": {label: "age-system.bonus.powerForce", mask: ""},
    "focus": {label: "age-system.bonus.focusValue", mask: ""},
    "itemDamage": {label: "age-system.bonus.itemAtk", mask: ""},
    "itemActivation": {label: "age-system.bonus.generalDmg", mask: ""}
}

// Age Tracker & Roller Initial Positions
ageSystem.ageTrackerPos = {xPos: "260px", yPos: "69px"};
ageSystem.ageRollerPos = {xPos: "800px", yPos: "10px"};

// Initializing variable to load focus Compendiaum
ageSystem.focus = [];

// List with world's Item compendia
ageSystem.itemCompendia = [];

// Roll Types definition
ageSystem.ROLL_TYPE = {
    ATTACK: "attack",
    MELEE_ATTACK: "meleeAttack",
    RANGED_ATTACK: "rangedAttack",
    FATIGUE: "fatigue",
    TOUGHNESS: "toughness",
    TOUGHNESS_AUTO: "toughnessAuto",
    RESOURCES: "resources",
    POWER: "powerActivation",
    ABILITY: 'ability',
    FOCUS: 'focus',
    VEHICLE_ACTION: 'vehicle'
}