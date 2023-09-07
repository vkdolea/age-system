export const ageSystem = {
    abilitiesSettings: {
        // Ability set for "main" - core AGE System games
        main: {
            "acc": "age-system.acc",
            "comm": "age-system.comm",
            "cons": "age-system.cons",
            "dex": "age-system.dex",
            "fight": "age-system.fight",
            "int": "age-system.int",
            "per": "age-system.per",
            "str": "age-system.str",
            "will": "age-system.will",
        },
        // Ability set for "dage" - Dragon Age games
        dage: {
            "comm": "age-system.comm",
            "cons": "age-system.cons",
            "cunn": "age-system.cunn",
            "dex": "age-system.dex",
            "magic": "age-system.magic",
            "per": "age-system.per",
            "str": "age-system.str",
            "will": "age-system.will",
        }
    }
};

// Level Constrains
ageSystem.maxLevel = 20;
ageSystem.minLevel = 0;

// All possible Abilities
ageSystem.abilitiesTotal = {
    "acc": "age-system.acc",
    "comm": "age-system.comm",
    "cons": "age-system.cons",
    "dex": "age-system.dex",
    "fight": "age-system.fight",
    "int": "age-system.int",
    "per": "age-system.per",
    "str": "age-system.str",
    "will": "age-system.will",

    "cunn": "age-system.cunn",
    "magic": "age-system.magic"    
}

// Organization Abilities
ageSystem.abilitiesOrg = {
    "might": "age-system.org.might",
    "wealth": "age-system.org.wealth",
    "influence": "age-system.org.influence",
    "intrigue": "age-system.org.intrigue",
    "phenomena": "age-system.org.phenomena",
};

// Organization scope
ageSystem.orgScope = {
    "local": "age-system.orgScope.local",
    "regional": "age-system.orgScope.regional",
    "national": "age-system.orgScope.national",
    "international": "age-system.orgScope.international"
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

ageSystem.damageType = {
    stun: "age-system.stun",
    wound: "age-system.wound"
};

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
    "shipfeatures": `${itemIconPath}processor.svg`,
    "class": `${itemIconPath}achievement.svg`
};

const actorIconPath = "systems/age-system/resources/imgs/actor-icon/";
ageSystem.actorIcons = {
    "vehicle": `${actorIconPath}chariot.svg`,
    "char": `${actorIconPath}sensousness.svg`,
    "spaceship": `${actorIconPath}rocket.svg`,
    "organization": `${actorIconPath}barracks-tent.svg`
}

const uiElementsPath = "systems/age-system/resources/imgs/ui-elements/";
ageSystem.uiElements = {
    ageRoller: `${uiElementsPath}cube.svg`
}

const advIconPath =  "systems/age-system/resources/imgs/adv-icon/";
ageSystem.advIcon = {
    // health: `${advIconPath}heart-key.svg`,
    // ability: `${advIconPath}orb-direction.svg`,
    item: `${advIconPath}family-tree.svg`,
    progressive: `${advIconPath}progression.svg`,
}

// Advancement Data - progressive values
ageSystem.adv = {
    type: {
        progressive: ['health', 'conviction', 'advAbility', 'powerPoints', 'defenseAndToughness'/*, 'toughness', 'defense'*/],
        item: ['spec', 'stunts', 'talent', 'power', 'focus', 'relationship']
    },
    health: new Array(20).fill('1 + @cons'),
    powerPoints: new Array(20).fill("0"),
    conviction: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    advAbility: new Array(20).fill(1),
    defenseAndToughness: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
}

/**
 * Constains path of deverived data, which Active Effects shall be applied after DerivedaData method
 */
