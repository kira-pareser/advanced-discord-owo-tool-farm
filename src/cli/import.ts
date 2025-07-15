import path from "node:path";
import fs from "node:fs";
import { ConfigSchema } from "@/schemas/ConfigSchema.js";
import { BaseAgent } from "@/structure/classes/BaseAgent.js";
import { logger } from "@/utils/logger.js";
import { ExtendedClient } from "@/structure/classes/ExtendedClient.js";

export const command = "import <filename>";
export const desc = "Import a config file for instant setup";
export const builder = {
    filename: {
        type: "string",
        demandOption: true,
        description: "The name of the config file to import",
    },
};

export const handler = async (argv: { filename: string }) => {
    const filePath = path.resolve(process.cwd(), argv.filename);

    if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} does not exist.`);
        return;
    }

    if (path.extname(filePath) !== ".json") {
        console.error(`File ${filePath} is not a JSON file!`);
        return;
    }

    try {
        const configData = fs.readFileSync(filePath, "utf-8");
        const config = JSON.parse(configData);

        // Validate the configuration
        const validatedConfig = ConfigSchema.safeParse(config);
        if (!validatedConfig.success) {
            console.error("Invalid configuration file:", validatedConfig.error);
            return;
        }

        logger.info("Configuration imported successfully");

        // Create and start the bot with the imported config
        const client = new ExtendedClient();
        try {
            await client.checkAccount(validatedConfig.data.token);
            await BaseAgent.initialize(client, validatedConfig.data);
        } catch (error) {
            logger.error("Failed to start bot with imported configuration:");
            logger.error(error as Error);
        }
    } catch (error) {
        console.error("Error importing configuration:", error);
    }
};