const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { SuccessEmbed } = require("../../contracts/embedHandler.js");
const { getUsername } = require("../../contracts/API/mowojangAPI.js");
const { EmbedBuilder } = require("discord.js");
const { selectlink_discord, removelink_discord } = require("../../contracts/verify.js");
const config = require("../../../config.json");
const MemberRoles = require("../other/MemberRoles.js");

module.exports = {
  name: "unverify",
  description: "Remove your linked Minecraft account",
  verificationCommand: true,

  execute: async (interaction, user) => {
    try {

      if (user !== undefined){
        interaction.user = user;
      }
      const uuid =  await selectlink_discord(interaction.user.id);
      if (uuid === undefined) {
        throw new HypixelDiscordChatBridgeError(`You are not verified. Please run /verify to continue.`);
      }

      await removelink_discord(interaction.user.id);


      interaction.unverify = true;
      //interaction.member = await interaction.guild.members.fetch(interaction.user.id);

      const updateRolesCommand = require("./updateCommand.js");
      if (updateRolesCommand === undefined) {
        throw new HypixelDiscordChatBridgeError("The update command does not exist. Please contact an administrator.");
      }
      await updateRolesCommand.execute(interaction, interaction.user);
      // let memberRoles = new MemberRoles([...interaction.member.roles.cache.keys()]);
      // let str = `${interaction.member.toString()} received the following role changes:\n\n`;
      // title_log_embed = `Auto Role → Role Changes (Member Left/Unverified)`;
      // const roles = [
      //   config.verification.verifiedRole,
      //   //config.verification.guestRole,
      //   config.verification.guildMemberRole,
      //   ...config.verification.ranks.map((r) => r.role),
      //   ...config.verification.hypixelranks.map((r) => r.role),
      //   ...config.verification.timeroles.map((r) => r.role),
      // ];

      // for (const role of roles) {
      //   if (role === config.verification.verifiedRole && config.verification.removeVerificationRole === false) {
      //     continue;
      //   }
      //   memberRoles.removeRole(role, "Unverified");
      //   if (interaction.member.roles.cache.has(role)) {
      //     interaction.member.roles.remove(role, "Updated Roles");
      //   }
      // }
      // if (memberRoles.rolesToAdd.length) {
      //   // console.log(`ADD - ${interaction.member.user.tag} - ${memberRoles.rolesToAdd.join(', ')}`)
        
      //   str += "**Roles Added:**\n";
      //   memberRoles.rolesToAdd.forEach((role) => str += `\`+\` <@&${role.id}> - ${role.reason}\n`);
      // }

      // if (memberRoles.rolesToRemove.length) {
      //   // console.log(`REMOVE - ${interaction.member.user.tag} - ${memberRoles.rolesToRemove.join(', ')}`)
      //   // console.log(`TOTAL: ${memberRoles.array()}`)

      //   str += "**Roles Removed:**\n";
      //   memberRoles.rolesToRemove.forEach((role) => str += `\`-\` <@&${role.id}> - ${role.reason}\n`);
      // }
    
      
      // const roleLogChannel = await guild.channels.fetch(config.discord.channels.roleLogsChannel);
      // const logsRole = new EmbedBuilder()
      //   .setAuthor({
      //     name: title_log_embed, 
      //     iconURL: interaction.member.user.avatarURL()
      //   })
      //   .setDescription(str)
      //   .setColor(5763719)
      //   .setTimestamp()
      //   .setFooter({
      //     text: `Golden Legion Bot`,
      //     iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      //   });  
      //   //.setThumbnail(genThumbnail(verifiedUser.uuid))

      // roleLogChannel.send({embeds: [logsRole]}).catch(e => console.log(`&6[AutoRole] &4Could not send message in log channel channel name: ${roleLogChannel.name} \n ${e}`));

      const updateRole = new SuccessEmbed(
        `You have successfully unlinked \`${await getUsername(uuid)}\`. Run \`/verify\` to link a new account.`,
        { text: `/help [command] for more information`, iconURL: "https://i.imgur.com/Fc2R9Z9.png" },
      );
      await interaction.followUp({ embeds: [updateRole] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor(15548997)
        .setAuthor({ name: "An Error has occurred" })
        .setDescription(`\`\`\`${error}\`\`\``)
        .setFooter({
          text: `/help [command] for more information`,
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });

      await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};