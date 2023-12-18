const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const config = require("../../../config.json");


class UnmuteCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "unmute";
    this.aliases = ["um"];
    this.description = "Unmute player for a given duration (staff only)";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: true,
      }
    ];
  }

  async onCommand(username, message) {
    try {
      let isRemove = false;
      const uuid = await getUUID(username);
      const mod_list = config.minecraft.commands.mod_list;
      if (!mod_list.includes(uuid)){
        throw 'No permission';
      }
      const arg = this.getArgs(message);
      if (!arg[0]) {
        this.send("/gc Wrong Usage: !unmute [name]");
      }
      const muted_username = arg[0];
      const muteListener = async (message) => {
           message = message.toString();
           if (message.includes("has muted")){
             this.send(`/gc ${muted_username} has been unmuted`);
             await delay(2000);
           }else if (message.includes("cannot") || message.includes("find") || message.includes("Invalid")){
              this.send(`/gc [ERROR] ${message}`);
              bot.removeListener("message", muteListener);
              isRemove = true;
           }
      };
      bot.on("message", muteListener);
      this.send(`/g unmute ${muted_username}`);
      await delay(4000);
      if (isRemove === false){
        bot.removeListener("message", muteListener);    
      }
    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

module.exports = UnmuteCommand;
