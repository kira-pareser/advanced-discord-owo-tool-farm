import { Schematic } from "@/structure/classes/Schematic.js";


export default Schematic.registerCommand({
    name: "ping",
    description: "commands.ping.description",
    usage: "ping",
    execute: async ({ agent, message, t }) => {
        const latency = Date.now() - message.createdTimestamp;
        message.reply({
            content: `🏓 | ${t("commands.ping.pong", latency, agent.client.ws.ping)}`
        })
    }
})