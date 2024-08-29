const { EmbedBuilder } = require("discord.js");
const hypixelRebornAPI = require("../../contracts/API/HypixelRebornAPI.js");
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { resolveUsernameOrUUID} = require("../../contracts/API/mowojangAPI.js");
const { isUuid } =  require("../../../API/utils/uuid.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { addentry, updateMessageId, getentry_mute } = require("../../contracts/moderation.js");
const config = require("../../../config.json");
const { scheduleTimeout } = require("../other/Timeouts.js");
const { getUsername } = require("../../contracts/API/mowojangAPI.js");
const { selectlink_uuid, selectlink_discord } = require("../../contracts/verify.js");
const { randomBytes } = require('node:crypto');
const fs = require('fs');

module.exports = {
  name: "helper_mute",
  description: "Mutes the given user for one hour",
  moderatorOnly: true,
  requiresBot: true,
  options: [

    {
      name: "reason",
      description: "reason for mute",
      type: 3,
      required: true,
    },
    {
      name: "member",
      description: "Discord, optionnal (if not linked)",
      type: 6,
      required: false,
    },
    {
      name: "mc_name",
      description: "Mc/uuid name",
      type: 3,
      required: false,
    },
  ],

  execute: async (interaction) => {
    let mcname = interaction.options.getString("mc_name");
    const reason = interaction.options.getString("reason");
    const member = await interaction.options.getMember("member");
    try {
      let str = ""
      // muteduration
      const duration = "1h";
      const ms_duration = 3600000;

      let uuid;
      let discord_member;
      let row_mute;

      if (mcname){
        const dataUUID = await resolveUsernameOrUUID(mcname).catch(e => null);
        if (!dataUUID){
          throw "Invalid Minecraft username or UUID";
        }
        uuid = dataUUID['uuid'];
        mcname = dataUUID['username'];
        row_mute = await getentry_mute(0, uuid);
        const d_id = await selectlink_uuid(uuid);
        if (d_id){
          discord_member = await interaction.guild.members.fetch(d_id);
        } else{
          discord_member = member? member : undefined ;
        }

      } else if(!mcname && member){
        discord_member = member;
        row_mute = await getentry_mute(discord_member.id, uuid);
        const new_uuid = await selectlink_discord(discord_member.id);
        if (new_uuid){
          const new_dataUUID = await resolveUsernameOrUUID(new_uuid).catch(e => null);
          if (new_dataUUID){
            uuid = new_dataUUID['uuid'];
            mcname = new_dataUUID['username'];
          } else{
            str += `<:no:1067859582573084832> Not muted on minecraft: username not found! \n`;
          }
        } else{
          str += `<:no:1067859582573084832> Not muted on minecraft: username not found or not specified! \n`;
        }
      } else{
        throw "You need to put at least mc_name or member as options";
      }


      if (row_mute){
        if (Date.now() <= (row_mute.date + row_mute.duration) ){
          throw "Previous mute hasn't finished yet!"
        }
      }

      if (uuid){
        // MUTE ON MC
        // Get hypixel guild member
        const hypixelGuild = await hypixelRebornAPI.getGuild("name", "Golden Legion");
        if (hypixelGuild === undefined) {
          throw "Hypixel Guild not found.";
        }
        const hypixelguildMember = hypixelGuild.members.find((m) => m.uuid === uuid);
        if (!hypixelguildMember){
          throw "Could not find minecraft player. Weird.";
        }
        const muteduntilmc = hypixelguildMember.mutedUntilTimestamp;
        if (Date.now() > muteduntilmc){
          bot.chat(`/g mute ${mcname} ${duration}`);
          console.log("mute");
        } else{
          console.log("unmute then mute");
          bot.chat(`/g unmute ${mcname}`);
          await delay(1000);
          bot.chat(`/g mute ${mcname} ${duration}`);
        }
        str += `<:yes:1067859611262128210> Muted on minecraft: \`${mcname}\` \n`;
      } else{
        uuid = 0;
      }

      const moderation_channel = await interaction.guild.channels.cache.get(config.discord.channels.moderationLogsChannel);
      const appealtoken = randomBytes(16).toString('hex').slice(0, 16);
      console.log(appealtoken)

      let caseId;
      if (discord_member){
      // MUTE ON DISCORD (& MC)
        str += `<:yes:1067859611262128210> Muted on discord: <@${discord_member.id}>\n`
        caseId = await addentry("", Date.now(), 1, discord_member.id, uuid, interaction.user.tag, duration, reason, appealtoken);
        const modLogfields = [
          { name: `User`, value: `<@${discord_member.id}>`, inline: true },
          { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true},
          { name: "Length", value:`${duration}`, inline: true },
          { name: "Reason", value: `${reason}`, inline: true },
        ];
        const modlog = new EmbedBuilder()
        .setAuthor({
          name: `Case ${caseId} | Mute | ${mcname !== undefined? mcname : discord_member.user.tag }`,
          iconURL: discord_member.user.avatarURL(),
        })
        .addFields(modLogfields)
        .setColor("Red")
        .setTimestamp()
        .setFooter({
          text: `ID: ${discord_member.id}`,
        });
        const logresponse = await moderation_channel.send({embeds : [modlog]});
        await discord_member.roles.add(config.discord.commands.mutedRole).catch(e => console.log("Could not add muted role"));
        await updateMessageId(logresponse.id, caseId);

            // DISCORD PART
        await scheduleTimeout(caseId, discord_member.id, config.discord.commands.mutedRole, ms_duration);

        const appealEmbed = new EmbedBuilder()
        .setTitle(`You were muted in ⭐ **Golden Legion** ⭐ for ${duration}`)
        .setColor("Red")
        .setDescription(`You can appeal on [this server](https://discord.gg/qWSMk6zTJ9)\n Token: **${appealtoken}** \n(**Do not** share your personnal token, you are responsible) \n \n *Token doesn't work? Ask for a new one*`)
        .setTimestamp()
        .setFooter({text: `Case ID: ${caseId}`});
        discord_member.send({ embeds: [appealEmbed] })
        .catch(async (error) => {
            if (error.code === 50007) { // Cannot send messages to this user
            console.log(`Could not send DM to ${discord_member.user.tag}. They might have DMs disabled or blocked the bot.`);
            const fallbackEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle(`Warning: ${discord_member.user.tag}`)
                .setDescription("The user could not be notified via DM. They might have DMs disabled or have blocked the bot.")
                .setTimestamp()
                .setFooter({ text: `Case ID: ${caseId}` });

            await moderation_channel.send({ embeds: [fallbackEmbed] });
            } else {
            console.error('Unexpected error while sending DM:', error);
            }
        });
        
      } else {
      // MUTE ON MC ONLY
        caseId = await addentry(logresponse.id, Date.now(), 1, 0, uuid, interaction.user.tag, duration, reason, 0);
        str += `<:no:1067859582573084832> Not muted on discord : member not linked or not specified\n`;
        const modLogfields = [
            { name: `User`, value: `${mcname}`, inline: true },
            { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true},
            { name: "Length", value:`${duration}`, inline: true },
            { name: "Reason", value: `${reason}`, inline: true },
        ];

        const modlog = new EmbedBuilder()
        .setAuthor({
          name: `Case ${caseId} | Mute | ${mcname}`,
          iconURL: `https://www.mc-heads.net/avatar/${mcname}`,
        })
        .addFields(modLogfields)
        .setColor("Red")
        .setTimestamp()
        .setFooter({
          text: `ID: 0`,
        });
        const logresponse = await moderation_channel.send({content: `<@${discord_member.id}>`, embeds : [modlog]});
        await updateMessageId(logresponse.id, caseId);
        
      }
      
      const embed = new EmbedBuilder()
      .setAuthor({
        name: `Muted ${mcname} for ${duration}`, 
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
