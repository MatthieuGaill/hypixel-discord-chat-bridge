const updateRolesCommand = require("../commands/forceUpdateEveryone.js");
const updateafkCommand = require("../commands/updateafkCommand.js");
const config = require("../../../config.json");
const Logger = require("../../Logger.js");
const cron = require("node-cron");

if (config.verification.autoUpdater) {
  Logger.discordMessage(`RoleSync ready, executing every ${config.verification.autoUpdaterInterval} hours.`);
  cron.schedule(`0 */${config.verification.autoUpdaterInterval} * * *`, async () => {
    Logger.discordMessage("Executing RoleSync...");
    await updateRolesCommand.execute(null, true);
    await updateafkCommand.execute(null);
    Logger.discordMessage("RoleSync successfully executed.");
  });
}