const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { checkcode } = require("../../contracts/secretcodes.js");

module.exports = {
  name: "code",
  description: "Voucher tool",
  options: [
    {
      name: "code",
      description: "code",
      type: 3,
      required: true,
    },
  ],

  execute: async (interaction) => {
    const user = interaction.user;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }
    

    const code_key = interaction.options.getString("code").toUpperCase().replace(/\s/g, '');

    try {
      const embed = new EmbedBuilder();
      const row = await checkcode(code_key);
      
      if (row) {
        embed
        .setColor("Gold")
        .setAuthor({ name: "Prize claimed!" })
        .setDescription(`Congratulations <@${user.id}> you win a **${row.value}**`)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",});

      } else {      
        embed
        .setColor(10038562)
        .setAuthor({ name: "Invalid Code!" })
        .setDescription(`**${code_key}** is not a valid code (anymore)!`)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",});
      }


      await interaction.followUp({embeds: [embed],});

    } catch{
      embed
      .setColor("Red")
      .setAuthor({ name: "Error" })
      .setDescription(`contact an administrator`)
      .setFooter({
        text: ' ',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",});
    }

  }
};
