import { FeatureFnParams } from "@/typings/index.js";
import { logger } from "@/utils/logger.js";

export class CriticalEventHandler {
    public static handleRejection() {
        process.on("unhandledRejection", (reason, promise) => {
            logger.runtime("Unhandled Rejection at:");
            logger.runtime(`Promise: ${promise}`);
            logger.runtime(`Reason: ${reason}`);
            // Optionally, you can notify the user or log to a file
            // consoleNotify("Unhandled Rejection", `Promise: ${promise}\nReason: ${reason}`);
        });
        process.on("uncaughtException", (error) => {
            logger.error("Uncaught Exception:");
            logger.error(error)
            // Optionally, you can notify the user or log to a file
            // consoleNotify("Uncaught Exception", `Error: ${error.message}\nStack: ${error.stack}`);
        });
    }

    public static handleBan({ t }: FeatureFnParams) {
        logger.alert(`${t("logger.banned")}, ${t("logger.stop")}`);
        // consoleNotify(...)
        process.exit(-1);
    }

    public static async handleNoMoney({ agent, t, locale }: FeatureFnParams) {
        if (agent.config.autoSell) {
            logger.warn("Cowoncy ran out! Attempting to sell all items.");

            const sellResponse = await agent.awaitResponse({
                trigger: () => agent.send("sell all"),
                filter: (msg) => msg.author.id === agent.owoID && msg.content.includes(msg.guild?.members.me?.displayName!)
                    && (/sold.*for a total of/.test(msg.content) || msg.content.includes("You don't have enough animals!")),
            })

            if (!sellResponse) {
                logger.error("Failed to sell items. No response received.");
                return;
            }

            if (/sold.*for a total of/.test(sellResponse.content)) {
                logger.data(sellResponse.content.replace(/<a?:(\w+):\d+>/g, '$1').replace("**", "")); // Replace emojis with their names
            } else {
                logger.warn("No sellable items found. Stopping selfbot.");
                // consoleNotify(...)
                process.exit(-1);
            }
        } else {
            logger.warn("Cowoncy ran out and autoSell is disabled. Stopping selfbot.");
            // consoleNotify(...)
            process.exit(-1);
        }
    }
}