const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const sqlite3 = require('sqlite3');

class warpoutCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);
    this.name = "warpout";
    this.aliases = ["warp"];
    this.description = "Warp player out of the game";
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
      let user = this.getArgs(message)[0];

      let uuid = await getUUID(username).catch((error) => {
        this.send(`/oc [ERROR] ${error}`);
        uuid = '0';
       });
      const uuidL = await getAuthorization();
      if (uuidL.includes(uuid)){
        throw 'No permission'
      }
      await delay(500);

      if (this.isOnCooldown) {
        return this.send(`/gc ${username} Command is on cooldown`);
      }

      this.isOnCooldown = true;

      
      if (user === undefined) {
        // eslint-disable-next-line no-throw-literal
        throw "Please provide a username!";
      }
      this.send("/lobby megawalls");
      await delay(250);
      this.send("/play tkr");

      const warpoutListener = async (message) => {
        message = message.toString();

        if (message.includes("You cannot invite that player since they're not online.")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;

          this.send(`/gc ${user} is not online!`);
        } else if (message.includes("You cannot invite that player")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;

          this.send(`/gc ${user} has party requests disabled or ignored Golden_Legion`);
        } else if (message.includes("invited") && message.includes("to the party! They have 60 seconds to accept.")) {
          this.send(`/gc Succesfully invited ${user} to the party!`);
        } else if (message.includes(" joined the party.")) {
          this.send(`/gc ${user} joined the party! Warping them out of the game..`);
          this.send("/p warp");
        } else if (message.includes("again to confirm")) {
          await delay(1000);
          this.send("/p warp");
        } else if (message.includes("summoned")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;
          this.send(`/gc ${user} warped out of the game! Disbanding party..`);
          await delay(1500);
          this.send("/p disband");

          await delay(1500);
          this.send("/lobby megawalls");
          this.send("\u00a7");
        } else if (message.includes(" cannot warp from Limbo")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;
          this.send(`/gc ${user} cannot be warped from Limbo! Disbanding party..`);
          this.send("/p disband");
        } else if (message.includes(" is not allowed on your server!")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;
          this.send(`/gc ${user} is not allowed on my server! Disbanding party..`);

          this.send("/p leave");
          await delay(1500);
          this.send("\u00a7");
        } else if (message.includes("You are not allowed to invite players.")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;
          this.send(`/gc Somehow I'm not allowed to invite players? Disbanding party..`);

          this.send("/p disband");
          await delay(1500);
          this.send("\u00a7");
        } else if (message.includes("You are not allowed to disband this party.")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;
          this.send(`/gc Somehow I'm not allowed to disband this party? Leaving party..`);

          this.send("/p leave");
          await delay(1500);
          this.send("\u00a7");
        } else if (message.includes("You can't party warp into limbo!")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;
          this.send(`/gc Somehow I'm inside in limbo? Disbanding party..`);
          this.send("/p disband");
        } else if (message.includes("Couldn't find a player with that name!")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;

          this.send(`/gc Couldn't find a player with that name!`);
          //this.send("/p disband");
          await delay(1500);
          this.send("/lobby megawalls");
          this.send("\u00a7");
        } else if (message.includes("You cannot party yourself")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;
          this.send(`/gc ${user}, No permission`);

          await delay(1500);
          this.send("/lobby megawalls");
          this.send("\u00a7");

          this.send(`/gc [ERROR] No permission`);
        } else if (message.includes("didn't warp correctly!")) {
          bot.removeListener("message", warpoutListener);
          this.isOnCooldown = false;

          this.send(`/gc ${user} didn't warp correctly! Please try again..`);
          this.send("/p disband");
        }
      };

      bot.on("message", warpoutListener);
      this.send(`/p invite ${user} `);
      setTimeout(() => {
        bot.removeListener("message", warpoutListener);

        if (this.isOnCooldown === true) {
          this.send("/gc Party timed out");
          this.send("/p disband");
          this.send("/lobby megawalls");
          this.send("\u00a7");

          this.isOnCooldown = false;
        }
      }, 30000);

    } catch (error) {
      this.send(`/gc [ERROR] ${error || "Something went wrong.."}`);
      console.error(error);
      this.isOnCooldown = false;
    }
  }
}

// async function getAuthorization(username){
//    console.log(`username0 :  ${username}`)
//    const db = new sqlite3.Database('blockwarplist.sqlite');
//    let uuidList = [];
//    db.all('SELECT key FROM blockwarpdata', [], (err, rows) => {
//      if (err) {
//        console.error(err);
//        this.send(`/oc [ERROR] ${err}`);
//      }
//      uuidList = rows.map(row => row.key);
//      //uuidList.push(row.key);
//      db.close();
//    });
//    return uuidList;
// }


async function getAuthorization() {
  try {
    const db = new sqlite3.Database('blockwarplist.sqlite');
    const rows = await new Promise((resolve, reject) => {
      db.all('SELECT key FROM blockwarpdata', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    db.close();
    const uuidList = rows.map(row => row.key);
    return uuidList;
  } catch (error) {
    console.error(error);
    this.send(`/oc [ERROR] ${err}`);
    // Handle error appropriately
    return [];
  }
}


module.exports = warpoutCommand;
