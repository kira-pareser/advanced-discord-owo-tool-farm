import { Schematic } from "@/structure/Schematic.js";

export default Schematic.registerCommand({
    name: "resume",
    description: "commands.resume.description",
    aliases: ["unpause"],
    usage: "resume",
    execute: async ({ agent, message, t }) => {
        if (!agent.isFarmLoopPaused()) {
            return message.reply({
                content: t("commands.resume.notPaused")
            });
        }

        agent.resumeFarmLoop();

        message.reply({
            content: t("commands.resume.success")
        });
    }
});