ageSystem.actorDerivedDataKey = [
    'system.armor.penaly',
    'system.armor.strain',
    'system.dmgMod',
    'system.testMod',
    'system.attackMod',
    // 'system.defense.mod',
    'system.defense.total',
    'system.armor.impact',
    'system.armor.ballistic',
    // 'system.armor.toughness.mod',
    'system.armor.toughness.total',
    // 'system.speed.mod',
    'system.speed.total',
    'system.defend.mod',
    'system.guardUp.mod',
    'system.allOutAttack.mod',
    'system.allOutAttack.dmgBonus',
    // 'system.health.mod',
    'system.health.max',
    // 'system.conviction.mod',
    'system.conviction.max',
    // 'system.powerPoints.mod',
    'system.powerPoints.max',
    'system.aim.mod',
    'system.initiative',
    'system.resources.total',
];

// Ability paths
ageSystem.charAblKey = [
    'system.abilities.acc.total',
    'system.abilities.comm.total',
    'system.abilities.cons.total',
    'system.abilities.cunn.total',
    'system.abilities.dex.total',
    'system.abilities.fight.total',
    'system.abilities.int.total',
    'system.abilities.magic.total',
    'system.abilities.per.total',
    'system.abilities.str.total',
    'system.abilities.will.total',
];

const AGEstatusEffectsPath = "systems/age-system/resources/imgs/effects/";
ageSystem.statusEffectsPath = AGEstatusEffectsPath;

