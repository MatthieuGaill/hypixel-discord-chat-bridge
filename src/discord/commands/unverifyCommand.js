const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { removeentry, selectentry_discord } = require("../../contracts/verify.js");
const { checkdonator, UpdateRoles } = require("../../contracts/donator.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { getUsername } = require("../../contracts/API/mowojangAPI.js");



module.exports = {
  name: "unlink",
  description: "Unlink your discord",

  execute: async (interaction) => {
    const user = interaction.member;
    const guild = interaction.guild;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }

    try {
        const test = await selectentry_discord(user.id);
        
        if (!test){
            throw `Your discord (${user.username}) is not linked to any minecraft account (Run /link to do so)`;
        }
        
        const mcusername = getUsername(test);
        await removeentry(test);
        await UpdateRoles(guild, false, user.id, test);

        const embed = new EmbedBuilder()
          .setColor(2067276)
          .setTitle("Success")
          .setDescription(`Successfully unlinked \`${mcusername}\` to <@${user.id}>`)
          .setFooter({
            text: 'Link Tool',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
          });
        await interaction.followUp({embeds: [embed],});

      
    } catch(e){
      console.error(e);
      const embed = new EmbedBuilder()
      .setColor(15105570)
      .setTitle("Error")
      .setDescription(e)
      .setFooter({
        text: 'Link Tool',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
      await interaction.followUp({embeds: [embed],});
      //throw new HypixelDiscordChatBridgeError(`${e}`);
    }

  },

};

