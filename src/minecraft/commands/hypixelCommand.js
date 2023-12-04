const minecraftCommand = require("../../contracts/minecraftCommand.js");
const hypixel = require("../../contracts/API/HypixelRebornAPI.js");

class HypixelCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "hypixel";
    this.aliases = ["h"];
    this.description = "Hypixel general stats of specified user.";
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

      const response = await hypixel.getPlayer(username, { raw: true });

      if (response.player === null) {
        // eslint-disable-next-line no-throw-literal
        throw "This player has never joined Hypixel.";
      }

     
      const hypixeltimes = [response?.player?.firstLogin, response?.player?.lastLogin];
      const formattedDate = formatUnixTimestamps(hypixeltimes);

      const REVERSE_PQ_PREFIX = - 3.5;
      const GROWTH_DIVIDES_2 =  2 / 2500;
      
      const karma = response?.player?.karma;
      const networkExp = response.player?.networkExp;
      const networkLevel = networkExp < 0 ? 1 : (1 + REVERSE_PQ_PREFIX + Math.sqrt(REVERSE_PQ_PREFIX*REVERSE_PQ_PREFIX + GROWTH_DIVIDES_2 * networkExp)).toFixed(2);

      this.send(
        `/gc ${username}'s Hypixel Level: ${networkLevel} | Karma: ${karma} | First Login: ${formattedDate[0]} | Last Login: ${formattedDate[1]}`
      );
    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

function formatUnixTimestamps(unixTimestamps) {
    return unixTimestamps.map(timestamp => {
        const date = new Date(timestamp);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        return formattedDate;
    });
}


module.exports = HypixelCommand;
