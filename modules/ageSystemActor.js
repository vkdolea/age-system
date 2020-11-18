export class ageSystemActor extends Actor {

    /** @override */
    prepareData() {

        super.prepareData();
        if (!this.data.img) this.data.img = CONST.DEFAULT_TOKEN;
        const actorData = this.data;
        const data = actorData.data;

        if (actorData.type === "char") {
            data.defense.total =  Number(data.attributes.dex.value) + Number(data.defense.base) + Number(data.defense.mod) + Number(data.defense.gameModeBonus);
            data.armor.toughness.total = Number(data.attributes.cons.value) + Number(data.armor.toughness.gameModeBonus)+ Number(data.armor.toughness.mod);
            data.speed.total =  Number(data.attributes.dex.value) + Number(data.speed.base) + Number(data.speed.mod)
        }
    }
}