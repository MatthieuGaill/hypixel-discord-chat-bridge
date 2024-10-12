const minecraftCommand = require("../../contracts/minecraftCommand.js");
const hypixel = require("../../contracts/API/HypixelRebornAPI.js");
const { getPlayer_simple } = require("../../contracts/reputation.js");
const { selectlink_uuid } = require("../../contracts/verify.js");
const { resolveUsernameOrUUID } = require("../../contracts/API/mowojangAPI.js");

class ReputationCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "reputation";
    this.aliases = ["rep"];
    this.description = "View information of a guild";
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
        const dataUUID = await resolveUsernameOrUUID(username).catch(e => null);
        if (!dataUUID){
            throw "Invalid username or UUID!";
        }
        const member_id = await selectlink_uuid(dataUUID['uuid']);
        if (!member_id){
            throw "This player is not linked on the guild discord! (/g discord)";
        }
        let typerep = await getPlayer_simple(member_id);
        if (!typerep){
            typerep = [0, 0, 0, 0, 0, 0 , 0, 0, 0];
        }
        this.send(
            `/gc ${dataUUID['username']}'s reputation: ${typerep[8]} (${typerep[0]} Expl. 
            | ${typerep[1]} Loan | ${typerep[2]} Craft | ${typerep[3]} Reforge 
            | ${typerep[4]} Slayer | ${typerep[5]} Dungeon | ${typerep[6]} Gift | ${typerep[7]} Other)`,
        );
    } catch (error) {
      this.send(
        `/gc [ERROR] ${error}`,
      );
    }
  }
}

module.exports = ReputationCommand;