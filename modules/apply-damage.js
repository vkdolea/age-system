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
    const data = super.getData()
    data.targets = this.targets;
    data.damageData = this.damageData;
    data.useInjury = this.useInjury;
    data.damageData.finalDmg = 10 * data.damageData.totalDamage;
    return data
  }

  /*
    * Wire the logic to the UI.
    */
  activateListeners(html) {
    super.activateListeners(html)

  }
  
  /*
    * Updates the UI based on the current state of the _calculator.
    */
  updateUI() {
    this.render(false)
  }
}
  