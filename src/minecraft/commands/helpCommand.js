const minecraftCommand = require("../../contracts/minecraftCommand.js");
const fs = require("fs");
const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1)

class HelpCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "help";
    this.aliases = ["info"];
    this.description = "Shows help menu and a description for a command";
    this.options = [
      {
        name: "command",
        description: "The command you want the description for",
        required: false,
      }
    ];
  }

  onCommand(username, message) {
    try {
      if (this.getArgs(message).length === 0) {
        this.send(`/gc https://imgur.com/I7Icb64`);
      } else {
        let command = this.getArgs(message)[0]
        const commandInstances = fs.readdirSync("./src/minecraft/commands")
          .filter(file => file.endsWith(".js"))
          .map(file => {
            let instance = new (require(`./${file}`))()
            if ([instance.name, ...instance.aliases].includes(command)) {
              return instance;
            }
          });
        if (commandInstances) {
          const commandInstance = commandInstances.filter(elem => elem != undefined)[0];
          this.send(`/gc ${capitalizeFirstLetter(commandInstance.name)} Command | Aliases: ${commandInstance.aliases.join(", ")} | Parameters: ${commandInstance.options.length > 0 ? commandInstance.options.map(option => {return option.required ? `(${option.name})` : `[${option.name}]`}).join(", ") : "None"} | Description: ${commandInstance.description}`);
        } else {
          console.log(`command: ${command}`);
          this.send("/gc [ERROR] That command doesn't exist");
        }
      }
    } catch (error) {
      console.log(`error: ${error}`);
      this.send("/gc [ERROR] Something went wrong..");
    }
  }
}

module.exports = HelpCommand;
