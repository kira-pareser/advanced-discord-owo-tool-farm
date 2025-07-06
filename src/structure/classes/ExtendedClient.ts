import { logger } from "@/utils/logger.js";
import { ranInt } from "@/utils/math.js";
import { Client, ClientOptions, TextBasedChannel } from "discord.js-selfbot-v13";

interface SendOptions {
    channel: TextBasedChannel
    prefix?: string
    typing?: number
}

export class ExtendedClient<Ready extends boolean = boolean> extends Client<Ready> {
    constructor(options: ClientOptions = {}) {
        super(options);
    }

    public registerEvents = () => {
        this.on("debug", logger.debug);
        this.on("warn", logger.warn);
        this.on("error", logger.error);
    }

    public sendMessage = async (message: string, { channel, prefix, typing = ranInt(500, 1000) }: SendOptions) => {
        await channel.sendTyping()
        await this.sleep(typing);

        return channel.send(`${prefix || ""} ${message}`);
    }

    public checkAccount = (token?: string) => {
        return new Promise<Client<true>>((resolve, reject) => {
            this.once("ready", resolve);

            try {
                if(token) {
                    logger.info("Checking account...");
                    this.login(token)
                } else {
                    this.QRLogin()
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}