ageSystem.statusEffects = {
    expanse: [
    {
        icon: `${AGEstatusEffectsPath}number.svg`,
        id: `num0`,
        name: `0`,
    },
    {
        icon: `${AGEstatusEffectsPath}number-1.svg`,
        id: `num1`,
        name: `1`,
    },
    {
        icon: `${AGEstatusEffectsPath}number-2.svg`,
        id: `num2`,
        name: `2`,
    },
    {
        icon: `${AGEstatusEffectsPath}number-3.svg`,
        id: `num3`,
        name: `3`
    },
    {
        icon: `${AGEstatusEffectsPath}number-4.svg`,
        id: `num4`,
        name: `4`
    },
    {
        icon: `${AGEstatusEffectsPath}number-5.svg`,
        id: `num5`,
        name: `5`
    },
    {
        icon: `${AGEstatusEffectsPath}number-6.svg`,
        id: `num6`,
        name: `6`
    },
    {
        icon: `${AGEstatusEffectsPath}number-7.svg`,
        id: `num7`,
        name: `7`
    },
    {
        icon: `${AGEstatusEffectsPath}number-8.svg`,
        id: `num8`,
        name: `8`
    },
    {
        icon: `${AGEstatusEffectsPath}number-9.svg`,
        id: `num9`,
        name: `9`
    },
    {
        icon: `${AGEstatusEffectsPath}number-10.svg`,
        id: `num10`,
        name: `10`
    },
    {
        icon: `${AGEstatusEffectsPath}pirate-grave.svg`,
        id: `dead`,
        name: `EFFECT.StatusDead`,
    },
    {
        name: "age-system.conditions.blinded",
        id: "blinded",
        icon: "icons/svg/blind.svg",
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.blindedDesc"
            }
        }
    },
    {
        name: "age-system.conditions.deafened",
        id: "deafened",
        icon: "icons/svg/deaf.svg",
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.deafenedDesc"
            }
        }
    },
    {
        name: "age-system.conditions.dying",
        id: "dying",
        icon: `${AGEstatusEffectsPath}half-dead.svg`,
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.dyingDesc"
            }
        }
    },
    {
        name: "age-system.conditions.fatigued",
        id: "fatigued",
        icon: `${AGEstatusEffectsPath}despair.svg`,
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.fatiguedDesc",
            }
        }
    },
    {
        name: "age-system.conditions.exhausted",
        id: "exhausted",
        icon: `${AGEstatusEffectsPath}oppression.svg`,
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.exhaustedDesc"
            }
        },
        changes: [{
            key: "system.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: "0.5"
        }]
    },
    {
        name: "age-system.conditions.freefalling",
        id: "freefalling",
        icon: `${AGEstatusEffectsPath}acrobatic.svg`,
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.freefallingDesc"
            }
        }
    },
    {
        name: "age-system.conditions.helpless",
        id: "helpless",
        icon: `${AGEstatusEffectsPath}knockout.svg`,
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.helplessDesc"
            }
        }
    },
    {
        name: "age-system.conditions.hindered",
        id: "hindered",
        icon: `${AGEstatusEffectsPath}knee-bandage.svg`,
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.hinderedDesc"
            }
        },
        changes: [{
            key: "system.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: "0.5"
        }]
    },
    {
        name: "age-system.conditions.injured",
        id: "injured",
        icon: `${AGEstatusEffectsPath}backstab.svg`,
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.injuredDesc"
            }
        },
        changes: [{
            key: "system.testMod",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: "-1"
        }]
    },
    {
        name: "age-system.conditions.wounded",
        id: "wounded",
        icon: `${AGEstatusEffectsPath}arrowed.svg`,
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.woundedDesc"
            }
        },
        changes: [{
            key: "system.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: "0.5"
        },
        {
            key: "system.testMod",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: "-2"
        }]
    },
    {
        name: "age-system.conditions.prone",
        id: "prone",
        icon: "icons/svg/falling.svg",
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.proneDesc"
            }
        }
    },
    {
        name: "age-system.conditions.restrained",
        id: "restrained",
        icon: `${AGEstatusEffectsPath}imprisoned.svg`,
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.restrainedDesc",
            }
        },
        changes: [{
            key: "system.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: "0"
        }]
    },
    {
        name: "age-system.conditions.unconscious",
        id: "unconscious",
        icon: "icons/svg/unconscious.svg",
        flags: {
            "age-system": {
                isCondition: true,
                conditionType: "expanse",
                desc: "age-system.conditions.unconsciousDesc"
            }
        },
        changes: [{
            key: "system.speed.total",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: "0"
        }]
    },
    // Below this line are Foundry Core token conditions
    {
        id: "sleep",
        name: "EFFECT.StatusAsleep",
        icon: "icons/svg/sleep.svg",
    },
    {
        id: "fly",
        name: "EFFECT.StatusFlying",
        icon: "icons/svg/wing.svg"
    },
    {
        id: "stun",
        name: "EFFECT.StatusStunned",
        icon: "icons/svg/daze.svg"
    },
    {
        id: "paralysis",
        name: "EFFECT.StatusParalysis",
        icon: "icons/svg/paralysis.svg"
    },
    {
        id: "silence",
        name: "EFFECT.StatusSilenced",
        icon: "icons/svg/silenced.svg"
    },
    {
        id: "fear",
        name: "EFFECT.StatusFear",
        icon: "icons/svg/terror.svg"
    },
    {
        id: "burning",
        name: "EFFECT.StatusBurning",
        icon: "icons/svg/fire.svg"
    },
    {
        id: "frozen",
        name: "EFFECT.StatusFrozen",
        icon: "icons/svg/frozen.svg"
    },
    {
        id: "shock",
        name: "EFFECT.StatusShocked",
        icon: "icons/svg/lightning.svg"
    },
    {
        id: "corrode",
        name: "EFFECT.StatusCorrode",
        icon: "icons/svg/acid.svg"
    },
    {
        id: "bleeding",
        name: "EFFECT.StatusBleeding",
        icon: "icons/svg/blood.svg"
    },
    {
        id: "disease",
        name: "EFFECT.StatusDisease",
        icon: "icons/svg/biohazard.svg"
    },
    {
        id: "poison",
        name: "EFFECT.StatusPoison",
        icon: "icons/svg/poison.svg"
    },
    {
        id: "radiation",
        name: "EFFECT.StatusRadiation",
        icon: "icons/svg/radiation.svg"
    },
    {
        id: "regen",
        name: "EFFECT.StatusRegen",
        icon: "icons/svg/regen.svg"
    },
    {
        id: "degen",
        name: "EFFECT.StatusDegen",
        icon: "icons/svg/degen.svg"
    },
    {
        id: "upgrade",
        name: "EFFECT.StatusUpgrade",
        icon: "icons/svg/upgrade.svg"
    },
    {
        id: "downgrade",
        name: "EFFECT.StatusDowngrade",
        icon: "icons/svg/downgrade.svg"
    },
    {
        id: "target",
        name: "EFFECT.StatusTarget",
        icon: "icons/svg/target.svg"
    },
    {
        id: "eye",
        name: "EFFECT.StatusMarked",
        icon: "icons/svg/eye.svg"
    },
    {
        id: "curse",
        name: "EFFECT.StatusCursed",
        icon: "icons/svg/sun.svg"
    },
    {
        id: "bless",
        name: "EFFECT.StatusBlessed",
        icon: "icons/svg/angel.svg"
    },
    {
        id: "fireShield",
        name: "EFFECT.StatusFireShield",
        icon: "icons/svg/fire-shield.svg"
    },
    {
        id: "coldShield",
        name: "EFFECT.StatusIceShield",
        icon: "icons/svg/ice-shield.svg"
    },
    {
        id: "magicShield",
        name: "EFFECT.StatusMagicShield",
        icon: "icons/svg/mage-shield.svg"
    },
    {
        id: "holyShield",
        name: "EFFECT.StatusHolyShield",
        icon: "icons/svg/holy-shield.svg"
    },
]};

