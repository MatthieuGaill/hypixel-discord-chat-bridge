const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { getPlayer } = require("../../contracts/reputation.js");


module.exports = {
  name: "profile",
  description: "Display the reputation profile of a member",
  options: [
    {
      name: "member",
      description: "member",
      type: 6,
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

    try{
        member = interaction.options.getMember("member");

        if (!member){
          throw `Put a valid member! (select one in the 2nd option)`;
        }
        const embed = await getPlayer(member);
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
