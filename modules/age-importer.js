import {ageSystem} from "./config.js";
import * as Dice from "./dice.js";

export default class AgeImporter extends Application {
  constructor(options = {}) {
    super(options)

    this._packList = [];
    this._importingAbilities = game.settings.get("age-system", "abilitySelection");
    this._importingText = ""
    
    // Currently available only for Modern AGE
    this._modeOptions = {
      "expanse": "The Expanse",
      "mageL": "Modern AGE (Major NPC)",
      "mageM": "Modern AGE (Minor NPC)",
      "fage": "Fantasy AGE",
      "dage": "Dragon AGE"
    };
    this._modeSelected = 'expanse';
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
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
    this._mode = ageSetting;
    this.mode = ageSetting;
    this._modeSelected = ageSetting;
    this._text = text;
    this.text = text;
    this.textLC = foundry.utils.deepClone(this.text.toLowerCase());
    const block = text.split('\n');

    // Object containing actor and item data parsed
    this.data = {
      items: []
    };

    // Identify 'Threat' and remove this section from this.textLC
    this._getThreat();
    this._getSectionKeys();
    this._getName(block);
    this._getAbilities()
    this._getDerivedData(this.text);
    this._getAttacks(ageSetting);
    this._getSpecialQualities();
    this._getItems();

    this._createActor();
  }

  _getThreat() {
    const textLC = this.textLC;
    const threatTXT = `${game.i18n.localize('age-system.threat').toLowerCase()}:`;
    const index = textLC.indexOf(threatTXT);
    const str = textLC.substring(index);
    const threatStr = textLC.substring(index + threatTXT.length).trim();
    const threat = this.normalizeCase(threatStr);
    this.data.threat = threat;

    this.textLC = textLC.substring(0, textLC.length-str.length);
    this.text = this.text.substring(0, this.text.length-str.length);
  }

