var mongoose = require('mongoose')
var Schema = mongoose.Schema

var UserSchema = new Schema({
  id: {
    type: Number,
    unique: true
  },
  first_name: {
    type: String
  },
  last_name: {
    type: String
  },
  username: {
    type: String
  },
  token: {
    type: String
  },
  purchase_cart: {
    cart: [{
      product_id: {
        type: Number
      },
      quantity: {
        type: Number
      },
      price: {
        type: Number
      },
      name: {
        type: String
      }
    }],
    address: {
      type: String
    }
  },
})

module.exports = mongoose.model('User', UserSchema)