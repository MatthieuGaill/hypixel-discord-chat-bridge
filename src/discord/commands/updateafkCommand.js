const {EmbedBuilder} = require("discord.js");
const { getExpiredAfks, getAllAfks, getAndRemove } = require("../../contracts/afk.js");
const config = require("../../../config.json");

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

    //const guild = interaction.guild;
    //const channel = interaction.client.channels.fetch("1100048976599863357");
    //const channel = interaction.channel1;

    const channel = guild.channels.cache.get(config.discord.channels.afkChannel);

    try {
      if (interaction !== null){
        if (interaction.options){
          const delete_id = interaction.options.getString("delete_id");
          if (delete_id) {
            const test_row = await getAndRemove(delete_id);
            if (test_row) {
              const delete_Message = await channel.messages.fetch(delete_id).catch(e => null);
              if (delete_Message){
                await delete_Message.delete();
              }
            }
          }
        }
      }

      const newEmbed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("**Expired :warning:**");


      const rows = await getExpiredAfks();
      if (rows){
        for (const row of rows) {
          const fetchedMessage = await channel.messages.fetch(row.key);
          const oldEmbed = fetchedMessage.embeds[0];
          oldEmbed['data']['color'] = 9807270;
          await fetchedMessage.edit({ embeds: [oldEmbed, newEmbed] });
          fetchedMessage.reply(`**<@${row.user}> your afk request has expired or will expire soon ** :warning:`);
        }
      }

      const embed = await getList();
      if (interaction === null){
        //const channel2 = guild.channels.cache.get(config.discord.channels.afkChannel);
        channel.send({ embeds: [embed] });
      } else{
        await interaction.followUp({ embeds: [embed] });
      }
      

    } catch (error) {
      console.error(error);
    }
  },
};

async function getList() {
  const dataDictionary = {};
  const rows = await getAllAfks();
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