import {ageSystem} from "../config.js";

/**
 * Parser for importing individual talents from AGE System books
 */
export class TalentParser {
  constructor(text, ageSetting, options = {}) {
    if (!text) return null;
    
    this._mode = ageSetting;
    this.mode = ageSetting;
    this._modeSelected = ageSetting;
    this._text = text;
    this.text = text;
    this.textLC = foundry.utils.deepClone(this.text.toLowerCase());
    
    // Object containing parsed talent data
    this.data = {
      talents: []
    };
    
    this._parseTalents();
    this._createTalentItems();
  }

  /**
   * Parse talent text and extract talent information
   */
  _parseTalents() {
    const text = this._text;
    const lines = text.split('\n');
    
    let currentTalent = null;
    let currentSection = null;
    let isInDegreeSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check if this is a talent header (usually all caps or has specific formatting)
      if (this._isTalentHeader(line)) {
        // Save previous talent if exists
        if (currentTalent) {
          this.data.talents.push(currentTalent);
        }
        
        // Start new talent
        currentTalent = {
          name: this._cleanTalentName(line),
          requirement: "",
          type: "talent",
          degrees: {
            0: { desc: "", isActive: true },
            1: { desc: "", isActive: true },
            2: { desc: "", isActive: true },
            3: { desc: "", isActive: true },
            4: { desc: "", isActive: true }
          }
        };
        
        currentSection = null;
        isInDegreeSection = false;
        continue;
      }
      
      // Check if this is a requirement line
      if (this._isRequirementLine(line)) {
        if (currentTalent) {
          currentTalent.requirement = this._extractRequirement(line);
        }
        continue;
      }
      
      // Check if this is a degree section header
      const degreeMatch = this._getDegreeSection(line);
      if (degreeMatch !== null && currentTalent) {
        currentSection = degreeMatch;
        isInDegreeSection = true;
        continue;
      }
      
      // Add content to current section
      if (currentTalent && isInDegreeSection && currentSection !== null) {
        if (currentTalent.degrees[currentSection].desc) {
          currentTalent.degrees[currentSection].desc += " " + line;
        } else {
          currentTalent.degrees[currentSection].desc = line;
        }
      }
    }
    
    // Save last talent
    if (currentTalent) {
      this.data.talents.push(currentTalent);
    }
  }

  /**
   * Check if a line is a talent header
   * @param {String} line Line to check
   * @returns {Boolean} True if it's a talent header
   */
  _isTalentHeader(line) {
    // Simple heuristic: talent headers are usually all caps or have specific formatting
    return line === line.toUpperCase() && line.length > 2 && line.length < 50;
  }

  /**
   * Clean talent name from header formatting
   * @param {String} line Raw talent header line
   * @returns {String} Clean talent name
   */
  _cleanTalentName(line) {
    return line.replace(/[^\w\s]/g, '').trim();
  }

  /**
   * Check if a line contains requirement information
   * @param {String} line Line to check
   * @returns {Boolean} True if it's a requirement line
   */
  _isRequirementLine(line) {
    const reqKeywords = ['requirement', 'prerequisite', 'requires', 'must have'];
    return reqKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }

  /**
   * Extract requirement from a requirement line
   * @param {String} line Line containing requirement
   * @returns {String} Extracted requirement
   */
  _extractRequirement(line) {
    // Remove the requirement keyword and clean up
    return line.replace(/requirement[s]?[:\-]?/i, '').trim();
  }

  /**
   * Get degree section from line
   * @param {String} line Line to check
   * @returns {Number|null} Degree number or null if not a degree section
   */
  _getDegreeSection(line) {
    const degreeNames = ageSystem.talentDegrees.inUse || ['Novice', 'Expert', 'Master'];
    
    for (let i = 0; i < degreeNames.length; i++) {
      if (line.toLowerCase().includes(degreeNames[i].toLowerCase())) {
        return i;
      }
    }
    
    return null;
  }

  /**
   * Create talent items from parsed data
   */
  async _createTalentItems() {
    const talentItems = [];
    
    for (const talentData of this.data.talents) {
      const talentItem = {
        name: talentData.name,
        type: 'talent',
        img: ageSystem.itemIcons.talent,
        system: {
          requirement: talentData.requirement,
          degree: 0,
          type: talentData.type,
          activate: true,
          favorite: true,
          longDesc: talentData.degrees[0].desc,
          degree0: talentData.degrees[0],
          degree1: talentData.degrees[1],
          degree2: talentData.degrees[2],
          degree3: talentData.degrees[3],
          degree4: talentData.degrees[4]
        }
      };
      
      talentItems.push(talentItem);
    }
    
    // Create the talent items
    if (talentItems.length > 0) {
      await game.items.documentClass.createDocuments(talentItems);
      ui.notifications.info(`Created ${talentItems.length} talent(s): ${talentItems.map(t => t.name).join(', ')}`);
    } else {
      ui.notifications.warn("No talents found to import.");
    }
  }
} 