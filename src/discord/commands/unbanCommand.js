const { EmbedBuilder } = require("discord.js");
const { getentry_ban } = require("../../contracts/moderation");
const config = require("../../../config.json");

module.exports = {
    name: 'unban',
    description: 'Unban a user from **discord** (only)',
    options: [
      {
        name: 'user_id',
        description: 'The ID of the user to unban',
        type: 3, // STRING type for user ID
        required: true,
      },
      {
        name: 'reason',
        description: 'The reason for unbanning',
        type: 3, // STRING type
        required: false,
      },
    ],
  
    execute: async (interaction) => {
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            const row_unban = await getentry_ban(userId);

            if (!row_unban){
                throw "Invalid Id or this user is not banned";
            }
            const user = await interaction.client.users.fetch(userId);
            await interaction.guild.members.unban(userId, reason);
            const moderation_channel = await interaction.guild.channels.fetch(config.discord.channels.moderationLogsChannel);

            const caseId = parseInt(row_unban.id);
            const modLogfields = [
              { name: `User`, value: `<@${user.id}>`, inline: true },
              { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true},
              { name: "Reason", value: `${reason}`, inline: true },
            ];
            const modlog = new EmbedBuilder()
            .setAuthor({
              name: `Case ${caseId} | Unban | ${user.tag}`,
              iconURL: user.avatarURL(),
            })
            .addFields(modLogfields)
            .setColor("Green")
            .setTimestamp()
            .setFooter({
              text: `ID: ${user.id}`,
            });
            await moderation_channel.send({embeds : [modlog]});

            const appealEmbed = new EmbedBuilder()
            .setTitle(`${user.tag} has been unbanned from ⭐ **Golden Legion** ⭐`)
            .setColor("Gold")
            .setDescription(`Welcome back! ([server link](https://discord.com/invite/FssyYfbkSv))`);

            const logs_channel = await interaction.client.channels.fetch("1277735874133757974");
            await logs_channel.send({content: `<@${userId}>`,embeds : [appealEmbed]});
            // user.send({ embeds: [appealEmbed] })
            // .catch(async (error) => {
            //     let errmsg;
            //     if (error.code === 50007){  // Cannot send messages to this user
            //         console.log(`Could not send DM to ${user.tag}. They might have DMs disabled or blocked the bot.`);
            //         errmsg = "The user could not be notified via DM about their **unban**. They might have DMs disabled or have blocked the bot.";
            //     }else{
            //         console.error(error);
            //         errmsg = error;
            //     }
            //     const fallbackEmbed = new EmbedBuilder()
            //         .setColor("Red")
            //         .setTitle(`Warning: ${user.tag}`)
            //         .setDescription(errmsg)
            //         .setTimestamp()
            //         .setFooter({ text: `Case ID: ${caseId}` });
    
            //     moderation_channel.send({ embeds: [fallbackEmbed] });
    
            // });
            if (!interaction.doNotRespond){
                const embed = new EmbedBuilder()
                .setColor("Gold")
                .setDescription(`Successfully unbanned <@${userId}>.`);
                await interaction.followUp({embeds: [embed]});
            }
            
        } catch (error) {
            console.error(error);
            if (!interaction.doNotRespond){
                const errEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(error)
                .setFooter({
                    text: 'Golden Legion Bot',
                    iconURL: "https://i.imgur.com/Fc2R9Z9.png",
                });
   
                await interaction.followUp({ embeds: [errEmbed] });
            }
        }
    },
  };
  