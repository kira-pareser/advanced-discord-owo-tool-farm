import { Schematic } from "@/structure/classes/Schematic.js";
import { CommandProps } from "@/typings/index.js";
import { logger } from "@/utils/logger.js";

export default Schematic.registerEvent({
  name: "commandEvent",
  event: "messageCreate",
  handler: async (BaseParams, message) => {
    const { agent, client, config } = BaseParams;
    if (message.author.bot) return;
    if (!config.prefix || message.content.startsWith(config.prefix)) return;
    const authorizedUserIDs = [
      client.user.id,
      ...(config.adminID ? [config.adminID] : []),
    ];
    if (!authorizedUserIDs.includes(message.author.id)) return;

    const args = message.content
      .slice(config.prefix.length)
      .trim()
      .split(/ +/g);

    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = (agent.commands.get(commandName) ||
      Array.from(agent.commands.values()).find((c) =>
        c.aliases?.includes(commandName)
      )) as CommandProps;
    if (!command) return;

    try {
      const params = { ...BaseParams };
      await command.execute(params); //damn i hate that
    } catch (error) {
      logger.error(`Error executing command "${commandName}":`);
      logger.error(error as Error);
    }
  },
});
