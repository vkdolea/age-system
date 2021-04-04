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
		data.hasSerendipity = game.settings.get("age-system", "serendipity");
		data.colorset = game.settings.get("age-system", "colorScheme");

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

		data.hasComplication = game.settings.get("age-system", "complication");
		const maxComp = 30;
		if (game.settings.get("age-system", "complicationValue") > maxComp) game.settings.set("age-system", "serendipityValue", maxComp);
		let comp = game.settings.get("age-system", "complicationValue")
		data.curComp = game.settings.get("age-system", "complicationValue");
		return data;
	}
	
	activateListeners(html) {
		super.activateListeners(html);
		html.find(".mod").click(this._onClick.bind(this));
		// html.find("#age-roller").contextmenu(this._onRightClick.bind(this));
	}
	
	refresh() {
		// this.getData();
		this.render(true);
	}

 	async _onClick(event) {
		event.preventDefault();
		let value = event.currentTarget.dataset.chgQtd;
		value = Number(value);
		if (event.currentTarget.classList.contains('minus')) value = -value;
		const serData = game.settings.get("age-system", "serendipityValue");
		serData.actual += value;
		if (serData.actual <= serData.max && serData.actual >= 0) {
			game.settings.set("age-system", "serendipityValue", serData).then(() => {
				this.refresh();
			});
		}
		// const rollHeader = game.i18n.format("age-system.chatCard.looseRoll", {user});
        // ageRollCheck({event: event, flavor: rollHeader});
	}

	// async _onRightClick(event) {
	// 	event.preventDefault();
    //     event = new MouseEvent('click', {altKey: true});
	// 	const user = game.user.name;
	// 	const rollHeader = game.i18n.format("age-system.chatCard.looseRoll", {user});
    //     ageRollCheck({event: event, flavor: rollHeader});
	// }
}