import { Schematic } from "@/structure/classes/Schematic.js";
import { formatTime } from "@/utils/date.js";


export default Schematic.registerCommand({
    name: "uptime",
    description: "commands.uptime.description",
    usage: "uptime",
    execute: async ({ client, message, t }) => {
        const uptime = formatTime(client.readyTimestamp, Date.now());

        message.channel.send({
            content: t("commands.uptime.response", uptime)
        });
    }
})