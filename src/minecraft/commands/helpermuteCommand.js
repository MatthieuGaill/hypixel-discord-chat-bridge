
const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/mowojangAPI.js");
const config = require("../../../config.json");


class HelpermuteCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "helpermute";
    this.aliases = ["hmute", "hm"];
    this.description = "Mute player for one hour (helper only)";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: true,
      },
      {
        name: "reason",
        description: "reason",
        required: false,
      },
    ];
  }

  async onCommand(username, message) {
    try {
      let isRemove = false;
      const uuid = await getUUID(username);
      const helper_list = config.minecraft.commands.helper_list;
      const mod_list = config.minecraft.commands.mod_list;
      const admin_list = config.minecraft.commands.admin_list;
      if (helper_list.includes(uuid) || mod_list.includes(uuid) || admin_list.includes(uuid)){
      }else{
        throw 'No permission';
      }
      const arg = this.getArgs(message);
      if (!arg[0]) {
        this.send("/gc Wrong Usage: !hm [name] [reason (opt)]");
      }
      const muted_username = arg[0];
      const time = arg[1];
      let reason = "";
      if (arg[1]){
        reason = arg[1];
      }
  
      const muteListener = async (message) => {
           message = message.toString();
           if (message.includes("has muted")){
             this.send(`/gc ${muted_username} has been muted for 1 hour, ${reason}`);
             await delay(1000);
           }else if (message.includes("cannot") || message.includes("find") || message.includes("Invalid")){
              this.send(`/oc [ERROR] ${message}`);
              bot.removeListener("message", muteListener);
              isRemove = true;
           }
      };
      bot.on("message", muteListener);
      this.send(`/g mute ${muted_username} 1h`);
      await delay(4000);
      if (isRemove === false){
        bot.removeListener("message", muteListener);    
      }
    } catch (error) {
      this.send(`/oc [ERROR] ${error}`);
    }
  }
}

module.exports = HelpermuteCommand;
