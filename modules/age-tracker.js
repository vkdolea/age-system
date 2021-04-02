export class AgeTracker extends Application {
	constructor(options = {}) {
		super(options)
	}

	get template() {
		return `systems/age-system/templates/age-tracker.hbs`;
	}
	
	getData(options) {
		const data = super.getData(options);
		const maxSer = 18;
		data.hasSerendipity = game.settings.get("age-system", "serendipity");
		if (game.settings.get("age-system", "serendipityValue") > maxSer) game.settings.set("age-system", "serendipityValue", maxSer);
		const serend = game.settings.get("age-system", "serendipityValue");
		data.curSer = serend > 18 ? 18 : serend;
		const serDice = Math.floor(serend/6);
		const serReminder = serend % 6;

		data.serDie = new Array(Math.ceil(maxSer/6));
		for (let d = 0; d < data.serDie.length; d++) {
			data.serDie[d] = {
				value: (d < serDice-1) ? 6 : serReminder,
				min: d*6 + 1
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
		// html.find("#age-roller").click(this._onClick.bind(this));
		// html.find("#age-roller").contextmenu(this._onRightClick.bind(this));
	}
	
	refresh() {
		this.render(true);
	}

 	// async _onClick(event) {
	// 	event.preventDefault();
	// 	const user = game.user.name;
	// 	const rollHeader = game.i18n.format("age-system.chatCard.looseRoll", {user});
    //     ageRollCheck({event: event, flavor: rollHeader});
	// }

	// async _onRightClick(event) {
	// 	event.preventDefault();
    //     event = new MouseEvent('click', {altKey: true});
	// 	const user = game.user.name;
	// 	const rollHeader = game.i18n.format("age-system.chatCard.looseRoll", {user});
    //     ageRollCheck({event: event, flavor: rollHeader});
	// }
}