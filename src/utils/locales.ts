import lodash from "lodash"

import locales from "@/locales/index.js"
import { Path } from "@/typings/path-value.js";
import { format } from "node:util";
import { logger } from "./logger.js";

export const translate = (locale: Locale) => {
    let data = locales[locale];
    if(!data) {
        logger.warn(`Locale "${locale}" not found, falling back to "en"`);
        process.env.LOCALE = "en"; // Set the environment variable to English if the locale is not found
        data = locales.en; // Fallback to English if the locale is not found
    }

    return (path: I18nPath, ...args: unknown[]) => {
        return format(lodash.get(data, path), ...args);
    }
}

export const i18n = (locale: Locale = "en") => {
    return {
        t: translate(locale),
        locale,
    }
}

export type I18nPath = Path<typeof locales[keyof typeof locales]>;
export type Translationfn = ReturnType<typeof translate>;
export type Locale = keyof typeof locales
