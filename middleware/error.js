const ErrorResponce = require("../utils/errorResponce");

//Middleware of handling errors
const errorHandler = (err, req, res, next) => { 
    let error = { ...err } //spread operator
    error.message = err.message

    // Log n console for Dev
    console.log(err.stack.red);

    //Mongoose bad ObjectId
    if(err.name === 'CastError'){
        const message = `Bootcamp not found with id: ${err.value}`
        error = new ErrorResponce(message, 404)
    }

    // Mongoose duplicate key
    if(err.code === 11000){
        const message = `Duplicate field value entered`
        error = new ErrorResponce(message, 400)
    }

    // Mongoose Validation error
    if(err.name === 'ValidationError'){
        console.log(err.errors);
        const message = Object.values(err.errors).map((val) => val.message)
        error = new ErrorResponce(message, 400)
    }

    res.status(error.statusCode || 500).json({Success: false, error: error.message || 'Server Error'})
}

module.exports = errorHandler