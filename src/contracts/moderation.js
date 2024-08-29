const Database = require('better-sqlite3');

const db = new Database('data/moderation.db');
// type : 0(warn) 1(mute) 2(ban)
db.prepare(`
    CREATE TABLE IF NOT EXISTS moderation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      messageId TEXT,
      Date TEXT,
      type INTEGER,
      discordId TEXT,
      uuid TEXT,
      moderator TEXT,
      duration TEXT,
      reason TEXT,
      appeal INTEGER,
      appealtoken TEXT
    )
`).run();


async function addentry(messageId, date, type, discordId, uuid, moderator, duration, reason, appealtoken) {
    const row = db.prepare('INSERT INTO moderation (messageId, Date, type, discordId, uuid, moderator, duration, reason, appeal, appealtoken) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(messageId, date, type, discordId, uuid, moderator, duration, reason, 0, appealtoken);
    return row.lastInsertRowid;
}

async function updateMessageId(messageId, id){
    db.prepare('UPDATE moderation SET messageId = ? WHERE id = ?').run(messageId, id);
}

async function removeentry(caseId) {
    db.prepare('DELETE FROM moderation WHERE id = ?').run(caseId);
}

async function getentry_mute(discordId, uuid){
    if (uuid === 0){
        const row = db.prepare(`SELECT * FROM moderation WHERE discordId = ? AND type = 1 ORDER BY id DESC LIMIT 1`).get(discordId);
        return row;
    } else{
        const row = db.prepare(`SELECT * FROM moderation WHERE uuid = ? AND type = 1 ORDER BY id DESC LIMIT 1`).get(uuid);
        return row;
    }
}

async function getentry_ban(discordId){
    const row = db.prepare(`SELECT * FROM moderation WHERE discordId = ? AND type = 2 ORDER BY id DESC LIMIT 1`).get(discordId);
    return row;
}

async function getentry_discord(discordId){
    const rows = db.prepare('SELECT * FROM moderation WHERE discordId = ?').all(discordId);
    return rows;
}

async function getentry_uuid(uuid){
    const rows = db.prepare('SELECT * FROM moderation WHERE uuid = ?').all(uuid);
    return rows;
}
async function getentry_id(caseId){
    const row = db.prepare('SELECT * FROM moderation WHERE id = ?').get(caseId);
    return row;
}
async function updateReason(caseId, reason){
    db.prepare("UPDATE moderation SET reason = ? WHERE id = ?").run(reason, caseId);
}
async function getUniqueEntries(discordId, uuid) {
    // Get rows from both sources
    const discordRows = await getentry_discord(discordId);
    const uuidRows = await getentry_uuid(uuid);
    
    // Combine both arrays
    const combinedRows = [...discordRows, ...uuidRows];

    // Create a map to ensure uniqueness based on 'id'
    const uniqueRowsMap = new Map();

    combinedRows.forEach(row => {
        uniqueRowsMap.set(row.id, row);
    });

    // Convert map back to an array
    const uniqueRows = Array.from(uniqueRowsMap.values());

    return uniqueRows;
}

async function setNewDuration(caseId, duration){
    db.prepare("UPDATE moderation SET duration WHERE id = ? ").run(duration, caseId);
}

async function setAppeal(caseId, appealtoken){
    db.prepare('UPDATE moderation SET appealtoken = ? WHERE id = ?').run(appealtoken, caseId);
    const row = db.prepare('SELECT * FROM moderation WHERE id = ?').get(caseId);
    return row;
}

async function checkAppeal(appealtoken){
    const row = db.prepare('SELECT * FROM moderation WHERE appealtoken = ?').get(appealtoken);
    return row;
}

async function disableAppeal(caseId, formtoken){
    db.prepare('UPDATE moderation SET (appeal, appealtoken) = (?,?) WHERE id = ?').run(formtoken, 0, caseId);
}
// async function setAppealForm(caseId, appeal){
//     db.prepare('UPDATE moderation SET appeal = ? WHERE id = ?').run(appeal, caseId);
// }

async function selectAppealForm(formtoken){
    const row = db.prepare('SELECT * FROM moderation WHERE appeal = ?').get(formtoken);
    return row;
}

async function disableAppealForm(caseId){
    db.prepare('UPDATE moderation SET appeal = ? WHERE id= ?').run(0, caseId);
}

module.exports = { addentry, removeentry, getentry_id, getentry_mute, getentry_ban, getUniqueEntries, updateMessageId, checkAppeal, setNewDuration, disableAppeal, setAppeal, updateReason, selectAppealForm, disableAppealForm };
