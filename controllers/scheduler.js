const cron = require('node-cron');

// Order: min, hour, day, month, day of week
const task = cron.schedule(' 0 09-23/3 * * *', () => {
    console.log("I'm running every 3 hours from 9am - 11pm")
}, {timezone: "Europe/London"});

task.start();

module.exports = { task };