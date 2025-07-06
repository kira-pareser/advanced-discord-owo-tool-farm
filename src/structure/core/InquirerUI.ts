import fs from "node:fs";
import path from "node:path";

import { ConfigManager } from "./ConfigManager.js";
import { Configuration } from "../../typings/Configuration.js";
import { BaseAgent } from "./OldBaseAgent.js";

import { input, select, checkbox, Separator, confirm } from "@inquirer/prompts";
import { Guild } from "discord.js-selfbot-v13";
import axios from "axios";

export class InquirerUI {
    private configManager = new ConfigManager();
    private agent: BaseAgent = new BaseAgent<true>({});

    private config = {} as Configuration;
    private cache?: Configuration;

    constructor() { }

    private listAccounts = (IDs?: string[]) => {
        console.clear()
        return select<"token" | "qr" | string>({
            message: "Select an account: ",
            choices: [
                ...IDs?.map((id) => ({
                    name: id,
                    value: id,
                })) || [],
                new Separator(),
                { name: "Login with token", value: "token" },
                { name: "Login with QR code", value: "qr" },
            ],
            loop: false,
            pageSize: 10,
        });
    };

    private getToken = async () => {
        console.clear()
        return input({
            message: "Enter your token: ",
            validate: (value) =>
                value.split(".").length === 3 || "Invalid token format",
        });
    };

    private listActions = (cache?: Configuration) => {
        console.clear()
        return select<"run" | "edit" | "export" | "delete">({
            message: "Select an action: ",
            choices: [
                {
                    name: "Run",
                    value: "run",
                    disabled: cache ? false : "No existing config found",
                },
                {
                    name: "Edit config",
                    value: "edit",
                },
                {
                    name: "Export config into auto-run file",
                    value: "export",
                    disabled: cache ? false : "No existing config found",
                },
                {
                    name: "Delete account",
                    value: "delete",
                    disabled: cache ? false : "No existing config found",
                },
            ],
        });
    };

    private listGuild = (cache?: string) => {
        console.clear()
        const guilds = this.agent.guilds.cache;

        return select<Guild>({
            message: "Select a guild to farm: ",
            choices: [
                ...guilds.map((guild) => ({
                    name: guild.name,
                    value: guild,
                })),
            ],
            default: cache ? guilds.get(cache) : undefined,
        });
    };

    private listChannel = (guild: Guild, cache: string[] = []) => {
        console.clear();
        return checkbox<string>({
            required: true,
            message:
                "Select channels to farm (Randomly if multiple channels are selected): ",
            choices: [
                ...guild.channels.cache
                    .filter((c) =>
                        ["GUILD_TEXT", "GUILD_VOICE"].includes(c.type)
                        && c.permissionsFor(guild.client.user!)?.has("SEND_MESSAGES")
                        && c.permissionsFor(guild.client.user!)?.has("VIEW_CHANNEL")
                    )
                    .map((channel) => ({
                        name: (channel.type == "GUILD_VOICE" ? "🔉 " : "📜 ") + channel.name,
                        value: channel.id,
                        checked: cache.includes(channel.id),
                        description: "This is a " + (channel.type == "GUILD_VOICE" ? "voice channel" : "text channel"),
                    })), // you lagging?
            ],
        });
    };