ageSystem.ageEffectsKeys = {
    "testMod": {label: "age-system.bonus.testMod", mask: "system.testMod", dtype: 'nodice'},
    "attackMod": {label: "age-system.bonus.attackMod", mask: "system.attackMod", dtype: 'nodice'},
    "actorDamage": {label: "age-system.bonus.actorDamage", mask: "system.dmgMod", dtype: 'formula'},
    "acc": {label: "age-system.bonus.acc", mask: "system.abilities.acc.total", dtype: 'number'},
    "accTest": {label: "age-system.bonus.accTest", mask: "system.abilities.acc.testMod", dtype: 'number'},
    "comm": {label: "age-system.bonus.comm", mask: "system.abilities.comm.total", dtype: 'number'},
    "commTest": {label: "age-system.bonus.commTest", mask: "system.abilities.comm.testMod", dtype: 'number'},
    "cons": {label: "age-system.bonus.cons", mask:"system.abilities.cons.total", dtype: 'number'},
    "consTest": {label: "age-system.bonus.consTest", mask:"system.abilities.cons.testMod", dtype: 'number'},
    "cunn": {label: "age-system.bonus.cunn", mask: "system.abilities.cunn.total", dtype: 'number'},
    "cunnTest": {label: "age-system.bonus.cunnTest", mask: "system.abilities.cunn.testMod", dtype: 'number'},
    "dex": {label: "age-system.bonus.dex", mask: "system.abilities.dex.total", dtype: 'number'},
    "dexTest": {label: "age-system.bonus.dexTest", mask: "system.abilities.dex.testMod", dtype: 'number'},
    "fight": {label: "age-system.bonus.fight", mask: "system.abilities.fight.total", dtype: 'number'},
    "fightTest": {label: "age-system.bonus.fightTest", mask: "system.abilities.fight.testMod", dtype: 'number'},
    "int": {label: "age-system.bonus.int", mask: "system.abilities.int.total", dtype: 'number'},
    "intTest": {label: "age-system.bonus.intTest", mask: "system.abilities.int.testMod", dtype: 'number'},
    "magic": {label: "age-system.bonus.magic", mask: "system.abilities.magic.total", dtype: 'number'},
    "magicTest": {label: "age-system.bonus.magicTest", mask: "system.abilities.magic.testMod", dtype: 'number'},
    "per": {label: "age-system.bonus.per", mask: "system.abilities.per.total", dtype: 'number'},
    "perTest": {label: "age-system.bonus.perTest", mask: "system.abilities.per.testMod", dtype: 'number'},
    "str": {label: "age-system.bonus.str", mask: "system.abilities.str.total", dtype: 'number'},
    "strTest": {label: "age-system.bonus.strTest", mask: "system.abilities.str.testMod", dtype: 'number'},
    "will": {label: "age-system.bonus.will", mask: "system.abilities.will.total", dtype: 'number'},
    "willTest": {label: "age-system.bonus.willTest", mask: "system.abilities.will.testMod", dtype: 'number'},
    "defense": {label: "age-system.bonus.defense", mask: "system.defense.total", dtype: 'nodice'},
    "impactArmor": {label: "age-system.bonus.impactArmor", mask: "system.armor.impact", dtype: 'nodice'},
    "ballisticArmor": {label: "age-system.bonus.ballisticArmor", mask: "system.armor.ballistic", dtype: 'nodice'},
    "defendMnv": {label: "age-system.bonus.defendMnv", mask: "system.defend.total", dtype: 'nodice'},
    "guardupMnv": {label: "age-system.bonus.guardupMnv", mask: "system.guardUp.total", dtype: 'nodice'},
    "allOutAtkMnv": {label: "age-system.bonus.allOutAtkMnv", mask: "system.allOutAttack.total", dtype: 'formula'},
    "maxHealth": {label: "age-system.bonus.maxHealth", mask: "system.health.max", dtype: 'nodice'},
    "maxConviction": {label: "age-system.bonus.maxConviction", mask: "system.conviction.max", dtype: 'nodice'},
    "maxPowerPoints": {label: "age-system.bonus.maxPowerPoints", mask: "system.powerPoints.max", dtype: 'nodice'},
    "aimMnv": {label: "age-system.bonus.aimMnv", mask: "system.aim.total", dtype: 'nodice'},
    "armorPenalty": {label: "age-system.bonus.armorPenalty", mask: "system.armor.penalty", dtype: 'nodice'},
    "armorStrain": {label: "age-system.bonus.armorStrain", mask: "system.armor.strain", dtype: 'nodice'},
    "speed": {label: "age-system.bonus.speed", mask: "system.speed.total", dtype: 'nodice'},
    "toughness": {label: "age-system.bonus.toughness", mask: "system.armor.toughness.total", dtype: 'nodice'},
}

