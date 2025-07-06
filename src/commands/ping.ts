import { Schematic } from "@/structure/classes/Schematic.js";


export default Schematic.registerCommand({
    name: "ping",
    description: "commands.ping.description",
    usage: "ping",
    execute: async ({ client, message, t }) => {
        const latency = Date.now() - message.createdTimestamp;
        message.channel.send({
            content: `🏓 | ${t("commands.ping.pong", latency, client.ws.ping)}`
        })
    }
})