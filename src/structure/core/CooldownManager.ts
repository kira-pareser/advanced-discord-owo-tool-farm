import { Collection } from "discord.js-selfbot-v13";
export type CooldownType = "feature" | "command";
export class CooldownManager {
  private cooldowns: Collection<string, number> = new Collection<
    string,
    number
  >();

  getCooldown(type: CooldownType, name: string) {
    const cooldown = new Cooldown(`${type}.${name}`, this.cooldowns);
    return cooldown;
  }
}
export class Cooldown {

  constructor(
    private cooldownName: string,
    private cooldowns: Collection<string, number>
  ) {}
  get onCooldown(): number {
    const cooldown =  this.cooldowns.get(this.cooldownName);
    return  cooldown ? Math.max(cooldown - Date.now(), 0) : 0;
  }
  setCooldown(time: number) {
    const date = Date.now();
    return this.cooldowns.set(this.cooldownName, date + time);
  }
}