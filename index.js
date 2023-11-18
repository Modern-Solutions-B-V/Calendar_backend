const bodyParser = require('body-parser')
const express = require('express')

const cors = require('cors')
const app = express()
require('dotenv').config();
const userRoute = require("./routes/userRoute")
const bookingRoute = require("./routes/bookingRoutes")

const { connectToDatabase } = require('./config/databaseUtils')
const { job, processBookingNumbers } = require("./controllers/bookingController")


connectToDatabase();

app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/', userRoute)
app.use('/booking', bookingRoute)


processBookingNumbers();
job.start()


app.listen(5000, () => {
    console.log('server running on port 5000');
})