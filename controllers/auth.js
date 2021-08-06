const ErrorResponce = require('../utils/errorResponce')
const asyncHandler = require('../middleware/async')
const User = require('../models/User')

// @desc:    Register a new user
//@route:    POST /api/v1/auth/register
//@access:   Public
exports.register = asyncHandler(async(req, res, next) => {
    const {name, email, password, role} = req.body

    const user = await User.create(req.body)

    sendTokenResponce(user, 200, res)
})

// @desc:    Login user
//@route:    POST /api/v1/auth/login
//@access:   Public
exports.login = asyncHandler(async(req, res, next) => {
    const {email, password} = req.body

    if(!email || !password){
        return next(new ErrorResponce('Please provide an email and a password', 400))
    }

    // Check for user
    const user = await User.findOne({email}).select('+password')

    if(!user){
        return next(new ErrorResponce('Invalid credentials', 401))
    }

    // check if password matches
    const isMatch = await user.matchPassword(password)

    if(!isMatch)
        return next(new ErrorResponce('Invalid credentials', 401))

    sendTokenResponce(user, 200, res)
})

// Get token from Model & create cookie and send responce
const sendTokenResponce = (user, statusCode, res) => {
    const token = user.getSignedJwtToken()

    // Cookie options object
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60* 60*1000), // to have 30 days expirey date
        httpOnly: true
    }

    // Only in production enviroment, allow secure flag(https only)
    if(process.env.NODE_ENV === 'production'){
        options.secure = true
    }

    // Set the cookie and send the responce
    res.status(statusCode)
       .cookie('token', token, options) // (key name, value, options)
       .json({Success: true, token})
}