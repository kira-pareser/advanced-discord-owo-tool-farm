import { Configuration } from "@/schemas/ConfigSchema.js";
import { checkbox, input, select, Separator } from "@inquirer/prompts";
import axios from "axios";
import { Collection, Guild } from "discord.js-selfbot-v13";

import fs from "node:fs"
import path from "node:path";
import { ExtendedClient } from "../classes/ExtendedClient.js";
import chalk from "chalk";
import { BasePrompter } from "../classes/BasePrompter.js";
import { ConfigManager } from "./ConfigManager.js";

type ConfigPrompterOptions = {
    client: ExtendedClient<true>;
    // config: Partial<Configuration>;
    getConfig: () => Partial<Configuration>
};

export class ConfigPrompter extends BasePrompter {
    private client: ExtendedClient<true>;
    private getConfig: () => Partial<Configuration>;

    public static instance: ConfigPrompter;

    private audioRegex = /\.(mp3|wav|ogg|flac|aac|wma)$/;
    private webhookRegex = /https:\/\/discord.com\/api\/webhooks\/\d{17,19}\/[a-zA-Z0-9_-]{60,68}/;

    constructor({ client, getConfig }: ConfigPrompterOptions) {
        super();
        this.client = client;
        this.getConfig = getConfig;
    }

    private get config(): Partial<Configuration> {
        return this.getConfig();
    }

    public listAccounts = (accounts: { username: string, id: string }[]): Promise<"qr" | "token" | string> =>
        this.ask(select<"qr" | "token" | string>, {
            message: "Select an account: ",
            choices: [
                ...accounts.map(account => ({
                    name: account.username,
                    value: account.id
                })),
                new Separator(),
                { name: "Login with a new token", value: "token" },
                { name: "Login with QR code", value: "qr" },
            ]
        });

    public getToken = () =>
        this.ask(input, {
            message: "Enter your Discord token:",
            validate: (input) => input.split(".").length === 3 || "Invalid token format",
        })

    public listActions = (hasCache: boolean): Promise<"run" | "edit" | "export" | "delete"> =>
        this.ask(select<"run" | "edit" | "export" | "delete">, {
            message: "Select an action: ",
            choices: [
                {
                    name: "Run",
                    value: "run",
                    disabled: !hasCache && "No existing config found"
                },
                {
                    name: "Edit Config",
                    value: "edit"
                },
                {
                    name: "Export Config",
                    value: "export",
                    disabled: !hasCache && "No existing config found"
                },
                {
                    name: "Delete Config",
                    value: "delete",
                    disabled: !hasCache && "No existing config found"
                },
            ],
        });

    // --- Core Config Prompts ---
    public listGuilds = (guilds: Collection<string, Guild>, cache?: string): Promise<Guild> =>
        this.ask(select<Guild>, {
            message: "Select a guild to farm in: ",
            choices: guilds.map((g) => ({ name: g.name, value: g, })),
            default: cache ? guilds.get(cache) : undefined,
        });

    public listChannels = (guild: Guild, cache: string[] = []) =>
        this.ask(checkbox<string>, {
            message: "Select channels to farm in (spacebar to select): ",
            choices: guild.channels.cache
                .filter((c) => c.isText() && c.permissionsFor(guild.client.user!)?.has("SEND_MESSAGES"))
                .map((c) => ({ name: c.name, value: c.id, checked: cache.includes(c.id) })),
            validate: (choices) => choices.length > 0 || "You must select at least one channel.",
        });

    public getWayNotify = (cache?: string[]): Promise<Configuration["wayNotify"]> =>
        this.ask(checkbox<Configuration["wayNotify"][number]>, {
            message: "Select ways to send notifications (eg. when captcha is detected): ",
            choices: [
                {
                    name: "Webhook",
                    value: "webhook",
                    checked: cache?.includes("webhook"),
                },
                {
                    name: "Direct Message (Friends Only)",
                    value: "dms",
                    checked: cache?.includes("dms"),
                },
                {
                    name: "Call (Friends Only)",
                    value: "call",
                    checked: cache?.includes("call"),
                },
                {
                    name: "Music",
                    value: "music",
                    checked: cache?.includes("music"),
                },
                {
                    name: "[BETA] Popup Notification",
                    value: "popup",
                    checked: cache?.includes("popup"),
                },
            ],
        }, "Select how you want to receive notifications. You can select multiple options. Note that 'Call' and 'DMs' require the user to be a friend of the selfbot.");

