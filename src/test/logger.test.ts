// import { blessedLogger } from "../utils/logger.js";

// await blessedLogger({})

console.log(
    new Date().toLocaleTimeString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
)