require('dotenv').config();
const nodemailer = require("nodemailer");
const ejs = require('ejs');

const sendEmail = async (filename, details) => {
  
  // deconstruct details object
  let { fullProductObj, email } = details;
  
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
   service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME, 
      pass: process.env.EMAIL_PWD, 
    },
  });

  // location to HTML template
  const data = await ejs.renderFile(__dirname + `/views/${filename}`, {fullProductObj});

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: "tonylubin78@gmail.com",
    to: email, 
    subject: "Your Money Saver Price Alert", 
    html: data
  });

  console.log("Message sent: %s", info.accepted);
}

module.exports = { sendEmail };

// ******** NB: for email css use inline css styles ********