    public getWebhookURL = (cache?: string) =>
        this.ask(input, {
            message: "Enter your Discord webhook URL: ",
            default: cache,
            validate: async (url) => {
                if (!this.webhookRegex.test(url)) {
                    return "Invalid webhook URL format.";
                }
                try {
                    await axios.get(url);
                    return true;
                } catch {
                    return "Webhook URL is not accessible.";
                }
            },
        });

    public getAdminID = (guild: Guild, cache?: string) => {
        const required = this.config.wayNotify?.some(w => (<Configuration["wayNotify"]>["call", "dms"]).includes(w))
            || this.config.autoCookie
            || this.config.autoClover;

        return this.ask(input, {
            message: "Enter user ID you want to:\n"
                + " + Use Selfbot commands (if prefix is set)\n"
                + " + Receive Cookie (if autoCookie is enabled)\n"
                + " + Receive Clover (if autoClover is enabled)\n"
                + " + Receive Notifications on captcha detected\n"
                + "Enter user ID" + (required === true ? ", empty to skip" : "") + ": ",
            default: cache,
            validate: async (id) => {
                if (!id && !required) return true;
                if (!/^\d{17,19}$/.test(id)) return "Invalid user ID format.";
                if (!required) return true;
                if (id === this.client.user.id) return "You cannot set yourself for receiving Cookie/Clover/Notifications (DMs/Call).";
                // if (!this.config.wayNotify?.some(w => (<Configuration["wayNotify"]>["call", "dms"]).includes(w))) {
                if (
                    !this.config.autoClover 
                    && !this.config.autoCookie
                    && !this.config.wayNotify?.some(w => (<Configuration["wayNotify"]>["call", "dms"]).includes(w))
                ) {
                    return guild.members.cache.has(id) || "User is not a member of the selected guild.";
                }

                const user = await this.client.users.fetch(id).catch(() => null);
                if (!user) return "User not found.";

                switch (user.relationship.toString()) {
                    case "NONE":
                        try {
                            await user.sendFriendRequest();
                            return "Friend request sent. Please accept Selfbot's friend request to continue.";
                        } catch (error) {
                            return "Failed to send friend request. Please do it manually or check your privacy settings and try again.";
                        }
                    case "FRIEND":
                        return true;
                    case "PENDING_INCOMING":
                        return await user.sendFriendRequest().catch(() => "Failed to accept friend request. Please do it manually.");
                    case "PENDING_OUTGOING":
                        return "Please accept Selfbot's friend request to continue.";
                    default:
                        return "Either you or the user has blocked the other. Please unblock to continue.";
                }
            },
        });
    }

    public getMusicPath = (cache?: string) =>
        this.ask(input, {
            message: "Enter the full path to your sound file (e.g., C:\\sounds\\alert.mp3): ",
            default: cache,
            validate: (p) => {
                if (!fs.existsSync(p)) {
                    return "File does not exist.";
                }
                return this.audioRegex.test(path.extname(p)) ? true : "Invalid file format. Supported formats: mp3, wav, ogg, flac, aac, wma";
            },
        });

    public getCaptchaAPI = (cache?: string) =>
        this.ask(select<Configuration["captchaAPI"]>, {
            message: "Select a captcha solving provider (Selfbot will try 2 times): ",
            choices: [
                {
                    name: "Skip",
                    value: undefined
                },
                {
                    name: `2Captcha [${chalk.underline("https://2captcha.com")}]`,
                    value: "2captcha"
                },
                {
                    name: `YesCaptcha [${chalk.underline("https://yescaptcha.com")}]`,
                    value: "yescaptcha",
                },
                {
                    name: "Our ADOTF's API (coming soon)",
                    description: "ADOTF: Advanced Discord Owo Tool Farm, currently only supports Huntbot captchas",
                    value: undefined,
                    disabled: "This feature is not implemented yet."
                }
            ],
            default: cache
        });

    public getCaptchaAPIKey = (cache?: string) =>
        this.ask(input, {
            message: "Enter your API key for the captcha solving service: ",
            required: true,
            default: cache,
        });

    public getPrefix = (cache?: string) =>
        this.ask(input, {
            message: "Enter your selfbot command Prefix, Empty to skip: ",
            validate: (answer: string) => {
                if (!answer) return true;
                return /^[^0-9\s]{1,5}$/.test(answer) ? true : "Invalid Prefix"
            },
            default: cache
        });

