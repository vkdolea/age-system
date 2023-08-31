export class AgeTracker extends Application {
	constructor(options = {}) {
		super(options)
	}

	get template() {
		return `systems/age-system/templates/age-tracker.hbs`;
	}
	
	getData(options) {
		const data = super.getData(options);
		data.isGM = game.user.isGM;
		data.colorset = game.settings.get("age-system", "colorScheme");

		data.hasSerendipity = game.settings.get("age-system", "serendipity");
		if (data.hasSerendipity) {
			const serData = game.settings.get("age-system", "serendipityValue");
			if (serData.actual > serData.max) {
				serData.actual = serData.max;
				game.settings.set("age-system", "serendipityValue", serData);
			};
			const sides = 6;
			let total = serData.actual
			data.serDie = new Array(Math.ceil(serData.max/sides));
			for (let d = 0; d < data.serDie.length; d++) {
				data.serDie[d] = {};
				data.serDie[d].min = d*sides + 1;
				data.serDie[d].inactive = d*sides < serData.actual ? false : true;
				const diff = total - sides;
				data.serDie[d].value = diff >= 0 ? sides : total < 0 ? 0 : total;
				total = diff;
			}
		}

		const compType = game.settings.get("age-system", "complication");
		data.hasComplication = (compType === "none") ? false : true;
		if (data.hasComplication) {
			const compData = game.settings.get("age-system", "complicationValue");
			compData.type = compType;
			compData.tracker = new Array(compData.max);
			for (let b = 0; b < compData.tracker.length; b++) {
				compData.tracker[b] = {};
				compData.tracker[b].check = (compData.actual-1 >= b) ? true : false;
				compData.tracker[b].milestone = ((b+1) % 10 === 0) ? true : false;
			};
			data.compData = compData;
		};
		return data;
	}
	
	activateListeners(html) {
		super.activateListeners(html);
		html.find(".ser-mod").click(this._onClickSer.bind(this));
		html.find(".comp-mod").click(this._onClickComp.bind(this));
		html.find(".milestone").click(this._onRollComp.bind(this));		
		html.find("#age-tracker-drag").contextmenu(this._onRightClick.bind(this));

		// Set position
		let tracker = document.getElementById("age-tracker");
		const trackerPos = game.user.getFlag("age-system", "ageTrackerPos");
		tracker.style.left = trackerPos.xPos;
		tracker.style.bottom = trackerPos.yPos;

		// Make the DIV element draggable:
		this._dragElement(tracker);
	}
	
	refresh() {
		this.render(true);
	}

 	async _onClickSer(event) {
		event.preventDefault();
		const serData = game.settings.get("age-system", "serendipityValue");
		let value;
		if (event.shiftKey) value = 6;
		if (!value && event.ctrlKey) value = 3;
		if (!value) value = 1;
		if (event.currentTarget.classList.contains('minus')) value = -value;
		serData.actual += value;
		if (serData.actual > serData.max) serData.actual = serData.max;
		if (serData.actual < 0) serData.actual = 0;
		game.settings.set("age-system", "serendipityValue", serData);
	}

	_onRightClick(event) {
		const tracker = event.currentTarget.closest("#age-tracker");
		const original = CONFIG.ageSystem.ageTrackerPos;
		tracker.style.left = original.xPos;
		tracker.style.bottom = original.yPos;
		game.user.setFlag("age-system", "ageTrackerPos", original);
	}

	_onClickComp(event) {
		event.preventDefault();
		const compData = game.settings.get("age-system", "complicationValue");
		if (event.currentTarget.classList.contains('refresh')) return game.settings.set("age-system", "complicationValue", {max: compData.max, actual: 0});
		let value;
		if (event.shiftKey) value = 10;
		if (!value && event.ctrlKey) value = 5;
		if (!value) value = 1;
		if (event.currentTarget.classList.contains('minus')) value = -value;
		compData.actual += value;
		if (compData.actual > compData.max) compData.actual = compData.max;
		if (compData.actual < 0) compData.actual = 0;
		game.settings.set("age-system", "complicationValue", compData);
	}

	async _onRollComp() {
		const rollTable = game.settings.get("age-system", "complicationRollTable");
		if (rollTable === 'none')  {
			const compType = game.i18n.localize(`SETTINGS.comp${game.settings.get("age-system", "complication")}`);
			const flavor = game.i18n.format("age-system.chatCard.compRoll", {compType});
			let compRoll = new Roll("1d6");
			return await compRoll.toMessage({flavor, rollMode: "selfroll", whisper: [game.user.id]});
		}  else {
			const table = RollTables.instance.get(rollTable);
			return await table.draw();
		}
	}

	_dragElement(elmnt) {
		var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		if (document.getElementById("age-tracker-drag")) {
		  // if present, the header is where you move the DIV from:
		  document.getElementById("age-tracker-drag").onmousedown = dragMouseDown;
		} else {
		  // otherwise, move the DIV from anywhere inside the DIV:
		  elmnt.onmousedown = dragMouseDown;
		}
	  
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
			const trackerPos = {};
			trackerPos.xPos = elmnt.style.left;
			trackerPos.yPos = elmnt.style.bottom;
			game.user.setFlag("age-system", "ageTrackerPos", trackerPos);
		}
	}
}