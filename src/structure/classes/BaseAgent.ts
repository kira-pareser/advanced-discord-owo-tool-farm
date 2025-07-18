import { ClientEvents, Collection, GuildMember, GuildTextBasedChannel, Message, User } from "discord.js-selfbot-v13";

import path from "path";

import { ExtendedClient } from "./ExtendedClient.js";
import { CooldownManager } from "../core/CooldownManager.js";
import { ranInt } from "@/utils/math.js";
import { logger } from "@/utils/logger.js";
import { watchConfig } from "@/utils/watcher.js";

import { AwaitResponseOptions, AwaitSlashResponseOptions, CommandProps, FeatureProps, SendMessageOptions } from "@/typings/index.js";
import { Configuration } from "@/schemas/ConfigSchema.js";
import featuresHandler from "@/handlers/featuresHandler.js";
import { i18n } from "@/utils/locales.js";
import { shuffleArray } from "@/utils/array.js";
import commandsHandler from "@/handlers/commandsHandler.js";
import eventsHandler from "@/handlers/eventsHandler.js";


export class BaseAgent {
    public readonly rootDir = path.join(process.cwd(), "src");
    public readonly miraiID = "1205422490969579530"

    public readonly client: ExtendedClient<true>;
    public config: Configuration;
    private cache: Configuration;
    public authorizedUserIDs: string[] = [];

    public commands = new Collection<string, CommandProps>();
    public cooldownManager = new CooldownManager();
    public features = new Collection<string, FeatureProps>();

    public owoID = "408785106942164992"
    public prefix: string = "owo";

    public activeChannel!: GuildTextBasedChannel;

    public totalCaptchaSolved = 0;
    public totalCaptchaFailed = 0;
    public totalCommands = 0;
    public totalTexts = 0;

    private invalidResponseCount = 0;
    private invalidResponseThreshold = 5; // Threshold for invalid responses before auto-terminating the agent

    gem1Cache?: number[];
    gem2Cache?: number[];
    gem3Cache?: number[];
    starCache?: number[];

    public channelChangeThreshold = ranInt(17, 56);
    public autoSleepThreshold = ranInt(82, 400); // Default threshold for auto-sleep
    public lastSleepAt = 0;

    public captchaDetected = false;
    private expectResponseOnAllAwaits = false;

    constructor(client: ExtendedClient<true>, config: Configuration) {
        this.client = client;
        this.cache = structuredClone(config); // Clone the config to avoid direct mutations
        this.config = watchConfig(config, (key, oldValue, newValue) => {
            logger.debug(`Configuration updated: ${key} changed from ${oldValue} to ${newValue}`);
        })

        this.authorizedUserIDs.push(
            this.client.user.id,
            ...(this.config.adminID ? [this.config.adminID] : []),
        );

        this.client.options.sweepers = {
            messages: {
                interval: 60 * 60, // 1 hour
                lifetime: 60 * 60 * 24, // 1 day
            },
            users: {
                interval: 60 * 60, // 1 hour
                filter: () => (user) => this.authorizedUserIDs.includes(user.id),
            },
        }
    }

