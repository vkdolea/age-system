export class ageSystemItem extends Item {

    /** @override */
    prepareData() {

        super.prepareData();
        if (!this.data.img) this.data.img = CONST.DEFAULT_TOKEN;
        const itemData = this.data;
        const data = itemData.data;

    }

}