const express = require('express')
const dotenv = require('dotenv')

//Load env vars
dotenv.config({path: 'config.env'})

const app = express()

app.get('/', (req, res) => {
    res.send("Hello from express");
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}!`);
});