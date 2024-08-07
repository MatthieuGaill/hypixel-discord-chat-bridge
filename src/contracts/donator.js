const Database = require('better-sqlite3');
const hypixel = require("./API/HypixelRebornAPI.js");
const { getHypixelPlayer } = require("../../API/functions/getHypixelPlayer.js");
const { getUsername } = require("./API/PlayerDBAPI.js");
const { outputFileSync } = require('fs-promise');

const db = new Database('donations.sqlite');
db.exec(`CREATE TABLE IF NOT EXISTS donatedata (
  uuid TEXT PRIMARY KEY,
  amount TEXT
)`);
const db2 = new Database('verify.sqlite');
db2.exec(`CREATE TABLE IF NOT EXISTS verifydata (
  uuid TEXT PRIMARY KEY,
  discordid TEXT
)`);


function format_amount(amount){
    if (amount >= 1000){
        return `${(amount/1000).toFixed(2)} B`;
    }
    return `${amount} M`;
}

async function checkdiscord(uuid){
  // const data = await getHypixelPlayer(uuid);

  // const socialMedia = data.socialMedia ? data.socialMedia : undefined;
  // if (socialMedia){
  //   const discordname = socialMedia.links.DISCORD ? socialMedia.links.DISCORD : undefined;
  //   console.log(discordname);
  //   if (discordname){
  //     const GuildMembers = await guild.members.search({ query: discordname, limit: 1 });
  //     if (GuildMembers.size > 0){
  //       const GuildMember0 = GuildMembers.first();
  //       if (GuildMember0.roles.cache.has("1057376971035783269")){
  //         return GuildMember0.id;
  //       }
  //     }
  //   }
  // }
  // return undefined;

  const user = db2.prepare('SELECT discordid FROM verifydata WHERE uuid = ?').get(uuid);
  if (user){
      return user.discordid;
  }
  return undefined;
  
}

async function UpdateRoles(guild, donator_bool, member_id, amount){
  //const donator = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(uuid);
  const member = await guild.members.fetch(member_id);
  role_1000 = "1270485871589851136";
  role_500 = "1270485618387980479";
  role_100 = "1270485437714006138";
  role_10 = "1270485283678191616";

  if (donator_bool){
    if (amount >= 1000){
      member.roles.add(role_1000);
      member.roles.remove(role_500);
      member.roles.remove(role_100);
      member.roles.remove(role_10);
    } else if(amount >= 500){
      member.roles.add(role_500);
      member.roles.remove(role_1000);
      member.roles.remove(role_100);
      member.roles.remove(role_10);
    } else if(amount >= 100){
      member.roles.add(role_100);
      member.roles.remove(role_1000);
      member.roles.remove(role_500);
      member.roles.remove(role_10);
    } else if(amount >= 10){
      member.roles.add(role_10);
      member.roles.remove(role_1000);
      member.roles.remove(role_500);
      member.roles.remove(role_100);
    } else{
      member.roles.remove(role_1000);
      member.roles.remove(role_500);
      member.roles.remove(role_100);
      member.roles.remove(role_10);
    }
  } else{
    member.roles.remove(role_1000);
    member.roles.remove(role_500);
    member.roles.remove(role_100);
    member.roles.remove(role_10);
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
    const d_id = await checkdiscord(donatorUUID);
    donator = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(donatorUUID);
    if (d_id){
      if (donator){
        await UpdateRoles(guild, true, d_id, new_amount);
      } else{
        await UpdateRoles(guild, false, d_id, new_amount);
      }
    }
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
        const d_id = await checkdiscord(donatorUUID);
        donator = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(donatorUUID);
        if (d_id){
          if (donator){
            await UpdateRoles(guild, true, d_id, new_amount);
          } else{
            await UpdateRoles(guild, false, d_id, new_amount);
          } 
        }
        return true;
    }
    return false;
}



async function getList(guild){
    const rows = db.prepare('SELECT * FROM donatedata').all();
    const dataDictionary = {};

    for (const row of rows) {
      uuid = row.uuid;
      const amount = row.amount
      if (amount === 0){
        db.prepare('DELETE FROM donatedata WHERE uuid = ?').run(row.uuid);
      } else{
        const discord_id = await checkdiscord(uuid);
        if (discord_id){
          dataDictionary[`<@${discord_id}>`] = amount;
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



module.exports = { addDonation, removeDonation, getList, checkdonator, format_amount, UpdateRoles };
