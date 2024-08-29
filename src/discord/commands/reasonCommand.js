const { getentry_id, updateReason } = require('../../contracts/moderation');
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");

module.exports = {
    name: "reason",
    description: "Supply a reason to a case",
    options:[
        {
            name: "case_id",
            description: "case ID",
            type: 3,
            required: true,
        },
        {
            name: "new_reason",
            description: "new reason",
            type: 3,
            required: true,
        },                
    ],
    execute: async (interaction) => {
        try {
            const caseId = interaction.options.getString("case_id");
            const reason = interaction.options.getString("new_reason")
            const row = await getentry_id(caseId);
            if (!row){
                throw "Invalid case ID";
            }
            const channel = await interaction.guild.channels.cache.get(config.discord.channels.moderationLogsChannel);
            const fetchedMessage = await channel.messages.fetch(row.messageId);
            const oldEmbed = fetchedMessage.embeds[0];  
            const fields = oldEmbed['data']['fields'];
            if (row.type === 1){
                fields[3] = {name: "Reason", value: reason};
            } else{
                fields[2] = {name: "Reason", value: reason};
            }

            await fetchedMessage.edit({ embeds: [oldEmbed] });
            await updateReason(row.id, reason);

            const embed = new EmbedBuilder()
            .setColor("Gold")
            .setDescription(`Successfully updated reason of case ${row.id}`)
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