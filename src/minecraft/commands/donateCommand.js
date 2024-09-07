const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");


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
        // console.log(`cooldown: ${this.isOnCooldown}`);
        // // if (whole_string === ""){
        // //     throw `Do not use this command from discord`;
        // // }
        // if (this.isOnCooldown) {
        //   return this.send(`/oc ${username} Command is on cooldown for 1 min until player confirm`);
        // }
        // let amount = this.getArgs(message)[0];
        // let donatorUUID = await getUUID(username).catch((error) => {
        //     throw error;
        //  });
        // if (amount === undefined) {
        //     // eslint-disable-next-line no-throw-literal
        //     throw "Please provide an amount in Million coins (example: 2 = 2M coins)";
        // }
        // amount = parseFloat(amount);
        // if (amount <= 1){
        //     throw "At least 1M coins can be donated";
        // }
        // this.send(`/oc Are you sure you wisth to send to discord a donation request of ${amount}M coins? (type "yes" to confirm)`);
        
        // this.isOnCooldown = true;
        // // const regex =
        // // config.discord.other.messageMode === "minecraft"
        // //   ? /^(?<chatType>§[0-9a-fA-F](Guild|Officer)) > (?<rank>§[0-9a-fA-F](?:\[.*?\])?)?\s*(?<username>[^§\s]+)\s*(?:(?<guildRank>§[0-9a-fA-F](?:\[.*?\])?))?\s*§f: (?<message>.*)/
        // //   : /^(?<chatType>\w+) > (?:(?:\[(?<rank>[^\]]+)\] )?(?:(?<username>\w+)(?: \[(?<guildRank>[^\]]+)\])?: )?)?(?<message>.+)$/;
        // const regex = /^(?<chatType>\w+) > (?:(?:\[(?<rank>[^\]]+)\] )?(?:(?<username>\w+)(?: \[(?<guildRank>[^\]]+)\])?: )?)?(?<message>.+)$/;
        // const donateListener = async (message) => {
        //     message = message.toString();
        //     const match = message.match(regex);
        //     if (match){
        //       console.log(match)
        //       const username2 = match.groups.username;
        //       const message = match.groups.message;
        //       //const { chatType, rank, username2, guildRank = "[Member]", message } = match.groups;
        //       console.log(`username2: ${username2}`);
        //       console.log(`message: ${message}`);
        //       if (username2 == username && message === "yes"){
        //         const donate = require("../../discord/commands/donateCommand.js");
        //         const interaction = {
        //           options: {
        //             getString: (name) => {
        //                 if (name === "username") return username;
        //                 if (name === "amount") return amount;
        //                 if (name === "comment") return "From Mc";
        //                 if (name === "uuid") return donatorUUID;
        //                 return undefined;
        //             },
        //           },
        //           createdAt: Date.now(),
        //           fromMc: true,
        //           user: {
        //             avatarURL: () => `https://mc-heads.net/avatar/${username}`,
        //           },
        //           guild: { 
        //               id: '819229417796534283'
        //           },
        //           client: {},
        //           reply: async (msg) => {
        //               this.send(`/oc ${msg}`);
        //           },
        //           followUp: async (msg) => {
        //             this.send(`/oc ${msg.content}`);
        //         },              
        //         };
        //         bot.removeListener("message", donateListener); 
                
        //         console.log(this.isOnCooldown);
        //         await donate.execute(interaction); 
        //         this.isOnCooldown = false; 
        //         //this.send('/oc Donation request submitted on discord!');
        //       }
        //     }
        // };

        // bot.on("message", donateListener);
       
        // setTimeout(() => {
        //     bot.removeListener("message", donateListener);    
        //     if (this.isOnCooldown = true){
        //         this.send("/oc Donation confirm timed out");
        //         this.isOnCooldown = false;
        //     }
        // }, 30000);



    } catch (error) {
        this.send(`/oc [ERROR] ${error}`);
        console.error(error);
        this.isOnCooldown = false;
    }
  }
}

module.exports = donateCommand;
