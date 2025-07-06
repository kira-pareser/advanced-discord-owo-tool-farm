import chalk from "chalk";
import debug from "debug";

import pkg from "#/package.json" with { type: "json" };

export type LegacyLoggerCallback = typeof console.log | typeof console.error | typeof console.warn | typeof console.info;

export class LegacyLogger {
    static create = (name: string, callback = console.log) => {
        const log = debug(`${pkg.name}@${pkg.version}:${name}`);
        const customLog = (...args: any[]) => {
            const time = new Date().toLocaleString();

            callback(
                chalk.bgYellowBright(time),
                ...args
            )
        }

        log.log = customLog.bind(console);
        return log;
    }

    static #debug = LegacyLogger.create("debug", console.debug);
    static #info = LegacyLogger.create("info", console.info);
    static #warn = LegacyLogger.create("warn", console.warn);
    static #error = LegacyLogger.create("error", console.error);
}

// import chalk from "chalk";

// export class LegacyLogger {
//     private static instance: LegacyLogger;

//     private constructor() {
//     }

//     public static getInstance = () => {
//         if (!LegacyLogger.instance) {
//             LegacyLogger.instance = new LegacyLogger();
//         }
//         return LegacyLogger.instance;
//     }

//     // private registerWatchConfig = (config: Configuration) => {
//     //     return watchConfig(config, (key, oldValue, newValue) => {
//     //         this.logDebug(`Config property changed: ${chalk.bold(key)} (${oldValue} -> ${newValue})`);
//     //     });
//     // }

//     public static log = (type: string, message: string) => {
//         const time = new Date().toLocaleTimeString("en-US", {
//             hour: "2-digit",
//             minute: "2-digit",
//             second: "2-digit",
//         });

//         console.log(
//             `${chalk.bgYellowBright(time)} ${chalk.whiteBright("[")}${type}${chalk.whiteBright("]")} ${message}`
//         );
//     }

//     public logAlert = (message: string) => {
//         LegacyLogger.log(chalk.redBright("ALERT"), message);
//     }

//     public logError = (message: string) => {
//         LegacyLogger.log(chalk.yellowBright("ERROR"), message);
//     }

//     public logData = (message: string) => {
//         LegacyLogger.log(chalk.magentaBright("DATA"), message);
//     }

//     public logInfo = (message: string) => {
//         LegacyLogger.log(chalk.cyanBright("INFO"), message);
//     }

//     public logSent = (message: string) => {
//         LegacyLogger.log(chalk.greenBright("SENT"), message);
//     }

//     public logDebug = (message: string) => {
//         LegacyLogger.log(chalk.gray("DEBUG"), message);
//     }
// }