const Database = require('better-sqlite3');

//const cache = new Map();
const db = new Database('data/collected.sqlite');
db.exec(`CREATE TABLE IF NOT EXISTS collecteddon (
  discordId TEXT PRIMARY KEY,
  amount REAL
)`);



async function setCollected(discordId, amount) {
    
    if (amount == 0){
        db.prepare("DELETE FROM collecteddon WHERE discordId = ?").run(discordId);
    } else{
        const row = db.prepare('SELECT amount FROM colllecteddon WHERE discordId = ?').get(discordId);
        if (row) {
            db.prepare('UPDATE collecteddon SET amount = ? WHERE discordId = ?').run(amount, discordId);
        } else {
            db.prepare('INSERT INTO collecteddon (discordId, amount) VALUES (?, ?)').run(discordId, amount);
        }
    }
}

async function addCollected(discordId, amount) {
    const row = db.prepare('SELECT amount FROM collecteddon WHERE discordId = ?').get(discordId);
    if (row) {
        const old_amount = row.amount;
        db.prepare('UPDATE collecteddon SET amount = ? WHERE discordId = ?').run(old_amount+amount, discordId);
    } else {
        db.prepare('INSERT INTO collecteddon (discordId, amount) VALUES (?, ?)').run(discordId, amount);
    }
    
}


async function resetCollected(){
    db.prepare('DELETE FROM collecteddon').all();
}


async function getList(){
    const rows = db.prepare('SELECT * FROM collecteddon').all();
    const dataDictionary = {};

    for (const row of rows) {
        dataDictionary[row.discordId] = row.amount;
    }
    return dataDictionary;
}




module.exports = { setCollected, resetCollected, getList, addCollected };
