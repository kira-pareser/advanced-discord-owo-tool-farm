import { checkbox } from "@inquirer/prompts";

const res = await checkbox({
    message: "Select the gem rarities you want to use:",
    required: true,
    loop: false,
    choices: [
        "common",
        "uncommon",
        "rare",
        "epic",
        "legendary",
        "mythical",
        "fabled"
    ]
})

const GEM_TIERS = {
    common: [51, 65, 72, 79],
    uncommon: [52, 66, 73, 80],
    rare: [53, 67, 74, 81], 
    epic: [54, 68, 75, 82],
    legendary: [55, 69, 76, 83],
    mythical: [56, 70, 77, 84],
    fabled: [57, 71, 78, 85],
}


// @ts-expect-error
console.log(res.map(rarity => GEM_TIERS[rarity]).flat())