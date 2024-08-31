const Database = require('better-sqlite3');

const db = new Database('data/banlist.sqlite');
db.exec('CREATE TABLE IF NOT EXISTS bandata (key TEXT PRIMARY KEY, username TEXT)');

async function addbandata(uuid, username){
    db.prepare('INSERT OR REPLACE INTO bandata (key, username) VALUES (?, ?)').run(uuid, username);
}
async function removebandata(uuid){
    db.prepare('DELETE FROM bandata WHERE key = ?').run(uuid);
}

async function getAllbandata(){
    const rows = db.prepare('SELECT * FROM bandata').all();
    return rows;
}

async function checkbandata(uuid){
    const row = db.prepare('SELECT key FROM bandata WHERE key = ? ').get(uuid);
    return row;
}



module.exports = {addbandata, removebandata, getAllbandata, checkbandata};