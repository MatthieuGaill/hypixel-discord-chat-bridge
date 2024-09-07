const { getAllautoposts, setCurrent, deleteautopost } = require("../../contracts/autopost.js");
const minecraftCommand = require("../../contracts/minecraftCommand.js");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

setInterval(async () => {
try {
    const eventBOT = new minecraftCommand(bot);

    const currentTime = Date.now(); //Math.floor(Date.now() / 1000);
    const rows = await getAllautoposts();
    // console.log("AUTOPOST");
    // console.log(rows);


    for (const row of rows) {
        const { id, announcement, interval, duration, current } = row;
        // console.log(`id: ${id}`);
        // console.log(`announcement: ${announcement}`);
        // console.log(`interval: ${interval}`);
        // console.log(`duration: ${duration}`);
        // console.log(`current: ${current}`);
        const difftime = currentTime - current;
        // console.log(`difftime: ${difftime}`);

        if (duration > currentTime) {
            if (difftime + 4 * 60 * 1000 > interval) {
                await setCurrent(currentTime, id);
                const groups = truncateString(announcement, 120);
                for (const group of groups){
                     eventBOT.send(`/gc ${group}`);
                     await delay(1000);
                }
               
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


// function truncateString(inputString, groupSize) {
//     const groups = [];
//     for (let i = 0; i < inputString.length; i += groupSize) {
//       groups.push(inputString.slice(i, i + groupSize));
//     }
//     return groups;
//  }

function truncateString(inputString, groupSize) {
const groups = [];
let currentIndex = 0;

while (currentIndex < inputString.length) {
    // Find the last space within the current range
    let nextIndex = currentIndex + groupSize;
    if (nextIndex < inputString.length) {
    let spaceIndex = inputString.lastIndexOf(' ', nextIndex);

    // If there's no space found, we use the nextIndex
    if (spaceIndex > currentIndex) {
        nextIndex = spaceIndex;
    }
    }

    groups.push(inputString.slice(currentIndex, nextIndex).trim());
    currentIndex = nextIndex + 1; // Move to the character after the space
}

return groups;
}