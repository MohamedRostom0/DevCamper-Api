const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const colors = require('colors')
const errorHandler = require('./middleware/error')

const connectDB = require('./config/db')

//Load env vars
dotenv.config({path: 'config/config.env'})

connectDB()

const app = express()

//Body parser
app.use(express.json())

//dev logging middleware
if (process.env.NODE_ENV === "development"){
    app.use(morgan('dev'))
}

// Route files
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')

//Mount routers
app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses)

app.use(errorHandler) // Must be after mounting routers

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}!`.yellow.bold);
});

//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    server.close(() => process.exit(1)) //Take down server
})