import { createTransport } from "nodemailer"

export async function sendEmail(toEmail, fromString, subject, message) {
    const transporter = createTransport({
        service: "Gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD
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