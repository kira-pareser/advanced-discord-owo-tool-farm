import { Message } from "discord.js-selfbot-v13";

import { Schematic } from "@/structure/classes/Schematic.js";
import { logger } from "@/utils/logger.js";

import { FeatureFnParams } from "@/typings/index.js";

const GEM_REGEX = {
    gem1: /^05[1-7]$/,
    gem2: /^(06[5-9]|07[0-1])$/,
    gem3: /^07[2-8]$/,
    star: /^(079|08[0-5])$/,
};

const GEM_TIERS = {
    common: [51, 65, 72, 79],
    uncommon: [52, 66, 73, 80],
    rare: [53, 67, 74, 81],
    epic: [54, 68, 75, 82],
    legendary: [55, 69, 76, 83],
    mythical: [56, 70, 77, 84],
    fabled: [57, 71, 78, 85],
}

const useGems = async (param1: FeatureFnParams, huntMsg: Message) => {
    const { agent, t, locale } = param1;

    const invMsg = await agent.awaitResponse({
        trigger: () => agent.send("inv"),
        filter: (m) => m.author.id === agent.owoID
            && m.content.includes(m.guild?.members.me?.displayName!)
            && m.content.includes("Inventory"),
    });

    if (!invMsg) return;

    const inventory = invMsg.content.split("`");

    if (agent.config.autoFabledLootbox && inventory.includes("049")) {
        await agent.send("lb fabled");
    }

    if (agent.config.autoLootbox && inventory.includes("050")) {
        await agent.send("lb all");

        // After opening, re-run the hunt to get an accurate state.
        logger.debug("Lootboxes opened, re-running useGems logic to check inventory again.");
        await useGems(param1, huntMsg);
        return;
    }

    const usableGemsSet = new Set(agent.config.gemTier?.map((tier) => GEM_TIERS[tier]).flat());

    const filterAndMapGems = (regex: RegExp) => {
        return inventory.reduce((acc: number[], item) => {
            const numItem = Number(item);
            // Test regex first (it's fast) then check the Set.
            if (regex.test(item) && usableGemsSet.has(numItem)) {
                acc.push(numItem);
            }
            return acc;
        }, []);
    };

    agent.gem1Cache = filterAndMapGems(GEM_REGEX.gem1);
    agent.gem2Cache = filterAndMapGems(GEM_REGEX.gem2);
    agent.gem3Cache = filterAndMapGems(GEM_REGEX.gem3);
    agent.starCache = agent.config.useSpecialGem ? filterAndMapGems(GEM_REGEX.star) : [];

    const totalGems = agent.gem1Cache.length + agent.gem2Cache.length + agent.gem3Cache.length + agent.starCache.length;
    if (totalGems === 0) {
        logger.info("No usable hunting gems found in inventory.");
        agent.config.autoGem = 0; // Disable feature if no gems are left
        return;
    }

    logger.info(`Found ${totalGems} types of usable hunting gems in Inventory.`);

    const gemsToUse: number[] = []

    if (!huntMsg.content.includes("gem1") && agent.gem1Cache.length > 0) {
        gemsToUse.push(agent.config.autoGem > 0 ? Math.max(...agent.gem1Cache) : Math.min(...agent.gem1Cache));
    }
    if (!huntMsg.content.includes("gem2") && agent.gem2Cache.length > 0) {
        gemsToUse.push(agent.config.autoGem > 0 ? Math.max(...agent.gem2Cache) : Math.min(...agent.gem2Cache));
    }
    if (!huntMsg.content.includes("gem3") && agent.gem3Cache.length > 0) {
        gemsToUse.push(agent.config.autoGem > 0 ? Math.max(...agent.gem3Cache) : Math.min(...agent.gem3Cache));
    }
    if (agent.config.useSpecialGem && !huntMsg.content.includes("star") && agent.starCache.length > 0) {
        gemsToUse.push(agent.config.autoGem > 0 ? Math.max(...agent.starCache) : Math.min(...agent.starCache));
    }

    if (gemsToUse.length === 0) {
        logger.info("No usable gems found for the hunt.");
        return;
    }

    await agent.send(`use ${gemsToUse.join(" ")}`);
}

export default Schematic.registerFeature({
    name: "autoHunt",
    cooldown: () => 15_000,
    condition: async () => true,
    run: async ({ agent, t, locale }) => {

        if (agent.config.autoGem === 0) {
            await agent.send("hunt");
            return;
        }

        const huntMsg = await agent.awaitResponse({
            trigger: () => agent.send("hunt"),
            filter: (m) => m.author.id === agent.owoID
                && m.content.includes(agent.client.user.username)
                && /hunt is empowered by|spent 5 .+ and caught a/.test(m.content),
        });

        if (!huntMsg) return;

        const gem1Needed = !huntMsg.content.includes("gem1") && (!agent.gem1Cache || agent.gem1Cache.length > 0);
        const gem2Needed = !huntMsg.content.includes("gem2") && (!agent.gem2Cache || agent.gem2Cache.length > 0);
        const gem3Needed = !huntMsg.content.includes("gem3") && (!agent.gem3Cache || agent.gem3Cache.length > 0);
        const starNeeded = Boolean(agent.config.useSpecialGem && !huntMsg.content.includes("star") && (!agent.starCache || agent.starCache.length > 0));

        // const condition = agent.config.

        if (gem1Needed || gem2Needed || gem3Needed || starNeeded) await useGems({ agent, t, locale }, huntMsg);
    }
})