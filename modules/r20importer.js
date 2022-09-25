import {ageSystem} from "./config.js";

export default class r20importer {
  constructor (r20, options = {}) {
    if (!r20) return null;
    console.log(r20);

    this.createJournals(r20.journalfolder, r20.handouts)

    const journal = [{level0}, {level1}, {level2}]
  }

  retrieveInnerId(arr) {

  }

  async createJournals(folder, pages) {
    const pageData = [];

    const jFolder = [];

    pages.forEach(e => {
      let privilege = {default: CONST.DOCUMENT_PERMISSION_LEVELS.NONE};
      if (e.inplayerjournals.includes('all')) privilege.default = CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER;
      if (e.controlledby.includes('all')) privilege.default = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
      let textField = e.notes;
      if (e.avatar != "") textField = `<img src="${e.avatar}">` + textField;

      // Journal Field
      const j = {
        name: e.name,
        ownership: privilege,
      };

      // Single Pages
      const pg = [{
        src: e.avatar,
        name: e.name,
        type: "text",
        text: {content: textField},
      }];

      // Add GM only page
      if (e.gmnotes != "") pg.push({
        ownership: {default: CONST.DOCUMENT_PERMISSION_LEVELS.NONE},
        name: "GM Notes",
        type: 'text',
        text: {content: e.gmnotes}
      })

      // Append all pages to main Journal
      j.pages = pg;

      // Select Folder
      j.folder20 = null;
      // Fazer laço While para entrar nos diferentes níveis de pasta => Foundry suporta apenas 3 níveis.
      pageData.push(j);

    });

    // Código para criar uma pasta de JournalEntry
    // Folder.createDocuments([{name: "Coloque o Nome Aqui", type: "JournalEntry"}])
    // Código para cirar pasta dentro de outra pasta
    // Folder.createDocuments([{name: "Coloque o Nome Aqui", type: "JournalEntry", folder: "EES9l9A2MnATOojJ"}])
    game.journal.documentClass.createDocuments(pageData)
  }
}