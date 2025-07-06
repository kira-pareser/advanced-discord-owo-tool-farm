import path from "node:path";
import fs from "node:fs";

import { Schematic } from "@/structure/classes/Schematic.js";
import { logger } from "@/utils/logger.js";
import { importDefault } from "@/utils/import.js";
import { EventOptions } from "@/typings/index.js";

export default Schematic.registerHandler({
  run: async (BaseParams) => {
    const { agent, client } = BaseParams;
    const featuresFolder = path.join(agent.rootDir, "events");
    const statDir = fs.statSync(featuresFolder);
    if (!statDir.isDirectory()) {
      logger.warn(`Events folder not found, creating...`);
      fs.mkdirSync(featuresFolder, { recursive: true });
    }
    client.removeAllListeners();
    for (const file of fs.readdirSync(featuresFolder)) {
      if (!file.endsWith(".js") && !file.endsWith(".ts")) {
        logger.warn(`Skipping non-JS/TS file: ${file}`);
        continue;
      }

      const filePath = path.join(featuresFolder, file);
      try {
        const event = await importDefault<EventOptions>(filePath);
        if (!event || typeof event !== "object" || !event.name) {
          logger.warn(`Invalid feature in ${filePath}, skipping...`);
          continue;
        }
        if (event.disabled) continue; 
        client[event.once ? "once" : "on"](
          event.event,
          (...args) => void event.handler(BaseParams, ...args)
        );
      } catch (error) {
        logger.error(`Error loading feature from ${filePath}:`);
        logger.error(error as Error);
      }
    }
  },
});
