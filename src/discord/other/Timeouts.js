const Database = require('better-sqlite3');
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");

const db = new Database('data/timeouts.db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS timeouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseId TEXT,
    userId TEXT,
    roleId TEXT,
    expiresAt INTEGER,
    timedoutId INTEGER
  )
`).run();

async function scheduleTimeout(caseId, userId, roleId, duration) {
    const expiresAt = Date.now() + duration;
  
    // Fetch existing timeout, if any
    let existingTimeout = db.prepare('SELECT * FROM timeouts WHERE userId = ?').get(userId);
  
    if (existingTimeout) {
      // Clear the existing timeout if it's still in the future
      console.log(existingTimeout);
      clearTimeout(existingTimeout.timeoutId);
      console.log("Cleared possible existing timed out");
      db.prepare('DELETE FROM timeouts WHERE id = ?').run(existingTimeout.id);
    }

    if (existingTimeout && Date.now() > expiresAt){
        const member = await guild.members.fetch(userId);
        const moderation_channel = await guild.channels.cache.get(config.discord.channels.moderationLogsChannel);
        await member.roles.remove(roleId);
        const modlog = new EmbedBuilder()
        .setAuthor({
          name: `Unmute | ${member.name}`,
          iconURL: member.avatarURL(),
        })
        .setDescription(`**User**:  <@${userId}>\n **Moderator**: Auto`)
        .setColor("Red")
        .setTimestamp()
        .setFooter({
          text: `ID: ${userId}`,
        });
        moderation_channel.send({embeds : [modlog]});

    } else{
        // Schedule the new timeout
        const timeoutId = setTimeout(async () => {
          //const guild = await client.guilds.fetch(guildId);
          const member = await guild.members.fetch(userId);
          const moderation_channel = await guild.channels.cache.get(config.discord.channels.moderationLogsChannel);
          await member.roles.remove(roleId).catch(e => null);
          const modLogfields = [
            { name: `User`, value: `<@${userId}>`, inline: true },
            { name: "Moderator", value: `<@1109873692344848555>`, inline: true},
            { name: "Reason", value: `Auto`, inline: true },
          ];
          const modlog = new EmbedBuilder()
          .setAuthor({
              name: `Case ${caseId} | Unmute | ${member.user.tag}`,
              iconURL: member.user.avatarURL(),
          })
          .addFields(modLogfields)
          .setColor("Green")
          .setTimestamp()
          .setFooter({
              text: `ID: ${userId}`,
          });
          moderation_channel.send({embeds : [modlog]});
      
          // Clean up the database after the timeout expires
          db.prepare('DELETE FROM timeouts WHERE id = ?').run(existingTimeout.id);
        }, duration);
    
        // Store the timeout details in the database
        existingTimeout = db.prepare(`
        INSERT INTO timeouts (caseId, userId, roleId, expiresAt, timedoutId) 
        VALUES (?, ?, ?, ?, ?)
        `).run(caseId, userId, roleId, expiresAt, parseInt(timeoutId));
    }
}

async function removeTimeout(userId, roleId){
  //const member = await guild.members.fetch(userId);
  const existingTimeout = db.prepare('SELECT * FROM timeouts WHERE userId = ?').get(userId);
  
  if (existingTimeout) {
    clearTimeout(existingTimeout.timeoutId);
    //await member.roles.remove(roleId).catch(e => "No permission to remove muted role");
    db.prepare('DELETE FROM timeouts WHERE id = ?').run(existingTimeout.id);  
    return true;
  }

  return false;
}

module.exports = { scheduleTimeout, removeTimeout };