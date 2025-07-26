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
    // Currently supports Dragon Age, Fantasy AGE, Fantasy AGE 2e, Modern AGE, and The Expanse
    if (!['dage', 'fage', 'fage2e', 'mage', 'expanse'].includes(this._mode)) {
      ui.notifications.warn(`Talent import is currently only supported for Dragon AGE, Fantasy AGE, Fantasy AGE 2e, Modern AGE, and The Expanse. Support for ${ageSystem.gameSettingsChoices[this._mode] || this._mode} will be added in future updates.`);
      return;
    }
    
    const text = this._text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line); // Remove empty lines
    
    if (lines.length === 0) {
      ui.notifications.warn("No content found to import.");
      return;
    }
    
    // First line is always the talent name
    const talentName = this._cleanTalentName(lines[0]);
    
    let currentTalent = {
      name: talentName,
      requirement: "",
      classes: "",
      generalDesc: "",
      type: "talent",
      degrees: {
        0: { desc: "", isActive: true },
        1: { desc: "", isActive: true },
        2: { desc: "", isActive: true },
        3: { desc: "", isActive: true },
        4: { desc: "", isActive: true }
      }
    };
    
    let currentSection = null;
    let isInDegreeSection = false;
    let generalDesc = "";
    
    // Process remaining lines (skip first line which is the talent name)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a classes line
      if (this._isClassesLine(line)) {
        currentTalent.classes = this._extractClasses(line);
        continue;
      }
      
      // Check if this is a requirement line
      if (this._isRequirementLine(line)) {
        currentTalent.requirement = this._extractRequirement(line);
        continue;
      }
      
      // Check if this is a degree section header
      const degreeMatch = this._getDegreeSection(line);
      if (degreeMatch !== null) {
        // Save general description before entering degree sections
        if (!isInDegreeSection && generalDesc) {
          currentTalent.generalDesc = generalDesc.trim();
        }
        
        currentSection = degreeMatch;
        isInDegreeSection = true;
        
        // Extract the degree description from the same line
        let degreeDesc = "";
        const colonIndex = line.indexOf(':');
        
        if (colonIndex !== -1) {
          // Format with colon (Dragon AGE, Fantasy AGE, etc.)
          if (colonIndex < line.length - 1) {
            degreeDesc = line.substring(colonIndex + 1).trim();
          }
        } else {
          // Format without colon (The Expanse)
          // Find the degree name and extract text after it
          const lineLower = line.toLowerCase().trim();
          const degreeNames = ['novice', 'journeyman', 'expert', 'master'];
          
          for (const degreeName of degreeNames) {
            if (lineLower.startsWith(degreeName + ' ')) {
              degreeDesc = line.substring(degreeName.length).trim();
              break;
            }
          }
        }
        
        if (degreeDesc) {
          currentTalent.degrees[currentSection].desc = degreeDesc;
        }
        continue;
      }
      
      // Add content to current section
      if (isInDegreeSection && currentSection !== null) {
        if (currentTalent.degrees[currentSection].desc) {
          currentTalent.degrees[currentSection].desc += " " + line;
        } else {
          currentTalent.degrees[currentSection].desc = line;
        }
      } else if (!isInDegreeSection) {
        // Collect general description text
        if (generalDesc) {
          generalDesc += " " + line;
        } else {
          generalDesc = line;
        }
      }
    }
    
    // Save any remaining general description
    if (!isInDegreeSection && generalDesc) {
      currentTalent.generalDesc = generalDesc.trim();
    }
    
    // Add the talent to our data
    this.data.talents.push(currentTalent);
  }



  /**
   * Clean talent name from header formatting
   * @param {String} line Raw talent header line
   * @returns {String} Clean talent name
   */
  _cleanTalentName(line) {
    return line.replace(/[^\w\s]/g, '').trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Check if a line contains classes information
   * @param {String} line Line to check
   * @returns {Boolean} True if it's a classes line
   */
  _isClassesLine(line) {
    const lineLower = line.toLowerCase().trim();
    return lineLower.includes('classes:') || lineLower.includes('class:');
  }

  /**
   * Extract classes from a classes line
   * @param {String} line Line containing classes
   * @returns {String} Extracted classes
   */
  _extractClasses(line) {
    return line.replace(/class(?:es)?[:\-]?\s*/i, '').trim();
  }

  /**
   * Check if a line contains requirement information
   * @param {String} line Line to check
   * @returns {Boolean} True if it's a requirement line
   */
  _isRequirementLine(line) {
    const lineLower = line.toLowerCase().trim();
    
    // Must start with requirement keywords followed by colon or be very early in line
    // Handle various spellings and cases like "requireMent:", "requirement:", "requirements:"
    return lineLower.startsWith('requirement:') || 
           lineLower.startsWith('requirement ') ||
           lineLower.startsWith('requirements:') || 
           lineLower.startsWith('requirements ') ||
           lineLower.startsWith('prerequisite:') || 
           lineLower.startsWith('prerequisite ') ||
           lineLower.startsWith('requires:') || 
           lineLower.startsWith('requires ') ||
           /^requirement[s]?\s*[\:\-]/i.test(line);
  }

  /**
   * Extract requirement from a requirement line
   * @param {String} line Line containing requirement
   * @returns {String} Extracted requirement
   */
  _extractRequirement(line) {
    // Remove the requirement keyword and clean up
    return line.replace(/requirements?[:\-]?\s*/i, '').trim();
  }

  /**
   * Get degree section from line
   * @param {String} line Line to check
   * @returns {Number|null} Degree number or null if not a degree section
   */
  _getDegreeSection(line) {
    // Common AGE system degree names - map variations to degree numbers
    const degreeMap = {
      'novice': 0,
      'journeyman': 1,
      'expert': 1,
      'master': 2
    };
    
    const lineLower = line.toLowerCase().trim();
    
    for (const [degreeName, degreeNum] of Object.entries(degreeMap)) {
      // Handle both formats: with colons (most systems) and without colons (The Expanse)
      if (lineLower.includes(degreeName + ':') || 
          (lineLower.startsWith(degreeName) && lineLower.includes(':')) ||
          lineLower.startsWith(degreeName + ' ')) {
        return degreeNum;
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
          longDesc: talentData.generalDesc || talentData.degrees[0].desc,
          summary: talentData.classes ? `Classes: ${talentData.classes}` : "",
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