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

// Schedule: every day at 10.00 & 20.00
const task = cron.schedule("0 10,20 * * *", async () => {

    //  database items check
    let itemsInDatabase = await setTaskStatus();

    if(itemsInDatabase.check === "empty") {
        console.log("No price alerts found in the database.");
    }

    if(itemsInDatabase.check === "filled") {
        console.log("Price Alerts found.");
        (async function() {
            for(const priceAlert of itemsInDatabase.db) {
                await priceCheck(priceAlert.name)
                .then((checked) => {
                    if(checked !== null) {
                        sendEmail('pages/email-results.ejs', { priceAlert: checked, userEmail: priceAlert.email });
                        console.log("The price changed - a saving is to be made!!!");
                    } else {
                        console.log("The price is the same - No savings to be made.");
                    }
                })
                .catch((error) => {
                    console.log("Something went wrong with trying to check if product was cheaper on website. ", error);
                    // add item to end of array to try again
                    itemsInDatabase.db.push(priceAlert);
                })
            }
        })();
    }

}, { scheduled: false, timezone: "Europe/London" });


//  Task for testing cron job
const testTask = cron.schedule("*/15 * * * *", async () => {

    console.log("Cron Job is running...");
    //  database items check
    let itemsInDatabase = await setTaskStatus();

    if(itemsInDatabase.check === "empty") {
        console.log("No price alerts found in the database.");
    }

    if(itemsInDatabase.check === "filled") {
        console.log("Price Alerts found.");
        (async function() {
            for(const priceAlert of itemsInDatabase.db) {
                await priceCheck(priceAlert.name)
                .then((checked) => {
                    if(checked !== null) {
                        sendEmail('pages/email-results.ejs', { priceAlert: checked, userEmail: priceAlert.email });
                        console.log("The price changed - a saving is to be made!!!");
                    } else {
                        console.log("The price is the same - No savings to be made.");
                    }
                })
                .catch((error) => {
                    console.log("Something went wrong with trying to check if product was cheaper on website. ", error);
                    // add item to end of array to try again
                    itemsInDatabase.db.push(priceAlert);
                })
            }
        })();
    }

}, { scheduled: false, timezone: "Europe/London" });


module.exports = { task, testTask };


//  ***** for making cron expressions go to:  cronexpressiontogo.com *****