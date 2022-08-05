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
const { ToadScheduler } = require('toad-scheduler');
const { job, testJob } = require('./controllers/scheduler');


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
db.on('error', err => console.error('An error occurred in connection to' + err));
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
app.post('/price-alerts-reminder', async (req, res) => {
        
    // email address
    let userEmail = req.body.price_alerts;

    try {
    // find documents(price alerts) associated with email address
    const findAlerts = await Product.find({ email: userEmail });

        if(!findAlerts.length) {
            res.status(404).render('pages/error.ejs', {priceReminderEmail: userEmail});
        }
        else {
            sendEmail('pages/email-price-alerts-reminders.ejs', { priceAlert: findAlerts, userEmail}).catch(err => console.error(err));
            //  set time delay for response so that extra CSS can apply on client browser page 
            setTimeout(() => res.redirect('/unsubscribe') , 5000);
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('pages/server-500.ejs');
    }
    
})

//  DELETE PRICE ALERT - unsubscribe from
app.post('/unsubscribe', async (req, res) => {

    // document Id for price alert
    let priceAlertId = req.body.documentId;

    try {
        const priceAlert = await Product.findByIdAndDelete(priceAlertId);

        if(!priceAlert){
            res.status(404).render('pages/error.ejs', {priceAlertId: priceAlertId})
        }

        res.status(200).render('pages/success.ejs', {priceAlert});

    } catch (error) {
        console.error(error);
        res.status(500).render('pages/server-500.ejs');
    }

})

// RESULTS PAGE (SUBMIT REQUEST)
app.post('/results-page', (req, res) => {
    
    // form details
    let productName = req.body.search.toLowerCase();
    let userEmail = req.body.emailAddress;

    try {
        const getProduct = async () => {
    
            let foundProduct = await productSearched(productName); 
    
            // updated product object with path name for image src tag
            let priceAlert = new Product({
                email: userEmail,
                ...foundProduct
            });
    
            priceAlert.save();
            return { priceAlert, userEmail };
        };

        getProduct().then((product) => {
                
                // deconstruct function return value object promise
                let { priceAlert, userEmail } = product;
    
                sendEmail('pages/email-results.ejs', {priceAlert, userEmail}).catch(console.error);
                res.render('pages/results-page.ejs', {priceAlert, userEmail});

        }).catch((error) => {
            console.error(error);
            res.status(400).render('pages/error.ejs', {badRequest: true});
        });
        
    } catch (error) {
        res.status(500).render('pages/server-500.ejs');
    }
          
});


//  Initialise cron package helper
const scheduler = new ToadScheduler();

//  RUN SCHEDULED TASK OPERATION
// scheduler.addSimpleIntervalJob(job);
scheduler.addSimpleIntervalJob(testJob);
console.log(`The cron job status is: ${scheduler.getById("test-job").getStatus()}`);


app.listen(PORT, () => console.log(`The server is running on PORT: ${PORT}. Open page at 'http://localhost:5000'`));