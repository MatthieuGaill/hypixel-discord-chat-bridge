const Database = require('better-sqlite3');
const db = new Database('data/codes.sqlite');

db.exec('CREATE TABLE IF NOT EXISTS ticketdata (key TEXT PRIMARY KEY, value TEXT)');

async function addcode(code_key, code_value){
    db.prepare('INSERT OR REPLACE INTO ticketdata (key, value) VALUES (?, ?)').run(code_key, code_value);
}

async function removecode(code_key){
    db.prepare('DELETE FROM ticketdata WHERE key = ?').run(code_key);
}

async function getAllcodes(){
    const rows = db.prepare('SELECT * FROM ticketdata').all();
    return rows
}

async function checkcode(code_key){
    const row = db.prepare('SELECT value FROM ticketdata WHERE key = ?').get(code_key);
    if (row){
        db.prepare('DELETE FROM ticketdata WHERE key = ?').run(code_key);
    }
    return row;
}
module.exports = {addcode, removecode, getAllcodes, checkcode }