import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync, exec, spawnSync, spawn } from "node:child_process";
import { promisify } from "node:util";

import axios from "axios";
import AdmZip from "adm-zip";

import { copyDirectory } from "../utils/path.js";
import { logger } from "@/utils/logger.js";

export class UpdateFeature {
    private baseHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537'
    };

    public checkForUpdates = async () => {
        logger.info("Checking for updates...");
        try {
            const { version: currentVersion } = require("../../package.json");
            const { data: { version: latestVersion } } = await axios.get(
                "https://raw.githubusercontent.com/Kyou-Izumi/advanced-discord-owo-tool-farm/refs/heads/main/package.json",
                { headers: this.baseHeaders }
            );

            if (currentVersion < latestVersion) {
                logger.info(`New version available: ${latestVersion}. Current version: ${currentVersion}.`);
                return true;
            }

            logger.info(`You are using the latest version: ${currentVersion}.`);
        } catch (error) {
            logger.error(`Failed to check for updates: ${error}`);
        }

        return false;
    }

    private gitUpdate = async () => {
        try {
            logger.debug("Stashing local changes...");
            execSync("git stash", { stdio: "inherit" });
            logger.debug("Pulling latest changes from remote repository...");
            execSync("git pull --force", { stdio: "inherit" });
            logger.debug("Applying stashed changes...");
            execSync("git stash pop", { stdio: "inherit" });
        } catch (error) {
            logger.debug(`Failed to update repository: ${error}`);
        }
    }

    private manualUpdate = async () => {
        try {
            const res = await axios.get(
                "https://github.com/Kyou-Izumi/advanced-discord-owo-tool-farm/archive/refs/heads/main.zip",
                {
                    responseType: "arraybuffer",
                    headers: this.baseHeaders
                }
            );

            const zip = new AdmZip(res.data);
            zip.extractAllTo(os.tmpdir(), true);
            const tempFolder = path.join(os.tmpdir(), zip.getEntries()[0].entryName);
            copyDirectory(tempFolder, process.cwd());
        } catch (error) {
            logger.error("Error updating project manually:");
            logger.error(String(error));
        }
    }

    private installDependencies = async () => {
        logger.info("Installing dependencies...");
        try {
            await promisify(exec)("npm ci");
            logger.info("Dependencies installed successfully.");
        } catch (error) {
            logger.error("Error installing dependencies:");
            logger.error(String(error));
        }
    }

    private restart = () => {
        const child = spawn("start", ["cmd.exe", "/K", "npm start"], {
            cwd: process.cwd(),
            shell: true,
            detached: true,
            stdio: "ignore"
        });
        child.unref();
        process.exit(1);
    }

    public updateAndRestart = async () => {
        await this.performUpdate();
        await this.installDependencies();
        this.restart();
    }

    public performUpdate = async () => {
        logger.info("Performing update...");
        if (fs.existsSync(".git")) {
            try {
                execSync("git --version");
                logger.info("Git detected, updating with Git!");
                this.gitUpdate();
            } catch (error) {
                logger.info("Git not found, updating manually...");
                await this.manualUpdate();
            }
        } else {
            await this.manualUpdate();
        }

        logger.info("Update completed successfully!");
    }
}
