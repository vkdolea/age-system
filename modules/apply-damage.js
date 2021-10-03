import * as Dice from "./dice.js";

export default class ApplyDamageDialog extends Application {
  constructor(targets, damageData, useInjury, options = {}) {
    super(options)

    if (!Array.isArray(targets)) targets = [targets]

    this.targets = targets;
    this.damageData = damageData;
    this.useInjury = useInjury;
    this._handler = new DamageHandler(targets, damageData);
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['age-system-dialog', 'age-system'],
      id: 'apply-damage-window',
      template: 'systems/age-system/templates/apply-damage-window.hbs',
      resizable: true,
      minimizable: false,
      width: 800,
      height: 'auto',
      title: game.i18n.localize('age-system.applyDamage'),
    })
  }

  getData() {
    const data = super.getData();
    data.targets = this.targets;
    data.damageData = this.damageData;
    data.useInjury = this.useInjury;
    data.handler = this._handler;

    data.radioB = {
      name: "handler.armorPenetration",
      choices: {
        none: game.i18n.localize('age-system.none'),
        half: game.i18n.localize('age-system.halfArmor'),
        ignore: game.i18n.localize('age-system.ignoreArmor')
      },
      options: {
        hash: {
          checked: data.handler.armorPenetration
        }
      }
    }
    return data
  }

  activateListeners(html) {
    super.activateListeners(html)

    // Modify Armor Penetration properties for all targets
    html.find(".armor-penetration input").click(ev => {
      const newValue = ev.currentTarget.value
      this._handler.armorPenetration = newValue;
      this.updateUI()
    });

    // Change Basic Damage for all targets - using symbols ( - or +)
    html.find(".overall-dmg .change-damage").click(ev => {
      let dmg = this._handler.basicDamage;
      const classes = ev.currentTarget.classList;
      if (classes.contains("increase")) dmg += 1;
      if (classes.contains("decrease")) dmg -= 1;
      if (dmg < 0) dmg = 0
      this._handler.basicDamage = dmg;
      this.updateUI()
    });
    
    // Typing updates on input field for basic damage (all targets)
    html.find("input.basic-damage").change(ev => {
      const value = ev.currentTarget.value
      this._handler.basicDamage = value;
      this.updateUI()
    })

    // Individual target mod (using + or -)
    html.find(".targets .individual .change-damage").click(ev => {
      const i = ev.target.closest(".feature-controls").dataset.i;
      let dmg = this._handler.harmedOnes[i].dmgMod;
      const classes = ev.currentTarget.classList;
      if (classes.contains("increase")) dmg += 1;
      if (classes.contains("decrease")) dmg -= 1;
      this._handler.harmedOnes[i].dmgMod = dmg;
      this.updateUI()
    });

    // Individual target Toughness Mod (using + or -)
    html.find(".targets .change-toughness").click(ev => {
      const i = ev.target.closest(".feature-controls").dataset.i;
      let mod = this._handler.harmedOnes[i].toughMod;
      const classes = ev.currentTarget.classList;
      if (classes.contains("increase")) mod += 1;
      if (classes.contains("decrease")) mod -= 1;
      this._handler.harmedOnes[i].toughMod = mod;
      this.updateUI()
    });

    // Typing updates on input field for individual target
    html.find(".targets .individual input.target-damage-mod").change(ev => {
      const value = ev.currentTarget.value
      const i = ev.target.closest(".feature-controls").dataset.i;
      this._handler.harmedOnes[i].dmgMod = value;
      this.updateUI()
    })

    // Select if that target will be spared
    html.find(".targets .individual .do-not-apply").change(ev => {
      const checked = ev.currentTarget.checked;
      const i = ev.target.closest(".feature-controls").dataset.i;
      this._handler.harmedOnes[i].ignoreDmg = checked;
    });

    // Select if that target will have Injury Auto implemented
    html.find(".targets .individual .auto-apply-injury").change(ev => {
      const checked = ev.currentTarget.checked;
      const i = ev.target.closest(".feature-controls").dataset.i;
      this._handler.harmedOnes[i].autoInjury = checked;
    });

    html.find("button.apply-damage").click(async (ev) => {
      const applyAll = ev.currentTarget.classList.contains('auto-apply-all');
      const summary = [];
      const victims = this._handler.harmedOnes.map(async (h) => {
        if (!h.ignoreDmg) {
          let actor = await fromUuid(h.uuid);
          if (actor.documentName === "Token")actor = actor.actor;
          if (!this.useInjury) {
            summary.push(this.applyHPloss(actor, h.remainingHP));
          } else {
            // Toughness Test
            const applyInjury = applyAll || h.autoInjury;
            const card = await this.toughnessTest(actor, h.injuryParts, h.totalDmg, applyInjury)
            const cardFlag = card.data.flags["age-system"].rollData;
            const degree = cardFlag.injuryDegree;
            if (applyInjury && !cardFlag.isSuccess && degree !== null) summary.push(this.applyInjury(actor, degree));
          };
        }
      });
      await Promise.all(victims).then(async() => {this.summaryToChat(summary, this.useInjury)})
      this.close();
    })
  }

  updateUI() {
    this.render(false)
  }

  toughnessTest (actor, parts, rollTN, applyInjury = false) {
    // const card = await toughnessTest(actor, h.injuryParts, h.totalDmg, applyAll)
    const rollData = {
      actor,
      event: new MouseEvent('click'),
      rollTN,
      rollType: applyInjury ? CONFIG.ageSystem.ROLL_TYPE.TOUGHNESS_AUTO : CONFIG.ageSystem.ROLL_TYPE.TOUGHNESS,
      moreParts: parts,
      flavor: actor.name,
      flavor2: `${game.i18n.localize("age-system.toughnessTest")}`
    };
    return Dice.ageRollCheck(rollData);
  }

  applyInjury (actor, injuryDegree) {
    // Identify correct path and new amount for that degree
    const updateDegree = `data.injury.degrees.${injuryDegree}`;
    const newDegree = actor.data.data.injury.degrees[injuryDegree] + 1;
    // Carries totalInjuries to summary
    const totalInjuries = foundry.utils.deepClone(actor.data.data.injury.degrees);
    totalInjuries[injuryDegree] = newDegree;
    // Calculate new marks
    let newMarks = (injuryDegree === 'severe') ? actor.data.data.injury.degrees.severeMult : 1;
    newMarks += actor.data.data.injury.marks;
    // Update Actor's injuries and marks
    actor.update({
      [updateDegree]: newDegree,
      'data.injury.marks': newMarks
    });
    // Returns a summary array
    return {
      name: actor.name,
      img: actor.data.token.img,
      degree: injuryDegree,
      totalInjuries,
      newMarks
    }
  }

  applyHPloss (actor, remainingHP) {
    const summary = {
      name: actor.name,
      img: actor.data.token.img,
      previousHP: actor.data.data.health.value,
      newHP: remainingHP
    };
    actor.update({"data.health.value": remainingHP});
    return summary
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
      speaker: ChatMessage.getSpeaker(),
      content: await renderTemplate(chatTemplate, templateData),
      type: CONST.CHAT_MESSAGE_TYPES.OOC,
    }
    await ChatMessage.applyRollMode(chatData, 'gmroll');
    ChatMessage.create(chatData);
  }
}

