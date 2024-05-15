const minecraftCommand = require("../../contracts/minecraftCommand.js");
const hypixel = require("../../contracts/API/HypixelRebornAPI.js");
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");

class MemberCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "member";
    this.aliases = ["m"];
    this.description = "Guild Info of specified user.";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: false,
      },
    ];
  }

  async onCommand(username, message) {
    username = this.getArgs(message)[0] || username;

    try {
      const [uuid, guild] = await Promise.all([getUUID(username), hypixel.getGuild("player", username)]);

      if (guild === undefined){
        // eslint-disable-next-line no-throw-literal
        throw "Player is not in a Guild (or guild not found).";
      }

      const player = guild.members.find((member) => member.uuid == uuid);

      if (player === undefined) {
        // eslint-disable-next-line no-throw-literal
        throw "Player is not in a Guild.";
      }
      const joinedDate = new Date(player.joinedAtTimestamp);
      const daysDifference = (Date.now() - joinedDate) / (1000 * 60 * 60 * 24);
      this.send(`/gc ${username}'s Guild: [${guild.name}], Rank: ${player.rank}, Quests: ${player.questParticipation}, Joined: ${joinedDate.getDate()} ${joinedDate.toLocaleString('default', { month: 'long' })} ${joinedDate.getFullYear()}  (${daysDifference.toFixed(0)} days)`);
    } catch (error) {
      this.send(
        `/gc ${error
          .toString()
          .replace("[hypixel-api-reborn] ", "")
          .replace("For help join our Discord Server https://discord.gg/NSEBNMM", "")
          .replace("Error:", "[ERROR]")}`
      );
    }
  }
}

module.exports = MemberCommand;
