const { getAllautoposts, setCurrent, deleteautopost } = require("../../contracts/autopost.js");
const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

setInterval(async () => {
try {
    const eventBOT = new minecraftCommand(bot);

    const currentTime = Date.now(); //Math.floor(Date.now() / 1000);
    const rows = await getAllautoposts();
    console.log("AUTOPOST");
    console.log(rows);


    for (const row of rows) {
        const { id, announcement, interval, duration, current } = row;
        console.log(`id: ${id}`);
        console.log(`announcement: ${announcement}`);
        console.log(`interval: ${interval}`);
        console.log(`duration: ${duration}`);
        console.log(`current: ${current}`);
        const difftime = currentTime - current;
        console.log(`difftime: ${difftime}`);

        if (duration > currentTime) {
            if (difftime + 4 * 60 * 1000 > interval) {
                await setCurrent(currentTime, id);
                eventBOT.send(`/gc ${announcement}`);
            }
        } else {
            await deleteautopost(id);
        }
        await delay(2000);
    }

} catch (e) {
    console.log(e);
}
//}, 60000);
}, 300000);


