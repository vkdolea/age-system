/**
 * Displays the Apply Damage Dialog. Delegates all the logic behind calculating
 * and applying damage to a character to instance variable _calculator.
 *
 * Takes as input a GurpsActor and DamageData.
 *
 */
export default class ApplyDamageDialog extends Application {
  /**
   * Create a new ADD.
   *
   * @param {GurpsActor} actor
   * @param {Array} damageData
   * @param {*} options
   */
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
      classes: ['age-dialog', 'sheet', 'actor'],
      id: 'apply-damage-window',
      template: 'systems/age-system/templates/apply-damage-window.hbs',
      resizable: true,
      minimizable: false,
      width: 800,
      height: 'auto',
      title: game.i18n.localize('age-system.applyDamageWindow'),
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
        none: "None",
        half: "Half Armor",
        ignore: "Ignore Armor"
      },
      options: {
        hash: {
          checked: data.handler.armorPenetration
        }
      }
    }
    return data
  }

  // set damageData(value) {
  //   this._damageData = value
  // }

  // get damageData() {
  //   return this._damageData
  // }

  /*
    * Wire the logic to the UI.
    */
  activateListeners(html) {
    super.activateListeners(html)

    // Modify Armor Penetration properties for all targets
    html.find(".armor-penetration input").click(ev => {
      const newValue = ev.currentTarget.value
      this._handler.armorPenetration = newValue;
      this.updateUI()
    });

    // Change Basic Damage for all targets
    html.find(".overall-dmg .change-damage").click(ev => {
      let dmg = this._handler.basicDamage;
      const classes = ev.currentTarget.classList;
      if (classes.contains("increase")) dmg += 1;
      if (classes.contains("decrease")) dmg -= 1;
      if (dmg < 0) dmg = 0
      this._handler.basicDamage = dmg;
      this.updateUI()
    });
    
    html.find("input.basic-damage").change(ev => {
      const value = ev.currentTarget.value
      this._handler.basicDamage = value;
      this.updateUI()
    })
  }


  /*
    * Updates the UI based on the current state of the _calculator.
    */
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
        uuid: h.data.actorLink ? h.actor.uuid : h.uuid,
        data: foundry.utils.deepClone(h.actor.data),
        dmgMod: 0,
        remainingHP: 0,
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

  damage(h, d) {
    const impactArmor = h.data.data.armor.impact;
    const ballisticArmor = h.data.data.armor.ballistic;
    const toughness = h.data.data.armor.toughness.total > 0 ? h.data.data.armor.toughness.total : 0;
    const applyToughness = this.useToughness(d.healthSys.useToughness, this._damageType, this._damageSource, d.healthSys.mode);
    const totalDmg = Number(this.basicDamage) + Number(h.dmgMod);
    
    let reducedDmg = totalDmg - (applyToughness ? toughness : 0);
    
    if (this._useBallistic && this._damageSource === 'ballistic') reducedDmg -= ballisticArmor;
    if (this._useBallistic && this._damageSource === 'impact') reducedDmg -= impactArmor;
    if (!this._useBallistic && this._damageSource !== 'penetrating') reducedDmg -= impactArmor;

    if (reducedDmg < 0) reducedDmg === 0;

    h.remainingHP = h.data.data.health.value - reducedDmg;
    h.totalDmg = totalDmg;

    return h;
  }

  useToughness(setting, type, source, mode) {
    if (!setting) return false;
    if (mode === 'none') return true;
    if (mode === 'gritty') {
      if (['penetrating', 'impact'].includes(type) && ['stun'].includes(source)) return true;
    }
    if (mode === 'pulp') {
      if (['penetrating', 'impact'].includes(type) && ['stun', 'wound'].includes(source)) return true;
    }
    if (mode === 'cinematic') {
      if (!(['penetrating'].includes(type) && ['wound'].includes(source))) return true;
    }
    return false;
  }
}