const express = require("express");
const productSearched = require("../controllers/webscraper");
const sendEmail = require("../controllers/mailer");
const ShoppingItem = require("../models/product");

const router = express.Router();

// HOME PAGE
router.get("/", (_req, res) => {
  res.render("pages/home.ejs");
});

//  UNSUBSCRIBE PAGE
router.get("/unsubscribe", (_req, res) => {
  res.render("pages/unsubscribe.ejs");
});

//  PRICE ALERT REMINDER PAGE
router.get("/price-alerts-reminder", (_req, res) => {
  res.render("pages/price-alerts-reminder.ejs");
});

//  HOW TO USE -DEMO PAGE
router.get("/how-to-use", (_req, res) => {
  res.render("pages/how-to-use.ejs");
});

//  RESULTS PAGE (SUBMIT REQUEST)
router.post("/results-page-alt", async (req, res, next) => {
  try {
    // form details
    let productName = req.body.search.toLowerCase();
    let userEmail = req.body.emailAddress;

    let { Product } = await productSearched(productName);
    // Update Product object/schema & save to db
    Product.email = userEmail;
    await Product.save();
    
    console.log(
      "\x1b[32m%s\x1b[0m",
      "Well done! A price alert has been created."
      );
      
    await sendEmail("pages/email-results.ejs", { Product, userEmail })
      .then(() => {
        res.status(200).render("pages/results-page.ejs", { Product });
      })

  } catch (error) {
    return next(error);
  }
});

//  EMAIL PRICE ALERTS RETRIEVAL
router.post("/price-alerts-reminder", async (req, res, next) => {
  // email address
  let userEmail = req.body.price_alerts;
 
  // find documents(price alerts) associated with email address
  try {
    const userPriceAlerts = await ShoppingItem.find({ email: userEmail });
    if (!userPriceAlerts.length) {
      // pass user email to local response object to use in error handling
      res.locals.userEmail = userEmail;

      // set custom error status (code & message)
      const error = new Error(
        `No price alerts found associated with the email: ${userEmail}`
      );
      error.status = 404;
      next(error);
    } else {
        await sendEmail("pages/email-price-alerts-reminders.ejs", { Product : userPriceAlerts, userEmail })
        //  set time delay for response so that extra CSS can apply on client browser page
        .then(() => setTimeout(() => res.status(200).redirect("/"), 3000));
    }
  } catch (error) {
    next(error);
  }
});

//  DELETE PRICE ALERT - unsubscribe from
router.post("/unsubscribe", async (req, res, next) => {
  // document Id for price alert
  let priceAlertId = req.body.documentId;

  try {
    const deletedPriceAlert = await ShoppingItem.findByIdAndDelete(priceAlertId);
    if (!deletedPriceAlert) {
      // pass price alert id to response object for error handling
      res.locals.priceAlertId = priceAlertId;

      // set custom error status (code & message)
      const error = new Error(
        `No price alerts found associated with the ID: ${priceAlertId}`
      );
      error.status = 404;
      next(error);
    } else {
      res.status(200).render("pages/success.ejs", { deletedPriceAlert });
    }
  } catch (error) {
    next(error)
  }
});

module.exports = router;
