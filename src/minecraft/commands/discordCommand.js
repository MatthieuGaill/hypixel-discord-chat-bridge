const minecraftCommand = require("../../contracts/minecraftCommand.js");

class DiscordCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "discord";
    this.aliases = ["ds"];
    this.description = "Shows the discord of the guild";
    this.options = [];
  }

  onCommand(username, message) {
    try {
      this.send(`/gc Here's the invitation: https://discord.com/invite/FssyYfbkSv`);
 
    } catch (error) {
      this.send("/gc [ERROR] Something went wrong..");
    }
  }
}

module.exports = DiscordCommand;
