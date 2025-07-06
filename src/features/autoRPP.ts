import { Schematic } from "@/structure/classes/Schematic.js";
import { ranInt } from "@/utils/math.js";


export default Schematic.registerFeature({
    name: "autoRPP",
    options: {
        overrideCooldown: true
    },
    cooldown: () => (60 + ranInt(0, 59)) * 1000, // Random cooldown between 1 and 2 minutes
    condition: async ({ config }) => {
        if (!config.autoRPP) return false;
        
        return true;
    },
    run: async ({ agent, client, channel, config }) => {
        const command = config.autoRPP[ranInt(0, config.autoRPP.length)];
        client.sendMessage(command, {
            channel,
            prefix
        });
    }
})