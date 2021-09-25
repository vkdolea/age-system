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
    data.handler = new DamageHandler(data.targets, data.damageData);
    data.damageData.finalDmg = 10 * data.damageData.totalDamage;
    return data
  }

  /*
    * Wire the logic to the UI.
    */
  activateListeners(html) {
    super.activateListeners(html)
    html.find(".basic-damae").change(ev => this.updateUI());
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
    this._useBallistic = healthSys._useBallistic;
    this._useInjury = healthSys.useInjury;
    this._useToughness = healthSys.useToughness;
    this._type = healthSys.type
    this._basicDamage = this.damageData.totalDamage;
    this._armorPenetration = 0; // 0=none; 1=half armor; 2=ignore armor


    let harmedOnes = [];
    for (let t = 0; t < targets.length; t++) {
      const h = targets[t];
      harmedOnes.push({
        name: h.name,
        img: h.img,
        uuid: h.data.actorLink ? h.actor.uuid : h.uuid,
        data: foundry.utils.deepClone(h.actor.data)
      })
      
    }
    this._harmedOnes = harmedOnes.map(harmed => this.damage(harmed, damageData))
  }



  async damage(h, d) {
    if (!this._useBallistic && !this._useToughness) {

    }
  }
}