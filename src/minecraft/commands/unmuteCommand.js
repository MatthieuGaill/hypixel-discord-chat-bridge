
const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const config = require("../../../config.json");


class UnmuteCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "Unmmute";
    this.aliases = ["um"];
    this.description = "Unmute player (staff only)";
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
      const uuid = await getUUID(username);
      const mod_list = config.minecraft.commands.mod_list;
      if (!mod_list.includes(uuid)){
        throw 'No permission';
      }
      const arg = this.getArgs(message);
      if (!arg[0]) {
        this.send("/gc Wrong Usage: !unmute [name]");
      }
      username = arg[0];
      this.send(`/g unmute ${username}`);
      await delay(1000);

    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

module.exports = UnmuteCommand;
