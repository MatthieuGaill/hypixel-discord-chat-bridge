const Database = require('better-sqlite3');

const db = new Database('data/autopost.sqlite');
db.exec(`CREATE TABLE IF NOT EXISTS autopostdata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    announcement TEXT,
    interval INTEGER,
    duration INTEGER,
    current INTEGER
  )`);


async function insertautopost(announcement, interval, duration){
    const row = db.prepare(`SELECT COUNT(*) AS count FROM autopostdata`).get();
    if (row.count === 0){
        db.prepare('INSERT OR REPLACE INTO autopostdata (id, announcement, interval, duration, current) VALUES (?, ?, ?, ?, ?)').run(1, announcement, interval, duration, 0);
    } else{
        db.prepare('INSERT OR REPLACE INTO autopostdata (announcement, interval, duration, current) VALUES (?, ?, ?, ?)').run(announcement, interval, duration, 0);
    }
}

async function deleteautopost(id){
    db.prepare('DELETE FROM autopostdata WHERE id = ?').run(id);
}

async function getAllautoposts(){
    const rows = db.prepare('SELECT * FROM autopostdata').all();
    return rows;
}

async function checkautopost(id){
    const row = db.prepare("SELECT * FROM autopostdata WHERE id = ?").get(id);
    return row;
}

async function editautopost(announcement, id){
    db.prepare("UPDATE autopostdata SET announcement = ? WHERE id = ?").run(announcement, id);
}
async function setCurrent(currentTime, id){
    db.prepare("UPDATE autopostdata SET current = ? WHERE id = ?").run(currentTime, id);
}
module.exports = {insertautopost, deleteautopost, getAllautoposts, checkautopost, editautopost, setCurrent};