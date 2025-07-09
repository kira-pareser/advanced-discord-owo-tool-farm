import { Schematic } from "@/structure/classes/Schematic.js";
import { formatTime } from "@/utils/date.js";
import { logger } from "@/utils/logger.js";
import { mapInt, ranInt } from "@/utils/math.js";


export default Schematic.registerFeature({
    name: "autoSleep",
    cooldown: () => 5000,
    condition: async ({ agent }) => {
        return agent.config.autoSleep && agent.totalCommands >= agent.autoSleepThreshold;
    },
    run: ({ agent }) => {
        const sleepTime = mapInt(agent.autoSleepThreshold, 32, 200, 5 * 60 * 1000, 40 * 60 * 1000); // Map the threshold to a sleep time between 5 and 40 minutes
        agent.autoSleepThreshold += ranInt(32, 200);

        logger.info(`Sleeping for ${formatTime(0, sleepTime)}`);
        logger.info(`Next sleep at ${agent.autoSleepThreshold} total commands for ${formatTime(0, mapInt(
            agent.autoSleepThreshold,
            agent.totalCommands + 32,
            agent.totalCommands + 200,
            5 * 60 * 1000, 40 * 60 * 1000
        ))}`);

        return agent.client.sleep(sleepTime)
    }
})