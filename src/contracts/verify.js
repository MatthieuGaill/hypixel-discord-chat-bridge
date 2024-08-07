const Database = require('better-sqlite3');
const hypixel = require("./API/HypixelRebornAPI.js");
const { getHypixelPlayer } = require("../../API/functions/getHypixelPlayer.js");
const { getUsername } = require("./API/PlayerDBAPI.js");


const db = new Database('verify.sqlite');
db.exec(`CREATE TABLE IF NOT EXISTS verifydata (
  uuid TEXT PRIMARY KEY,
  discordid TEXT
)`);



async function addentry(uuid, discord_id) {
    db.prepare('INSERT INTO verifydata (uuid, discordid) VALUES (?, ?)').run(uuid, discord_id);
}

async function removeentry(uuid) {
    db.prepare('DELETE FROM verifydata WHERE uuid = ?').run(uuid);
}

async function selectentry(uuid) {
    const user = db.prepare('SELECT discordid FROM verifydata WHERE uuid = ?').get(uuid);
    if (user){
        return user.discordid;
    }
    return undefined;
}

async function getList(){
    const rows = db.prepare('SELECT * FROM verifydata').all();
    const dataDictionary = {};

    for (const row of rows) {
      uuid = row.uuid;
      user = await getUsername(uuid);
      dataDictionary[user] = row.discordid;
    }

    return dataDictionary;
}


module.exports = { addentry, removeentry, selectentry, getList };
