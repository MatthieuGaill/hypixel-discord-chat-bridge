
const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const config = require("../../../config.json");


class MuteCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "mute";
    this.aliases = ["m"];
    this.description = "Mute player for a given duration (staff only)";
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
      const mod_list = config.minecraft.commands.mod_list;
      if (!mod_list.includes(uuid)){
        throw 'No permission';
      }
      const arg = this.getArgs(message);
      if (!arg[0] || !arg[1]) {
        this.send("/gc Wrong Usage: !mute [name] [time]");
      }
      const muted_username = arg[0];
      const time = arg[1];
  
      const muteListener = async (message) => {
           message = message.toString();
           if (message.includes("has muted")){
             this.send(`/gc ${muted_username} has been muted for: ${time}`);
           }else if (message.includes("cannot")){
              this.send(`/gc [ERROR] ${message}`);
           }
      };
      bot.on("message", muteListener);
      this.send(`/g mute ${muted_username} ${time}`);
      await delay(4000);     
      bot.removeListener("message", muteListener);    

    } catch (error) {
      console.log(error);
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

module.exports = MuteCommand;