ageSystem.itemEffectsKeys = {
    "powerForce": {label: "age-system.bonus.powerForce", mask: "", dtype: 'nodice'},
    "focus": {label: "age-system.bonus.focusValue", mask: "", dtype: 'nodice', hasOption: true},
    "itemDamage": {label: "age-system.bonus.generalDmg", mask: "", dtype: 'formula'},
    "itemActivation": {label: "age-system.bonus.itemAtk", mask: "", dtype: 'nodice'},
    "allPowerForce": {label: "age-system.bonus.allPowerForce", mask: "", dtype: 'nodice'},
    "focusPowerForce": {label: "age-system.bonus.focusPowerForce", mask: "", dtype: 'nodice', hasOption: true},
}

// List of Mods Per setup
ageSystem.modifiers = {
    others: ["maxHealth", "maxConviction"],
    armorMods: {
        expanse: ["impactArmor", 'toughness'],
        mage: ["impactArmor", "ballisticArmor", "toughness"],
        mageInjury: ["impactArmor", "ballisticArmor", "toughness"],
        basic: ["impactArmor"]
    },
    ablMods: {
        main: ["acc", "comm", "cons", "dex", "fight", "int", "per", "str", "will", "accTest", "commTest", "consTest", "dexTest", "fightTest", "intTest", "perTest", "strTest", "willTest"],
        dage: ["comm", "cons", "cunn", "dex", "magic", "per", "str", "will", "commTest", "consTest", "cunnTest", "dexTest", "magicTest", "perTest", "strTest", "willTest"]
    },
    generalMods: ["powerForce", "aimMnv", "armorPenalty", "itemDamage", "testMod", "attackMod", "actorDamage", "itemActivation", "focus", "defense", "speed",
        "armorStrain", "defendMnv", "guardupMnv", "allOutAtkMnv", "maxPowerPoints", "allPowerForce", "focusPowerForce"
    ],
    modeToLocalize: ["impactArmor", "powerForce", "maxPowerPoints", "maxHealth"]
};

