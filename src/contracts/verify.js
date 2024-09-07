const Database = require('better-sqlite3');

const db = new Database('data/linked.db');
db.exec(`CREATE TABLE IF NOT EXISTS linked (
  uuid TEXT PRIMARY KEY,
  discordId TEXT
)`);


async function addlink(uuid, discordId) {
    db.prepare('INSERT INTO linked (uuid, discordId) VALUES (?, ?)').run(uuid, discordId);
}

async function removelink_uuid(uuid) {
    db.prepare('DELETE FROM linked WHERE uuid = ?').run(uuid);
}

async function removelink_discord(discordId) {
    db.prepare('DELETE FROM linked WHERE discordId = ?').run(discordId);
}

async function selectlink_uuid(uuid) {
    const user = db.prepare('SELECT discordId FROM linked WHERE uuid = ?').get(uuid);
    if (user){
        return user.discordId;
    }
    return undefined;
}

async function selectlink_discord(discordId) {
    const user = db.prepare('SELECT uuid FROM linked WHERE discordId = ?').get(discordId);
    if (user){
        return user.uuid;
    }
    return undefined;
}

async function getAllLinks() {
    return db.prepare('SELECT * FROM linked').all();
}

module.exports = { addlink, removelink_uuid, removelink_discord, selectlink_uuid, selectlink_discord, getAllLinks };
