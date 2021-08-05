const Bootcamp = require('../models/Bootcamp')
const ErrorResponce = require('../utils/errorResponce')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder')
// const { parse } = require('dotenv')

// @desc:    Get all bootcamps
//@route:    Get /api/v1/bootcamps
//@access:   Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    let query;
    const reqQuery = { ...req.query } //Copy of req.query 

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit']

    removeFields.forEach((param) => delete(reqQuery[param]))

    let queryStr = JSON.stringify(reqQuery)

    //creating operators ($gt, $lt, $in, ..etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`) //every 'match' with the regex ==> '$match'

    //Finding all resources
    query = Bootcamp.find(JSON.parse(queryStr)).populate({
        path: 'courses', // name of field
        select: 'title tuition'
    })
    
    // SELECT fields
    if(req.query.select){
        const fields = req.query.select.split(',').join(' ') // Because fields have to be like: "name age ...etc"
        query = query.select(fields)
    }

    // Sort
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ')
        query = query.sort(sortBy)
    }
    else{ // Always sorted by date unless specified not to
        query = query.sort('createdAt')
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1 //page = 1 is default
    const limit = parseInt(req.query.limit, 10) || 25 // Limit = 10 is default
    const startIndex = (page - 1) * limit // how many to skip
    const endIndex = page * limit // The index of Last document of page

    const total = await Bootcamp.countDocuments()

    query = query.skip(startIndex).limit(limit)

    // Executing query
    const bootcamps = await query

    // Pagination result; Used by frontend
    const pagination = {} // Object containing info about next and previous pages

    if(endIndex < total){
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    if(startIndex > 0){
        pagination.prev = {
            page: page - 1,
            limit
        }
    }
    
    res.status(200).json({Success: true, count: bootcamps.length, pagination,data: bootcamps})  
})

// @desc:    Get a single bootcamps
//@route:    Get /api/v1/bootcamps/:id
//@access:   Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

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