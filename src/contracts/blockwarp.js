const Database = require('better-sqlite3');
const db = new Database('data/blockwarplist.sqlite');
db.exec('CREATE TABLE IF NOT EXISTS blockwarpdata (key TEXT PRIMARY KEY, username TEXT)');

async function addblock(uuid, username){
    db.prepare('INSERT OR REPLACE INTO blockwarpdata (key, username) VALUES (?, ?)').run(uuid, username);
}

async function removeblock(uuid){
    db.prepare('DELETE FROM blockwarpdata WHERE key = ?').run(uuid);
}
async function getAllblocks(){
    const rows = db.prepare('SELECT * FROM blockwarpdata').all();
    return rows
}

async function checkblock(uuid){
    const row = db.prepare('SELECT * FROM blockwarpdata WHERE key = ?').get(uuid);
    return row;
}
module.exports = {addblock, removeblock, getAllblocks, checkblock};