export class DamageHandler {
  constructor(targets, damageData) {
    const healthSys = damageData.healthSys;
    this._damageData = damageData
    this._useBallistic = healthSys._useBallistic;
    this._useInjury = healthSys.useInjury;
    this._basicDamage = damageData.totalDamage;
    this._armorPenetration = "none";
    this._damageType = damageData.dmgType
    this._damageSource = damageData.dmgSrc


    let harmedOnes = [];
    for (let t = 0; t < targets.length; t++) {
      const h = targets[t];
      const data = foundry.utils.deepClone(h.actor.data);
      harmedOnes.push({
        name: h.name,
        img: h.data.img,
        uuid: h.data.actorLink ? h.actor.uuid : h.document.uuid,
        data,
        dmgMod: 0,
        remainingHP: 0,
        damage: 0,
        ignoreDmg: false,
        autoInjury: !data.document.hasPlayerOwner,
        injuryMarks: data.data.injury.marks,
        injurySDpenalty: Math.floor(data.data.injury.marks/3),
        testMod: data.data.ownedMods?.testMod ? data.data.ownedMods.testMod : 0,
        toughMod: 0
      })
    }
    this._harmedOnes = harmedOnes.map(harmed => this.damage(harmed, this._damageData));
  }

  set harmedOnes(value) {
    this._harmedOnes = value;
  }

