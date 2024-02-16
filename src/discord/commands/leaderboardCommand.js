const sqlite3 = require('sqlite3');
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");


module.exports = {
  name: "leaderboard",
  description: "Display the reputation leaderboard",
  options: [],
  
  execute: async (interaction) => {
    const user = interaction.member;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    } 

    try{
        const db = new sqlite3.Database('replist.sqlite');
        const embed = await getList(db);
        await interaction.followUp({embeds: [embed]});
        
    } catch(e){
      const embed = new EmbedBuilder()
      .setColor("Red")
      .setAuthor({ name: "Error" })
      .setDescription(e)
      .setFooter({
        text: 'Reputation tool',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
      interaction.followUp({embeds: [embed], ephemeral: true});
    }
    

  },

};

  
async function getList(db){
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM repdata', [], (err, rows) => {
        if (err) {
          reject(err);
        }
        const dataList = rows.map(row => [row.key, row.reputation]);
        dataList.sort((a, b) => b[1] - a[1]);

        let verticalList = dataList
         .map(item => `**<@${item[0]}>** :  ${item[1]}`)
         .join('\n'); 

        if (!verticalList){
          verticalList = "No reputation for anybody yet!";
        }
        const embed = new EmbedBuilder()
          .setColor(16777215)
          .setAuthor({ name: "Reputation list" })
          .setDescription(verticalList)
          .setFooter({
            text: 'Reputation tool',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        db.close();
        resolve(embed)
      });
    });
  }