// Collection of all mod keys
ageSystem.modkeys = {
    ...ageSystem.ageEffectsKeys,
    ...ageSystem.itemEffectsKeys,
}

// Age Tracker & Roller Initial Positions
ageSystem.ageTrackerPos = {xPos: "260px", yPos: "69px"};
ageSystem.ageRollerPos = {xPos: "836px", yPos: "10px"};

// Initializing variable to load focus Compendiaum
ageSystem.focus = [];

// List with world's Item compendia
ageSystem.itemCompendia = [];

// Object map with world's RollTables
ageSystem.complicationRollTable = "none";
ageSystem.rollTables = [];

// Roll Types definition
ageSystem.ROLL_TYPE = {
    ATTACK: "attack",
    MELEE_ATTACK: "meleeAttack",
    RANGED_ATTACK: "rangedAttack",
    STUNT_ATTACK: 'stuntAttack',
    FATIGUE: "fatigue",
    TOUGHNESS: "toughness",
    TOUGHNESS_AUTO: "toughnessAuto",
    RESOURCES: "resources",
    POWER: "powerActivation",
    ABILITY: 'ability',
    FOCUS: 'focus',
    TALENT: 'talent',
    VEHICLE_ACTION: 'vehicle',
    PLOT_ACTION: 'plotAction',
    PLOT_DAMAGE: 'plotDamage',
};

// Scrolling text colors
ageSystem.tokenTextColors = {
    damage: 0xFF0000,
    healing: 0x00FF00,
    power: 0x0000FF
}

// Wiki website!
ageSystem.wiki = 'https://github.com/vkdolea/age-system/wiki';

// Logos
const pathLogo = `systems/age-system/resources/logo/`
ageSystem.greenRonin = {
    modernAGE: {
        logo: `${pathLogo}modern-age.png`,
        site: `https://modernagerpg.com`
    },
    fantasyAGE: {
        logo: `${pathLogo}fantasy-age.png`,
        site: `https://greenronin.com/fantasyage/`
    },
    titansgrave: {
        logo: `${pathLogo}titansgrave.png`,
        site: `https://titansgraverpg.com`
    },
    dragonAGE: {
        logo: `${pathLogo}dragon-age.png`,
        site: `https://greenronin.com/dragonagerpg/`
    },
    lazaurs: {
        logo: `${pathLogo}lazarus.png`,
        site: ``
    },
    bluerose: {
        logo: `${pathLogo}bluerose.png`,
        site: `https://blueroserpg.com`
    },
    freeport: {
        logo: `${pathLogo}freeport.png`,
        site: `https://greenronin.com/freeport/`
    },
    lostcitadel: {
        logo: `${pathLogo}lostcitadel.png`,
        site: `https://lostcitadelrpg.com`
    },
    expanse: {
        logo: `${pathLogo}expanse.png`,
        site: `https://greenroninstore.com/collections/the-expanse-rpg`
    },
    // agesystem: {
    //     logo: `${pathLogo}agesystem.png`,
    //     site: `https://greenroninstore.com/collections/age-system`
    // },
    // threefold: {
    //     logo: `${pathLogo}threefold.png`,
    //     site: `https://greenroninstore.com/products/threefold`
    // }
}

// Talent Degrees
ageSystem.talentDegrees = {
    mage: ['age-system.novice', 'age-system.expert', 'age-system.master'],
    fage: ['age-system.novice', 'age-system.journeyman', 'age-system.master'],
    mageExtra: ['age-system.novice', 'age-system.expert', 'age-system.master', 'age-system.grandmaster', 'age-system.apex'],
    fageExtra: ['age-system.novice', 'age-system.journeyman', 'age-system.master', 'age-system.grandmaster', 'age-system.apex'],
};


// Game Settings
ageSystem.gameSettingsChoices = {
    dage: 'Dragon AGE',
    fage: 'Fantasy AGE',
    expanse: 'The Expanse',
    mage: 'Modern AGE',
    brose: 'Blue Rose'
};

