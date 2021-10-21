export default class ConditionsWorkshop extends Application {
  constructor(options = {}) {
    super(options)
    this._inUseEffects = CONFIG.statusEffects;
    this._inUseConditions = game.settings.get("age-system", "inUseConditions");
    this._customEffects = game.settings.get("age-system", "customTokenEffects");
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['age-system-dialog', 'age-system'],
      id: 'age-conditions-workshop',
      template: 'systems/age-system/templates/conditions-workshop.hbs',
      resizable: true,
      minimizable: false,
      width: 900,
      height: 'auto',
      title: game.i18n.localize('age-system.conditionsWorkshop'),
    })
  }

  getData() {
    const data = super.getData();
    // data.conditions = CONFIG.statusEffects;
    data.modes = CONST.ACTIVE_EFFECT_MODES;
    data.conditions = this._customEffects;
    // data.handler = this._handler;

    // data.radioB = {
    //   name: "handler.armorPenetration",
    //   choices: {
    //     none: game.i18n.localize('age-system.none'),
    //     half: game.i18n.localize('age-system.halfArmor'),
    //     ignore: game.i18n.localize('age-system.ignoreArmor')
    //   },
    //   options: {
    //     hash: {
    //       checked: data.handler.armorPenetration
    //     }
    //   }
    // }
    return data
  }

  activateListeners(html) {
    super.activateListeners(html)

    // Modify Armor Penetration properties for all targets
    html.find(".effect-control").click(this._onManageChange.bind(this));

    // // Change Basic Damage for all targets - using symbols ( - or +)
    // html.find(".overall-dmg .change-damage").click(ev => {
    //   let dmg = this._handler.basicDamage;
    //   const classes = ev.currentTarget.classList;
    //   if (classes.contains("increase")) dmg += 1;
    //   if (classes.contains("decrease")) dmg -= 1;
    //   if (dmg < 0) dmg = 0
    //   this._handler.basicDamage = dmg;
    //   this.updateUI()
    // });
    
    // // Typing updates on input field for basic damage (all targets)
    // html.find("input.basic-damage").change(ev => {
    //   const value = ev.currentTarget.value
    //   this._handler.basicDamage = value;
    //   this.updateUI()
    // })
  }

  _onManageChange(ev) {
    const conditionIndex = ev.currentTarget.closest('.individual-effects').dataset.conditionI;
    const changeIndex = ev.currentTarget.closest('.effect-change').dataset.index;
    const condition = this._customEffects[conditionIndex];
    const operation = ev.currentTarget.dataset.action;
    switch (operation) {
      case 'add':
        const newEffect = {
          key: "",
          mode: "",
          value: ""
        };
        if (condition.changes) {
          condition.changes.push(newEffect)
        } else {
          condition.changes = [newEffect]
        }
        break;
    
      case 'delete':
        condition.changes.splice(changeIndex, 1);

      default:
        break;
    }
    this.updateUI()
  };

  updateUI() {
    this.render(false)
  }

  async summaryToChat (summary, useInjury) {
    const chatTemplate = "/systems/age-system/templates/rolls/damage-summary.hbs";
    const templateData = {
      summary,
      useInjury,
      healthName: CONFIG.ageSystem.healthSys.healthName
    }
    let chatData = {
      user: game.user.id,
      content: await renderTemplate(chatTemplate, templateData),
      type: CONST.CHAT_MESSAGE_TYPES.OOC,
    }
    await ChatMessage.applyRollMode(chatData, 'gmroll');
    ChatMessage.create(chatData);
  }

}

export class AgeTokenEffectsHandler {
  constructor(effects) {

  }
}

// export class ConditionHandler {
//   constructor(targets, damageData) {
//     const healthSys = damageData.healthSys;
//     this._damageData = damageData
//     this._useBallistic = healthSys._useBallistic;
//     this._useInjury = healthSys.useInjury;
//     this._basicDamage = damageData.totalDamage;
//     this._armorPenetration = "none";
//     this._damageType = damageData.dmgType;
//     this._damageSource = damageData.dmgSrc;
//     this._letPlayerRoll = true;

//     let harmedOnes = [];
//     for (let t = 0; t < targets.length; t++) {
//       const h = targets[t];
//       const data = foundry.utils.deepClone(h.actor.data);
//       harmedOnes.push({
//         name: h.actor.name,
//         img: h.data.img,
//         uuid: h.data.actorLink ? h.actor.uuid : h.document.uuid,
//         data,
//         dmgMod: 0,
//         remainingHP: 0,
//         damage: 0,
//         ignoreDmg: false,
//         autoInjury: !data.document.hasPlayerOwner,
//         injuryMarks: data.data.injury.marks,
//         injurySDpenalty: Math.floor(data.data.injury.marks/3),
//         testMod: data.data.ownedMods?.testMod ? data.data.ownedMods.testMod : 0,
//         toughMod: 0
//       })
//     }
//     this._harmedOnes = harmedOnes.map(harmed => this.damage(harmed, this._damageData));
//   }

