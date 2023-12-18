const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const config = require("../../../config.json");


class KickCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "kick";
    this.aliases = ["k"];
    this.description = "Kick player for a given duration (admin only)";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: true,
      },
      {
        name: "reason",
        description: "reason",
        required: true,
      }
    ];
  }

  async onCommand(username, message) {
    try {
      let isRemove = false;
      const uuid = await getUUID(username);
      const admin_list = config.minecraft.commands.admin_list;
      if (!admin_list.includes(uuid)){
        throw 'No permission';
      }
      const arg = this.getArgs(message);
      if (!arg[0] || !arg[1]) {
        this.send("/gc Wrong Usage: !kick [name] [reason]");
      }
      const kick_username = arg[0];
      const reason = arg[1];
  
      const muteListener = async (message) => {
           message = message.toString();
           if (message.includes("kicked")){
             this.send(`/gc ${kick_username} has been kicked from the guild for ${reason}`);
             await delay(2000);
           }else if (message.includes("cannot kick") || message.includes("find") || message.includes("is not") ||  message.includes("Invalid"))){
              this.send(`/gc [ERROR] ${message}`);
              bot.removeListener("message", muteListener);
              isRemove = true;
           }
      };
      bot.on("message", muteListener);
      this.send(`/g kick ${kick_username} ${reason}`);
      await delay(4000);
      if (isRemove === false){
        bot.removeListener("message", muteListener);    
      }
    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

module.exports = KickCommand;
