const sqlite3 = require('sqlite3');
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { getUsername, resolveUsernameOrUUID } = require("../../contracts/API/PlayerDBAPI.js");
const { isUuid } =  require("../../../API/utils/uuid.js");



module.exports = {
  name: "banlist",
  description: "Ban List of the guild",
  options: [
    {
      name: "action",
      description: "action to run: (add/remove/list)",
      type: 3,
      required: true,
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
      const db = new sqlite3.Database('banlist.sqlite');
      db.run('CREATE TABLE IF NOT EXISTS bandata (key TEXT PRIMARY KEY, value TEXT)');
  
      const [action, name] = [interaction.options.getString("action"), interaction.options.getString("name")];

      if (isUuid(name)){
        const uuid = name;
        const username = getUsername(uuid);
      } else{
        const dataUUID = resolveUsernameOrUUID(name);
        const uuid = dataUUID['uuid'];
        const username = dataUUID['username'];
      }
      
      
      if (action === "add" || action === "Add"){
        if (name === null){
          throw new HypixelDiscordChatBridgeError("You must specify an username or UUID with add");
        }
        
        db.run('INSERT OR REPLACE INTO bandata (key, username) VALUES (?, ?)', uuid, username);
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
        if (username === null){
          throw new HypixelDiscordChatBridgeError("You must specify an username or UUID with remove");
        }
        db.run('DELETE FROM bandata WHERE key = ?', uuid);
        const embed = new EmbedBuilder()
        .setColor(15105570)
        .setAuthor({ name: "User Removed" })
        .setDescription(`Successfully removed **${username}** from the banlist`)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        await interaction.followUp({embeds: [embed],});
  
        
      } else if (action === "list"){
        const embed = await getList(db);
      
        await interaction.followUp( {embeds: [embed]});
      } else {
        throw "Wrong usage: /banlist (add/remove/list) [username]";
      }
      
    } catch(e){
      throw new HypixelDiscordChatBridgeError(`${e}`);
    }

  },

};

  
async function getList(db){
  const dataDictionary = {};
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM bandata', [], (err, rows) => {
      if (err) {
        //console.error(err);
        reject(err);
      }
      rows.forEach((row) => { dataDictionary[row.key] = row.value;});
      let verticalList = Object.entries(dataDictionary)
       .map(([key, username]) => `**${key}** :  ${username}`)
       .join('\n'); 
      if (!verticalList){
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
      db.close();
      resolve(embed)
    });
  });
}
