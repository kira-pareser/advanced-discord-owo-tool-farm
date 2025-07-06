import { z } from "zod/v4";
import type { Configuration } from "../typings/Configuration.js";

const ConfigSchema = z.object({
    username: z.string().optional(),
    token: z.string().refine(value => value.split(".").length === 3, {
        error: "Token must have three parts separated by dots"
    }),
    guildID: z.string().optional(),
    channelID: z.array(z.string()).min(1, {
        error: "At least one channel ID is required"
    }),
    wayNotify: z.array(z.enum(["webhook", "dms", "call", "music", "popup"])),
    webhookURL: z.url().optional(),
    adminID: z.string().optional(),
    musicPath: z.string().optional(),
    whenNotify: z.enum(["both", "failed", "success"]),
    prefix: z.string().optional(),
    captchaAPI: z.literal("2captcha").optional(),
    apiKey: z.string().optional(),
    autoHuntbot: z.boolean(),
    autoTrait: z.enum(["efficiency", "duration", "cost", "gain", "experience", "radar"]).optional(),
    useAdosAPI: z.boolean().optional(),
    autoPray: z.array(z.string()),
    autoGem: z.union([z.literal(0), z.literal(-1), z.literal(1)]),
    autoCrate: z.boolean().optional(),
    autoFabledCrate: z.boolean().optional(),
    autoQuote: z.array(z.enum(["owo", "quote"])),
    autoDaily: z.boolean(),
    autoCookie: z.boolean(),
    autoClover: z.boolean(),
    autoSell: z.boolean()
})

export const validateConfig = (obj: unknown): z.infer<typeof ConfigSchema> => ConfigSchema.parse(obj);