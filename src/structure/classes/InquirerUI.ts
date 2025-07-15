import { Configuration } from "@/schemas/ConfigSchema.js";
import { ConfigPrompter } from "../core/ConfigPrompter.js";
import { ExtendedClient } from "./ExtendedClient.js";
import { ConfigManager } from "../core/ConfigManager.js";
import { logger } from "@/utils/logger.js";
import path from "node:path";
import fs from "node:fs";

export class InquirerUI {
    private static client: ExtendedClient<true>;
    private static config: Partial<Configuration> = {};
    private static configManager = new ConfigManager();
    private static configPrompter: ConfigPrompter;

    static editConfig = async () => {
        if (!this.client || !this.client.isReady()) {
            throw new Error("Client is not ready. Please initialize the client before editing the config.");
        }

        this.config.username = this.client.user.username;
        this.config.token = this.client.token;

        const guildCache = this.client.guilds.cache;
        const guild = await this.configPrompter.listGuilds(guildCache, this.config.guildID);
        this.config.guildID = guild.id;
        this.config.channelID = await this.configPrompter.listChannels(guild, this.config.channelID);

        this.config.wayNotify = await this.configPrompter.getWayNotify(this.config.wayNotify);
        if (this.config.wayNotify.includes("webhook")) {
            this.config.webhookURL = await this.configPrompter.getWebhookURL(this.config.webhookURL);
        }
        if (this.config.wayNotify.some(w => (<Configuration["wayNotify"]>["webhook", "call", "dms"]).includes(w))) {
            this.config.adminID = await this.configPrompter.getAdminID(guild, this.config.adminID);
        }
        if (this.config.wayNotify.includes("music")) {
            this.config.musicPath = await this.configPrompter.getMusicPath(this.config.musicPath);
        }

        this.config.captchaAPI = await this.configPrompter.getCaptchaAPI(this.config.captchaAPI);
        if (this.config.captchaAPI) {
            this.config.apiKey = await this.configPrompter.getCaptchaAPIKey(this.config.apiKey);
        }

        this.config.prefix = await this.configPrompter.getPrefix(this.config.prefix);

        this.config.autoGem = await this.configPrompter.getGemUsage(this.config.autoGem);
        if (this.config.autoGem) {
            this.config.gemTier = await this.configPrompter.getGemTier(this.config.gemTier);
            this.config.autoLootbox = await this.configPrompter.trueFalse(
                "Toggle Automatically Use Lootbox",
                this.config.autoLootbox
            );
            this.config.autoFabledLootbox = await this.configPrompter.trueFalse(
                "Toggle Automatically Use Fabled Lootbox",
                this.config.autoFabledLootbox
            );
        }

        this.config.autoHuntbot = await this.configPrompter.trueFalse(
            "Toggle Automatically Send/Receive Huntbot",
            this.config.autoHuntbot
        );

        if (this.config.autoHuntbot) {
            this.config.autoTrait = await this.configPrompter.getTrait(this.config.autoTrait);
            this.config.useAdotfAPI = await this.configPrompter.getHuntbotSolver(this.config.useAdotfAPI);
        }

        this.config.autoCookie = await this.configPrompter.trueFalse(
            "Toggle Automatically Send Cookie",
            this.config.autoCookie
        );
        this.config.autoClover = await this.configPrompter.trueFalse(
            "Toggle Automatically Send Clover",
            this.config.autoClover
        );
        if (
            (this.config.autoCookie || this.config.autoClover)
            && !this.config.adminID
        ) {
            this.config.adminID = await this.configPrompter.getAdminID(guild, this.config.adminID);
        }

        this.config.autoPray = await this.configPrompter.getPrayCurse(this.config.autoPray);
        this.config.autoQuote = await this.configPrompter.getQuoteAction(this.config.autoQuote);
        this.config.autoRPP = await this.configPrompter.getRPPAction(this.config.autoRPP);

        this.config.autoDaily = await this.configPrompter.trueFalse(
            "Toggle automatically claim daily rewards",
            this.config.autoDaily
        );
        this.config.autoSleep = await this.configPrompter.trueFalse(
            "Toggle automatically pause randomly to avoid captcha",
            this.config.autoSleep
        );
        this.config.autoReload = await this.configPrompter.trueFalse(
            "Toggle automatically reload config daily",
            this.config.autoReload
        );
        this.config.autoSell = await this.configPrompter.trueFalse(
            "Toggle automatically sell animals once cash ran out",
            this.config.autoSell
        );
        this.config.showRPC = await this.configPrompter.trueFalse(
            "Toggle showing Discord Rich Presence",
            this.config.showRPC
        );
        this.config.autoResume = await this.configPrompter.trueFalse(
            "Toggle automatically resume after the captcha is solved",
            this.config.autoResume
        );
    }

    static prompt = async (client: ExtendedClient<true>) => {
        this.client = client;
        this.configPrompter = new ConfigPrompter({ client, config: this.config });

        const accountList = this.configManager.getAllKeys().map(key => ({
            username: this.configManager.get(key)?.username || "Unknown",
            id: key
        }));

        let accountSelection = await this.configPrompter.listAccounts(accountList);
        switch (accountSelection) {
            case "qr":
                break;
            case "token":
                const token = await this.configPrompter.getToken();
                accountSelection = Buffer.from(token.split(".")[0], "base64").toString("utf-8");
                this.config.token = token;
            default:
                const existingConfig = this.configManager.get(accountSelection);
                if (existingConfig) this.config = existingConfig;
        }

        try {
            logger.info("Checking account...");
            await client.checkAccount(this.config.token);
        } catch (error) {
            logger.error(error as Error);
            logger.error("Invalid token or QR code. Please try again.");
            process.exit(-1);
        }

        if (!this.config || Object.keys(this.config).length <= 5) await this.editConfig();
        else switch (await this.configPrompter.listActions(Object.keys(this.config).length > 1)) {
            case "run":
                break;
            case "edit":
                await this.editConfig();
                break;
            case "export":
                const exportPath = path.join(process.cwd(), `${this.config.username || "unknown"}.json`);
                fs.writeFileSync(exportPath, JSON.stringify(this.config, null, 2));
                logger.info(`Configuration exported to: ${exportPath}`);
                process.exit(0);
            case "delete":
                const confirm = await this.configPrompter.trueFalse(
                    `Are you sure you want to delete the configuration for ${this.config.username}?`,
                    false
                );
                if (confirm) {
                    this.configManager.delete(accountSelection);
                    logger.info(`Configuration for ${this.config.username} deleted.`);
                    process.exit(0);
                } else {
                    logger.info("Deletion cancelled.");
                    process.exit(0);
                }
        }

        this.configManager.set(client.user.id, this.config as Configuration);
        return {
            client: this.client,
            config: this.config as Configuration,
        }
    }
}