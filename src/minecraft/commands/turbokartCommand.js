const minecraftCommand = require("../../contracts/minecraftCommand.js");
const hypixel = require("../../contracts/API/HypixelRebornAPI.js");

class EightBallCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "turbo";
    this.aliases = ["tkr"];
    this.description = "View the Turbo kart racer stats of a player";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: false,
      },
    ];
  }

  async onCommand(username, message) {
    try {
      username = this.getArgs(message)[0] || username;

      const {
        stats: { turbokartracers },
      } = await hypixel.getPlayer(username);

      //console.log(turbokartracers);

      const { bananaHitsReceived, bananaHitsSent, boxPickups, wins, grandPrix, grandPrixTokens } = turbokartracers;

      this.send(
        `/gc ${username}'s Tubo Kart Racer: grandPrix: ${grandPrix} (tokens: ${grandPrixTokens}) | W: ${wins} | boxPickups: ${boxPickups} | Banana received: ${bananaHitsReceived} | Banane sent: ${bananaHitsSent}`,
      );
    } catch (error) {
      this.send(
        `/gc ${error
          .toString()
          .replace("[hypixel-api-reborn] ", "")
          .replace("For help join our Discord Server https://discord.gg/NSEBNMM", "")
          .replace("Error:", "[ERROR]")}`,
      );
    }
  }
}

module.exports = EightBallCommand;