const { getentry_id, removeentry } = require('../../contracts/moderation');
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");

module.exports = {
    name: "remove_modlog",
    description: "Remove a moderation log with a specified case Id",
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
            const channel = interaction.guild.channels.cache.get(config.discord.channels.moderationLogsChannel);
            const fetchedMessage = await channel.messages.fetch(row.messageId);
            await fetchedMessage.delete();
            await removeentry(caseId);

            const embed = new EmbedBuilder()
            .setColor("Gold")
            .setDescription(`Successfully removed from moderation logs **case ${caseId}**`)
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