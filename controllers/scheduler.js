const cron = require("node-cron");
const productSearched = require("./webscraper");
const sendEmail = require("./mailer");
const ShoppingItem = require("../models/product");

//  function - fetch database (get all documents from collection)
const dbCheck = async () => {
  return await ShoppingItem.find();
};

//  function - check if database is empty or not
const setTaskStatus = async () => {
  let db = await dbCheck();
  let check = db.length > 0 ? "filled" : "empty";
  return { check, db };
};

//  function - check if current live item has price offer
const priceCheck = async (productName) => {
  let { Product } = await productSearched(productName);
  let check = Product.offer || Product.nectarOffer ? true : false;
  let finalCheck = check === true ? Product : null;
  return finalCheck;
};

const runScheduleTask = async () => {
  try {
    //  database items check
    let { check, db } = await setTaskStatus();

    if (check === "empty") {
      console.log(
        "\x1b[34m%s\x1b[0m",
        "No price alerts found in the database."
      ); // blue msg
    }

    if (check === "filled") {
      console.log("\x1b[32m%s\x1b[0m", "Price Alerts found."); // green msg

      for (const item of db) {
        const priceAlert = await priceCheck(item.title);

        if (priceAlert === null) {
          console.log(
            "\x1b[33m%s\x1b[0m",
            "The price is the same - No savings to be made."
          ); // yellow msg
        } else {
          sendEmail("pages/email-results.ejs", {
            Product: priceAlert,
            userEmail: item.email,
          });
          console.log(
            "\x1b[33m%s\x1b[0m",
            "The price changed - a saving is to be made!!!"
          );
        }
      }
    }
  } catch (error) {
    console.log(
      "Something went wrong whilst trying to check the price alert!",
      error
    );
  }
};

//  ***** for making cron expressions go to:  cronexpressiontogo.com *****
// Schedule: every day at 20.00 --> "0 20 * * *"
const cronTask = cron.schedule(
  "0 20 * * *",
  async () => {
    await runScheduleTask();
  },
  { scheduled: false, timezone: "Europe/London" }
);

module.exports = cronTask;