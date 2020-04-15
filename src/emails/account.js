const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "johanhanses@gmail.com",
        subject: "Welcome to the Task Manager",
        text: `Hello ${name}. Welcome to the megaSlangApp`
    });
};

const sendExitEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "johanhanses@gmail.com",
        subject: "We're sorry to see you go!",
        text: `Hello ${name}. If you have the time, please let us know why you've left us sad and lonely in a corner`
    });
};

module.exports = {
    sendWelcomeEmail,
    sendExitEmail
};
