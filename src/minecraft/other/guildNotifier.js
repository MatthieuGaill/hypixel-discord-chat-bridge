const minecraftCommand = require("../../contracts/minecraftCommand.js");
const Database = require('better-sqlite3');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

setInterval(async () => {
try {
    const eventBOT = new minecraftCommand(bot);

    const db = new Database('autopost.sqlite');
    db.exec(`CREATE TABLE IF NOT EXISTS autopostdata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement TEXT,
      interval INTEGER,
      duration INTEGER,
      current INTEGER
    )`);
    const currentTime = Date.now(); //Math.floor(Date.now() / 1000);
    const rows = db.prepare("SELECT * FROM autopostdata").all();


    for (const row of rows) {
        const { id, announcement, interval, duration, current } = row;
        const difftime = currentTime - current;

        if (duration > currentTime) {
            if (difftime + 4 * 60 * 1000 > interval) {
                db.prepare("UPDATE autopostdata SET current = ? WHERE id = ?").run(currentTime, id);
                eventBOT.send(`/gc ${announcement}`);
            }
        } else {
            db.prepare("DELETE FROM autopostdata WHERE id = ?").run(id);
        }
        await delay(2000);
    }

} catch (e) {
    console.log(e);
}
}, 300000);


