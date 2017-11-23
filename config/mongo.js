//Set up mongoose connection
let mongoose = require('mongoose')
mongoose.Promise = global.Promise
let mongoDB = process.env.MONGODB_URI
let promise = mongoose.connect(mongoDB, {
  useMongoClient: true
})
promise.then(function (db) {
  let database = mongoose.connection
  database.on('error', console.error.bind(console, 'MongoDB connection error:'))
  console.log("Connected to MongoDB")
  module.exports = database
})