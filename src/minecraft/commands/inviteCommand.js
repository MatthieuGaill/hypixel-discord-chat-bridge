const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const { addInvite } = require("../../contracts/guildInvite.js");


class inviteCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "invite";
    this.aliases = [""];
    this.description = "Invite player (1 min cooldown)";
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
        console.log(`cooldown: ${this.isOnCooldown}`);
        if (this.isOnCooldown) {
          return this.send(`/gc ${username} Command is on cooldown for 1 min until player accept the invitation`);
        }
        let isRemove = false;
        let user = this.getArgs(message)[0];


        if (user === undefined) {
            // eslint-disable-next-line no-throw-literal
            throw "Please provide a username!";
        }
        let inviterUUID = await getUUID(username).catch((error) => {
            throw error;
         });

        let invitedUUID = await getUUID(user).catch((error) => {
            throw "Invalid username";
        });

        this.isOnCooldown = true;
        
        const inviteListener = async (message) => {
            message = message.toString();
            if (message.includes("You invited")){
                this.send(`/gc ${user} has been invited, waiting for them to accept up to 1min`);
                await delay(2000);
            }else if (message.toLowerCase().includes(`joined the guild!`)){
                bot.removeListener("message", inviteListener);
                isRemove = true;
                await addInvite(inviterUUID, invitedUUID);
                this.isOnCooldown = false;
           } else if (message.includes("already invited")){                
                bot.removeListener("message", inviteListener);
                isRemove = true;
                this.send(`/gc [ERROR] ${user} is already invited`);
                this.isOnCooldown = false;
            } else if (message.includes("already")){                
                bot.removeListener("message", inviteListener);
                isRemove = true;
                this.send(`/gc [ERROR] ${user} is already in a guild`);
                this.isOnCooldown = false;
            } else if (message.includes("offline invite")){
                bot.removeListener("message", inviteListener);
                isRemove = true;
                this.send(`/gc [ERROR] ${user} is offline!`);
                this.isOnCooldown = false;
            } else if (message.includes("full")){
              bot.removeListener("message", inviteListener);
              isRemove = true;
              this.send(`/gc [ERROR] guild is full!`);
              this.isOnCooldown = false;
            }
        };
        bot.on("message", inviteListener);
        this.send(`/g invite ${user}`)
        // await delay(60000);
        // if (isRemove === false){
        //   bot.removeListener("message", inviteListener);
        //   this.send(`${username}'s invite timed out`);    
        // }
        setTimeout(() => {
            bot.removeListener("message", inviteListener);    
            if (this.isOnCooldown = true){
                //this.send("/gc Invite timed out");
                this.isOnCooldown = false;
            }
        }, 60000);

    } catch (error) {
        this.send(`/gc [ERROR] ${error}`);
        console.error(error);
        this.isOnCooldown = false;
    }
  }
}

module.exports = inviteCommand;
