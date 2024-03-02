
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
      const mod_list = config.minecraft.commands.mod_list;
      if (!mod_list.includes(uuid)){
        throw 'No permission';
      }
      const arg = this.getArgs(message);
      if (!arg[0] || !arg[1]) {
        this.send("/oc Wrong Usage: !mute [name] [time] [reason (opt)]");
      }
      const muted_username = arg[0];
      const time = arg[1];
      let reason = "";
      if (arg[2]){
        reason = arg[2];
      }
  
      const muteListener = async (message) => {
           message = message.toString();
           if (message.includes("has muted")){
             this.send(`/gc ${muted_username} has been muted for ${time}, ${reason}`);
             await delay(1000);
           }else if (message.includes("cannot") || message.includes("find") || message.includes("Invalid")){
              this.send(`/oc [ERROR] ${message}`);
              bot.removeListener("message", muteListener);
              isRemove = true;
           }
      };
      bot.on("message", muteListener);
      this.send(`/g mute ${muted_username} ${time}`);
      await delay(4000);
      if (isRemove === false){
        bot.removeListener("message", muteListener);    
      }
    } catch (error) {
      this.send(`/oc [ERROR] ${error}`);
    }
  }
}

module.exports = MuteCommand;
