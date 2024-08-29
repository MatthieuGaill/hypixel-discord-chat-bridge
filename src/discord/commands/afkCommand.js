const {EmbedBuilder, ButtonBuilder,ButtonStyle, ActionRowBuilder} = require ("discord.js");
const config = require("../../../config.json");
const { resolveUsernameOrUUID } = require("../../contracts/API/mowojangAPI");


const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const monthChoices = months.map((month, index) => ({
  name: month,
  value: `${index + 1}`.padStart(2,'0'),
}));

const yearChoices = [2024,2025,2026,2027].map((year, index) => ({
  name: year,
  value: `${year}`
}));

module.exports = {
  name: "afk",
  description: "Request afk form",
  disabled: false,
  debug: false,
  options: [
    {
      name: "username",
      description: "In-Game Username (or your uuid)",
      required: true,
      type: 3,
    },
    {
      name: "day",
      description: "Day (from 01 to 31) when your afk request ends",
      required: true,
      type: 3,
    },
    {
      name: "month",
      description: "Month when your afk request ends",
      required: true,
      type: 3,
      choices: monthChoices,
    },
    {
      name: "year",
      description: "Year when your afk request ends",
      required: true,
      type: 3,
      choices: yearChoices,
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
    const day = interaction.options.getString("day").padStart(2, '0');
    const month = interaction.options.getString("month");
    const year = interaction.options.getString("year");
    const reason = interaction.options.getString("reason");
    
    //const guild = interaction.guild;
    //const afk_channel = await guild.channels.cache.get(config.discord.channels.afkChannel);

    try{
      if (!/^(0[1-9]|1\d|2[0-9]|3[0-1])$/.test(day)){
        throw `Invalid day of a month! it must go from (0)1 to 31`;
      }
      const date = convertDateFormatToTimestamp(day, month, year);
      const date_format = `<t:${date/1000}:d>`;     
      if (!user){
        throw "Please put a valid username";
      }
      const dataUUID = await resolveUsernameOrUUID(user);
      if (!dataUUID){
        throw "Invalid username or UUID";
      }
      const username = dataUUID['username'];
  

      daysDiff = DateChecking(date);
      //const hasMajor = interaction.member.roles.cache.has('819232680305754132');
      const hasCaptain = interaction.member.roles.cache.has('819233568374390815');
      const hasLieutenant = interaction.member.roles.cache.has('819233569401995294');
      const hasSergeant = interaction.member.roles.cache.has('819233569864024067');
      const hasSoldier = interaction.member.roles.cache.has('819233714558730311');
  
      if (daysDiff <= 0){
        throw `You cannot put a date in the past! (*you put ${date_format}*)`;
      } 
        
      if (hasCaptain && daysDiff > 93){
        throw `Captain rank cannot make afk requests longer than 3 months! (*But you can renew them*)`;
      }
      if(hasLieutenant && daysDiff > 62){
        throw `Lieutenant rank cannot make afk requests longer than 2 months! (*But you can renew them*)`;
      }
      if(hasSergeant && daysDiff > 31){
        throw `Sergeant rank cannot make afk requests longer than 1 months! (*But you can renew them*)`;
      }
      if (hasSoldier && daysDiff > 15.5){
        throw `Soldier rank cannot make afk requests longer than 2 weeks! (*But you can renew them*)`;
      }
  
        const fields = [
        { name: "Username", value: `${username} (${discord_user.id})` },
        { name: "Date", value: date_format !== undefined ? date_format : "N/A" },
        { name: "Reason", value: reason !== undefined ? reason : "N/A" },
      ];

      const embed = new EmbedBuilder()
        .setColor("White")
        .setTitle(`AFK Request`)
        .addFields(fields)      
        .setThumbnail(interaction.user.avatarURL())
        .setTimestamp(interaction.createdAt)
        .setFooter({
          iconURL: interaction.user.avatarURL(),
          text: "Requested at",
        });

      //const afk_msg = await afk_channel.send({embeds: [embed] });
      const afk_msg = await interaction.followUp({embeds: [embed]});
      const msg_id = afk_msg.id;
  
      const approve = new ButtonBuilder()
        .setCustomId(`afk${msg_id}yes`)
        .setLabel("Approve")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success);
      const deny = new ButtonBuilder()
        .setCustomId(`afk${msg_id}no`)
        .setLabel("Deny")
        .setEmoji("✖")
        .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(approve, deny);
        await afk_msg.edit({ components: [row] });
        //await interaction.followUp({content: ""});
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


function convertDateFormatToTimestamp(day, month, year) {
  const dateObject = new Date(`${year}-${month}-${day}`);
  const timestamp = dateObject.getTime();

  return timestamp;
}

function DateChecking(date){
  const date_now = new Date();
  const daysDiff = (date - date_now.getTime())/ (1000 * 60 * 60 * 24);

  return daysDiff
}
