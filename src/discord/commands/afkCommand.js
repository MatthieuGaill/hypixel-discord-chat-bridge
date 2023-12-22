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
const sqlite3 = require('sqlite3');
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { AfkCollections } = require('discord-afk-js');
const moment = require('moment');

const afk = new AfkCollections();

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
      name: "date",
      description: "End of afk date in DD/MM/YYYY format!",
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
    const discord_user = interaction.member;
    const user = interaction.options.getString("username");
    const date = interaction.options.getString("date");
    const reason = interaction.options.getString("reason");
    const dateFormatRegex = /^(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/;

    if (!dateFormatRegex.test(date);){
      throw new HypixelDiscordChatBridgeError(`Wrong date format! Use DD/MM/YYYY. (for example today is <d:${Date.now()}> )`);
    }
  
    // const fields: APIEmbedField[] = [
    //   { name: "Username", value: user! },
    //   { name: "Date", value: date!, inline: true },
    //   { name: "Reason", value: reason! },
    // ];

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
      if (!["629735859653967912"].includes(discord_user.id)){
        return;
      }
      
      const db = new sqlite3.Database('database.sqlite');
      db.run('CREATE TABLE IF NOT EXISTS afkdata (key TEXT PRIMARY KEY, value TEXT)');
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
        db.run('INSERT OR REPLACE INTO afkdata (key, date, reason) VALUES (?, ?, ?)', [user_discord.id, date, reason]);
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
