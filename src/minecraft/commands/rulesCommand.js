const minecraftCommand = require("../../contracts/minecraftCommand.js");

class RulesCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "rules";
    this.aliases = ["r"];
    this.options = [];
    this.description = "Give the rules";
  }

  async onCommand(username, message) {
      this.send(`/gc Respect the others. No phishing/sexual/illegal content. Avoid swearing. No racial/xenophobic/homophobic comment. No toxicity/flood/spam (including whole sentences in caps). No begging (even in pm).`);
    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
}

module.exports = RulesCommand;
