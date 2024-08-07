const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { addentry, removeentry, selectentry, getList} = require("../../contracts/verify.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { getUsername, resolveUsernameOrUUID } = require("../../contracts/API/PlayerDBAPI.js");
const { isUuid } =  require("../../../API/utils/uuid.js");



module.exports = {
  name: "admin_verify",
  description: "For administrators",
  options: [
    {
        name: "add",
        description: "manually link",
        type: 1,
        options: [
            {
            name: "mc_username",
            description: "in-game username (uuid/name)",
            type: 3,
            required: true,
            },
            {
            name: "discord_id",
            description: "discord id",
            type: 3,
            required: true,
            }
        ]
    },
    {
        name: "remove",
        description: "remove a donation for a member",
        type: 1,
        options: [
            {
            name: "mc_username",
            description: "in-game username (uuid/name)",
            type: 3,
            required: true,
            }
        ]
    },
    {
        name: "info",
        description: "remove a donation for a member",
        type: 1,
        options: [
            {
            name: "mc_username",
            description: "in-game username (uuid/name)",
            type: 3,
            required: true,
            }
        ]
    },
    {
        name: "list",
        description: "List of links",
        type: 1,
        options: []
    }
  ],
  
  execute: async (interaction) => {
    const user = interaction.member;
    const guild = interaction.guild;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }

    try {
        const action = interaction.options.getSubcommand();

        const [mc, discord_id] = [interaction.options.getString("mc_username"), interaction.options.getString("discord_id")];
        console.log(discord_id);

        let mcUUID= " ";
        let mcusername= " ";
        if (isUuid(mc)){
            mcusername = await getUsername(mc);
        } else{
            const dataUUIDmc = await resolveUsernameOrUUID(mc);
            if (!dataUUIDmc){
                throw `Mc username/UUID does not exist`;
            }
            mcUUID = dataUUIDmc['uuid'];
            mcusername = dataUUIDmc['username'];
        }

        if ( action === "add"){
            // if (!guild.members.cache.has(discord_id)) {
            //     throw `this discord_id is invalid / Member not on this server`;
            // }
            await addentry(mcUUID, discord_id);

            const embed = new EmbedBuilder()
            .setColor(2067276)
            .setAuthor({name :`Donation manually added`})
            .setDescription(`Linked \`${mcusername}\` to <@${discord_id}>`)
            .setFooter({
                text: 'Link Tool',
                iconURL: "https://i.imgur.com/Fc2R9Z9.png",
            });
            await interaction.followUp({embeds: [embed],});

        } else if (action === "remove"){
            await removeentry(mcUUID);

            const embed = new EmbedBuilder()
            .setColor(15105570)
            .setAuthor({ name: "Unlink" })
            .setDescription(`Unlinked ${mcusername}`)
            .setFooter({
                text: 'Link Tool',
                iconURL: "https://i.imgur.com/Fc2R9Z9.png",
            });
            await interaction.followUp({embeds: [embed],});

        } else if (action === "info"){
            const d_id = await selectentry(mcUUID);

            if (d_id){
                const embed = new EmbedBuilder()
                .setColor(16777215)
                .setAuthor({ name: "Info" })
                .setDescription(`\`${mcusername}\` linked to <@${d_id}>`)
                .setFooter({
                    text: 'Link Tool',
                    iconURL: "https://i.imgur.com/Fc2R9Z9.png",
                });
                await interaction.followUp({embeds: [embed],});
            } else{
                const embed = new EmbedBuilder()
                .setColor(16777215)
                .setAuthor({ name: "Info" })
                .setDescription(`\`${mcusername}\` isn't linked`)
                .setFooter({
                    text: 'Link Tool',
                    iconURL: "https://i.imgur.com/Fc2R9Z9.png",
                });
                await interaction.followUp({embeds: [embed],});               
            }
        } else{
            dataDictionary = await getList();
            let verticalList = Object.entries(dataDictionary)
            .map(([username, discordid]) => {
              return `${username} : <@${discordid}>`;
            })
            .join('\n');
    
            if (!verticalList) {
                verticalList = "Nobody linked yet :(";
            } 
            verticalList = verticalList + "\n";
    
            const embed = new EmbedBuilder()
                .setColor(16777215)
                .setAuthor({ name: "Link list" })
                .setDescription(verticalList)
                .setFooter({
                text: 'Link Tool',
                iconURL: "https://i.imgur.com/Fc2R9Z9.png",
            });
            await interaction.followUp( {embeds: [embed]});
        }
      
    } catch(e){
        console.error(e);
        throw new HypixelDiscordChatBridgeError(`${e}`);
    }

  },

};

