// ***** DEV MODE SCRIPT --> NPM RUN DEV ******
// Import dependecies
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const productSearched = require('./controllers/webscraper');
const sendEmail = require('./controllers/mailer');
const mongoose = require('mongoose');
const Product = require('./models/product');
const { task } = require('./controllers/scheduler');



// Initialise express app
const app = express();

// Port Setting
const PORT = process.env.PORT || 5000;

// JSON Setting
app.use(express.json());

// creates a request body object(req.body)
app.use(bodyParser.urlencoded({extended: true}));

// DATABASE Connection string
const database = process.env.MONGODB_URI;
    
mongoose.connect(database,
    { useNewUrlParser: true,
    useUnifiedTopology: true}).catch(err => console.error('An error occurred in connection to' + err));

// DEFAULT DATABASE CONNECTION
const db = mongoose.connection

// connection error handling
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('connected', () => {
    console.log(`Successfully connected via mongoose to the MongoDB database: ${db.name}`);
});


// STATIC FILES - shortened path link for ejs template files e.g: "images/facewash.jpeg"
app.use(express.static(path.join(__dirname, 'public')));

// Using EJS for HTML - template default location(views folder)
app.set('view engine', 'ejs');


// HOME PAGE
app.get('/', (req, res) => {
    res.render('pages/home.ejs')
})

//  UNSUBSCRIBE PAGE
app.get('/unsubscribe', (req, res) => {
    res.render('pages/unsubscribe.ejs')
})

//  PRICE ALERT REMINDER PAGE
app.get('/price-alerts-reminder', (req, res) => {
    res.render('pages/price-alerts-reminder.ejs');
})

//  HOW TO USE -DEMO PAGE
app.get('/how-to-use', (req,res) => {
    res.render('pages/how-to-use.ejs');
})

//  EMAIL PRICE ALERTS RETRIEVAL
app.post('/price-alerts-reminder', async (req, res, next) => {
        
    // email address
    let userEmail = req.body.price_alerts;

    
    // find documents(price alerts) associated with email address
    await Product.find({ email: userEmail })
        .then((findAlerts) => {            
            if(!findAlerts.length) {
                
                // pass user email to local response object to use in error handling
                res.locals.userEmail = userEmail;

                // set custom error status (code & message)
                const error = new Error(`No price alerts found associated with the email: ${userEmail}`);
                error.status = 404;
                next(error);
            }
            else {
                sendEmail('pages/email-price-alerts-reminders.ejs', { priceAlert: findAlerts, userEmail})
                    .then(() => {
                        //  set time delay for response so that extra CSS can apply on client browser page 
                        setTimeout(() => res.status(200).redirect('/unsubscribe') , 5000);
                    })
            }
        })
        .catch(error => next(error));        
})

//  DELETE PRICE ALERT - unsubscribe from
app.post('/unsubscribe', async (req, res, next) => {

    // document Id for price alert
    let priceAlertId = req.body.documentId;

    await Product.findByIdAndDelete(priceAlertId)
        .then((priceAlert) => {
            if(!priceAlert){
                // pass price alert id to response object for error handling
                res.locals.priceAlertId = priceAlertId;

                // set custom error status (code & message)
                const error = new Error(`No price alerts found associated with the ID: ${priceAlertId}`);
                error.status = 404;
                next(error);
            } else {
                res.status(200).render('pages/success.ejs', {priceAlert});
            }    
        })
        .catch(error => next(error));

})

// RESULTS PAGE (SUBMIT REQUEST)
app.post('/results-page', (req, res, next) => {
    
    // form details
    let productName = req.body.search.toLowerCase();
    let userEmail = req.body.emailAddress;

    const getProduct = async () => {

        let foundProduct = await productSearched(productName);

        // updated product object with user email address
        let priceAlert = new Product({
            email: userEmail,
            ...foundProduct
        });

        priceAlert.save();
        return { priceAlert, userEmail };
    };

    getProduct()
        .then((product) => {
            
            // deconstruct function return value object promise
            let { priceAlert, userEmail } = product;
            
            sendEmail('pages/email-results.ejs', {priceAlert, userEmail});
            res.status(200).render('pages/results-page.ejs', {priceAlert, userEmail});
            
        })
        .catch(error => next(error));          
});


//  Task Scheduler (cron job) starting
task.start();


//  ERROR HANDLING MIDDLEWARE
app.use((error, req, res, next) => {
    console.log(`Error Handling Middleware called on the Path: ${req.path}`);
    console.log(`Error Status (${error.status}): ${error.message}.`);

    if((error.message).includes("TypeError")) {
        res.status(400).render('pages/error.ejs', {badRequest: true});
    } else if(error.status === 404 && res.locals.userEmail) {
        console.log(res.locals.userEmail)
        res.status(404).render('pages/error.ejs', {priceReminderEmail: res.locals.userEmail});
    } else if(error.status === 404 && res.locals.priceAlertId) {
        res.status(404).render('pages/error.ejs', {priceAlertId: res.locals.priceAlertId});
    }
    else {
        let code = res.status(error.status || 500);
        res.status(code).render('pages/server-500.ejs');
    }    
});


app.listen(PORT, () => console.log(`The server is running on PORT: ${PORT}. Open page at 'http://localhost:5000'`));