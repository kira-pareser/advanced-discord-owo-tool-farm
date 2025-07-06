import { Client, ClientOptions, TextBasedChannel, TextChannel, VoiceChannel } from "discord.js-selfbot-v13"

interface SendOptions {
    channel: TextBasedChannel
    prefix?: string
    typing: number
}

export class BaseAgent<Ready extends boolean = boolean> extends Client<Ready> {
    // activeChannel!: TextChannel | VoiceChannel
    // listChannelID: string[] = []
    
    constructor(options: ClientOptions) {
        super(options);

        this.registerEvents();
    }

    private registerEvents = () => {
        this.once("initialize", () => {
            if(!this.isReady()) throw new Error("Initialization is called before the client is ready.");
            global.logger.logInfo(`Logged in as ${this.user?.username}!`);
        })
    }

    public sendMessage = async (message: string, { channel, prefix, typing }: SendOptions) => {
        await channel.sendTyping()
        await this.sleep(typing);

        return channel.send(`${prefix || ""} ${message}`);
    }

    public checkAccount = (token?: string) => {
        return new Promise<string>((resolve, reject) => {
            this.once("ready", () => this.user ? resolve(this.user.id) : reject(new Error("User is not logged in.")));

            try {
                if(token) {
                    logger.logInfo("Checking account...");
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