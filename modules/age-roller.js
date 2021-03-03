import { ageRollCheck } from "./dice.js";

export class AgeRoller extends Application {
	constructor(options = {}) {
		super(options)
	}
	
	getData(options) {
		const data = super.getData(options);
		return data;
	}
	
	activateListeners(html) {
		super.activateListeners(html);
		html.find("#age-roller").click(this._onClick.bind(this));
		html.find("#age-roller").contextmenu(this._onRightClick.bind(this));
	}
	
	refresh() {
		this.render(true);
	}

 	async _onClick(event) {
		event.preventDefault();
		const user = game.user.name;
		const rollHeader = game.i18n.format("age-system.chatCard.looseRoll", {user});
        ageRollCheck({event: event, flavor: rollHeader});
	}

	async _onRightClick(event) {
		event.preventDefault();
        event = new MouseEvent('click', {altKey: true});
		const user = game.user.name;
		const rollHeader = game.i18n.format("age-system.chatCard.looseRoll", {user});
        ageRollCheck({event: event, flavor: rollHeader});
	}
}