import { BlessedLogger } from "./blessed.js";
import { LegacyLogger } from "./legacy.js";

export const blessedLogger = BlessedLogger.getInstance.bind(BlessedLogger);
export const legacyLogger = LegacyLogger.getInstance.bind(LegacyLogger);
