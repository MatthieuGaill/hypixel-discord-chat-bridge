const { EmbedBuilder } = require("discord.js");
const hypixelRebornAPI = require("../../contracts/API/HypixelRebornAPI.js");
const { resolveUsernameOrUUID } = require("../../contracts/API/mowojangAPI.js");
const { getUniqueEntries } = require("../../contracts/moderation.js");
const config = require("../../../config.json");
const { getUsername } = require("../../contracts/API/PlayerDBAPI.js");
const { selectlink_uuid, selectlink_discord } = require("../../contracts/verify.js");

module.exports = {
  name: "modlogs",
  description: "Show the moderation logs of a user",
  moderatorOnly: true,
  requiresBot: false,
  options: [
    {
      name: "mc_name",
      description: "Minecraft username or UUID",
      type: 3,
      required: false,
    },
    {
      name: "member",
      description: "Discord member (optional if not linked)",
      type: 6,
      required: false,
    },
    {
      name: "page",
      description: "Page number to display",
      type: 4, // Integer type
      required: false,
    },
  ],

  execute: async (interaction) => {
    let mcname = interaction.options.getString("mc_name");
    const member = await interaction.options.getMember("member");
    const pageNumber = interaction.options.getInteger("page") || 1; // Default to page 1 if not provided

    try {
      // Minecraft name processing
      let uuid;
      let discord_member;

      if (mcname) {
        const dataUUID = await resolveUsernameOrUUID(mcname).catch(() => null);
        if (!dataUUID) {
          throw "Invalid Minecraft username or UUID";
        }
        uuid = dataUUID['uuid'];
        mcname = dataUUID['username'];
        const d_id = await selectlink_uuid(uuid);
        if (d_id) {
          discord_member = await interaction.guild.members.fetch(d_id).catch(e => null);
          if (!discord_member){
            const discord_user = await interaction.client.users.fetch(d_id).catch(e => null);
            if (discord_user){
              discord_member = { 
                id: discord_user.id,
                user: discord_user
              };
            }
          }
        } else {
          discord_member = member ? member : undefined;
        }
      } else if (!mcname && member) {
        discord_member = member;
        const new_uuid = await selectlink_discord(discord_member.id);
        if (new_uuid) {
          const new_dataUUID = await resolveUsernameOrUUID(new_uuid).catch(() => null);
          if (new_dataUUID) {
            uuid = new_dataUUID['uuid'];
            mcname = new_dataUUID['username'];
          }
        }
      } else {
        throw "You need to provide at least a Minecraft username or a Discord member as options";
      }

      if (!discord_member) {
        discord_member = { id: 0 };
      }

      if (uuid) {
        // Get Hypixel guild member
        const hypixelGuild = await hypixelRebornAPI.getGuild("name", "Golden Legion");
        if (hypixelGuild === undefined) {
          throw "Hypixel Guild not found.";
        }
        const hypixelguildMember = hypixelGuild.members.find(m => m.uuid === uuid);
        if (!hypixelguildMember) {
          throw "Could not find Minecraft player. Weird.";
        }
      } else {
        mcname = discord_member.user.tag;
        uuid = 0;
      }



      const rows = await getUniqueEntries(discord_member.id, uuid);
      if (!rows || rows.length === 0) {
        throw "No modlogs for this user!";
      }

      // Pagination logic
      const chunkSize = 4;
      const totalPages = Math.ceil(rows.length / chunkSize);
      if (pageNumber < 1 || pageNumber > totalPages) {
        throw `Invalid page number. Please provide a number between 1 and ${totalPages}.`;
      }

      const start = (pageNumber - 1) * chunkSize;
      const strChunk = [];

      for (let i = start; i < start + chunkSize && i < rows.length; i++) {
        const row = rows[i];
        let username = await getUsername(row.uuid).catch(() => "N/A");
        const type = row.type === 0 ? "Warn" : row.type === 1 ? "Mute" : "Ban";
        let str = `**Case ${row.id}**\n**Type:** ${type}\n**Discord:** ${row.discordId > 0 ? `<@${row.discordId}>` : "N/A"}\n**Minecraft:** ${username}\n**Moderator:** ${row.moderator || "N/A"}`;
        if (row.type === 1) {
          str += `\n**Length:** ${row.duration || "N/A"}`;
        }
        str += `\n**Reason:** ${row.reason || "N/A"} - <t:${parseInt(row.Date / 1000)}>\n`;
        strChunk.push(str);
      }

      const embed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(`Modlogs for ${mcname} (Page ${pageNumber} of ${totalPages})`)
        .setDescription(strChunk.join('\n'))
        .setFooter({ text: `${rows.length} total logs | Use /modlogs [mc_name] [page] to view another page` });

      await interaction.followUp({ embeds: [embed] });

    } catch (e) {
      console.error(e);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setAuthor({ name: "Error" })
        .setDescription(e)
        .setFooter({
          text: 'Golden Legion Bot',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  },
};
