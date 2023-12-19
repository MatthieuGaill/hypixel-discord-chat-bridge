const sqlite3 = require('sqlite3');
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");

module.exports = {
  name: "code",
  description: "Voucher tool",
  options: [
    {
      name: "code",
      description: "code",
      type: 3,
      required: true,
    },
  ],

  execute: async (interaction) => {
    const user = interaction.member;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }
    
    const db = new sqlite3.Database('database.sqlite');
    db.run('CREATE TABLE IF NOT EXISTS ticketdata (key TEXT PRIMARY KEY, value TEXT)');

    const code_key = interaction.options.getString("code");
    let key_value;

    db.get('SELECT value FROM ticketdata WHERE key = ?', [code_key], (err, row) => {
      if (err) {
        console.error(err);
        throw new HypixelDiscordChatBridgeError(err);
        return;
      }
    
      if (row) {
        key_value = row.value;
        console.log(`Value for key '${keyToRetrieve}': ${retrievedValue}`);
      } else {
        throw new HypixelDiscordChatBridgeError(`No value found for code ${code_key}`);
      }
    
      // Close the database connection when done
      db.close();
    });
    
    db.run('DELETE FROM ticketdata WHERE key = ?', [code_key]);
    
    const embed = new EmbedBuilder()
      .setColor(12745742)
      .setAuthor({ name: "Congratulations!" })
      .setDescription(`You won a ${key_value}`)
      .setFooter({
        text: ' ',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
      await interaction.followUp({embeds: [embed],});
  }
};
