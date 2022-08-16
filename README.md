# THE MONEY SAVER APP

A web scraping app that allows you to create a price alert and sends
an email, at set intervals, when the product becomes cheaper.

Built this app as a personal project to develop my skills for the back-end using **Node Js** and as a way to get an email alert when the products that I regularly purchase on the Boots website become cheaper than the usual RRP.

<br>

---

## USER STORY

<br>

As a user I will look up a product that I would like to purchase on the Boots website. Then I will navigate to the the Money Saver App homepage and enter the product that I want to set-up the price alert for, as well as my email address for the price alert to be sent to. This is demonstrated on a "how to page".

I also have the possibility to get a reminder of the price alert(s) I have set-up and the ability to delete any, all from the convenience of the website pages of the app.

<br>

---

## APPROACH & OBJECTIVES

The app was designed entirely on the back-end using **Node Js** and with a server built using **Express** and using server-side rendering to deliver html pages to the client/browser.

<br>

### UI/DESIGN

* Designed using Bootstrap for the html webpages.

* Off-canvas Navigation menu (burger-style) with links to other website pages.

* Form(s) as input for setting up price alert, reminder and unsubscription(deletion).

* EJS - setting for the html template engine for server-side rendering with views (webpages) and partials (reusable code for pages).

* Inline-style CSS for email (best approach due to limitations of email css support)

<br>

### FUNCTIONALITY

<br>

**Note:** most functions/code is written in a asynchronous way with `async/await & .then` methods due to database calls and website scrapping data fetching.

Use of same name and object destructuring throughout code in order to have consistent(same) variables to use across EJS html pages.  

<br>

#### SERVER

* Express - for handling GET/POST requests, sending html pages to the client and handling form data for creating/deleting price alerts and getting reminders.

* Public Folder - for serving static files e.g. images

* .ENV file - for storing user/confidential details

* Middleware - for handling errors and sending custom responses to the user via `400, 404` & `500` webpages.

<br>

#### DATABASE

* MongoDb Atlas - cloud based database for storing price alerts

* Mongoose - for building schema/model for the price alert, connection handling and interacting with MongoDb database.

<br>

#### SENDING EMAILS

* NodeMailer - a module for sending emails to the user about the price alerts. Email was composed as an html ejs page and sent to provided user email recipient.

<br>

#### TASK SCHEDULER

1. Node-cron - a module for creating scheduled tasks (cron jobs) at intervals as desired by developer.

2. Queries database to see if any price alerts exist. Then checks price of product(s) in database on website to see if it's cheaper using a `for of loop` for `async/await` proper functionality.

3. Runs twice a day and sends email to user if product is cheaper.

<br>

#### WEBSCRAPPING FUNCTION

<br>

1. Puppeteer - a node library that provides a browser instance that can be controlled programmatically and simulates what a user would normally do/interact with.

2. Opens a headless-browser (non-gui). Provided URL navigates to website e.g. `www.boots.com`.

3. Set default timeout timings to 50000ms to account for internet traffic/speed and buffer for function timming out.

4. DOM - read DOM to find `ID's` or `Classes` as *selectors* to obtain website data required.

5. Used `click, enter` & `typing` methods for browser interaction. E.g. clicking on cookies banner when website loads. Typing product in search bar and enter to send search request.

6. `waitForSelector` & `waitForNavigation` for browser behaviour i.e. waiting for desired page when navigation occurs.

7. Used `page.evaluate` to scrape page and create a *"product"* object with all relevant data required and returned as a function promise.

<br>

#### INTERACTIONS

<br>

* GET Requests - handling & serving web pages.

* POST Requests:

  * Price Alert creation - handling form data, take product and email inputs and call `productSearched()` function to webscrape the requested product. <br>Then create a new schema model instance from returned result, update it with user email address and `save()` it to the database.<br>
  As function(s) are async use `.then()` to handle promise and send email to user and setting status code `200` response and sending corresponding success response webpage to the user.

  * Price Alert reminder - query database with `Product.find()` mongoose method and send email with `sendMail()` callback function.

  * Unsubscribe - for dealing with delete requests (as form is only GET/POST), user enters price alert id that is created with mongoose Product schema. With the `Product.findByIdAndDelete()` method we search for id and delete from database.  

<br>

---

<br>

## How To Use

<br>

Clone down repo. You will need `npm` and `node` installed globally.<br>
`https://github.com/tonylubin/webscraper---node-js.git`

### Installation

`npm install`

### To Start Server

`npm start`

### View Locally

`http://localhost:5000`

### Prerequisites

As the app stores the price alerts in a database, you will need a *MongoDb* account. Here I have used *Atlas (cloud version)*.

1. Create a `.env` file to the root folder.
2. Add the connection string for connecting to your MongoDb cluster to the following `MONGOBD_URI` variable. You can replace `<DATABASENAME>` with your own here and it will be created when you create your first price alert.

> `MONGODB_URI = mongodb+srv://<USER>:<PASSWORD>@cluster0.rmhakbb.mongodb.net/<DATABASENAME>?retryWrites=true&w=majority`

3. Add your email details (account to send emails from) as follows (for further info visit nodemailer) :

> `EMAIL_USERNAME = <your_email_address>`

> `EMAIL_PASSWORD = <your_email_password>`

<br>

---

<br>

## Technologies used

* Node Js
* EJS (html template engine)
* Express (server)
* Puppeteer (web scrapping)
* Node-cron (linux cron job - task scheduler)
* Nodemailer (email sender)
* MongoDb Atlas (database)
* Mongoose (ODM library)
* Bootstrap

<br>

---

<br>

## FURTHER INFO

* To set your own schedule(time) to run the price comparison got to `controllers/scheduler.js` file and alter the cron expression that looks like ( * * * * * ) - https://cronexpressiontogo.com for info.

* utilised PM2 module for process managing (keeping server alive) and restarting automatically<br>
e.g. in terminal run `pm2 start app.js` then `pm2 save`

* after boot-up in terminal run `pm2 resurrect` for saved processess to resume
This is needed because app is built on linux (using wsl2) and start-up script won't work across the different operating systems.
