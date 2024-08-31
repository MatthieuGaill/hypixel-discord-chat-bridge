const { EmbedBuilder } = require("discord.js");
const hypixelRebornAPI = require("../../contracts/API/HypixelRebornAPI.js");
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { resolveUsernameOrUUID} = require("../../contracts/API/mowojangAPI.js");
const { addentry, updateMessageId } = require("../../contracts/moderation.js");
const config = require("../../../config.json");
const { selectlink_uuid, selectlink_discord } = require("../../contracts/verify.js");
const { randomBytes } = require("node:crypto");
const { addbandata } = require("../../contracts/banlist.js");

module.exports = {
  name: "ban",
  description: "Will attempt to ban from discord & kick from the in-game guild",
  moderatorOnly: true,
  requiresBot: false,
  options: [
    {
      name: "reason",
      description: "reason for ban",
      type: 3,
      required: true,
    },
    {
      name: "mc_name",
      description: "Mc/uuid name",
      type: 3,
      required: false,
    },
    {
      name: "member",
      description: "Discord, optionnal (if not linked)",
      type: 6,
      required: false,
    },    
  ],

  execute: async (interaction) => {
    let mcname = interaction.options.getString("mc_name");
    const reason = interaction.options.getString("reason");
    const member = await interaction.options.getMember("member");
    try {
      let str = ""

      let uuid;
      let discord_member;
      if (mcname){
        const dataUUID = await resolveUsernameOrUUID(mcname).catch(e => null);
        if (!dataUUID){
          throw "Invalid Minecraft username or UUID";
        }
        uuid = dataUUID['uuid'];
        mcname = dataUUID['username'];
        const d_id = await selectlink_uuid(uuid);
        if (d_id){
          discord_member = await interaction.guild.members.fetch(d_id);
        } else{
          discord_member = member? member : undefined ;
        }

      } else if(!mcname && member){
        discord_member = member;
        const new_uuid = await selectlink_discord(discord_member.id);
        if (new_uuid){
          const new_dataUUID = await resolveUsernameOrUUID(new_uuid).catch(e => null);
          if (new_dataUUID){
            uuid = new_dataUUID['uuid'];
            mcname = new_dataUUID['username'];
          } else{
            str += `<:no:1067859582573084832> Not warned on minecraft: username not found! \n`;
          }
        } else{
          str += `<:no:1067859582573084832> Not warned on minecraft: username not found or not specified! \n`;
        }
      } else{
        throw "You need to put at least mc_name or member as options";
      }

      if (uuid){
        // Get hypixel guild member
        const hypixelGuild = await hypixelRebornAPI.getGuild("name", "Golden Legion");
        if (hypixelGuild === undefined) {
            throw "Hypixel Guild not found.";
        }
        const hypixelguildMember = hypixelGuild.members.find((m) => m.uuid === uuid);
        if (!hypixelguildMember){
            throw "Could not find minecraft player. Weird.";
        }
        str += `<:yes:1067859611262128210> Banned on minecraft: ${mcname}\n`;
        bot.chat(`/g kick ${mcname} ${reason}`);
        await addbandata(mcname, uuid);
      } else{
        uuid =0;
      }

      const moderation_channel = await interaction.guild.channels.cache.get(config.discord.channels.moderationLogsChannel);

      // Mute on discord
      let caseId;
      if (discord_member){
        str += `<:yes:1067859611262128210> Banned on discord: <@${discord_member.id}>\n`;
        const appealtoken = randomBytes(16).toString('hex').slice(0, 16);
        caseId = await addentry("", Date.now(), 2, discord_member.id, uuid, interaction.user.tag, "None", reason, appealtoken);
        const modLogfields = [
            { name: `User`, value: `<@${discord_member.id}>`, inline: true },
            { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true},
            { name: "Reason", value: `${reason}`, inline: true },
        ];
        const modlog = new EmbedBuilder()
        .setAuthor({
          name: `Case ${caseId} | Ban | ${mcname !== undefined? mcname : discord_member.user.tag }`,
          iconURL: discord_member.user.avatarURL(),
        })
        .addFields(modLogfields)
        //.setDescription(`**User**:  <@${discord_member.id}>\n **Moderator**: <@${interaction.user.id}> \n **Reason**: ${reason} `)
        .setColor("Red")
        .setTimestamp()
        .setFooter({
          text: `ID: ${discord_member.id}`,
        });
        const logresponse = await moderation_channel.send({embeds : [modlog]});
        await updateMessageId(logresponse.id, caseId);
        const appealEmbed = new EmbedBuilder()
        .setTitle(`You were banned from ⭐ **Golden Legion** ⭐ | ${reason}`)
        .setColor("Red")
        .setDescription(`You can appeal on [this server](https://discord.gg/qWSMk6zTJ9)\n Token: **${appealtoken}** \n(**Do not** share your personnal token, you are responsible) \n \n *Token doesn't work? Ask for a new one*`)
        .setTimestamp()
        .setFooter({text: `Case ID: ${caseId}`});
        const user = discord_member.user;
        await user.send({ embeds: [appealEmbed] })
        .catch(async (error) => {
            let errmsg;
            if (error.code === 50007){  // Cannot send messages to this user
                console.log(`Could not send DM to ${discord_member.user.tag}. They might have DMs disabled or blocked the bot.`);
                errmsg = "The user could not be notified via DM. They might have DMs disabled or have blocked the bot.";
            }else{
                console.error(error);
                errmsg = error;
            }
            const fallbackEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle(`Warning: ${discord_member.user.tag}`)
                .setDescription(errmsg)
                .setTimestamp()
                .setFooter({ text: `Case ID: ${caseId}` });

            moderation_channel.send({ embeds: [fallbackEmbed] });

        });
        await discord_member.ban({deleteMessageSeconds: 3600, reason: `${reason}`}).catch(e => {console.log(`error while banning discord member: ${e}`)});

        
      } else {
        str += `<:no:1067859582573084832> Not banned on discord : member not linked or not specified\n`;
        caseId = await addentry("", Date.now(), 2, 0, uuid, interaction.user.tag, "None", reason, 0);
        const modLogfields = [
            { name: `User`, value: `${mcname}`, inline: true },
            { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true},
            { name: "Reason", value: `${reason}`, inline: true },
        ];
        const modlog = new EmbedBuilder()
        .setAuthor({
          name: `Case ${caseId} | Ban | ${mcname}`,
          iconURL: `https://www.mc-heads.net/avatar/${mcname}`,
        })
        .addFields(modLogfields)
        //.setDescription(`**User**:  ${mcname}\n **Moderator**: <@${interaction.user.id}> \n **Reason**: ${reason} `)
        .setColor("Red")
        .setTimestamp()
        .setFooter({
          text: `ID: 0`,
        });
        const logresponse = await moderation_channel.send({embeds : [modlog]});
        await updateMessageId(logresponse.id, caseId);
        
      }
      
      const embed = new EmbedBuilder()
      .setAuthor({
        name: `Banned ${mcname}`, 
      })
      .setDescription(str)
      .setColor(5763719)
      .setTimestamp()
      .setFooter({
        text: `Case: ${caseId}`,
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });  
      await interaction.followUp({
        embeds: [embed],
      });

    } catch (e){        
        console.error(e);
        const embed = new EmbedBuilder()
        .setColor("Red")
        .setAuthor({ name: "Error" })
        .setDescription(e)
        .setFooter({
            text: 'Golden Legion Bot',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        interaction.followUp({embeds: [embed], ephemeral: true});
        
    }
  },
};
