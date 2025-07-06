import path from "path";

import { Collection } from "discord.js-selfbot-v13";

import { Configuration } from "@/typings/Configuration.js";
import { ExtendedClient } from "./ExtendedClient.js";
import { CommandProps, FeatureProps } from "@/typings/index.js";
import { CooldownManager } from "../core/CooldownManager.js";


export class BaseAgent {
    public rootDir = path.join(process.cwd(), "src");
    
    public commands = new Collection<string, CommandProps>(); // no it doesnt work like that
    public CooldownManager = new CooldownManager();
    public features = new Collection<string, FeatureProps>();
    prefix: string = "owo"; 
    

    constructor(
        private client: ExtendedClient<true>,
        private config: Configuration,

    ) { }

}