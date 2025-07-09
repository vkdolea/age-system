import {ageSystem} from "./config.js";
import * as Dice from "./dice.js";
import { NpcParser } from "./parsers/npc-parser.js";
import { TalentParser } from "./parsers/talent-parser.js";

export default class AgeImporter extends Application {
  constructor(options = {}) {
    super(options)

    this._packList = [];
    this._importingAbilities = game.settings.get("age-system", "abilitySelection");
    
    // NPC Importer data
    this._npcImportingText = ""
    this._npcModeSelected = 'expanse';
    
    // Talent Importer data
    this._talentImportingText = ""
    this._talentModeSelected = 'expanse';
    
    // Currently available only for Modern AGE
    this._modeOptions = {
      "expanse": "The Expanse",
      "mageL": "Modern AGE (Major NPC)",
      "mageM": "Modern AGE (Minor NPC)",
      "fage": "Fantasy AGE",
      "fage2e": "Fantasy AGE 2e",
      "dage": "Dragon AGE"
    };
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
      title: game.i18n.localize('age-system.ageImporter')
    })
  }

  getData() {
    const data = super.getData();
    
    // NPC Importer data
    data.npcImportingText = this._npcImportingText;
    data.npcModeSelected = this._npcModeSelected;
    data.npcRadioB = {
      name: "npcModeSelected",
      choices: this._modeOptions,
      options: {
        hash: {
          checked: data.npcModeSelected
        }
      }
    };
    
    // Talent Importer data
    data.talentImportingText = this._talentImportingText;
    data.talentModeSelected = this._talentModeSelected;
    data.talentRadioB = {
      name: "talentModeSelected",
      choices: this._modeOptions,
      options: {
        hash: {
          checked: data.talentModeSelected
        }
      }
    };
    
    data.importingAbilities = this._importingAbilities;
    data.packList = this._packList;
    
    return data
  }

  activateListeners(html) {
    super.activateListeners(html)

    // NPC Importer listeners
    html.find(".text-to-import").change(ev => {
      this._npcImportingText = ev.target.value;
      this.updateUI()
    });

    html.find("input[name=npcModeSelected]").change(ev => {
      this._npcModeSelected = ev.target.value;
      this.updateUI();
    });

    html.find(".start-npc-importing").click(ev => {
      new NpcParser(this._npcImportingText, this._npcModeSelected, {packs: this._packList});
      this.updateUI();
    });

    // Talent Importer listeners
    html.find(".talent-to-import").change(ev => {
      this._talentImportingText = ev.target.value;
      this.updateUI()
    });

    html.find("input[name=talentModeSelected]").change(ev => {
      this._talentModeSelected = ev.target.value;
      this.updateUI();
    });

    html.find(".start-talent-importing").click(ev => {
      new TalentParser(this._talentImportingText, this._talentModeSelected, {packs: this._packList});
      this.updateUI();
    });
  }

  updateUI() {
    this.render(false)
  }

}

// Export the parser classes for backward compatibility
export { NpcParser, TalentParser };