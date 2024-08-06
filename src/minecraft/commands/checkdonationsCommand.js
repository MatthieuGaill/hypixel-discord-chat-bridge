const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const { checkdonator, format_amount } = require("../../contracts/donator.js");
const hypixel = require("../../contracts/API/HypixelRebornAPI.js");

class checkdonationsCommand extends minecraftCommand {
    constructor(minecraft) {
      super(minecraft);
  
      this.name = "donations";
      this.description = "Check donation amount of a player";
      this.options = [
        {
          name: "username",
          description: "Minecraft username",
          required: true,
        },
      ];
    }
  
    async onCommand(username, message) {
      try {
          username = this.getArgs(message)[0] || username;


          let usernameUUID = await getUUID(username).catch((error) => {
              usernameUUID = '0';
              throw error;         
          });
          //  const guild = client.guilds.cache.get("819229417796534283");
          //  const hypixelGuild = await hypixel.getGuild('name', 'Golden Legion');
          //  const hypixelGuildMembers = hypixelGuild.members.map(member => member.uuid.replace(/-/g, ''));
          const member_amount = await checkdonator(donatorUUID);
          if (member_amount[1] === 0){
            this.send(`/gc "${username} is not very generous :(`);
          }
          this.send(`/gc ${member_amount[0]} donated ${format_amount(member_amount[1])} coins so far!)`);


      } catch (error) {
          this.send(`/oc [ERROR] ${error}`);
      }
    }
  }
  
  module.exports = checkdonationsCommand;
  