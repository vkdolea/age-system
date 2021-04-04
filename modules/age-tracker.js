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
			}   

			data.compData = compData;
		}

		return data;
	}
	
	activateListeners(html) {
		super.activateListeners(html);
		html.find(".ser-mod").click(this._onClickSer.bind(this));
		html.find(".comp-mod").click(this._onClickComp.bind(this));
		html.find(".milestone").click(this._onRollComp.bind(this));
	}
	
	refresh() {
		this.render(true);
	}

 	async _onClickSer(event) {
		event.preventDefault();
		const serData = game.settings.get("age-system", "serendipityValue");
		let value;
		if (event.shiftKey) value = 6;
		if (!value && event.ctrltKey) value = 3;
		if (!value) value = 1;
		if (event.currentTarget.classList.contains('minus')) value = -value;
		serData.actual += value;
		if (serData.actual > serData.max) serData.actual = serData.max;
		if (serData.actual < 0) serData.actual = 0;
		game.settings.set("age-system", "serendipityValue", serData);
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

	_onRollComp() {
		const compType = game.i18n.localize(`SETTINGS.comp${game.settings.get("age-system", "complication")}`);
		const flavor = game.i18n.format("age-system.chatCard.compRoll", {compType});
		let compRoll = new Roll("1d6");
		return compRoll.toMessage({flavor}, {whisper: game.users.filter(u => u.isGM), rollMode: "gmroll"});
	}
}