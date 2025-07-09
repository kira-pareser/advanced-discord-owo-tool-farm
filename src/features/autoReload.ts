import { Schematic } from "@/structure/classes/Schematic.js";
import { logger } from "@/utils/logger.js";
import { ranInt } from "@/utils/math.js";


export default Schematic.registerFeature({
    name: "autoReload",
    options: {
        overrideCooldown: true
    },
    cooldown: () => {
        const date = new Date();
        date.setUTCHours(24, ranInt(0, 30), ranInt(0, 59), 0);
        return date.getTime() - Date.now();
    },
    condition: async ({ agent: { config } }) => {
        return config.autoReload ?? false;
    },
    run: ({ agent }) => {
        agent.reloadConfig();
        logger.info("Configuration reloaded successfully.");
    }
});