
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { logger } from "@/utils/logger.js";

export class DataManager {
    private readonly filePath: string;

    constructor(
        filePath = path.join(os.homedir(), "b2ki-ados", "data.json") // Default path to user's home directory
    ) {
        this.filePath = filePath;
        this.ensureFileExists();
    }

    private ensureFileExists = () => {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
        }
    }

    public read = ():Record<string, unknown> => {
        try {
            const data = fs.readFileSync(this.filePath, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            logger.error("Error reading data file:");
            logger.error(error as Error);
            return {};
        }
    }

    public write = (data: Record<string, unknown>): void => {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            logger.error("Error writing data file:");
            logger.error(error as Error);
        }
    }
}