//   set harmedOnes(value) {
//     this._harmedOnes = value;
//   }

//   get harmedOnes() {
//     return this._harmedOnes.map(harmed => this.damage(harmed, this._damageData));
//   }

//   set armorPenetration(value) {
//     this._armorPenetration = value;
//   }

//   get armorPenetration() {
//     return this._armorPenetration;
//   }

//   set basicDamage(value) {
//     this._basicDamage = value;
//   }

//   get basicDamage() {
//     return this._basicDamage;
//   }

//   get armorPenetrationMult() {
//     const ap = this.armorPenetration;
//     if (ap === "half") return 0.5;
//     if (ap === "ignore") return 0;
//     return 1;
//   }

//   set letPlayerRoll(value) {
//     this._letPlayerRoll = value;
//   }

//   get letPlayerRoll() {
//     return this._letPlayerRoll;
//   }

//   damage(h, d) {
//     let ap = this.armorPenetration;
//     let injuryParts = [];
//     if (ap === "none") ap = 1;
//     if (ap === "half") ap = 0.5;
//     if (ap === "ignore") ap = 0;
//     const impactArmor = Math.floor(h.data.data.armor.impact * ap);
//     const ballisticArmor = Math.floor(h.data.data.armor.ballistic * ap);
//     const toughness = h.data.data.armor.toughness.total > 0 ? h.data.data.armor.toughness.total : 0;
//     const applyToughness = this.useToughness(d.healthSys.useToughness, this._damageType, this._damageSource, d.healthSys.mode);
//     const totalDmg = Number(this.basicDamage) + Number(h.dmgMod);
    
//     let dmgProtection
//     if (this._useInjury) {
//       dmgProtection = applyToughness ? toughness : Math.ceil(toughness/2);
//       injuryParts.push({
//         label: game.i18n.localize("age-system.toughness"),
//         value: dmgProtection
//       })

//       dmgProtection += h.toughMod;
//       if (h.toughMod !== 0) injuryParts.push({
//         label: game.i18n.localize("age-system.mod"),
//         value: h.toughMod
//       })

//       dmgProtection -= h.injuryMarks;
//       // Injury Marks is not sent to chat card: when prompting for Toughness Roll, character will first check for current Marks and them apply to roll

//       dmgProtection += h.testMod;
//       if (h.testMod) injuryParts.push({
//         label: game.i18n.localize("age-system.bonus.testMod"),
//         value: h.testMod
//       })
//     } else {
//       dmgProtection = applyToughness ? toughness : 0;
//     }

//     let armorDesc
//     if (this._useBallistic && this._damageSource === 'ballistic') {
//       dmgProtection += ballisticArmor;
//       armorDesc = {
//         label: game.i18n.localize("age-system.ballisticArmor"),
//         value: ballisticArmor
//       }
//     } 
//     if (this._useBallistic && this._damageSource === 'impact') {
//       dmgProtection += impactArmor;
//       armorDesc = {
//         label: game.i18n.localize("age-system.impactArmor"),
//         value: impactArmor
//       }
//     }
    
//     if (!this._useBallistic && this._damageSource !== 'penetrating') {
//       dmgProtection += impactArmor;
//       armorDesc = {
//         label: game.i18n.localize("age-system.armor"),
//         value: impactArmor
//       } 
//     }
//     if (armorDesc) injuryParts.push(armorDesc);

//     let reducedDmg = totalDmg - dmgProtection;
//     if (reducedDmg < 0) reducedDmg = 0;

//     if (h.ignoreDmg) {
//       h.remainingHP = h.data.data.health.value;
//       h.totalDmg = 0;
//       h.dmgProtection = dmgProtection;
//     } else {
//       h.remainingHP = h.data.data.health.value - reducedDmg;
//       if (h.remainingHP < 0) h.remainingHP = 0;
//       h.damage = reducedDmg
//       h.totalDmg = Number(totalDmg);
//       h.dmgProtection = dmgProtection;
//       h.injuryParts = injuryParts;
//     }

//     return h;
//   }

//   useToughness(setting, type, source, mode) {
//     if (!setting) return false;
//     if (mode === 'none') return true;
//     if (mode === 'gritty') {
//       if (['penetrating', 'impact'].includes(source) && ['stun'].includes(type)) return true;
//     }
//     if (mode === 'pulp') {
//       if (['penetrating', 'impact'].includes(source) && ['stun', 'wound'].includes(type)) return true;
//     }
//     if (mode === 'cinematic') {
//       if (!(['penetrating'].includes(source) && ['wound'].includes(type))) return true;
//     }
//     return false;
//   }
// }