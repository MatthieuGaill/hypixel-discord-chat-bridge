const minecraftCommand = require("../../contracts/minecraftCommand.js");
const { resolveUsernameOrUUID } = require("../../contracts/API/PlayerDBAPI.js");
const Database = require('better-sqlite3');

const db0 = new Database('verify_tmp.sqlite');
db0.exec(`CREATE TABLE IF NOT EXISTS verifydata (
  uuid TEXT PRIMARY KEY,
  discordid TEXT
)`);


class VerifyCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "link";
    this.description = "Link a discord";
    this.options = [
      {
        name: "discord",
        description: "discord name",
        required: false,
      },
    ];
  }

  async onCommand(username, message) {
    try {
        if (disc){
          throw 'Do not use from discord!'
        }
        const discord_name = this.getArgs(message)[0];
        if (!discord_name){
            throw `Please provide a unique discord name`;
        }
        const dataUUIDmc = await resolveUsernameOrUUID(username);
        if (!dataUUIDmc){
            throw `Mc username/UUID does not exist`;
        }
        const mcUUID = dataUUIDmc['uuid'];
        const player = db0.prepare('SELECT discordid FROM verifydata WHERE uuid = ?').get(mcUUID);

        if (player) {
            db0.prepare('UPDATE verifydata SET discordid = ? WHERE uuid = ?').run(discord_name, mcUUID);
        } else {
            db0.prepare('INSERT INTO verifydata (uuid, discordid) VALUES (?, ?)').run(mcUUID, discord_name);
        }

        
        this.send(`/gc Linked discord ${discord_name} to your account, now run /link ${dataUUIDmc['username']}  with Golden Legion Bot on discord in #guild-commands`);
    } catch (error) {
        this.send(`/gc [ERROR] ${error}`);
    }
  }
}




module.exports = VerifyCommand;
