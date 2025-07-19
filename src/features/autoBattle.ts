import { Schematic } from "@/structure/Schematic.js";

export default Schematic.registerFeature({
    name: "autoBattle",
    cooldown: () => 15 * 1000,
    condition: () => true,
    run: async ({ agent }) => {
        await agent.awaitResponse({
            trigger: () => agent.send("battle"),
            filter: (m) => m.author.id === agent.owoID && m.embeds.length > 0
                && Boolean(m.embeds[0].author?.name.includes(m.guild?.members.me?.displayName!)),
            expectResponse: true,
        })
    },
})