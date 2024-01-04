const {
    Client,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    APIEmbedField,
    ButtonBuilder,
    ButtonStyle,
  } = require ("discord.js");
  const sqlite3 = require('sqlite3');
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
        const db = new sqlite3.Database('afkdatabase.sqlite');
        db.run('CREATE TABLE IF NOT EXISTS afkdata (key TEXT PRIMARY KEY, user TEXT NOT NULL, date TEXT, reason TEXT)');

          const guild = interaction.guild;
          const channel = guild.channels.cache.get("1100048976599863357");

          const delete_id = interaction.options.getString("delete_id");
          try{

          if (delete_id){
            await new Promise((resolve, reject) => {
              db.each(`
                SELECT key FROM afkdata
                WHERE key = $delete_id
              `, {
                $delete_id : delete_id,
              }, async function(error, row) {
                if (error) {
                  console.error('Error selecting rows:', error);
                  reject(error);
                } else {

                  const delete_Message = await channel.messages.fetch(row.key);
                  delete_Message.delete();
                }
              }, function (err, count) {
                //console.log('Iteration complete. Total rows:', count);
        
                resolve();
              });
            });

            db.run(`DELETE FROM afkdata WHERE key = ?`, [delete_id]);
          }


          const newEmbed = new EmbedBuilder()
          .setColor("Grey")
          .setTitle("**Expired :warning:**");

          
            date_now = Date.now();
            
            await new Promise((resolve, reject) => {
              db.each(`
                SELECT * FROM afkdata
                WHERE date < $specificDateTimestamp
              `, {
                $specificDateTimestamp: date_now,
              }, async function(error, row) {
                if (error) {
                  console.error('Error selecting rows:', error);
                  reject(error);
                } else {

                  const fetchedMessage = await channel.messages.fetch(row.key);
                  //fetchedMessage.delete();

                  const oldEmbed = fetchedMessage.embeds[0];
                  oldEmbed['data']['color'] = 9807270;
                  await fetchedMessage.edit({embeds: [oldEmbed,newEmbed]});
                  fetchedMessage.reply(`**<@${row.user}> your afk request has expired or will expire soon ** :warning:`)
                  
                }
              }, function (err, count) {
                //console.log('Iteration complete. Total rows:', count);
        
                resolve();
              });
            });
          } catch (error) {
            console.error('Error in processRows:', error);
          }


          db.run(`DELETE FROM afkdata WHERE date < $specificDateTimestamp`,
           {
            $specificDateTimestamp: date_now,
           }, function(error) {
            if (error) {
              console.error('Error deleting rows:', error);
            } else {
              console.log(`Deleted ${this.changes} rows`);
            }
          });

          const embed = await getList(db);
          await interaction.followUp( {embeds: [embed]});

    },

};


async function getList(db){
    const dataDictionary = {};
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM afkdata', [], (err, rows) => {
        if (err) {
          reject(err);
        }
        
        rows.forEach((row) => { dataDictionary[row.key] = [row.user, row.date, row.reason];});
        let verticalList = Object.entries(dataDictionary)
         .map(([key, [user, date, reason]]) => `**<@${user}>** :  <t:${Math.floor(date/1000)}:d> ${reason}  (${key})`)
         .join('\n'); 
        if (!verticalList){
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
        db.close();
        resolve(embed)
      });
    });
}


