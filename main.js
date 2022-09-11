import express from "express"
import dotenv from "dotenv"
import { updateCache } from "./src/scrapper.js"
import { cache } from "./src/cache.js"
import { prisma } from "./src/client.js"
import fetch from "node-fetch"
import bodyParser from "body-parser"


dotenv.config()

updateCache()
setInterval(updateCache, 5400000)

const app = express()
const port = 3001

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
	if (cache.value.lastScraped === null) {
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
