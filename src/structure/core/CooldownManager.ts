import { Collection } from "discord.js-selfbot-v13";

export class CooldownManager {
    private cooldowns = new Collection<string, number>();

    private getKey(type: "feature" | "command", name: string): string {
        return `${type}:${name}`;
    }

    /**
     * Checks if a feature or command is currently on cooldown.
     * @returns The remaining cooldown time in milliseconds, or 0 if not on cooldown.
     */
    public onCooldown(type: "feature" | "command", name: string): number {
        const key = this.getKey(type, name);
        const expirationTime = this.cooldowns.get(key);
        if (!expirationTime) {
            return 0;
        }
        return Math.max(expirationTime - Date.now(), 0);
    }

    /**
     * Sets a cooldown for a feature or command.
     * @param time The cooldown duration in milliseconds.
     */
    public set(type: "feature" | "command", name: string, time: number): void {
        const key = this.getKey(type, name);
        const expirationTime = Date.now() + time;
        this.cooldowns.set(key, expirationTime);
    }
}