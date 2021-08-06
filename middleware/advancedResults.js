const advancedResults = (model, populate) => async(req, res, next) =>{
    let query;
    const reqQuery = { ...req.query } //Copy of req.query 

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit']

    removeFields.forEach((param) => delete(reqQuery[param]))

    let queryStr = JSON.stringify(reqQuery)

    //creating operators ($gt, $lt, $in, ..etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`) //every 'match' with the regex ==> '$match'

    //Finding all resources
    query = model.find(JSON.parse(queryStr))
    
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

    const total = await model.countDocuments()

    query = query.skip(startIndex).limit(limit)

    // Populate
    if (populate){
        query = query.populate(populate)
    }

    // Executing query
    const results = await query

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

    res.advancedResults = {
        Success: true,
        count: results.length,
        pagination,
        data: results
    }

    next()
}

module.exports = advancedResults