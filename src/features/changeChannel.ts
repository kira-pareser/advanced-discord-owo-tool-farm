import { Schematic } from "@/structure/classes/Schematic.js";
import { logger } from "@/utils/logger.js";
import { ranInt } from "@/utils/math.js";


export default Schematic.registerFeature({
    name: "changeChannel",
    cooldown: () => 5000,
    condition: async ({ agent }) => {
        if (agent.config.channelID.length <= 1) return false;

        return agent.totalCommands >= agent.channelChangeThreshold;
    },
    run: async ({ agent }) => {
        agent.channelChangeThreshold += ranInt(17, 56);
        agent.setActiveChannel();
    }
})