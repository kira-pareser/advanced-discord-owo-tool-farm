import { Schematic } from "@/structure/classes/Schematic.js";

export default Schematic.registerFeature({
	name: "autoCookie",
	cooldown: () => {
		const date = new Date();
		return date.setDate(date.getDate() + 1) - Date.now();
	},
	condition: async ({ agent: { config } }) => {
		if (!config.autoCookie) return false;
		if (!config.adminID) {
			console.warn("autoCookie feature requires adminID to be set in config.");
			config.autoCookie = false; // Disable autoCookie if adminID is not set
			return false;
		}

		return true;
	},
	run: async ({ agent }) => {
		await agent.send(`cookie ${agent.config.adminID}`);

		agent.config.autoCookie = false; // Disable autoCookie after sending the message
	},
});
