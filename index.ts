import { UpdateFeature } from "@/services/UpdateService.js";
import { BaseAgent } from "@/structure/classes/BaseAgent.js";
import { ExtendedClient } from "@/structure/classes/ExtendedClient.js";
import { InquirerUI } from "@/structure/classes/InquirerUI.js";
import { ConfigPrompter } from "@/structure/core/ConfigPrompter.js";
import { logger } from "@/utils/logger.js";
import { confirm } from "@inquirer/prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

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
    .demandCommand()
    .help()
    .parse();

if (argv.verbose) {
    logger.setLevel("debug");
    logger.info("Verbose logging enabled");
}

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
}

const { config } = await InquirerUI.prompt(client);
await BaseAgent.initialize(client, config);