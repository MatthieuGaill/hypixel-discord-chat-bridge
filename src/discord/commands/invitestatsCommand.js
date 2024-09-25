const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { addInvite, getList, removeInvite, checkdetails } = require("../../contracts/guildInvite.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { getUsername, resolveUsernameOrUUID } = require("../../contracts/API/PlayerDBAPI.js");
const { isUuid } =  require("../../../API/utils/uuid.js");
const { selectlink_uuid } = require("../../contracts/verify.js");



module.exports = {
  name: "invitestats",
  description: "invitestats command",
  options: [
    {
      name: "add",
      description: "manually assign an invitation to a member",
      type: 1,
      options: [
        {
          name: "member",
          description: "member who invited (uuid/name)",
          type: 3,
          required: true,
        },
        {
          name: "new_member",
          description: "new member who was invited (uuid/name)",
          type: 3,
          required: true,
        }
      ]
    },
    {
      name: "remove",
      description: "remove an invitation for a member",
      type: 1,
      options : [
        {
            name: "member",
            description: "member who invited (uuid/name)",
            type: 3,
            required: true,
        },
        {
            name: "new_member",
            description: "new member who was invited (uuid/name)",
            type: 3,
            required: true,
        }
      ]
    },
    {
      name: "details",
      description: "Invitation detail for a member",
      type: 1,
      options : [
        {
            name: "member",
            description: "member who invited (uuid/name)",
            type: 3,
            required: true,
        }
      ]
    },
    {
      name: "list",
      description: "list of invitations & update",
      type: 1,
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

      if (action === "add" || action === "remove"){

        if (!user.roles.cache.has("1057805939115298888")){
          throw "You do not have permission to use this command."
        }

        const [invitername, invitedname] = [interaction.options.getString("member"), interaction.options.getString("new_member")];
        let invitedUUID, invitedusername, inviterUUID, inviterusername = " ";

        if (isUuid(invitedname)){
          invitedusername = await getUsername(invitedname);
        } else{
          const dataUUIDinvited = await resolveUsernameOrUUID(invitedname);
          if (!dataUUIDinvited){
              throw `Invited username/UUID does not exist`;
          }
          invitedUUID = dataUUIDinvited['uuid'];
          invitedusername = dataUUIDinvited['username'];
        }

        if (isUuid(invitername)){
            username = await getUsername(invitername);
        } else{
            const dataUUIDinviter = await resolveUsernameOrUUID(invitername);
            if (!dataUUIDinviter){
                throw `Inviter username/UUID does not exist`;
            }
        inviterUUID = dataUUIDinviter['uuid'];
        inviterusername = dataUUIDinviter['username'];
        }
            
        if ( action === "add"){
            await addInvite(inviterUUID, invitedUUID);

            const embed = new EmbedBuilder()
            .setColor(2067276)
            .setAuthor({name :`Invite manually added`})
            .setDescription(`${inviterusername} invited ${invitedusername}`)
            .setFooter({
              text: ' ',
              iconURL: "https://i.imgur.com/Fc2R9Z9.png",
            });
            await interaction.followUp({embeds: [embed],});

        } else {
            const removeinv = await removeInvite(inviterUUID, invitedUUID);
            if (removeinv){
                const embed = new EmbedBuilder()
                .setColor(15105570)
                .setAuthor({ name: "Invite removed" })
                .setDescription(`Successfully removed invite`)
                .setFooter({
                  text: ' ',
                  iconURL: "https://i.imgur.com/Fc2R9Z9.png",
                });
                await interaction.followUp({embeds: [embed],});

            } else {
                throw 'Something went wrong';
            }

        }

      } else if (action === "list"){
        const dataDictionary = await getList();
        const dataDictionary0 = {};
        for (const key in dataDictionary){
          const d_id = await selectlink_uuid(key);
          if (d_id){
            dataDictionary0[`<@${d_id}>`] = dataDictionary[key];
          } else{
            const key0 = await getUsername(key);
            dataDictionary0[`\`${key0}\``] = dataDictionary[key];
          }
        }
        const emojis = [`<:yes:1067859611262128210>`, `<:guildlogo:1045831680608456826>`, `<:verified:859701120015138857>`];
        let verticalList = Object.entries(dataDictionary0)
        .sort(([, a], [, b]) => b.totalInvited - a.totalInvited)
        .map(([username, datadic]) => `${emojis[0]} ${username} : ${datadic['totalInvited']} ${emojis[1]}  |  ${datadic['verifiedInvited']} ${emojis[2]}`)
        .join('\n');

        if (!verticalList) {
            verticalList = "Nobody invited anybody yet!";
        }

        const embed = new EmbedBuilder()
            .setColor(16777215)
            .setAuthor({ name: "List of invites" })
            .setDescription(verticalList)
            .setFooter({
            text: ' ',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
      
        await interaction.followUp( {embeds: [embed]});
      
      } else if (action==="details"){
        const invitername = interaction.options.getString("member");
        let inviterusername, inviterUUID = " ";
        if (isUuid(invitername)){
          inviterusername = await getUsername(invitername);
        } else{
          const dataUUIDinviter = await resolveUsernameOrUUID(invitername);
          if (!dataUUIDinviter){
              throw `Invited username/UUID does not exist`;
          }
          inviterUUID = dataUUIDinviter['uuid'];
          inviterusername = dataUUIDinviter['username'];
        }

        const detaildata = await checkdetails(inviterUUID);
        let guild_list = [];
        let discord_list = [];
  
        for (const uuid of detaildata["guild_list"]){
          const username = await getUsername(uuid);
          guild_list.push(username);
        }

        for (const uuid of detaildata["discord_list"]){
          const username = await getUsername(uuid);
          discord_list.push(username);
        }
        guild_list = guild_list.length === 0 ? "N/A" : guild_list.map((item) => `\`${item}\``).join(', ');
        discord_list = discord_list.length === 0 ? "N/A" : discord_list.map((item) => `\`${item}\``).join(', ');
        const fields = [
          { name: "<:guildlogo:1045831680608456826> Guild", value: guild_list !== undefined ? guild_list : "N/A", inline: true },
          { name: "<:verified:859701120015138857> Discord", value: discord_list !== undefined  ? discord_list : "N/A" },
        ];
        const embed = new EmbedBuilder()
        .setColor(16777215)
        .setTitle(`Invitation details of ${inviterusername}`)
        .addFields(fields)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });

        await interaction.followUp({embeds: [embed],});


      } else {
        throw "Something is wrong";
      }

      
    } catch(e){
        console.error(e);
        throw new HypixelDiscordChatBridgeError(`${e}`);
    }

  },

};

