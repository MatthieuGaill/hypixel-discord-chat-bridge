// const {
//     Client,
//     ApplicationCommandOptionType,
//     ChatInputCommandInteraction,
//     EmbedBuilder,
//     APIEmbedField,
//     ButtonBuilder,
//     ButtonStyle,
//   } = require ("discord.js");
// const Database = require('better-sqlite3');
// const DiscordManager = require('../../discord/DiscordManager');
// const client = DiscordManager.client;



// setInterval(() => {
//     console.log(client)
//     const interactionMock = {
//       guild: client.guilds.cache.get('819229417796534283'), // Replace with your guild ID
//       options: { getString: () => null }, // Replace with appropriate mock if needed
//       followUp: (message) => console.log(message), // Replace with actual follow-up function
//     };
//     updateAfk.execute(interactionMock);
//   }, 60000); 



// setInterval(async () => {
//     try{       
//         const db = new Database('afkdatabase.sqlite');
//         db.prepare('CREATE TABLE IF NOT EXISTS afkdata (key TEXT PRIMARY KEY, user TEXT NOT NULL, date TEXT, reason TEXT)').run();

//         const guild =  await client.guilds.fetch("819229417796534283");// client.guilds.cache.get("819229417796534283"); 
//         const channel = guild.channels.cache.get("1100048976599863357");

          
//         date_now = Date.now();
        
//         const rows = db.prepare('SELECT * FROM afkdata WHERE date < ?').all(date_now);
//         for (const row of rows) {
//           const fetchedMessage = await channel.messages.fetch(row.key);
//           const oldEmbed = fetchedMessage.embeds[0];
//           oldEmbed['data']['color'] = 9807270;
//           await fetchedMessage.edit({ embeds: [oldEmbed, newEmbed] });
//           fetchedMessage.reply(`**<@${row.user}> your afk request has expired or will expire soon ** :warning:`);
//         }
  
//         db.prepare('DELETE FROM afkdata WHERE date < ?').run(date_now);

//     } catch (error) {
//     console.error(error);
//     }

// }, 60000); //86400000



