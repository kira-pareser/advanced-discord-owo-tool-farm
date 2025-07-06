import { Schematic } from "@/structure/classes/Schematic.js";

export default Schematic.registerFeature({
    name: "autoClover",
    options: {
        overrideCooldown: true,
    },
    cooldown: () => {
        const date = new Date();
        return date.setDate(date.getDate() + 1) - Date.now(); 
    },
    condition: async ({ config,cooldown }) => {
        if (!config.autoClover || !config.adminID) return false;
        if(cooldown.onCooldown) return false;
        return true;
    },
    run: async ({ agent, client, channel, config }) => { 
            await client.sendMessage(`clover ${config.adminID}`, {
                channel,
                prefix: agent.prefix,
            });
    },
});
