import { BaseAgent } from "@/structure/classes/BaseAgent.ts";
import { ExtendedClient } from "@/structure/classes/ExtendedClient.ts";
import type { I18nPath, Locale, Translationfn } from "@/utils/locales.ts";
import type { Client, ClientEvents, Message, PermissionResolvable } from "discord.js-selfbot-v13";
import { Configuration } from "./Configuration.ts";

export type MaybePromise<T> = T | Promise<T>;

export type ParameterType = string | GuildMember | User | Channel | Role;


type EventOptions<T extends keyof ClientEvents = keyof ClientEvents> = {
    name: string;
    event: T;
    once?: boolean;
    disabled?: boolean;
    handler: (params: BaseParams, ...args: ClientEvents[T]) => MaybePromise<unknown>;
}

interface BaseParams {
    agent: BaseAgent;
    client: ExtendedClient<true>;
    config: Configuration;

    t: Translationfn;
    locale: Locale;
}

export interface CommandParams extends BaseParams {
    message: Message
    args: Array<string | undefined>;
    params: { [key: string]: string | undefined };

}

type CommandOptions<InGuild extends boolean = boolean> = {
    cooldown?: number;
    permissions?: PermissionResolvable;
    guildOnly?: InGuild;
}

export interface CommandProps {
    name: string;
    description: I18nPath;
    aliases?: string[];
    usage?: string;
    
    options?: CommandOptions;
    params?: Map<string, any>;
    subCommandAliases?: Map<string, string>;
    execute: (args: CommandParams) => MaybePromise<unknown>;
}

interface HandlerParams extends BaseParams {}

type HandlerProps = {
    run: (args: HandlerParams) => MaybePromise<unknown>;
}

interface FeatureFnParams extends BaseParams {
    channel: GuildTextBasedChannel;
    // cooldown: Cooldown
}

type BaseFeatureOptions = {
    overrideCooldown?: boolean;
    cooldownOnError?: number;
}
export interface FeatureProps {
    name: string;
    options?: BaseFeatureOptions;
    cooldown: () => number;
    condition: (args: FeatureFnParams) => MaybePromise<boolean>;
    permissions?: PermissionResolvable;
    run: (args: FeatureFnParams) => MaybePromise<unknown>;
}
