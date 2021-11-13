import {ageSystem} from "./config.js";

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
      width: 900,
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
    data.config = ageSystem;

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

    // Modify Damage Type
    html.find('select.damage-type').change(ev => {
      const newValue = ev.currentTarget.value;
      this._handler.damageType = newValue;
      this.updateUI();
    })

    // Modify Damage Source
    html.find('select.damage-source').change(ev => {
      const newValue = ev.currentTarget.value;
      this._handler.damageSource = newValue;
      this.updateUI();
    })

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
      this._handler.letPlayerRoll = value;
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

    // Change Let Player Roll Toughness Test
    html.find(".players-roll").change(ev => {
      const checked = ev.currentTarget.checked;
      this._handler.letPlayerRoll = checked;
    });

    html.find("button.apply-damage").click(async (ev) => {
      const applyInjuryAll = ev.currentTarget.classList.contains('apply-all');
      const summary = [];
      const victims = this._handler.harmedOnes.map(async (h) => {
        if (!h.ignoreDmg) {
          const applyInjury = applyInjuryAll || h.autoInjury;
          let actor = await fromUuid(h.uuid);
          if (actor.documentName === "Token") actor = actor.actor;
          if (!this.useInjury) {
            summary.push(actor.applyHPloss(h.remainingHP));
          } else {
            // Toughness Test
            if (actor.hasPlayerOwner && this._handler.letPlayerRoll) {
              this.promptPlayerToRoll(actor, h.injuryParts, h.totalDmg, applyInjury);
            } else {
              const card = await actor.toughnessTest(h.injuryParts, h.totalDmg, applyInjury);
              const cardFlag = card.data.flags["age-system"].ageroll.rollData;
              const degree = cardFlag.injuryDegree;
              if (applyInjury && !cardFlag.isSuccess && degree !== null) summary.push({
                name: actor.name,
                img: actor.data.token.img,
                degree,
                totalInjuries: foundry.utils.deepClone(actor.data.data.injury.degrees),
                newMarks: actor.data.data.injury.marks
              });
            }
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

  async promptPlayerToRoll (actor, injuryParts, totalDmg, autoApply) {
    const chatTemplate = "/systems/age-system/templates/rolls/owner-roll-toughness.hbs";
    const templateData = {
      img: actor.data.token.img,
      name: actor.name
    }

    let owners = [];
    for (const u of game.users) {
      if (actor.testUserPermission(u, 'OWNER') && u.id !== game.user.id) owners.push(u.id)
    }
    let chatData = {
      user: game.user.id,
      content: await renderTemplate(chatTemplate, templateData),
      type: CONST.CHAT_MESSAGE_TYPES.OOC,
      whisper: owners,
      flags: {
        "age-system": {
          "toughnessTestCard": {
            injuryParts,
            rollTN: totalDmg,
            autoApply,
            actorUuid: actor.uuid
          }
        }
      }
    }
    // await ChatMessage.applyRollMode(chatData, 'roll');
    ChatMessage.create(chatData);
  }
}

export class DamageHandler {
  constructor(targets, damageData) {
    const healthSys = damageData.healthSys;
    this._damageData = damageData
    this._useBallistic = healthSys.useBallistic;
    this._useInjury = healthSys.useInjury;
    this._basicDamage = damageData.totalDamage;
    this._armorPenetration = "none";
    this._damageType = damageData.dmgType;
    this._damageSource = damageData.dmgSrc;
    this._letPlayerRoll = true;

    let harmedOnes = [];
    for (let t = 0; t < targets.length; t++) {
      const h = targets[t];
      const data = foundry.utils.deepClone(h.actor.data);
      harmedOnes.push({
        name: h.actor.name,
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

  set damageType(value) {
    this._damageType = value;
    this._damageData.dmgType = value
  }

  get damageType() {
    return this._damageType;
  }

  set damageSource(value) {
    this._damageSource = value;
    this._damageData.dmgSrc = value;
  }

  get damageSource() {
    return this._damageSource;
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

  set letPlayerRoll(value) {
    this._letPlayerRoll = value;
  }

  get letPlayerRoll() {
    return this._letPlayerRoll;
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
      // Injury Marks is not sent to chat card: when prompting for Toughness Roll, character will first check for current Marks and them apply to roll

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

    let reducedDmg = totalDmg - dmgProtection;
    if (reducedDmg < 0) reducedDmg = 0;

    if (h.ignoreDmg) {
      h.remainingHP = h.data.data.health.value;
      h.totalDmg = 0;
      h.dmgProtection = dmgProtection;
    } else {
      h.remainingHP = h.data.data.health.value - reducedDmg;
      if (h.remainingHP < 0) h.remainingHP = 0;
      h.damage = reducedDmg
      h.totalDmg = Number(totalDmg);
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