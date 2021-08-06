const path = require('path')
const Bootcamp = require('../models/Bootcamp')
const ErrorResponce = require('../utils/errorResponce')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder')
// const { parse } = require('dotenv')

// @desc:    Get all bootcamps
//@route:    Get /api/v1/bootcamps
//@access:   Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults)  
})

// @desc:    Get a single bootcamps
//@route:    Get /api/v1/bootcamps/:id
//@access:   Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id).populate('courses')

    if(!bootcamp){
        return next(new ErrorResponce(`Bootcamp not found with id: ${req.params.id}`, 404))
    }

    res.status(200).json({Success: true, data: bootcamp})
})

// @desc:    Create a new bootcamps
//@route:    Post /api/v1/bootcamps
//@access:   Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.create(req.body)
    res.status(201).json({Success: true, data: bootcamp})
})

// @desc:    Update a bootcamps
//@route:    Put /api/v1/bootcamps/:id
//@access:   Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true,
    })

    if(!bootcamp){
        return next(new ErrorResponce(`Bootcamp not found with id: ${req.params.id}`, 404))
    }

    res.status(200).json({success: true, data: bootcamp})
})

// @desc:    Delete a bootcamp
//@route:    Delete /api/v1/bootcamps/:id
//@access:   Private
exports.deleteBootcamp = asyncHandler (async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    
    if(!bootcamp){
        return next(new ErrorResponce(`Bootcamp not found with id: ${req.params.id}`, 404))
    }

    await bootcamp.remove()

    res.status(200).json({Success: true, data: {}})
})


// @desc:    Get bootcamps within a radius
//@route:    get /api/v1/bootcamps/radius/:zipcode/:distance
//@access:   Private
exports.getBootcampsInRadius = asyncHandler (async (req, res, next) => {
    const {zipcode, distance} = req.params

    //Get lat/lon from geocoder
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const lon = loc[0].longitude
    
    //calculate radius using radians
    //divide distance by radius of earth
    // Earth radius = 3,963 miles / 6378 KM
    const radius = distance / 3963
    const bootcamps = await Bootcamp.find({
        location: {$geoWithin: { $centerSphere: [ [ lon, lat ], radius ] }}
    })

    res.status(200).json({Success: true, count: bootcamps.length, data: bootcamps})
})

// @desc:    Upload photo for bootcamp
//@route:    PUT /api/v1/bootcamps/:id/photo
//@access:   Private
exports.bootcampPhotoUpload = asyncHandler (async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    
    if(!bootcamp){
        return next(new ErrorResponce(`Bootcamp not found with id: ${req.params.id}`, 404))
    }

    if(!req.files){
        return next(new ErrorResponce(`Please upload a file`, 400))
    }

    const file = req.files.file

    //Make sure that the file is a photo
    if(!file.mimetype.startsWith('image')){
        return next(new ErrorResponce(`Please upload an image file`, 400))
    }

    //Check file size
    if(file.size > process.env.MAX_FILE_UPLOAD){
        return next(new ErrorResponce(`Please upload an image of size less than ${process.env.MAX_FILE_UPLOAD}`, 400))
    }

    // Create custom file name
    // old file.name = bootcamp.jpg *** To avoid same name of photos => change file name to a unique file name
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

    // Parameter 1: where to save the file
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async(err) => {
        if(err){
            console.console.error(err)
            return next(new ErrorResponce(
                'Problem with file upload', 500
            ))
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, {photo: file.name})

        res.status(200).json({Success: true, data: file.name})
    })
})