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
      hypixeltimes.map(timestamp => {
        const date = new Date(timestamp * 1000);
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      });

   

      const REVERSE_PQ_PREFIX = - 3.5;
      const GROWTH_DIVIDES_2 =  2 / 2500;
      
      const karma = response?.player?.karma;
      const networkExp = response.player?.networkExp;
      const networkLevel = exp < 0 ? 1 : (1 + REVERSE_PQ_PREFIX + Math.sqrt(REVERSE_PQ_PREFIX*REVERSE_PQ_PREFIX + GROWTH_DIVIDES_2 * networkExp)).toFixed(2);

      this.send(
        `/gc ${username}'s Hypixel Level: ${networkLevel} | Karma: ${karma} | First Login: ${hypixeltimes[0]} | Last Login: ${hypixeltimes[1]}`
      );
    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}


module.exports = HypixelCommand;
