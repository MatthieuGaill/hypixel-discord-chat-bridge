const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { addcode, removecode, getAllcodes } = require('../../contracts/secretcodes.js');



module.exports = {
  name: "ticket",
  description: "Voucher tool",
  options: [
    {
      name: "action",
      description: "action to run: (add/remove/list)",
      type: 3,
      required: true,
      choices: [
        {
          name: "Add",
          value: "add",
        },
        {
          name: "Remove",
          value: "remove",
        },
        {
          name: "List",
          value: "list",
        },
      ]
    },
    {
      name: "code",
      description: "code",
      type: 3,
      required: false,
    },
    {
      name: "value",
      description: "value",
      type: 3,
      required: false,
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

    const [action, code_key, code_value] = [interaction.options.getString("action"), interaction.options.getString("code"), interaction.options.getString("value")];

    if (action === "add"){
      if (code_key === null || code_value === null){
        throw new HypixelDiscordChatBridgeError("You must specify a code & value with add");
      }
      const code_key_func = code_key.toUpperCase().replace(/\s/g, '');
      await addcode(code_key_func, code_value);
      const embed = new EmbedBuilder()
      .setColor(2067276)
      .setAuthor({ name: "Ticket created" })
      .setDescription(`Successfully created code **${code_key_func}** with the value **${code_value}**`)
      .setFooter({
        text: ' ',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });

      await interaction.followUp({embeds: [embed],});
      
    } else if (action === "remove"){
      if (code_key === null){
        throw new HypixelDiscordChatBridgeError("You must specify a code (to remove) with remove");
      }
      const code_key_func = code_key.toUpperCase().replace(/\s/g, '');
      await removecode(code_key_func);
      const embed = new EmbedBuilder()
      .setColor(15105570)
      .setAuthor({ name: "Ticket removed" })
      .setDescription(`Successfully removed code **${code_key_func}**`)
      .setFooter({
        text: ' ',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
      await interaction.followUp({embeds: [embed],});

      
    } else if (action === "list"){

      const verticalList = await getList();
      const embed = new EmbedBuilder()
      .setColor(16777215)
      .setAuthor({ name: "Code list" })
      .setDescription(verticalList)
      .setFooter({
        text: ' ',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
  
      await interaction.followUp( {embeds: [embed]});
      
    } else {
      throw new HypixelDiscordChatBridgeError("Wrong usage: /ticket (add/remove/list) [code] [value]");
    }

  },

};

  
async function getList(){
  const dataDictionary = {};
  const rows = await getAllcodes();

  rows.forEach((row) => { dataDictionary[row.key] = row.value;});
  let verticalList = Object.entries(dataDictionary)
    .map(([key, value]) => `**${key}** :  ${value}`)
    .join('\n');

  if (!verticalList){
    verticalList = "no codes registered yet!";
  }
  return verticalList;

}

  
