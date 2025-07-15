import { Schematic } from "@/structure/classes/Schematic.js";

export default Schematic.registerFeature({
    name: "autoBattle",
    cooldown: () => 15 * 1000,
    condition: () => true,
    run: async ({ agent }) => {
        return agent.send("battle");
    },
})