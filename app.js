// ***** DEV MODE SCRIPT --> NPM RUN DEV ******
// Import dependecies
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const productSearched = require('./controllers/webscraper');
const fs = require('fs');
const axios = require('axios');
const sendEmail = require('./controllers/mailer');
const mongoose = require('mongoose');
const Product = require('./models/product');


// Initialise express app
const app = express();

// Port Setting
const PORT = process.env.PORT || 5000;

// JSON Setting
app.use(express.json());

// creates a request body object(req.body)
app.use(bodyParser.urlencoded({extended: true}));

// DATABASE Connection
const database = process.env.MONGODB_URI;
    
mongoose.connect(database,
    { useNewUrlParser: true,
    useUnifiedTopology: true}).catch(err => console.error('An error occurred in connection to' + err));

// connection error handling
mongoose.connection.on('error', err => console.error('An error occurred in connection to' + err));
mongoose.connection.on('connected', () => {
    const dbName = mongoose.connection.name;
    console.log(`Successfully connected via mongoose to the MongoDB database: ${dbName}`);
});

// STATIC FILES - shortened path link for ejs template files e.g: "images/facewash.jpeg"
app.use(express.static(path.join(__dirname, 'public')));

// Using EJS for HTML - template default location(views folder)
app.set('view engine', 'ejs');


// HOME PAGE
app.get('/', (req, res) => {
    res.render('home.ejs')
})

//  UNSUBSCRIBE PAGE
app.get('/unsubscribe', (req, res) => {
    res.render('unsubscribe.ejs')
})

//  DELETE PRICE ALERT
app.post('/unsubscribe/:id', async (req, res) => {
    // document Id for price alert
    let priceAlertId = req.body.documentId;

    try {
        const priceAlert = await Product.findByIdAndDelete(priceAlertId);

        if(!priceAlert){
            res.status(404).send(`The price alert with the ID of ${priceAlertId} doesn't exist. Please try again.`)
        }

        res.status(200).send(`You have successfully unsubscribed from the price alert for: ${priceAlert.name}`);

    } catch (error) {
        res.status(500).send(`Sorry, an error occured: ${error}`);
    }

})

// RESULTS PAGE (SUBMIT REQUEST)
app.post('/results-page', (req, res) => {
    
    // form details
    let productName = req.body.search.toLowerCase();
    let userEmail = req.body.emailAddress;
    
    const getProduct = async () => {

        let foundProduct = await productSearched(productName); 
        let downloadImageProduct = await axios({method: 'get', url: foundProduct.imageUrl, responseType: 'stream'});

        // write image filename & combine path name to save file to public/images folder  
        await downloadImageProduct.data.pipe(fs.createWriteStream(path.join(__dirname, "./public/images", `${foundProduct.name}.jpeg`)));

        // updated product object with path name for image src tag
        let priceAlert = new Product({
            email: userEmail,
            ...foundProduct,
            ...{imageUrl: `/images/${foundProduct.name}.jpeg`},
        });

        priceAlert.save();
        return {priceAlert, userEmail};
    }

   
    getProduct().then((product) => {

            // deconstruct function return value object promise
            let { priceAlert, userEmail } = product;

            //sendEmail('email-results.ejs', {priceAlert, userEmail}).catch(console.error);
            res.render('results-page.ejs', {priceAlert, userEmail});
    }).catch(error => console.error(error));
          
});


app.listen(PORT, () => console.log(`The server is running on PORT: ${PORT}. Open page at 'http://localhost:5000'`))