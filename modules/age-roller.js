import { ageSystem } from "./config.js";
import { ageRollCheck } from "./dice.js";
import ConditionsWorkshop from "./conditions-workshop.js";
import { applyBreather } from "./breather.js";
import AgeImporter from "./age-importer.js";
import r20importer from "./r20importer.js";

export class AgeRoller extends Application {
	constructor(options = {}) {
		super(options)
		this._r20data = null;
	}

	get template() {
		return `systems/dragon-age-system/templates/rolls/age-roller.hbs`;
	}
	
	getData(options) {
		const data = super.getData(options);
		data.colorset = game.settings.get("age-system", "colorScheme");
		data.isGM = game.user.isGM;
		data.wikiLink = ageSystem.wiki;

		// AGE Importer only available in English so far
		data.language = game.settings.get("core", "language");
		data.reqLang = ['en'].includes(data.language);
		return data;
	}
	
	activateListeners(html) {
		super.activateListeners(html);
		html.find('li').hover(t => t.currentTarget.classList.toggle('colorset-third-tier'));
		html.find("#age-roller img").click(this._onClick.bind(this));
		html.find("#age-roller img").contextmenu(this._onRightClick.bind(this));
		html.find("#age-roller-drag").contextmenu(this._onResetPosition.bind(this));
		html.find(".conditions-workshop").click(this.openConditionWorkshop.bind(this));
		html.find(".age-importer").click(this.openAgeImporter.bind(this));
		html.find(".r20-importer").click(this.startR20Importer.bind(this));
		html.find(".breather-tokens").click(this.tokenBreather);
		html.find('.roll').click(this._onSpecialRoll.bind(this));
		html.find('.roll').contextmenu(this._onSpecialRoll.bind(this));
		html.find("#age-roller-container").hover(this._onToggleOptions.bind(this));
		html.find('#age-roller-options').click(this._onToggleOptions.bind(this));

		// Set position
		let roller = document.getElementById("age-roller");
		const rollerPos = game.user.getFlag("dragon-age-system", "ageRollerPos");
		roller.style.left = rollerPos.xPos;
		roller.style.bottom = rollerPos.yPos;
		
		// Make the DIV element draggable:
		this._dragElement(roller);
	}
	
	refresh() {
		this.render(true);
	}

	async _onSpecialRoll(ev) {
		ev.preventDefault();
		const type = ev.currentTarget.dataset.roll;
		let formula = "";
		if (type === 'd666') formula += '1d6*100 + '
		formula += '1d6*10 + 1d6'
		let roll = await new Roll(formula).evaluate({async: true});
		return roll.toMessage({flavor: type}, {rollMode: (ev.shiftKey || ev.type === "contextmenu") ? "selfroll" : ""});
	}

	tokenBreather(ev) {
		applyBreather('selfroll');
	}

	openConditionWorkshop(ev) {
		return new ConditionsWorkshop().render(true);
	}

	openAgeImporter(ev) {
		return new AgeImporter().render(true);
	}

	startR20Importer(ev) {
		return this._onReadFromFile();
	}

	async _onReadFromFile() {
		new Dialog({
			title: `AGE R20 Import`,
			content: await renderTemplate("templates/apps/import-data.html", {
				hint1: game.i18n.format("DOCUMENT.ImportDataHint1", {document: "R20 Importer"})
			}),
			buttons: {
				import: {
					icon: '<i class="fas fa-file-import"></i>',
					label: game.i18n.format("age-system.import"),
					callback: html => {
						const form = html.find("form")[0];
						if ( !form.data.files.length ) return ui.notifications.error("You did not upload a data file!");
						readTextFromFile(form.data.files[0]).then(json => this.importFromJSON(json));
					}
				},
				no: {
					icon: '<i class="fas fa-times"></i>',
					label: game.i18n.format("age-system.cancel"),
				}
			},
			default: "import"
		}, {
			width: 400
		}).render(true);
	};

	/**
	 * Read a JSON from a file with R20 Importer data, validate and save it.
	 * @param {string} json Stringfied JSON object
	 */
	importFromJSON(json){
		let data;
		try {
			data = JSON.parse(json);
		}
		catch(err) {
			console.log(err.message)
			return ui.notifications.warn(game.i18n.localize("age-system.invalidFileContent"));
		}
		new r20importer(data);
	}
	
	_onToggleOptions(ev) {
		ev.preventDefault();
		const opt = document.getElementById("age-roller-options");
		const view = opt.style.display;
		switch (view) {
			case '':
			case 'none':
				opt.style.display = 'inline-block';
				break;
			case 'inline-block':
				opt.style.display = 'none';
				break;
			default:
				break;
		}
	}

 	async _onClick(event) {
		event.preventDefault();
		const rollData = {
			event,
			flavor: game.user.name,
			flavor2: game.i18n.localize("age-system.chatCard.looseRoll")
		}
        ageRollCheck(rollData);
	}

	async _onRightClick(event) {
		event.preventDefault();
		let roll = await new Roll("1d6").evaluate({async: true});
		return roll.toMessage({}, {rollMode: event.shiftKey ? "blindroll" : ""});
	}

	_onResetPosition(event) {
		const elmnt = event.currentTarget.closest("#age-roller");
		const original = CONFIG.ageSystem.ageRollerPos;
		elmnt.style.left = original.xPos;
		elmnt.style.bottom = original.yPos;
		this._setOptionsMenuPos(elmnt);
		game.user.setFlag("age-system", "ageRollerPos", original);
	}

	_setOptionsMenuPos(ref) {
		let opts = document.getElementById("age-roller-options");
		opts.style.left = (ref.offsetLeft + 52) + "px";
		opts.style.bottom = (ref.offsetParent.clientHeight - ref.offsetTop - ref.clientHeight) + "px";
	}

	_dragElement(elmnt) {
		var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		const ageRoller = this;
		if (document.getElementById("age-roller-drag")) {
			// if present, the header is where you move the DIV from:
			document.getElementById("age-roller-drag").onmousedown = dragMouseDown;
		} else {
			// otherwise, move the DIV from anywhere inside the DIV:
			elmnt.onmousedown = dragMouseDown;
		}

		// Set new position for Options Menu
		this._setOptionsMenuPos(elmnt)
	  
		function dragMouseDown(e) {
			e = e || window.event;
			e.preventDefault();
			// get the mouse cursor position at startup:
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = closeDragElement;
			// call a function whenever the cursor moves:
			document.onmousemove = elementDrag;
		}
	  
		function elementDrag(e) {
			e = e || window.event;
			e.preventDefault();
			// calculate the new cursor position:
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			// set the element's new position:
			elmnt.style.bottom = (elmnt.offsetParent.clientHeight - elmnt.offsetTop - elmnt.clientHeight + pos2) + "px";
			elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
		}
	  
		function closeDragElement() {
		  	// stop moving when mouse button is released:
		  	document.onmouseup = null;
		  	document.onmousemove = null;
		  	// Save position on appropriate User Flag
			const rollerPos = {};
			rollerPos.xPos = elmnt.style.left;
			rollerPos.yPos = elmnt.style.bottom;
			game.user.setFlag("age-system", "ageRollerPos", rollerPos);
			ageRoller._setOptionsMenuPos(elmnt)
		}
	}
}