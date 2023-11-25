const minecraftCommand = require("../../contracts/minecraftCommand.js");
const {Translate} = require('@google-cloud/translate').v2;
require('dotenv').config();

// Your credentials
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS)

// Configuration for the client
const translate = new Translate({
    credentials: CREDENTIALS,
    projectId: CREDENTIALS.project_id
});

class TranslateCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "translate";
    this.aliases = ["ts"];
    this.description = "Translate any sentence in english";
    this.options = [
      {
        name: "sentence",
        description: "Sentence you want translated",
        required: true,
      },
    ];
  }

  async onCommand(username, message) {
    const arg = this.getArgs(message);
    try {
      if (arg.length === 0) {
        // eslint-disable-next-line no-throw-literal
        throw "You must provide a sentence to translate.";
      }
      const text = arg[0];
      let [response] = await translate.translate(text, 'en');
      this.send(`/gc ${response}`);
      
    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

module.exports = TranslateCommand;
