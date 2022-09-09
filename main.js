import express from "express"
import dotenv from "dotenv"
import { updateCache } from "./src/scrapper.js"
import { cache } from "./src/cache.js"

dotenv.config()

updateCache()
setInterval(updateCache, 600000)

const app = express()
const port = 3000

app.get('/', (req, res) => {
	if (cache.value.lastScraped === null) {
		return res.status(500).json({
			message: 'Cache not available'
		})
	}

	res.json(cache)
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
