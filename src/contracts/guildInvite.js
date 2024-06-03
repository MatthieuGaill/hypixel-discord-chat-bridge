const Database = require('better-sqlite3');
const hypixel = require("./API/HypixelRebornAPI.js");
// const config = require("../../config.json");
// const axios = require("axios");
const { getHypixelPlayer } = require("../../API/functions/getHypixelPlayer.js");

//const cache = new Map();
const db = new Database('guildinvite.sqlite');
db.exec(`CREATE TABLE IF NOT EXISTS invitedata (
  uuid TEXT PRIMARY KEY,
  members TEXT,
  discord TEXT
)`);


async function addInvite(inviterUUID, invitedUUID) {
    const inviter = db.prepare('SELECT members FROM invitedata WHERE uuid = ?').get(inviterUUID);
    console.log(`ADDED ${invitedUUID} for ${inviterUUID}`);
    if (inviter) {
    const members = inviter.members ? inviter.members.split('/') : [];
        if (!members.includes(invitedUUID)) {
            members.push(invitedUUID);
            db.prepare('UPDATE invitedata SET members = ? WHERE uuid = ?').run(members.join('/'), inviterUUID);
        }
    } else {
        db.prepare('INSERT INTO invitedata (uuid, members) VALUES (?, ?)').run(inviterUUID, invitedUUID);
    }
}

async function getInvites(inviterUUID, hypixelGuildMembers, guild) {
    const user = db.prepare('SELECT members FROM invitedata WHERE uuid = ?').get(inviterUUID);

    if (!user) {
    return { totalInvited: 0, invited_discord:0 };
    }

    const members = user.members ? user.members.split('/') : [];
    const discordmemberslist = []
    let totalInvited = 0;
    let invited_discord = 0


    try {
      for (const member of members){
        if (!hypixelGuildMembers.includes(member)){
          await removeInvite(inviterUUID, member);
        } else{
          totalInvited += 1;
          const discordname = await checkdiscord(member);
          if (discordname) {
            const GuildMembers = await guild.members.search({ query: discordname, limit: 1 });
            if (GuildMembers.size > 0){
              const GuildMember0 = GuildMembers.first();
              if (GuildMember0.roles.cache.has("1057376971035783269")){
                invited_discord += 1;
                discordmemberslist.push(member);
              }
            }

          }
        }
      }

    db.prepare('UPDATE invitedata SET discord = ? WHERE uuid = ?').run(discordmemberslist.join('/'), inviterUUID);
    } catch (error) {
      console.error(error);
    }

    return { totalInvited, invited_discord };
}


async function getList(){
    const guild = client.guilds.cache.get("819229417796534283");
    const hypixelGuild = await hypixel.getGuild('name', 'Golden Legion');
    const hypixelGuildMembers = hypixelGuild.members.map(member => member.uuid.replace(/-/g, ''));
    const rows = db.prepare('SELECT uuid FROM invitedata').all();
    const dataDictionary = {};

    for (const row of rows) {
      const tempdata = await getInvites(row.uuid, hypixelGuildMembers, guild);
      
      if (tempdata["totalInvited"] === 0){
        db.prepare('DELETE FROM invitedata WHERE uuid = ?').run(row.uuid);
      } else {
        dataDictionary[row.uuid] = tempdata;
      }
      
    }
    return dataDictionary;
}

async function removeInvite(inviterUUID, invitedUUID) {
    const getInviter = db.prepare('SELECT members FROM invitedata WHERE uuid = ?');
    const inviter = getInviter.get(inviterUUID);
  
    if (inviter) {
      const members = inviter.members ? inviter.members.split('/') : [];
      const updatedMembers = members.filter(member => member !== invitedUUID);
  
      if (updatedMembers.length !== members.length) {
        db.prepare('UPDATE invitedata SET members = ? WHERE uuid = ?').run(updatedMembers.join('/'), inviterUUID)
        return true;
      }
    }
    return false;
  }
  
async function checkdetails(inviterUUID){
  const hypixelGuild = await hypixel.getGuild('name', 'Golden Legion');
  const hypixelGuildMembers = hypixelGuild.members.map(member => member.uuid.replace(/-/g, ''));
  const user = db.prepare('SELECT members,discord FROM invitedata WHERE uuid = ?').get(inviterUUID);
  let guild_list, discord_list = [];
  if (!user) {
    return { guild_list: "", discord_list: ""};
    }
  const members = user.members ? user.members.split('/') : [];
  const discordmembers = user.discord ? user.discord.split('/') : [];
  guild_list = members.filter(memberUUID => hypixelGuildMembers.includes(memberUUID));
  discord_list = discordmembers.filter(memberUUID => hypixelGuildMembers.includes(memberUUID));
  return {guild_list, discord_list};
}

async function checkdiscord(uuid){
  const data = await getHypixelPlayer(uuid);

  const socialMedia = data.socialMedia ? data.socialMedia : undefined;
  let discordname;
  if (socialMedia){
    discordname = socialMedia.links.DISCORD ? socialMedia.links.DISCORD : undefined;
  }
  
  return discordname;
}


module.exports = { addInvite, getInvites, getList, removeInvite, checkdetails };
