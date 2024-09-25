const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { setCollected, resetCollected, getList } = require("../../contracts/collecteddonations.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");


module.exports = {
  name: "collected_donations",
  description: "Current donations attributed to managers",
  options: [
    {
      name: "set",
      description: "manually assign an amount to a manager",
      type: 1,
      options: [
        {
          name: "manager",
          description: "manager discord",
          type: 6,
          required: true,
        },
        {
          name: "amount",
          description: "in Million coins",
          type: 3,
          required: true,
        }
      ]
    },
    {
      name: "reset",
      description: "reset all collected donations",
      type: 1,
    },
    {
      name: "list",
      description: "list of collected donations by manager names",
      type: 1,
    }
  ],
  
  execute: async (interaction) => {

    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }

    try {
      const action = interaction.options.getSubcommand();

      if (action === "set"){
        const user = interaction.options.getMember("manager");
        const amount = parseFloat(interaction.options.getString("amount"))
        if (!user.roles.cache.has(config.discord.buttons.adminRole)){
          throw "You do not have permission to use this command."
        }
          await setCollected(user.id, amount);

          const embed = new EmbedBuilder()
          .setColor(2067276)
          .setAuthor({name :`Success`})
          .setDescription(`Assigned **${amount} M **to <@${user.id}>`)
          .setFooter({
            text: ' ',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
          });
          await interaction.followUp({embeds: [embed],});


      } else if (action === "list"){
        const dataDictionary = await getList();

        let verticalList = Object.entries(dataDictionary)
        .sort(([, a], [, b]) => b.totalInvited - a.totalInvited)
        .map(([id, am]) => `<@${id}>: ${am}`)
        .join('\n');

        if (!verticalList) {
            verticalList = "No coins collected yet.";
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
      
      } else if (action==="reset"){
        await resetCollected();
        const embed = new EmbedBuilder()
        .setColor(2067276)
        .setAuthor({name :`Success`})
        .setDescription(`Reset all the collected coins list!`)
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

