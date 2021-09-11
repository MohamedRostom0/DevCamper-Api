const ErrorResponce = require('../utils/errorResponce')
const asyncHandler = require('../middleware/async')
const User = require('../models/User')
const crypto = require('crypto')

const sendEmail = require('../utils/sendEmail')

// @desc:    Register a new user
//@route:    POST /api/v1/auth/register
//@access:   Public
exports.register = asyncHandler(async(req, res, next) => {
    const {name, email, password, role} = req.body
    const user = await User.create({
        name, email, password, role
    })
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

// @desc:    Get current logged in user
//@route:    GET /api/v1/auth/me
//@access:   Private
exports.getMe = asyncHandler(async(req, res, next) => {
    const user = await User.findById(req.user.id)
    res.status(200).json({Success: true, data: user})
})

// @desc:    Update current logged in user details
//@route:    PUT /api/v1/auth/updatedetails
//@access:   Private
exports.updateUser = asyncHandler(async(req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {new: true, runValidators: true})

    if(!user){
        return next(new ErrorResponce(`No user with id: ${req.user.id}`, 404))
    }

    res.status(200).json({Success: true, data: user})
})

// @desc:    Change password
//@route:    GET /api/v1/auth/updatepassword
//@access:   Private
exports.updatePassword = asyncHandler(async(req, res, next) => {
    const user = await User.findById(req.user.id).select('+password')

    const isMatch = await user.matchPassword(req.body.currentPassword)
    if(!isMatch){
        return next(new ErrorResponce('password is incorrect', 401))
    }

    user.password = req.body.newPassword
    await user.save()

    sendTokenResponce(user, 200, res)
})

// @desc:    Forgot password
//@route:    POST /api/v1/auth/forgotpassword
//@access:   public
exports.forgotPassword = asyncHandler(async(req, res, next) => {
    const user = await User.findOne({email: req.body.email})

    if(!user){
        return next(new ErrorResponce(`No user with email: ${req.body.email}`, 404))
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken()

    await user.save({validateBeforeSave: false})

    // Create reset Url
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`
    const message = `You are receiving this email because you (or someone else) has requested to reset the password.. Please make a PUT request to \n\n ${resetURL}`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token' ,
            message
        })

        return res.status(200).json({Success: true, data: 'Email Sent'})
    } 
    catch (error) {
        console.log(error);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({validateBeforeSave: false})

        return next(new ErrorResponce(`Email could not be sent`, 500))
    }
})

// @desc:    Reset password
//@route:    PUT /api/v1/auth/resetpassword/:resetToken
//@access:   public
exports.resetPassword = asyncHandler(async(req, res, next) => {
    // get hashed token
    const resetPasswordToken = crypto.createHash('sha256')
                                     .update(req.params.resetToken)
                                     .digest('hex');
    
    // Search for user by the resetToken                                 
    const user = await User.findOne({resetPasswordToken, resetPasswordExpire: {$gt: Date.now()}})

    if(!user){
        return next(new ErrorResponce('Invalid token', 400))
    }

    // Set new password
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

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