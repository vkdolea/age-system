import {ageSystem} from "./config.js";

export default class AgeImporter extends Application {
  constructor(options = {}) {
    super(options)

    this._packList = [];
    this._importingAbilities = game.settings.get("age-system", "abilitySelection");
    this._modeOptions = {'expanse': "The Expanse", 'mage': "Modern AGE", 'fage': "Fantasy AGE", 'dage': "Dragon AGE"};
    this._modeSelected = null;
    this._importingText = ""
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['age-system-dialog', 'age-system'],
      id: 'age-importer',
      template: 'systems/age-system/templates/age-importer.hbs',
      resizable: true,
      minimizable: false,
      width: 900,
      height: 900,
      title: game.i18n.localize('age-system.ageImporter'),
    })
  }

  getData() {
    const data = super.getData();
    data.importingText = this._importingText;
    data.importingAbilities = this._importingAbilities;
    data.importingMode = this._importingMode;
    data.packList = this._packList;
    data.modeSelected = this._modeSelected;
    data.radioB = {
      name: "modeSelected",
      choices: this._modeOptions,
      options: {
        hash: {
          checked: data.modeSelected
        }
      }
    }
    return data
  }

  activateListeners(html) {
    super.activateListeners(html)

    // Enter block text
    html.find(".text-to-import").change(ev => {
      this._importingText = ev.target.value;
      this.updateUI()
    });

    // Enter block text
    html.find("input[name=modeSelected]").change(ev => {
      this._modeSelected = ev.target.value;
      this.updateUI();
    });

    // Start Importing
    html.find(".start-importing").click(ev => {
      new AgeParser(this._importingText, this._modeSelected, {packs: this._packList});
      this.updateUI();
    });
  }

  updateUI() {
    this.render(false)
  }

}

export class AgeParser {
  constructor (text, ageSetting, options = {}) {
    // Compêndio com Items (suportar vários? pastas?)
    this._modeSelected = ageSetting;
    this._text = text;
    this.text = text;
    const block = text.split('\n');
    // Object containing actor and item data parsed
    this.data = {
      items: {}
    };
    this._getName(block);
    this._getAbilities()
    this._getDerivedData(this.text);
    this._getAttacks(this.text, ageSetting);
    this._getThreat(this.text)
    this._getSpecialQualities(this.text, ageSetting);
    console.log(this.data)
  }

  _getThreat(text) {
    // TODO localization
    const threatId = "Threat:";
    const index = text.indexOf(threatId);
    const threatString = text.substring(index);
    const size = threatString.length;
    this.data.threat = text.substring(index + threatId.length).trim();
    this.text = text.substring(0, text.length-size);
  }

  _getSpecialQualities(text, mode) {
    const features = []
    let rawFeatures;
    if (mode === 'mage') {
      const start = `\nSpecial Qualities`;
      rawFeatures = text.substring(text.indexOf(start) + start.length);
    }

    // Segregate different Qualities
    const featArr = rawFeatures.match(/\n(.*):/g);
    for (let i = 0; i < featArr.length; i++) {
      const f = featArr[i];
      const size = f.length;
      const pos1 = text.indexOf(f);
      if (i < featArr.length-1) {
        const pos2 = text.indexOf(featArr[i+1]);
        features.push({
          name: f.substring(0, f.length-1),
          desc: text.substring(pos1 + size, pos2)
        })
      } else {
        features.push({
          name: f.substring(0, f.length-1),
          desc: text.substring(pos1 + size)
        })
      }
    }
    this.data.features = features;
  }

  _getAttacks(text, mode) {
    const attacks = [];
    let attksTable;
    if (mode === "mage") {
      const start = `Weapon Attack Roll Damage*\n`;
      const end = `\nSpecial Qualities`;
      attksTable = text.substring(text.indexOf(start) + start.length, text.indexOf(end)).split('\n');
      attksTable.pop(); // Removes note at bottom of attacks' table
    }

    if (['dage','fage'].includes(mode)) {
      const start = `Weapon Attack Roll Damage\n`;
      const end = `\nSpecial Qualities`;
      attksTable = text.substring(text.indexOf(start) + start.length, text.indexOf(end)).split('\n');
    }

    // Go through attksTable and identify attacks
    for (let a = 0; a < attksTable.length; a++) {
      const attk = attksTable[a].split(' ');
      attacks.push({
        dmg: attk.pop(),
        toHit: attk.pop(),
        name: attk.join(' ')
      })
    }
    
    this.data.attacks = attacks;
  }

