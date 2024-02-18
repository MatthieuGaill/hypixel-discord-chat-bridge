onst minecraftCommand = require("../../contracts/minecraftCommand.js");
const {Translate} = require('@google-cloud/translate').v2;
require('dotenv').config();

// Commands
const commands = [
  "!8ball", "!8b", "!accesories","!acc", "!talismans","!talisman",
  "!auction", "!ah", "!auctions", "!bedwars", "!bw", "!bws",
  "!bestiary", "!be","!calculate", "!calc", "!math",
  "!catacombs", "!cata", "!dungeons", "!duels", "!duel", "!fairysouls",
  "!fs", "!fetchur", "!guild", "!g","!guildexp","!gexp",
  "!help", "!info", "!hypixel", "!h", "!kick", "!k", "!kitty",
  "!cat", "!cutecat", "!megawalls", "!mw", "!mute", "!m",
  "!networth", "!nw", "!quickmaths","!qm", "!armor",
  "!equipment", "!render", "!inv", "!i",
  "!inventory", "!pet", "!pets", "!rules", "!r", "!skills",
  "!skill", "!sa", "!skyblock", "!stats", "!sb", "!level",
  "!lvl", "!skywars", "!sw", "!slayer", "!slayers",
  "!translate", "!ts", "!UHC", "!uhc", "!unmute", "!um",
  "!unscramble", "!us", "!unscrambleme", "!warpout", "!warp",
  "!weight", "!w", "!woolwars", "!ww"
]

// Your credentials
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS)

// Configuration for the client
const translate = new Translate({
    credentials: CREDENTIALS,
    projectId: CREDENTIALS.project_id
});

class TranslateCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "translate";
    this.aliases = ["ts"];
    this.description = "Translate any sentence in english";
    this.options = [
      {
        name: "sentence",
        description: "Sentence you want translated",
        required: true,
      },
    ];
  }
  async onCommand(username, message) {
    const arg = this.getArgs(message);
    try {
      if (arg.length === 0) {
        // eslint-disable-next-line no-throw-literal
        throw "You must provide a sentence to translate.";
      }
      const text = arg.join(' ');
      commands.forEach(command => {
        if (text.includes(command)) {
          throw "Please refrain from using a command in translation";
        }
      })
      let [response] = await translate.translate(text, 'en');
      this.send(`/gc Translation: ${response}`);

    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

module.exports = TranslateCommand;

