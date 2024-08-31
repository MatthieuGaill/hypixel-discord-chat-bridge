const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/mowojangAPI.js");
const config = require("../../../config.json");
const { selectlink_uuid } = require("../../contracts/verify.js");


class MuteCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "warn";
    this.aliases = ["w"];
    this.description = "Mute player for a given duration (staff only)";
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
      if (mod_list.includes(uuid) || helper_list.includes(uuid) || admin_list.includes(uuid)){
      }else{
        throw 'No permission';
      }
      const arg = this.getArgs(message);
      if (!arg[0]) {
        this.send("/oc Wrong Usage: !warn [name] [reason (opt)]");
      }
      const warned_username = arg[0];
      let reason = "From mc";
      if (arg[1]){
        reason = arg[1];
      }
      const row = await selectlink_uuid(uuid);
      if (!row){
        throw "You need to be linked to perform this command!";
      }
  
    //   const muteListener = async (message) => {
    //        message = message.toString();
    //        if (message.includes("has muted")){
    //          this.send(`/gc ${warned_username} has been muted for ${time}, ${reason}`);
    //          await delay(1000);
    //        }else if (message.includes("cannot") || message.includes("find") || message.includes("Invalid")){
    //           this.send(`/oc [ERROR] ${message}`);
    //           bot.removeListener("message", muteListener);
    //           isRemove = true;
    //        }
    //   };
    //   bot.on("message", muteListener);
      await this.minecraft.bridgeSanctions({
        type: 0,
        reason: reason,
        username: warned_username,
        duration: 0,
        modName: username,
        modId: row
      });
      //this.send(`/g mute ${muted_username} ${time}`);
    //   await delay(5000);
    //   if (isRemove === false){
    //     bot.removeListener("message", muteListener);    
    //   }
    } catch (error) {
      this.send(`/oc [ERROR] ${error}`);
    }
  }
}

module.exports = MuteCommand;
