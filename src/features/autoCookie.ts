import { Schematic } from "@/structure/classes/Schematic.js";

export default Schematic.registerFeature({
  name: "autoCookie",
  options: {
    overrideCooldown: true,
  },
  cooldown: () => {
    const date = new Date();
    return date.setDate(date.getDate() + 1) - Date.now();
  },
  condition: async ({ config , cooldown }) => {
    if (!config.autoCookie) return false;
    if(cooldown.onCooldown) return false;
    return true;
  },
  run: async ({ agent, client, channel, config }) => { 

      await client.sendMessage("cookie", {
        channel,
        prefix: agent.prefix,
      });
 
  },
});
