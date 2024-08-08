const {
  Client,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  APIEmbedField,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Database = require('better-sqlite3');
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");

module.exports = {
  name: "updateafk",
  description: "Update & list of afk requests",
  options: [
    {
      name: "delete_id",
      description: "afk request (message id) to remove (optional)",
      required: false,
      type: 3,
    },
  ],

  execute: async (interaction) => {
    const db = new Database('afkdatabase.sqlite');
    db.prepare('CREATE TABLE IF NOT EXISTS afkdata (key TEXT PRIMARY KEY, user TEXT NOT NULL, date TEXT, reason TEXT)').run();

    //const guild = interaction.guild;
    
    //const channel = interaction.client.channels.fetch("1100048976599863357");

    //const channel = interaction.channel1;
    const channel = guild.channels.cache.get("1100048976599863357");

    try {
      if (!interaction.options){
        const delete_id = interaction.options.getString("delete_id");
        if (delete_id) {
          const row = db.prepare('SELECT key FROM afkdata WHERE key = ?').get(delete_id);
          if (row) {
            const delete_Message = await channel.messages.fetch(row.key);
            delete_Message.delete();
          }
          db.prepare('DELETE FROM afkdata WHERE key = ?').run(delete_id);
        }
      }

      const newEmbed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("**Expired :warning:**");

      const date_now = Date.now();

      const rows = db.prepare('SELECT * FROM afkdata WHERE date < ?').all(date_now);
      for (const row of rows) {
        const fetchedMessage = await channel.messages.fetch(row.key);
        const oldEmbed = fetchedMessage.embeds[0];
        oldEmbed['data']['color'] = 9807270;
        await fetchedMessage.edit({ embeds: [oldEmbed, newEmbed] });
        fetchedMessage.reply(`**<@${row.user}> your afk request has expired or will expire soon ** :warning:`);
      }

      db.prepare('DELETE FROM afkdata WHERE date < ?').run(date_now);

      const embed = await getList(db);
      if (interaction === null){
        const channel2 = guild.channels.cache.get("821482920509833246");
        channel2.send({ embeds: [embed] });
      } else{
        await interaction.followUp({ embeds: [embed] });
      }
      

    } catch (error) {
      console.error('Error in processRows:', error);
    } finally {
      db.close();
    }
  },
};

async function getList(db) {
  const dataDictionary = {};
  const rows = db.prepare('SELECT * FROM afkdata').all();
  rows.forEach((row) => {
    dataDictionary[row.key] = [row.user, row.date, row.reason];
  });

  let verticalList = Object.entries(dataDictionary)
    .map(([key, [user, date, reason]]) => `**<@${user}>** :  <t:${Math.floor(date / 1000)}:d> ${reason}  (${key})`)
    .join('\n');

  if (!verticalList) {
    verticalList = "No Afk requests!";
  }

  const embed = new EmbedBuilder()
    .setColor(16777215)
    .setAuthor({ name: "Current Afk requests" })
    .setDescription(verticalList)
    .setFooter({
      text: ' ',
      iconURL: "https://i.imgur.com/Fc2R9Z9.png",
    });

  return embed;
}