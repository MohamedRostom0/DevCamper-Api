const mongoose = require('mongoose')

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a course title'],
        trim: true
    },

    description: {
        type: String,
        required: [true, 'Please add a description']
    },

    weeks: {
        type: String,
        required: [true, 'Please add number of weeks']
    },

    tuition: {
        type: Number,
        required: [true, 'Please add tuition cost']
    },

    minimumSkill: {
        type: String,
        required: [true, 'Please add minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
    },

    scholarhipsAvailable:{
       type: Boolean,
       default: false 
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    bootcamp: { // Relationship with bootcamp
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp',
        required: true // a course cannot exist without a bootcamp
    },

    user: { // Relationship with bootcamp
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true // a course cannot exist without a User
    }
})

// Static method to get average course tuitions
CourseSchema.statics.getAverageCost = async function(bootcampId){
    const obj = await this.aggregate([
        {
            $match: {bootcamp: bootcampId} // Select * where bootcamp == bootcampId
        },
        {
            $group: { // All courses belong to the same bootcamp(Id) will calculate average of tuition for that bootcamp
                _id: '$bootcamp',
                averageCost: {$avg: '$tuition'}
            } 
        }
    ])

    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost: Math.ceil(obj[0].averageCost / 10) * 10
        })    
    } 
    catch (err) {
        console.log(err);
    }
}

// Call getAverageCost after save
CourseSchema.post('save', function(){
    this.constructor.getAverageCost(this.bootcamp)
})

// Call getAverageCost before remove
CourseSchema.pre('remove', function(){
    this.constructor.getAverageCost(this.bootcamp)
})

module.exports = mongoose.model('Course', CourseSchema)