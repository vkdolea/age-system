export class AgeTracker extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
	static DEFAULT_OPTIONS = {
		id: "age-tracker",
		classes: ["age-system", "age-tracker-window"],
		popup: false,
		actions: {
			sermod: AgeTracker._sermod,
			compmod: AgeTracker._compmod,
			milestone: AgeTracker._milestone
		},
		window: {
			frame: false,
			positioned: false
		}
	}

	static PARTS = {
		div: {
			template: "systems/age-system/templates/age-tracker.hbs",
		}
	}

	/** @param {HTMLElement} element  */
	_insertElement(element) {
		const existing = document.getElementById(element.id);
		if (existing) existing.replaceWith(element);
		else document.getElementById("ui-bottom").prepend(element);
	}

	async _prepareContext(options) {
		const data = super._prepareContext(options);
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
		const system = data;
		return {system};
	}

	refresh() {
		this.render(true);
	}

 	static _sermod(event, target) {
		event.preventDefault();
		const serData = game.settings.get("age-system", "serendipityValue");
		let value;
		if (event.shiftKey) value = 6;
		if (!value && event.ctrlKey) value = 3;
		if (!value) value = 1;
		if (target.classList.contains('minus')) value = -value;
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

	static _compmod(event, target) {
		event.preventDefault();
		const classes = target.classList;
		const compData = game.settings.get("age-system", "complicationValue");
		if (classes.contains('refresh')) return game.settings.set("age-system", "complicationValue", {max: compData.max, actual: 0});
		let value;
		if (event.shiftKey) value = 10;
		if (!value && event.ctrlKey) value = 5;
		if (!value) value = 1;
		if (classes.contains('minus')) value = -value;
		compData.actual += value;
		if (compData.actual > compData.max) compData.actual = compData.max;
		if (compData.actual < 0) compData.actual = 0;
		game.settings.set("age-system", "complicationValue", compData);
	}

	static _milestone() {
		const rollTable = game.settings.get("age-system", "complicationRollTable");
		if (rollTable === 'none')  {
			return this._defaultRoll();
		}  else {
			const table = game.tables.get(rollTable);
			if (table) return table.draw();
			return this._defaultRoll();
		}
	}

	_defaultRoll() {
		const compType = game.i18n.localize(`SETTINGS.comp${game.settings.get("age-system", "complication")}`);
		const flavor = game.i18n.format("age-system.chatCard.compRoll", {compType});
		let compRoll = new Roll("1d6");
		return compRoll.toMessage({flavor, rollMode: "selfroll", whisper: [game.user.id]});
	}
}
