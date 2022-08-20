import {ageSystem} from "./config.js";
import * as Dice from "./dice.js";

export default class AgeImporter extends Application {
  constructor(options = {}) {
    super(options)

    this._packList = [];
    this._importingAbilities = game.settings.get("age-system", "abilitySelection");
    this._importingText = ""
    
    // Currently available only for Modern AGE
    this._modeOptions = {'mage': "Modern AGE"};
    this._modeSelected = 'mage';
    // this._modeOptions = {'expanse': "The Expanse", 'mage': "Modern AGE", 'fage': "Fantasy AGE", 'dage': "Dragon AGE"};
    // this._modeSelected = null;
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
    if (!text) return null;
    // Compêndio com Items (suportar vários? pastas?)
    this._modeSelected = ageSetting;
    this._text = text;
    this.text = text;
    const block = text.split('\n');
    // Object containing actor and item data parsed
    this.data = {
      items: []
    };
    this._getName(block);
    this._getAbilities()
    this._getDerivedData(this.text);
    this._getAttacks(this.text, ageSetting);
    this._getThreat(this.text)
    this._getSpecialQualities(this.text, ageSetting);
    this._getItems();

    this._createActor();

    console.log(this.data)
  }

  async _createItems(actor) {
    // Look at Compendium or Item Directory for Items with same name as Attack/Equipment/Stunt

    // Create documents from "Focus"
    await actor.createEmbeddedDocuments('Item', this.data.focus);

    // Create documents from "Equipment" section
    await actor.createEmbeddedDocuments('Item', this.data.items);

    // Add Armor
    const armor = await actor.createEmbeddedDocuments('Item', [{
      name: game.i18n.localize("age-system.armor"),
      type: 'equipment',
      img: 'icons/svg/shield.svg',
      system: {equiped: true, favorite: true}
    }]);
    await armor[0]._newModifier({type: 'impactArmor', formula: this.data.armor.impactArmor});
    await armor[0]._newModifier({type: 'ballisticArmor', formula: this.data.armor.ballisticArmor})

    // Create Weapons from "Attacks"
    const attks = this.data.attacks;
    for (let a = 0; a < attks.length; a++) {
      const attk = attks[a];
      const newAttk = await actor.createEmbeddedDocuments('Item', [{
        name: attk.name,
        type: 'weapon',
        system: {
          favorite: true,
          equiped: true,
          useAbl: 'no-abl',
          useFocus: '',
          dmgType: "wound",
          dmgSource: "impact",
          dmgAbl: "no-abl",
          damageInjury: 1, // TODO - elaborate formula to fill in this data
          damageFormula: `${attk.dmg}`
        }
      }]);
      newAttk[0]._newModifier({type: 'itemActivation', formula: attk.toHit, flavor: 'To Hit'})
    }
    actor.sheet.render(true);
  }

  async _createActor() {
    const data = this.data;
    const healthMax = data.gameMode.specs[game.settings.get("age-system", "gameMode")].health;

    // Organize data to create new Actor
    const actorData = {
      name: data.name,
      type: 'char',
      flags: {
        core: {sheetClass: "age-system.ageSystemSheetCharStatBlock"}
      },
      system: {
        abilities: data.abilities,
        gameMode: data.gameMode,
        health: {
          value: healthMax
        }
      }
    }

    // Creates new Actor
    return game.actors.documentClass.createDocuments([actorData]).then(a => this._createItems(a[0]))
  }

