const Course = require('../models/Course')
const ErrorResponce = require('../utils/errorResponce')
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');

// @desc:    Get all courses
//@route:    Get /api/v1/courses
//@route:    Get /api/v1/bootcamps/:bootcampId/courses
//@access:   Public
exports.getCourses = asyncHandler(async (req, res, next) => {
    
    if(req.params.bootcampId){ // Get courses of the bootcamp
        // No need for advanced results
        console.log(req.params.bootcampId);
        const courses = await Course.find({ bootcamp: req.params.bootcampId })

        return res.status(200).json({Success: true, count: courses.length, data: courses})
    }

    else{ // Just get all courses
        res.status(200).json(res.advancedResults)
    }

    res.status(200).json({Success: true, count: courses.length, data: courses})
})

// @desc:    Get a single course
//@route:    Get /api/v1/courses/:id
//@access:   Public
exports.getCourse = asyncHandler(async (req, res, next) => {
    let query;

    query = Course.findById(req.params.id).populate({
        path: 'bootcamp', // which field to use
        select: 'name description'
    })
    //Populate === Joining with the other Realtion

    const course = await query

    if(!course){
        return next(new ErrorResponce(`No course with id: ${req.params.id}`, 404))
    }

    res.status(200).json({Success: true, data: course})
})

// @desc:    Add a course
//@route:    Post /api/v1/bootcamps/:bootcampId/courses
//@access:   Private
exports.addCourse = asyncHandler(async (req, res, next) => {
   // Append missing data to req.body
    req.body.bootcamp = req.params.bootcampId

    const bootcamp = await Bootcamp.findById(req.params.bootcampId)

    //Make sure bootcamp of the course exists
    if(!bootcamp){
        return next(new ErrorResponce(`No bootcamp with id: ${req.params.bootcampId}`, 404))
    }

    const course = await Course.create(req.body)
    res.status(201).json({Success: true, data: course})
})

// @desc:    Update a course
//@route:    PUT /api/v1/courses/:id
//@access:   Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
    let course = await Course.findById(req.params.id)

    if(!course){
        return next(new ErrorResponce(`No course with id: ${req.params.id}`, 404))
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new : true, // To return back the new updated course
        runValidators: true
    })

    res.status(200).json({Success: true, data: course})
 })

 // @desc:    Delete a course
//@route:    DELETE /api/v1/courses/:id
//@access:   Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id)

    if(!course){
        return next(new ErrorResponce(`No course with id: ${req.params.id}`, 404))
    }

    await course.remove()

    res.status(200).json({Success: true, data: {}})
 })