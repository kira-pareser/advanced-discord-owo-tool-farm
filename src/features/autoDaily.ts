import { Schematic } from "@/structure/classes/Schematic.js";


export default Schematic.registerFeature({
    name: "autoDaily",
    options: {
        overrideCooldown: true
    },
    cooldown: () => 1000 * 60 * 60, // 1 hour
    condition: async ({ client, channel, config }) => {
        if (!config.autoCookie) return false;
        if (channel.type !== "GUILD_TEXT") return false;
        if (!channel.permissionsFor(client.user)?.has("SEND_MESSAGES")) return false;

        return true;
    },
    permissions: "SEND_MESSAGES",
    run: async ({ client, channel }) => {
        const message = await client.sendMessage("cookie", { channel, typing: 1000 });
        if (message) {
            await message.react("🍪");
        }
    }
})