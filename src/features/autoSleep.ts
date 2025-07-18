import { Schematic } from "@/structure/classes/Schematic.js";
import { formatTime } from "@/utils/date.js";
import { logger } from "@/utils/logger.js";
import { mapInt, ranInt } from "@/utils/math.js";


export default Schematic.registerFeature({
    name: "autoSleep",
    cooldown: () => 5000,
    condition: async ({ agent }) => {
        return agent.config.autoSleep 
            && agent.totalCommands - agent.lastSleepAt >= agent.autoSleepThreshold;
    },
    run: ({ agent }) => {
        const commandsSinceLastSleep = agent.totalCommands - agent.lastSleepAt;
        const sleepTime = mapInt(commandsSinceLastSleep, 52, 600, 5 * 60 * 1000, 40 * 60 * 1000); // Map the threshold to a sleep time between 5 and 40 minutes
        const nextThreshold = ranInt(52, 600);
        agent.lastSleepAt = agent.totalCommands; // Update the last sleep time to the current command count
        agent.autoSleepThreshold = nextThreshold; // Add a random padding to the threshold for the next sleep

        logger.info(`Sleeping for ${formatTime(0, sleepTime)} after ${commandsSinceLastSleep} commands.`);
        logger.info(`Next sleep after ${nextThreshold} commands for ${formatTime(0, mapInt(
            nextThreshold,
            52, 600, // Map the range of commands to the sleep time
            5 * 60 * 1000, 40 * 60 * 1000
        ))}`);

        return agent.client.sleep(sleepTime)
    }
})