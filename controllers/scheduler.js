const cron = require('node-cron');
const productSearched = require('./webscraper');
const sendEmail = require('./mailer');
const Product = require("../models/product");


//  function - fetch database (all items) 
const dbCheck = async () => {
    return await Product.find();
};

//  function - check if database is empty or not
const setTaskStatus = async () => {
    let db = await dbCheck();
    let check = db.length > 0 ? "filled" : "empty";
    return {check, db };
}

//  function - check if current(live) price is lower
const priceCheck = async (productName) => {
    let search = await productSearched(productName);
    let searchCheck = search.previousPrice.length > 1 ? true : false;
    let finalCheck = searchCheck === true ? search : null;
    return finalCheck;
};

// Schedule: every day at 08.00 & 20.00 --> "0 08,20 * * *"
const task = cron.schedule("*/5 * * * *", async () => {

    //  database items check
    let itemsInDatabase = await setTaskStatus();

    if(itemsInDatabase.check === "empty") {
        console.log("\x1b[34m%s\x1b[0m", "No price alerts found in the database."); // blue color msg
    }

    if(itemsInDatabase.check === "filled") {
        console.log("\x1b[32m%s\x1b[0m", "Price Alerts found."); // green color msg
        (async function() {
            for(const priceAlert of itemsInDatabase.db) {
                await priceCheck(priceAlert.name)
                .then((checked) => {
                    if(checked !== null) {
                        sendEmail('pages/email-results.ejs', { priceAlert: checked, userEmail: priceAlert.email });
                        console.log("\x1b[33m%s\x1b[0m", "The price changed - a saving is to be made!!!");
                    } else {
                        console.log("\x1b[33m%s\x1b[0m", "The price is the same - No savings to be made."); // yellow color msg
                    }
                })
                .catch((error) => {
                    console.log("\x1b[31m%s\x1b[0m", "Something went wrong with trying to check if product was cheaper on website. ", error);
                    // red color msg
                    // add item to end of array to try again
                    itemsInDatabase.db.push(priceAlert);
                })
            }
        })();
    }

}, { scheduled: false, timezone: "Europe/London" });


module.exports = task;


//  ***** for making cron expressions go to:  cronexpressiontogo.com *****