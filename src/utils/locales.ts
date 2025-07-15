import { get } from "lodash"

import locales from "@/locales/index.js"
import { Path } from "@/typings/path-value.js";
import { format } from "node:util";

export const translate = (locale: Locale) => {
    const data = locales[locale];

    return (path: I18nPath, ...args: unknown[]) => {
        return format(get(data, path), ...args);
    }
}

export const i18n = (locale: Locale) => {
    return {
        t: translate(locale),
        locale,
    }
}

export type I18nPath = Path<typeof locales[keyof typeof locales]>;
export type Translationfn = ReturnType<typeof translate>;
export type Locale = keyof typeof locales
