const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { resolveUsernameOrUUID } = require("../../contracts/API/mowojangAPI.js");
const { addblock, removeblock, getAllblocks } = require("../../contracts/blockwarp.js");



module.exports = {
  name: "blockwarp",
  description: "Blacklist players from warpout command",
  options: [
    {
      name: "action",
      description: "action to run",
      type: 3,
      required: true,
      choices: [
        {
          name: "Add (need a name/UUID)",
          value: "add",
        },
        {
          name: "Show the blacklist",
          value: "list",
        },
        {
          name: "Remove (need a name/UUID)",
          value: "remove",
        },
      ],
    },
    {
      name: "name",
      description: "username or UUID to ban",
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

    try {
  
      const [action, name] = [interaction.options.getString("action"), interaction.options.getString("name")];


      if (action === "add"){
        if (name === null || !name){
          throw "You must specify an username or UUID with add";
        }

        const dataUUID = await resolveUsernameOrUUID(name);
        if (!dataUUID){
          throw "Invalid Username or UUID";
        }
     
        const uuid = dataUUID['uuid'];
        const username = dataUUID['username'];
  
        
        await addblock(uuid, username)
        const embed = new EmbedBuilder()
        .setColor(2067276)
        .setAuthor({ name: `Username Added`})
        .setDescription(`Successfully added **${username}** with the uuid **${uuid}**`)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
  
        await interaction.followUp({embeds: [embed],});
        
      } else if (action === "remove"){
        const dataUUID = await resolveUsernameOrUUID(name);
        if (!dataUUID){
          throw "Invalid Username or UUID";
        }
     
        const uuid = dataUUID['uuid'];
        const username = dataUUID['username'];
        await removeblock(uuid);
      
        const embed = new EmbedBuilder()
        .setColor(15105570)
        .setAuthor({ name: "User Removed" })
        .setDescription(`Successfully removed **${username}** from the black list`)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        await interaction.followUp({embeds: [embed],});
  
        
      } else if (action === "list"){
        const verticalList = await getList();
        const embed = new EmbedBuilder()
        .setColor(16777215)
        .setAuthor({ name: "Black List (warpouts)" })
        .setDescription(verticalList)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
      
        await interaction.followUp( {embeds: [embed]});
      } else {
        throw "Wrong usage: /blockwarp (add/remove/list) [username/uuid]";
      }
      
    } catch(e){
        throw new HypixelDiscordChatBridgeError(`${e}`);
    }

  },

};

  
async function getList(){
  const dataDictionary = {};

  const rows = getAllblocks();

  rows.forEach((row) => { dataDictionary[row.key] = row.username;});
  let verticalList = Object.entries(dataDictionary)
    .map(([key, username]) => `**${username}**   (${key})`)
    .join('\n'); 

  if (!verticalList){
    verticalList = "nobody on the warpout blacklist yet!";
  }
  return verticalList;

}
