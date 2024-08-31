const { EmbedBuilder } = require("discord.js");
const hypixelRebornAPI = require("../../contracts/API/HypixelRebornAPI.js");
const { resolveUsernameOrUUID} = require("../../contracts/API/mowojangAPI.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getentry_mute } = require("../../contracts/moderation.js");
const config = require("../../../config.json");
const { removeTimeout } = require("../other/Timeouts.js");
const { selectlink_uuid, selectlink_discord } = require("../../contracts/verify.js");

module.exports = {
  name: "unmute",
  description: "Unmute a given user",
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
            str += `<:no:1067859582573084832> Not unmuted on minecraft: username not found! \n`;
          }
        } else{
          str += `<:no:1067859582573084832> Not unmuted on minecraft: username not found or not specified! \n`;
        }
      } else{
        throw "You need to put at least mc_name or member as options";
      }


      if (uuid){
        // Get hypixel guild member
        console.log(uuid);
        const hypixelGuild = await hypixelRebornAPI.getGuild("name", "Golden Legion");
        if (hypixelGuild === undefined) {
          throw "Hypixel Guild not found.";
        }
        const hypixelguildMember = hypixelGuild.members.find((m) => m.uuid === uuid);
        if (!hypixelguildMember){
          throw "Could not find minecraft player. Weird.";
        }
  
        bot.chat(`/g unmute ${mcname}`);
        str += `<:yes:1067859611262128210> Unmuted on minecraft: \`${mcname}\` \n`;
      } else{
        uuid = 0;
      }

      const moderation_channel = await interaction.guild.channels.cache.get(config.discord.channels.moderationLogsChannel);
      let caseId;


      if (discord_member){
      // UNMUTE ON DISCORD & MC
        const row_unmute = await getentry_mute(discord_member.id, uuid);
        if (!row_unmute){
          throw "This user is not muted!";
        }
        const caseId = parseInt(row_unmute.id);
        str += `<:yes:1067859611262128210> Unmuted on discord: <@${discord_member.id}>\n`
        const modLogfields = [
          { name: `User`, value: `<@${discord_member.id}>`, inline: true },
          { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true},
          { name: "Reason", value: `${reason}`, inline: true },
        ];
        const modlog = new EmbedBuilder()
        .setAuthor({
          name: `Case ${caseId} | Unmute | ${mcname !== undefined? mcname : discord_member.user.tag }`,
          iconURL: discord_member.user.avatarURL(),
        })
        .addFields(modLogfields)
        .setColor("Green")
        .setTimestamp()
        .setFooter({
          text: `ID: ${discord_member.id}`,
        });
        const logresponse = await moderation_channel.send({embeds : [modlog]});
        await discord_member.roles.remove(config.discord.commands.mutedRole).catch(e => console.log("Could not remove muted role"));
        //await updateMessageId(logresponse.id, caseId);

        // DISCORD PART
        await removeTimeout(discord_member.id, config.discord.commands.mutedRole)
        const appealEmbed = new EmbedBuilder()
        .setTitle(`You were unmuted in ⭐ **Golden Legion** ⭐`)
        .setColor("Green")
        .setDescription(`by <@${interaction.user.id}>`)
        .setTimestamp()
        .setFooter({text: `Case ID: ${caseId}`});
        discord_member.send({ embeds: [appealEmbed] }).catch(async (error) => {
          let errmsg;
          if (error.code === 50007){  // Cannot send messages to this user
              console.log(`Could not send DM to ${discord_member.user.tag}. They might have DMs disabled or blocked the bot.`);
              errmsg = "The user could not be notified via DM about their **unmute** They might have DMs disabled or have blocked the bot.";
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
        
      } else {
        // UNMUTE ON MC ONLY
        const row_unmute = await getentry_mute(discord_member.id, uuid);
        if (!row_unmute){
          throw "This user is not muted!";
        }
        str += `<:no:1067859582573084832> Not unmuted on discord : member not linked or not specified\n`;
        const modLogfields = [
            { name: `User`, value: `${mcname}`, inline: true },
            { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true},
            { name: "Reason", value: `${reason}`, inline: true },
        ];

        const modlog = new EmbedBuilder()
        .setAuthor({
          name: `Case ${caseId} | Unmute | ${mcname}`,
          iconURL: `https://www.mc-heads.net/avatar/${mcname}`,
        })
        .addFields(modLogfields)
        .setColor("Green")
        .setTimestamp()
        .setFooter({
          text: `ID: 0`,
        });
        const logresponse = await moderation_channel.send({content: `<@${discord_member.id}>`, embeds : [modlog]});
        //await updateMessageId(logresponse.id, caseId);
        
      }

      if (!interaction.doNotRespond){
        const embed = new EmbedBuilder()
        .setAuthor({
          name: `Unmuted ${mcname}`, 
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
      }
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
      if (!interaction.doNotRespond){
        interaction.followUp({embeds: [embed], ephemeral: true});
      }
      
    }
  },
};