    public setActiveChannel = (id?: string): GuildTextBasedChannel | undefined => {
        const channelIDs = this.config.channelID;

        if (!channelIDs || channelIDs.length === 0) {
            throw new Error("No channel IDs provided in the configuration.");
        }

        const channelID = id || channelIDs[ranInt(0, channelIDs.length)];
        try {
            const channel = this.client.channels.cache.get(channelID);
            if (channel && channel.isText()) {
                this.activeChannel = channel as GuildTextBasedChannel;
                logger.info(`Active channel set to: #${this.activeChannel.name}`);

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
        logger.info("Configuration reloaded from cache.");
    }

    public send = async (content: string, options: SendMessageOptions = {
        channel: this.activeChannel,
        prefix: this.prefix,
    }) => {
        if (!this.activeChannel) {
            logger.warn("Cannot send command: No active channel is set.");
            return;
        }

        this.client.sendMessage(content, options)
        if (!!this.prefix) this.totalCommands++;
        else this.totalTexts++;
    }

    private isBotOnline = async () => {
        try {
            const owo = await this.activeChannel.guild.members.fetch(this.owoID);
            return !!owo && owo.presence?.status !== "offline";
        } catch (error) {
            logger.warn("Failed to check OwO status, assuming bot is offline or not in the guild.");
            return false;
        }
    }

    public awaitResponse = (options: AwaitResponseOptions): Promise<Message | undefined> => {
        return new Promise((resolve, reject) => {
            const {
                channel = this.activeChannel,
                filter,
                time = 30_000,
                max = 1,
                trigger,
                expectResponse = false,
            } = options;

            // 2. Add a guard clause for safety.
            if (!channel) {
                const error = new Error("awaitResponse requires a channel, but none was provided or set as active.");
                logger.error(error.message);
                return reject(error);
            }

            const collector = channel.createMessageCollector({
                filter,
                time,
                max,
            });

            collector.once("collect", (message: Message) => {
                resolve(message);
            });

            collector.once("end", (collected) => {
                if (collected.size === 0) {
                    if (expectResponse || this.expectResponseOnAllAwaits) {
                        this.invalidResponseCount++;
                        logger.debug(`No response received within the specified time (${this.invalidResponseCount}/${this.invalidResponseThreshold}).`);
                    }
                    if (this.invalidResponseCount >= this.invalidResponseThreshold) {
                        reject(new Error("Invalid response count exceeded threshold."));
                    }
                    resolve(undefined);
                } else {
                    logger.debug(`Response received: ${collected.first()?.content.slice(0, 35)}...`);
                    this.invalidResponseCount = 0; // Reset invalid response count on successful collection
                }
            });

            trigger()
        })
    }

    public awaitSlashResponse = async (options: AwaitSlashResponseOptions) => {
        const {
            channel = this.activeChannel,
            bot = this.owoID,
            command,
            args = [],
            time = 30_000,
        } = options

        if (!channel) {
            throw new Error("awaitSlashResponse requires a channel, but none was provided or set as active.");
        }

        const message = await channel.sendSlash(bot, command, ...args);

        if (!(message instanceof Message)) {
            throw new Error("Unsupported message type returned from sendSlash.");
        }

        if (message.flags.has("LOADING")) return new Promise<Message>((resolve, reject) => {
            let timeout: NodeJS.Timeout;

            const listener = async (...args: ClientEvents["messageUpdate"]) => {
                const [_, m] = args;
                if (_.id !== message.id) return;
                cleanup();

                if (m.partial) {
                    try {
                        const fetchedMessage = await m.fetch();
                        return resolve(fetchedMessage);
                    } catch (error) {
                        logger.error("Failed to fetch partial message");
                        reject(error);
                    }
                } else {
                    resolve(m);
                }
            }

            const cleanup = () => {
                message.client.off("messageUpdate", listener);
                clearTimeout(timeout);
            }

            message.client.on("messageUpdate", listener);

            timeout = setTimeout(() => {
                cleanup();
                reject(new Error("AwaitSlashResponse timed out"));
            }, time);
        })

        return Promise.resolve(message);
    }

    public farmLoop = async () => {
        const featureKeys = Array.from(this.features.keys());
        if (featureKeys.length === 0) {
            logger.warn("No features available to run. Please ensure features are loaded correctly.");
            return;
        }

        for (const featureKey of shuffleArray(featureKeys)) {
            if (this.captchaDetected) {
                logger.debug("Captcha detected, skipping feature execution.");
                return;
            }

            const botStatus = await this.isBotOnline();
            if (!botStatus) {
                logger.warn("OwO bot offline status detected, expecting response on all awaits.");
                this.expectResponseOnAllAwaits = true;
            } else {
                this.expectResponseOnAllAwaits = false;
            }

            const feature = this.features.get(featureKey);
            if (!feature) {
                logger.warn(`Feature ${featureKey} not found in features collection.`);
                continue;
            }

            try {
                const internationalization = i18n(process.env.LOCALE);
                const shouldRun = await feature.condition({ agent: this, ...internationalization })
                    && this.cooldownManager.onCooldown("feature", feature.name) === 0;
                if (!shouldRun) continue;

                const res = await feature.run({ agent: this, ...internationalization });
                this.cooldownManager.set("feature", feature.name, res instanceof Number ? Number(res) : feature.cooldown() || 30_000);
                await this.client.sleep(ranInt(500, 1600)); // Random sleep between feature runs
            } catch (error) {
                logger.error(`Error running feature ${feature.name}:`);
                logger.error(error as Error);
            }
        }
        await this.client.sleep(ranInt(1000, 5000));
        this.farmLoop();
    }

    private registerEvents = async () => {
        const internationalization = i18n(process.env.LOCALE || "en");
        await featuresHandler.run({
            agent: this,
            ...internationalization,
        });
        logger.info(`Registered ${this.features.size} features.`);

        await commandsHandler.run({
            agent: this,
            ...internationalization,
        });
        logger.info(`Registered ${this.commands.size} commands.`);

        await eventsHandler.run({
            agent: this,
            ...internationalization,
        });
    }

    public static initialize = async (client: ExtendedClient<true>, config: Configuration) => {
        logger.debug("Initializing BaseAgent...");
        if (!client.isReady()) {
            throw new Error("Client is not ready. Ensure the client is logged in before initializing the agent.");
        }

        const agent = new BaseAgent(client, config);
        agent.setActiveChannel();

        await agent.registerEvents();
        logger.debug("BaseAgent initialized successfully.");

        agent.farmLoop();
    }
}
