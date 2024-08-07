const { SuccessEmbed } = require("../../contracts/embedHandler.js");

module.exports = {
  name: "helpermute",
  description: "Mutes the given user for one hour.",
  moderatorOnly: true,
  requiresBot: true,
  options: [
    {
      name: "name",
      description: "Minecraft Username",
      type: 3,
      required: true,
    },
  ],

  execute: async (interaction) => {
    const name = interaction.options.getString("name");
    bot.chat(`/g mute ${name} 1h`);

    const embed = new SuccessEmbed(`Successfully muted **${name}** for 1 hour.`);

    await interaction.followUp({
      embeds: [embed],
    });
  },
};