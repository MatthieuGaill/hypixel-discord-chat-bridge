const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const config = require("../../../config.json");
const { EmbedBuilder } = require("discord.js");
const Logger = require("../.././Logger.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      if (!interaction.inGuild()) {
        await interaction.reply({ content: 'Sorry, commands cannot be used in private messages.', ephemeral: true });
        return;
      }
      if (interaction.isChatInputCommand()) {
        await interaction.deferReply({ ephemeral: false }).catch(() => {});

        const command = interaction.client.commands.get(interaction.commandName);
        if (command === undefined) {
          return;
        }

        Logger.discordMessage(`${interaction.user.username} - [${interaction.commandName}]`);
        await command.execute(interaction);
      }
    } catch (error) {
      console.log(error);

      const errrorMessage =
        error instanceof HypixelDiscordChatBridgeError === false
          ? "Please try again later. The error has been sent to the Developers.\n\n"
          : "";
      const errorEmbed = new EmbedBuilder()
        .setColor(15548997)
        .setAuthor({ name: "An Error has occurred" })
        .setDescription(`${errrorMessage}\`\`\`${error}\`\`\``)
        .setFooter({
          text: `/help [command] for more information`,
          iconURL: "https://imgur.com/Fc2R9Z9",
        });

      await interaction.editReply({ embeds: [errorEmbed] });

      if (error instanceof HypixelDiscordChatBridgeError === false) {
        const errorLog = new EmbedBuilder()
          .setColor(15158332)
          .setTitle("Error")
          .setDescription(
            `Command: \`${interaction.commandName}\`\nOptions: \`${JSON.stringify(
              interaction.options.data
            )}\`\nUser ID: \`${interaction.user.id}\`\nUser: \`${
              interaction.user.username ?? interaction.user.tag
            }\`\n\`\`\`${error.stack}\`\`\``
          )
          .setFooter({
            text: `Golden Bot`,
            iconURL: "https://imgur.com/Fc2R9Z9",
          });

        interaction.client.channels.cache.get(config.discord.channels.loggingChannel).send({
          content: `<@629735859653967912>`,
          embeds: [errorLog],
        });
      }
    }
  },
};
