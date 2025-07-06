import blessed from "blessed"
import contrib from "blessed-contrib"
import chalk from "chalk"

const screen = blessed.screen()
const grid = new contrib.grid({ rows: 15, cols: 15, screen })

const statusBox = grid.set(0, 0, 7, 4, blessed.box, {
    label: "Session Status",
    fg: "green",
    padding: {
        left: 1,
    }
})
statusBox.setContent(`
Version: 4.0.0
Username: eternityyy_1206
Status: [ATTENTION REQUIRED]
Uptime: 132:24:12

Bot status: [ONLINE]
Distortion: None
Last check: ${new Date().toLocaleTimeString()}

Total commands: 100
Total texts: 100
`.trim())

// statusBox.log("Username: eternityyy_1206")
// statusBox.log("")
// statusBox.log("status: [ATTENTION REQUIRED]")
// statusBox.log("uptime: 132:24:12")
// statusBox.log("")
// statusBox.log("Bot status: [ONLINE]")
// statusBox.log("Distortion: None")
// statusBox.log("Last check: " + new Date().toLocaleTimeString())
// statusBox.log("")
// statusBox.log("Total commands: 100")
// statusBox.log("Total texts: 100")

const ordinaryBox = grid.set(7, 0, 3, 4, blessed.box, {
    label: "Hunting/Battling",
    fg: "green",
    padding: {
        left: 1,
    }
})

ordinaryBox.setContent(`Total animals: 100\nXp earned: 100`)
// ordinaryBox.setContent("Xp earned: 100")

const farmLog = grid.set(7, 4, 6, 8, contrib.log, {
    label: "Console Log",
    fg: "green",
    padding: {
        left: 1,
    }
})

const commandInput = grid.set(13, 4, 2, 8, blessed.textbox, {
    label: "Command Input",
    fg: "green",
    padding: {
        left: 1,
    },
    inputOnFocus: true,
    keys: true,
    mouse: true,
})

commandInput.on('submit', (value) => {
    farmLog.log(new Date().toLocaleString() + " - " + `[COMMAND] ${value}`)
    screen.cursorReset()
    screen.render()
    commandInput.clearValue()
    commandInput.focus()
})

setInterval(() => {
    farmLog.log(new Date().toLocaleString() + " - " + "[INFO] Found 3 gems in the inventory")
    commandInput.focus()
}, 1000);

const captchaBox = grid.set(10, 12, 5, 3, contrib.log, {
    label: "Captcha Status",
    fg: "green",
    padding: {
        left: 1,
    }
})

captchaBox.log("Total resolved: 100")
captchaBox.log("Total unsolved: 100")
captchaBox.log("")
captchaBox.log("Current: [UNSOLVED]")
captchaBox.log("Type: hCaptcha")
captchaBox.log("Timestamp: 21 hours ago")

const latencyLine = grid.set(0, 4, 7, 8, contrib.line, {
    label: "WS Latency",
    showLegend: true,
    legend: { width: 4 },
    // maxY: 300,
    minY: 0,
    wholeNumbersOnly: true,
})

var transactionsData1 = {
    title: 'ms',
    style: { line: 'yellow' },
    x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30'],
    y: [0, 5, 5, 10, 10, 15]
}

latencyLine.setData([transactionsData1])

const configBox = grid.set(0, 12, 10, 3, blessed.box, {
    label: "Configuration",
    fg: "green",
    padding: {
        left: 1,
    }
})

const config = {
    username: "",
    token: "",
    guildID: "",
    channelID: [""],
    wayNotify: ["webhook"],
    musicPath: "",
    webhookURL: "",
    prefix: "!",
    adminID: "",
    captchaAPI: "2captcha",
    apiKey: "",
    autoPray: ["pray"],
    autoGem: 1,
    autoCrate: true,
    autoFCrate: true,
    autoQuote: ["owo", "quote"],
    autoDaily: true,
    autoQuest: true,
    autoCookie: true,
    autoClover: true,
    autoOther: ["run", "pup", "piku"],
    autoSell: true,
    autoSleep: true,
    autoReload: true,
    autoResume: true,
    showRPC: true
}

configBox.setContent(Object.entries(config)
                    .map(([k, v]) => `${chalk.whiteBright(k)}: ${chalk.greenBright(v)}`)
                    .join("\n"))

const huntbotBox = grid.set(10, 0, 5, 4, blessed.box, {
    label: "Huntbot Status",
    fg: "green",
    padding: {
        left: 1,
    }
})

huntbotBox.setContent(`Last check: ${new Date().toLocaleString()}\nEstimated time: 1 hour\n\nUpgrade trait: None`)

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

commandInput.key(['escape', 'q', 'C-c'], function(ch, key) {
    process.exit(0);
});