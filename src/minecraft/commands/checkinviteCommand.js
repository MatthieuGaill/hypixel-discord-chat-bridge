const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/mowojangAPI.js");
const { getInvites } = require("../../contracts/guildInvite.js");
const hypixel = require("../../contracts/API/HypixelRebornAPI.js");

class checkinviteCommand extends minecraftCommand {
    constructor(minecraft) {
      super(minecraft);
  
      this.name = "invitestats";
      this.aliases = ["invstats", "istats"];
      this.description = "Check invite stats of a player";
      this.options = [
        {
          name: "username",
          description: "Minecraft username",
          required: true,
        },
      ];
      this.isOnCooldown = false;
    }
  
    async onCommand(username, message) {
      try {
          username = this.getArgs(message)[0] || username;


          let usernameUUID = await getUUID(username).catch((error) => {
              usernameUUID = '0';
              throw error;         
           });
           const guild = client.guilds.cache.get("819229417796534283");
           const hypixelGuild = await hypixel.getGuild('name', 'Golden Legion');
           const hypixelGuildMembers = hypixelGuild.members.map(member => member.uuid.replace(/-/g, ''));
           const dataDictionary = await getInvites(usernameUUID, hypixelGuildMembers, guild);
           this.send(`/gc Total invites of ${username}: ${dataDictionary['totalInvited']}  (${dataDictionary['invited_discord']} verified)`);
  

      } catch (error) {
          this.send(`/oc [ERROR] ${error}`);
          console.error(error);
          this.isOnCooldown = false;
      }
    }
  }
  
  module.exports = checkinviteCommand;
  