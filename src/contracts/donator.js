const Database = require('better-sqlite3');
const hypixel = require("./API/HypixelRebornAPI.js");
const { getHypixelPlayer } = require("../../API/functions/getHypixelPlayer.js");
const { getUsername } = require("./API/PlayerDBAPI.js");

const db = new Database('donations.sqlite');
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

async function checkdiscord(guild, uuid){
  const data = await getHypixelPlayer(uuid);

  const socialMedia = data.socialMedia ? data.socialMedia : undefined;
  if (socialMedia){
    const discordname = socialMedia.links.DISCORD ? socialMedia.links.DISCORD : undefined;
    if (discordname){
      const GuildMembers = await guild.members.search({ query: discordname, limit: 1 });
      if (GuildMembers.size > 0){
        const GuildMember0 = GuildMembers.first();
        if (GuildMember0.roles.cache.has("1057376971035783269")){
          return GuildMember0.id;
        }
      }
    }
  }
  return undefined;  
}

async function UpdateRoles(guild, donator, member_id, amount){
  //const donator = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(uuid);
  const member = await guild.members.fetch(member_id);
  role_1000 = "1270137575381925968";
  role_100 = "1270137148737060916";
  role_10 = "1270137507648110654";
  if (donator){
    if (amount >= 1000){
      member.roles.add(role_1000);
      member.roles.remove(role_100);
      member.roles.remove(role_10);
    } else if(amount >= 100){
      member.roles.add(role_100);
      member.roles.remove(role_1000);
      member.roles.remove(role_10);
    } else if(amount >= 10){
      member.roles.add(role_10);
      member.roles.remove(role_1000);
      member.roles.remove(role_100);
    } else{
      member.roles.remove(role_1000);
      member.roles.remove(role_100);
      member.roles.remove(role_10);
    }
  } else{
    member.roles.remove(role_1000);
    member.roles.remove(role_100);
    member.roles.remove(role_10);
  }
}

async function addDonation(guild, donatorUUID, amount) {
    const donator = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(donatorUUID);
    let new_amount = amount
    if (donator) {
      const cur_amount = parseFloat(donator.amount);
      console.log(`cur_amount: ${cur_amount}`)
      new_amount = cur_amount + amount;
      console.log(`new_amount: ${new_amount}`)

      db.prepare('UPDATE donatedata SET amount = ? WHERE uuid = ?').run(new_amount, donatorUUID);
    } else {
      db.prepare('INSERT INTO donatedata (uuid, amount) VALUES (?, ?)').run(donatorUUID, new_amount);
    }
    const d_id = await checkdiscord(guild, donatorUUID);
    if (d_id){
      await UpdateRoles(guild, donator, d_id, new_amount);
    }
}

async function removeDonation(guild, donatorUUID, amount) {
    const donator = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(donatorUUID);

    if (donator) {
        const cur_amount = parseFloat(donator.amount);
        new_amount = cur_amount-amount;
        
        if (new_amount <= 0){
            db.prepare('DELETE FROM donatedata WHERE uuid = ?').run(donatorUUID);
        } else{
            db.prepare('UPDATE donatedata SET amount = ? WHERE uuid = ?').run(new_amount, donatorUUID);
        }
        const d_id = await checkdiscord(guild, donatorUUID);
        if (d_id){
          await UpdateRoles(guild, donator, d_id, new_amount);
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
        const discord_id = await checkdiscord(guild, uuid);
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

  
async function checkdonator(guild, donatorUUID){
  const hypixelGuild = await hypixel.getGuild('name', 'Golden Legion');
  const hypixelGuildMembers = hypixelGuild.members.map(member => member.uuid.replace(/-/g, ''));
  const user = db.prepare('SELECT amount FROM donatedata WHERE uuid = ?').get(donatorUUID);
  if (!user) {
    return ["", 0];
  }
  const amount = user.amount;
  const donatoruser = await getUsername(donatorUUID);
  return [donatoruser, amount];
        
}



module.exports = { addDonation, removeDonation, getList, checkdonator, format_amount };
