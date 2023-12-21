import {
  Client,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  APIEmbedField,
  ButtonBuilder,
  ButtonStyle,
  time,
} from "discord.js";

module.exports = {
  name: "afk",
  description: "Request afk form",
  disabled: false,
  debug: false,
  options: [
    {
      name: "username",
      description: "In-Game Username",
      required: true,
      type: 3,
    },
    {
      name: "duration",
      description: "How long you'll be away",
      required: true,
      type: 3,
    },
    {
      name: "reason",
      description: "Reason for being away",
      required: true,
      type: 3,
    },
  ],
  permissions: [],
  callback: async (
    client: Client,
    interaction: ChatInputCommandInteraction,
  ) => {
    const user = interaction.options.getString("username");
    const duration = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason");

    const fields: APIEmbedField[] = [
      { name: "Username", value: user! },
      { name: "Duration", value: duration!, inline: true },
      { name: "Reason", value: reason! },
    ];

    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("AFK Request")
      .addFields(fields)
      .setThumbnail(interaction.user.avatarURL())
      .setTimestamp(interaction.createdAt)
      .setFooter({
        iconURL: interaction.user.avatarURL()!,
        text: "Requested at",
      });

    const approve = new ButtonBuilder()
      .setCustomId("approved")
      .setLabel("Approve")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);
    const deny = new ButtonBuilder()
      .setCustomId("denied")
      .setLabel("Deny")
      .setEmoji("✖")
      .setStyle(ButtonStyle.Danger);

    const response = await interaction.reply({
      embeds: [embed],
      components: [{ type: 1, components: [approve, deny] }],
    });

    try {
      // TODO: Setup filter to prevent non-Staff from approving/denying applications
      const action = await response.awaitMessageComponent();

      if (action.customId === "approved") {
        await action.update({
          embeds: [
            embed
              .setColor("Green")
              .setFooter({
                text: `Approved at`,
                iconURL: action.user.avatarURL()!,
              })
              .setTimestamp(Date.now()),
          ],
          components: [],
        });
      } else if (action.customId === "denied") {
        await action.update({
          embeds: [
            embed
              .setColor("Red")
              .setFooter({
                text: `Denied at`,
                iconURL: action.user.avatarURL()!,
              })
              .setTimestamp(Date.now()),
          ],
          components: [],
        });
      }
    } catch (e) {
      await interaction.editReply({
        content: `Error occured: ${e}`,
        components: [],
      });
      
    }
  },
}
