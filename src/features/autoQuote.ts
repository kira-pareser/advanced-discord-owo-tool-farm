import { Schematic } from "@/structure/classes/Schematic.js";
import { ranInt } from "@/utils/math.js";
import { quotes } from "@/utils/quotes.js";

export default Schematic.registerFeature({
    name: "autoQuote",
    cooldown: () => 5000,
    condition: async ({ agent }) => {
        return agent.config.autoQuote.length > 0;
    },
    run: async ({ agent }) => {

        switch (agent.config.autoQuote[ranInt(0, agent.config.autoQuote.length)]) {
            case "owo":
                await agent.send("owo");
            case "quote":
                const quote = quotes[ranInt(0, quotes.length)];
                agent.send(quote, { prefix: "", channel: agent.activeChannel });
                break;
        }
        agent.totalTexts++;
    }
});