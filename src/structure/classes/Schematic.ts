import { Configuration } from "@/typings/Configuration.js";
import { BaseParams, CommandProps, EventOptions, FeatureProps, HandlerProps, MaybePromise } from "@/typings/index.js";
import { ClientEvents, GuildTextBasedChannel, PermissionResolvable } from "discord.js-selfbot-v13";
import { ExtendedClient } from "./ExtendedClient.js";
import { Cooldown } from "../core/CooldownManager.js";
import { BaseAgent } from "./BaseAgent.js";

export class Schematic {
    static registerEvent = <T extends keyof ClientEvents>(args: EventOptions<T>): EventOptions<T> => {
        return args;
    }

    static registerCommand = (args: CommandProps) => {
        return args;
    }

    static registerFeature = (args: FeatureProps): FeatureProps => {
        return args;
    }

    static registerHandler = (args: HandlerProps) => {
        return args;
    }
}
