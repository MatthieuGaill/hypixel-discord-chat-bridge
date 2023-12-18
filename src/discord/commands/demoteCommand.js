const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");

module.exports = {
  name: "demote",
  description: "Demotes the given user by one guild rank.",
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
    bot.chat(`/g demote ${name}`);

    const embed = new EmbedBuilder()
      .setColor(5763719)
      .setAuthor({ name: "Demote" })
      .setDescription(`Successfully executed \`/g demote ${name}\``)
      .setFooter({
        text: `/help [command] for more information`,
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });

    await interaction.followUp({
      embeds: [embed],
    });
  },
};
