import { Schematic } from "@/structure/classes/Schematic.js";


export default Schematic.registerFeature({
    name: "autoDaily",
    options: {
        overrideCooldown: true
    },
    cooldown: () => {
		const date = new Date();
		return date.setDate(date.getDate() + 1) - Date.now();
	},
    condition: async ({ agent: { config } }) => {
        if (!config.autoCookie) return false;

        return true;
    },
    run: async ({ agent }) => {
        agent.send("daily")
        agent.config.autoDaily = false; // Disable autoDaily after running
    }
})