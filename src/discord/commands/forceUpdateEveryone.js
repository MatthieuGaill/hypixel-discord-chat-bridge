const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const { selectlink_discord, removelink_discord, getAllLinks } = require("../../contracts/verify.js");

module.exports = {
  name: "force-update-everyone",
  description: "Update a user's roles",
  moderatorOnly: true,
  verificationCommand: true,

  execute: async (interaction, doNotRespond = false) => {
    try {
      const updateRolesCommand = require("./updateCommand.js");
      if (!updateRolesCommand) {
        throw new HypixelDiscordChatBridgeError("The update command does not exist. Please contact an administrator.");
      }

      const allLinks = await getAllLinks();
      if (!allLinks || allLinks.length === 0) {
        throw new HypixelDiscordChatBridgeError("No linked data found. Please contact an administrator.");
      }

      if (doNotRespond === false) {
        const embed = new EmbedBuilder()
          .setColor(3447003)
          .setTitle("Updating Users")
          .setDescription(`Progress: 0 / ${allLinks.length} (\`0%\`)`)
          .setFooter({
            text: `/help [command] for more information`,
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
          });

        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }

      const description = [];
      for (let i = 0; i < allLinks.length; i++) {
        const { discordId } = allLinks[i];
        const user = await interaction.guild.members.fetch(discordId).catch(() => {});

        if (!user) {
          await removelink_discord(discordId);
          continue;
        }

        interaction.member = undefined;
        await updateRolesCommand.execute(interaction, user.user, true).catch(() => {
          description.push(`- <@${discordId}>`);
        });

        if (doNotRespond === false) {
          const embed = new EmbedBuilder()
            .setColor(3447003)
            .setTitle("Updating Users")
            .setDescription(
              `Progress: ${i + 1} / ${allLinks.length} (\`${(((i + 1) / allLinks.length) * 100).toFixed(2)}%\`)`,
            )
            .setFooter({
              text: `/help [command] for more information`,
              iconURL: "https://i.imgur.com/Fc2R9Z9.png",
            });

          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      }

      if (doNotRespond === false) {
        if (description.length > 0) {
          description.unshift(`\n__**Failed to update:**__`);
        }

        description.unshift(`Updated **${allLinks.length}** users.`);

        const embed = new EmbedBuilder()
          .setColor(3447003)
          .setTitle("Users Updated")
          .setDescription(description.join("\n"))
          .setFooter({
            text: `/help [command] for more information`,
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
          });

        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor(15548997)
        .setAuthor({ name: "An Error has occurred" })
        .setDescription(`\`\`\`${error}\`\`\``)
        .setFooter({
          text: `/help [command] for more information`,
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