  get harmedOnes() {
    return this._harmedOnes.map(harmed => this.damage(harmed, this._damageData));
  }

  set armorPenetration(value) {
    this._armorPenetration = value;
  }

  get armorPenetration() {
    return this._armorPenetration;
  }

  set basicDamage(value) {
    this._basicDamage = value;
  }

  get basicDamage() {
    return this._basicDamage;
  }

  get armorPenetrationMult() {
    const ap = this.armorPenetration;
    if (ap === "half") return 0.5;
    if (ap === "ignore") return 0;
    return 1;
  }

  damage(h, d) {
    let ap = this.armorPenetration;
    let injuryParts = [];
    if (ap === "none") ap = 1;
    if (ap === "half") ap = 0.5;
    if (ap === "ignore") ap = 0;
    const impactArmor = Math.floor(h.data.data.armor.impact * ap);
    const ballisticArmor = Math.floor(h.data.data.armor.ballistic * ap);
    const toughness = h.data.data.armor.toughness.total > 0 ? h.data.data.armor.toughness.total : 0;
    const applyToughness = this.useToughness(d.healthSys.useToughness, this._damageType, this._damageSource, d.healthSys.mode);
    const totalDmg = Number(this.basicDamage) + Number(h.dmgMod);
    
    let dmgProtection
    if (this._useInjury) {
      dmgProtection = applyToughness ? toughness : Math.ceil(toughness/2);
      injuryParts.push({
        label: game.i18n.localize("age-system.toughness"),
        value: dmgProtection
      })

      dmgProtection += h.toughMod;
      if (h.toughMod !== 0) injuryParts.push({
        label: game.i18n.localize("age-system.mod"),
        value: h.toughMod
      })

      dmgProtection -= h.injuryMarks;
      injuryParts.push({
        label: game.i18n.localize("age-system.injuryMarks"),
        value: -h.injuryMarks
      })

      dmgProtection += h.testMod;
      if (h.testMod) injuryParts.push({
        label: game.i18n.localize("age-system.bonus.testMod"),
        value: h.testMod
      })
    } else {
      dmgProtection = applyToughness ? toughness : 0;
    }

    let armorDesc
    if (this._useBallistic && this._damageSource === 'ballistic') {
      dmgProtection += ballisticArmor;
      armorDesc = {
        label: game.i18n.localize("age-system.ballisticArmor"),
        value: ballisticArmor
      }
    } 
    if (this._useBallistic && this._damageSource === 'impact') {
      dmgProtection += impactArmor;
      armorDesc = {
        label: game.i18n.localize("age-system.impactArmor"),
        value: impactArmor
      }
    }
    if (!this._useBallistic && this._damageSource !== 'penetrating') {
      dmgProtection += impactArmor;
      armorDesc = {
        label: game.i18n.localize("age-system.armor"),
        value: impactArmor
      } 
    }
    if (armorDesc) injuryParts.push(armorDesc);

    const reducedDmg = totalDmg - dmgProtection;
    if (reducedDmg < 0) reducedDmg === 0;

    if (h.ignoreDmg) {
      h.remainingHP = h.data.data.health.value;
      h.totalDmg = 0;
      h.dmgProtection = dmgProtection;
    } else {
      h.remainingHP = h.data.data.health.value - reducedDmg;
      h.damage = reducedDmg
      h.totalDmg = totalDmg;
      h.dmgProtection = dmgProtection;
      h.injuryParts = injuryParts;
    }

    return h;
  }

  useToughness(setting, type, source, mode) {
    if (!setting) return false;
    if (mode === 'none') return true;
    if (mode === 'gritty') {
      if (['penetrating', 'impact'].includes(source) && ['stun'].includes(type)) return true;
    }
    if (mode === 'pulp') {
      if (['penetrating', 'impact'].includes(source) && ['stun', 'wound'].includes(type)) return true;
    }
    if (mode === 'cinematic') {
      if (!(['penetrating'].includes(source) && ['wound'].includes(type))) return true;
    }
    return false;
  }
}