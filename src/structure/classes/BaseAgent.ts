import { Collection, GuildTextBasedChannel, Message, TextBasedChannel } from "discord.js-selfbot-v13";

import path from "path";

import { ExtendedClient } from "./ExtendedClient.js";
import { CooldownManager } from "../core/CooldownManager.js";
import { ranInt } from "@/utils/math.js";
import { logger } from "@/utils/logger.js";
import { watchConfig } from "@/utils/watcher.js";

import { AwaitResponseOptions, CommandProps, FeatureProps, SendOptions } from "@/typings/index.js";
import { Configuration } from "@/schemas/ConfigSchema.js";


export class BaseAgent {
    public readonly rootDir = path.join(process.cwd(), "src");

    public readonly client: ExtendedClient<true>;
    public config: Configuration;
    private cache: Configuration;

    public commands = new Collection<string, CommandProps>();
    public CooldownManager = new CooldownManager();
    public features = new Collection<string, FeatureProps>();

    public owoID = "408785106942164992"
    public prefix: string = "owo";

    public activeChannel!: GuildTextBasedChannel;

    public totalCommands = 0;
    public totalTexts = 0;

    private invalidResponseCount = 0;
    private invalidResponseThreshold = 3; // Threshold for invalid responses before auto-terminating the agent

    gem1Cache?: number[];
    gem2Cache?: number[];
    gem3Cache?: number[];
    starCache?: number[];

    public channelChangeThreshold = ranInt(17, 56);
    public autoSleepThreshold = ranInt(32, 200); // Default threshold for auto-sleep

    constructor(client: ExtendedClient<true>, config: Configuration) {
        this.client = client;
        this.cache = structuredClone(config); // Clone the config to avoid direct mutations
        this.config = watchConfig(config, (key, oldValue, newValue) => {
            logger.debug(`Configuration updated: ${key} changed from ${oldValue} to ${newValue}`);
        })
    }

    public setActiveChannel = async (id?: string): Promise<GuildTextBasedChannel | undefined> => {
        const channelIDs = this.config.channelID;

        if (!channelIDs || channelIDs.length === 0) {
            throw new Error("No channel IDs provided in the configuration.");
        }

        const channelID = id || channelIDs[ranInt(0, channelIDs.length)];
        try {
            const channel = await this.client.channels.fetch(channelID);
            if (channel && channel.isText()) {
                this.activeChannel = channel as GuildTextBasedChannel;
                logger.info(`Active channel set to: ${this.activeChannel.name} (${this.activeChannel.id})`);

                return this.activeChannel;
            } else {
                logger.warn(`Channel with ID ${channelID} is not a text channel or does not exist.`);
                this.config.channelID = this.config.channelID.filter(id => id !== channelID);
                logger.info(`Removed invalid channel ID ${channelID} from configuration.`);
            }
        } catch (error) {
            logger.error(`Failed to fetch channel with ID ${channelID}:`);
            logger.error(error as Error);
        }
        return;
    }

    public reloadConfig = () => {
        for (const key of Object.keys(this.cache)) {
            (this.config as any)[key as keyof Configuration] = this.cache[key as keyof Configuration];
        }
    }

    public send = async (content: string, options: SendOptions = {
        channel: this.activeChannel,
        prefix: this.prefix,
    }) => {
        if (!this.activeChannel) {
            logger.warn("Cannot send command: No active channel is set.");
            return;
        }

        return this.client.sendMessage(content, options)
    }

    public awaitResponse = (options: AwaitResponseOptions): Promise<Message | undefined> => {
        return new Promise((resolve, reject) => {
            const collector = this.activeChannel.createMessageCollector({
                filter: options.filter,
                time: options.time || 30_000, // Default to 30 seconds if no time is specified
                max: options.max || 1,
            });

            collector.once("collect", (message: Message) => {
                resolve(message);
            });

            collector.once("end", (collected) => {
                if (collected.size === 0) {
                    logger.debug(`No response received within the specified time (${this.invalidResponseCount}/${this.invalidResponseThreshold}).`);
                    this.invalidResponseCount++;
                    if (this.invalidResponseCount >= this.invalidResponseThreshold) {
                        logger.error(`Invalid response count exceeded threshold (${this.invalidResponseThreshold}). Terminating agent.`);
                        reject(new Error("Invalid response count exceeded threshold. Terminating agent."));
                    }
                    resolve(undefined);
                } else {
                    logger.debug(`Response received: ${collected.first()?.content.slice(0, 25)}...`);
                    this.invalidResponseCount = 0; // Reset invalid response count on successful collection
                }
            });

            options.trigger()
        })
    }
}
