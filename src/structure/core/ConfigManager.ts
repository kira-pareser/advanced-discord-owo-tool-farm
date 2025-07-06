import fs from "node:fs"
import path from "node:path";
import os from "node:os";

import type { Configuration } from "../../typings/Configuration.js";

export class ConfigManager {
    private config: Record<string, Configuration> = {};

    constructor(private configFilePath: string = path.join(os.homedir(), "b2ki-ados", "data.json")) {
        this.loadConfig();
    }

    private loadConfig(): void {
        if(!fs.existsSync(this.configFilePath)) {
            fs.mkdirSync(path.dirname(this.configFilePath), { recursive: true });
            fs.writeFileSync(this.configFilePath, JSON.stringify({}, null, 2), 'utf-8');

            return;
        }

        const rawData = fs.readFileSync(this.configFilePath, 'utf-8');
        this.config = JSON.parse(rawData);
    }

    public getAllKeys(): string[] {
        return Object.keys(this.config);
    }

    public get(key: string): Configuration | undefined {
        return this.config[key];
    }

    public set(key: string, value: any): void {
        this.config[key] = value;
        this.saveConfig();
    }

    private saveConfig(): void {
        const data = JSON.stringify(this.config, null, 2);
        fs.writeFileSync(this.configFilePath, data, 'utf-8');
    }
}