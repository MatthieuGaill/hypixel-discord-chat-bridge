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
      
      const karma = response?.player?.karma;
      const networkExp = response.player?.networkExp;
      const networkLevel = ILeveling.getLevel(networkExp);
      const percentagetoNext = ILeveling.getPercentageToNextLevel(networkExp);


      this.send(
        `/gc Matthipcas's Hypixel Level: ${networkLevel} (${percentagetoNext}% to next level) | Karma: ${karma} | First Login: ${hypixeltimes[0]} | Last Login: ${hypixeltimes[1]}`
      );
    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

const ILeveling = {
    EXP_FIELD: "networkExp",
    LVL_FIELD: "networkLevel",

    BASE: 10000,
    GROWTH: 2500,

    HALF_GROWTH: 0.5 * this.GROWTH,

    REVERSE_PQ_PREFIX: -(this.BASE - 0.5 * this.GROWTH) / this.GROWTH,
    REVERSE_CONST: this.REVERSE_PQ_PREFIX * this.REVERSE_PQ_PREFIX,
    GROWTH_DIVIDES_2: 2 / this.GROWTH,

    getLevel: function (exp) {
        return exp < 0 ? 1 : Math.floor(1 + this.REVERSE_PQ_PREFIX + Math.sqrt(this.REVERSE_CONST + this.GROWTH_DIVIDES_2 * exp));
    },

    getExactLevel: function (exp) {
        return this.getLevel(exp) + this.getPercentageToNextLevel(exp);
    },

    getExpFromLevelToNext: function (level) {
        return level < 1 ? this.BASE : this.GROWTH * (level - 1) + this.BASE;
    },

    getTotalExpToLevel: function (level) {
        let lv = Math.floor(level);
        let x0 = this.getTotalExpToFullLevel(lv);
        if (level === lv) return x0;
        return (this.getTotalExpToFullLevel(lv + 1) - x0) * (level % 1) + x0;
    },

    getTotalExpToFullLevel: function (level) {
        return (this.HALF_GROWTH * (level - 2) + this.BASE) * (level - 1);
    },

    getPercentageToNextLevel: function (exp) {
        let lv = this.getLevel(exp);
        let x0 = this.getTotalExpToLevel(lv);
        return (exp - x0) / (this.getTotalExpToLevel(lv + 1) - x0);
    }
};

module.exports = HypixelCommand;
