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

// Initializing variable
ageSystem.focus = [];

// Hook to update compendium list when Foundry VTT is 'ready'
Hooks.on("ready", function() {
    ageSystem.focus = compendiumList("age-system.focus");
});

// If Compendia are updated, then compendiumList is gathered once again
Hooks.on("renderCompendium", function() {
    ageSystem.focus = compendiumList("age-system.focus");
});

// This function looks at given Compendium and returns an array with object containing id and name for all entries
function compendiumList(compendiumName) {
    let dataPack = game.packs.get(compendiumName);
    let dataList = [];
    dataPack.getIndex().then(function(){
        for (let i = 0; i < dataPack.index.length; i++) {
            const entry = dataPack.index[i]; // It is necessary to store entry's name and id, to avoid messing up with existing Focus when Compendium is updated! Create array of objectes array = [{id: "xxx", name: "yyy"} {...}] - check if my implementation is correct
            dataList[i] = {
                _id: entry._id,
                name: entry.name
            };   
        }
    });
    return dataList;
}