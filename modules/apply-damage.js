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
    data.damageData.finalDmg = 10 * data.handler.basicDamage;

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

    html.find("button.apply-damage").click(ev => {
      this._handler.harmedOnes.map(async (h) => {
        if (!h.ignoreDmg) {
          let actor = await fromUuid(h.uuid);
          if (actor.documentName === "Token") actor = actor.actor;
          actor.update({"data.health.value": h.remainingHP})
        }
      })
      this.close();
    })
  }

  updateUI() {
    this.render(false)
  }
}

export class DamageHandler {
  constructor(targets, damageData) {
    const healthSys = damageData.healthSys;
    this._damageData = damageData
    this._useBallistic = healthSys._useBallistic;
    this._useInjury = healthSys.useInjury;
    this._useToughness = healthSys.useToughness;
    this._type = healthSys.type
    this._basicDamage = damageData.totalDamage;
    this._armorPenetration = "none";
    this._damageType = damageData.dmgType
    this._damageSource = damageData.dmgSrc


    let harmedOnes = [];
    for (let t = 0; t < targets.length; t++) {
      const h = targets[t];
      harmedOnes.push({
        name: h.name,
        img: h.data.img,
        uuid: h.data.actorLink ? h.actor.uuid : h.document.uuid,
        data: foundry.utils.deepClone(h.actor.data),
        dmgMod: 0,
        remainingHP: 0,
        damage: 0,
        ignoreDmg: false
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
    if (ap === "none") ap = 1;
    if (ap === "half") ap = 0.5;
    if (ap === "ignore") ap = 0;
    const impactArmor = h.data.data.armor.impact * ap;
    const ballisticArmor = h.data.data.armor.ballistic * ap;
    const toughness = h.data.data.armor.toughness.total > 0 ? h.data.data.armor.toughness.total : 0;
    const applyToughness = this.useToughness(d.healthSys.useToughness, this._damageType, this._damageSource, d.healthSys.mode);
    const totalDmg = Number(this.basicDamage) + Number(h.dmgMod);
    
    let reducedDmg = totalDmg - (applyToughness ? toughness : 0);
    
    if (this._useBallistic && this._damageSource === 'ballistic') reducedDmg -= ballisticArmor;
    if (this._useBallistic && this._damageSource === 'impact') reducedDmg -= impactArmor;
    if (!this._useBallistic && this._damageSource !== 'penetrating') reducedDmg -= impactArmor;

    if (reducedDmg < 0) reducedDmg === 0;

    if (h.ignoreDmg) {
      h.remainingHP = h.data.data.health.value;
      h.totalDmg = 0
    } else {
      h.remainingHP = h.data.data.health.value - reducedDmg;
      h.damage = reducedDmg
      h.totalDmg = totalDmg;
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