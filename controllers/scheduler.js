const { SimpleIntervalJob, AsyncTask } = require('toad-scheduler');
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


//  Define async task to perform in cron job
const task = new AsyncTask("check database", async () => {

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
                });
            }
        })();
    }
}, (err) => console.error(err));

//  Create scheduled cron job
const job = new SimpleIntervalJob({ days: 1 }, task, "job");
const testJob = new SimpleIntervalJob({ minutes: 1}, task, "test-job");


module.exports =  { job, testJob };

//  ***** for making cron expressions go to:  cronexpressiontogo.com *****