import winston from "winston"
import chalk from "chalk"

import fs from "node:fs"
import path from "node:path"
import util from "node:util"

export type LogLevel = "alert" | "error" | "runtime" | "warn" | "info" | "data" | "sent" | "debug";

const LOG_DIR = "logs";
const LOG_FILE = path.join(LOG_DIR, "console.log");

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const { combine, printf, timestamp, errors, uncolorize } = winston.format;

const levelFormats: Record<LogLevel, string> = {
    alert: chalk.redBright.bold("[ALERT]"),
    error: chalk.redBright.bold("[ERROR]"),
    runtime: chalk.blue.bold("[RUNTIME]"),
    warn: chalk.yellowBright.bold("[WARNING]"),
    info: chalk.cyanBright.bold("[INFO]"),
    data: chalk.blackBright.bold("[DATA]"),
    sent: chalk.greenBright.bold("[SENT]"),
    debug: chalk.magentaBright.bold("[DEBUG]"),
}

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
    const formattedLevel = levelFormats[level as LogLevel] || chalk.whiteBright.bold(`[${level.toUpperCase()}]`);
    const formattedTimestamp = chalk.bgYellowBright.whiteBright(timestamp);

    if(stack) {
        return util.format(
            "%s %s %s\n%s",
            formattedTimestamp,
            formattedLevel,
            message,
            chalk.redBright("%O"), // Pretty-print stack/object
            stack
        )
    }
    return util.format(
        "%s %s %s",
        formattedTimestamp,
        formattedLevel,
        level === "debug" ? chalk.gray(message) : message
    );
});

class WinstonLogger {
    private logger: winston.Logger;
    private static instance: WinstonLogger;

    constructor() {
        this.logger = winston.createLogger({
            level: "debug",
            levels: {
                alert: 0,
                error: 1,
                runtime: 2,
                warn: 3,
                info: 4,
                data: 5,
                sent: 6,
                debug: 7,
            },
            format: combine(
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                errors({ stack: true }),
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({
                    filename: LOG_FILE,
                    level: "debug",
                    maxsize: 5 * 1024 * 1024, // 5 MB
                    maxFiles: 5,
                    format: combine(
                        uncolorize(),
                        consoleFormat
                    ),
                }),
            ],
            exitOnError: false,
            handleExceptions: true,
            handleRejections: true,
        });
    }

    public static getInstance(): WinstonLogger {
        if (!WinstonLogger.instance) {
            WinstonLogger.instance = new WinstonLogger();
        }
        return WinstonLogger.instance;
    }

    public log(level: LogLevel, message: string | Error) {
        if (message instanceof Error) {
            this.logger.log(level, message.message, { stack: message.stack});
        } else {
            this.logger.log(level, message);
        }
    }

    public alert(message: string | Error) {
        this.log("alert", message);
    }

    public error(message: string | Error) {
        this.log("error", message);
    }

    public runtime(message: string | Error) {
        this.log("runtime", message);
    }

    public warn(message: string | Error) {
        this.log("warn", message);
    }

    public info(message: string | Error) {
        this.log("info", message);
    }

    public data(message: string | Error) {
        this.log("data", message);
    }

    public sent(message: string | Error) {
        this.log("sent", message);
    }

    public debug(message: string | Error) {
        this.log("debug", message);
    }
}

export const logger = WinstonLogger.getInstance();