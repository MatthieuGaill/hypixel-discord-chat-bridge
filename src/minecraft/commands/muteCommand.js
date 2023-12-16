
const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const config = require("../../../config.json");


class MuteCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "mute";
    this.aliases = ["m"];
    this.description = "Muter player for a given duration";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: true,
      },
      {
        name: "time",
        description: "time",
        required: true,
      },
    ];
  }

  async onCommand(username, message) {
    try {
      const uuid = await getUUID(username);
      const staff_list = config.minecraft.commands.staff_list;
      if (!staff_list.includes(uuid)){
        throw 'No permission';
      }
      const arg = this.getArgs(message);
      if (!arg[0] || !arg[1]) {
        this.send("/gc Wrong Usage: !mute [name] [time]");
      }
      username = arg[0];
      const time = arg[1];
      
      this.send(`/g mute ${username} ${time}`);
      await delay(1000);
      this.send(`/gc ${username} has been muted for ${time}`);
    } catch (error) {
      console.log(error);
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

module.exports = MuteCommand;