  _getSectionKeys() {
    const keys = {};
    const sections = {};

    // Separate block in 2 sections: Abilities/Derived Data and Special Qualities/Features:
    let qltCaption = `\n${game.i18n.localize('age-system.specialQualities')}`; // some settings use Special Qualities
    let spcQltIndex = this.textLC.indexOf(qltCaption.toLowerCase());
    if (spcQltIndex < 0) qltCaption = `\n${game.i18n.localize('age-system.specialFeatures')}`; // others use Special Features
    spcQltIndex = this.textLC.indexOf(qltCaption.toLowerCase());

    keys.specialQualities = {
      index: spcQltIndex,
      size: qltCaption.length
    };

    sections.abilityPlusDerived = this.text.substring(0, spcQltIndex);
    sections.specialQualities = this.text.substring(spcQltIndex + qltCaption.length);

    this.keys = keys;
    this.sections = sections;
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
  _getAbilities() {
    // Identify which Setting the Ability block belongs
    const mode = this._modeSelected
    const ablType = ['expanse', 'mageL', 'mageM', 'fage'].includes(mode) ? 'main' : (mode === 'dage' ? 'dage' : null);
    if (!ablType) return false

    const abls = foundry.utils.deepClone(ageSystem.abilitiesSettings[ablType]);
    for (const a in abls) {
      if (Object.hasOwnProperty.call(abls, a)) {
        abls[a] = game.i18n.localize(abls[a]);            
      }
    }
    
    const abilities = {};
    const focus = [];

    // Search for condensed NPC sheet
    for (const a in abls) {
      if (Object.hasOwnProperty.call(abls, a)) {
        const abl = abls[a].toLowerCase();
        let hasFocus = false;
        const r00 = `-?–?\\b[0-9]*`;
        const r0 = ["mageL", "dage", "fage"].includes(mode) ? `${r00} ${abl}` : `${abl} ${r00}`; // TODO - identify this change automatically
        const r1 = `\\(([^\\)]+)\\)`;
        const rg = `${r0} ${r1}`;
        const ri = new RegExp(rg);
        const text = this.sections.abilityPlusDerived.toLowerCase();
        // Try to match ability + focus entry
        let ablM = text.match(ri);
        // If matches, flag "hasFocus" as true, otherwise, match ability without focus
        if (ablM) hasFocus = true; else ablM = text.match(r0);
        
        // Ability value
        const noLineBreak = ablM[0].replace('\n', '').replaceAll('–','-').replace(abl, '').trim();
        const ablArr = noLineBreak.split(" ");
        const value = ablArr[0];
        const abilityValue = Number(value);
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
            const nameStr = mod > 0 ? e.slice(0, mod) : e;
            focus.push({
              name: this.normalizeCase(nameStr),
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

    // Estimates compatibility for 'dage' and 'main' ability settings
    switch (ablType) {
      case 'main':
        abilities.cunn = {value: abilities.int.value};
        abilities.magic = {value: Math.max(abilities.int.value, abilities.will.value)};
        break;
      case 'dage':
        abilities.int = {value: Math.max(abilities.cunn.value, abilities.magic.value)};
        abilities.fight = {value: Math.max(abilities.str.value, abilities.dex.value)};
        abilities.acc = {value: abilities.dex.value};
        break;
    }
    
    this.data.abilities = abilities;
    this.data.focus = focus;
  }

  // TODO - Incluir localização
  _getDerivedData() {
    const mode = this._modeSelected;
    const abilities = this.data.abilities;
    const header = {
      speed: game.i18n.localize("age-system.speed"),
      health: mode === 'expanse' ? game.i18n.localize("age-system.fortune") : game.i18n.localize("age-system.health"),
      defense: game.i18n.localize("age-system.defense")
    };
    const r = `(?<=${header.speed} ${header.health} ${header.defense}).*\n.*(?=\n)`;
    let protoText = this.textLC.match(r.toLowerCase())[0].trim().replaceAll("+ ", "+");
    
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

    // Add '+' if missing on Toughness values
    if (["mageL", "mageM"].includes(mode)) {
      for (let i = 1; i <= 2; i++) {
        if (data[data.length-i].indexOf("+") < 0 && data[data.length-i].indexOf("-") < 0) data[data.length-i] = `+${data[data.length-i]}`
      }
    }

    // Modern AGE logics
    // Initialize Game Mode object
    const gameMode = {
      specs: {
        gritty: {},
        pulp: {},
        cinematic: {},
        none: {}
      }
    };

    // Toughness attribute is differentiated for Modern AGE only - other cases equals do ZERO
    if (["mageL", "mageM"].includes(mode)) {
      this._populateMageMods(data, gameMode, 'toughness', abilities.cons.value);
    } else {
      for (const key in gameMode.specs) {
        if (Object.hasOwnProperty.call(gameMode.specs, key)) {
          gameMode.specs[key].toughness = 0;          
        }
      }
    }
    
    // Armor Rating (Ballistic and Impact), including logics to identify when xI/yB data is missing
    let armorStr = data.pop();
    let totalArmor = ['0I', '0B'];
    if (armorStr.includes('/')) {
      totalArmor = armorStr.split('/')
    } else {
      if (!Number.isNaN(armorStr)) {
        if (["expanse"].includes(mode)) armorStr = armorStr - abilities.cons.value;
        totalArmor = [`${armorStr}I`, `${armorStr}B`]
      }
    };
    const armor = {
      ballisticArmor: totalArmor.pop().slice(0, -1),
      impactArmor: totalArmor.pop().slice(0, -1)
    };
    this.data.armor = armor;

    // Defense
    const baseDef = 10;
    this._populateMageMods(data, gameMode, 'defense', baseDef + abilities.dex.value);

    // Health
    this._populateMageMods(data, gameMode, 'health');

    // Speed and different movement
    const baseSpeed = Number(data[0]) - abilities.dex.value;
    data.splice(0, 1);
    const otherSpeed = data.length ? data.join(' ') : null;
    this.data.speed = {base: baseSpeed};
    if (otherSpeed) this.data.traits = `${otherSpeed}`;
    this.data.flags = {
      "age-system": {
        importData: {speedOthers: otherSpeed}
      }
    };
    this.data.gameMode = gameMode;
  }

  _getAttacks(mode) {
    const text = this.textLC;
    const attacks = [];
    let attksTable;
    const endIndex = this.keys.specialQualities.index;
    const attkHeader = game.i18n.localize("age-system.attkHeader");
    let start = `${attkHeader}*\n`.toLowerCase();
    let startIndex = text.indexOf(start);
    if (startIndex < 0) {
      start = `${attkHeader}\n`.toLowerCase();
      startIndex = text.indexOf(start);
    };
    attksTable = text.substring(startIndex + start.length, endIndex).split('\n');
    if (["mageL", "mageM"].includes(mode)) attksTable.pop(); // Removes note at bottom of attacks' table

    // Go through attksTable and identify attacks
    for (let a = 0; a < attksTable.length; a++) {
      const str = attksTable[a].replaceAll('–','-');
      const atkData = str.match(/ \+0?[0-9].|\–0?[0-9].?|\-0?[0-9].|0|\- /);
      const dmgStr = this.removeLineBreake(str.substring(atkData['index'] + atkData[0].length));
      const formulaEval = Dice.resumeFormula(dmgStr, {});
      const dmg = formulaEval.shortFormula === "+0" ? `${formulaEval.shortFormula}[${this.normalizeCase(dmgStr)}]` : dmgStr;
      const atkName = this.removeLineBreake(str.substring(0, atkData['index']));
      attacks.push({
        name: this.normalizeCase(atkName),
        toHit: atkData[0].trim(),
        dmg: dmg
      })
    }
    
    this.data.attacks = attacks;
  }

  /**
   * Extract Special Qualities from imported data and store array at this.data.features
   * @param {String} text Imported text without the 'Threat' string sequence
   * @param {*} mode AGE setting selected by user
   */
  _getSpecialQualities() {
    const features = []
    const rawFeatures = this.sections.specialQualities;
    const rawFeaturesLC = rawFeatures.toLowerCase();
    const featArr = rawFeatures.match(/\n(.*):/g);
    for (let i = 0; i < featArr.length; i++) {
      const f = featArr[i];
      const size = f.length;
      const pos1 = rawFeatures.indexOf(f);
      const pos2 = (i < featArr.length-1) ? rawFeaturesLC.indexOf(featArr[i+1].toLowerCase()) : Infinity;
      features.push({
        name: this.normalizeCase(this.removeLineBreake(f.substring(0, f.length-1))),
        desc: this.removeLineBreake(rawFeatures.substring(pos1 + size, pos2))
      });
    }
    this.data.features = features;
  }

  async _createActor() {
    const data = this.data;
    const type = 'char';
    const healthMax = data.gameMode.specs[game.settings.get("age-system", "gameMode")].health;

    // Organize data to create new Actor
    const actorData = {
      name: this.normalizeCase(data.name),
      type: type,
      flags: {
        core: {sheetClass: "age-system.ageSystemSheetCharStatBlock"}
      },
      system: {
        threat: data.threat,
        abilities: data.abilities,
        gameMode: data.gameMode,
        health: {
          value: healthMax
        },
        traits: data.traits || ""
      }
    }

    // Creates new Actor
    return game.actors.documentClass.createDocuments([actorData]).then(a => this._createItems(a[0]))
  }

  async _createItems(actor) {
    // Look at Compendium or Item Directory for Items with same name as Attack/Equipment/Stunt

    // Create documents for Items, except "Weapon" and Armor.
    await actor.createEmbeddedDocuments('Item', this.data.focus.concat(this.data.items));

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
        switch (title) {
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
            longDesc: `<p>${p.desc.trim()}</p>`,
            hasRoll: false,
            powerPointCost: 0
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
          e[i] = {
            name: e[i].trim(),
            type: key,
            img: ageSystem.itemIcons[key],
            system: {
              favorite: true,
              equiped: true,
              activate: true
            }
          };
        }
        this.data.items.push(...e)
      }
    }
  }

  /**
   * Replace line breaks from a string by white spaces
   * @param {String} str A regular string
   * @returns Regular string replacing all \n by a white space
   */
  removeLineBreake(str){
    return str.replaceAll(`\n`, ` `).trim();
  }

  /**
   * Function to deliver proper capitalization for title of Items
   * @param {String} str Sring with any number of words
   * @returns String with first letter of each word on Upper Case and the other on Lower Case. Words after an '-' will also have first letter on Upper Case
   */
  normalizeCase(str) {
    const strArr = str.split(" ");
    return strArr.map(s => {
      const nStr = s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
      const nStrArr = nStr.split('-');
      return nStrArr.map(n => n.substring(0, 1).toUpperCase() + n.substring(1).toLowerCase()).join('-');
    }).join(" ");
  }

  /**
   * Helper function to parse text to fetch Actor's Speed, Health, Defense and Armor
   * @param {Array} dataArr Array containing Speed, Health, Defense and Armor data
   * @param {String} gameMode Game Mode ID to be used to set Current Health
   * @param {String} type Derived data to be looked (Speed, Health, Defense or Armor)
   * @param {Number} offset Adjustment to be made on derived data
   * @returns {Array} Array containing remaining data to be parsed
   */
  _populateMageMods(dataArr, gameMode, type, offset = 0) {
    const modes = ['cinematic', 'pulp', 'gritty'];
    const setting = this._modeSelected;
    let baseData = ["mageL", "mageM"].includes(setting) ? dataArr : dataArr.pop();
    for (let m = 0; m < modes.length; m++) {
      const mode = modes[m];
      const v = (Array.isArray(baseData) ? Number(dataArr.pop()) : baseData) - offset;
      gameMode.specs[mode][type] = v;
      if (type === 'health') gameMode.specs[mode].healthCur = v;
      if (mode === 'gritty') {
        gameMode.specs.none[type] = v;
        if (type === 'health') gameMode.specs.none.healthCur = v;
      }
    }
    return dataArr;
  }
}