  _getDerivedData(text) {
    const mode = this._modeSelected;
    let r;
    if (mode === 'mage') r = `(?<=AR \\+ Toughness\n).*(?=\n)`; //incluir Localização
    if (mode === 'expanse') r = `(?<=AR \\+ TOU\n).*(?=\n)`; //incluir Localização
    if (['dage', 'fage'].includes(mode)) r = `(?<=Defense Armor Rating\n).*(?=\n)`; //incluir Localização
    if (!r) return null;
    let protoText = text.match(r)[0];
    
    // Logic to ensure "+" has a white space on its left
    const wsArr = []
    for (let i = protoText.length-1; i > 0; i--) {
      const e = protoText[i];
      if (e === "+" && protoText[i-1] != " ") wsArr.push(i)
    }
    for (let c = 0; c < wsArr.length; c++) {
      const el = wsArr[c];
      protoText = protoText.slice(0, el-1) + " " + protoText.slice(el, protoText.length);
    }
    const data = protoText.split(" ");

    // Modern AGE logics
    if (mode === 'mage') {

      // Toughness
      const cons = this.data.abilities.cons;
      const toughness = {
        cinematic: Number(data.pop()) - cons,
        pulp: Number(data.pop()) - cons,
        gritty: Number(data.pop()) - cons
      };
      this.data.toughness = toughness;

      // Armor Rating (Ballistic and Impact)
      const totalArmor = data.pop().split('/');
      const armor = {
        ballistic: Number(totalArmor.pop().slice(0, -1)),
        impact: Number(totalArmor.pop().slice(0, -1))
      }
      this.data.armor = armor;

      // Defense
      const dex = this.data.abilities.dex;
      const defense = {
        cinematic: Number(data.pop()) - dex,
        pulp: Number(data.pop()) - dex,
        gritty: Number(data.pop()) - dex
      }
      this.data.defense = defense

      // Health
      const health = {
        cinematic: Number(data.pop()),
        pulp: Number(data.pop()),
        gritty: Number(data.pop())
      }
      this.data.health = health

      // Speed and different movement
      const speedMod = Number(data[0]) - dex;
      data.splice(0, 1);
      this.data.speed = speedMod;
      this.data.speedOthers = data.length ? data.join(' ') : null;
    }
  }

  /**
   * Retrive character name and remove name string from input array
   * @param {Array} block Array containing data to be parsed
   * @param {Object} data Actor data
   * @returns Array without treated data
   */
  _getName(block) {
    this.data.name = block[0].trim();
    block.splice(0, 1);
    return block
  }

  /**
   * Select which set of Abilities will be parsed and populate actor data, including Focuses
   * @param {Array} block Array contained data to be parsed
   * @returns Array with unparsed data or False if Ability selection is invalid
   */
  _getAbilities(block) {
    const ablType = ['expanse', 'mage', 'fage'].includes(this._modeSelected) ? 'main' : (this._modeSelected === 'dage' ? 'dage' : null);
    if (!ablType) return false
    
    const abls = foundry.utils.deepClone(ageSystem.abilitiesSettings[ablType]);
    for (const a in abls) {
      if (Object.hasOwnProperty.call(abls, a)) {
        abls[a] = game.i18n.localize(abls[a]);            
      }
    }
    
    const abilities = {};
    const focus = [];

    for (const a in abls) {
      if (Object.hasOwnProperty.call(abls, a)) {
        const abl = abls[a];
        let hasFocus = false;
        const r0 = `\n-?\\b[0-9]* ${abl}`;
        const r1 = `\\(([^\\)]+)\\)`;
        const rg = `${r0} ${r1}`;
        const ri = new RegExp(rg);
        let ablM = this.text.match(ri);
        if (ablM) hasFocus = true; else ablM = this.text.match(r0);
        
        // Ability value
        const noLineBreak = ablM[0].replace('\n', '').trim();
        const whiteSpace = noLineBreak.indexOf(" ");
        const abilityValue = Number(noLineBreak.slice(0, whiteSpace));
        abilities[a] = abilityValue;

        // Focuses
        if (hasFocus) {
          let str = ablM[1].replace('\n', '').replace('(', '').replace(')','');
          const fociArr = str.split(',');
          for (let f = 0; f < fociArr.length; f++) {
            const e = fociArr[f].trim();
            // Identify if there is modified Focus
            const mod = e.lastIndexOf('+');
            const value = mod < 0 ? null : Number(e.slice(mod, e.length));
            const name = mod > 0 ? e.slice(0, mod).trim() : e;
            focus.push({
              name: name,
              value: value,
              abl: a
            })
          }
        }
      }
    }
    
    this.data.abilities = abilities;
    this.data.items.focus = focus;
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
      const data = foundry.utils.deepClone(h.actor);
      harmedOnes.push({
        name: h.actor.name,
        img: h.document.texture.src,
        uuid: h.document.actorLink ? h.actor.uuid : h.document.uuid,
        data,
        dmgMod: 0,
        remainingHP: 0,
        damage: 0,
        ignoreDmg: false,
        autoInjury: !data.hasPlayerOwner,
        injuryMarks: data.system.injury.marks,
        injurySDpenalty: Math.floor(data.system.injury.marks/3),
        testMod: data.system.ownedMods?.testMod ? data.system.ownedMods.testMod : 0,
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
    const hData = h.data.system;
    if (ap === "none") ap = 1;
    if (ap === "half") ap = 0.5;
    if (ap === "ignore") ap = 0;
    const impactArmor = Math.floor(hData.armor.impact * ap);
    const ballisticArmor = Math.floor(hData.armor.ballistic * ap);
    const toughness = hData.armor.toughness.total > 0 ? hData.armor.toughness.total : 0;
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
        label: game.i18n.localize("age-system.bonus.ballisticArmor"),
        value: ballisticArmor
      }
    } 
    if (this._useBallistic && this._damageSource === 'impact') {
      dmgProtection += impactArmor;
      armorDesc = {
        label: game.i18n.localize("age-system.bonus.impactArmor"),
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
      h.remainingHP = hData.health.value;
      h.totalDmg = 0;
      h.dmgProtection = dmgProtection;
    } else {
      h.remainingHP = hData.health.value - reducedDmg;
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
    switch (mode) {
      case 'none': return true;
      case 'gritty': return source === 'ballistic' ? false : ['stun'].includes(type);
      case 'pulp': return source === 'ballistic' ? false : ['stun'].includes(type) || (['impact'].includes(source) && ['wound'].includes(type));
      case 'cinematic': return !(['penetrating'].includes(source) && ['wound'].includes(type));
      default: return false;
    }
  }
}