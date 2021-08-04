const mongoose = require('mongoose')
const slugify = require('slugify')
const geocoder = require('../utils/geocoder')

const BootcampSchema = new mongoose.Schema({
    name : {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters long']
    },

    slug: String, //slug is an encoding of name that is URL friendly

    description: {
        type: String,
        required: [true, 'Please add a name'],
        maxlength: [500, 'Description can not be more than 500 characters long']
    },

    website: {
        type: String,
        match: [
            /^(http[s]?:\/\/(www\.)?|ftp:\/\/(www\.)?|www\.){1}([0-9A-Za-z-\.@:%_\+~#=]+)+((\.[a-zA-Z]{2,3})+)(\/(.)*)?(\?(.)*)?/g ,
            'Please enter a valid URL with HTTP or HTTPS'
        ]
    },

    phone: {
        type: String,
        maxlength: [20, 'Description can not be more than 500 characters long']
    },

    email: {
        type: String,
        match: [
            /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i ,
            'Please enter a valid Email'
        ]
    },

    address:{
        type: String,
        required: [true, 'Please add an address']
    },

    location: {  // mongoose geoJSON
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point'
        },
        coordinates: {
          type: [Number],
          index: '2dsphere'
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },

    careers: {
        type: [String], //Array of strings
        required: true,
        enum: [  // items that can be inside the array
            'Web Development',
            'Mobile Development',
            'UI/UX',
            'Data Science',
            'Business',
            'Other'
        ]
    },

    averageRating: {
        type: Number,
        min: [1, 'Must be at least 1'],
        max: [10, 'Must be no more than 10']
    },

    averageCost: Number,

    photo: {
        type: String, //name of the file,
        default: 'no-photo.jpg' // Case no photo uploaded
    },

    housing: {
        type: Boolean,
        default: false
    },

    jobAssistance: {
    type: Boolean,
    default: false
    },

    jobGuarantee: {
        type: Boolean,
        default: false
    },

    acceptGi: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
})

//Create bootcamp slug from name
BootcampSchema.pre('save', function(next) {
    this.slug = slugify(this.name, {lower: true})
    next()
})

// Geocode; create location field
BootcampSchema.pre('save', async function(next) {
    const loc = await geocoder.geocode(this.address)
    this.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].country
    }

    // Do not save address amymore
    this.address = undefined
    
    next()
})

module.exports = mongoose.model('Bootcamp', BootcampSchema)