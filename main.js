import express from "express"
import dotenv from "dotenv"
import {updateCache} from "./src/scrapper.js"
import {cache} from "./src/cache.js"
import {prisma} from "./src/client.js"
import fetch from "node-fetch"
import bodyParser from "body-parser"
import TwilioClient from "twilio";
import mailgun from "mailgun-js";

dotenv.config()

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const mg = mailgun({apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN});



updateCache()
setInterval(updateCache, 6000000)

const app = express()
const port = 3001

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
    // Notify Eric via email and SMS that something is wrong with the server
    if (cache.value.lastScraped === null || cache.value.lastScraped.toString().slice(0, 10) !== new Date().toISOString().slice(0, 10)) {
        console.log("Cache Null or Stale - Sending notifications to Eric Fletcher");
        const data2 = {
            // from: 'Excited User <me@samples.mailgun.org>',
            from: `bpl-pass-notification@${MAILGUN_DOMAIN}`,
            to: process.env.ERIC_EMAIL,
            // to: 'bar@example.com, YOU@YOUR_DOMAIN_NAME',
            subject: 'Boston Public Library Museum Issue Notification',
            text: 'Cache is null or stale - please check the server' +
                new URL("https://bpl-museum-passes.vercel.app/")
        };
        mg.messages().send(data2, function (error, body) {
            console.log("Email Body: " + body);
        });
        client.messages
            .create({
                body: 'Cache is null or stale - please check the server' +
                    new URL("https://bpl-museum-passes.vercel.app/"),
                from: '+18145606408',
                to: process.env.ERIC_PHONE,
            })
            .then(message => console.log("Phone Message SID: " + message.sid));
        return res.status(500).json({
            message: 'Cache not available'
        })
    }
    res.json(cache.value)
})

app.post('/', async (req, res) => {
    // Google Recaptcha check
    const human = validateHuman(req.body.token);
    const recaptchaSuccess = await human;

    // console.log("TOKEN IS: ", req.body.token);

    async function validateHuman(token) {
        const secret = process.env.RECAPTCHA_SECRET_KEY;
        const response = await fetch(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
            {
                method: "POST",
            }
        );
        const data = await response.json();
        console.log("DATA IS: ", data);
        return data.success;
    }

    // Do this if not passing recaptcha check
    if (!recaptchaSuccess) {
        // alert("Unable to submit data. You have failed reCAPTCHA check.");
        res.status(400).json({error: "Unauthorized - failed recaptcha"});
        return;
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            message: "Method not allowed"
        });
    }
    // const requestData = JSON.parse(req.body);
    const requestData = req.body.body;


    const savedRequest = await prisma.request.create({
        data: requestData
    })
    res.json(savedRequest);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
