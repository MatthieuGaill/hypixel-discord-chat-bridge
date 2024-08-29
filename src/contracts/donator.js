const Database = require('better-sqlite3');
const { getUsername } = require("./API/PlayerDBAPI.js");
const config = require("../../config.json");
const { selectlink_uuid } = require('./verify.js');

const db = new Database('data/donations.sqlite');
db.exec(`CREATE TABLE IF NOT EXISTS donatedata (
  uuid TEXT PRIMARY KEY,
  amount TEXT
)`);


function format_amount(amount){
    if (amount >= 1000){
        return `${(amount/1000).toFixed(2)} B`;
    }
    return `${amount} M`;
}


async function UpdateRolesDonation(memberRoles, uuid, guild_bool){
  role_1000 = "1270485871589851136";
  role_500 = "1270485618387980479";
  role_100 = "1270485437714006138";
  role_10 = "1270485283678191616";
  
  if (guild_bool){
    const donator = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(uuid);
    if (donator){
      const amount = donator.amount;
      if (amount >= 1000){
        memberRoles.addRole(role_1000, `For Having donated at least **1B** coins`);
        memberRoles.removeRole(role_500, `Next Donation Role`);
        memberRoles.removeRole(role_100, `Next Donation Role`);
        memberRoles.removeRole(role_10, `Next Donation Role`);
        // member.roles.add(role_1000);
        // member.roles.remove(role_500);
        // member.roles.remove(role_100);
        // member.roles.remove(role_10);
      } else if(amount >= 500){
        memberRoles.addRole(role_500, `For Having donated at least **500 M** coins`);
        memberRoles.removeRole(role_1000, `Precedent Donation Role (Weird)`);
        memberRoles.removeRole(role_100, `Next Donation Role`);
        memberRoles.removeRole(role_10, `Next Donation Role`);
        // member.roles.add(role_500);
        // member.roles.remove(role_1000);
        // member.roles.remove(role_100);
        // member.roles.remove(role_10);
      } else if(amount >= 100){
        memberRoles.addRole(role_100, `For Having donated at least **100 M** coins`);
        memberRoles.removeRole(role_1000, `Precedent Donation Role (Weird)`);
        memberRoles.removeRole(role_500, `Precedent Donation Role (Weird)`);
        memberRoles.removeRole(role_10, `Next Donation Role`);
        // member.roles.add(role_100);
        // member.roles.remove(role_1000);
        // member.roles.remove(role_500);
        // member.roles.remove(role_10);
      } else if(amount >= 10){
        memberRoles.addRole(role_10, `For Having donated at least **10 M** coins`);
        memberRoles.removeRole(role_1000, `Precedent Donation Role (Weird)`);
        memberRoles.removeRole(role_500, `Precedent Donation Role (Weird)`);
        memberRoles.removeRole(role_100, `Precedent Donation Role (Weird)`);
        // member.roles.add(role_10);
        // member.roles.remove(role_1000);
        // member.roles.remove(role_500);
        // member.roles.remove(role_100);
      } else{
        memberRoles.removeRole(role_1000, `Precedent Donation Role (Weird)`);
        memberRoles.removeRole(role_500, `Precedent Donation Role (Weird)`);
        memberRoles.removeRole(role_100, `Precedent Donation Role (Weird)`);
        memberRoles.removeRole(role_100, `Precedent Donation Role (Weird)`);
        // member.roles.remove(role_1000);
        // member.roles.remove(role_500);
        // member.roles.remove(role_100);
        // member.roles.remove(role_10);
      }
    } else{
      memberRoles.removeRole(role_1000, `Removed Donation Role (Weird)`);
      memberRoles.removeRole(role_500, `Removed Donation Role (Weird)`);
      memberRoles.removeRole(role_100, `Removed Donation Role (Weird)`);
      memberRoles.removeRole(role_100, `Removed Donation Role (Weird)`);
      // member.roles.remove(role_1000);
      // member.roles.remove(role_500);
      // member.roles.remove(role_100);
      // member.roles.remove(role_10);
    }
  } else{
    memberRoles.removeRole(role_1000, `Left the guild`);
    memberRoles.removeRole(role_500, `Left the guild`);
    memberRoles.removeRole(role_100, `Left the guild`);
    memberRoles.removeRole(role_100, `Left the guild`);
    // member.roles.remove(role_1000);
    // member.roles.remove(role_500);
    // member.roles.remove(role_100);
    // member.roles.remove(role_10);
  }
}

async function addDonation(guild, donatorUUID, amount) {

    let donator = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(donatorUUID);
    let new_amount = amount;
    if (donator) {
      const cur_amount = parseFloat(donator.amount);
      new_amount = cur_amount + amount;

      db.prepare('UPDATE donatedata SET amount = ? WHERE uuid = ?').run(new_amount, donatorUUID);
    } else {
      db.prepare('INSERT INTO donatedata (uuid, amount) VALUES (?, ?)').run(donatorUUID, new_amount);
    }

    await updateUser(guild, donatorUUID);
}

async function removeDonation(guild, donatorUUID, amount) {
    let donator = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(donatorUUID);

    if (donator) {
        const cur_amount = parseFloat(donator.amount);
        new_amount = cur_amount-amount;
        
        if (new_amount <= 0){
            db.prepare('DELETE FROM donatedata WHERE uuid = ?').run(donatorUUID);
        } else{
            db.prepare('UPDATE donatedata SET amount = ? WHERE uuid = ?').run(new_amount, donatorUUID);
        }
        
        await updateUser(guild, donatorUUID);
        return true;
    }
    return false;
}



async function getList(){
    const rows = db.prepare('SELECT * FROM donatedata').all();
    const dataDictionary = {};

    for (const row of rows) {
      const uuid = row.uuid;
      const amount = row.amount
      if (amount === 0){
        db.prepare('DELETE FROM donatedata WHERE uuid = ?').run(row.uuid);
      } else{
        const d_id = await selectlink_uuid(uuid);
        if (d_id){
          //const member = await guild.members.fetch(d_id);
          dataDictionary[`<@${d_id}>`] = amount;
        } else{
          donatoruser = await getUsername(uuid);
          dataDictionary[`\`${donatoruser}\``] = amount;
        }

      }
    }
    return dataDictionary;
}

  
async function checkdonator(donatorUUID){
  // const hypixelGuild = await hypixel.getGuild('name', 'Golden Legion');
  // const hypixelGuildMembers = hypixelGuild.members.map(member => member.uuid.replace(/-/g, ''));
  const user = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(donatorUUID);
  if (!user) {
    return ["", 0];
  }
  const amount = user.amount;
  const donatoruser = await getUsername(donatorUUID);
  return [donatoruser, amount];
        
}

async function updateUser(guild, uuid) {
  try {

    const linkedUser = await selectlink_uuid(uuid);
    if (!linkedUser){
      return;
    }
    const member = await guild.members.fetch(linkedUser);
    if (!member){
      return;
    }
    const user = member.user;
    const interaction = {
      doNotRespond: true, 
      user: user,
      member: member
    };

    const updateRolesCommand = require("../discord/commands/updateCommand.js");
    await updateRolesCommand.execute(interaction, undefined);
  } catch(e){
    console.error(e);
  }
}



module.exports = { addDonation, removeDonation, getList, checkdonator, format_amount, UpdateRolesDonation };
