import { Schematic } from "@/structure/Schematic.js";
import { formatTime, parseTimeString } from "@/utils/time.js";

export default Schematic.registerCommand({
    name: "pause",
    description: "commands.pause.description",
    usage: "pause [duration] (e.g., pause 1h, pause 30m, pause 45s)",
    execute: async ({ agent, message, t, args }) => {
        if (agent.isFarmLoopPaused()) {
            return message.reply({
                content: t("commands.pause.alreadyPaused")
            });
        }

        const timeArg = args?.[0];
        let duration: number | null = null;

        if (timeArg) {
            duration = parseTimeString(timeArg);
            if (duration === null) {
                return message.reply({
                    content: t("commands.pause.invalidDuration")
                });
            }

            // Set reasonable limits (max 24 hours)
            if (duration > 24 * 60 * 60 * 1000) {
                return message.reply({
                    content: t("commands.pause.durationTooLong")
                });
            }
        }

        agent.pauseFarmLoop();

        if (duration) {
            // Auto-resume after the specified duration
            setTimeout(() => {
                if (agent.isFarmLoopPaused()) {
                    agent.resumeFarmLoop();
                    message.channel.send({
                        content: t("commands.pause.autoResumed")
                    });
                }
            }, duration);

            message.reply({
                content: t("commands.pause.successWithTimeout", formatTime(0, duration))
            });
        } else {
            message.reply({
                content: t("commands.pause.success")
            });
        }
    }
});
