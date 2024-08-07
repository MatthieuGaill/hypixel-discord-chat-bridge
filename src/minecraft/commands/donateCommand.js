const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const { addDonation, format_amount} = require("../../contracts/donator.js");


class donateCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "donate";
    this.description = "Donation request(1 min cooldown)";
    this.options = [
      {
        name: "amount",
        description: "amount of donations in M coins",
        required: true,
      },
    ];
    this.isOnCooldown = false;
  }

  async onCommand(username, message) {
    try {
        console.log(`cooldown: ${this.isOnCooldown}`);
        // if (whole_string === ""){
        //     throw `Do not use this command from discord`;
        // }
        if (this.isOnCooldown) {
          return this.send(`/oc ${username} Command is on cooldown for 1 min until player confirm`);
        }
        let amount = this.getArgs(message)[0];
        let donatorUUID = await getUUID(username).catch((error) => {
            throw error;
         });
        if (amount === undefined) {
            // eslint-disable-next-line no-throw-literal
            throw "Please provide an amount in Million coins (example: 2 = 2M coins)";
        }
        amount = parseFloat(amount);
        if (amount <= 1){
            throw "At least 1M coins can be donated";
        }
        
        
        this.isOnCooldown = true;

        this.minecraft.BroadcastDonationRequest({username: username, amount: amount});
        // const donateListener = async (message) => {
        //     message = message.toString();
        //     if (message.includes("You invited")){
        //         this.send(`/gc ${user} has been invited, waiting for them to accept up to 1min`);
        //         await delay(2000);
        //     }else if (message.toLowerCase().includes(`joined the guild!`)){
        //         bot.removeListener("message", donateListener);
        //         isRemove = true;
        //         await addInvite(inviterUUID, invitedUUID);
        //         this.isOnCooldown = false;
        //    } else if (message.includes("already invited")){                
        //         bot.removeListener("message", donateListener);
        //         isRemove = true;
        //         this.send(`/gc [ERROR] ${user} is already invited`);
        //         this.isOnCooldown = false;
        //     } else if (message.includes("already")){                
        //         bot.removeListener("message", donateListener);
        //         isRemove = true;
        //         this.send(`/gc [ERROR] ${user} is already in a guild`);
        //         this.isOnCooldown = false;
        //     } else if (message.includes("offline invite")){
        //         bot.removeListener("message", donateListener);
        //         isRemove = true;
        //         this.send(`/gc [ERROR] ${user} is offline!`);
        //         this.isOnCooldown = false;
        //     } else if (message.includes("full")){
        //       bot.removeListener("message", donateListener);
        //       isRemove = true;
        //       this.send(`/gc [ERROR] guild is full!`);
        //       this.isOnCooldown = false;
        //     }
        // };

        // bot.on("message", donateListener);
       
        // setTimeout(() => {
        //     bot.removeListener("message", donateListener);    
        //     if (this.isOnCooldown = true){
        //         this.send("/oc Donation confirm timed out");
        //         this.isOnCooldown = false;
        //     }
        // }, 60000);



    } catch (error) {
        this.send(`/oc [ERROR] ${error}`);
        console.error(error);
        this.isOnCooldown = false;
    }
  }
}

module.exports = donateCommand;
