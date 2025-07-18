import { UpdateFeature } from "@/services/UpdateService.js";
import { BaseAgent } from "@/structure/classes/BaseAgent.js";
import { ExtendedClient } from "@/structure/classes/ExtendedClient.js";
import { InquirerUI } from "@/structure/classes/InquirerUI.js";
import { ConfigPrompter } from "@/structure/core/ConfigPrompter.js";
import { logger } from "@/utils/logger.js";
import { confirm } from "@inquirer/prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

process.title = "Advanced Discord OwO Tool Farm - Copyright 2025 © Elysia x Kyou Izumi";
console.clear();

const updateFeature = new UpdateFeature();
const client = new ExtendedClient();

const argv = await yargs(hideBin(process.argv))
    .commandDir("src/cli", {
        extensions: ["ts"],
    })
    .option("verbose", {
        alias: "v",
        type: "boolean",
        description: "Enable verbose logging",
        default: false,
    })
    .option("skip-check-update", {
        alias: "s",
        type: "boolean",
        description: "Skip the update check",
        default: false,
    })
    .option("language", {
        alias: "l",
        type: "string",
        description: "Set the language for the application",
        default: "en",
    })
    .help()
    .parse();

logger.setLevel(argv.verbose || process.env.NODE_ENV === "development" ? "debug" : "sent");

if (!argv.skipCheckUpdate) {
    const updateAvailable = await updateFeature.checkForUpdates();
    if (updateAvailable) {
        const shouldUpdate = await confirm({
            message: "An update is available. Do you want to update now?",
            default: true,
        });
        if (shouldUpdate) {
            await updateFeature.performUpdate();
        }
    }
    await client.sleep(1000); // Wait for update to complete
}

const { config } = await InquirerUI.prompt(client);
await BaseAgent.initialize(client, config);