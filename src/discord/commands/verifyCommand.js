const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { addentry, selectentry } = require("../../contracts/verify.js");
const { checkdonator, UpdateRoles } = require("../../contracts/donator.js");
const Database = require('better-sqlite3');
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { getUsername, resolveUsernameOrUUID } = require("../../contracts/API/PlayerDBAPI.js");
const { isUuid } =  require("../../../API/utils/uuid.js");

const db0 = new Database('verify_tmp.sqlite');
db0.exec(`CREATE TABLE IF NOT EXISTS verifydata (
  uuid TEXT PRIMARY KEY,
  discordid TEXT
)`);


module.exports = {
  name: "link",
  description: "Link your discord to your minecraft username!",
  options: [
    {
      name: "minecraft_username",
      description: "In-game name (or UUID)",
      type: 3,
      required:true,
    },

  ],
  
  execute: async (interaction) => {
    const user = interaction.member;
    const guild = interaction.guild;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }

    const mc = interaction.options.getString("minecraft_username")
    let mcUUID= " ";
    let mcusername= " ";
    if (isUuid(mc)){
        mcusername = await getUsername(mc);
    } else{
        const dataUUIDmc = await resolveUsernameOrUUID(mc);
        if (!dataUUIDmc){
            throw `Mc username/UUID does not exist`;
        }
        mcUUID = dataUUIDmc['uuid'];
        mcusername = dataUUIDmc['username'];
    }

    try {
      const test = await selectentry(mcUUID);
      if (test){
        console.log("test1");
        throw `${mcusername} already linked to <@${test}>`;
      }
      const player = await db0.prepare('SELECT discordid FROM verifydata WHERE uuid = ?').get(mcUUID);

      if (player){
        const discord_name = player.discordid
        let discord_id = ""
        if (user.id === discord_name){
          discord_id = discord_name;
        } else{
          const member = guild.members.cache.find(m => m.user.tag === discord_name);
          if (!member){
            throw `Could not find the linked discord, watch for case or use your discord ID`
          }
          discord_id = member.id;
        }
        
        
 
        if (user.id === discord_id){
          await addentry(mcUUID, user.id);
          const data_amount = await checkdonator(mcUUID);
          await UpdateRoles(guild, true, user.id, data_amount[1]);
          db0.prepare('DELETE FROM verifydata WHERE uuid = ?').run(mcUUID);      
          const embed = new EmbedBuilder()
          .setColor(2067276)
          .setTitle("Success")
          .setDescription(`Successfully linked \`${mcusername}\` to <@${user.id}>`)
          .setFooter({
            text: 'Link Tool',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
          });
          await interaction.followUp({embeds: [embed],});
          
        } else{
          throw `Discords do not match!`;
        }

      } else{
        throw "First, run !link [discord name] in normal guild chat on hypixel";

      }
      
      
      
    } catch(e){
      console.error(e);
      const embed = new EmbedBuilder()
      .setColor(15105570)
      .setTitle("Error")
      .setDescription(e)
      .setFooter({
        text: 'Link Tool',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
      await interaction.followUp({embeds: [embed],});
      //throw new HypixelDiscordChatBridgeError(`${e}`);
    }

  },

};

