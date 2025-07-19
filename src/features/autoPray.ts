import { Schematic } from "@/structure/Schematic.js";
import { FeatureFnParams } from "@/typings/index.js";
import { logger } from "@/utils/logger.js";


export default Schematic.registerFeature({
    name: "autoPray",
    cooldown: () => 5 * 60 * 1000,
    condition: async ({ agent: { config } }) => {
        if (!config.autoPray || config.autoPray.length <= 0) return false;

        return true;
    },
    run: async ({ agent }) => {
        const command = agent.config.autoPray[Math.floor(Math.random() * agent.config.autoPray.length)];

        return agent.send(command)

        // const check = await agent.awaitResponse({
        //     trigger: () => agent.send(command),
        //     filter: (m) => m.author.id == agent.owoID
        //         && m.content.includes(m.guild?.members.me?.displayName!)
        //         && m.content.includes("I could not find that user!"),
        // });

        // if (check) {
        //     logger.warn("Admin not found in the server, removing command from autoPray list.");
        //     agent.config.autoPray = agent.config.autoPray.filter(c => c !== command);
        // }
    }
})