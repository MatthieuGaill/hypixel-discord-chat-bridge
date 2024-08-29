const { getentry_id, setNewDuration } = require('../../contracts/moderation');
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { scheduleTimeout} = require('../other/Timeouts');

module.exports = {
    name: "duration",
    description: "modifies the duration of a current mute",
    options:[
        {
            name: "case_id",
            description: "case ID",
            type: 3,
            required: true,
        },
        {
            name: "new_duration",
            description: "new duration (format: 1m/1h/1d)",
            type: 3,
            required: true,
        },                
    ],
    execute: async (interaction) => {
        try {
            const caseId = interaction.options.getString("case_id");
            const duration = interaction.options.getString("new_duration")
            const ms_duration = durationToMilliSeconds(duration);
            if (ms_duration < 1000*60){
              throw "The mute must be at least 1 minute!";
            }
      
            if (ms_duration > 2592000000){
              throw "The mute cannot be more than 30 days!";
            }
            const row = await getentry_id(caseId);
            if (!row){
                throw "Invalid case ID";
            }
            if (row.type !== 1){
                throw "This case does not correspond to a mute!";
            }
            if (Date.now() > (row_mute.date + row_mute.duration) ){
                throw "Previous mute has already finished";
            }
            await setNewDuration(caseId, ms_duration);
            await scheduleTimeout(caseId, row.discordId, config.discord.commands.mutedRole, ms_duration);

            const channel = await interaction.guild.channels.cache.get(config.discord.channels.moderationLogsChannel);
            const fetchedMessage = await channel.messages.fetch(row.messageId).catch(e=>null)
            if (!fetchedMessage){
                throw "Updated reason successfully but couldn't update the message in moderation logs";
            }
            const oldEmbed = fetchedMessage.embeds[0];  
            const fields = oldEmbed['data']['fields'];
            fields[2] = {name: "Length", value: duration};
            
            await fetchedMessage.edit({ embeds: [oldEmbed] });
            

            const embed = new EmbedBuilder()
            .setColor("Gold")
            .setDescription(`Successfully updated reason of case ${caseId}`)
            .setFooter({
              text: 'Golden Legion Bot',
              iconURL: "https://i.imgur.com/Fc2R9Z9.png",
            });
      
            await interaction.followUp({embeds: [embed]});
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
            .setColor("Red")
            .setAuthor({ name: "Error" })
            .setDescription(error)
            .setFooter({
              text: 'Golden Legion Bot',
              iconURL: "https://i.imgur.com/Fc2R9Z9.png",
            });
            interaction.followUp({embeds: [embed], ephemeral: true});
        }
    },
};

function durationToMilliSeconds(duration) {
    // Regular expression to match the format (e.g., "1m", "1min", "1h", "1hour", "1d", "1day")
    const regex = /^(\d+)([a-zA-Z]+)$/;
    const match = duration.match(regex);
  
    if (!match) {
        throw new HypixelDiscordChatBridgeError('Invalid duration format: Use 1m, 1h or 1d');
    }
  
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
  
    let mseconds = 0;
  
    switch (unit) {
        case 's':
        case 'sec':
        case 'second':
        case 'seconds':
            mseconds = value * 1000;
            break;
        case 'm':
        case 'min':
        case 'minute':
        case 'minutes':
            mseconds = value * 60 * 1000;
            break;
        case 'h':
        case 'hour':
        case 'hours':
            mseconds = value * 3600 * 1000;
            break;
        case 'd':
        case 'day':
        case 'days':
            mseconds = value * 86400 * 1000;
            break;
        default:
            throw new Error('Unknown time unit');
    }
  
    return mseconds;
  }