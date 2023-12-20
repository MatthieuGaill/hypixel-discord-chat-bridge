const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");

module.exports = {
  name: "helpermute",
  description: "Mutes the given user for one hour.",
  options: [
    {
      name: "name",
      description: "Minecraft Username",
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

    const name = interaction.options.getString("name");
    bot.chat(`/g mute ${name} 1h`);

    const embed = new EmbedBuilder()
      .setColor(5763719)
      .setAuthor({ name: "HelperMute" })
      .setDescription(`Successfully executed \`/g mute ${name} 1h\``)
      .setFooter({
        text: `/help [command] for more information`,
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });

    await interaction.followUp({
      embeds: [embed],
    });
  },
};
