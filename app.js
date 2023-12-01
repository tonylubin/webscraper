// Import dependecies
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const page_routes = require("./routes/priceAlerts");
const cronTask = require("./controllers/scheduler");


// Initialise express app
const app = express();

// Port Setting
const PORT = process.env.PORT || 5000;

// JSON Setting
app.use(express.json());

// creates a request body object(req.body)
app.use(bodyParser.urlencoded({ extended: true }));

// DATABASE Connection string
const database = process.env.MONGODB_URI_2;

mongoose.set("strictQuery", false);

mongoose
  .connect(database, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch((err) =>
    console.error(
      "\x1b[31m%s\x1b[0m",
      "An error occurred in connection to" + err
    )
  );

// DEFAULT DATABASE CONNECTION
const db = mongoose.connection;

// connection error handling
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.on("connected", () => {
  console.log(
    "\x1b[32m%s\x1b[0m",
    `Successfully connected via mongoose to the MongoDB database: ${db.name}`
  );
});

// STATIC FILES - shortened path link for ejs template files e.g: "images/boots-website.png"
app.use(express.static(path.join(__dirname, "public")));

// Using EJS for HTML - template default location(views folder)
app.set("view engine", "ejs");

app.use("/", page_routes);

//  Task Scheduler (cron job) starting
//  cronTask.start();

//  ERROR HANDLING MIDDLEWARE
app.use((error, req, res, _next) => {

  console.log(
    "\x1b[31m%s\x1b[0m",
    `Error Status (${error.status}): ${error.message}.`,
    error
  );

  console.log(
    "\x1b[31m%s\x1b[0m",
    `Error Handling Middleware called on the Path: ${req.path}`
  );

  if (error.message.includes("TypeError")) {
    res.status(400).render("pages/error.ejs", { badRequest: true });
  } else if (error.status === 404 && res.locals.userEmail) {
    console.log(res.locals.userEmail);
    res
      .status(404)
      .render("pages/error.ejs", { priceReminderEmail: res.locals.userEmail });
  } else if (error.status === 404 && res.locals.priceAlertId) {
    res
      .status(404)
      .render("pages/error.ejs", { priceAlertId: res.locals.priceAlertId });
  } else {
    let code = res.status(error.status || 500);
    res.status(code).render("pages/server-500.ejs");
  }
});

app.listen(PORT, () =>
  console.log(
    "\x1b[32m%s\x1b[0m",
    `The server is running on PORT: ${PORT}. Open page at 'http://localhost:5000'`
  )
);