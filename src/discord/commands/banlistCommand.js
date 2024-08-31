const Database = require('better-sqlite3');
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { getUsername, resolveUsernameOrUUID } = require("../../contracts/API/mowojangAPI.js");
const { isUuid } =  require("../../../API/utils/uuid.js");
const { addbandata, removebandata, getAllbandata } = require('../../contracts/banlist.js');

module.exports = {
  name: "banlist",
  description: "Ban List of the guild",
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
          name: "Show the ban list",
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
      const db = new Database('data/banlist.sqlite');
      db.prepare('CREATE TABLE IF NOT EXISTS bandata (key TEXT PRIMARY KEY, username TEXT)').run();
  
      const [action, name] = [interaction.options.getString("action"), interaction.options.getString("name")];
      let uuid = name;
      let username = "";
      
      if (action === "add") {
        if (name === null || !name) {
          throw "You must specify a username or UUID with add";
        }

        const dataUUID = await resolveUsernameOrUUID(name);
        if (!dataUUID) {
          throw `This username/UUID doesn't exist`;
        }
        uuid = dataUUID['uuid'];
        username = dataUUID['username'];
      

        if (!username) {
          throw `This username/uuid doesn't exist`;
        }

        await addbandata(uuid, username);

        const embed = new EmbedBuilder()
          .setColor(2067276)
          .setAuthor({ name: `Username Added` })
          .setDescription(`Successfully added **${username}** with the uuid **${uuid}**`)
          .setFooter({
            text: ' ',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
          });

        await interaction.followUp({ embeds: [embed] });

      } else if (action === "remove") {
        if (name === null || !name) {
          throw "You must specify a username or UUID with remove";
        }
        const dataUUID = await resolveUsernameOrUUID(name);
        if (!dataUUID) {
          throw `This username/UUID doesn't exist`;
        }
        uuid = dataUUID['uuid'];
        username = dataUUID['username'];
        
        await removebandata(uuid);

        const embed = new EmbedBuilder()
          .setColor(15105570)
          .setAuthor({ name: "User Removed" })
          .setDescription(`Successfully removed **${username}** from the banlist`)
          .setFooter({
            text: ' ',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
          });

        await interaction.followUp({ embeds: [embed] });

      } else if (action === "list") {
        const dataDictionary = {};
        const rows = await getAllbandata();
        
        rows.forEach((row) => {
          dataDictionary[row.key] = row.username;
        });
    
        let verticalList = Object.entries(dataDictionary)
          .map(([key, username]) => `**${username}**   (${key})`)
          .join('\n');
    
        if (!verticalList) {
          verticalList = "nobody on the banlist yet!";
        }
        const embed = new EmbedBuilder()
        .setColor(16777215)
        .setAuthor({ name: "Ban List" })
        .setDescription(verticalList)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
  
        await interaction.followUp({ embeds: [embed] });

      } else {
        throw "Wrong usage: /banlist (add/remove/list) [username]";
      }

    } catch (e) {
      throw new HypixelDiscordChatBridgeError(`${e}`);
    }
  },
};