    private wayNotify = (cache?: Configuration["wayNotify"]) => {
        console.clear();
        return checkbox<Configuration["wayNotify"][number]>({
            message: "Select how you want to be notified when selfbot receives a captcha: ",
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
                    name: "[BETA] Popup Notification",
                    value: "popup",
                    checked: cache?.includes("popup"),
                },
                {
                    name: "Music",
                    value: "music",
                    checked: cache?.includes("music"),
                },
            ],
        });
    }

    private musicNotify = async (cache?: string) => {
        console.clear()
        return input({
            message: "Enter your music file path: ",
            validate: (path) => {
                if (!fs.existsSync(path)) return "File does not exist or unreadable"
                return /\.(mp3|wav|ogg|flac|aac|wma)$/i.test(path) ? true : "Invalid music file"
            },
            default: cache || path.resolve()
        })
    };

    private webhookURL = (cache?: string) => {
        console.clear()
        const webhookURLRegex = /^https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/(\d{17,19})\/([\w-]+)$/;

        return input({
            message: "Enter your webhook URL: ",
            validate: async (url) => {
                if (!webhookURLRegex.test(url)) return "Invalid webhook URL format";
                const res = await axios.get(url).catch(null);
                if (!res || ![200, 401].includes(res.status)) return "Webhook URL is not valid or not accessible";
                return true;
            },
            default: cache
        })
    }

    private getAdminID = (cache?: string) => {
        console.clear()

        const criticalWayNotify = (<Configuration["wayNotify"]>["call", "dms"])
            .some(w => this.cache?.wayNotify.includes(w))

        const message = "Enter user ID you want to " + (
            //(<Configuration["wayNotify"]>["webhook", ...criticalWayNotify]).some(w => this.config.wayNotify.includes(w)) 
            this.cache?.autoCookie ? "send Cookie"
                : this.cache?.autoClover ? "send Clover"
                    : "be notified via Webhook/Call/DMs"
        ) + ": "

        return input({
            required: criticalWayNotify || this.cache?.autoCookie,
            message,
            validate: async (id) => {
                if (!/^\d{17,19}$/.test(id)) return "Invalid User ID"
                if (criticalWayNotify) {
                    if (id == this.agent.user?.id) return "Selfbot ID is not valid for Call/DMs option"
                    const user = await this.agent.users.fetch(id).catch(() => null)
                    if (!user) return "User not found"
                    switch (user.relationship.toString()) {
                        case "FRIEND":
                            return true
                        case "PENDING_INCOMING":
                            return await user.sendFriendRequest().catch(() => "Failed to send friend request")
                        case "PENDING_OUTGOING":
                            return "Please accept selfbot's friend request!"
                        default:
                            try {
                                await user.sendFriendRequest()
                                return "Please accept selfbot's friend request!"
                            } catch (error) {
                                return "Unable to send friend request to user!"
                            }
                    }
                }
                return true
            },
            default: cache
        })
    }

    private whenNotify = (cache?: Configuration["whenNotify"]) => {
        console.clear()
        return select<Configuration["whenNotify"]>({
            message: "Select when you want to be notified: ",
            choices: [
                {
                    name: "Both",
                    value: "both" as Configuration["whenNotify"]
                },
                {
                    name: "Only on failed captcha solving",
                    value: "failed" as Configuration["whenNotify"]
                },
                {
                    name: "Only on successful captcha solving",
                    value: "success" as Configuration["whenNotify"]
                }
            ],
            default: cache
        });
    }

    private captchaAPI = (cache?: string) => {
        console.clear()
        return select<Configuration["captchaAPI"]>({
            message: "Select a captcha solving service (Selfbot will try once): ",
            choices: [
                {
                    name: "Skip",
                    value: undefined
                },
                {
                    name: "2Captcha",
                    value: "2captcha" as Configuration["captchaAPI"]
                },
                // {
                //     name: "AntiCaptcha",
                //     value: "anticaptcha" as Configuration["captchaAPI"],
                //     disabled: true
                // }
            ],
            default: cache
        })
    }

    private getAPIKey = (cache?: string) => {
        console.clear()
        return input({
            required: true,
            message: "Enter your API key: ",
            default: cache
        })
    }

    private getPrefix = (cache?: string) => {
        console.clear()
        return input({
            message: "Enter your Selfbot Prefix, Empty to skip: ",
            validate: (answer: string) => {
                if (!answer) return true;
                return /^[^0-9\s]{1,5}$/.test(answer) ? true : "Invalid Prefix"
            },
            default: cache
        })
    }

    private gemUsage = (cache?: Configuration["autoGem"]) => {
        console.clear()
        return select<Configuration["autoGem"]>({
            message: "Select gem usage: ",
            choices: [
                {
                    name: "Skip",
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
        })
    }

    private prayCurse = (cache?: string[]) => {
        console.clear();
        return checkbox<string>({
            message: "Select to pray/curse (randomly if multiple), Empty to skip: ",
            choices: [
                { name: "Pray selfbot account", value: `pray` },
                { name: "Curse selfbot account", value: `curse` },
                ...(this.cache?.adminID ? [
                    { name: "Pray notification reception", value: `pray ${this.cache.adminID}` },
                    { name: "Curse notification reception", value: `curse ${this.cache.adminID}` }
                ] : [])
            ].map(c => ({ ...c, checked: cache?.includes(c.value) })),
        });
    }

    private quoteAction = (cache?: Configuration["autoQuote"]) => {
        console.clear()
        return checkbox<Configuration["autoQuote"][number]>({
            message: "Select quote action: ",
            choices: [
                {
                    name: "OwO",
                    value: "owo" as Configuration["autoQuote"][number]
                },
                {
                    name: "Quote",
                    value: "quote" as Configuration["autoQuote"][number]
                },
            ].map(c => ({ ...c, checked: cache?.includes(c.value) })),
        });
    }

    private otherAction = (cache?: Configuration["autoOther"]) => {
        console.clear()
        return checkbox<Configuration["autoOther"][number]>({
            message: "Select additional command action: ",
            choices: [
                {
                    name: "Run",
                    value: "run" as Configuration["autoOther"][number]
                },
                {
                    name: "Pup",
                    value: "pup" as Configuration["autoOther"][number]
                },
                {
                    name: "Piku",
                    value: "piku" as Configuration["autoOther"][number]
                },
            ].map(c => ({ ...c, checked: cache?.includes(c.value) })),
        });
    }

    private trueFalse = (message: string, cache?: boolean) => {
        console.clear();
        return confirm({
            message: message + ": ",
            default: cache
        });
    }

    public editConfig = async () => {
        this.cache.token = this.agent.token
    }

    public main = async () => {
        if (this.configManager.getAllKeys().length === 0) {
            console.clear();

            const confirm = await this.trueFalse(
                "Copyright 2021-2025 © Eternity_VN [Kyou Izumi] x aiko-chan-ai [Elysia]. All rights reserved."
                + "\nMade by Vietnamese, From Github with ❤️"
                + "\nBy using this module, you agree to our Terms of Use and accept any associated risks."
                + "\nPlease note that we do not take any responsibility for accounts being banned due to the use of our tools."
                + "\nDo you want to continue?", false
            )
            if (!confirm) process.exit(0);
        }

        let tokenTemp: string | undefined, idTemp: string;

        try {
            switch (idTemp = await this.listAccounts(this.configManager.getAllKeys())) {
                case "token":
                    tokenTemp = await this.getToken();
                case "qr":
                    idTemp = await this.agent.checkAccount(tokenTemp)
                default:
                    this.cache = this.configManager.get(idTemp)
                    break;
            }
        } catch (error) {
            console.error(error);
            console.log("Failed to login, please try again.");
            process.exit(-1);
        }

        if(!this.cache) await editConfig()
    };
}