    public getGemUsage = (cache?: number) =>
        this.ask(select<Configuration["autoGem"]>, {
            message: "Select how you want to use gems: ",
            choices: [
                {
                    name: "Skip (Do not use gems)",
                    value: 0
                },
                {
                    name: "Fabled -> Common",
                    value: 1
                },
                {
                    name: "Common -> Fabled",
                    value: -1
                }
            ],
            default: cache
        });

    public getGemTier = (cache?: Configuration["gemTier"]) =>
        this.ask(checkbox<Exclude<Configuration["gemTier"], undefined>[number]>, {
            validate: choices => choices.length > 0 || "You must select at least one gem tier.",
            message: "Select gem tiers to use (spacebar to select): ",
            choices: [
                {
                    name: "Common",
                    value: "common",
                    checked: cache?.includes("common")
                },
                {
                    name: "Uncommon",
                    value: "uncommon",
                    checked: cache?.includes("uncommon")
                },
                {
                    name: "Rare",
                    value: "rare",
                    checked: cache?.includes("rare")
                },
                {
                    name: "Epic",
                    value: "epic",
                    checked: cache?.includes("epic")
                },
                {
                    name: "Mythical",
                    value: "mythical",
                    checked: cache?.includes("mythical")
                },
                {
                    name: "Legendary",
                    value: "legendary",
                    checked: cache?.includes("legendary")
                },
                {
                    name: "Fabled",
                    value: "fabled",
                    checked: cache?.includes("fabled")
                },
            ],
        });

    public getTrait = (cache?: Configuration["autoTrait"]) =>
        this.ask(select<Configuration["autoTrait"]>, {
            message: "Select a trait to use: ",
            choices: [
                {
                    name: "Efficiency",
                    value: "efficiency",
                },
                {
                    name: "Duration",
                    value: "duration",
                },
                {
                    name: "Cost",
                    value: "cost",
                },
                {
                    name: "Gain",
                    value: "gain",
                },
                {
                    name: "Experience",
                    value: "experience",
                },
                {
                    name: "Radar",
                    value: "radar",
                }
            ],
            default: cache,
        });

    public getHuntbotSolver = (cache?: boolean) => 
        this.ask(select<boolean>, {
            message: "Select Huntbot solver: ",
            choices: [
                {
                    name: "Provided Captcha API: " + (this.config.captchaAPI || "None"),
                    value: false,
                    disabled: !this.config.captchaAPI && "You did not set a captcha API provider",
                    checked: cache === false
                },
                {
                    name: "Our ADOTF's API (currently free and supports Huntbot captchas)",
                    value: true,
                    checked: cache === true
                }
            ],
            
        });

    public getPrayCurse = (cache?: Configuration["autoPray"]) =>
        this.ask(checkbox<Configuration["autoPray"][number]>, {
            message: "Select which pray/curses you want to auto use (spacebar to select): ",
            choices: [
                {
                    name: "Pray selfbot account",
                    value: `pray`,
                    checked: cache?.includes("pray")
                },
                {
                    name: "Curse selfbot account",
                    value: `curse`,
                    checked: cache?.includes("curse")
                },
                ...(this.config.adminID ? [
                    {
                        name: "Pray notification reception",
                        value: `pray ${this.config.adminID}`,
                        checked: cache?.includes(`pray ${this.config.adminID}`)
                    },
                    {
                        name: "Curse notification reception",
                        value: `curse ${this.config.adminID}`,
                        checked: cache?.includes(`curse ${this.config.adminID}`)
                    }
                ] : [])
            ]
        });

    public getQuoteAction = (cache?: string[]) =>
        this.ask(checkbox<Configuration["autoQuote"][number]>, {
            message: "Select which quote action you want to auto use (spacebar to select): ",
            choices: [
                {
                    name: "OwO",
                    value: "owo",
                    checked: cache?.includes("owo")
                },
                {
                    name: "Quote",
                    value: "quote",
                    checked: cache?.includes("quote")
                }
            ]
        })

    public getRPPAction = (cache?: string[]) =>
        this.ask(checkbox<Configuration["autoRPP"][number]>, {
            message: "Select which Run/Pup/Piku action you want to auto use (spacebar to select): ",
            choices: [
                {
                    name: "Run",
                    value: "run",
                    checked: cache?.includes("run")
                },
                {
                    name: "Pup",
                    value: "pup",
                    checked: cache?.includes("pup")
                },
                {
                    name: "Piku",
                    value: "piku",
                    checked: cache?.includes("piku")
                }
            ]
        });
}