import { Schematic } from "@/structure/classes/Schematic.js";

export default Schematic.registerFeature({
    name: "autoClover",
    cooldown: () => {
        const date = new Date();
        return date.setDate(date.getDate() + 1) - Date.now();
    },
    condition: async ({ agent: { config } }) => {
        if (!config.autoClover) return false;
        if (!config.adminID) {
            console.warn("autoClover feature requires adminID to be set in config.");
            config.autoClover = false; // Disable autoClover if adminID is not set
            return false;
        }

        return true;
    },
    run: async ({ agent }) => {
        await agent.send(`clover ${agent.config.adminID}`);

        agent.config.autoClover = false; // Disable autoClover after sending the message
    },
});
