const sqlite3 = require('sqlite3');
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");

module.exports = {
  name: "ticket",
  description: "Voucher tool",
  options: [
    {
      name: "action",
      description: "action to run: (add/remove/list)",
      type: 3,
      required: true,
    },
    {
      name: "code",
      description: "code",
      type: 3,
      required: false,
    },
    {
      name: "value",
      description: "value",
      type: 3,
      required: false,
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

    const [action, code_key, code_value] = [interaction.options.getString("action"), interaction.options.getString("code"), interaction.options.getString("value")];

    if (action === "add" || action === "Add"){
      if (code_key === null || code_value === null){
        throw new HypixelDiscordChatBridgeError("You must specify a code & value with add");
      }
      
      db.run('INSERT OR REPLACE INTO ticketdata (key, value) VALUES (?, ?)', [code_key, code_value]);
      const embed = new EmbedBuilder()
      .setColor(2067276)
      .setAuthor({ name: "Ticket created" })
      .setDescription(`Successfully created code **${code_key}** with the value **${code_value}**`)
      .setFooter({
        text: ' ',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });

      await interaction.followUp({embeds: [embed],});
      
    } else if (action === "remove"){
      if (code_key === null){
        throw new HypixelDiscordChatBridgeError("You must specify a code (to remove) with remove");
      }
      db.run('DELETE FROM ticketdata WHERE key = ?', [code_key]);
      const embed = new EmbedBuilder()
      .setColor(15105570)
      .setAuthor({ name: "Ticket removed" })
      .setDescription(`Successfully removed code **${code_key}**`)
      .setFooter({
        text: ' ',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
      await interaction.followUp({embeds: [embed],});

      
    } else if (action === "list"){
      const dataDictionary = {};
      
      db.all('SELECT * FROM ticketdata', [], (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }
        rows.forEach((row) => { dataDictionary[row.key] = row.value;});
        const verticalList = Object.entries(dataDictionary)
         .map(([key, value]) => `**${key}** :  ${value}`)
         .join('\n'); 
        if (!verticalList){
          verticalList = "no codes registered yet!";
        }
        const embed = new EmbedBuilder()
          .setColor(16777215)
          .setAuthor({ name: "Code list" })
          .setDescription(verticalList)
          .setFooter({
            text: ' ',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        db.close();
        interaction.followUp({embeds: [embed],});

      });

    } else {
      throw new HypixelDiscordChatBridgeError("Wrong usage: /ticket (add/remove/list) [code] [value]");
    }

  },
};

  
