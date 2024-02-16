const sqlite3 = require('sqlite3');
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");


module.exports = {
  name: "profile",
  description: "Display the leaderboard",
  options: [
    {
      name: "member",
      description: "only if you chose member",
      type: 6,
      required: false,
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

    try{
        member = interaction.options.getMember("member");
        const db = new sqlite3.Database('replist.sqlite');

        if (!member){
          throw `Put a valid member! (select one in the 2nd option)`;
        }
        const embed = await getPlayer(db, member);
        await interaction.followUp({embeds: [embed]});
        
        
    } catch(e){
      const embed = new EmbedBuilder()
      .setColor("Red")
      .setAuthor({ name: "Error" })
      .setDescription(e)
      .setFooter({
        text: 'Reputation tool',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
      interaction.followUp({embeds: [embed], ephemeral: true});
    }
    

  },

};

  

async function getPlayer(db, member){
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM repdata WHERE key = ?', [member.id], (err, row) => {
      if (err) {
        reject("ERROR whilst reading data!");
      }
      if (!row){
        reject("No reputation data found for this member!");
      }
      const typerep = JSON.parse(row.typerep);
      const Label = [":blue_book: *Explaining*\u200B\u200B \u200B \u200B",
                    ":bank: *Loaning*\u200B \u200B \u200B \u200B \u200B \u200B \u200B",
                    ":tools: *Crafting*\u200B \u200B \u200B \u200B \u200B \u200B \u200B",
                    ":spider: *Slayer*\u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B",
                    ":crossed_swords: *Dungeon*\u200B \u200B \u200B \u200B \u200B \u200B",
                    ":gift: *Gifting*\u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B",
                    ":regional_indicator_o: *Other* \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B\u200B \u200B \u200B \u200B"];
      let detailList = ""
      for (let i = 0; i < 7; i++) {
        detailList += `${Label[i]} ${typerep[i]} \n`;
      }
      const fields = [
        { name: "Name", value: `<@${member.id}>`},
        { name: "Total Reputation", value: `${row.reputation}` },
        { name: "Details", value: detailList },
      ];

      const embed = new EmbedBuilder()
        .setColor(16777215)
        .setTitle(`User's reputation` )
        .setThumbnail(member.user.avatarURL())
        .addFields(fields)
        .setFooter({
          text: 'Reputation tool',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });

      db.close();
      resolve(embed)
    });
  });
}
  
