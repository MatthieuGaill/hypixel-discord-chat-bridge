const Database = require('better-sqlite3');

const db = new Database('data/afkdatabase.sqlite');
db.exec(`CREATE TABLE IF NOT EXISTS afkdata (
    key TEXT PRIMARY KEY,
    user TEXT NOT NULL, 
    date DATETIME, 
    reason TEXT)`
);

async function addAfk(msg_id, discordId, date, reason){
    db.prepare('INSERT INTO afkdata (key, user, date, reason) VALUES (?, ?, ?, ?)') .run(msg_id, discordId, date, reason);
}
async function getExpiredAfks(){
    date_now = Date.now();
    const rows = db.prepare('SELECT * FROM afkdata WHERE date < ?').all(date_now);
    db.prepare('DELETE FROM afkdata WHERE date < ?').run(date_now);
    return rows;
}

async function getAllAfks(){
    const rows = db.prepare('SELECT * FROM afkdata').all();
    return rows;
}

async function getAndRemove(id){
    const row = db.prepare('SELECT key FROM afkdata WHERE key = ?').get(id);
    if (row){
        db.prepare('DELETE FROM afkdata WHERE key = ?').run(id);
        return true;
    }
    return false;
}


module.exports = {addAfk, getExpiredAfks, getAllAfks, getAndRemove};