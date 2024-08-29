const { randomBytes } = require('node:crypto');
const { setAppeal } = require('../../contracts/moderation');
const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "appeal",
    description: "Set up a new appeal link for a case (will send a dm to the user)",
    options:[
        {
            name: "case_id",
            description: "case Id",
            type: 3,
            required: true,
        },        
    ],
    execute: async (interaction) => {
        try {
            const caseId = interaction.options.getString("case_id");
            const appealtoken = randomBytes(16).toString('hex').slice(0, 16);
            const row = await setAppeal(caseId, appealtoken);
            if (!row){
                throw "Invalid Case Id";
            }
            if (row.type === 0 ){
                throw `Case Id ${caseId} does not represent a mute or a ban`
            }
            let discord_user = await interaction.client.users.fetch(row.discordId)
            if (!discord_user){
                throw "Check Case Id";
            }



            if (row.type === 2){
                const appealEmbed = new EmbedBuilder()
                .setTitle(`New Appeal granted`)
                .setColor("Gold")
                .setDescription(`You can appeal [here](https://discord.com/channels/1276252284564537384/1276252284564537387/1276838472241512482)\nToken: **${appealtoken}** \n (this token erases the previous ones, **do not** share it) \n \n *Link doesn't work? Ask for a new one*`)
                .setTimestamp()
                .setFooter({text: `Case ID: ${caseId}`});
                const guild = await interaction.client.guilds.cache.get("1276252284564537384");
                const discord_member = await guild.members.fetch(row.discordId).catch(e => null);                
                if (!discord_member){
                    throw  "The banned user need to be on the appeal server (https://discord.gg/qWSMk6zTJ9) to get a new appeal token";
                }
                const channel = await guild.channels.create({
                    name: `appeal-${discord_member.user.username}`,
                    type: 0, // GUILD_TEXT type
                    permissionOverwrites: [
                      {
                        id: guild.id, // @everyone role
                        deny: [PermissionsBitField.Flags.ViewChannel],
                      },
                      {
                        id: discord_member.id, // The specific banned user
                        allow: [PermissionsBitField.Flags.ViewChannel],
                      },
                      {
                        id: interaction.client.user.id, // Bot itself
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                      },
                    ],
                });
                await channel.send({
                    content: `<@${discord_member.id}>`,
                    embeds: [appealEmbed],
                  });

                await interaction.followUp({ content: `\`\`\`${discord_member.user.tag} has been sent a new token to appeal on the appeal server\`\`\``});
            } else{
                const appealEmbed = new EmbedBuilder()
                .setTitle(`New Appeal granted`)
                .setColor("Gold")
                .setDescription(`You can appeal on this [discord server](https://discord.gg/qWSMk6zTJ9)\nToken: **${appealtoken}** \n (**Do not** share your personnal tokens, you are responsible) \n \n *Link doesn't work? Ask for a new one*`)
                .setTimestamp()
                .setFooter({text: `Case ID: ${caseId}`});
                await discord_user.send({ embeds: [appealEmbed] });
                await interaction.followUp({ content: `\`\`\`${discord_user.tag} has been sent a new token to appeal in dm\`\`\``});
            }
            
        } catch (error) {
            console.error(error);
            if (error.code === 50007) { // Cannot send messages to this user
                console.log(`Could not send DM to this user. They might have DMs disabled or blocked the bot.`);
                await interaction.followUp({ content: `\`\`\`Could not send DM . They might have DMs disabled or blocked the bot.\`\`\``});
            } else {
                console.error('Unexpected error while sending DM:', error);
                await interaction.followUp({ content: `\`\`\`${error}\`\`\``});
            }
            
        }
    },
};
