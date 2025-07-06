import type { Locale } from "@/utils/locales.ts";


declare module globalThis {
    var logger
}

declare global {
    interface ProcessEnv {
        readonly NODE_ENV: "development" | "production";
        LOCALE: Locale;
    }
}