// ***** DEV MODE SCRIPT --> NPM RUN DEV ******
// Import dependecies
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { productSearch } = require('./webscraper');
const fs = require('fs');
const axios = require('axios');
const { sendEmail } = require('./mailer');


// Initialise express app
const app = express();

// Port Setting
const PORT = process.env.PORT || 5000;

// JSON Setting
app.use(express.json());

// creates a request body object(req.body)
app.use(bodyParser.urlencoded({extended: true}));

// CSS - link for ejs template files
app.use(express.static(path.join(__dirname, 'public')));

// Using EJS for HTML - template default location(views folder)
app.set('view engine', 'ejs');


// HOME PAGE (GET REQUEST)
app.get('/home', (req, res) => {
    res.render('home.ejs')
})

// RESULTS PAGE (SUBMIT REQUEST)
app.post('/results-page', (req, res) => {
    
    // form details
    let productName = req.body.search.toLowerCase();
    let email = req.body.emailAddress;
    
    const getProduct = async () => {
        let foundProduct = await productSearch(productName);
        let downloadImageProduct = await axios({method: 'get', url: foundProduct.imageUrl, responseType: 'stream'});

        // write image filename & combine path name to save file to public/images folder  
        await downloadImageProduct.data.pipe(fs.createWriteStream(path.join(__dirname, "./public/images", `${foundProduct.name}.jpeg`)));

        // updated product object with path name for image src tag
        let fullProductObj = {
            imageUrl: `images/${foundProduct.name}.jpeg`,
            ...foundProduct
        };
        return {fullProductObj, email};
    }

   
    getProduct().then((product) => {

            // deconstruct function return value object promise
            let { fullProductObj, email } = product;

            sendEmail('email-results.ejs', {fullProductObj, email}).catch(console.error);
            res.render('results-page.ejs', {fullProductObj, email});
    })
          
});


app.listen(PORT, () => console.log(`The server is running on PORT: ${PORT}. Open page at 'http://localhost:5000/home'`))