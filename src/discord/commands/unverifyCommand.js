const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { SuccessEmbed } = require("../../contracts/embedHandler.js");
const { getUsername } = require("../../contracts/API/mowojangAPI.js");
const { EmbedBuilder } = require("discord.js");
const { selectlink_discord, removelink_discord } = require("../../contracts/verify.js");

module.exports = {
  name: "unverify",
  description: "Remove your linked Minecraft account",
  verificationCommand: true,

  execute: async (interaction, user) => {
    try {

      if (user !== undefined){
        interaction.user = user;
      }
      const uuid =  await selectlink_discord(interaction.user.id);
      if (uuid === undefined) {
        throw new HypixelDiscordChatBridgeError(`You are not verified. Please run /verify to continue.`);
      }

      await removelink_discord(interaction.user.id);

      const updateRole = new SuccessEmbed(
        `You have successfully unlinked \`${await getUsername(uuid)}\`. Run \`/verify\` to link a new account.`,
        { text: `/help [command] for more information`, iconURL: "https://i.imgur.com/Fc2R9Z9.png" },
      );
      await interaction.followUp({ embeds: [updateRole] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor(15548997)
        .setAuthor({ name: "An Error has occurred" })
        .setDescription(`\`\`\`${error}\`\`\``)
        .setFooter({
          text: `/help [command] for more information`,
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });

      await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};