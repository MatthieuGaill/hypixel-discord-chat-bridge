const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  name: "chainkick",
  description: "Chain kick the given users from the guild",
  options: [
    {
      name: "names",
      description: "List of username separated by a comma (,)",
      type: 3,
      required: true,
    },
    {
      name: "reason",
      description: "Reason",
      type: 3,
      required: true,
    },
  ],

  execute: async (interaction) => {
    const user = interaction.member;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }

    const [names, reason] = [interaction.options.getString("names"), interaction.options.getString("reason")];

    const regex = /^[\w]+(?:,[\w]+)*$/;
    if (!regex.test(names)){
        throw new HypixelDiscordChatBridgeError("Wrong format. Type the names separated with a comma between each and without any space!");
    }

    const name_list = names.split(',');
    console.log(name_list)
    bot.chat(`/gc Kicking the following members for the reason: ${reason}`)
    for (let i = 0; i< name_list.length; i++){
        await delay(1200);
        //console.log(`${name_list[i]} kicked`);
        bot.chat(`/g kick ${name_list[i]} ${reason}`);
    }
    

    const embed = new EmbedBuilder()
      .setColor(5763719)
      .setAuthor({ name: "Chain kicks" })
      .setDescription(`Successfully attempted to kick **${names}**`)
      .setFooter({
        text: `/help [command] for more information`,
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });

    await interaction.followUp({
      embeds: [embed],
    });
  },
};