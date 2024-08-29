const { getentry_id } = require('../../contracts/moderation');
const { EmbedBuilder } = require("discord.js");
const { getUsername } = require('../../contracts/API/mowojangAPI');

module.exports = {
    name: "case",
    description: "Show a sing mod log based on a case ID",
    options:[
        {
            name: "case_id",
            description: "case ID",
            type: 3,
            required: true,
        },        
    ],
    execute: async (interaction) => {
        try {
            const caseId = interaction.options.getString("case_id");
            const row = await getentry_id(caseId);
            if (!row){
                throw "Invalid case ID";
            }
            let user;
            console.log(row.discordId);
            if (row.discordId && row.discordId !== 0){
                user = await interaction.client.users.fetch(row.discordId);   
            }
            
            let mcname;
            if (row.uuid !== 0){
                mcname = await getUsername(row.uuid);
            } else{
                mcname = user.tag;
            }
            let modLogfields;
            if (row.type === 1){
                modLogfields = [
                    { name: `User`, value: `${mcname}`, inline: true },
                    { name: "Moderator", value: `${row.moderator}`, inline: true},
                    { name: "Length", value:`${row.duration}`, inline: true },
                    { name: "Reason", value: `${row.reason}`, inline: true },
                ];
            } else{
                modLogfields = [
                    { name: `User`, value: `${mcname}`, inline: true },
                    { name: "Moderator", value: `${row.moderator}`, inline: true},
                    { name: "Reason", value: `${row.reason}`, inline: true },
                ];                
            }
            
            const modlog = new EmbedBuilder()
            .setAuthor({
              name: `Case ${caseId} | ${row.type === 0 ? "Warn" : (row.type === 1 ? "Mute" : "Ban")} | ${mcname}`,
              iconURL: `${user? user.avatarURL() : "https://www.mc-heads.net/avatar/${mcname}"}`,
            })
            .addFields(modLogfields)
            .setColor("Gold")
            .setTimestamp()
            .setFooter({
              text: `${user? `ID: ${user.id}`: `UUID: ${row.uuid}`}`,
            });
            
      
            await interaction.followUp({embeds: [modlog]});
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
