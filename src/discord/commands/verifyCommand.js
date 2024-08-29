const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const hypixelRebornAPI = require("../../contracts/API/HypixelRebornAPI.js");
const { writeFileSync, readFileSync } = require("fs");
const config = require("../../../config.json");
const { EmbedBuilder } = require("discord.js");
const { selectlink_discord, selectlink_uuid, removelink_discord, removelink_uuid, addlink } = require("../../contracts/verify.js");

module.exports = {
  name: "verify",
  description: "Connect your Discord account to Minecraft",
  verificationCommand: true,
  options: [
    {
      name: "name",
      description: "Minecraft Username",
      type: 3,
      required: true,
    },
  ],

  execute: async (interaction, user, bypassChecks = false) => {
    try {

      if (bypassChecks === true && user !== undefined) {
        interaction.user = user;
        console.log(interaction.user.tag);
      }
      const data_uuid = await selectlink_discord(interaction.user.id);
      if (data_uuid){
        if (bypassChecks === true) {
          await removelink_discord(interaction.user.id);
        } else {
          throw new HypixelDiscordChatBridgeError(
            "You are already linked to a Minecraft account. Please run /unverify first.",
          );
        }
      }

      const username = interaction.options.getString("name");
      const { socialMedia, nickname, uuid } = await hypixelRebornAPI.getPlayer(username);
      const data_discordId = await selectlink_uuid(uuid);
      if (data_discordId){
        if (bypassChecks === true) {
          await removelink_uuid(uuid);
        } else {
          throw new HypixelDiscordChatBridgeError(
            "This player is already linked to a Discord account. Please contact an administrator.",
          );
        }
      }
      if (bypassChecks = true){
        const check_member = await interaction.guild.members.fetch(interaction.user.id).catch(e => null);
        if (!check_member){
          throw "This person is not on the guild discord server!";
        }
      }

      const discordUsername = socialMedia.find((media) => media.id === "DISCORD")?.link;
      if (discordUsername === undefined && bypassChecks !== true) {
        throw new HypixelDiscordChatBridgeError("This player does not have a Discord linked.");
      }

      if (discordUsername?.toLowerCase() != interaction.user.username && bypassChecks !== true) {
        throw new HypixelDiscordChatBridgeError(
          `The player '${nickname}' has linked their Discord account to a different account ('${discordUsername}').`,
        );
      }

      const linkedRole = guild.roles.cache.get(config.verification.verifiedRole);
      console.log(config.verification.verifiedRole);
      if (linkedRole === undefined) {
        throw new HypixelDiscordChatBridgeError("The verified role does not exist. Please contact an administrator.");
      }

      // linked[interaction.user.id] = uuid;
      // writeFileSync("data/linked.json", JSON.stringify(linked, null, 2));
      await addlink(uuid, interaction.user.id);

      const embed = new EmbedBuilder()
        .setColor("4BB543")
        .setAuthor({ name: "Successfully linked!" })
        .setDescription(`${user ? `<@${user.id}>'s` : "Your"} account has been successfully linked to \`${nickname}\``)
        .setFooter({
          text: `/help [command] for more information`,
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });

      await interaction.editReply({ embeds: [embed], ephemeral: true });

      const updateRolesCommand = require("./updateCommand.js");
      if (updateRolesCommand === undefined) {
        throw new HypixelDiscordChatBridgeError("The update command does not exist. Please contact an administrator.");
      }
      console.log(interaction.user);
      await updateRolesCommand.execute(interaction, interaction.user);
    } catch (error) {
      console.log(error);
      // eslint-disable-next-line no-ex-assign
      error = error
        .toString()
        .replaceAll("Error: [hypixel-api-reborn] ", "")
        .replaceAll(
          "Unprocessable Entity! For help join our Discord Server https://discord.gg/NSEBNMM",
          "This player does not exist. (Mojang API might be down)",
        );

      const errorEmbed = new EmbedBuilder()
        .setColor(15548997)
        .setAuthor({ name: "An Error has occurred" })
        .setDescription(`\`\`\`${error}\`\`\``)
        .setFooter({
          text: `/help [command] for more information`,
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });

      await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });

      if (
        error !== "You are already linked to a Minecraft account. Please run /unverify first." &&
        error.includes("linked") === true
      ) {
        const verificationTutorialEmbed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setAuthor({ name: "Link with Hypixel Social Media" })
          .setDescription(
            `**Instructions:**\n1) Use your Minecraft client to connect to Hypixel.\n2) Once connected, and while in the lobby, right click "My Profile" in your hotbar. It is option #2.\n3) Click "Social Media" - this button is to the left of the Redstone block (the Status button).\n4) Click "Discord" - it is the second last option.\n5) Paste your Discord username into chat and hit enter. For reference: \`${
              interaction.user.username ?? interaction.user.tag
            }\`\n6) You're done! Wait around 30 seconds and then try again.\n\n**Getting "The URL isn't valid!"?**\nHypixel has limitations on the characters supported in a Discord username. Try changing your Discord username temporarily to something without special characters, updating it in-game, and trying again.`,
          )
          .setImage("https://media.discordapp.net/attachments/922202066653417512/1066476136953036800/tutorial.gif")
          .setFooter({
            text: `/help [command] for more information`,
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
          });

        await interaction.followUp({ embeds: [verificationTutorialEmbed], ephemeral: true  });
      }
    }
  },
};