export const ageSystem = {};

ageSystem.attributes = {
    acc: "age-system.acc",
    comm: "age-system.comm",
    cons: "age-system.cons",
    dex: "age-system.dex",
    fight: "age-system.fight",
    int: "age-system.int",
    per: "age-system.per",
    str: "age-system.str",
    will: "age-system.will",
};

ageSystem.focus = {
    teste1: "um",
    teste2: "dois"
};

Hooks.on("renderageSystemItemSheet", async function() {
    ageSystem.focus.teste2 = focusList()[0];
});

function focusList() {
    let focusPack = game.packs.get("age-system.focus");
    focusPack.getIndex();
    let focusList = [];
    for (let i = 0; i < focusPack.index.length; i++) {
        const entry = focusPack.index[i];
        focusList[i] = entry.name;
    }
    return focusList;
}