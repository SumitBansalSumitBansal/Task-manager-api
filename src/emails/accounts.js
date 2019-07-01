const sgMail = require("@sendgrid/mail");

const sendgridAPIKey =
  "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";

sgMail.setApiKey(sendgridAPIKey);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: email,
    subject: `${name}, Thanks for joining us!`,
    text: "Explore our app"
  });
};

module.exports = {
  sendWelcomeEmail
};
