const minecraftCommand = require("../../contracts/minecraftCommand.js");
// const {Translate} = require('@google-cloud/translate').v2;
const deepl = require('deepl-node');
const fs = require("fs");
require('dotenv').config();

// Your credentials
//const CREDENTIALS = JSON.parse(process.env.CREDENTIALS)

// Configuration for the client
// const translate = new Translate({
//     credentials: CREDENTIALS,
//     projectId: CREDENTIALS.project_id
// });
const translate = new deepl.Translator("186c7b03-adc1-4061-81db-35a55811fd3e:fx");

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
    const commands = fs.readdirSync("./src/minecraft/commands")
          .filter(file => file.endsWith(".js") && file != "translateCommand.js")
          .map(file => {
            let instance = new (require(`./${file}`))()
            return [instance.name, ...instance.aliases].map(elem => "!" + elem)
          }).flat();
    try {
      if (arg.length === 0) {
        // eslint-disable-next-line no-throw-literal
        throw "You must provide a sentence to translate.";
      }
      const text = arg.join(' ');
      commands.forEach(command => {
        if (text.includes(command)) {
          throw "Please refrain from using a command in translation";
        }
      })
      // let [response] = await translate.translate(text, 'en');
      let response = await translate.translateText(text, null, "en-US");
      // this.send(`/gc Translation: ${response}`);
      this.send(`/gc Translation: ${response.text}`);

    } catch (error) {
      this.send(`/gc [ERROR] ${error}`);
    }
  }
}

module.exports = TranslateCommand;