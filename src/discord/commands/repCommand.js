const sqlite3 = require('sqlite3');
const { EmbedBuilder } = require("discord.js");
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const config = require("../../../config.json");


module.exports = {
  name: "rep",
  description: "Give a reputation to a member",
  options: [
    {
      name: "member",
      description: "member of the guild",
      type: 6,
      required: true,
    },
    {
      name: "choice",
      description: "reason you want to give the reputation",
      type: 3,
      required: true,
      choices: [
        {
          name: "Explaining (Answer questions, help about a subject)",
          value: "Explaining :blue_book:*0",
        },
        {
          name: "Loaning (money or items)",
          value: "Loaning :bank:*1",

        },
        {
          name: "Crafting (help craft any item)",
          value: "Crafting :tools:*2",
        },
        {
          name: "Slayer carries",
          value: "Slayer :spider:*3",
        },
        {
          name: "Dungeon carries",
          value: "Dungeon :crossed_swords:*4",
        },
        {
          name: "Gifting (items, rank, ...)",
          value: "Gifting :gift:*5",
        },
        {
          name: "Other (you can use the comment option)",
          value: "Other :regional_indicator_o:*6",
        }
      ],
    },
    {
      name: "comment",
      description: "comment",
      type: 3,
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
        if (!member){
            throw `Put a valid member! (select one in the menu)`;
        }
        const member_id = member.id;
        if (member.user.bot){
            throw `You cannot give reputation to a bot!`;
        }
        if (member_id === interaction.member.id){
            throw "You cannot give reputation to yourself!";
        }


        const [choice, choiceIndex] = interaction.options.getString("choice").split('*');
        const comment = interaction.options.getString("comment");
        const add_msg = comment !== null? 
        `Successfully added a reputation to <@${member_id}>, *${choice}* (${comment})` : `Successfully added a reputation to <@${member_id}>, *${choice}* `;
        const db = new sqlite3.Database('replist.sqlite');
        db.run('CREATE TABLE IF NOT EXISTS repdata (key TEXT PRIMARY KEY, reputation INTEGER, typerep TEXT)');
        const trusted = await Updatedatabase(db, member_id, choiceIndex);

        db.close();

        const embed = new EmbedBuilder()
        .setColor(2067276)
        .setAuthor({ name: `Reputation added`})
        .setDescription(add_msg)
        .setFooter({
        text: 'Reputation tool',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });

        console.log(`trusted: ${trusted}`)

        const response = await interaction.followUp({embeds: [embed]});

        if (trusted){
          const guild = interaction.guild;
          const channel = interaction.channel;
          const message_reply = await channel.messages.fetch(response.id);
          console.log(`member_id : ${member_id}`)
          const role = guild.roles.cache.get("1168595595989094541");
          member.roles.add(role)
              .then(() => {
                message_reply.reply(`Congratulations <@${member_id}> you've reached 10 reputations, You earn the **Trusted** Role :tada:`);
              })
              .catch((error) => {
                console.error('Error adding role:', error);
              });
        }

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


async function Updatedatabase(db, member_id, choiceIndex) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get('SELECT * FROM repdata WHERE key = ?', [member_id], (err, row) => {
    
        if (err) {
          console.error(err.message);
          reject(err.message);
        }
        if (!row) {
          let newType = [0,0,0,0,0,0,0];
          newType[choiceIndex] = 1
          db.run('INSERT INTO repdata (key, reputation, typerep) VALUES (?, 1, ?)', [member_id, JSON.stringify(newType)]);
          resolve(false);
        } else {
          let updatedType = JSON.parse(row.typerep);
          updatedType[choiceIndex] = updatedType[choiceIndex] + 1;
          db.run('UPDATE repdata SET reputation = reputation + 1, typerep = ? WHERE key = ?', [JSON.stringify(updatedType), member_id]);

          if (row.reputation === 9){
            resolve(true);
          } else{
            resolve(false);
          }
        }
      });
    });
  });
}
