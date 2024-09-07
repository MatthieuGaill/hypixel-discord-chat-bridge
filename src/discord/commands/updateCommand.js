const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const hypixelRebornAPI = require("../../contracts/API/HypixelRebornAPI.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { replaceVariables } = require("../../contracts/helperFunctions.js");
const { SuccessEmbed } = require("../../contracts/embedHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { UpdateRolesDonation, removeRolesDonation } = require("../../contracts/donator.js");
const MemberRoles = require("../other/MemberRoles");
const { selectlink_discord, removelink_discord } = require("../../contracts/verify.js");

module.exports = {
  name: "update",
  verificationCommand: true,
  description: "Update your current roles",

  execute: async (interaction, user) => {
    try {
      let hypixelGuild;
      let player;
      let title_log_embed;
      if (user !== undefined) {
        interaction.user = user;
        interaction.member = await guild.members.fetch(interaction.user.id);
      }

      if (!interaction.member) {
        interaction.member = await guild.members.fetch(interaction.user.id);
      }

      if (!interaction.member){
        await removelink_discord(interaction.user.id);
        throw "User left discord, removing him from linked users"
  
      }
      let memberRoles = new MemberRoles([...interaction.member.roles.cache.keys()])


      const uuid = await selectlink_discord(interaction.user.id);

      if (uuid === undefined || interaction.unverify) {
        title_log_embed = `Auto Role → Role Changes (Member Left/Unverified)`;
        const roles = [
          config.verification.verifiedRole,
          //config.verification.guestRole,
          config.verification.guildMemberRole,
          ...config.verification.ranks.map((r) => r.role),
          ...config.verification.hypixelranks.map((r) => r.role),
          ...config.verification.timeroles.map((r) => r.role),
        ];

        for (const role of roles) {
          if (role === config.verification.verifiedRole && config.verification.removeVerificationRole === false) {
            continue;
          }

          memberRoles.removeRole(role, "Unverified/Left");
          // } else{
          //   if (interaction.member.roles.cache.has(role)) {
          //     interaction.member.roles.remove(role, "Updated Roles").then(removed_roles.push(role));
          //   }
          // }
        }
        if (interaction.unverify){
          memberRoles.addRole("1057382314545516624", "Unverified");
        } else{
          memberRoles.addRole(config.verification.guestRole, "Guest Role");
        }
        

        interaction.member.setNickname(null, "Updated Roles");
        await removeRolesDonation(memberRoles);
        if (!interaction.unverify){
          throw new HypixelDiscordChatBridgeError("You are not linked to a Minecraft account.");
        }
      } else {
        // LINKED
        title_log_embed = "";

        memberRoles.addRole(config.verification.verifiedRole, "Successfully verified");

        
        [hypixelGuild, player] = await Promise.all([
          hypixelRebornAPI.getGuild("name", "Golden Legion"),
          hypixelRebornAPI.getPlayer(uuid),
        ]);
        

        if (hypixelGuild === undefined || player === undefined) {
          throw new HypixelDiscordChatBridgeError("Guild not found or player not found, try again later");
        }
        const hypixelRank = player.rank;
        const guildMember = hypixelGuild.members.find((m) => m.uuid === uuid);
        //
        if (guildMember) {
          title_log_embed = `Auto Role (Golden Legion) → Role Changes`;
        // LINKED & IN GUILD
          memberRoles.addRole(config.verification.guildMemberRole, "Member Role");
          
          // GUILD RANKS
          if (config.verification.ranks.length > 0 && guildMember.rank) {
            const rank = config.verification.ranks.find((r) => r.name.toLowerCase() == guildMember.rank.toLowerCase());

            for (const role of config.verification.ranks){
              if (role.role === rank.role){
                memberRoles.addRole(rank.role, `For having rank **${rank.name}**`);
              } else{
                memberRoles.removeRole(role.role, `For not having rank **${role.name}**`);
              }
            }
          }
          // TIME ROLES
          timeRoles = config.verification.timeroles;
          if (timeRoles.length > 0){
            let time = parseInt(guildMember.joinedAtTimestamp);
            if (time && timeRoles) {
              let days = Math.floor((Date.now() - time) / 1000 / 60 / 60 / 24);
              timeRoles = timeRoles.sort((a, b) => a.days - b.days);
              timeRoles.forEach((tr, index) => {
                let ahead = timeRoles[index + 1] || { days: 99999 };
                if ((days >= tr.days && days <= ahead.days) || (days >= tr.days && tr.pinned)) {
                    memberRoles.addRole(tr.role, `For staying in the guild for more than **${tr.days} days** (${days})`);
                } else {
                    memberRoles.removeRole(tr.role, `Has not been in the guild for **${tr.days} days** (${days})`);
                }
              })
            }
          }
            

          memberRoles.removeRole(config.verification.guestRole, `Guest role`);
          memberRoles.removeRole("1057382314545516624", "Verified");
          await UpdateRolesDonation(memberRoles, uuid, true);
        } else {
          // LINKED BUT NOT IN GUILD
          title_log_embed = `Auto Role → Role Changes (Member Left/Unverified)`;

          memberRoles.removeRole(config.verification.guildMemberRole, `Member Role`);

          if (config.verification.ranks.length > 0) {
            for (const role of config.verification.ranks) {

              memberRoles.removeRole(role.role, `**${role.name}** rank role`);
            }
          }
          memberRoles.addRole(config.verification.guestRole, `Guest role`);

          await UpdateRolesDonation(memberRoles, uuid, false);
        }

        // HYPIXEL RANKS
        if (config.verification.hypixelranks.length > 0 && hypixelRank) {
          const hrank = config.verification.hypixelranks.find((r) => r.name.toLowerCase() == hypixelRank.toLowerCase());
          if (hrank){
            for (const role of config.verification.hypixelranks){
              if (role.role === hrank.role){
                memberRoles.addRole(hrank.role, `${hrank.name} rank`);
              } else{
                memberRoles.removeRole(role.role, `${role.name} rank`);
              }
            }
          }

        }
        // NICKNAME
        interaction.member.setNickname(
          replaceVariables(config.verification.name, {
            username: player.nickname,
            guildRank: guildMember?.rank ?? "",
            guildName: hypixelGuild.name,
            //staffemoji: "⭐",
            staffemoji: interaction.member.roles.cache.has(config.discord.buttons.staffRole)? "⭐" : "",
          }),
          "Updated Roles",
          )
          .then(member => console.log(`Updated nickname of ${member.user.username}`))
          .catch(e => null);

      }
      // ROLE LOGS
        let str = `${interaction.member.toString()} received the following role changes:\n\n`;

        if (memberRoles.rolesToAdd.length) {
          // console.log(`ADD - ${interaction.member.user.tag} - ${memberRoles.rolesToAdd.join(', ')}`)
          
          str += "**Roles Added:**\n";
          memberRoles.rolesToAdd.forEach((role) => str += `\`+\` <@&${role.id}> - ${role.reason}\n`);
        }

        if (memberRoles.rolesToRemove.length) {
          // console.log(`REMOVE - ${interaction.member.user.tag} - ${memberRoles.rolesToRemove.join(', ')}`)
          // console.log(`TOTAL: ${memberRoles.array()}`)

          str += "**Roles Removed:**\n";
          memberRoles.rolesToRemove.forEach((role) => str += `\`-\` <@&${role.id}> - ${role.reason}\n`);
        }
        



        if ((memberRoles.rolesToRemove.length || memberRoles.rolesToAdd.length)) {
          // const rolesremove = memberRoles.rolesToRemove.map(r => r.id);
          // const rolesadd = memberRoles.rolesToAdd.map(rr => rr.id);

          // await interaction.member.roles.add(memberRoles.rolesToAdd.map(rr => rr.id), 'Updated Roles').catch(e => null);
          // await interaction.member.roles.remove(memberRoles.rolesToRemove.map(r => r.id), 'Updated Roles').catch(e => null);

          for (role of memberRoles.rolesToAdd){
            await delay(100);
            await interaction.member.roles.add(role.id, 'Updated Roles').catch(e => null);
          }
          for (role of memberRoles.rolesToRemove){
            await delay(100);
            await interaction.member.roles.remove(role.id, 'Updated Roles').catch(e => null);
          }
              
          
          const roleLogChannel = await guild.channels.fetch(config.discord.channels.roleLogsChannel);
          const logsRole = new EmbedBuilder()
            .setAuthor({
              name: title_log_embed, 
              iconURL: interaction.member.user.avatarURL()
            })
            .setDescription(str)
            .setColor(15844367) // Gold
            .setTimestamp()
            .setFooter({
              text: `Golden Legion Bot`,
              iconURL: "https://i.imgur.com/Fc2R9Z9.png",
            });  
            //.setThumbnail(genThumbnail(verifiedUser.uuid))

          roleLogChannel.send({embeds: [logsRole]}).catch(e => console.log(`&6[AutoRole] &4Could not send message in log channel channel name: ${roleLogChannel.name} \n ${e}`));
        }


      if (interaction.doNotRespond || interaction.unverify){
      } else{
        const updateRole = new SuccessEmbed(
          `<@${interaction.user.id}>'s roles have been successfully synced with \`${player.nickname ?? "Unknown"}\`!`,
          { text: `Golden Legion Bot`, iconURL: "https://i.imgur.com/Fc2R9Z9.png" },
        );

        
        await interaction.followUp({ embeds: [updateRole], ephemeral: true });
      }
     
    } catch (error) {
      console.error(error);
      if (!interaction.doNotRespond){
        const errorEmbed = new EmbedBuilder()
          .setColor(15548997)
          .setAuthor({ name: "An Error has occurred" })
          .setDescription(`\`\`\`${error}\`\`\``)
          .setFooter({
            text: `Golden Legion Bot`,
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
          });

      await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
      }

      
    }
  },
};