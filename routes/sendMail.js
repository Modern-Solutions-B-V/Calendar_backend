const nodemailer = require("nodemailer");

const sendMail = async (email, mailSubject, content) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            service: 'gmail',
            port: 465,
            secure: true,
            auth: {
                user: 'traorebakary2002@gmail.com',
                pass: 'aoathpoyzgmrcyir'
            }
        });

        await transporter.sendMail({
            from: 'traorebakary2002@gmail.com',
            to: email,
            subject: mailSubject,
            html: content,
        });
        console.log("email sent successfully");
    } catch (error) {
        console.log("email not sent!");
        console.log(error);
        return error;
    }
};
module.exports = sendMail;