// Advanced Settings
ageSystem.advSettings = [
    'healthSys',
    'healthMode',
    'gameMode',
    'abilitySelection',
    'primaryAbl',
    'occupation',
    'ancestryOpt',
    'DegressChoice',
    'wealthType',
    'stuntAttack',
    'usePowerPoints',
    'useFatigue',
    'useConviction',
    'complication',
    'complicationRollTable',
    'serendipity',
    'weaponGroups',
]

ageSystem.gameSettings = {
    dage: {
        name: "dage",
        label: "age-system.presets.dage",
        hint: "age-system.presets.dageHint",
        img: ageSystem.greenRonin.dragonAGE.logo,
        link: ageSystem.greenRonin.dragonAGE.site,
        settings: {
            defined: {
                healthSys: 'basic',
                healthMode: 'health',
                abilitySelection: 'dage',
                primaryAbl: true,
                gameMode: 'none',
                wealthType: 'coins',
                occupation: 'class',
                ancestryOpt: 'race',
                useConviction: false,
                usePowerPoints: true,
                complication: 'none',
                serendipity: false,
                powerFlavor: 'mana'
            },
            user: ['weaponGroups']
        }
    },
    fage: {
        name: "fage",
        label: "age-system.presets.fage",
        hint: "age-system.presets.fageHint",
        img: ageSystem.greenRonin.fantasyAGE.logo,
        link: ageSystem.greenRonin.fantasyAGE.site,
        settings: {
            defined: {
                healthSys: 'basic',
                healthMode: 'health',
                abilitySelection: 'main',
                primaryAbl: true,
                gameMode: 'none',
                wealthType: 'coins',
                occupation: 'class',
                ancestryOpt: 'race',
                useConviction: false,
                usePowerPoints: true,
                complication: 'none',
                complicationRollTable: 'none',
                serendipity: false,
                powerFlavor: 'spell'
            },
            user: ['weaponGroups']
        }
    },
    expanse: {
        name: "expanse",
        label: "age-system.presets.expanse",
        hint: "age-system.presets.expanseHint",
        img: ageSystem.greenRonin.expanse.logo,
        link: ageSystem.greenRonin.expanse.site,
        settings: {
            defined: {
                healthSys: 'expanse',
                healthMode: 'fortune',
                abilitySelection: 'main',
                primaryAbl: false,
                gameMode: 'none',
                weaponGroups: "",
                wealthType: 'income',
                occupation: 'profession',
                ancestryOpt: 'origin',
                useConviction: false,
                usePowerPoints: false,
                complication: 'churn',
                complicationRollTable: 'none',
                serendipity: false
            }
        }
    },
    mage: {
        name: "mage",
        label: "age-system.presets.mage",
        hint: "age-system.presets.mageHint",
        img: ageSystem.greenRonin.modernAGE.logo,
        link: ageSystem.greenRonin.modernAGE.site,
        settings: {
            defined: {
                healthSys: 'mage',
                healthMode: 'health',
                abilitySelection: 'main',
                primaryAbl: false,
                weaponGroups: "",
                wealthType: 'resources',
                occupation: 'profession',
                ancestryOpt: 'ancestry',
                complication: 'none',
                complicationRollTable: 'none',
                serendipity: false,
                stuntAttack: 2
            },
            user: ['gameMode', 'useConviction', 'usePowerPoints', 'powerFlavor']
        }
    },
    brose: {
        name: "brose",
        label: "age-system.presets.brose",
        hint: "age-system.presets.broseHint",
        img: ageSystem.greenRonin.bluerose.logo,
        link: ageSystem.greenRonin.bluerose.site,
        settings: {
            defined: {
                healthSys: 'basic',
                healthMode: 'health',
                abilitySelection: 'main',
                primaryAbl: true,
                gameMode: 'none',
                wealthType: 'coins',
                occupation: 'class',
                ancestryOpt: 'race',
                useConviction: true,
                usePowerPoints: false,
                complication: 'none',
                complicationRollTable: 'none',
                serendipity: false
            },
            user: ['weaponGroups']
        }
    },

}