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
  condition: async ({ config }) => {
    if (!config.autoCookie) return false;

    return true;
  },
  run: async ({ agent, client, channel, config }) => { 

      await client.sendMessage(`cookie ${config.adminID}`, {
        channel,
        prefix: agent.prefix,
      });

      config.autoCookie = false; // Disable autoCookie after sending the message
  },
});
