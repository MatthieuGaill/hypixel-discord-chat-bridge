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
  

  execute: async (interaction) => {
    
    const discord_user = interaction.member;
    const user = interaction.options.getString("username");
    let date = interaction.options.getString("date");
    const reason = interaction.options.getString("reason");
    
    const guild = interaction.guild;
    const channel = guild.channels.cache.get("1100048976599863357");

    const dateFormatRegex = /^(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/;
    try{
    if (!dateFormatRegex.test(date)){
      throw `Wrong date format! Use DD/MM/YYYY. (for example today is <t:${Math.floor(Date.now()/1000)}:d> )`;
      
    }
    
    const fields = [
      { name: "Username", value: user !== undefined ? user : "N/A" },
      { name: "Date", value: date !== undefined ? date : "N/A", inline: true },
      { name: "Reason", value: reason !== undefined ? reason : "N/A" },
    ];

    date = convertDateFormatToTimestamp(date);
    daysDiff = DateChecking(date);
    //const hasMajor = interaction.member.roles.cache.has('819232680305754132');
    const hasCaptain = interaction.member.roles.cache.has('819233568374390815');
    const hasLieutenant = interaction.member.roles.cache.has('819233569401995294');
    const hasSergeant = interaction.member.roles.cache.has('819233569864024067');
    const hasSoldier = interaction.member.roles.cache.has('819233714558730311');

    if (daysDiff <= 0){
      throw `You cannot put a date in the past! (*you put <t:${date/1000}:d>*)`;
    } 
      
    if (hasCaptain && daysDiff > 93){
      throw `<@&819233568374390815> rank cannot make afk requests longer than 3 months! (*But you can renew them*)`;
    }
    if(hasLieutenant && daysDiff > 62){
      throw `<@&819233569401995294> rank cannot make afk requests longer than 2 months! (*But you can renew them*)`;
    }
    if(hasSergeant && daysDiff > 31){
      throw `<@&819233569864024067> rank cannot make afk requests longer than 1 months! (*But you can renew them*)`;
    }
    if (hasSoldier && daysDiff > 15.5){
      throw `<@&819233714558730311> rank cannot make afk requests longer than 2 weeks! (*But you can renew them*)`;
    }


    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("AFK Request")
      .addFields(fields)
      .setThumbnail(interaction.user.avatarURL())
      .setTimestamp(interaction.createdAt)
      .setFooter({
        iconURL: interaction.user.avatarURL(),
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

    const response = await interaction.editReply({
      embeds: [embed],
      components: [{ type: 1, components: [approve, deny] }],
    });

      
      const db = new sqlite3.Database('afkdatabase.sqlite');
      db.run('CREATE TABLE IF NOT EXISTS afkdata (key TEXT PRIMARY KEY, user TEXT NOT NULL, date DATETIME, reason TEXT)');
      //const roleFilter = (i) => i.member.roles.cache.has("1109878759789695058");
      const allowedRoleIds = ["1057805939115298888", "1114539766407503873"];
      const roleFilter = (i) => {
      return allowedRoleIds.some(roleId => i.member.roles.cache.has(roleId));
      };

      const action = await response.awaitMessageComponent({filter: roleFilter});

      if (action.customId === "approved") {
        db.run('INSERT OR REPLACE INTO afkdata (key, user, date, reason) VALUES (?, ?, ?, ?)', [response.id, discord_user.id, date, reason]);
        await action.update({
          embeds: [
            embed
              .setColor("Green")
              .setFooter({
                text: `Approved at`,
                iconURL: action.user.avatarURL(),
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
                iconURL: action.user.avatarURL(),
              })
              .setTimestamp(Date.now()),
          ],
          components: [],
        });

        
        const message_reply = await channel.messages.fetch(response.id);
        message_reply.reply(`<@${discord_user.id}> your request was denied! Please read the **pinned** message **carefully** before making a new request.`);
        
        // await interaction.editReply({
        //   content: `<@${discord_user.id}> you request was denied! Read the **pinned** message **carefully** before making a request.`,
        //   components: [],
        // });
      }


    } catch (e) {
      await interaction.editReply({
        content: `**ERROR** <@${discord_user.id}> ${e}`,
        components: [],
      });
      console.error(e);
      //throw new HypixelDiscordChatBridgeError(`${e}`);
    }
    
  },
}


function convertDateFormatToTimestamp(dateString) {
  const [day, month, year] = dateString.split('/');
  const dateObject = new Date(`${year}-${month}-${day}`);
  const timestamp = dateObject.getTime();

  return timestamp;
}

function DateChecking(date){
  const date_now = new Date();
  const daysDiff = (date - date_now.getTime())/ (1000 * 60 * 60 * 24);

  return daysDiff
}