  _getItems() {
    // Localized names
    const equipLocal = game.i18n.localize("age-system.equipment").toLowerCase();
    const talentLocal = game.i18n.localize("age-system.talentPlural").toLowerCase();
    const stuntLocal = game.i18n.localize("age-system.setting.stunt").toLowerCase();
    const favoredStuntLocal = game.i18n.localize("age-system.favoredStunts").toLowerCase();

    // Item Type definition
    const feats = this.data.features;
    const items = {};
    const toRemove = [];
    
    // Save Equipment, Talent and Stunt on separate arrays
    for (let f = 0; f < feats.length; f++) {
      const ft = feats[f];
      const title = ft.name.toLowerCase()
      if (title === equipLocal || title === talentLocal || title === favoredStuntLocal) {
        toRemove.push(f);
        switch (ft.name.toLowerCase()) {
          case equipLocal: items.equipment = ft.desc.split(',');
            break;
          
          case talentLocal: items.talent = ft.desc.split(',');
            break;
  
          case favoredStuntLocal: items.stunts = ft.desc.split(',');
            break;
        }
      }
    }

    // Remove features already treated
    for (let i = toRemove.length-1; i > -1; i--) {
      const r = toRemove[i];
      feats.splice(r, 1);
    }

    // Try to identify if imported data has specific stunts
    // English version
    // const startsWith = `Stunt—`.toLowerCase();

    // Other Special Qualities as Powers
    const power = [];
    if (feats.length) {
      for (let f = 0; f < feats.length; f++) {
        const p = feats[f];
        power.push({
          name: p.name.trim(),
          type: 'power',
          system: {
            favorite: true,
            activate: true,
            longDesc: `<p>${p.desc.trim()}</p>`
          }
        })
      }
    }
    if (power.length) this.data.items.push(...power);

    // Create Array with data to create Items on Actor
    for (const key in items) {
      if (Object.hasOwnProperty.call(items, key)) {
        const e = items[key];
        for (let i = 0; i < e.length; i++) {
          e[i] = {name: e[i].trim(), type: key, system: {favorite: true, equiped: true, activate: true}};
        }
        this.data.items.push(...e)
      }
    }
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

  /**
   * Extract Special Qualities from imported data and store array at this.data.features
   * @param {String} text Imported text without the 'Threat' string sequence
   * @param {*} mode AGE setting selected by user
   */
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
          name: this.removeLineBreake(f.substring(0, f.length-1)),
          desc: this.removeLineBreake(text.substring(pos1 + size, pos2))
        })
      } else {
        features.push({
          name: this.removeLineBreake(f.substring(0, f.length-1)),
          desc: this.removeLineBreake(text.substring(pos1 + size))
        })
      }
    }
    this.data.features = features;
  }

  removeLineBreake(str){
    return str.replaceAll(`\n`, ` `).trim();
  }

  _getAttacks(text, mode) {
    const attacks = [];
    let attksTable;
    if (mode === "mage") {
      let start = `Weapon Attack Roll Damage*\n`;
      let startIndex = text.indexOf(start);
      if (startIndex < 0) {
        start = `Weapon Attack Roll Damage\n`;
        startIndex = text.indexOf(start);
      };
      const end = `\nSpecial Qualities`;
      attksTable = text.substring(startIndex + start.length, text.indexOf(end)).split('\n');
      attksTable.pop(); // Removes note at bottom of attacks' table
    }

    if (['dage','fage'].includes(mode)) {
      const start = `Weapon Attack Roll Damage\n`;
      const end = `\nSpecial Qualities`;
      attksTable = text.substring(text.indexOf(start) + start.length, text.indexOf(end)).split('\n');
    }

    // Go through attksTable and identify attacks
    for (let a = 0; a < attksTable.length; a++) {
      const str = attksTable[a];
      const atkData = str.match(/ \+0?[0-9].|\-0?[0-9].|0|\- /);
      const dmgStr = str.substring(atkData['index'] + atkData[0].length).trim();
      const formulaEval = Dice.resumeFormula(dmgStr, {});
      const dmg = formulaEval.shortFormula === "+0" ? `${formulaEval.shortFormula}[${dmgStr}]` : dmgStr;
      attacks.push({
        name: str.substring(0, atkData['index']).trim(),
        toHit: atkData[0].trim(),
        dmg: dmg
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
    let protoText = text.match(r)[0].trim().replaceAll("+ ", "+");
    
    // Logic to ensure "+" has a white space on its left and none to its right
    const wsLeft = [];
    for (let i = protoText.length-1; i > 0; i--) {
      const e = protoText[i];
      if (e === "+" && protoText[i-1] != " ") wsLeft.push(i);
    }
    for (let c = 0; c < wsLeft.length; c++) {
      const el = wsLeft[c];
      protoText = protoText.slice(0, el) + " " + protoText.slice(el, protoText.length);
    }
    let data = protoText.split(" ");

    // Modern AGE logics
    if (mode === 'mage') {
      // Initialize Game Mode object
      const gameMode = {
        specs: {
          gritty: {},
          pulp: {},
          cinematic: {},
          none: {}
        }
      }
      // Toughness
      const cons = this.data.abilities.cons.value;
      this._populateMageMods(data, gameMode, 'toughness', cons);

      // Armor Rating (Ballistic and Impact), including logics to identify when xI/yB data is missing
      const armorArr = data[data.length-1];
      const totalArmor = armorArr.includes('/') ? data.pop().split('/') : ['0I', '0B'];
      const armor = {
        ballisticArmor: totalArmor.pop().slice(0, -1),
        impactArmor: totalArmor.pop().slice(0, -1)
      }
      this.data.armor = armor;

      // Defense
      const dex = this.data.abilities.dex.value
      const baseDef = 10;
      this._populateMageMods(data, gameMode, 'defense', baseDef + dex);

      // Health
      this._populateMageMods(data, gameMode, 'health');

      // Speed and different movement
      const baseSpeed = Number(data[0]) - dex;
      data.splice(0, 1);
      this.data.speed = {base: baseSpeed};
      this.data.flags = {
        "age-system": {
          importData: {speedOthers: data.length ? data.join(' ') : null}
        }
      };
      this.data.gameMode = gameMode;
    }
  }

  /**
   * Helper function to parse text to fetch Actor's Speed, Health, Defense and Armor
   * @param {Array} dataArr Array containing Speed, Health, Defense and Armor data
   * @param {String} gameMode Game Mode ID to be used to set Current Health
   * @param {String} type Derived data to be looked (Speed, Health, Defense or Armor)
   * @param {Number} offset Adjustment to be made os derived data
   * @returns {Array} Array containing remaining data to be parsed
   */
  _populateMageMods(dataArr, gameMode, type, offset = 0) {
    const modes = ['cinematic', 'pulp', 'gritty'];
    for (let m = 0; m < modes.length; m++) {
      const mode = modes[m];
      const v = Number(dataArr.pop()) - offset;
      gameMode.specs[mode][type] = v;
      if (type === 'health') gameMode.specs[mode].healthCur = v;
      if (mode === 'gritty') {
        gameMode.specs.none[type] = v;
        if (type === 'health') gameMode.specs.none.healthCur = v;
      }
    }
    return dataArr;
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
        abilities[a] = {value: abilityValue};

        // Focuses
        if (hasFocus) {
          let str = ablM[1].replace('\n', '').replace('(', '').replace(')','');
          const fociArr = str.split(',');
          for (let f = 0; f < fociArr.length; f++) {
            const e = fociArr[f].trim();
            // Identify if there is modified Focus
            const mod = e.lastIndexOf('+');
            const value = mod < 0 ? 2 : Number(e.slice(mod, e.length));
            const name = mod > 0 ? e.slice(0, mod) : e;
            focus.push({
              name: name.trim(),
              type: 'focus',
              system: {
                initialValue: value,
                useAbl: a
              }
            })
          }
        }
      }
    }
    
    this.data.abilities = abilities;
    this.data.focus = focus;
  }
}