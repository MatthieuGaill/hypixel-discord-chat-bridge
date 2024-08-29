const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { getList } = require("../../contracts/reputation.js");

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
        const dataDictionary = await getList(interaction.guild);

        let verticalList = Object.entries(dataDictionary)
        .sort(([, a], [, b]) => b - a)
        .map(item => `${item[0]} :  ${item[1]}`)
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
        await interaction.followUp({embeds: [embed]});
        
    } catch(e){
      console.error(e);
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