import { Schematic } from "@/structure/Schematic.js";

export default Schematic.registerFeature({
    name: "autoClover",
    cooldown: () => {
        const date = new Date();
        return date.setDate(date.getDate() + 1) - Date.now();
    },
    condition: async ({ agent, t }) => {
        if (!agent.config.autoClover) return false;
        if (!agent.config.adminID) {
            console.warn(t("features.errors.noAdminID", { feature: "autoClover" }));
            agent.config.autoClover = false;
            return false;
        }

        const admin = agent.client.users.cache.get(agent.config.adminID);
        if (!admin || admin.id === admin.client.user?.id) {
            console.warn(t("features.errors.invalidAdminID", { feature: "autoClover" }));
            agent.config.autoClover = false;
            return false;
        }

        return true;
    },
    run: async ({ agent }) => {
        await agent.send(`clover ${agent.config.adminID}`);

        agent.config.autoClover = false; // Disable autoClover after sending the message
    },
});
