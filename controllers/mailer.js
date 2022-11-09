require('dotenv').config();
const nodemailer = require("nodemailer");
const ejs = require('ejs');
const path = require('path');

const sendEmail = async (filename, details) => {
 
  // deconstruct details parameter object
  let { priceAlert, userEmail } = details;
  
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
   service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME, 
      pass: process.env.EMAIL_PWD, 
    },
  });

  // location to HTML template
  let pathName = path.resolve('views', filename);
  
  let data = await ejs.renderFile(pathName, {priceAlert, userEmail});

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to: userEmail, 
    subject: "Your Money Saver Price Alert", 
    html: data
  });

  console.log('\x1b[33m%s\x1b[0m', `Email sent to: ${info.accepted}`);
}


module.exports = sendEmail;

// ******** NB: for email css use inline css styles ********