import { createTransport } from "nodemailer"

export async function sendEmail(toEmail, fromString, subject, message) {
    const transporter = createTransport({
        host: process.env.SES_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.SES_USER,
            pass: process.env.SES_PASSWORD
        }
    })

    const info = await transporter.sendMail({
        from: fromString,
        to: toEmail,
        subject: subject,
        html: message
    })

    console.log("email sent:\n", info)
}