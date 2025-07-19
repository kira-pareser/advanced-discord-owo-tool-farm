import { Schematic } from "@/structure/Schematic.js";
import { formatTime } from "@/utils/time.js";
import { logger } from "@/utils/logger.js";


export default Schematic.registerCommand({
    name: "status",
    description: "commands.status.description",
    usage: "status",
    execute: async ({ agent, message, t, locale }) => {
        try {
            // Send the status message
            await message.reply(t("commands.status.status",
                agent.captchaDetected ? "🔴 Captcha Detected" 
                : agent.isFarmLoopPaused() ? "🟡 Paused" : "🟢 Running",
                formatTime(agent.client.readyTimestamp, Date.now()),
                agent.totalTexts,
                agent.totalCommands,
                agent.totalCaptchaSolved,
                agent.totalCaptchaFailed
            ));
        } catch (error) {
            logger.error("Error during status command execution:");
            logger.error(error as Error);
        }
    }
});